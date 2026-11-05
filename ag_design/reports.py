"""Validation of caller-reported notes, audits and measurements; nothing executes a scenario."""

from datetime import datetime

from .errors import DesignError
from .validation import finite_number, identifier, object_fields, string_list, text

METRICS = {'mount_p50_ms': 'ms', 'mount_p95_ms': 'ms', 'interaction_p95_ms': 'ms',
           'dispose_p95_ms': 'ms', 'dom_roots_after_dispose': 'count',
           'heap_delta_bytes': 'bytes', 'retained_bytes_per_instance': 'bytes', 'instances': 'count', 'cycles': 'count'}


def component_reference(value, catalog):
    """Resolve an optional existing component without accepting arbitrary source locations."""
    if value is not None:
        identifier(value, 'componentId')
        if value not in catalog.by_id:
            raise DesignError('invalid_fields', 'Unknown componentId')
    return value


def validate_report(kind, value, catalog):
    """Produce validated report data and references; trust is always server-set caller-reported."""
    if kind == 'notes':
        object_fields(value, {'componentId','text'}, {'text'})
        text(value['text'], 'text')
        component = component_reference(value.get('componentId'), catalog)
        return dict(value), [component] if component else []
    if kind == 'audits':
        return validate_audit(value, catalog)
    if kind == 'performance':
        return validate_performance(value, catalog)
    raise DesignError('invalid_fields', 'Unsupported evidence kind')


def validate_audit(value, catalog):
    """Validate declared findings without treating an audit as an authenticated attestation."""
    object_fields(value, {'title','componentIds','findings','summary'}, {'title','componentIds','findings','summary'})
    text(value['title'], 'title', 256)
    text(value['summary'], 'summary', empty=True)
    components = string_list(value['componentIds'], 'componentIds', 100)
    for component in components:
        component_reference(component, catalog)
    findings = value['findings']
    if not isinstance(findings, list) or len(findings) > 100:
        raise DesignError('invalid_fields', 'Findings must be a bounded list')
    rule_ids = {rule['id'] for rule in catalog.sections['rules']}
    for finding in findings:
        object_fields(finding, {'ruleId','componentId','severity','summary','evidence'}, {'severity','summary'})
        if not isinstance(finding['severity'], str) or finding['severity'] not in {'error','warning','manual','info'}:
            raise DesignError('invalid_fields', 'Invalid finding severity')
        text(finding['summary'], 'summary', 2048)
        if 'evidence' in finding:
            text(finding['evidence'], 'evidence', 4096, empty=True)
        component = component_reference(finding.get('componentId'), catalog)
        if component and component not in components:
            raise DesignError('invalid_fields', 'Finding component must be listed in componentIds')
        if finding.get('ruleId') is not None and (not isinstance(finding['ruleId'], str) or finding['ruleId'] not in rule_ids):
            raise DesignError('invalid_fields', 'Unknown ruleId')
    return {**value, 'trust': 'caller-reported'}, components


def validate_performance(value, catalog):
    """Accept only finite named measurements; omitted memory stays unknown instead of becoming zero."""
    object_fields(value, {'componentId','scenario','environment','metrics','notes','measuredAt','measuredBy','componentVersion','outcome','error','memory'}, {'scenario','environment','metrics'})
    text(value['scenario'], 'scenario', 256)
    component = component_reference(value.get('componentId'), catalog)
    object_fields(value['environment'], {'browser','os','device','runtime'})
    for name, entry in value['environment'].items():
        text(entry, name, 256)
    if 'notes' in value:
        text(value['notes'], 'notes', empty=True)
    method = value.get('measuredBy', 'reported')
    if not isinstance(method, str) or method not in {'browser-harness','reported'}:
        raise DesignError('invalid_fields', 'Invalid measuredBy method')
    if 'measuredAt' in value:
        text(value['measuredAt'], 'measuredAt', 64)
        try:
            parsed = datetime.fromisoformat(value['measuredAt'].replace('Z', '+00:00'))
            if parsed.tzinfo is None:
                raise ValueError('Timezone required')
        except ValueError as error:
            raise DesignError('invalid_fields', 'measuredAt requires an ISO timestamp with timezone') from error
    outcome = value.get('outcome', 'measured')
    if outcome not in ('measured', 'failed', 'cancelled'):
        raise DesignError('invalid_fields', 'Invalid performance outcome')
    error = value.get('error')
    if outcome == 'failed':
        object_fields(error, {'phase', 'message'}, {'phase', 'message'})
        if error['phase'] not in ('setup', 'sample-contract', 'mount', 'readiness', 'interaction', 'dispose', 'unknown'):
            raise DesignError('invalid_fields', 'Invalid failure phase')
        text(error['message'], 'error.message', 2048)
    elif error is not None:
        raise DesignError('invalid_fields', 'Only failed reports include an error')
    memory = value.get('memory')
    if memory is not None:
        object_fields(memory, {'status', 'method', 'reason'}, {'status', 'method', 'reason'})
        if memory['status'] not in ('measured', 'unavailable') or memory['method'] not in ('none', 'node-jsdom-gc', 'browser-reported'):
            raise DesignError('invalid_fields', 'Invalid memory method/status')
        text(memory['reason'], 'memory.reason', 2048)
    metrics = value['metrics']
    minimum = 1 if outcome == 'measured' else 0
    if not isinstance(metrics, list) or not minimum <= len(metrics) <= len(METRICS):
        raise DesignError('invalid_fields', f'Supply between one and {len(METRICS)} measurements')
    seen = set()
    for metric in metrics:
        object_fields(metric, {'name','value','unit'}, {'name','value','unit'})
        name = metric['name']
        if not isinstance(name, str) or name not in METRICS or name in seen or metric['unit'] != METRICS[name]:
            raise DesignError('invalid_fields', 'Invalid or repeated metric name/unit')
        finite_number(metric['value'], name)
        if metric['unit'] == 'count' and metric['value'] != int(metric['value']):
            raise DesignError('invalid_fields', 'Counts must be integers')
        seen.add(name)
    if memory is not None:
        measured = 'retained_bytes_per_instance' in seen
        if measured != (memory['status'] == 'measured') or (memory['status'] == 'measured' and memory['method'] == 'none'):
            raise DesignError('invalid_fields', 'Memory status must match its metric and method')
    result = {**value, 'measuredBy': method, 'trust': 'caller-reported', 'catalogRevision': catalog.revision}
    if 'componentVersion' in value:
        if component is None:
            raise DesignError('invalid_fields', 'componentVersion requires componentId')
        text(value['componentVersion'], 'componentVersion', 64)
    if component is not None:
        result['componentVersion'] = value.get('componentVersion', catalog.by_id[component]['version'])
    return result, [component] if component else []
