"""Validate detailed design observations and preserve actionable failures without trusting declared measurements blindly."""

from copy import deepcopy

from .design_policy import requirements
from .errors import DesignError
from .validation import finite_number, object_fields, text

STATUSES = ('pass', 'fail', 'unknown', 'not-applicable')


def _observation(value, rule):
    """Validate one caller claim; quantitative passes require a measurement in the rule's declared unit."""
    object_fields(value, {'ruleId', 'status', 'evidence', 'reason', 'measurement'}, {'ruleId', 'status', 'evidence'})
    status = value['status']
    if status not in STATUSES:
        raise DesignError('invalid_requirements', 'Unknown requirement status', 422)
    text(value['evidence'], 'evidence', 4096, empty=status in ('unknown', 'not-applicable'))
    if 'reason' in value:
        text(value['reason'], 'reason', 2048, empty=status != 'not-applicable')
    if status == 'not-applicable' and not value.get('reason', '').strip():
        raise DesignError('invalid_requirements', 'A requirement exclusion needs a reason', 422)
    row = deepcopy(value)
    measurement = value.get('measurement')
    metric = rule.get('metric')
    if measurement is not None:
        object_fields(measurement, {'value', 'unit'}, {'value', 'unit'})
        finite_number(measurement['value'], 'measurement.value')
        if not metric or measurement['unit'] != metric['unit']:
            raise DesignError('invalid_requirements', 'Measurement does not match the rule unit', 422)
        if status == 'not-applicable':
            raise DesignError('invalid_requirements', 'Excluded rules cannot supply measurements', 422)
        # A caller cannot claim pass when the actual submitted value exceeds the fixed policy.
        if measurement['value'] > metric['maximum']:
            row['status'] = 'fail'
    elif metric and status == 'pass':
        row['status'] = 'unknown'
        row['reason'] = 'Required quantitative measurement is missing'
    return row


def evaluate_requirements(observations, component=None):
    """Resolve omitted rules as unknown and report mandatory gate, coverage and concrete repair guidance."""
    policy = requirements(component)
    rules = {rule['id']: rule for rule in policy['rules']}
    if not isinstance(observations, list) or len(observations) > len(rules):
        raise DesignError('invalid_requirements', 'Supply at most one observation per applicable rule', 422)
    supplied = {}
    for value in observations:
        if not isinstance(value, dict):
            raise DesignError('invalid_requirements', 'Requirement observations must be objects', 422)
        key = value.get('ruleId')
        if not isinstance(key, str) or key not in rules or key in supplied:
            raise DesignError('invalid_requirements', 'Unknown or repeated requirement', 422)
        supplied[key] = _observation(value, rules[key])
    rows, findings, failed, unknown = [], [], [], []
    counts = dict.fromkeys(STATUSES, 0)
    for key, rule in rules.items():
        observation = supplied.get(key, {'ruleId': key, 'status': 'unknown', 'evidence': ''})
        row = {**deepcopy(rule), **observation}
        rows.append(row)
        status = row['status']
        counts[status] += 1
        if status == 'fail':
            findings.append({'ruleId': key, 'checkId': rule['checkId'], 'evidence': row['evidence'],
                             'fix': rule['fix'], 'sources': rule['sources'], 'mandatory': rule['mandatory']})
            if rule['mandatory']:
                failed.append(key)
        if status == 'unknown':
            unknown.append(key)
    applicable = len(rows) - counts['not-applicable']
    coverage = round(100 * (counts['pass'] + counts['fail']) / applicable, 2) if applicable else 0
    gate = 'fail' if failed else 'unknown' if unknown or not applicable else 'pass'
    return {'policyVersion': policy['policyVersion'], 'policyHash': policy['policyHash'],
            'gate': gate, 'coverage': coverage, 'counts': counts, 'mandatoryFailures': failed,
            'unknownRules': unknown, 'observations': rows, 'findings': findings,
            'trust': policy['trust'], 'certification': False}


def merge_parent_observations(observations, report):
    """Lower rubric claims when detailed evidence fails or is missing; never upgrade a caller's parent claim."""
    merged = {row['checkId']: deepcopy(row) for row in observations}
    for rule in report['observations']:
        status, key = rule['status'], rule['checkId']
        if status not in ('fail', 'unknown'):
            continue
        parent = merged.get(key, {'checkId': key, 'status': 'unknown', 'evidence': ''})
        if status == 'fail':
            parent.update(status='fail', severity=max(parent.get('severity', 0), 2),
                          evidence=(parent.get('evidence', '') + '\nRequirement failed: ' + rule['id'])[-4096:])
        elif parent['status'] != 'fail':
            parent.update(status='unknown', severity=0)
        merged[key] = parent
    return list(merged.values())
