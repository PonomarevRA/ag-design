"""Build immutable caller-reported UI maps without converting heuristics into conformance."""
from copy import deepcopy
import hashlib
import time
from .design_policy import requirements
from .ui_snapshot import validate_snapshot, canonical_json, fail, MAX_EDGES
from .ui_grouping import METHOD_VERSION, normalize_parameters, semantic_groups, spatial_edges, inferred_groups


def _checkpoint(clock,deadline,cancelled):
    """Stop a bounded build cooperatively before a cancelled/stale result can be published."""
    if cancelled and cancelled(): fail('UI map build cancelled','cancelled',409)
    if clock()>deadline: fail('UI map build deadline exceeded','capture_timeout',408)


def _alignment_metric(node):
    """Measure the declared physical x/y anchor; a text-box center is never a baseline."""
    alignment = node.get('annotations',{}).get('alignment')
    rect = node['bounds']
    if not alignment or rect is None:
        return None
    axis,anchor = alignment['axis'],alignment['anchor']
    actual = rect['x' if axis=='x' else 'y']
    size = rect['width' if axis=='x' else 'height']
    if anchor=='center':
        actual += size/2
    elif anchor=='end':
        actual += size
    elif anchor=='baseline':
        actual = node.get('geometry',{}).get('baseline')
    if actual is None:
        return None
    return {'name':'maxDeviationPx','value':abs(actual-alignment['value']),'unit':'CSS px'}


def _corner_metric(node):
    """Apply the existing AG tolerance only to supplied uniform circular parent/child geometry."""
    corner = node.get('annotations',{}).get('corner')
    rect = node['bounds']
    if not corner or not corner['uniform'] or not corner['circular'] or rect is None:
        return None
    expected = min(max(0,corner['outerRadius']-corner['inset']),rect['width']/2,rect['height']/2)
    return {'name':'radiusErrorPx','value':abs(corner['childRadius']-expected),'unit':'CSS px'}


def _geometry_finding(node,rule,metric,snapshot_hash,policy_hash):
    """Describe one residual without claiming that an otherwise incomplete requirement passed."""
    metric.update(sourceNodeIds=[node['id']],methodVersion=METHOD_VERSION,parameters={},limitations=['caller-declared-geometry'])
    identifier = rule+':'+hashlib.sha256(node['id'].encode()).hexdigest()
    result = {'id':identifier,'ruleId':rule,'checkId':'spacing','severity':'warning' if metric['value']>1 else 'info',
              'status':'fail' if metric['value']>1 else 'advisory','nodeIds':[node['id']],'groupIds':[],
              'snapshotHash':snapshot_hash,'policyHash':policy_hash,'metric':metric,
              'applicability':'declared-comparable-geometry','threshold':{'maximum':1,'unit':'CSS px','origin':'AG tolerance'},
              'provenance':'observed','summary':'Declared geometry residual',
              'explanation':'Compare a supplied physical axis or uniform circular inset only.','recommendation':None}
    return result


def _declared_findings(nodes,snapshot_hash,policy_hash,checkpoint):
    """Keep both measured rule residuals while all unsupported optical/AT judgements remain unknown."""
    findings = []
    for index,node in enumerate(nodes):
        if index%100==0:
            checkpoint()
        for rule,measure in (('layout-alignment-anchors',_alignment_metric),('apple-concentric-corners',_corner_metric)):
            metric = measure(node)
            if metric:
                findings.append(_geometry_finding(node,rule,metric,snapshot_hash,policy_hash))
            if len(findings)>=2000:
                return findings
    return findings


def build_ui_graph(snapshot,provider='hybrid',parameters=None,*,policy=None,clock=time.monotonic,deadline_ms=2000,cancelled=None):
    """Build a deterministic bounded graph; policy and all facts remain caller-reported evidence."""
    if provider not in ('semantic','spatial','hybrid'): fail('Unsupported UI grouping provider','invalid_provider')
    if type(deadline_ms) not in (int,float) or not 0<deadline_ms<=2000: fail('Invalid build deadline')
    started = clock(); deadline = started+deadline_ms/1000
    checkpoint = lambda: _checkpoint(clock,deadline,cancelled)
    checkpoint()
    value = validate_snapshot(snapshot)
    policy = deepcopy(policy if policy is not None else requirements())
    params = normalize_parameters(parameters)
    checkpoint()
    groups,membership = semantic_groups(value['nodes'],value['relations'],checkpoint)
    factual = deepcopy(value['relations'])
    statistics = {'candidateChecks':0,'edgeLimitReached':False,'bucketCount':0}
    derived = []
    if provider!='semantic':
        derived,statistics = spatial_edges(value['nodes'],membership,params,checkpoint,MAX_EDGES-len(factual))
        visual = inferred_groups(derived,membership,1000-len(groups),checkpoint)
        if provider=='spatial': groups = [group for group in groups if group['id'].startswith('semantic:')]+visual
        else: groups += visual
    coverage = deepcopy(value['coverage'])
    if len(groups)>=1000:
        coverage['status']='partial'; coverage['omitted']=None
        coverage['reasons'] = sorted(set(coverage['reasons'])|{'group-limit'})
    if statistics['edgeLimitReached']:
        coverage['status']='partial'; coverage['omitted']=None
        coverage['reasons'] = sorted(set(coverage['reasons'])|{'edge-limit'})
    findings = _declared_findings(value['nodes'],value['contentHash'],policy['policyHash'],checkpoint)
    if len(findings)>=2000:
        coverage['status']='partial'; coverage['omitted']=None
        coverage['reasons'] = sorted(set(coverage['reasons'])|{'finding-limit'})
    key = {'snapshotHash':value['contentHash'],'policyHash':policy['policyHash'],'methodVersion':METHOD_VERSION,'provider':provider,'parameters':params}
    parameter_hash = hashlib.sha256(canonical_json(params).encode()).hexdigest()
    digest = hashlib.sha256(canonical_json(key).encode()).hexdigest()
    checkpoint()
    result = {'schemaVersion':'ag-design/ui-graph-v1','graphId':digest,'snapshotId':value['snapshotId'],
              'snapshotHash':value['contentHash'],'policyVersion':policy['policyVersion'],'policyHash':policy['policyHash'],
              'methodVersion':METHOD_VERSION,'provider':provider,'parameters':params,'parameterHash':parameter_hash,
              'nodes':value['nodes'],'edges':factual+derived,'groups':groups,'findings':findings,'coverage':coverage,
              'provenance':'caller-reported','statistics':statistics,
              'manualRequired':['optics','keyboard','screen-reader','hearing','reflow','meaning','uncalibrated-grouping']}
    return result
