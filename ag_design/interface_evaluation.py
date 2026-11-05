"""Versioned AG heuristic scoring of explicit caller observations, not an accessibility certification."""

from copy import deepcopy
from .changed_block_review import evaluate_changed_blocks
from .errors import DesignError
from .validation import object_fields, text

LEGACY_POLICY_VERSION = 'ag-interface-review-v1'
POLICY_VERSION = 'ag-interface-review-v2'
APPLE = 'https://developer.apple.com/design/human-interface-guidelines/design-principles'
NIELSEN = 'https://www.nngroup.com/articles/ten-usability-heuristics/'
WCAG = 'https://www.w3.org/TR/WCAG22/'
# AG weights are product policy, not numerical requirements published by the source authors.
CHECKS = [
    ('scenario', 'Проверенный сценарий и потребность пользователя', 'human-centered', 8, False, APPLE),
    ('navigation', 'Стабильные переходы и видимый текущий контекст', 'navigation', 8, False, NIELSEN),
    ('hierarchy', 'Главное действие и визуальная иерархия', 'hierarchy', 7, False, APPLE),
    ('spacing', 'Последовательные отступы и смысловая группировка', 'layout', 6, False, APPLE),
    ('layers', 'Слои, перекрытия и доступное закрытие', 'layout', 5, False, APPLE),
    ('typography', 'Читаемая типографика и увеличение текста', 'typography', 6, False, WCAG),
    ('color', 'Реальные текстовые пары проходят WCAG AA; APCA проверен отдельно', 'color', 10, True, WCAG),
    ('keyboard', 'Полная клавиатурная работа и видимый фокус', 'accessibility', 10, True, WCAG),
    ('semantics', 'Доступные имена, роли и состояния', 'accessibility', 8, True, WCAG),
    ('feedback', 'Загрузка, ошибка, пустота и результат действий', 'feedback', 6, False, NIELSEN),
    ('recovery', 'Защита данных и восстановление после ошибок', 'human-control', 6, True, NIELSEN),
    ('responsive', 'Узкий экран и увеличение текста без потери действий', 'layout', 5, False, WCAG),
    ('motion', 'Уменьшение движения и отсутствие опасных вспышек', 'accessibility', 4, True, WCAG),
    ('performance', 'Измерены нагрузка, взаимодействие и освобождение ресурсов', 'performance', 5, False, 'https://www.w3.org/TR/performance-timeline/'),
    ('consistency', 'Согласованные элементы и цветовые профили', 'consistency', 3, False, APPLE),
    ('agent-control', 'Прозрачность действий агентов и контроль пользователя', 'human-control', 3, False, NIELSEN),
]


def legacy_rubric():
    """Export the complete fixed rubric and arithmetic so agents can reproduce a review offline."""
    checks = []
    for key, title, domain, weight, critical, source in CHECKS:
        checks.append({'id': key, 'title': title, 'domain': domain, 'weight': weight,
                       'critical': critical, 'sourceUrls': [source]})
    return {'policyVersion': LEGACY_POLICY_VERSION, 'checks': checks, 'totalWeight': sum(row[3] for row in CHECKS),
            'weightOrigin': 'AG product policy; not Apple, Nielsen, ISO or WCAG scoring requirements',
            'statuses': ['pass', 'fail', 'unknown', 'not-applicable'],
            'algorithm': {'score': '100 * passedWeight / applicableWeight; null when applicableWeight=0',
                          'coverage': '100 * (passedWeight + failedWeight) / applicableWeight; 0 when applicableWeight=0',
                          'applicableWeight': 'all weights except explicitly justified not-applicable; omitted checks are unknown',
                          'unknownCredit': 0, 'criticalNotApplicable': 'gate remains unknown',
                          'decisionOrder': ['critical failure or severity4: blocked', 'unknown or critical N/A: needs-evidence', 'any failure: revise', 'otherwise: ready']},
            'severity': {'sourceUrl': 'https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/',
                         'scale': {'0': 'no problem', '1': 'cosmetic', '2': 'minor', '3': 'major', '4': 'catastrophic'},
                         'use': 'caller priority only; not converted to a validated quality percentage'},
            'trust': 'caller-reported; server validates shape and arithmetic, not observations',
            'limitations': ['Not a screenshot parser, usability study, security audit or conformance certification.',
                            'Review actual scenarios, themes, states, assistive technology and native/browser environments.',
                            'Use design_color_scheme for calculated color evidence; do not invent measured performance.']}


def _observations(value):
    """Require unique known checks with evidence and explicit non-applicability reasons, max one per rubric row."""
    object_fields(value, {'observations', 'context'}, {'observations'})
    if 'context' in value:
        text(value['context'], 'context', 2048, empty=True)
    rows = value['observations']
    if not isinstance(rows, list) or len(rows) > len(CHECKS):
        raise DesignError('invalid_evaluation', 'Supply at most one observation per rubric check', 422)
    known, result = {row[0] for row in CHECKS}, {}
    for row in rows:
        object_fields(row, {'checkId', 'status', 'evidence', 'reason', 'severity'}, {'checkId', 'status', 'evidence'})
        key = text(row['checkId'], 'checkId', 80)
        status = row['status']
        if key not in known or key in result or status not in ('pass', 'fail', 'unknown', 'not-applicable'):
            raise DesignError('invalid_evaluation', 'Unknown, repeated check or invalid status', 422)
        text(row['evidence'], 'evidence', 4096, empty=status in ('unknown', 'not-applicable'))
        if 'reason' in row:
            text(row['reason'], 'reason', 2048, empty=status != 'not-applicable')
        if status == 'not-applicable' and not row.get('reason', '').strip():
            raise DesignError('invalid_evaluation', 'Non-applicable checks require a reason', 422)
        severity = row.get('severity', 2 if status == 'fail' else 0)
        if type(severity) is not int or not 0 <= severity <= 4:
            raise DesignError('invalid_evaluation', 'Severity must be an integer from 0 to 4', 422)
        # Zero means no observed problem; a failed check must carry actionable priority.
        has_problem = status == 'fail'
        if has_problem != (severity > 0):
            raise DesignError('invalid_evaluation', 'Severity 1–4 belongs only to failed observations', 422)
        result[key] = {**deepcopy(row), 'severity': severity}
    return result


def _evaluate_summary(value):
    """Compute conservative AG score and coverage; missing evidence and critical failures cannot average away."""
    observations = _observations(value)
    passed = failed = unknown = excluded = 0
    critical_failures, critical_unknowns, rows, domains = [], [], [], {}
    catastrophic = False
    for key, title, domain, weight, critical, source in CHECKS:
        row = observations.get(key, {'checkId': key, 'status': 'unknown', 'evidence': '', 'severity': 0})
        status = row['status']
        rows.append({**row, 'weight': weight, 'critical': critical, 'domain': domain})
        summary = domains.setdefault(domain, {'passedWeight': 0, 'applicableWeight': 0, 'verifiedWeight': 0})
        if status == 'not-applicable':
            excluded += weight
        else:
            summary['applicableWeight'] += weight
        if status == 'pass':
            passed += weight
            summary['passedWeight'] += weight
            summary['verifiedWeight'] += weight
        elif status == 'fail':
            failed += weight
            summary['verifiedWeight'] += weight
            catastrophic = catastrophic or row['severity'] == 4
        elif status == 'unknown':
            unknown += weight
        if critical and status == 'fail':
            critical_failures.append(key)
        elif critical and status in ('unknown', 'not-applicable'):
            critical_unknowns.append(key)
    applicable = passed + failed + unknown
    score = round(100 * passed / applicable, 2) if applicable else None
    coverage = round(100 * (passed + failed) / applicable, 2) if applicable else 0
    for summary in domains.values():
        total = summary['applicableWeight']
        summary['score'] = round(100 * summary['passedWeight'] / total, 2) if total else None
    if critical_failures or catastrophic:
        decision = 'blocked'
    elif unknown or critical_unknowns or not applicable:
        decision = 'needs-evidence'
    elif failed:
        decision = 'revise'
    else:
        decision = 'ready'
    gate = 'fail' if critical_failures else 'unknown' if critical_unknowns else 'pass'
    return {'policyVersion': LEGACY_POLICY_VERSION, 'score': score, 'coverage': coverage, 'decision': decision,
            'criticalGate': gate, 'criticalFailures': critical_failures, 'criticalUnknowns': critical_unknowns,
            'weights': {'passed': passed, 'failed': failed, 'unknown': unknown, 'notApplicable': excluded, 'applicable': applicable},
            'domains': domains, 'observations': rows, 'context': value.get('context', ''),
            'trust': 'caller-reported; deterministic arithmetic only', 'certification': False}



def rubric():
    """Export v2 requirements and unchanged weights, explicitly retaining the legacy policy identifier."""
    from .design_policy import requirements
    policy = requirements()
    return {**legacy_rubric(), 'policyVersion': POLICY_VERSION,
            'legacyPolicyVersion': LEGACY_POLICY_VERSION,
            'requirementsPolicyVersion': policy['policyVersion'], 'requirementsHash': policy['policyHash'],
            'requirements': policy['rules'], 'metrics': policy['metrics'],
            'detailedEvidence': 'requirementObservations lower parent scores; mandatory failures block qualification'}


def evaluate_interface(value):
    """Score detailed requirements by default; explicit v1 remains a historical arithmetic mode, not qualification."""
    from .requirement_evaluation import evaluate_requirements
    object_fields(value, {'observations', 'context', 'policyVersion', 'requirementObservations', 'changedBlockReview', 'layoutWidthReview'}, {'observations'})
    selected = value.get('policyVersion', POLICY_VERSION)
    if selected not in (POLICY_VERSION, LEGACY_POLICY_VERSION):
        raise DesignError('invalid_evaluation', 'Unknown evaluation policy', 422)
    base = {'observations': value['observations'], 'context': value.get('context', '')}
    # Validate originals before merging, otherwise duplicate parent claims could disappear in a dict.
    _observations(base)
    if selected == LEGACY_POLICY_VERSION:
        if 'requirementObservations' in value or 'changedBlockReview' in value or 'layoutWidthReview' in value:
            raise DesignError('invalid_evaluation', 'Legacy policy does not consume detailed requirements or changed-block review', 422)
        return _evaluate_summary(base)
    from .layout_width_review import evaluate_width_review, width_requirements
    supplied = value.get('requirementObservations', [])
    evaluate_requirements(supplied)  # Reject duplicate/invalid caller rules before replacing owned width statuses.
    coverage = evaluate_changed_blocks(value['changedBlockReview']) if 'changedBlockReview' in value else None
    changed = value.get('changedBlockReview', {})
    required_blocks = {row.get('blockId') for row in changed.get('inventory', []) if isinstance(row, dict)}
    widths = evaluate_width_review(value.get('layoutWidthReview'), revision=changed.get('revision'), required_blocks=required_blocks)
    details = evaluate_requirements(width_requirements(supplied, widths))
    result = _score_detailed(base, details, coverage=coverage)
    result['layoutWidthReview'] = widths
    return result


def _score_detailed(base, details, *, coverage=None):
    """Score validated parent evidence using a server-computed requirement result."""
    from .requirement_evaluation import merge_parent_observations

    observations = merge_parent_observations(base['observations'], details)
    result = _evaluate_summary({**base, 'observations': observations})
    result.update(policyVersion=POLICY_VERSION, requirements=details)
    if details['gate'] == 'fail':
        result['decision'] = 'blocked'
    elif details['gate'] == 'unknown' and result['decision'] != 'blocked':
        result['decision'] = 'needs-evidence'
    if coverage is not None:
        result['changedBlockReview'] = coverage
        if coverage['gate'] == 'fail':
            result['decision'] = 'blocked'
        elif coverage['gate'] == 'unknown' and result['decision'] != 'blocked':
            result['decision'] = 'needs-evidence'

    # Existing exploratory scoring stays compatible. Completion requires coverage.
    if result['decision'] == 'blocked':
        result['completionGate'] = 'fail'
    elif result['decision'] == 'ready' and coverage and coverage['gate'] == 'pass':
        result['completionGate'] = 'pass'
    else:
        result['completionGate'] = 'unknown'
    return result
