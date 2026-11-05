"""Bounded structural UI snapshots: validate and redact before content-addressed retention."""
from copy import deepcopy
import hashlib
import json
import math
import re
import unicodedata
from decimal import Decimal
from datetime import datetime
from .errors import DesignError

SCHEMA = 'ag-design/ui-snapshot-v1'
MAX_NODES, MAX_EDGES, MAX_BYTES, MAX_DEPTH = 5000, 20000, 4*1024*1024, 128
STATES = {'disabled','expanded','selected','invalid','required','checked'}
KINDS = {'page','landmark','section','group','component','control','label','help','error','action','decorative'}
FACT_TYPES = {'contains','labels','describes','controls','dom-next','focus-next'}


def fail(message='Invalid structural snapshot', code='invalid_snapshot', status=422):
    """Raise a fixed safe public error without echoing caller contents."""
    raise DesignError(code, message, status)


def fields(value, allowed, required=()):
    """Reject unknown or omitted object fields without implicit coercion."""
    if type(value) is not dict or set(value)-set(allowed) or set(required)-set(value):
        fail()
    return value


def number(value, *, minimum=None, maximum=1e12, integer=False, nullable=False):
    """Validate finite JSON numbers; booleans never stand in for measurements."""
    if value is None and nullable:
        return value
    if type(value) not in (int,float) or not math.isfinite(value):
        fail()
    if integer and (type(value) is not int):
        fail()
    if minimum is not None and value < minimum or value > maximum:
        fail()
    return value


def string(value, maximum=1024, *, nullable=False, identifier=False):
    """Accept bounded Unicode text or safe opaque identifiers, never a URL identifier."""
    if value is None and nullable:
        return value
    if type(value) is not str or len(value)>maximum or any(0xD800<=ord(c)<=0xDFFF for c in value):
        fail()
    if identifier and not re.fullmatch(r'[A-Za-z0-9_.:-]{1,128}',value):
        fail()
    return unicodedata.normalize('NFC',value)


def enum(value, choices):
    """Validate explicit contract enums without fallbacks."""
    if not isinstance(value,str) or value not in choices:
        fail()


def boolean(value, nullable=False):
    """Distinguish unknown from an observed false state."""
    if type(value) is not bool and not (nullable and value is None):
        fail()


def rectangle(value, nullable=True):
    """Validate a viewport-relative AABB in CSS pixels, never painted ink."""
    if value is None and nullable:
        return
    fields(value,{'x','y','width','height'},{'x','y','width','height'})
    for key in value:
        number(value[key],minimum=0 if key in ('width','height') else -1e12)
        value[key] = round(value[key],3)


def _tree_guard(value):
    """Bound arbitrary JSON depth/bytes before recursive copying, canonicalization or schema walking."""
    stack, count = [(value,0)], 0
    while stack:
        item, depth = stack.pop()
        count += 1
        if depth > MAX_DEPTH or count > 500000:
            fail('Snapshot structural limit exceeded','limit_exceeded',413)
        if type(item) is dict:
            for key, child in item.items():
                string(key,128)
                stack.append((child,depth+1))
        elif type(item) is list:
            if len(item)>MAX_EDGES:
                fail('Snapshot array limit exceeded','limit_exceeded',413)
            stack.extend((child,depth+1) for child in item)
        elif type(item) is str:
            string(item)
        elif item is not None and type(item) not in (bool,int,float):
            fail()
        elif type(item) in (int,float):
            number(item,minimum=-1e12,maximum=1e12)
    try:
        size = len(json.dumps(value,ensure_ascii=False,allow_nan=False,separators=(',',':')).encode('utf-8'))
    except (ValueError,TypeError,UnicodeError):
        fail()
    if size > MAX_BYTES:
        fail('Snapshot byte limit exceeded','limit_exceeded',413)


def _number_text(value):
    """Encode finite numbers with ECMAScript decimal/exponent thresholds used by RFC8785."""
    if not math.isfinite(value):
        fail()
    if value == 0:
        return '0'
    absolute = abs(value)
    if absolute >= 1e-6 and absolute < 1e21:
        text = format(Decimal(str(value)), 'f')
        if '.' in text:
            text = text.rstrip('0').rstrip('.')
        return text
    raw = repr(float(value)).lower()
    if 'e' in raw:
        mantissa, exponent = raw.split('e')
        mantissa = mantissa.removesuffix('.0')
        exponent = int(exponent)
        return mantissa+'e'+('+' if exponent>=0 else '-')+str(abs(exponent))
    return raw.removesuffix('.0')


def canonical_json(value):
    """Encode normalized JSON deterministically; hash only already-sanitized snapshots."""
    if value is None:
        return 'null'
    if type(value) is bool:
        return 'true' if value else 'false'
    if type(value) in (int,float):
        return _number_text(value)
    if type(value) is str:
        return json.dumps(unicodedata.normalize('NFC',value),ensure_ascii=False)
    if type(value) is list:
        return '['+','.join(canonical_json(item) for item in value)+']'
    if type(value) is dict:
        normalized = {}
        for key,item in value.items():
            key = string(key)
            if key in normalized:
                fail()
            normalized[key] = item
        ordered = sorted(normalized,key=lambda key:key.encode('utf-16-be'))
        return '{'+','.join(canonical_json(key)+':'+canonical_json(normalized[key]) for key in ordered)+'}'
    fail()


def _source_environment(snapshot):
    """Validate source provenance and the environment needed to compare measured snapshots."""
    source = fields(snapshot['source'],{'kind','artifactId','scenarioId','stateId','adapter','adapterVersion','provenance','capabilities'},
                    {'kind','artifactId','scenarioId','stateId','adapter','adapterVersion','provenance','capabilities'})
    enum(source['kind'],{'browser-dom','static-tree','screenshot-reference'})
    enum(source['provenance'],{'caller-reported'})
    for key in ('artifactId','scenarioId','stateId','adapter','adapterVersion'):
        string(source[key],identifier=True)
    if type(source['capabilities']) is not list or len(source['capabilities'])>32:
        fail()
    for item in source['capabilities']:
        string(item,identifier=True)
    env = fields(snapshot['environment'],{'viewport','scroll','dpr','browser','browserVersion','theme','contrast','textScale','zoom','direction','writingMode'},
                 {'viewport','scroll','dpr','browser','browserVersion','theme','contrast','textScale','zoom','direction','writingMode'})
    for key, keys in (('viewport',{'width','height'}),('scroll',{'x','y'})):
        fields(env[key],keys,keys)
        for value in env[key].values():
            number(value,minimum=0 if key=='viewport' else -1e12)
    for key in ('dpr','textScale','zoom'):
        number(env[key],minimum=0.01,maximum=100,nullable=True)
    for key in ('browser','browserVersion','writingMode'):
        string(env[key],nullable=True)
    enum(env['theme'],{'light','dark','unknown'})
    enum(env['contrast'],{'standard','increased','unknown'})
    enum(env['direction'],{'ltr','rtl','unknown'})


def _node_optional(node):
    """Validate only declarative, bounded optional geometry/styles and host annotations."""
    if 'stableKey' in node:
        string(node['stableKey'],identifier=True)
    if 'component' in node:
        component = fields(node['component'],{'id','version','anchor','verified'},{'id','version','anchor','verified'})
        for key in ('id','version','anchor'):
            string(component[key],identifier=True)
        boolean(component['verified'])
        # Imported metadata is a caller claim, not a package verifier's attestation.
        component['verified'] = False
    if 'geometry' in node:
        geometry = fields(node['geometry'],{'hitBounds','inkBounds','baseline','source','method'}, {'source','method'})
        string(geometry['source'],identifier=True)
        string(geometry['method'],identifier=True)
        for key in ('hitBounds','inkBounds'):
            if key in geometry:
                rectangle(geometry[key])
        if 'baseline' in geometry:
            number(geometry['baseline'],nullable=True,minimum=-1e12)
    if 'style' in node:
        style = fields(node['style'],{'foreground','background','fontSize','fontWeight','radii','padding','gap','spacingToken'})
        for key,value in style.items():
            if key in ('foreground','background'):
                if type(value) is not str or not re.fullmatch(r'#[0-9a-fA-F]{6}|rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)',value):
                    fail()
                channels = re.findall(r'\d+',value) if value.startswith('rgb') else []
                if any(int(channel)>255 for channel in channels): fail()
            elif key=='spacingToken':
                string(value,identifier=True)
            elif key in ('radii','padding'):
                if type(value) is not list or len(value)!=4:
                    fail()
                for part in value:
                    number(part,minimum=0)
            else:
                number(value,minimum=0)
    if 'annotations' in node:
        notes = fields(node['annotations'],{'alignment','corner','intentionalOverlay','boundary','targetException'})
        for key in ('intentionalOverlay','boundary'):
            if key in notes:
                boolean(notes[key])
        if 'targetException' in notes:
            string(notes['targetException'])
        if 'alignment' in notes:
            axis = fields(notes['alignment'],{'group','axis','anchor','value'},{'group','axis','anchor','value'})
            string(axis['group'],identifier=True)
            enum(axis['axis'],{'x','y'})
            enum(axis['anchor'],{'start','center','end','baseline'})
            number(axis['value'],minimum=-1e12)
        if 'corner' in notes:
            corner = fields(notes['corner'],{'parentId','outerRadius','inset','childRadius','circular','uniform'},
                            {'parentId','outerRadius','inset','childRadius','circular','uniform'})
            string(corner['parentId'],identifier=True)
            for key in ('outerRadius','inset','childRadius'):
                number(corner[key],minimum=0)
            boolean(corner['circular']); boolean(corner['uniform'])


def _nodes(snapshot):
    """Validate node records and one rooted, acyclic containment tree without storing private DOM IDs."""
    nodes = snapshot['nodes']
    if type(nodes) is not list or not 1<=len(nodes)<=MAX_NODES:
        fail('Snapshot node limit exceeded','limit_exceeded',413)
    ids, parents, keys = set(), {}, set()
    required = {'id','parentId','kind','tag','role','name','bounds','visibility','clipping','state','domOrder','focusOrder','focusOrderSource'}
    for node in nodes:
        fields(node,required|{'component','stableKey','geometry','style','annotations'},required)
        string(node['id'],identifier=True)
        if node['id'] in ids:
            fail('Duplicate node reference','invalid_reference')
        ids.add(node['id'])
        if node['parentId'] is not None:
            string(node['parentId'],identifier=True)
        parents[node['id']] = node['parentId']
        enum(node['kind'],KINDS)
        for key in ('tag','role'):
            string(node[key],128,nullable=True)
        name = fields(node['name'],{'present','source','text','redacted','completeness'},{'present','source','text','redacted','completeness'})
        boolean(name['present'],nullable=True); boolean(name['redacted'])
        enum(name['source'],{'native-label','aria-label','aria-labelledby','text','adapter-ax','unknown'})
        enum(name['completeness'],{'exact','approximate','unknown'})
        string(name['text'],256,nullable=True)
        text_forbidden = snapshot['privacy']['mode']=='structural' or name['redacted']
        if text_forbidden and name['text'] is not None:
            fail('Snapshot contains unapproved text')
        rectangle(node['bounds'])
        if snapshot['source']['kind']!='browser-dom' and node['bounds'] is not None:
            fail('Static sources cannot claim browser geometry')
        enum(node['visibility'],{'visible','hidden','offscreen','unknown'})
        enum(node['clipping'],{'none','partial','full','unknown'})
        fields(node['state'],STATES,STATES)
        for value in node['state'].values(): boolean(value,nullable=True)
        number(node['domOrder'],integer=True,minimum=0)
        number(node['focusOrder'],integer=True,minimum=0,nullable=True)
        enum(node['focusOrderSource'],{'observed','declared','unknown'})
        _node_optional(node)
        if 'stableKey' in node:
            if node['stableKey'] in keys: fail('Duplicate stable key','invalid_reference')
            keys.add(node['stableKey'])
    for node in nodes:
        corner = node.get('annotations',{}).get('corner')
        if corner and (corner['parentId'] not in ids or parents[node['id']]!=corner['parentId']):
            fail('Corner parent is not a containing node','invalid_reference')
    root = snapshot['scope']['rootId']
    if root not in ids or parents[root] is not None:
        fail('Invalid capture root','invalid_reference')
    for key in ids:
        seen, current = set(), key
        while current is not None:
            if current not in parents or current in seen or len(seen)>MAX_DEPTH:
                fail('Invalid containment path','invalid_reference')
            seen.add(current); current = parents[current]
        if root not in seen:
            fail('Node outside capture root','invalid_reference')
    return ids


def _relations(snapshot, ids):
    """Validate resolved references separately from safely redacted missing-target facts."""
    relations = snapshot['relations']
    if type(relations) is not list or len(relations)>MAX_EDGES:
        fail('Snapshot edge limit exceeded','limit_exceeded',413)
    seen = set()
    parents = {node['id']:node['parentId'] for node in snapshot['nodes']}
    for edge in relations:
        fields(edge,{'id','from','to','type','source','completeness'},{'id','from','to','type','source','completeness'})
        for key in ('id','from','to','source'): string(edge[key],identifier=True)
        if edge['id'] in seen or edge['from'] not in ids or edge['to'] not in ids:
            fail('Invalid relation reference','invalid_reference')
        seen.add(edge['id']); enum(edge['type'],FACT_TYPES)
        if edge['type']=='contains' and parents[edge['to']]!=edge['from']:
            fail('Containment facts disagree','invalid_reference')
        enum(edge['completeness'],{'exact','approximate','unknown'})
    unresolved = snapshot.get('unresolvedRelations',[])
    if type(unresolved) is not list or len(unresolved)+len(relations)>MAX_EDGES:
        fail('Snapshot edge limit exceeded','limit_exceeded',413)
    for edge in unresolved:
        fields(edge,{'from','type','targetMissing','source'},{'from','type','targetMissing','source'})
        if edge['from'] not in ids or edge['targetMissing'] is not True:
            fail('Invalid missing relation','invalid_reference')
        enum(edge['type'],FACT_TYPES); string(edge['source'],identifier=True)


def _hash_validated(snapshot):
    """Hash stable sanitized facts, excluding caller correlation/time and server identity."""
    value = {key:item for key,item in snapshot.items() if key not in {'capturedAt','captureId','snapshotId','contentHash'}}
    value['relations'] = sorted(value['relations'],key=lambda edge:(edge['type'],edge['from'],edge['to'],edge['id']))
    return hashlib.sha256(canonical_json(value).encode('utf-8')).hexdigest()


def validate_snapshot(payload):
    """Validate a bounded untrusted snapshot, return an owned immutable-by-convention normalized copy."""
    _tree_guard(payload)
    required = {'schemaVersion','capturedAt','captureId','source','environment','scope','nodes','relations','coverage','privacy'}
    fields(payload,required|{'snapshotId','contentHash','unresolvedRelations'},required)
    if payload['schemaVersion'] != SCHEMA:
        fail('Unsupported snapshot schema','unsupported_schema')
    result = deepcopy(payload)
    string(result['capturedAt'],64); string(result['captureId'],identifier=True)
    try:
        captured = datetime.fromisoformat(result['capturedAt'].replace('Z','+00:00'))
        if captured.utcoffset() is None or captured.utcoffset().total_seconds()!=0: fail()
    except ValueError:
        fail('Capture time must be ISO UTC')
    privacy = fields(result['privacy'],{'mode','redacted','textRetained','screenshotsIncluded'}, {'mode','redacted','textRetained','screenshotsIncluded'})
    enum(privacy['mode'],{'structural','approved-text'})
    if privacy['redacted'] is not True or privacy['screenshotsIncluded'] is not False:
        fail('Snapshot privacy contract is not satisfied')
    boolean(privacy['textRetained'])
    if privacy['mode']=='structural' and privacy['textRetained']:
        fail('Structural snapshots cannot retain text')
    _source_environment(result)
    scope = fields(result['scope'],{'rootId','coordinateSpace','selection','label'},{'rootId','coordinateSpace','selection'})
    string(scope['rootId'],identifier=True)
    enum(scope['coordinateSpace'],{'viewport-css-px'}); enum(scope['selection'],{'explicit-root'})
    if 'label' in scope:
        string(scope['label'])
        if privacy['mode']=='structural': fail('Structural snapshots cannot retain labels')
    ids = _nodes(result); _relations(result,ids)
    coverage = fields(result['coverage'],{'status','inspected','omitted','reasons','unsupported','scope'}, {'status','inspected','omitted','reasons','unsupported','scope'})
    enum(coverage['status'],{'complete','partial','unsupported','unstable'})
    enum(coverage['scope'],{'explicit-root'})
    number(coverage['inspected'],integer=True,minimum=0)
    number(coverage['omitted'],integer=True,minimum=0,nullable=True)
    if coverage['inspected']!=len(result['nodes']): fail()
    for key in ('reasons','unsupported'):
        if type(coverage[key]) is not list or len(coverage[key])>128: fail()
        for item in coverage[key]: string(item,identifier=True)
    has_omissions = coverage['omitted']!=0
    has_limitations = bool(coverage['reasons'] or coverage['unsupported'])
    if coverage['status']=='complete' and (has_omissions or has_limitations):
        fail('Incomplete capture cannot claim complete coverage')
    digest = _hash_validated(result)
    if any(key in payload and payload[key]!=digest for key in ('contentHash','snapshotId')):
        fail('Snapshot hash mismatch','hash_mismatch',409)
    result.update(snapshotId=digest,contentHash=digest)
    return result


def snapshot_hash(payload):
    """Return a normalized content hash after the same import validation used by the store."""
    return validate_snapshot(payload)['contentHash']
