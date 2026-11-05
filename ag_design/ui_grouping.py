"""Deterministic advisory grouping over bounded local geometry and explicit semantic boundaries."""
from collections import defaultdict, deque
import math
import hashlib
from .ui_snapshot import fail, number

METHOD_VERSION = 'ag-ui-groups-v1'
DEFAULT_PARAMETERS = {'bucketSize':128,'neighborCap':12,'alignmentTolerance':1,'maxDistance':128,'comparableFilter':'same-kind'}
BOUNDARIES = {'page','landmark','section','group'}


def normalize_parameters(parameters=None):
    """Materialize equivalent defaults and reject every caller-selected budget expansion."""
    if parameters is None: parameters = {}
    if type(parameters) is not dict or set(parameters)-set(DEFAULT_PARAMETERS):
        fail('Invalid grouping parameters','invalid_provider')
    result = {**DEFAULT_PARAMETERS,**parameters}
    number(result['bucketSize'],minimum=32,maximum=512,integer=True)
    number(result['neighborCap'],minimum=1,maximum=12,integer=True)
    number(result['alignmentTolerance'],minimum=0,maximum=8)
    number(result['maxDistance'],minimum=0,maximum=512)
    if result['comparableFilter'] not in ('same-kind','controls-only','all-visible'):
        fail('Invalid comparable filter','invalid_provider')
    return result


def rectangle_metrics(a,b):
    """Measure edge gaps and intersection separately for CSS-pixel AABBs."""
    dx = max(0,a['x']-b['x']-b['width'],b['x']-a['x']-a['width'])
    dy = max(0,a['y']-b['y']-b['height'],b['y']-a['y']-a['height'])
    width = max(0,min(a['x']+a['width'],b['x']+b['width'])-max(a['x'],b['x']))
    height = max(0,min(a['y']+a['height'],b['y']+b['height'])-max(a['y'],b['y']))
    return {'dx':dx,'dy':dy,'distance':math.hypot(dx,dy),'intersectionArea':width*height,'unit':'CSS px'}


def group_id(prefix,node_id):
    """Keep deterministic graph identifiers bounded even when an imported node key is128 characters."""
    return prefix+':'+hashlib.sha256(node_id.encode()).hexdigest()


def semantic_groups(nodes,relations,checkpoint):
    """Keep explicit sections and field parts without inferring meaning from physical proximity."""
    by_id = {node['id']:node for node in nodes}
    groups, membership = [], {}
    for index,node in enumerate(nodes):
        if index%100==0: checkpoint()
        path, current = [], node['id']
        while current is not None and current not in membership:
            path.append(current); current = by_id[current]['parentId']
        boundary = membership.get(current)
        for item in reversed(path):
            candidate = by_id[item]
            if candidate['kind'] in BOUNDARIES or candidate.get('annotations',{}).get('boundary'):
                boundary = item
            membership[item] = boundary
    members = defaultdict(list)
    for node in nodes:
        boundary = membership[node['id']]
        if boundary: members[boundary].append(node['id'])
    # Imports need not be in DOM preorder. Retain ancestors before descendants so
    # the 1000-group cap cannot leave a retained group's parent outside the graph.
    depths = {}
    for boundary in members:
        path, current = [], boundary
        while current is not None and current not in depths:
            path.append(current)
            current = by_id[current]['parentId']
        depth = depths[current] if current is not None else -1
        for item in reversed(path):
            depth += 1
            depths[item] = depth
    ordered_boundaries = sorted(members,key=lambda key:(depths[key],by_id[key]['domOrder'],key))
    for boundary in ordered_boundaries[:1000]:
        items = members[boundary]
        parent = by_id[boundary]['parentId']
        parent_boundary = membership.get(parent)
        groups.append({'id':group_id('semantic',boundary),'parentId':group_id('semantic',parent_boundary) if parent_boundary else None,
                       'memberIds':items,'kind':'explicit','source':'dom-containment','confidence':'high',
                       'evidence':{'boundaryNodeId':boundary,'methodVersion':METHOD_VERSION}})
    field_members = defaultdict(set)
    for edge in relations:
        if edge['type'] in ('labels','describes'):
            target = edge['to'] if edge['type']=='labels' else edge['from']
            field_members[target].update((edge['from'],edge['to']))
    for target,items in field_members.items():
        if len(groups)>=1000: break
        boundary = membership.get(target)
        groups.append({'id':group_id('field',target),'parentId':group_id('semantic',boundary) if boundary else None,
                       'memberIds':sorted(items),'kind':'explicit','source':'dom-idref','confidence':'high',
                       'evidence':{'methodVersion':METHOD_VERSION}})
    return groups[:1000], membership


def _eligible(first,second,parameters):
    """Compare only visible peer candidates in the requested local family."""
    if first['visibility']!='visible' or second['visibility']!='visible': return False
    mode = parameters['comparableFilter']
    if mode=='same-kind' and first['kind']!=second['kind']: return False
    if mode=='controls-only' and (first['kind'] not in ('control','action') or second['kind'] not in ('control','action')): return False
    return True


def spatial_edges(nodes,membership,parameters,checkpoint,max_edges):
    """Use bounded bucket samples and neighbor caps; dense buckets never trigger an all-pairs pass."""
    bucket_size, cap = parameters['bucketSize'], parameters['neighborCap']
    buckets = defaultdict(deque)
    for node in nodes:
        rect = node['bounds']
        if rect is None or node['visibility']!='visible': continue
        key = (math.floor(rect['x']/bucket_size),math.floor(rect['y']/bucket_size))
        # Keep a deterministic bounded sample per bucket; all facts remain in the snapshot.
        if len(buckets[key])<cap: buckets[key].append(node)
    edges, checks, omitted, seen = [], 0, False, set()
    by_id = {node['id']:node for node in nodes}
    ancestors = {}
    for node in nodes:
        chain, current = set(), node['parentId']
        while current is not None:
            chain.add(current); current = by_id[current]['parentId']
        ancestors[node['id']] = chain
    for index,first in enumerate(nodes):
        if index%100==0: checkpoint()
        a = first['bounds']
        if a is None or first['visibility']!='visible': continue
        cell = (math.floor(a['x']/bucket_size),math.floor(a['y']/bucket_size))
        candidates = []
        for ox in (-1,0,1):
            for oy in (-1,0,1):
                for second in buckets.get((cell[0]+ox,cell[1]+oy),()):
                    checks += 1
                    if first['id']==second['id'] or not _eligible(first,second,parameters): continue
                    if membership.get(first['id'])!=membership.get(second['id']): continue
                    if first['id'] in ancestors[second['id']] or second['id'] in ancestors[first['id']]: continue
                    metric = rectangle_metrics(a,second['bounds'])
                    if metric['distance']<=parameters['maxDistance']:
                        candidates.append((metric['distance'],second['id'],second,metric))
        candidates.sort(key=lambda row:(row[0],row[1]))
        for _,_,second,metric in candidates[:cap]:
            ends = tuple(sorted((first['id'],second['id'])))
            if ends in seen: continue
            seen.add(ends)
            b = second['bounds']
            types = ['near']
            tolerance = parameters['alignmentTolerance']
            if abs(a['y']-b['y'])<=tolerance: types.append('same-row')
            if abs(a['x']-b['x'])<=tolerance: types.append('same-column')
            overlay = first.get('annotations',{}).get('intentionalOverlay') or second.get('annotations',{}).get('intentionalOverlay')
            if metric['intersectionArea'] and not overlay: types.append('overlapping')
            for kind in types:
                if len(edges)>=max_edges:
                    omitted = True; break
                edges.append({'id':kind+':'+hashlib.sha256(':'.join(ends).encode()).hexdigest(),'from':ends[0],'to':ends[1],'type':kind,
                              'evidence':metric,'methodVersion':METHOD_VERSION,'parameters':parameters,'confidence':'low'})
            if omitted: break
        if omitted: break
    return edges, {'candidateChecks':checks,'edgeLimitReached':omitted,'bucketCount':len(buckets),'bucketSampleLimit':cap}


def inferred_groups(edges,membership,max_groups,checkpoint):
    """Connect bounded nearby peers within a semantic boundary; the output remains advisory."""
    adjacent = defaultdict(set)
    for edge in edges:
        if edge['type']=='near':
            adjacent[edge['from']].add(edge['to']); adjacent[edge['to']].add(edge['from'])
    groups, visited = [], set()
    for start in sorted(adjacent):
        if start in visited: continue
        checkpoint()
        queue, members = [start], []
        while queue:
            current = queue.pop()
            if current in visited: continue
            visited.add(current); members.append(current)
            queue.extend(sorted(adjacent[current]-visited,reverse=True))
        if len(members)<2: continue
        if len(groups)>=max_groups: break
        boundary = membership.get(start)
        groups.append({'id':group_id('spatial',min(members)),'parentId':group_id('semantic',boundary) if boundary else None,
                       'memberIds':sorted(members),'kind':'inferred','source':'bounded-proximity','confidence':'low',
                       'evidence':{'methodVersion':METHOD_VERSION,'limitations':['uncalibrated-advisory']}})
    return groups
