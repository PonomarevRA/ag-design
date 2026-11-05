"""Compare immutable graph generations without inventing stable identity or a score improvement."""
from .ui_snapshot import fail

ENVIRONMENT_KEYS = ('viewport','scroll','dpr','browser','browserVersion','theme','contrast','textScale','zoom','direction','writingMode')


def _unknown(value):
    """Unknown nested environment values prevent a claim that two observations are comparable."""
    if value is None or value=='unknown':
        return True
    if isinstance(value,dict):
        return any(_unknown(part) for part in value.values())
    return False


def _reasons(before,after,left,right):
    """Check declared scenario, method, policy and observed environment before interpreting changes."""
    reasons = []
    for key in ('artifactId','scenarioId','stateId','kind','adapter'):
        if left['source'][key] != right['source'][key]:
            reasons.append('source.'+key)
    if left['source']['adapterVersion'].split('.')[0] != right['source']['adapterVersion'].split('.')[0]:
        reasons.append('source.adapterVersion')
    if left['source']['capabilities'] != right['source']['capabilities']:
        reasons.append('source.capabilities')
    if left['privacy'] != right['privacy']:
        reasons.append('privacy')
    if left['scope'] != right['scope']:
        reasons.append('scope')
    for key in ENVIRONMENT_KEYS:
        first,second = left['environment'][key],right['environment'][key]
        if _unknown(first) or _unknown(second) or first != second:
            reasons.append('environment.'+key)
    for key in ('policyHash','methodVersion','provider','parameterHash'):
        if before[key] != after[key]:
            reasons.append(key)
    if before['coverage'] != after['coverage'] or before['coverage']['status'] != 'complete':
        reasons.append('coverage')
    return reasons


def _keys(nodes):
    """Index only unique explicit keys; imported component verification remains a caller claim, not attestation."""
    keys,duplicates = {},set()
    for node in nodes:
        key = node.get('stableKey')
        if not key:
            continue
        if key in keys:
            duplicates.add(key)
        else:
            keys[key]=node
    for key in duplicates:
        keys.pop(key,None)
    return keys


def compare_ui_maps(store,before_id,after_id,*,cancelled=None):
    """Treat both IDs as graph IDs; unverified keys yield explicit heuristic matches, never stable continuity."""
    before = store.get_graph(before_id,cancelled=cancelled)
    after = store.get_graph(after_id,cancelled=cancelled)
    left,right = store.get_snapshot(before['snapshotId']),store.get_snapshot(after['snapshotId'])
    reasons = _reasons(before,after,left,right)
    same_snapshot = before['snapshotHash']==after['snapshotHash']
    if same_snapshot:
        first={node['id']:node for node in before['nodes']}
        second={node['id']:node for node in after['nodes']}
    else:
        first,second = _keys(before['nodes']),_keys(after['nodes'])
    matches,changes = [],[]
    matched_before,matched_after = set(),set()
    total_matches,total_changes = 0,0
    for index,key in enumerate(sorted(first.keys() & second.keys())):
        if index%100==0 and cancelled and cancelled():
            fail('UI comparison cancelled','cancelled',409)
        a,b = first[key],second[key]
        matched_before.add(a['id']);matched_after.add(b['id'])
        verified = same_snapshot or bool(a.get('component',{}).get('verified') and b.get('component',{}).get('verified'))
        method = 'same-snapshot-identity' if same_snapshot else 'verified-stable-key' if verified else 'declared-key-heuristic'
        total_matches += 1
        if len(matches)<200:
            matches.append({'beforeNodeId':a['id'],'afterNodeId':b['id'],'method':method,
                            'confidence':'high' if verified else 'low','stable':verified})
        if a['bounds'] != b['bounds']:
            total_changes += 1
            if len(changes)<200:
                changes.append({'beforeNodeId':a['id'],'afterNodeId':b['id'],'beforeBounds':a['bounds'],
                                'afterBounds':b['bounds'],'identityConfidence':'high' if verified else 'low'})
    return {'beforeId':before_id,'afterId':after_id,'comparable':not reasons,'reasons':reasons,
            'matches':matches,'matchCount':total_matches,'changes':changes,'changeCount':total_changes,
            'unmatchedBefore':len(before['nodes'])-len(matched_before),'unmatchedAfter':len(after['nodes'])-len(matched_after),
            'truncated':total_matches>len(matches) or total_changes>len(changes),'scoreImprovement':None,
            'policyHash':before['policyHash'],'coverageBefore':before['coverage'],'coverageAfter':after['coverage'],
            'provenance':'caller-reported','certification':False,
            'limitations':['No matching by display text, selector or preorder ID.',
                          'Unverified host keys are heuristic; repeated keys are never silently merged.',
                          'A comparable environment alone does not prove stable node identity or improved design.']}
