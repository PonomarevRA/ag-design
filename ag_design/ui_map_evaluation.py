"""Turn supported map measurements into the existing strict policy, preserving all manual unknowns."""
from .design_policy import requirements
from .requirement_evaluation import evaluate_requirements
from .interface_evaluation import _score_detailed
from .ui_snapshot import fail

GEOMETRY_RULES = {'layout-alignment-anchors': 'alignment', 'apple-concentric-corners': 'corner'}


def _geometry_observation(graph, rule):
    """Aggregate a rule once; a measured failure survives partial coverage and repeated targets."""
    metrics = []
    targets = set()
    for finding in graph['findings']:
        metric = finding.get('metric')
        if finding.get('ruleId') != rule['id'] or not metric:
            continue
        if finding['policyHash'] != graph['policyHash'] or finding['snapshotHash'] != graph['snapshotHash']:
            continue
        if metric['unit'] == rule['metric']['unit']:
            metrics.append(metric['value'])
            targets.update(finding['nodeIds'])
    if not metrics:
        return None
    value = max(metrics)
    failed = value > rule['metric']['maximum']
    # Only an explicitly annotated complete set of visible controls can establish this local geometry rule.
    eligible = {node['id'] for node in graph['nodes'] if node['kind'] in ('control','action') and node['visibility']=='visible'}
    complete = graph['coverage']['status']=='complete' and eligible and eligible <= targets
    return {'ruleId':rule['id'], 'status':'fail' if failed else 'pass' if complete else 'unknown',
            'evidence':f"graph={graph['graphId']}; snapshot={graph['snapshotHash']}; method={graph['methodVersion']}; measuredTargets={len(targets)}; maximum residual={value}",
            'measurement':{'value':value,'unit':rule['metric']['unit']},
            'reason':'Declared local geometry only; incomplete target coverage remains unknown.'}


def _parents(details):
    """Summarize only complete child evidence; the authoritative evaluator still applies all weights and gates."""
    by_check = {}
    for row in details['observations']:
        by_check.setdefault(row['checkId'],[]).append(row['status'])
    parents = []
    for key,statuses in by_check.items():
        status = 'fail' if 'fail' in statuses else 'unknown' if 'unknown' in statuses else 'pass'
        parents.append({'checkId':key,'status':status,'severity':2 if status=='fail' else 0,
                        'evidence':'Aggregated current map requirement observations; no independent scenario or AT evidence.'})
    return parents


def evaluate_ui_map(store, graph_id, *, cancelled=None):
    """Evaluate one immutable current graph without recording qualification or inventing manual evidence."""
    graph = store.get_graph(graph_id,cancelled=cancelled)
    policy = requirements()
    if graph['policyHash'] != policy['policyHash']:
        fail('UI map policy changed','policy_mismatch',409)
    observations = []
    for rule in policy['rules']:
        if cancelled and cancelled():
            fail('UI map evaluation cancelled','cancelled',409)
        if rule['id'] in GEOMETRY_RULES:
            row = _geometry_observation(graph,rule)
            if row is not None:
                observations.append(row)
    details = evaluate_requirements(observations)
    result = _score_detailed({'observations': _parents(details)}, details)
    return {'graphId':graph_id,'snapshotHash':graph['snapshotHash'],'policyHash':policy['policyHash'],
            'methodVersion':graph['methodVersion'],'requirementObservations':observations,'evaluation':result,
            'coverage':graph['coverage'],'manualRequired':details['unknownRules'],
            'supportedRules':list(GEOMETRY_RULES),'provenance':'caller-reported','certification':False,
            'limitations':['Grouping is advisory until independent calibration.',
                          'Color pairs, names, target exceptions, AT, optics and scenario checks need separate evidence.',
                          'No component qualification is written by this operation.']}
