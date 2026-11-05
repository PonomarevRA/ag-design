"""CAS-protected studio documents share the service SQLite owner and never silently discard history."""
import hashlib
import json
import uuid
from .composition_store import encoded, identity
from .errors import DesignError
from .studio_model import normalize_document
from .studio_export import board_svg, color_tokens
from .studio_cache import pack, unpack

SCHEMA = '''
CREATE TABLE IF NOT EXISTS studio_documents(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, history TEXT NOT NULL, cursor INTEGER NOT NULL, title TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS studio_versions(document_id TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL, author TEXT NOT NULL, PRIMARY KEY(document_id,version));
CREATE TABLE IF NOT EXISTS studio_commands(document_id TEXT NOT NULL, key TEXT NOT NULL, fingerprint TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(document_id,key));
'''


class StudioStore:
    """A bounded command bus; snapshots pin composition content independently of later source edits."""
    def __init__(self, owner, compositions):
        """Use the existing process lock, transactions and fixed external data directory."""
        self.owner, self.compositions = owner, compositions
        with owner.lock:
            owner.connection.executescript(SCHEMA)
            columns = {row[1] for row in owner.connection.execute('PRAGMA table_info(studio_documents)')}
            if 'title' not in columns:
                owner.connection.execute("ALTER TABLE studio_documents ADD COLUMN title TEXT NOT NULL DEFAULT ''")
                for row in owner.connection.execute('SELECT * FROM studio_documents').fetchall():
                    history = json.loads(row['history'])
                    payload = self._payload(owner.connection,row['id'],history[row['cursor']])
                    owner.connection.execute('UPDATE studio_documents SET title=? WHERE id=?',(payload['document']['title'],row['id']))

    def _row(self, connection, document_id):
        """Resolve an explicit ID or fail; there is no implicit current tab."""
        identity(document_id)
        row = connection.execute('SELECT * FROM studio_documents WHERE id=?',(document_id,)).fetchone()
        if row is None:
            raise DesignError('studio_not_found','Studio document was not found.',404)
        return row

    def _payload(self, connection, document_id, version):
        """Read an immutable authored snapshot used by current state, undo or redo."""
        row = connection.execute('SELECT payload FROM studio_versions WHERE document_id=? AND version=?',(document_id,version)).fetchone()
        return unpack(row['payload'])

    def _encode(self, value, maximum=1_100_000):
        """Keep permanent JSON backward compatible; only the separately owned temporary cache uses compressed blobs."""
        encoded(value,maximum)
        return pack(value) if getattr(self.owner,'ephemeral',False) else encoded(value,maximum)

    def _screen_status(self, payload):
        """Derive current catalog availability separately from immutable authored content and acknowledgement."""
        screen_status = {}
        for screen_id, snapshot in payload['screenSnapshots'].items():
            try:
                self.compositions._pins(snapshot['document'])
                screen_status[screen_id] = 'current-artifacts'
            except DesignError:
                screen_status[screen_id] = 'stale-artifacts'
        return screen_status

    def _envelope(self, connection, row):
        """Expose content identity, revision and bounded history capability without certification claims."""
        history = json.loads(row['history'])
        payload = self._payload(connection,row['id'],history[row['cursor']])
        digest = hashlib.sha256(encoded(payload,1_048_576).encode()).hexdigest()
        screen_status = self._screen_status(payload)
        return {'documentId':row['id'],'revision':row['revision'], 'documentHash':digest,'screenStatus':screen_status,
                'canUndo':row['cursor']>0,'canRedo':row['cursor']<len(history)-1, **payload}

    def _resolve(self, document, previous=None):
        """Keep unchanged pins; a newly bound screen must match a real composition's exact current revision/hash."""
        snapshots = {}
        previous = previous or {'document':{'screens':[]},'screenSnapshots':{}}
        old_screens = {item['id']:item for item in previous['document']['screens']}
        for screen in document['screens']:
            old = old_screens.get(screen['id'])
            if old and old['source'] == screen['source']:
                snapshot = previous['screenSnapshots'][screen['id']]
            else:
                snapshot = self.compositions.inspect(screen['source']['documentId'])
                if any(snapshot[key] != screen['source'][key] for key in ('documentId','revision','documentHash')):
                    raise DesignError('studio_source_conflict','The screen source changed; inspect it and bind its exact revision.',409)
                snapshot = {key:snapshot[key] for key in ('documentId','revision','documentHash','document')}
            snapshots[screen['id']] = snapshot
        for edge in document['transitions']:
            trigger = edge['triggerNodeId']
            nodes = snapshots[edge['from']]['document']['nodes']
            if trigger is not None and not any(node['id']==trigger and node['kind']=='component' for node in nodes):
                raise DesignError('invalid_studio','Transition trigger must address a component of its source screen.',422)
        result = {'document':document,'screenSnapshots':snapshots}
        encoded(result,1_048_576)
        return result

    def _capacity(self, connection, document_id=None):
        """Fail explicitly at budgets instead of deleting a user's boards or rollback history."""
        count = connection.execute('SELECT COUNT(*) FROM studio_documents').fetchone()[0]
        used = connection.execute('SELECT COALESCE(SUM(length(CAST(payload AS BLOB))),0) FROM studio_versions').fetchone()[0]
        used += connection.execute('SELECT COALESCE(SUM(length(CAST(response AS BLOB))),0) FROM studio_commands').fetchone()[0]
        versions = connection.execute('SELECT COUNT(*) FROM studio_versions WHERE document_id=?',(document_id,)).fetchone()[0]
        commands = connection.execute('SELECT COUNT(*) FROM studio_commands WHERE document_id=?',(document_id,)).fetchone()[0]
        documents_full = document_id is None and count>=64
        storage_full = used>30_000_000
        history_full = versions>=128 or commands>=256
        if documents_full or storage_full or history_full:
            raise DesignError('studio_capacity','Studio storage budget reached. Export documents before maintenance.',409)

    def create(self, document, author_id, *, expires_at=None, ttl_seconds=86400, snapshots=None):
        """Persist a validated document and pinned screens; caller-selected files and execution are unavailable."""
        identity(author_id)
        document = normalize_document(document)
        with self.owner.transaction() as connection:
            self._capacity(connection)
            payload = self._resolve(document,snapshots)
            temporary = getattr(self.owner,'ephemeral',False)
            if temporary and expires_at is None:
                raise DesignError('invalid_studio','Temporary graphs require an explicit expiration.',422)
            document_id = ('tmp-' if temporary else '')+uuid.uuid4().hex
            connection.execute('INSERT INTO studio_documents(id,revision,history,cursor,title) VALUES(?,?,?,?,?)',(document_id,1,'[1]',0,document['title']))
            connection.execute('INSERT INTO studio_versions VALUES(?,?,?,?)',(document_id,1,self._encode(payload,1_048_576),author_id))
            if temporary:
                connection.execute("INSERT INTO cache_expiry(kind,id,expires_at,ttl_seconds) VALUES('graph',?,?,?)",(document_id,expires_at,ttl_seconds))
            return self._envelope(connection,self._row(connection,document_id))

    def inspect(self, document_id):
        """Read a coherent current revision under the shared storage lock."""
        with self.owner.lock:
            return self._envelope(self.owner.connection,self._row(self.owner.connection,document_id))

    def list(self):
        """List bounded metadata only, never all potentially large screen snapshots."""
        with self.owner.lock:
            connection = self.owner.connection
            result = []
            for row in connection.execute('SELECT id,revision,title FROM studio_documents ORDER BY rowid DESC LIMIT 64'):
                result.append({'documentId':row['id'],'revision':row['revision'],'title':row['title']})
            return {'items':result}

    def command(self, document_id, expected_revision, key, author_id, kind, document=None):
        """Atomic replace/undo/redo with CAS and exact-key recovery; another author's command cannot be undone."""
        for value in (document_id,key,author_id):
            identity(value)
        if type(expected_revision) is not int or expected_revision<1 or kind not in ('replace','undo','redo'):
            raise DesignError('invalid_studio','Invalid studio command.',422)
        if (kind=='replace') != (document is not None):
            raise DesignError('invalid_studio','Only replacement commands accept a document.',422)
        fingerprint = hashlib.sha256(encoded([expected_revision,author_id,kind,document],600000).encode()).hexdigest()
        with self.owner.transaction() as connection:
            row = self._row(connection,document_id)
            prior = connection.execute('SELECT * FROM studio_commands WHERE document_id=? AND key=?',(document_id,key)).fetchone()
            if prior:
                if prior['fingerprint'] != fingerprint:
                    raise DesignError('studio_idempotency_conflict','Reuse an operation key only for the identical command.',409)
                acknowledgement = unpack(prior['response'])
                acknowledgement['screenStatus'] = self._screen_status(acknowledgement)
                return acknowledgement
            if expected_revision != row['revision']:
                raise DesignError('studio_revision_conflict','Studio changed. Inspect current state before editing.',409)
            self._capacity(connection,document_id)
            history, cursor = json.loads(row['history']),row['cursor']
            revision = row['revision']+1
            if kind == 'replace':
                current = self._envelope(connection,row)
                payload = self._resolve(normalize_document(document),current)
                connection.execute('INSERT INTO studio_versions VALUES(?,?,?,?)',(document_id,revision,self._encode(payload,1_048_576),author_id))
                history = history[:cursor+1] + [revision]
                cursor += 1
            else:
                target = cursor-1 if kind=='undo' else cursor+1
                if not 0<=target<len(history):
                    raise DesignError('studio_history_conflict','No matching undo/redo step.',409)
                authored_version = history[cursor] if kind=='undo' else history[target]
                author = connection.execute('SELECT author FROM studio_versions WHERE document_id=? AND version=?',(document_id,authored_version)).fetchone()[0]
                if author != author_id:
                    raise DesignError('studio_history_conflict',"Cannot cross another author's history.",409)
                cursor = target
            title = self._payload(connection,document_id,history[cursor])['document']['title']
            connection.execute('UPDATE studio_documents SET revision=?,history=?,cursor=?,title=? WHERE id=?',(revision,json.dumps(history),cursor,title,document_id))
            result = self._envelope(connection,self._row(connection,document_id))
            connection.execute('INSERT INTO studio_commands VALUES(?,?,?,?)',(document_id,key,fingerprint,self._encode(result)))
            return result

    def export(self, document_id, expected_revision, format):
        """Export one exact revision; JSON preserves AG journeys while SVG carries only board primitives."""
        envelope = self.inspect(document_id)
        if type(expected_revision) is not int or envelope['revision'] != expected_revision:
            raise DesignError('studio_revision_conflict','Inspect the current document before exporting.',409)
        document = envelope['document']
        if format == 'svg':
            content, media = board_svg(document), 'image/svg+xml'
        elif format == 'tokens':
            content, media = json.dumps(color_tokens(document),ensure_ascii=False,indent=2), 'application/json'
        elif format == 'json':
            content, media = encoded(envelope,1_100_000), 'application/json'
        else:
            raise DesignError('invalid_studio','Use svg, json or tokens export.',422)
        result = {'documentId':document_id,'revision':expected_revision,'format':format,'mediaType':media,'content':content,
                'limitations':'SVG imports as vector primitives; native Figma components, Auto Layout, variables and journey playback are not included. Fonts and actual Figma import need separate verification.'}
        encoded(result,1_900_000)
        return result
