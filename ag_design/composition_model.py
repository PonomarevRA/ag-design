"""Bounded composition documents and atomic commands, independent of DOM and persistence."""
from copy import deepcopy
import hashlib
import json
import math
import re

from .errors import DesignError

MAX_NODES = 200
MAX_DEPTH = 16
MAX_CONSTRAINTS = 200
MAX_OPERATIONS = 100
ID = re.compile(r'[A-Za-z0-9_.:-]{1,80}')
LAYOUT_DEFAULTS = {'mode': 'column', 'x': 0, 'y': 0, 'width': 'fill', 'height': 'hug',
                   'minWidth': 0, 'minHeight': 0, 'maxWidth': 10000, 'maxHeight': 10000,
                   'gap': 8, 'padding': 0, 'align': 'start', 'columns': 2}


class CompositionError(DesignError):
    """Expose a safe contract error without echoing untrusted document contents."""

    def __init__(self, message='Invalid composition document', code='invalid_composition', status=422):
        super().__init__(code, message, status)
        self.details = {}


def _object(value, allowed, required=()):
    """Reject ambiguous or unsupported keys before normalization."""
    if type(value) is not dict or set(value) - set(allowed) or set(required) - set(value):
        raise CompositionError()
    return value


def _number(value, minimum=0, maximum=10000, integer=False):
    """Accept only finite JSON numbers; booleans cannot stand in for measurements."""
    if type(value) not in (int, float) or type(value) is float and not math.isfinite(value):
        raise CompositionError()
    if value < minimum or value > maximum or integer and type(value) is not int:
        raise CompositionError()
    return value


def _text(value, maximum=180, identifier=False):
    """Validate bounded text or stable opaque IDs without coercion."""
    if type(value) is not str or len(value) > maximum or any(0xD800 <= ord(c) <= 0xDFFF for c in value):
        raise CompositionError()
    if identifier and not ID.fullmatch(value):
        raise CompositionError()
    return value


def _enum(value, choices):
    """Keep public enums explicit rather than silently substituting defaults."""
    if type(value) is not str or value not in choices:
        raise CompositionError()
    return value


def _boolean(value):
    """Require an observed boolean instead of JSON truthiness."""
    if type(value) is not bool:
        raise CompositionError()
    return value


def _props(raw):
    """Copy a small scalar props object; nested executable or prototype values are excluded."""
    if type(raw) is not dict or len(raw) > 16:
        raise CompositionError()
    result = {}
    for key, value in raw.items():
        if type(key) is not str or not re.fullmatch(r'[A-Za-z][A-Za-z0-9]{0,39}', key):
            raise CompositionError()
        if key in ('constructor', 'prototype', '__proto__'):
            raise CompositionError()
        if type(value) is str:
            _text(value, 4096)
        elif type(value) is bool:
            pass
        else:
            _number(value, -10000)
        result[key] = value
    return result


def normalize_viewport(raw):
    """Normalize real viewport CSS dimensions separately from editor camera zoom."""
    _object(raw, ('width', 'height', 'direction', 'textScale'), ('width', 'height'))
    return {'width': _number(raw['width'], 240, 4096, True),
            'height': _number(raw['height'], 200, 4096, True),
            'direction': _enum(raw.get('direction', 'ltr'), ('ltr', 'rtl')),
            'textScale': _number(raw.get('textScale', 1), 1, 3)}


def _layout(raw):
    """Bound supported layout properties and preserve independent min/max constraints."""
    _object(raw, LAYOUT_DEFAULTS)
    result = {**LAYOUT_DEFAULTS, **raw}
    _enum(result['mode'], ('free', 'row', 'column', 'grid'))
    _enum(result['align'], ('start', 'center', 'end', 'stretch'))
    for key in ('x', 'y'):
        _number(result[key], -10000)
    for key in ('width', 'height'):
        value = result[key]
        if type(value) is str:
            _enum(value, ('fill', 'hug'))
        else:
            _number(value)
    for key in ('minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'gap', 'padding'):
        _number(result[key])
    _number(result['columns'], 1, 12, True)
    if result['minWidth'] > result['maxWidth'] or result['minHeight'] > result['maxHeight']:
        raise CompositionError()
    return result


def _node(raw, known_components):
    """Normalize one instance without deriving semantic parentage from rectangles."""
    _object(raw, ('id', 'parentId', 'kind', 'title', 'component', 'props', 'layout', 'intentionalOverlay'), ('id', 'kind'))
    kind = _enum(raw['kind'], ('frame', 'component'))
    parent = raw.get('parentId')
    if parent is not None:
        _text(parent, 80, True)
    component = raw.get('component')
    if kind == 'component':
        _text(component, 80, True)
        if known_components is not None and component not in known_components:
            raise CompositionError('Unknown composition component', 'unknown_component')
    elif component is not None:
        raise CompositionError()
    return {'id': _text(raw['id'], 80, True), 'parentId': parent, 'kind': kind,
            'title': _text(raw.get('title', '')), 'component': component,
            'props': _props(raw.get('props', {})), 'layout': _layout(raw.get('layout', {})),
            'intentionalOverlay': _boolean(raw.get('intentionalOverlay', False))}


def _validate_tree(nodes):
    """Reject cycles, missing parents and children attached to leaf components."""
    by_id = {node['id']: node for node in nodes}
    if len(by_id) != len(nodes):
        raise CompositionError('Duplicate composition node', 'duplicate_node')
    for node in nodes:
        visited = {node['id']}
        parent = node['parentId']
        while parent is not None:
            if parent in visited:
                raise CompositionError('Cyclic composition tree', 'cyclic_composition')
            if parent not in by_id or by_id[parent]['kind'] != 'frame':
                raise CompositionError('Invalid composition parent', 'invalid_parent')
            visited.add(parent)
            if len(visited) > MAX_DEPTH:
                raise CompositionError('Composition nesting limit exceeded', 'composition_limit')
            parent = by_id[parent]['parentId']


def _constraint(raw, node_ids):
    """Validate explicit comparison targets so unrelated controls are never forced into a family."""
    _object(raw, ('id', 'type', 'nodeIds', 'axis', 'target', 'tolerance', 'required'), ('id', 'type', 'nodeIds'))
    kind = _enum(raw['type'], ('align', 'equal-height', 'gap', 'required'))
    ids = raw['nodeIds']
    if type(ids) is not list or not 1 <= len(ids) <= MAX_NODES:
        raise CompositionError()
    if any(type(key) is not str or key not in node_ids for key in ids) or len(set(ids)) != len(ids):
        raise CompositionError('Unknown constraint target', 'invalid_constraint')
    if kind != 'required' and len(ids) < 2:
        raise CompositionError('Comparison requires multiple nodes', 'invalid_constraint')
    axis = raw.get('axis', 'left' if kind == 'align' else 'x')
    _enum(axis, ('left', 'right', 'center', 'top', 'bottom', 'middle', 'start', 'end', 'x', 'y'))
    if kind == 'gap' and axis not in ('x', 'y') or kind == 'align' and axis in ('x', 'y'):
        raise CompositionError('Invalid constraint axis', 'invalid_constraint')
    result = {'id': _text(raw['id'], 80, True), 'type': kind, 'nodeIds': list(ids),
              'axis': axis, 'tolerance': _number(raw.get('tolerance', 1), 0, 8),
              'required': _boolean(raw.get('required', True))}
    if 'target' in raw:
        result['target'] = _number(raw['target'], -10000)
    return result


def migrate_v1(raw):
    """Translate the old twelve-column/24px-row document without discarding instance identities."""
    _object(raw, ('version', 'width', 'items'), ('version', 'width', 'items'))
    if type(raw['version']) is not int or raw['version'] != 1:
        raise CompositionError('Unsupported composition version', 'unsupported_composition')
    width = _number(raw['width'], 320, 1600, True)
    if type(raw['items']) is not list or len(raw['items']) > 40:
        raise CompositionError()
    nodes = []
    for item in raw['items']:
        _object(item, ('id', 'component', 'title', 'x', 'y', 'w', 'h', 'props'), ('id', 'component', 'title', 'x', 'y', 'w', 'h', 'props'))
        x = _number(item['x'], 0, 11, True)
        y = _number(item['y'], 0, 300, True)
        w = _number(item['w'], 1, 12 - x, True)
        h = _number(item['h'], 2, 40, True)
        nodes.append({'id': item['id'], 'parentId': None, 'kind': 'component', 'component': item['component'],
                      'title': item['title'], 'props': item['props'],
                      'layout': {'mode': 'free', 'x': x * width / 12, 'y': y * 24, 'width': w * width / 12, 'height': h * 24}})
    return {'version': 2, 'title': 'Imported sandbox', 'viewport': {'width': width, 'height': 800}, 'nodes': nodes}


def normalize_document(raw, known_components=None):
    """Return canonical v2 data or reject the entire input; unknown keys are never silently lost."""
    if type(raw) is dict and type(raw.get('version')) is int and raw['version'] == 1:
        raw = migrate_v1(raw)
    _object(raw, ('version', 'title', 'viewport', 'nodes', 'constraints', 'componentPins', 'scenarios'), ('version', 'viewport', 'nodes'))
    if type(raw['version']) is not int or raw['version'] != 2:
        raise CompositionError('Unsupported composition version', 'unsupported_composition')
    if type(raw['nodes']) is not list or len(raw['nodes']) > MAX_NODES:
        raise CompositionError('Composition node limit exceeded', 'composition_limit')
    nodes = [_node(node, known_components) for node in raw['nodes']]
    _validate_tree(nodes)
    raw_constraints = raw.get('constraints', [])
    if type(raw_constraints) is not list or len(raw_constraints) > MAX_CONSTRAINTS:
        raise CompositionError()
    constraints = [_constraint(row, {node['id'] for node in nodes}) for row in raw_constraints]
    if len({row['id'] for row in constraints}) != len(constraints):
        raise CompositionError('Duplicate constraint ID', 'invalid_constraint')
    pins = raw.get('componentPins', {})
    if type(pins) is not dict or len(pins) > MAX_NODES:
        raise CompositionError()
    normalized_pins = {}
    for component, pin in pins.items():
        _text(component, 80, True)
        _object(pin, ('version', 'artifactHash'), ('version', 'artifactHash'))
        version = _text(pin['version'], 80)
        digest = _text(pin['artifactHash'], 128)
        if not version or not re.fullmatch(r'[a-fA-F0-9]{64}', digest):
            raise CompositionError('Invalid component artifact pin', 'invalid_component_pin')
        normalized_pins[component] = {'version': version, 'artifactHash': digest.lower()}
    scenarios = raw.get('scenarios', [])
    if type(scenarios) is not list or len(scenarios) > 12:
        raise CompositionError()
    normalized_scenarios = []
    for row in scenarios:
        _object(row, ('id', 'viewport'), ('id', 'viewport'))
        normalized_scenarios.append({'id': _text(row['id'], 80, True), 'viewport': normalize_viewport(row['viewport'])})
    if len({row['id'] for row in normalized_scenarios}) != len(normalized_scenarios):
        raise CompositionError('Duplicate scenario ID', 'invalid_scenario')
    result = {'version': 2, 'title': _text(raw.get('title', 'Composition')), 'viewport': normalize_viewport(raw['viewport']),
              'nodes': nodes, 'constraints': constraints, 'componentPins': normalized_pins, 'scenarios': normalized_scenarios}
    if len(json.dumps(result, ensure_ascii=False).encode()) > 256 * 1024:
        raise CompositionError('Composition byte limit exceeded', 'composition_limit')
    return result


def canonical_hash(value):
    """Hash finite canonical JSON so object key order cannot change artifact identity."""
    try:
        encoded = json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()
    except (TypeError, ValueError, UnicodeError) as error:
        raise CompositionError() from error
    return hashlib.sha256(encoded).hexdigest()


def document_hash(document):
    """Bind a document identity to its normalized content, not a revision or editor selection."""
    return canonical_hash(normalize_document(document))


def apply_operations(document, operations, known_components=None):
    """Validate a complete command batch before publishing any change; callers own CAS and history."""
    candidate = deepcopy(normalize_document(document, known_components))
    if type(operations) is not list or not 1 <= len(operations) <= MAX_OPERATIONS:
        raise CompositionError('Invalid composition operations', 'invalid_operations')
    for operation in operations:
        if type(operation) is not dict:
            raise CompositionError('Invalid composition operation', 'invalid_operations')
        kind = operation.get('op')
        if kind == 'add':
            _object(operation, ('op', 'node'), ('op', 'node'))
            candidate['nodes'].append(deepcopy(operation['node']))
        elif kind in ('update', 'remove'):
            allowed = ('op', 'id', 'changes') if kind == 'update' else ('op', 'id')
            _object(operation, allowed, allowed)
            target = next((node for node in candidate['nodes'] if node['id'] == operation['id']), None)
            if target is None:
                raise CompositionError('Composition node not found', 'node_not_found', 404)
            if kind == 'remove':
                candidate['nodes'].remove(target)
            else:
                changes = operation['changes']
                _object(changes, ('parentId', 'kind', 'title', 'component', 'props', 'layout', 'intentionalOverlay'))
                for key, value in changes.items():
                    if key in ('layout', 'props'):
                        if type(value) is not dict:
                            raise CompositionError()
                        target[key] = {**target[key], **deepcopy(value)}
                    else:
                        target[key] = deepcopy(value)
        elif kind == 'reorder':
            _object(operation, ('op', 'id', 'beforeId'), ('op', 'id', 'beforeId'))
            target = next((node for node in candidate['nodes'] if node['id'] == operation['id']), None)
            before = next((node for node in candidate['nodes'] if node['id'] == operation['beforeId']), None)
            if target is None or operation['beforeId'] is not None and before is None:
                raise CompositionError('Composition node not found', 'node_not_found', 404)
            if before is target or before is not None and before['parentId'] != target['parentId']:
                raise CompositionError('Reorder requires distinct siblings', 'invalid_operations')
            # Reordering cannot change hierarchy, pinned identities or another group's children.
            candidate['nodes'].remove(target)
            if before is not None:
                position = candidate['nodes'].index(before)
            else:
                positions = [index for index, node in enumerate(candidate['nodes']) if node['parentId'] == target['parentId']]
                position = max(positions, default=-1) + 1
            candidate['nodes'].insert(position, target)
        elif kind == 'viewport':
            _object(operation, ('op', 'changes'), ('op', 'changes'))
            if type(operation['changes']) is not dict:
                raise CompositionError()
            candidate['viewport'] = {**candidate['viewport'], **deepcopy(operation['changes'])}
        elif kind == 'constraints':
            _object(operation, ('op', 'constraints'), ('op', 'constraints'))
            candidate['constraints'] = deepcopy(operation['constraints'])
        else:
            raise CompositionError('Unsupported composition operation', 'invalid_operations')
    return normalize_document(candidate, known_components)
