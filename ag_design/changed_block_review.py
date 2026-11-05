"""Reconcile a bounded review inventory against revision-bound caller evidence."""

from .errors import DesignError
from .validation import identifier, object_fields, text

MAX_CASES = 128
ADDRESS = ('blockId', 'elementId', 'scenarioId', 'checkId')


def _index(rows, *, observed):
    """Index by semantic address so duplicates cannot hide uncovered cases."""
    if not isinstance(rows, list) or len(rows) > MAX_CASES:
        raise DesignError('invalid_evaluation', f'Expected at most {MAX_CASES} review cases', 422)
    allowed = set(ADDRESS)
    if observed:
        allowed.update(('revision', 'status', 'evidence'))
    result = {}
    for row in rows:
        object_fields(row, allowed, allowed)
        key = tuple(identifier(row[field], field) for field in ADDRESS)
        if key in result:
            raise DesignError('invalid_evaluation', 'Duplicate changed-block review case', 422)
        if observed:
            identifier(row['revision'], 'revision')
            if row['status'] not in ('pass', 'fail', 'unknown', 'not-applicable'):
                raise DesignError('invalid_evaluation', 'Invalid changed-block result status', 422)
            # For not-applicable, evidence gives the reason the check does not apply.
            text(row['evidence'], 'evidence', 512, empty=row['status'] == 'unknown')
        result[key] = row
    return result


def evaluate_changed_blocks(value):
    """List missing, stale and unresolved cases without echoing caller evidence."""
    object_fields(value, {'revision', 'inventory', 'observations'},
                  {'revision', 'inventory', 'observations'})
    revision = identifier(value['revision'], 'revision')
    inventory = _index(value['inventory'], observed=False)
    observations = _index(value['observations'], observed=True)
    if observations.keys() - inventory.keys():
        raise DesignError('invalid_evaluation', 'Observation outside changed-block inventory', 422)

    cases = []
    unchecked = []
    failed = 0
    passed = 0
    for key, address in inventory.items():
        observation = observations.get(key)
        if observation is None:
            status = 'missing'
        elif observation['revision'] != revision:
            status = 'stale'
        else:
            status = observation['status']
        case = {**address, 'status': status}
        cases.append(case)
        if status in ('missing', 'stale', 'unknown'):
            unchecked.append(case)
        if status == 'fail':
            failed += 1
        elif status == 'pass':
            passed += 1

    gate = 'pass'
    if failed:
        gate = 'fail'
    elif unchecked or not passed:
        gate = 'unknown'
    return {'revision': revision, 'gate': gate, 'cases': cases,
            'unchecked': unchecked, 'failed': failed, 'passed': passed,
            'trust': 'caller-declared inventory and observations'}
