"""Bounded brand boards and explicit screen transitions; data never becomes code or a URL."""
import re
from .studio_validation import color, fields, identity, invalid, items, number, text
from .composition_store import encoded

SCHEMA = 'ag-design/brand-studio-v1'
MAX_BYTES = 524288


def studio_contract():
    """Return a small authoring contract and valid empty template so agents need not infer field names."""
    return {'schema':SCHEMA,'limits':{'documentBytes':MAX_BYTES,'objects':100,'screens':32,'transitions':128,'snapshotBytes':1_048_576},
            'chapters':['creative-direction','creative-measurement','trend-research','brand-book','design-system-governance','customer-journey-prototype','brand-interchange','form-quality-common','form-funnel','form-operations','journey-testing-retention'],
            'template':{'schema':SCHEMA,'title':'Brand book','brief':{'audience':'','goal':'','positioning':'','evidence':''},
                        'board':{'width':1200,'height':800,'background':'#ffffff','objects':[]},
                        'screens':[],'transitions':[],'startScreenId':None,'testPlan':{'purpose':'operations','tasks':[]}},
            'object':{'id':'primary','type':'swatch','title':'Primary','x':40,'y':40,'width':200,'height':140,
                      'rotation':0,'color':'#006d77','text':'','fontSize':24,'fontWeight':600,'hidden':False,'locked':False},
            'screen':{'id':'screen-1','title':'Screen','state':'Default','x':48,'y':48,
                      'source':{'documentId':'prepared-composition-id','revision':1,'documentHash':'exact-sha256-from-inspect'}},
            'transition':{'id':'next','from':'screen-1','to':'screen-2','action':'Continue','condition':'Explicit human choice','triggerNodeId':None},
            'testTask':{'id':'task-1','title':'Neutral task','instruction':'Reach a meaningful user goal without naming buttons.',
                        'entryScreenId':'screen-1','goalScreenIds':['screen-2'],'requiredTransitionIds':['next']},
            'retention':{'temporaryDefaultSeconds':86400,'minimumSeconds':3600,'maximumSeconds':604800,
                         'renewal':'sliding on addressed inspect, edit, test, export or touch; never list, report, health or idle UI',
                         'cleanupSeconds':60,'trialSeconds':86400,'trialLimit':64,'eventsPerTrial':256,
                         'storage':'separate compressed cache outside durable backup root; permanent documents remain permanent'},
            'formRequirements':'Read design_form_requirements(funnel|operations); manual observations never certify WCAG or business operations.',
            'workflow':['Read brief and relevant chapters; keep facts and assumptions separate.',
                        'Prepare/inspect actual AG compositions and pin screen IDs, revisions and hashes.',
                        'Create explicitly; create is not idempotent. After timeout list/inspect before creating again.',
                        'Command replace/undo/redo uses expectedRevision, authorId and stable idempotencyKey; exact retries recover acknowledgement.',
                        'Prefer a temporary copy for trials; inspect and deliberate activity slide its bounded retention, expired IDs cannot be revived.',
                        'Declare a testPlan, start a pinned trial, record only graph edges/back/reset, finish with a separate reported outcome and optional manual checks.',
                        'SVG exports board primitives, JSON archives AG snapshots, tokens exports DTCG colors; PPTX exports editable graph, schematic screen cards and exact-revision results. Live forms and Figma components are not preserved.'],
            'limitations':'No arbitrary HTML/JS/URLs, automatic condition evaluation, native .fig or JSON cross-server import. Storage capacity fails explicitly rather than deleting history.'}


def board_object(raw):
    """Normalize one primitive shared by the editable board and standalone SVG export."""
    fields(raw, {'id','type','title','x','y','width','height','rotation','color','text','fontSize','fontWeight','hidden','locked'})
    if raw['type'] not in ('text', 'rect', 'ellipse', 'swatch'):
        invalid()
    if type(raw['hidden']) is not bool or type(raw['locked']) is not bool:
        invalid()
    if raw['fontWeight'] not in (400, 500, 600, 700, 800) or type(raw['fontWeight']) is bool:
        invalid()
    return {**raw, 'id':identity(raw['id']), 'title':text(raw['title']),
            'x':number(raw['x'],0,4096), 'y':number(raw['y'],0,4096),
            'width':number(raw['width'],16,4096), 'height':number(raw['height'],16,4096),
            'rotation':number(raw['rotation'],-180,180), 'color':color(raw['color']),
            'text':text(raw['text'],4096,empty=True), 'fontSize':number(raw['fontSize'],8,160)}


def normalize_document(raw):
    """Validate a whole atomic document; unreachable nodes and cycles are permitted, dangling edges are not."""
    encoded(raw, MAX_BYTES)
    base_fields = {'schema','title','brief','board','screens','transitions','startScreenId'}
    fields(raw,base_fields|{'testPlan'},base_fields)
    if raw['schema'] != SCHEMA:
        invalid()
    brief = fields(raw['brief'], {'audience','goal','positioning','evidence'})
    brief = {key:text(value,2048,empty=True) for key,value in brief.items()}
    board = fields(raw['board'], {'width','height','background','objects'})
    width, height = number(board['width'],240,4096), number(board['height'],200,4096)
    objects = [board_object(item) for item in items(board['objects'],100)]
    for item in objects:
        if item['x'] + item['width'] > width or item['y'] + item['height'] > height:
            invalid()
    screens = []
    for item in items(raw['screens'],32):
        fields(item, {'id','title','state','x','y','source'})
        source = fields(item['source'], {'documentId','revision','documentHash'})
        revision = number(source['revision'],1,1_000_000)
        if type(revision) is not int or not re.fullmatch(r'[a-f0-9]{64}', str(source['documentHash'])):
            invalid()
        screens.append({**item,'title':text(item['title']), 'state':text(item['state'],1024,empty=True),
                        'x':number(item['x'],0,8192),'y':number(item['y'],0,8192),
                        'source':{**source,'documentId':identity(source['documentId'])}})
    ids = {screen['id'] for screen in screens}
    transitions = []
    for edge in items(raw['transitions'],128):
        fields(edge, {'id','from','to','action','condition','triggerNodeId'})
        identity(edge['from'])
        identity(edge['to'])
        if edge['from'] not in ids or edge['to'] not in ids:
            invalid()
        trigger = edge['triggerNodeId']
        if trigger is not None:
            identity(trigger)
        transitions.append({**edge,'action':text(edge['action']),
                            'condition':text(edge['condition'],1024,empty=True)})
    if raw['startScreenId'] is not None:
        identity(raw['startScreenId'])
    if ids:
        if raw['startScreenId'] not in ids:
            invalid()
    elif raw['startScreenId'] is not None:
        invalid()
    result = {**raw,'title':text(raw['title']), 'brief':brief,
            'board':{'width':width,'height':height,'background':color(board['background']),'objects':objects},
            'screens':screens, 'transitions':transitions}
    if 'testPlan' in raw:
        from .journey_testing import normalize_plan
        result['testPlan'] = normalize_plan(raw['testPlan'],screens,transitions)
    return result
