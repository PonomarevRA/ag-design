"""Thread-safe bounded memory ownership for immutable snapshots and graph-bound collection pages."""
from collections import OrderedDict
from copy import deepcopy
import hashlib
import json
from threading import Event, RLock
import time
import uuid
from .design_policy import requirements
from .ui_snapshot import validate_snapshot, canonical_json, fail, string
from .ui_grouping import normalize_parameters, METHOD_VERSION
from .ui_graph import build_ui_graph


class UiMapStore:
    """Retain all snapshot/graph/index variants under one ledger, never fetch a page URL or persist to disk."""

    def __init__(self,*,max_bytes=32*1024*1024,max_snapshots=20,max_graphs=40,max_variants=4,
                 policy_provider=requirements,clock=time.monotonic):
        """Allow lower test/host budgets, but never raise contract ceilings."""
        for value,ceiling in ((max_bytes,32*1024*1024),(max_snapshots,20),(max_graphs,40),(max_variants,4)):
            if type(value) is not int or not 1<=value<=ceiling: fail('Invalid cache limit')
        self.max_bytes,self.max_snapshots,self.max_graphs,self.max_variants = max_bytes,max_snapshots,max_graphs,max_variants
        self._policy_provider,self._clock = policy_provider,clock
        self._snapshots,self._graphs = OrderedDict(),OrderedDict()
        self._bytes,self._generation = 0,0
        self._identities,self._serial,self._instance = {},0,uuid.uuid4().hex[:12]
        self._lock = RLock()
        self._building = {}

    @staticmethod
    def _charge(value):
        """Charge all owned encoded payload/index content plus explicit conservative entry overhead."""
        return len(json.dumps(value,ensure_ascii=False,allow_nan=False,separators=(',',':')).encode('utf-8'))+512

    def _drop_graph(self,key):
        """Release one graph and its owned indices from the shared ledger."""
        row = self._graphs.pop(key,None)
        if row is not None:
            self._bytes -= row['charge']
            self._identities.pop(row['identity'],None)

    def _drop_snapshot(self,key):
        """Evict a snapshot together with every dependent graph/index variant."""
        row = self._snapshots.pop(key,None)
        if row is not None: self._bytes -= row['charge']
        for graph_id in list(self._graphs):
            if self._graphs[graph_id]['snapshotId']==key: self._drop_graph(graph_id)

    def _admit(self,charge,*,snapshot_id=None,new_snapshot=False):
        """Reserve a bounded entry atomically; stale selection is an explicit missing ID, never an alias."""
        if charge>self.max_bytes: fail('Cache item exceeds aggregate budget','limit_exceeded',413)
        if not new_snapshot:
            variants = [key for key,row in self._graphs.items() if row['snapshotId']==snapshot_id]
            while len(variants)>=self.max_variants:
                self._drop_graph(variants.pop(0))
            while len(self._graphs)>=self.max_graphs:
                self._drop_graph(next(iter(self._graphs)))
        while self._bytes+charge>self.max_bytes and self._graphs:
            self._drop_graph(next(iter(self._graphs)))
        while (self._bytes+charge>self.max_bytes or new_snapshot and len(self._snapshots)>=self.max_snapshots) and self._snapshots:
            victim = next((key for key in self._snapshots if key!=snapshot_id),None)
            if victim is None: break
            self._drop_snapshot(victim)
        if self._bytes+charge>self.max_bytes:
            fail('Cache item cannot fit with its snapshot','limit_exceeded',413)

    def import_snapshot(self,payload):
        """Validate/redact before retention; identical input is idempotent and returned data never aliases the cache."""
        snapshot = validate_snapshot(payload)
        key = snapshot['snapshotId']
        with self._lock:
            if key in self._snapshots:
                self._snapshots.move_to_end(key)
            else:
                charge = self._charge(snapshot)
                self._admit(charge,new_snapshot=True)
                self._snapshots[key]={'value':snapshot,'charge':charge}
                self._bytes += charge
        return {'snapshotId':key,'contentHash':key,'coverage':deepcopy(snapshot['coverage']),'provenance':'caller-reported'}

    def get_snapshot(self,snapshot_id):
        """Read an owned snapshot copy or report eviction without silently reconstructing data."""
        string(snapshot_id,identifier=True)
        with self._lock:
            row = self._snapshots.get(snapshot_id)
            if row is None: fail('UI snapshot not found','snapshot_not_found',404)
            self._snapshots.move_to_end(snapshot_id)
            return deepcopy(row['value'])

    def _new_graph(self,snapshot_id,provider,parameters,cancelled=None,deadline_ms=2000):
        """Build against one policy generation; cancelled or superseded work is never admitted."""
        policy = self._policy_provider()
        params = normalize_parameters(parameters)
        identity = {'snapshotHash':snapshot_id,'policyHash':policy['policyHash'],'methodVersion':METHOD_VERSION,'provider':provider,'parameters':params}
        digest = hashlib.sha256(canonical_json(identity).encode()).hexdigest()
        if type(deadline_ms) not in (int, float) or not 0 < deadline_ms <= 2000:
            fail('Invalid build deadline')
        deadline = time.monotonic() + deadline_ms / 1000
        with self._lock:
            generation = self._generation
        key = (generation, digest)
        while True:
            with self._lock:
                if generation != self._generation or (cancelled and cancelled()):
                    fail('UI map cancelled', 'cancelled', 409)
                if self._policy_provider()['policyHash'] != policy['policyHash']:
                    fail('UI graph policy changed', 'policy_mismatch', 409)
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    fail('UI map deadline expired', 'capture_timeout', 408)
                if digest in self._identities:
                    graph_id = self._identities[digest]
                    self._graphs.move_to_end(graph_id)
                    return graph_id
                pending = self._building.get(key)
                if pending is None:
                    snapshot = self.get_snapshot(snapshot_id)
                    pending = self._building[key] = Event()
                    break
            # A waiter has its own cancellation and deadline. If the owner
            # fails, a live waiter may become the next owner on the next pass.
            pending.wait(min(remaining, 0.025))

        try:
            return self._build_graph(snapshot_id, snapshot, provider, params, policy, digest,
                                     generation, cancelled, deadline)
        finally:
            with self._lock:
                del self._building[key]
                pending.set()

    def _build_graph(self, snapshot_id, snapshot, provider, params, policy, digest,
                     generation, cancelled, deadline):
        """Build outside the cache lock and publish only current, live work."""
        deadline_ms = (deadline - time.monotonic()) * 1000
        if deadline_ms <= 0:
            fail('UI map deadline expired', 'capture_timeout', 408)
        graph = build_ui_graph(snapshot,provider,params,policy=policy,clock=self._clock,deadline_ms=deadline_ms,cancelled=cancelled)
        indices = {'nodes':{node['id']:index for index,node in enumerate(graph['nodes'])},'relations':{},'groups':{},'findings':{}}
        for index,group in enumerate(graph['groups']):
            for member in group['memberIds']: indices['groups'].setdefault(member,[]).append(index)
        for index,finding in enumerate(graph['findings']):
            for member in finding['nodeIds']: indices['findings'].setdefault(member,[]).append(index)
        for index,edge in enumerate(graph['edges']):
            for endpoint in {edge['from'],edge['to']}:
                indices['relations'].setdefault(endpoint,[]).append(index)
        charge = self._charge({'graph':graph,'indices':indices,'snapshotId':snapshot_id,'identity':digest,'identityIndex':{digest:'x'*100}})
        with self._lock:
            stopped = cancelled and cancelled()
            superseded = generation!=self._generation
            if stopped or superseded:
                fail('Stale UI graph build cancelled','cancelled',409)
            if self._policy_provider()['policyHash']!=policy['policyHash']:
                fail('UI graph policy changed','policy_mismatch',409)
            if snapshot_id not in self._snapshots:
                fail('UI snapshot expired during build','snapshot_not_found',404)
            if time.monotonic() >= deadline:
                fail('UI map deadline expired', 'capture_timeout', 408)
            self._admit(charge,snapshot_id=snapshot_id)
            self._serial += 1
            graph_id = digest+':'+self._instance+':'+str(self._serial)
            graph['graphId'] = graph_id
            self._graphs[graph_id]={'value':graph,'indices':indices,'snapshotId':snapshot_id,'charge':charge,'identity':digest}
            self._identities[digest] = graph_id
            self._bytes += charge
        return graph_id

    def get_graph(self,graph_id,*,cancelled=None):
        """Resolve one exact immutable graph generation; a stale policy is409, eviction is404."""
        string(graph_id,identifier=True)
        with self._lock:
            if cancelled and cancelled(): fail('UI map cancelled','cancelled',409)
            row = self._graphs.get(graph_id)
            if row is None: fail('UI graph not found','graph_not_found',404)
            if row['value']['policyHash']!=self._policy_provider()['policyHash']:
                fail('UI graph policy changed','policy_mismatch',409)
            self._graphs.move_to_end(graph_id)
            self._snapshots.move_to_end(row['snapshotId'])
            return deepcopy(row['value'])

    def read_map(self,*,snapshot_id=None,graph_id=None,provider=None,parameters=None,collection='nodes',offset=0,limit=100,
                 cancelled=None,deadline_ms=2000):
        """Create the first map or page an explicit graphId; never rebuild a continuation implicitly."""
        if snapshot_id is not None: string(snapshot_id,identifier=True)
        if graph_id is not None: string(graph_id,identifier=True)
        if collection not in ('nodes','edges','groups','findings'): fail('Invalid graph collection')
        if type(offset) is not int or offset<0 or type(limit) is not int or not 1<=limit<=200:
            fail('Invalid graph page')
        if graph_id is None:
            if snapshot_id is None or offset!=0: fail('Continuation requires graphId','graph_mismatch',409)
            graph_id = self._new_graph(snapshot_id,provider or 'hybrid',parameters,cancelled,deadline_ms)
        with self._lock:
            row = self._graphs.get(graph_id)
            if row is None: fail('UI graph not found','graph_not_found',404)
            if cancelled and cancelled(): fail('UI map cancelled','cancelled',409)
            graph = row['value']
            if graph['policyHash']!=self._policy_provider()['policyHash']:
                fail('UI graph policy changed','policy_mismatch',409)
            self._graphs.move_to_end(graph_id)
            # Output owns only requested page and metadata; avoid a full graph copy per page.
            page = {}
            for key in ('graphId','snapshotId','snapshotHash','policyHash','policyVersion','methodVersion','parameterHash','provider','parameters','coverage'):
                page[key] = deepcopy(graph[key])
            page[collection] = deepcopy(graph[collection][offset:offset+limit])
            page['_total'] = len(graph[collection])
            graph = page
        snapshot_mismatch = snapshot_id is not None and snapshot_id!=graph['snapshotId']
        provider_mismatch = provider is not None and provider!=graph['provider']
        if snapshot_mismatch or provider_mismatch:
            fail('Graph identity mismatch','graph_mismatch',409)
        if parameters is not None and normalize_parameters(parameters)!=graph['parameters']:
            fail('Graph parameter identity mismatch','graph_mismatch',409)
        rows = graph[collection]
        return {'graphId':graph_id,'snapshotId':graph['snapshotId'],'snapshotHash':graph['snapshotHash'],'policyHash':graph['policyHash'],
                'policyVersion':graph['policyVersion'],'methodVersion':graph['methodVersion'],'parameterHash':graph['parameterHash'],
                'provider':graph['provider'],'parameters':graph['parameters'],'coverage':graph['coverage'],'collection':collection,
                'total':graph['_total'],'offset':offset,'nextOffset':offset+limit if offset+limit<graph['_total'] else None,
                'items':rows,'provenance':'caller-reported'}

    def read_node(self,graph_id,node_id):
        """Return one graph-bound node and bounded direct facts; all references retain their graph identity."""
        string(graph_id,identifier=True); string(node_id,identifier=True)
        with self._lock:
            row = self._graphs.get(graph_id)
            if row is None: fail('UI graph not found','graph_not_found',404)
            graph = row['value']
            if graph['policyHash']!=self._policy_provider()['policyHash']:
                fail('UI graph policy changed','policy_mismatch',409)
            index = row['indices']['nodes'].get(node_id)
            if index is None: fail('UI node not found','invalid_reference',404)
            self._graphs.move_to_end(graph_id)
            indices = row['indices']
            relations = indices['relations'].get(node_id,[])
            groups = indices['groups'].get(node_id,[])
            findings = indices['findings'].get(node_id,[])
            result = {'graphId':graph_id,'snapshotHash':graph['snapshotHash'],'policyHash':graph['policyHash'],
                      'node':graph['nodes'][index],'relations':[graph['edges'][item] for item in relations[:200]],
                      'relationsTruncated':len(relations)>200,'groups':[graph['groups'][item] for item in groups[:100]],
                      'groupsTruncated':len(groups)>100,'findingIds':[graph['findings'][item]['id'] for item in findings[:100]],
                      'findingsTruncated':len(findings)>100}
            return deepcopy(result)

    def cancel_pending(self):
        """Invalidate any in-flight graph build without reconstructing history or publishing old results."""
        with self._lock: self._generation += 1

    def stats(self):
        """Expose aggregate logical encoded bytes/counts, explicitly not process-native RSS."""
        with self._lock:
            return {'snapshots':len(self._snapshots),'graphs':len(self._graphs),'cachedBytes':self._bytes,
                    'maxBytes':self.max_bytes,'accounting':'encoded-payload-and-indices-plus-entry-overhead','nativeRssMeasured':False}
