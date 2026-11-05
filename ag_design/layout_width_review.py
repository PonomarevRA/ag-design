"""Validate redacted width evidence and require the same declared targets in four real scenarios."""

from .errors import DesignError
from .validation import identifier, object_fields, finite_number, text

SCENARIOS = ('normal', 'narrow', 'text200', 'narrow-text200')
RULES = ('layout-width-integrity', 'layout-width-scenarios')


def _number(value, field, *, nullable=False, minimum=0, maximum=1000000):
    """Accept finite bounded CSS measurements; missing geometry stays unknown."""
    if nullable and value is None:
        return None
    finite_number(value, field)
    if not minimum <= value <= maximum:
        raise DesignError('invalid_width_review', f'Out of range {field}', 422)
    return value


def _target(value):
    """Recompute width status from facts; submitted pass/deficit labels never override geometry."""
    object_fields(value, {'id', 'source', 'mode', 'width', 'availableWidth', 'fontSize', 'minEm', 'hidden', 'status', 'deficitPx', 'reason'},
                  {'id', 'source', 'mode', 'width', 'availableWidth', 'fontSize', 'minEm', 'hidden'})
    key = identifier(value['id'], 'elementId')
    if value['source'] not in ('declared', 'inferred') or value['mode'] not in ('fill', 'content', None) or type(value['hidden']) is not bool:
        raise DesignError('invalid_width_review', 'Invalid width declaration', 422)
    width = _number(value['width'], 'width', nullable=True)
    available = _number(value['availableWidth'], 'availableWidth', nullable=True)
    font = _number(value['fontSize'], 'fontSize', nullable=True, maximum=1000)
    minimum_em = _number(value['minEm'], 'minEm', nullable=True, maximum=100)
    if value['hidden']:
        return key, {'status': 'not-applicable', 'reason': 'hidden', 'fontSize': font, 'mode': value['mode'], 'minEm': minimum_em, 'deficitPx': None}
    # An inferred purpose, unsupported slot or an invalid declaration is not a measurement.
    if value['source'] != 'declared' or value['mode'] is None or width is None or not available or not font or minimum_em is None or minimum_em < .5:
        return key, {'status': 'unknown', 'reason': 'unmeasurable-or-undeclared', 'fontSize': font, 'mode': value['mode'], 'minEm': minimum_em, 'deficitPx': None}
    minimum = available if value['mode'] == 'fill' else min(minimum_em * font, available)
    deficit = max(0, minimum - width)
    return key, {'status': 'fail' if deficit > 1 else 'pass', 'reason': 'width-deficit' if deficit > 1 else 'measured', 'fontSize': font, 'mode': value['mode'], 'minEm': minimum_em, 'deficitPx': deficit}


def _sample(value):
    """Index one bounded report and preserve its immutable artifact/scenario address."""
    object_fields(value, {'scenarioId', 'revision', 'report'}, {'scenarioId', 'revision', 'report'})
    if value['scenarioId'] not in SCENARIOS:
        raise DesignError('invalid_width_review', 'Unknown width scenario', 422)
    identifier(value['revision'], 'revision')
    report = value['report']
    object_fields(report, {'schemaVersion', 'targets', 'coverage', 'geometryGate', 'inspectedNodes', 'truncated', 'environment', 'manualRequired', 'trust'},
                  {'schemaVersion', 'targets', 'truncated', 'environment'})
    if report['schemaVersion'] != 'ag-design/width-audit-v1' or type(report['truncated']) is not bool:
        raise DesignError('invalid_width_review', 'Invalid width audit version/coverage', 422)
    environment = report['environment']
    object_fields(environment, {'viewportWidth', 'scopeWidth'}, {'viewportWidth', 'scopeWidth'})
    viewport = _number(environment['viewportWidth'], 'viewportWidth', minimum=1)
    _number(environment['scopeWidth'], 'scopeWidth', nullable=True)
    if not isinstance(report['targets'], list) or len(report['targets']) > 64:
        raise DesignError('invalid_width_review', 'Expected at most64width targets', 422)
    targets = {}
    for target in report['targets']:
        key, facts = _target(target)
        if key in targets:
            raise DesignError('invalid_width_review', 'Duplicate measured width target', 422)
        targets[key] = facts
    return {'revision': value['revision'], 'targets': targets, 'viewport': viewport, 'truncated': report['truncated']}


def evaluate_width_review(value, *, revision=None, required_blocks=()):
    """Return unchecked block/element/scenario addresses; absent/stale/unproven text scaling cannot pass."""
    if value is None:
        return {'gate': 'unknown', 'cases': [], 'unchecked': [], 'missingReview': True, 'maxDeficitPx': None, 'missingCases': 1}
    object_fields(value, {'revision', 'blocks', 'exclusions'}, {'revision', 'blocks'})
    current_revision = identifier(value['revision'], 'revision')
    if not isinstance(value['blocks'], list) or not 1 <= len(value['blocks']) <= 8:
        raise DesignError('invalid_width_review', 'Expected1..8width blocks', 422)
    exclusions = value.get('exclusions', [])
    if not isinstance(exclusions, list) or len(exclusions) > 32:
        raise DesignError('invalid_width_review', 'Expected at most32nonvisual exclusions', 422)
    excluded = set()
    for entry in exclusions:
        object_fields(entry, {'blockId', 'reason'}, {'blockId', 'reason'})
        key = identifier(entry['blockId'], 'blockId')
        text(entry['reason'], 'reason', 512)
        if key in excluded:
            raise DesignError('invalid_width_review', 'Duplicate width exclusion', 422)
        excluded.add(key)
    cases, unchecked = [], []
    seen_blocks = set()
    max_deficit = None
    for block in value['blocks']:
        object_fields(block, {'blockId', 'targets', 'samples'}, {'blockId', 'targets', 'samples'})
        block_id = identifier(block['blockId'], 'blockId')
        if block_id in seen_blocks or block_id in excluded:
            raise DesignError('invalid_width_review', 'Duplicate width block', 422)
        seen_blocks.add(block_id)
        if not isinstance(block['targets'], list) or not 1 <= len(block['targets']) <= 32:
            raise DesignError('invalid_width_review', 'Expected1..32expected targets', 422)
        targets = [identifier(key, 'elementId') for key in block['targets']]
        if len(set(targets)) != len(targets):
            raise DesignError('invalid_width_review', 'Duplicate expected width target', 422)
        if not isinstance(block['samples'], list) or len(block['samples']) > 4:
            raise DesignError('invalid_width_review', 'Expected at most4width scenarios', 422)
        samples = {}
        for sample in block['samples']:
            scenario = sample.get('scenarioId') if isinstance(sample, dict) else None
            if not isinstance(scenario, str):
                raise DesignError('invalid_width_review', 'Width scenario must be a string', 422)
            if scenario in samples:
                raise DesignError('invalid_width_review', 'Duplicate width scenario', 422)
            measured = _sample(sample)
            samples[scenario] = measured
            for key in measured['targets']:
                if key not in targets:
                    targets.append(key)  # Discovered but omitted targets cannot disappear from completion coverage.
        if len(cases) + len(targets) * 4 > 128:
            raise DesignError('invalid_width_review', 'Width coverage exceeds128cases; partition explicit scopes', 422)
        baseline = samples.get('normal', {}).get('targets', {})
        for scenario in SCENARIOS:
            sample = samples.get(scenario)
            for key in targets:
                row = {'blockId': block_id, 'elementId': key, 'scenarioId': scenario, 'status': 'unknown', 'reason': 'missing'}
                if sample is not None:
                    fact = sample['targets'].get(key)
                    if sample['revision'] != current_revision or (revision is not None and revision != current_revision):
                        row['reason'] = 'stale'
                    elif sample['truncated']:
                        row['reason'] = 'truncated'
                    elif scenario in ('narrow', 'narrow-text200') and sample['viewport'] > 320:
                        row['reason'] = 'narrow-viewport-not-demonstrated'
                    elif fact is not None:
                        row.update(fact)
                        original = baseline.get(key)
                        if scenario != 'normal' and original and (original['mode'], original['minEm']) != (fact['mode'], fact['minEm']):
                            row.update(status='unknown', reason='declaration-changed')
                        if fact['deficitPx'] is not None:
                            max_deficit = max(max_deficit or 0, fact['deficitPx'])
                        if scenario in ('text200', 'narrow-text200') and row['status'] == 'pass':
                            before = baseline.get(key, {}).get('fontSize')
                            if not before or not fact['fontSize'] or fact['fontSize'] < before * 1.99:
                                row.update(status='unknown', reason='enlarged-text-not-demonstrated')
                cases.append(row)
                if row['status'] == 'unknown':
                    unchecked.append(row)
    for block_id in sorted(set(required_blocks) - seen_blocks - excluded):
        identifier(block_id, 'blockId')
        if len(cases) + 4 > 128:
            raise DesignError('invalid_width_review', 'Width coverage exceeds128cases', 422)
        for scenario in SCENARIOS:
            row = {'blockId': block_id, 'elementId': 'width-inventory', 'scenarioId': scenario, 'status': 'unknown', 'reason': 'missing-block'}
            cases.append(row)
            unchecked.append(row)
    failed = any(row['status'] == 'fail' for row in cases)
    # All-hidden samples are not evidence of a working visible component.
    visible_scenarios = {(row['blockId'], row['scenarioId']) for row in cases if row['status'] == 'pass'}
    all_measured = len(visible_scenarios) == len(seen_blocks) * 4
    gate = 'fail' if failed else 'unknown' if unchecked or not all_measured else 'pass'
    return {'gate': gate, 'cases': cases, 'unchecked': unchecked, 'missingReview': False,
            'maxDeficitPx': max_deficit, 'missingCases': len(unchecked) + (0 if all_measured else 1),
            'exclusions': exclusions,
            'trust': 'caller-reported numeric geometry; not browser attestation or AT qualification'}


def width_requirements(observations, review):
    """Replace only owned width rules with server-derived results; manual pass cannot bypass missing samples."""
    # Validate duplicate caller rules in the normal requirement evaluator before using this adapter.
    result = [row for row in observations if row.get('ruleId') not in RULES]
    measured = review['maxDeficitPx']
    integrity = 'fail' if measured is not None and measured > 1 else 'unknown' if measured is None else 'pass'
    for key, status, number, unit in (
        (RULES[0], integrity, measured, 'CSS px'),
        (RULES[1], 'pass' if review['gate'] == 'pass' else 'fail' if review['gate'] == 'fail' else 'unknown', review['missingCases'], 'cases'),
    ):
        row = {'ruleId': key, 'status': status, 'evidence': 'Server-derived layoutWidthReview; inspect cases/unchecked and exact revision. Missing review, unsupported geometry and unproven viewport/font scaling remain unknown.'}
        if number is not None and status != 'unknown':
            row['measurement'] = {'value': number, 'unit': unit}
        result.append(row)
    return result
