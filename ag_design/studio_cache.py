"""One small expiring cache outside durable data/backups; compression is bounded and SQLite returns free pages."""
from contextlib import contextmanager
import json
from pathlib import Path
import sqlite3
import time
import zlib
from .errors import DesignError
from .composition_store import encoded

MAX_UNPACKED = 1_900_000


def pack(value):
    """Compress repetitive graph snapshots in the cache only; the existing permanent format stays unchanged."""
    return b'AGZ1'+zlib.compress(encoded(value,MAX_UNPACKED).encode('utf-8'),6)


def unpack(value):
    """Read legacy JSON or cache blobs with an expansion bound; corrupt or oversized content is never rendered."""
    if isinstance(value,bytes) and value.startswith(b'AGZ1'):
        inflater = zlib.decompressobj()
        try:
            raw = inflater.decompress(value[4:],MAX_UNPACKED+1)
            if len(raw)>MAX_UNPACKED or not inflater.eof or inflater.unused_data or inflater.unconsumed_tail:
                raise ValueError('Invalid compressed cache')
            return json.loads(raw)
        except (ValueError,zlib.error,UnicodeError) as error:
            raise DesignError('studio_cache_invalid','Temporary graph cache is invalid.',503) from error
    return json.loads(value)


class StudioCache:
    """Share the live data owner's lock, but keep transient graphs/trials out of its database and backup root."""
    ephemeral = True

    def __init__(self, owner, directory=None, clock=time.time):
        """Own a fixed sibling cache, never a caller-selected API path; FULL vacuum is enabled before schema creation."""
        self.directory = Path(directory) if directory is not None else owner.directory.with_name(owner.directory.name+'-journey-cache')
        if self.directory.is_symlink():
            raise DesignError('unsafe_storage','Temporary cache symlinks are not supported.',503)
        self.directory.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.path = self.directory/'journeys.sqlite3'
        for suffix in ('','-wal','-shm'):
            if Path(str(self.path)+suffix).is_symlink():
                raise DesignError('unsafe_storage','Temporary cache symlinks are not supported.',503)
        self.lock,self.clock = owner.lock,clock
        self.connection = sqlite3.connect(self.path,timeout=2,check_same_thread=False,isolation_level=None)
        self.connection.row_factory = sqlite3.Row
        for pragma in ('auto_vacuum=FULL','journal_mode=WAL','synchronous=NORMAL','wal_autocheckpoint=64','journal_size_limit=262144','max_page_count=16384'):
            self.connection.execute('PRAGMA '+pragma)
        self.connection.executescript('''
            CREATE TABLE IF NOT EXISTS cache_expiry(kind TEXT NOT NULL,id TEXT NOT NULL,expires_at REAL NOT NULL,ttl_seconds INTEGER NOT NULL DEFAULT 86400,PRIMARY KEY(kind,id));
            CREATE INDEX IF NOT EXISTS cache_expiry_deadline ON cache_expiry(expires_at);
            CREATE TABLE IF NOT EXISTS trial_snapshots(id TEXT PRIMARY KEY,payload BLOB NOT NULL);
            CREATE TABLE IF NOT EXISTS journey_trials(id TEXT PRIMARY KEY,document_id TEXT NOT NULL,document_hash TEXT NOT NULL,snapshot_id TEXT NOT NULL,payload BLOB NOT NULL,start_key TEXT UNIQUE NOT NULL,start_fingerprint TEXT NOT NULL,finish_key TEXT,finish_fingerprint TEXT);
        ''')

    @contextmanager
    def transaction(self):
        """Serialize with composition access too, so nested source resolution cannot deadlock two SQLite owners."""
        with self.lock:
            self.connection.execute('BEGIN IMMEDIATE')
            try:
                yield self.connection
                self.connection.execute('COMMIT')
            except BaseException:
                self.connection.execute('ROLLBACK')
                raise

    def sweep(self):
        """Remove only expired cache graphs/trials and orphan snapshots, then checkpoint/truncate their private WAL."""
        with self.lock:
            if not self.connection.execute('SELECT 1 FROM cache_expiry WHERE expires_at<=? LIMIT 1',(self.clock(),)).fetchone():
                return 0
        with self.transaction() as connection:
            due = connection.execute('SELECT kind,id FROM cache_expiry WHERE expires_at<=?',(self.clock(),)).fetchall()
            for row in due:
                if row['kind']=='graph':
                    connection.execute('DELETE FROM studio_commands WHERE document_id=?',(row['id'],))
                    connection.execute('DELETE FROM studio_versions WHERE document_id=?',(row['id'],))
                    connection.execute('DELETE FROM studio_documents WHERE id=?',(row['id'],))
                    trial_ids = connection.execute('SELECT id FROM journey_trials WHERE document_id=?',(row['id'],)).fetchall()
                    for trial in trial_ids:
                        connection.execute("DELETE FROM cache_expiry WHERE kind='trial' AND id=?",(trial['id'],))
                    connection.execute('DELETE FROM journey_trials WHERE document_id=?',(row['id'],))
                else:
                    connection.execute('DELETE FROM journey_trials WHERE id=?',(row['id'],))
                connection.execute('DELETE FROM cache_expiry WHERE kind=? AND id=?',(row['kind'],row['id']))
            connection.execute('DELETE FROM trial_snapshots WHERE id NOT IN (SELECT snapshot_id FROM journey_trials)')
        with self.lock:
            self.connection.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        return len(due)

    def stats(self):
        """Report logical allocated file sizes, not claimed APFS unique/reclaimable blocks."""
        with self.lock:
            payload = self.connection.execute('SELECT COALESCE(SUM(length(payload)),0) FROM trial_snapshots').fetchone()[0]
            size = sum(path.stat().st_size for path in self.directory.glob('journeys.sqlite3*') if path.is_file())
            return {'allocatedFileBytes':size,'snapshotBytes':payload,'maximumDatabaseBytes':67_108_864,
                    'autoVacuum':'FULL','backups':'excluded-from-durable-data-root','intervalSeconds':60}

    def close(self):
        """Checkpoint and close only this owned cache; the durable owner has its own lifecycle."""
        with self.lock:
            self.connection.execute('PRAGMA wal_checkpoint(TRUNCATE)')
            self.connection.close()
