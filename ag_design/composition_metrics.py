"""Actual CSS-pixel measurements, separate from abstract semantic graph coordinates."""
import json
import math

from .composition_model import CompositionError, MAX_NODES, _boolean, _number, _object, _text, canonical_hash, normalize_document
from .ui_grouping import rectangle_metrics

FACT_METHOD = 'dom-client-rects-v1'


def _safe_environment(value, depth=0):
    """Retain a small JSON environment description without arbitrary objects or unbounded recursion."""
    if depth > 4:
        raise CompositionError('Environment description is too deep', 'invalid_measurements')
    if value is None or type(value) is bool:
        return value
    if type(value) is str:
        return _text(value, 512)
    if type(value) in (int, float):
        return _number(value, -1000000, 1000000)
    if type(value) is list and len(value) <= 32:
        return [_safe_environment(item, depth + 1) for item in value]
    if type(value) is dict and len(value) <= 32:
        result = {}
        for key, item in value.items():
            _text(key, 80, True)
            result[key] = _safe_environment(item, depth + 1)
        return result
    raise CompositionError('Invalid measurement environment', 'invalid_measurements')


def _rect(raw):
    """A missing rectangle is unknown; otherwise require finite CSS-pixel client bounds."""
    if raw is None:
        return None
    _object(raw, ('x', 'y', 'width', 'height'), ('x', 'y', 'width', 'height'))
    return {'x': _number(raw['x'], -1000000, 1000000), 'y': _number(raw['y'], -1000000, 1000000),
            'width': _number(raw['width'], 0, 1000000), 'height': _number(raw['height'], 0, 1000000)}


def _observation(raw, node_ids):
    """Preserve unavailable visibility and clipping as null rather than manufacturing a pass."""
    _object(raw, ('id', 'rect', 'visible', 'clipped', 'role', 'name', 'focusable', 'controls'), ('id',))
    key = _text(raw['id'], 80, True)
    if key not in node_ids:
        raise CompositionError('Unknown measurement target', 'invalid_measurements')
    result = {'id': key, 'rect': _rect(raw.get('rect'))}
    for field in ('visible', 'clipped', 'focusable'):
        value = raw.get(field)
        result[field] = None if value is None else _boolean(value)
    for field in ('role', 'name'):
        value = raw.get(field)
        result[field] = None if value is None else _text(value, 512)
    if 'controls' in raw:
        controls = raw['controls']
        if type(controls) is not list or len(controls) > 32:
            raise CompositionError('Control observation limit exceeded', 'invalid_measurements')
        result['controls'] = _safe_environment(controls)
    return result


def normalize_facts(document, raw):
    """Validate bounded caller observations without upgrading them to trusted browser execution."""
    doc = normalize_document(document)
    _object(raw, ('documentHash', 'scenarioId', 'environment', 'method', 'scope', 'complete', 'fontsReady', 'nodes', 'viewport'), ('nodes',))
    rows = raw['nodes']
    if type(rows) is not list or len(rows) > MAX_NODES:
        raise CompositionError('Measurement node limit exceeded', 'invalid_measurements')
    ids = {node['id'] for node in doc['nodes']}
    nodes = [_observation(row, ids) for row in rows]
    if len({row['id'] for row in nodes}) != len(nodes):
        raise CompositionError('Duplicate measurement target', 'invalid_measurements')
    result = {'nodes': sorted(nodes, key=lambda row: row['id'])}
    for key in ('documentHash', 'scenarioId', 'method', 'scope'):
        value = raw.get(key)
        result[key] = None if value is None else _text(value, 128)
    for key in ('complete', 'fontsReady'):
        value = raw.get(key)
        result[key] = None if value is None else _boolean(value)
    result['environment'] = _safe_environment(raw.get('environment', {}))
    if type(result['environment']) is not dict:
        raise CompositionError('Invalid measurement environment', 'invalid_measurements')
    if 'viewport' in raw:
        from .composition_model import normalize_viewport
        result['viewport'] = normalize_viewport(raw['viewport'])
    if len(json.dumps(result, ensure_ascii=False).encode()) > 256 * 1024:
        raise CompositionError('Measurement byte limit exceeded', 'invalid_measurements')
    return result


def hierarchy(document):
    """Expose explicit ancestor chains and group membership independently of visual overlap."""
    doc = normalize_document(document)
    by_id = {node['id']: node for node in doc['nodes']}
    result = []
    for node in doc['nodes']:
        ancestors = []
        parent = node['parentId']
        while parent is not None:
            ancestors.insert(0, parent)
            parent = by_id[parent]['parentId']
        result.append({'id': node['id'], 'parentId': node['parentId'], 'depth': len(ancestors), 'ancestorIds': ancestors,
                       'groupId': node['parentId'], 'groupSource': 'composition-parent', 'confidence': 'explicit'})
    return result


def _pair(document, facts, first_id, second_id):
    """Measure one explicitly selected pair, including far pairs outside local-neighbor indexes."""
    definitions = {node['id']: node for node in document['nodes']}
    if first_id not in definitions or second_id not in definitions or first_id == second_id:
        raise CompositionError('Invalid measurement pair', 'invalid_measurements')
    observations = {node['id']: node for node in facts['nodes']}
    first = observations.get(first_id)
    second = observations.get(second_id)
    result = {'nodeIds': [first_id, second_id], 'unit': 'CSS px', 'method': 'axis-aligned-client-rectangles-v1',
              'sameGroup': definitions[first_id]['parentId'] == definitions[second_id]['parentId'],
              'groupSource': 'composition-parent', 'status': 'unknown'}
    if not first or not second or first['rect'] is None or second['rect'] is None:
        return result
    a, b = first['rect'], second['rect']
    edges = rectangle_metrics(a, b)
    center_dx = b['x'] + b['width'] / 2 - a['x'] - a['width'] / 2
    center_dy = b['y'] + b['height'] / 2 - a['y'] - a['height'] / 2
    result.update(status='measured', dx=edges['dx'], dy=edges['dy'], edgeDistance=edges['distance'],
                  centerDx=center_dx, centerDy=center_dy, centerDistance=math.hypot(center_dx, center_dy),
                  intersectionArea=edges['intersectionArea'], heightDifference=abs(a['height'] - b['height']))
    # Containment is declared by the tree. Bounds alone never create a parent relationship.
    if definitions[first_id]['parentId'] == second_id:
        child, parent = a, b
    elif definitions[second_id]['parentId'] == first_id:
        child, parent = b, a
    else:
        return result
    result['padding'] = {'left': child['x'] - parent['x'], 'top': child['y'] - parent['y'],
                         'right': parent['x'] + parent['width'] - child['x'] - child['width'],
                         'bottom': parent['y'] + parent['height'] - child['y'] - child['height']}
    return result


def measure_pair(document, facts, first_id, second_id):
    """Validate and measure a requested pair; renderer coordinates must already be unscaled CSS pixels."""
    doc = normalize_document(document)
    normalized = normalize_facts(doc, facts)
    return _pair(doc, normalized, first_id, second_id)


def group_gap_statistics(rectangles, axis='x'):
    """Summarize adjacent edge gaps, not all page pairs or abstract graph distances."""
    if axis not in ('x', 'y'):
        raise CompositionError('Invalid gap axis', 'invalid_measurements')
    size = 'width' if axis == 'x' else 'height'
    ordered = sorted(rectangles, key=lambda row: (row[axis], row['y' if axis == 'x' else 'x']))
    gaps = []
    for first, second in zip(ordered, ordered[1:]):
        gaps.append(second[axis] - first[axis] - first[size])
    return {'axis': axis, 'unit': 'CSS px', 'gaps': gaps, 'minimum': min(gaps) if gaps else None,
            'maximum': max(gaps) if gaps else None, 'spread': max(gaps) - min(gaps) if gaps else None,
            'mean': sum(gaps) / len(gaps) if gaps else None, 'method': 'adjacent-edge-gaps-v1'}
