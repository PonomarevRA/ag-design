"""Address permanent boards and expiring prototype graphs through one existing command vocabulary."""
import base64
from .composition_store import identity
from .errors import DesignError
from .studio_store import StudioStore
from .studio_cache import StudioCache
from .journey_trials import JourneyTrials


class StudioWorkspace:
    """Keep old documents permanent; only explicitly created temporary paths and trial evidence expire."""
    def __init__(self, owner, compositions, *, cache_dir=None, clock=None):
        """Attach one private cache beside, not inside, the durable data/backup root."""
        options = {'clock':clock} if clock else {}
        self.cache = StudioCache(owner,cache_dir,**options)
        try:
            self.permanent = StudioStore(owner,compositions)
            self.temporary = StudioStore(self.cache,compositions)
            self.trials = JourneyTrials(self.cache,self.inspect)
            self.cache.sweep()
        except BaseException:
            self.cache.close()
            raise

    def _store(self, document_id):
        """A reserved tmp- identity selects only the current owner's cache, never a caller-selected path."""
        identity(document_id)
        return self.temporary if document_id.startswith('tmp-') else self.permanent

    def _retention(self, envelope):
        """Retention metadata does not alter the authored document hash or silently extend access lifetime."""
        temporary = envelope['documentId'].startswith('tmp-')
        expires = None
        if temporary:
            with self.cache.lock:
                row = self.cache.connection.execute("SELECT expires_at,ttl_seconds FROM cache_expiry WHERE kind='graph' AND id=?",(envelope['documentId'],)).fetchone()
                if row is None or row[0]<=self.cache.clock():
                    raise DesignError('studio_expired','Temporary graph expired; export before its deadline.',410)
                expires = row[0]
        return {**envelope,'retention':{'mode':'temporary' if temporary else 'permanent','expiresAt':expires,
                                      'ttlSeconds':row['ttl_seconds'] if temporary else None,'sliding':temporary}}

    def _ttl(self, value):
        """Use an explicit one-hour to seven-day lifetime; the default for new temporary UI paths is 24 hours."""
        if type(value) is not int or not 3600<=value<=604800:
            raise DesignError('invalid_studio','Temporary lifetime must be 3600–604800 seconds.',422)
        return value

    def create(self, document, author_id, ttl_seconds=None):
        """Old callers create permanent boards; a supplied lifetime opts this new graph into expiring storage."""
        self.cache.sweep()
        if ttl_seconds is None:
            return self._retention(self.permanent.create(document,author_id))
        expires = self.cache.clock()+self._ttl(ttl_seconds)
        return self._retention(self.temporary.create(document,author_id,expires_at=expires,ttl_seconds=ttl_seconds))

    def inspect(self, document_id, *, touch=True):
        """Expired paths are swept before reading; permanent boards are never part of that deletion query."""
        self.cache.sweep()
        try:
            result = self._retention(self._store(document_id).inspect(document_id))
            if touch:
                self.touch(document_id,known=True)
                result = self._retention(result)
            return result
        except DesignError as error:
            if error.code=='studio_not_found' and document_id.startswith('tmp-'):
                raise DesignError('studio_expired','Temporary graph is absent or expired.',410) from error
            raise

    def touch(self, document_id, *, known=False):
        """Only addressed board activity slides its cache window; listing, health and scheduled sweeping never touch it."""
        if not known:
            self.inspect(document_id,touch=False)
        now = self.cache.clock()
        with self.cache.transaction() as connection:
            graph = connection.execute("SELECT expires_at,ttl_seconds FROM cache_expiry WHERE kind='graph' AND id=?",(document_id,)).fetchone()
            deadline = None
            if graph:
                if graph['expires_at']<=now:
                    raise DesignError('studio_expired','Expired graphs cannot be revived by activity.',410)
                deadline = now+graph['ttl_seconds']
                connection.execute("UPDATE cache_expiry SET expires_at=? WHERE kind='graph' AND id=?",(deadline,document_id))
            if deadline is None:
                connection.execute("UPDATE cache_expiry SET expires_at=?+ttl_seconds WHERE kind='trial' AND expires_at>? AND id IN (SELECT id FROM journey_trials WHERE document_id=?)",(now,now,document_id))
            else:
                connection.execute("UPDATE cache_expiry SET expires_at=MIN(?+ttl_seconds,?) WHERE kind='trial' AND expires_at>? AND id IN (SELECT id FROM journey_trials WHERE document_id=?)",(now,deadline,now,document_id))
        return {'documentId':document_id,'expiresAt':deadline,'sliding':deadline is not None}

    def list(self):
        """Merge bounded title lists; no full screen payloads are read to display the chooser."""
        self.cache.sweep()
        permanent = [{**item,'retention':{'mode':'permanent','expiresAt':None}} for item in self.permanent.list()['items']]
        with self.cache.lock:
            deadlines = {row['id']:row['expires_at'] for row in self.cache.connection.execute("SELECT id,expires_at FROM cache_expiry WHERE kind='graph'")}
        temporary = [{**item,'retention':{'mode':'temporary','expiresAt':deadlines[item['documentId']]}} for item in self.temporary.list()['items']]
        return {'items':temporary+permanent,'cache':self.cache.stats()}

    def command(self, document_id, expected_revision, key, author_id, kind, document=None):
        """Retain the original CAS/history contract; temporary history uses compressed cache payloads."""
        self.inspect(document_id)
        return self._retention(self._store(document_id).command(document_id,expected_revision,key,author_id,kind,document))

    def temporary_copy(self, document_id, expected_revision, author_id, ttl_seconds=86400):
        """Explicitly duplicate pinned content for a short test; the original permanent board remains visible and unchanged."""
        source = self.inspect(document_id)
        if type(expected_revision) is not int or source['revision']!=expected_revision:
            raise DesignError('studio_revision_conflict','Inspect the exact graph before making a temporary copy.',409)
        expires = self.cache.clock()+self._ttl(ttl_seconds)
        result = self.temporary.create(source['document'],author_id,expires_at=expires,ttl_seconds=ttl_seconds,snapshots=source)
        return self._retention(result)

    def extend(self, document_id, expected_revision, ttl_seconds=86400):
        """Explicitly extend a temporary deadline; active reads/edits renew the selected window; permanent boards are not migrated."""
        source = self.inspect(document_id)
        if source['retention']['mode']!='temporary' or type(expected_revision) is not int or source['revision']!=expected_revision:
            raise DesignError('studio_revision_conflict','Only the exact current temporary graph can be extended.',409)
        with self.cache.transaction() as connection:
            connection.execute("UPDATE cache_expiry SET expires_at=?,ttl_seconds=? WHERE kind='graph' AND id=?",(self.cache.clock()+self._ttl(ttl_seconds),ttl_seconds,document_id))
        return self.inspect(document_id)

    def export(self, document_id, expected_revision, format):
        """Add a small offline PPTX, keeping existing SVG/JSON/token exports and revision guards."""
        source = self.inspect(document_id)
        if type(expected_revision) is not int or source['revision']!=expected_revision:
            raise DesignError('studio_revision_conflict','Inspect the current graph before exporting.',409)
        if format!='pptx':
            return self._store(document_id).export(document_id,expected_revision,format)
        from .journey_pptx import export_pptx
        report = self.trials.report(document_id,source['documentHash'])
        content = export_pptx(source,report)
        if len(content)>1_300_000:
            raise DesignError('studio_capacity','PPTX exceeds the bounded export size.',409)
        return {'documentId':document_id,'revision':expected_revision,'format':'pptx','encoding':'base64',
                'mediaType':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'content':base64.b64encode(content).decode('ascii'),
                'limitations':'Editable graph and schematic component cards, not browser screenshots or live forms. Outcomes are caller-reported prototype evidence.'}

    def start_trial(self, document_id, expected_revision, task_id, key):
        """Delegate exact-revision start through the same temporary evidence owner."""
        return self.trials.start(document_id,expected_revision,task_id,key)

    def finish_trial(self, trial_id, key, events, duration_ms, outcome, notes='', checks=None):
        """Store only validated navigation metadata and explicitly reported observations."""
        result = self.trials.finish(trial_id,key,events,duration_ms,outcome,notes,checks)
        self.touch(result['documentId'])
        with self.cache.lock:
            deadline = self.cache.connection.execute("SELECT expires_at FROM cache_expiry WHERE kind='trial' AND id=?",(trial_id,)).fetchone()
            result['expiresAt'] = deadline[0]
        return result

    def trial_report(self, document_id):
        """Background result refresh is a read, so it must not slide retention."""
        source = self.inspect(document_id,touch=False)
        return self.trials.report(document_id,source['documentHash'])

    def close(self):
        """Release only the additional cache owner after periodic maintenance is cancelled."""
        self.cache.close()
