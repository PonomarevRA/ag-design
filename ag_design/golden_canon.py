"""Versioned AG diagonal-grid geometry shared with the offline browser contract."""
import json
import math
from .config import resource_root
from .errors import DesignError


def grid_policy():
    """Read trusted shipped fractions, never caller-selected paths or external grid templates."""
    return json.loads((resource_root()/'catalog/golden-canon-grid.json').read_text(encoding='utf-8'))


def finite(value):
    """Accept bounded real coordinates without treating booleans as numeric evidence."""
    return type(value) in (int,float) and math.isfinite(value) and abs(value)<=1e10


def check_grid(width, height, anchors, tolerance=0.008):
    """Measure up to 200 unique declared points in carrier units with shorter-side relative tolerance."""
    if not finite(width) or not finite(height) or width<=0 or height<=0:
        raise DesignError('invalid_grid','Positive finite carrier dimensions required',422)
    if not finite(tolerance) or not 0<=tolerance<=0.05:
        raise DesignError('invalid_grid','Tolerance must be 0..0.05 of the shorter side',422)
    if not isinstance(anchors,list) or len(anchors)>200:
        raise DesignError('invalid_grid','At most 200 declared anchors',422)
    fractions=[a/b for a,b in grid_policy()['fractions']]
    points=[]
    for row in range(1,len(fractions)-1):
        for column in range(1,len(fractions)-1):
            points.append((f'x{column}-y{row}',fractions[column]*width,fractions[row]*height))
    ids=set();results=[];shorter=min(width,height)
    for anchor in anchors:
        if not isinstance(anchor,dict):
            raise DesignError('invalid_grid','Anchor object required',422)
        key=anchor.get('id');x=anchor.get('x');y=anchor.get('y')
        if not isinstance(key,str) or not 1<=len(key)<=180 or key in ids or not finite(x) or not finite(y):
            raise DesignError('invalid_grid','Unique bounded anchor id and finite coordinates required',422)
        ids.add(key)
        nearest=min(points,key=lambda p:math.hypot(x-p[1],y-p[2]))
        distance=math.hypot(x-nearest[1],y-nearest[2])
        inside=0<=x<=width and 0<=y<=height
        results.append({'id':key,'x':x,'y':y,'target':nearest[0],'targetX':nearest[1],'targetY':nearest[2],
                        'dx':x-nearest[1],'dy':y-nearest[2],'distance':distance,'normalizedDistance':distance/shorter,
                        'status':'hit' if inside and distance<=tolerance*shorter+1e-9 else 'miss'})
    return {'profile':grid_policy()['profile'],'width':width,'height':height,'tolerance':tolerance,
            'threshold':tolerance*shorter,'results':results,'coverage':{'measured':len(results),'hit':sum(x['status']=='hit' for x in results)},
            'status':'measured' if results else 'unknown','trust':'geometric-only'}
