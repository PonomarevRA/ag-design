"""Bounded grid geometry and per-purpose discovery; coordinates are evidence, never aesthetic scores."""
import json
import math
from copy import deepcopy
from .config import resource_root
from .errors import DesignError
from .golden_canon import finite, grid_policy
from . import composition_grid_profiles as framing

VERSION = 'ag-design/layout-grid-v1'
TYPES = ('golden-canon','columns','modular','baseline','spacing','thirds','manuscript',*framing.FIELDS)
SCALE = {'css-px':1,'pt':.75,'emu':9525}
KINDS = ('point','x-line','y-line','baseline','guide')


def invalid(message):
    """Fail closed before allocating geometry or replacing a saved capture."""
    raise DesignError('invalid_layout_grid', 'Invalid layout grid: '+message, 422)


def number(value, name, minimum=-1e10, maximum=1e10):
    """Reject booleans, non-finite coordinates and unsafe extents."""
    if not finite(value) or not minimum <= value <= maximum:
        invalid(name)
    return value


def identity(value, name):
    """Keep IDs explicit and bounded; they are never interpreted as paths or selectors."""
    if not isinstance(value,str) or not 1 <= len(value) <= 180:
        invalid(name)
    return value


def fields(value, allowed, name):
    """Reject unknown fields so text/unsupported configuration cannot be silently accepted."""
    if not isinstance(value,dict) or set(value)-set(allowed):
        invalid(name)


def rectangle(value):
    """Validate a carrier's border box in its immediate parent's declared coordinates."""
    fields(value,('x','y','width','height'),'rect')
    return {k:number(value.get(k),'rect.'+k,.000001 if k in ('width','height') else -1e10) for k in ('x','y','width','height')}


def specification(width,height,unit,grid):
    """Resolve AG defaults in a single unit; counts respond to the carrier, not a guessed device."""
    if not isinstance(unit,str) or unit not in SCALE:
        invalid('unit')
    scale=SCALE[unit]
    fields(grid,('type','columns','rows','margin','gutter','step','offset','edge','insetRatio','focusRatio','eyeLevel','vanishX','vanishY','flipX','flipY'),'grid')
    kind=grid.get('type')
    if kind not in TYPES:
        invalid('type')
    config={'type':kind,**framing.defaults(kind)}
    if kind in ('columns','modular','manuscript'):
        config['margin']=min(16*scale,min(width,height)/8)
    if kind in ('columns','modular'):
        config.update(columns=4 if kind=='modular' or width/scale<480 else 8 if width/scale<960 else 12,gutter=16*scale)
    if kind=='modular':
        config['rows']=4
    if kind in ('baseline','spacing'):
        config.update(step=(24 if kind=='baseline' else 8)*scale,offset=0)
    allowed={
        'golden-canon':('type',),'thirds':('type',),'manuscript':('type','margin'),
        'columns':('type','columns','margin','gutter'),'modular':('type','columns','rows','margin','gutter'),
        'baseline':('type','step','offset'),'spacing':('type','step','offset'),**framing.FIELDS,
    }[kind]
    if set(grid)-set(allowed):
        invalid('unsupported option')
    config.update(grid)
    if 'edge'in config and config['edge']not in (('left','right')if kind=='lead-room'else('left','right','top','bottom')):invalid('edge')
    for key in ('flipX','flipY'):
        if key in config and type(config[key])is not bool:invalid(key)
    for key,minimum,maximum in (('insetRatio',.05,.4),('focusRatio',.1,.9),('eyeLevel',.1,.6),('vanishX',.1,.9),('vanishY',.1,.9)):
        if key in config:number(config[key],key,minimum,maximum)
    for key in ('columns','rows'):
        if key in config:
            number(config[key],key,1,24)
            if int(config[key])!=config[key]:
                invalid(key)
    for key in ('margin','gutter','offset'):
        if key in config:
            number(config[key],key,0)
    if 'step' in config:
        number(config['step'],'step',.000001)
    if 'margin' in config and config['margin']*2>=min(width,height):
        invalid('margin leaves no content')
    return config


def tracks(length,count,margin,gutter):
    """Generate both equal-track edges while preserving explicit empty gutters."""
    count=int(count)
    extent=(length-margin*2-gutter*(count-1))/count
    if extent<=0:
        invalid('tracks do not fit')
    values=[]
    for i in range(count):
        values.extend((margin+i*(extent+gutter),margin+i*(extent+gutter)+extent))
    return sorted(set(values))


def repeated(length,step,offset):
    """Bound the number of guides before allocating repeated coordinates."""
    if offset>length:
        invalid('offset')
    count=math.floor((length-offset)/step+1e-10)+1
    if count>257:
        invalid('axis line budget')
    return [offset+i*step for i in range(count)]


def geometry(width,height,grid=None,unit='css-px'):
    """Build local guides and special focal points without materializing a regular Cartesian lattice."""
    number(width,'width',.000001)
    number(height,'height',.000001)
    config=specification(width,height,unit,grid if grid is not None else {'type':'golden-canon'})
    kind=config['type']
    x=[];y=[];points=[];diagonals=[];regions=[];circles=[]
    if kind=='golden-canon':
        fractions=[a/b for a,b in grid_policy()['fractions']]
        x=[f*width for f in fractions];y=[f*height for f in fractions]
        for row in range(1,len(y)-1):
            for col in range(1,len(x)-1):
                points.append({'id':f'x{col}-y{row}','x':x[col],'y':y[row]})
        for left,top,w,h in ((0,0,width,height),(0,0,width/2,height),(width/2,0,width/2,height),(0,0,width,height/2),(0,height/2,width,height/2)):
            diagonals.extend(({'x1':left,'y1':top,'x2':left+w,'y2':top+h},{'x1':left+w,'y1':top,'x2':left,'y2':top+h}))
    elif kind=='thirds':
        x=[width/3,width*2/3];y=[height/3,height*2/3]
        points=[{'id':f'x{col}-y{row}','x':x[col],'y':y[row]} for row in range(2) for col in range(2)]
    elif kind in ('columns','modular'):
        x=tracks(width,config['columns'],config['margin'],config['gutter'])
        if kind=='modular':
            y=tracks(height,config['rows'],config['margin'],config['gutter'])
    elif kind=='manuscript':
        x=[config['margin'],width-config['margin']];y=[config['margin'],height-config['margin']]
        regions=[{'id':'content','x':x[0],'y':y[0],'width':x[1]-x[0],'height':y[1]-y[0]}]
    elif kind in framing.FIELDS:
        authored=framing.geometry(width,height,config);x=authored['x'];y=authored['y'];points=authored['points'];diagonals=authored['diagonals'];regions=authored['regions'];circles=authored.get('circles',[])
    else:
        y=repeated(height,config['step'],config['offset'])
        if kind=='spacing':
            x=repeated(width,config['step'],config['offset'])
    if len(x)+len(y)>512:
        invalid('scope line budget')
    return {'schemaVersion':VERSION,'profile':'ag-diagonal-core-v1' if kind=='golden-canon' else f'ag-{kind}-v1',
            'width':width,'height':height,'unit':unit,'config':config,'x':x,'y':y,'points':points,'diagonals':diagonals,'regions':regions,**({'circles':circles}if circles else {}),
            'defaultKind':'x-line' if kind=='columns' else 'baseline' if kind=='baseline' else 'point'}


def nearest(values,value):
    """Preserve lower-index ties so Python and the offline browser choose the same target."""
    best=None
    for index,candidate in enumerate(values):
        distance=abs(value-candidate)
        if best is None or distance<best['distance']:
            best={'index':index,'value':candidate,'distance':distance}
    return best


def check_geometry(shape,anchors,tolerance):
    """Evaluate explicit compatible anchor kinds; missing measurements remain unknown with a reason."""
    if not isinstance(anchors,list) or len(anchors)>256:
        invalid('anchors')
    number(tolerance,'tolerance',0,.05)
    ids=set();results=[];threshold=min(shape['width'],shape['height'])*tolerance
    for anchor in anchors:
        fields(anchor,('id','ownerId','x','y','kind','unknownReason','baselineSource'),'anchor')
        key=identity(anchor.get('id'),'anchor.id');kind=anchor.get('kind',shape['defaultKind'])
        if key in ids or kind not in KINDS:
            invalid('anchor identity/kind')
        ids.add(key)
        for axis in ('x','y'):
            if axis in anchor:
                number(anchor[axis],'anchor.'+axis)
        if 'unknownReason' in anchor:
            identity(anchor['unknownReason'],'unknownReason')
        owner={}
        if 'ownerId' in anchor:
            owner['ownerId']=identity(anchor['ownerId'],'ownerId')
        if 'baselineSource' in anchor and anchor['baselineSource'] not in ('renderer-baseline','native-text-engine'):
            invalid('baselineSource')
        missing=('x' not in anchor if kind=='x-line' else 'y' not in anchor) or kind in ('point','guide') and 'x' not in anchor
        reason=anchor.get('unknownReason') or ('measurement-unavailable' if missing else None)
        if kind=='baseline' and shape['config']['type']!='baseline':
            reason='baseline-grid-required'
        if kind=='baseline' and not anchor.get('baselineSource'):
            reason='baseline-provenance-required'
        if reason:
            results.append({'id':key,'kind':kind,**owner,'x':anchor.get('x'),'y':anchor.get('y'),'status':'unknown','reason':reason});continue
        target=None
        if kind=='guide':
            target=framing.nearest_guide(shape,anchor)
        elif kind=='point':
            if shape['points']:
                for point in shape['points']:
                    distance=math.hypot(anchor['x']-point['x'],anchor['y']-point['y'])
                    if target is None or distance<target['distance']:
                        target={**point,'distance':distance}
            else:
                nx=nearest(shape['x'],anchor['x']);ny=nearest(shape['y'],anchor['y'])
                if nx and ny:
                    target={'id':f"x{nx['index']}-y{ny['index']}",'x':nx['value'],'y':ny['value'],'distance':math.hypot(anchor['x']-nx['value'],anchor['y']-ny['value'])}
        else:
            horizontal=kind!='x-line';axis='y' if horizontal else 'x'
            n=nearest(shape[axis],anchor[axis])
            if n:
                target={'id':axis+str(n['index']),'x':anchor.get('x') if horizontal else n['value'],'y':n['value'] if horizontal else anchor.get('y'),'distance':n['distance']}
        if target is None:
            results.append({'id':key,'kind':kind,**owner,'x':anchor.get('x'),'y':anchor.get('y'),'status':'unknown','reason':'no-compatible-target'});continue
        x=anchor.get('x');y=anchor.get('y')
        inside=(x is None or 0<=x<=shape['width']) and (y is None or 0<=y<=shape['height'])
        dx=None if x is None or target['x'] is None else x-target['x']
        dy=None if y is None or target['y'] is None else y-target['y']
        result={'id':key,'kind':kind,**owner,'x':x,'y':y,'target':target['id'],'targetX':target['x'],'targetY':target['y'],
                'dx':dx,'dy':dy,'distance':target['distance'],'normalizedDistance':target['distance']/min(shape['width'],shape['height']),
                'status':'hit' if inside and target['distance']<=threshold+1e-9 else 'miss'}
        if kind=='baseline':
            result['baselineSource']=anchor['baselineSource']
        results.append(result)
    coverage={'measured':0,'hit':0,'miss':0,'unknown':0,'total':len(results)}
    for result in results:
        coverage[result['status']]+=1
        if result['status']!='unknown':
            coverage['measured']+=1
    return {'schemaVersion':VERSION,'geometry':shape,'unit':shape['unit'],'tolerance':tolerance,'threshold':threshold,
            'results':results,'coverage':coverage,'status':'measured' if coverage['measured'] else 'unknown','trust':'caller-reported-geometric-only'}


def check_tree(raw):
    """Resolve parent-before-child local carriers with independent profiles and explicit per-axis provenance."""
    fields(raw,('unit','tolerance','scopes'),'tree')
    unit=raw.get('unit','css-px');tolerance=raw.get('tolerance',.008);scopes=raw.get('scopes')
    if not isinstance(scopes,list) or len(scopes)>32:
        invalid('scope budget')
    if not isinstance(unit,str) or unit not in SCALE:
        invalid('unit')
    number(tolerance,'tolerance',0,.05)
    resolved={};reports=[];anchor_count=0;line_count=0
    for scope in scopes:
        fields(scope,('id','parentId','rect','grid','anchors','inheritAxes'),'scope')
        key=identity(scope.get('id'),'scope.id');rect=rectangle(scope.get('rect'));parent_id=scope.get('parentId')
        if key in resolved:
            invalid('duplicate scope')
        if parent_id is not None:
            identity(parent_id,'parentId')
        parent=resolved.get(parent_id)
        if parent_id is not None and parent is None:
            invalid('parent must precede child')
        inherit=scope.get('inheritAxes')
        if 'inheritAxes' in scope and (not parent or inherit not in ('x','y','both')):
            invalid('inheritAxes')
        if 'grid' in scope and scope['grid'] is None:
            invalid('grid')
        shape=geometry(rect['width'],rect['height'],scope.get('grid'),unit)
        shape['axisSources']={axis:{'scopeId':key,'profile':shape['profile']} for axis in ('x','y')}
        if inherit:
            for axis in ('x','y'):
                if inherit in (axis,'both'):
                    extent=rect['width'] if axis=='x' else rect['height']
                    shape[axis]=[value-rect[axis] for value in parent['geometry'][axis] if 0<=value-rect[axis]<=extent]
                    shape['axisSources'][axis]=deepcopy(parent['geometry']['axisSources'][axis])
            shape['points']=[];shape['diagonals']=[];shape['regions']=[];shape.pop('circles',None)
            shape['localProfile']=shape['profile'];shape['profile']='ag-inherited-guides-v1'
            shape['inheritance']={'scopeId':parent_id,'axes':inherit,'method':'guide-projection-not-css-track-sizing'}
        anchors=scope.get('anchors',[])
        if not isinstance(anchors,list):
            invalid('anchors')
        anchor_count+=len(anchors);line_count+=len(shape['x'])+len(shape['y'])
        if len(shape['x'])+len(shape['y'])>512:
            invalid('scope line budget')
        if anchor_count>256 or line_count>2048:
            invalid('tree geometry budget')
        origin={axis:rect[axis]+(parent['origin'][axis] if parent else 0) for axis in ('x','y')}
        report={'id':key,'parentId':parent_id,'rect':rect,'origin':origin,**check_geometry(shape,anchors,tolerance)}
        reports.append(report);resolved[key]=report
    return {'schemaVersion':'ag-design/layout-grid-tree-v1','unit':unit,'tolerance':tolerance,'scopes':reports,'trust':'caller-reported-geometric-only'}


def grid_catalog(query=''):
    """Search fixed shipped RU/EN purpose metadata; recommendations are authored guidance, not quality ranking."""
    if not isinstance(query,str) or len(query)>256:
        invalid('query')
    data=json.loads((resource_root()/'catalog/layout-grids.json').read_text(encoding='utf-8'))
    tokens=query.casefold().replace('-',' ').split()
    items=[]
    for item in data['items']:
        haystack=json.dumps(item,ensure_ascii=False).casefold().replace('-',' ')
        if all(token in haystack for token in tokens):
            items.append(item)
    return {**data,'items':items,'total':len(items),'selection':'authored-purpose-guidance','query':query}
