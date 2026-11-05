"""Pure deterministic geometry checks with explicit coverage and no qualification attestation."""
from .composition_model import canonical_hash, document_hash, normalize_document
from .composition_metrics import FACT_METHOD, group_gap_statistics, hierarchy, normalize_facts
from .ui_grouping import rectangle_metrics

METHOD_VERSION = 'ag-composition-evaluation-v1'
MAX_PAIR_CHECKS = 400
POLICY = {'id': 'ag-composition-geometry-v1', 'version': 1, 'alignmentTolerance': 1,
          'scope': 'declared-composition-geometry', 'certification': False}


def _check(key, rule, ids, status, *, required=True, measured=None, expected=None, tolerance=None, reason=''):
    """Give each occurrence a stable identity independent of measurement value or iteration order."""
    return {'id': key, 'ruleId': rule, 'nodeIds': list(ids), 'status': status, 'required': required,
            'measured': measured, 'expected': expected, 'tolerance': tolerance,
            'unit': 'CSS px²' if rule == 'overlap' else 'CSS px' if measured is not None and rule not in ('required', 'presence') else None,
            'method': METHOD_VERSION, 'evidence': reason}


def _binding_checks(document, facts):
    """Do not mix one revision, viewport or incomplete renderer with another artifact's pass."""
    checks = []
    bindings = {
        'document': facts['documentHash'] == document_hash(document),
        'method': facts['method'] == FACT_METHOD and facts['scope'] == 'composition',
        'environment': bool(facts['environment']),
        'complete': facts['complete'] is True,
        'fonts': facts['fontsReady'] is True,
    }
    expected_viewport = document['viewport']
    scenarios = {row['id']: row for row in document['scenarios']}
    if scenarios:
        selected = scenarios.get(facts['scenarioId'])
        bindings['scenario'] = selected is not None
        if selected:
            expected_viewport = selected['viewport']
    bindings['viewport'] = facts.get('viewport') == expected_viewport
    for key, passed in bindings.items():
        checks.append(_check('evidence:' + key, 'evidence', [], 'pass' if passed else 'unknown',
                             reason='Bound renderer evidence.' if passed else 'Missing or mismatched ' + key + ' evidence.'))
    # An observed defect can survive an incomplete capture, but never a stale artifact or coordinate system.
    usable_geometry = bindings['document'] and bindings['method'] and bindings['viewport']
    complete = all(bindings.values())
    return checks, usable_geometry, complete


def _constraint_check(constraint, observations, direction, usable_geometry, complete):
    """Measure only declared comparable targets and preserve known failures on partial snapshots."""
    ids = constraint['nodeIds']
    rows = [observations.get(key) for key in ids]
    kind = constraint['type']
    reason = 'Declared composition constraint; observed CSS client bounds.'
    measured = None
    expected = constraint.get('target', 0)
    tolerance = constraint['tolerance']
    status = 'unknown'
    if usable_geometry and kind == 'required':
        hidden = any(row is not None and row['visible'] is False for row in rows)
        known = all(row is not None and row['visible'] is True and row['rect'] is not None for row in rows)
        status = 'fail' if hidden or complete and not known else 'pass' if known and complete else 'unknown'
        measured = sum(row is not None and row['visible'] is True for row in rows)
        expected = len(ids)
    elif usable_geometry and all(row and row['rect'] is not None and row['visible'] is True for row in rows):
        rects = [row['rect'] for row in rows]
        if kind == 'align':
            axis = constraint['axis']
            if axis in ('start', 'end'):
                axis = ('left' if direction == 'ltr' else 'right') if axis == 'start' else ('right' if direction == 'ltr' else 'left')
            anchors = []
            for rect in rects:
                values = {'left': rect['x'], 'right': rect['x'] + rect['width'], 'center': rect['x'] + rect['width'] / 2,
                          'top': rect['y'], 'bottom': rect['y'] + rect['height'], 'middle': rect['y'] + rect['height'] / 2}
                anchors.append(values[axis])
            measured = max(abs(value - constraint['target']) for value in anchors) if 'target' in constraint else max(anchors) - min(anchors)
            expected = 0
        elif kind == 'equal-height':
            heights = [rect['height'] for rect in rects]
            measured = max(heights) - min(heights)
            expected = 0
        else:
            statistics = group_gap_statistics(rects, constraint['axis'])
            gaps = statistics['gaps']
            measured = max(abs(value - constraint['target']) for value in gaps) if 'target' in constraint else statistics['spread']
            expected = constraint.get('target', 'equal adjacent gaps')
        failed = measured > tolerance
        status = 'fail' if failed else 'pass' if complete else 'unknown'
    if status == 'unknown':
        reason = 'Required targets or stable complete CSS measurements are unavailable.'
    return _check('constraint:' + constraint['id'], kind, ids, status, required=constraint['required'],
                  measured=measured, expected=expected, tolerance=tolerance, reason=reason)


def _structure_checks(document, observations, usable_geometry, complete):
    """Detect clipping and unexpected sibling intersections; declared ancestry is never an overlap defect."""
    checks = []
    observed = all(node['id'] in observations for node in document['nodes'])
    checks.append(_check('structure:presence', 'presence', [node['id'] for node in document['nodes']],
                         'pass' if complete and observed and document['nodes'] else 'unknown',
                         reason='Every declared node needs an observation; empty captures cannot qualify.'))
    for node in document['nodes']:
        row = observations.get(node['id'])
        status = 'unknown'
        if usable_geometry and row and row['visible'] is True:
            status = 'fail' if row['clipped'] is True else 'pass' if row['clipped'] is False and complete else 'unknown'
        checks.append(_check('clipping:' + node['id'], 'clipping', [node['id']], status,
                             reason='Renderer-reported instance or frame clipping; hidden or unobserved nodes remain unknown.'))
    siblings = {}
    for node in document['nodes']:
        siblings.setdefault(node['parentId'], []).append(node)
    pairs = []
    for nodes in siblings.values():
        ordered = sorted(nodes, key=lambda node: node['id'])
        for index, first in enumerate(ordered):
            for second in ordered[index + 1:]:
                if not first['intentionalOverlay'] and not second['intentionalOverlay']:
                    pairs.append((first['id'], second['id']))
    pairs.sort()
    for first_id, second_id in pairs[:MAX_PAIR_CHECKS]:
        a, b = observations.get(first_id), observations.get(second_id)
        status, area = 'unknown', None
        if usable_geometry and a and b and a['rect'] is not None and b['rect'] is not None:
            if a['visible'] is True and b['visible'] is True:
                area = rectangle_metrics(a['rect'], b['rect'])['intersectionArea']
                status = 'fail' if area > 0 else 'pass' if complete else 'unknown'
        pair_id = canonical_hash([first_id, second_id])
        checks.append(_check('overlap:' + pair_id, 'overlap', [first_id, second_id], status,
                             measured=area, expected=0,
                             reason='Bounded declared sibling pair; ancestry and intentional overlays excluded.'))
    if len(pairs) > MAX_PAIR_CHECKS:
        checks.append(_check('overlap:coverage-limit', 'overlap-coverage', [], 'unknown',
                             reason=f'Sibling pair limit {MAX_PAIR_CHECKS} reached; {len(pairs) - MAX_PAIR_CHECKS} pairs unmeasured.'))
    return checks


def _metrics(document, observations):
    """Publish bounded per-declared-group diagnostics without asserting inferred semantic membership."""
    groups = {}
    for node in document['nodes']:
        row = observations.get(node['id'])
        if row and row['rect'] and row['visible'] is True:
            groups.setdefault(node['parentId'], []).append((node['id'], row['rect']))
    result = []
    for parent, pairs in groups.items():
        rects = [pair[1] for pair in pairs]
        heights = [rect['height'] for rect in rects]
        result.append({'groupId': parent, 'source': 'composition-parent', 'confidence': 'explicit',
                       'nodeIds': [pair[0] for pair in pairs], 'heightMinimum': min(heights), 'heightMaximum': max(heights),
                       'heightSpread': max(heights) - min(heights),
                       'horizontalGaps': group_gap_statistics(rects, 'x'), 'verticalGaps': group_gap_statistics(rects, 'y')})
    return {'hierarchy': hierarchy(document), 'groups': result, 'coordinates': 'actual CSS client rectangles',
            'inferredGrouping': {'status': 'advisory', 'method': 'not-used-for-required-checks'}}


def evaluate_composition(document, facts, policy=None):
    """Score identical facts identically; this local result never attests host behaviour or full accessibility."""
    doc = normalize_document(document)
    observed = normalize_facts(doc, facts)
    checks, usable_geometry, complete = _binding_checks(doc, observed)
    observations = {row['id']: row for row in observed['nodes']}
    checks.extend(_structure_checks(doc, observations, usable_geometry, complete))
    direction = observed.get('viewport', doc['viewport'])['direction']
    for constraint in doc['constraints']:
        checks.append(_constraint_check(constraint, observations, direction, usable_geometry, complete))
    if not any(row['required'] for row in doc['constraints']):
        checks.append(_check('constraints:required', 'required-scope', [], 'unknown',
                             reason='A required comparison or required action baseline has not been declared.'))
    checks.sort(key=lambda row: row['id'])
    required = [row for row in checks if row['required']]
    failed = any(row['status'] == 'fail' for row in required)
    unknown = sum(row['status'] == 'unknown' for row in required)
    gate = 'fail' if failed else 'unknown' if unknown else 'pass'
    evaluated = sum(row['status'] != 'unknown' for row in checks)
    # Worst-domain scoring cannot be improved by adding many trivial passing instances.
    domains = {}
    for row in required:
        if row['status'] != 'unknown':
            domains.setdefault(row['ruleId'], []).append(0 if row['status'] == 'fail' else 100)
    scores = {key: min(values) for key, values in sorted(domains.items())}
    score = min(scores.values()) if scores else None
    findings = []
    for row in checks:
        if row['status'] != 'pass':
            findings.append({**row, 'occurrenceId': canonical_hash({'ruleId': row['ruleId'], 'checkId': row['id'], 'nodeIds': row['nodeIds']}),
                             'severity': 'error' if row['status'] == 'fail' and row['required'] else 'warning',
                             'suggestion': 'Inspect declared targets and rerun the same scenario after correction.'})
    return {'methodVersion': METHOD_VERSION, 'policy': dict(POLICY),
            'policyHash': policy.get('policyHash') if type(policy) is dict and policy.get('policyHash') else canonical_hash(POLICY),
            'documentHash': document_hash(doc), 'factsHash': canonical_hash(observed), 'scenarioId': observed['scenarioId'],
            'environment': observed['environment'], 'viewport': observed.get('viewport'),
            'scenarioHash': canonical_hash({'scenarios': doc['scenarios'], 'scenarioId': observed['scenarioId'], 'viewport': observed.get('viewport')}),
            'checks': checks, 'findings': findings, 'score': score, 'scores': scores,
            'gate': {'status': gate, 'required': len(required), 'total': len(checks)},
            'coverage': {'status': 'complete' if evaluated == len(checks) else 'partial', 'evaluated': evaluated,
                         'total': len(checks), 'unknown': len(checks) - evaluated, 'ratio': evaluated / len(checks) if checks else 0},
            'metrics': _metrics(doc, observations), 'provenance': 'caller-reported', 'qualification': False,
            'limitations': ['Only declared composition geometry is checked.',
                            'Keyboard, assistive technology, rendered color and target integration require separate evidence.',
                            'A caller-supplied snapshot is not trusted browser execution.']}
