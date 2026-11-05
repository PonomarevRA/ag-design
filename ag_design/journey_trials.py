"""Short-lived exact-revision trials; one compressed snapshot per graph hash, never one complete graph per event."""
import hashlib
import uuid
from .composition_store import encoded, identity
from .errors import DesignError
from .studio_cache import pack, unpack
from .studio_model import text
from .journey_testing import evaluate_navigation, summarize_trials
from .form_requirements import form_requirements, evaluate_checks


class JourneyTrials:
    """Treat all outcomes and timings as caller-reported prototype evidence, distinct from business correctness."""
    def __init__(self, cache, inspect):
        """Reuse the temporary cache and the workspace's exact addressed graph resolver."""
        self.cache,self.inspect = cache,inspect

    def start(self, document_id, expected_revision, task_id, key):
        """Pin a task and graph snapshot atomically; exact retries return the original trial within its retention window."""
        for value in (document_id,task_id,key):
            identity(value)
        if type(expected_revision) is not int:
            raise DesignError('invalid_studio','Expected revision must be an integer.',422)
        self.cache.sweep()
        fingerprint = hashlib.sha256(encoded([document_id,expected_revision,task_id]).encode()).hexdigest()
        with self.cache.lock:
            prior = self.cache.connection.execute('SELECT * FROM journey_trials WHERE start_key=?',(key,)).fetchone()
            if prior:
                if prior['start_fingerprint']!=fingerprint:
                    raise DesignError('studio_idempotency_conflict','Use the same trial key only for identical input.',409)
                payload = unpack(prior['payload'])
                deadline = self.cache.connection.execute("SELECT expires_at FROM cache_expiry WHERE kind='trial' AND id=?",(payload['trialId'],)).fetchone()
                payload['expiresAt'] = deadline[0]
                return payload
            source = self.inspect(document_id)
            if source['revision']!=expected_revision:
                raise DesignError('studio_revision_conflict','Inspect the current graph before starting a trial.',409)
            if 'stale-artifacts' in source['screenStatus'].values():
                raise DesignError('studio_source_conflict','Update stale screen artifacts before testing.',409)
            plan = source['document'].get('testPlan',{'purpose':'operations','tasks':[]})
            task = next((item for item in plan['tasks'] if item['id']==task_id),None)
            if task is None:
                raise DesignError('invalid_studio','Choose a declared test task from this graph.',422)
            now = self.cache.clock()
            expiry = min(now+86400,source['retention'].get('expiresAt') or now+86400)
            if expiry<=now:
                raise DesignError('studio_expired','Temporary graph expired.',410)
            trial_id = uuid.uuid4().hex
            payload = {'trialId':trial_id,'documentId':document_id,'revision':expected_revision,'documentHash':source['documentHash'],
                       'task':task,'purpose':plan['purpose'],'requirements':form_requirements(plan['purpose']),
                       'startedAt':now,'expiresAt':expiry,'result':None}
            snapshot_id = hashlib.sha256(encoded([document_id,source['documentHash']]).encode()).hexdigest()
            with self.cache.transaction() as connection:
                if connection.execute('SELECT COUNT(*) FROM journey_trials').fetchone()[0]>=64:
                    raise DesignError('studio_capacity','Temporary trial capacity reached; expired entries will be removed.',409)
                connection.execute('INSERT OR IGNORE INTO trial_snapshots VALUES(?,?)',(snapshot_id,pack(source)))
                connection.execute('INSERT INTO journey_trials(id,document_id,document_hash,snapshot_id,payload,start_key,start_fingerprint) VALUES(?,?,?,?,?,?,?)',
                                   (trial_id,document_id,source['documentHash'],snapshot_id,pack(payload),key,fingerprint))
                connection.execute("INSERT INTO cache_expiry(kind,id,expires_at) VALUES('trial',?,?)",(trial_id,expiry))
            return payload

    def finish(self, trial_id, key, events, duration_ms, outcome, notes='', checks=None):
        """Validate the complete trace, retain contradictory reported success, and commit an idempotent bounded result."""
        identity(trial_id);identity(key)
        if outcome not in ('completed','assisted','failed','abandoned'):
            raise DesignError('invalid_studio','Choose completed, assisted, failed or abandoned.',422)
        text(notes,1024,empty=True)
        raw = encoded([events,duration_ms,outcome,notes,checks],65536)
        fingerprint = hashlib.sha256(raw.encode()).hexdigest()
        self.cache.sweep()
        with self.cache.transaction() as connection:
            row = connection.execute('SELECT * FROM journey_trials WHERE id=?',(trial_id,)).fetchone()
            if row is None:
                raise DesignError('studio_expired','Trial is absent or expired; no result was retained.',410)
            payload = unpack(row['payload'])
            deadline = connection.execute("SELECT expires_at FROM cache_expiry WHERE kind='trial' AND id=?",(trial_id,)).fetchone()
            payload['expiresAt'] = deadline[0]
            if row['finish_key']:
                if row['finish_key']!=key or row['finish_fingerprint']!=fingerprint:
                    raise DesignError('studio_idempotency_conflict','A completed trial can only be retried with its exact key and payload.',409)
                return payload
            snapshot = unpack(connection.execute('SELECT payload FROM trial_snapshots WHERE id=?',(row['snapshot_id'],)).fetchone()[0])
            result = evaluate_navigation(snapshot['document'],payload['task'],events,duration_ms)
            payload['result'] = {**result,'formChecks':evaluate_checks(payload['requirements'],checks),
                                 'outcome':outcome,'notes':notes,'finishedAt':self.cache.clock()}
            connection.execute('UPDATE journey_trials SET payload=?,finish_key=?,finish_fingerprint=? WHERE id=?',
                               (pack(payload),key,fingerprint,trial_id))
            return payload

    def report(self, document_id, document_hash):
        """Summarize only this pinned graph hash, not incompatible revisions or a marketing analytics population."""
        identity(document_id)
        self.cache.sweep()
        with self.cache.lock:
            rows = self.cache.connection.execute("SELECT t.payload,e.expires_at FROM journey_trials t JOIN cache_expiry e ON e.kind='trial' AND e.id=t.id WHERE document_id=? AND document_hash=? ORDER BY t.rowid DESC LIMIT 64",
                                                 (document_id,document_hash)).fetchall()
            trials = [{**unpack(row['payload']),'expiresAt':row['expires_at']} for row in rows]
        return {'documentId':document_id,'documentHash':document_hash,'summary':summarize_trials(trials),'items':trials}
