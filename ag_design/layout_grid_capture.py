"""Numeric-only browser capture validation, configuration binding and bounded ephemeral readback."""
from collections import OrderedDict
from copy import deepcopy
from datetime import datetime,timezone
import hashlib
import threading
import time
import uuid
from .composition_store import encoded
from .errors import DesignError
from .layout_grids import fields,identity,number,rectangle,specification,check_tree,invalid

DEFAULT_SETTINGS={'enabled':False,'pageGrid':{'type':'golden-canon'},'componentGrid':{'type':'columns'},'blockGrid':{'type':'spacing'},'tolerance':.008,'overrides':[]}
REASONS={'capture-incomplete','fonts-unready','hidden','clipped','missing-element','unsupported-transform','baseline-unavailable','zero-size','scope-budget','anchor-budget','geometry-budget'}


def settings(raw):
    """Validate bounded declarative settings; defaults/overrides never supply CSS, selectors or code."""
    fields(raw,DEFAULT_SETTINGS,'settings')
    result={**deepcopy(DEFAULT_SETTINGS),**deepcopy(raw)}
    if type(result['enabled']) is not bool:
        invalid('enabled')
    number(result['tolerance'],'tolerance',0,.05)
    for key in ('pageGrid','componentGrid','blockGrid'):
        specification(1e9,1e9,'css-px',result[key])
    if not isinstance(result['overrides'],list) or len(result['overrides'])>32:
        invalid('overrides')
    seen=set()
    for item in result['overrides']:
        fields(item,('nodeId','grid','inheritAxes'),'override')
        key=identity(item.get('nodeId'),'nodeId')
        if key in seen:
            invalid('duplicate override')
        seen.add(key);specification(1e9,1e9,'css-px',item.get('grid'))
        if 'inheritAxes' in item and item['inheritAxes'] not in ('x','y','both'):
            invalid('inheritAxes')
    return result


def numeric_capture(raw,config):
    """Whitelist numeric DOM evidence and bind grids to server-owned settings, never caller-selected report flags."""
    fields(raw,('captureId','sequence','documentHash','scenarioId','complete','fontsReady','viewport','scopes'),'capture')
    identity(raw.get('captureId'),'captureId');identity(raw.get('documentHash'),'documentHash');identity(raw.get('scenarioId'),'scenarioId')
    if type(raw.get('sequence')) is not int or raw['sequence']<1 or raw['sequence']>1e9:
        invalid('sequence')
    for key in ('complete','fontsReady'):
        if type(raw.get(key)) is not bool:
            invalid(key)
    fields(raw.get('viewport'),('width','height'),'viewport')
    for key in ('width','height'):
        number(raw['viewport'].get(key),key,.000001)
    scopes=raw.get('scopes')
    if not isinstance(scopes,list) or not 1<=len(scopes)<=32:
        invalid('capture scopes')
    overrides={item['nodeId']:item for item in config['overrides']}
    result=[]
    for index,scope in enumerate(scopes):
        fields(scope,('id','parentId','rect','role','anchors','boundarySource'),'numeric scope')
        role=scope.get('role')
        if role not in ('page','component','block') or scope.get('boundarySource') not in ('viewport','composition','structural-dom','annotated-dom'):
            invalid('scope provenance')
        if scope['boundarySource'] in ('structural-dom','annotated-dom') and role!='block':
            invalid('structural scope role')
        if index>0 and (role=='page' or scope.get('parentId') is None):
            invalid('one rooted capture required')
        if not isinstance(scope.get('anchors'),list):
            invalid('capture anchors')
        # Structural part IDs last for one capture only; they cannot own persistent settings.
        override=overrides.get(scope.get('id'),{}) if scope['boundarySource'] in ('viewport','composition') else {}
        grid=override.get('grid',config[{'page':'pageGrid','component':'componentGrid','block':'blockGrid'}[role]])
        anchors=[]
        for original in scope['anchors']:
            fields(original,('id','ownerId','x','y','kind','unknownReason'),'numeric anchor')
            if 'unknownReason' in original and original['unknownReason'] not in REASONS:
                invalid('capture reason')
            anchor=deepcopy(original)
            if not raw['complete'] or not raw['fontsReady']:
                anchor['unknownReason']='capture-incomplete' if not raw['complete'] else 'fonts-unready'
            anchors.append(anchor)
        record={'id':scope.get('id'),'parentId':scope.get('parentId'),'rect':scope.get('rect'),'grid':grid,'anchors':anchors}
        if 'inheritAxes' in override:
            record['inheritAxes']=override['inheritAxes']
        result.append(record)
    if result[0]['id']!='@page' or result[0]['parentId'] is not None:
        invalid('page carrier')
    if result[0]['rect']!={'x':0,'y':0,**raw['viewport']}:
        invalid('viewport carrier mismatch')
    report=check_tree({'unit':'css-px','tolerance':config['tolerance'],'scopes':result})
    for scope,source in zip(report['scopes'],scopes):
        scope['boundarySource']=source['boundarySource'];scope['role']=source['role']
    return report


class GridCaptureStore:
    """Keep addressed transient captures; reads do not renew lifetime or claim browser authentication."""
    def __init__(self,compositions,*,clock=time.monotonic,ttl=900):
        """Own bounded memory only; no user text, files or database writes are introduced."""
        self.compositions=compositions;self.clock=clock;self.ttl=ttl
        self.configs=OrderedDict();self.captures=OrderedDict();self.lock=threading.RLock()

    def _document(self,document_id,revision=None):
        """Bind every operation to an explicit existing document and optionally its exact revision."""
        current=self.compositions.inspect(document_id)
        if revision is not None and (type(revision) is not int or revision!=current['revision']):
            raise DesignError('grid_revision_conflict','Inspect the current composition revision',409)
        return current

    def configuration(self,document_id):
        """Read settings without extending expiry or reviving a capture."""
        current=self._document(document_id)
        with self.lock:
            record=self.configs.get(document_id)
            if record is None:
                return {'status':'unknown','reason':'not-configured','documentId':document_id,'revision':current['revision']}
            status='expired' if self.clock()>record['expires'] else 'stale' if record['revision']!=current['revision'] else 'current'
            last_sequence=max((value['sequence'] for key,value in self.captures.items() if key[0]==document_id),default=0)
            return {**{k:deepcopy(v) for k,v in record.items() if k!='expires'},'status':status,'lastSequence':last_sequence}

    def configure(self,document_id,revision,raw,expected_configuration_id=None):
        """CAS-protect settings; replacing a configuration immediately invalidates all its earlier captures."""
        current=self._document(document_id,revision);normalized=settings(raw)
        declared_ids={node['id'] for node in current['document']['nodes']}
        for override in normalized['overrides']:
            if override['nodeId'] not in declared_ids|{'@page'}:
                invalid('override requires a declared composition node')
        digest=hashlib.sha256(encoded(normalized).encode()).hexdigest()
        with self.lock:
            old=self.configs.get(document_id)
            if (old['configurationId'] if old else None)!=expected_configuration_id:
                raise DesignError('grid_configuration_conflict','Read the current grid configuration before changing it',409)
            if old is None and len(self.configs)>=32:
                expired=[key for key,value in self.configs.items() if self.clock()>value['expires']]
                for key in expired:
                    self.configs.pop(key)
                    for capture in [k for k in self.captures if k[0]==key]:self.captures.pop(capture)
                if len(self.configs)>=32:
                    raise DesignError('grid_capacity','Grid capture capacity reached',409)
            record={'documentId':document_id,'revision':current['revision'],'documentHash':current['documentHash'],'settings':normalized,
                    'configurationId':uuid.uuid4().hex,'gridConfigHash':digest,'expires':self.clock()+self.ttl}
            self.configs[document_id]=record
            for key in [k for k in self.captures if k[0]==document_id]:self.captures.pop(key)
            return self.configuration(document_id)

    def _active(self,document_id,configuration_id,revision):
        """A stale configuration cannot overwrite newer settings even if its network response arrives late."""
        current=self._document(document_id,revision)
        config=self.configs.get(document_id)
        if not config or config['configurationId']!=configuration_id or self.clock()>config['expires'] or config['revision']!=current['revision']:
            raise DesignError('grid_configuration_conflict','Grid configuration is stale or expired',409)
        return config,current

    def publish(self,document_id,revision,configuration_id,capture):
        """Compute the report from a numeric whitelist; preserve monotonic activity/capture ordering."""
        with self.lock:
            config,current=self._active(document_id,configuration_id,revision)
            report=numeric_capture(capture,config['settings'])
            if capture['documentHash']!=current['documentHash'] or capture['scenarioId'] not in {s['id'] for s in current['document']['scenarios']}|{'default'}:
                raise DesignError('grid_revision_conflict','Capture identity no longer matches the addressed scenario',409)
            key=(document_id,capture['scenarioId']);previous=self.captures.get(key)
            if previous and capture['sequence']<=previous['sequence']:
                raise DesignError('grid_capture_conflict','A newer activity or capture sequence already exists',409)
            if key not in self.captures and len(self.captures)>=64:
                raise DesignError('grid_capacity','Grid capture capacity reached',409)
            result={'status':'current' if capture['complete'] and capture['fontsReady'] else 'partial','documentId':document_id,'revision':revision,
                    'documentHash':current['documentHash'],'scenarioId':capture['scenarioId'],'configurationId':configuration_id,'gridConfigHash':config['gridConfigHash'],
                    'captureId':capture['captureId'],'sequence':capture['sequence'],'capturedAt':datetime.now(timezone.utc).isoformat(),
                    'viewport':deepcopy(capture['viewport']),'report':report,'trust':'caller-reported-browser-numeric','measurementMethod':'caller-reported-dom-border-box-v1','liveness':'not-attested'}
            encoded(result,524288)
            config['expires']=self.clock()+self.ttl
            self.captures[key]={**result,'expires':self.clock()+self.ttl}
            return deepcopy(result)

    def invalidate(self,document_id,revision,configuration_id,scenario_id,sequence):
        """Invalidate geometry on actual activity without letting an older invalidation erase a newer capture."""
        identity(scenario_id,'scenarioId')
        if type(sequence) is not int or not 1<=sequence<=1e9:
            invalid('sequence')
        with self.lock:
            _,current=self._active(document_id,configuration_id,revision)
            if scenario_id not in {s['id'] for s in current['document']['scenarios']}|{'default'}:
                invalid('scenarioId')
            key=(document_id,scenario_id);previous=self.captures.get(key)
            if key not in self.captures and len(self.captures)>=64:
                raise DesignError('grid_capacity','Grid capture capacity reached',409)
            if previous and sequence<=previous['sequence']:
                return {'status':'ignored','reason':'older-activity'}
            self.captures[key]={'status':'stale','sequence':sequence,'expires':self.clock()+self.ttl}
            return {'status':'stale','reason':'browser-activity','sequence':sequence}

    def inspect(self,document_id,scenario_id='default',expected_revision=None):
        """Return current numeric evidence only; stale/expired responses never include old hit results."""
        current=self._document(document_id,expected_revision);identity(scenario_id,'scenarioId')
        with self.lock:
            config=self.configs.get(document_id);record=self.captures.get((document_id,scenario_id))
            status='unknown';reason='capture-unavailable'
            if config and (config['revision']!=current['revision'] or self.clock()>config['expires']):status='stale';reason='configuration-changed-or-expired'
            elif record:
                if record['status']=='stale' or self.clock()>record['expires']:status='stale';reason='activity-or-expiry'
                elif record.get('documentHash')!=current['documentHash']:status='stale';reason='document-changed'
                else:return {k:deepcopy(v) for k,v in record.items() if k!='expires'}
            return {'status':status,'reason':reason,'documentId':document_id,'revision':current['revision'],'scenarioId':scenario_id,
                    'configurationId':config['configurationId'] if config else None,'gridConfigHash':config['gridConfigHash'] if config else None}
