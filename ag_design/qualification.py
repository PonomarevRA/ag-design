"""Version-bound, caller-reported component test gates; passing requires design-system evidence before consumer evidence."""

from datetime import datetime, timezone
import json
from uuid import uuid4

from .errors import DesignError
from .library import digest
from .design_policy import requirements
from .requirement_evaluation import evaluate_requirements
from .validation import encode, object_fields, text, finite_number

SCHEMA = """CREATE TABLE IF NOT EXISTS component_checks(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,component_id TEXT NOT NULL,
 version TEXT NOT NULL,component_digest TEXT NOT NULL,stage TEXT NOT NULL,payload TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS checks_component ON component_checks(component_id,sequence);"""
REQUIRED = {'functional', 'keyboard', 'profiles', 'load', 'disposal'}


def current_design_review(report):
    """Require current policy-bound passing evidence; legacy functional passes do not imply design readiness."""
    policy = requirements()
    review = report.get('designReview', {})
    return (review.get('policyVersion') == policy['policyVersion']
            and review.get('policyHash') == policy['policyHash'] and review.get('gate') == 'pass')


def component_digest(component):
    """Bind checks to actual definition/version without invalidating them for an unrelated catalog edit."""
    return digest({key:value for key,value in component.items() if key != 'catalogRevision'})


def history(store, component, limit=20):
    """Return bounded retained test claims and distinguish old definitions from current qualification."""
    with store.lock:
        rows = store.connection.execute('SELECT payload,component_digest FROM component_checks WHERE component_id=? ORDER BY sequence DESC LIMIT ?', (component['id'], limit + 1)).fetchall()
    entries = []
    for row in rows[:limit]:
        claim = json.loads(row['payload'])
        definition_matches = row['component_digest'] == component_digest(component)
        # A fresh failure still overrides an older pass even if no successful design review accompanied it.
        policy_matches = claim['outcome'] == 'fail' or current_design_review(claim)
        entries.append({**claim, 'current': definition_matches and policy_matches})
    with store.lock:
        row = store.connection.execute(
            "SELECT payload FROM component_checks WHERE component_id=? AND component_digest=? AND stage='design-system' ORDER BY sequence DESC LIMIT 1",
            (component['id'], component_digest(component))).fetchone()
    latest = json.loads(row['payload']) if row else None
    return {'items': entries, 'truncated': len(rows) > limit, 'readyForConsumer': bool(latest and latest['outcome'] == 'pass' and current_design_review(latest)), 'requirementsPolicy': requirements()['policyVersion'], 'trust': 'caller-reported; not execution attestation'}


def record(store, catalog, value):
    """Persist bounded test evidence, rejecting consumer checks before a current complete design-system pass."""
    object_fields(value, {'componentId','version','stage','consumerId','outcome','checks','environment','evidence','metrics','designReview'}, {'componentId','version','stage','outcome','checks','environment','evidence','metrics'})
    component = catalog.get(value['componentId'])
    if value['version'] != component['version'] or value['stage'] not in ('design-system','consumer') or value['outcome'] not in ('pass','fail'):
        raise DesignError('invalid_check', 'Current component version, stage and outcome required', 422)
    for key in ('environment','evidence'):
        text(value[key], key, 4096)
    if value['stage'] == 'consumer':
        text(value.get('consumerId'), 'consumerId', 128)
    object_fields(value['checks'], REQUIRED, REQUIRED)
    if any(type(item) is not bool for item in value['checks'].values()):
        raise DesignError('invalid_check', 'Check results must be booleans', 422)
    object_fields(value['metrics'], {'mountP95Ms','interactionP95Ms','retainedBytesPerInstance'}, {'mountP95Ms','interactionP95Ms'})
    for name, amount in value['metrics'].items():
        finite_number(amount, name)
    if len(encode(value).encode()) > 16384:
        raise DesignError('too_large', 'Check report exceeds 16KiB', 413)
    design_review = None
    if 'designReview' in value:
        submitted = value['designReview']
        object_fields(submitted, {'policyVersion', 'policyHash', 'observations', 'layoutWidthReview'}, {'policyVersion', 'policyHash', 'observations'})
        policy = requirements(component)
        if submitted['policyVersion'] != policy['policyVersion'] or submitted['policyHash'] != policy['policyHash']:
            raise DesignError('stale_design_policy', 'Retrieve the current design brief before reporting', 409)
        from .layout_width_review import evaluate_width_review, width_requirements
        evaluate_requirements(submitted['observations'], component)
        widths = evaluate_width_review(submitted.get('layoutWidthReview'))
        design_review = evaluate_requirements(width_requirements(submitted['observations'], widths), component)
        design_review['layoutWidthReview'] = widths
    if value['outcome'] == 'pass':
        if design_review is None or design_review['gate'] != 'pass':
            raise DesignError('design_requirements_required', 'Current design requirements must pass before qualification', 409)
        if not component.get('artifactHash'):
            raise DesignError('artifact_required','Bind the component to the built package SHA-256 before qualification',409)
        if not all(value['checks'].values()):
            raise DesignError('incomplete_check', 'Every required scenario must pass before qualification', 409)
        for name, amount in value['metrics'].items():
            if amount > component['budget'][name]:
                raise DesignError('budget_exceeded', 'Declared component budget exceeded', 409)
    with store.transaction() as connection:
        # Admission and insertion share the same write lock; an older pass cannot race a newer failure.
        if value['stage'] == 'consumer' and not history(store, component)['readyForConsumer']:
            raise DesignError('design_system_check_required', 'Pass the current definition in ag-design before the product', 409)
        entry = {**value, 'id':uuid4().hex, 'createdAt':datetime.now(timezone.utc).isoformat(), 'trust':'caller-reported',
                 'memoryStatus':'reported' if 'retainedBytesPerInstance' in value['metrics'] else 'unknown'}
        if design_review is not None:
            entry['designReview'] = design_review
        connection.execute('INSERT INTO component_checks(id,component_id,version,component_digest,stage,payload) VALUES(?,?,?,?,?,?)', (entry['id'], component['id'], component['version'], component_digest(component), value['stage'], encode(entry)))
        connection.execute('DELETE FROM component_checks WHERE sequence IN (SELECT sequence FROM component_checks ORDER BY sequence DESC LIMIT -1 OFFSET ?)', (store.settings.maxReports,))
    return entry
