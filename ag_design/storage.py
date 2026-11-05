"""Single-writer SQLite state for append-only reports with bounded deterministic retention."""

from contextlib import contextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sqlite3
from threading import RLock
import uuid

from .config import Settings
from .errors import DesignError
from .validation import MAX_PAGE_BYTES, encode, record_id

SCHEMA = '''
CREATE TABLE IF NOT EXISTS records(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,kind TEXT NOT NULL,
 created TEXT NOT NULL,payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS record_kind ON records(kind,sequence);
CREATE TABLE IF NOT EXISTS record_components(
 record_id TEXT REFERENCES records(id) ON DELETE CASCADE,component_id TEXT NOT NULL,
 PRIMARY KEY(record_id,component_id));
CREATE INDEX IF NOT EXISTS record_component ON record_components(component_id,record_id);
'''


class Store:
    """Serialize short transactions; confirmed writes commit before HTTP acknowledgement."""

    def __init__(self, directory, settings=None):
        """Own only this service's database/lock; another process may not open the same data directory."""
        self.directory = Path(directory).expanduser().resolve()
        self.directory.mkdir(parents=True, exist_ok=True)
        self.settings = settings or Settings.load(self.directory)
        self.lock, self.closed = RLock(), False
        self.connection = self.owner = None
        for name in ('design.sqlite3','design.sqlite3-wal','design.sqlite3-shm','ag-design.lock'):
            if (self.directory / name).is_symlink():
                raise DesignError('unsafe_storage', 'Storage symlinks are not supported', 503)
        try:
            self.owner = (self.directory / 'ag-design.lock').open('a+b')
            self._lock_owner()
            self.connection = sqlite3.connect(self.directory / 'design.sqlite3', timeout=2, check_same_thread=False, isolation_level=None)
            self.connection.row_factory = sqlite3.Row
            for pragma in ('foreign_keys=ON','journal_mode=WAL','synchronous=FULL','wal_autocheckpoint=128','journal_size_limit=1048576'):
                self.connection.execute('PRAGMA ' + pragma)
            page_size = self.connection.execute('PRAGMA page_size').fetchone()[0]
            self.connection.execute('PRAGMA max_page_count=' + str(134217728 // page_size))
            self.connection.executescript(SCHEMA)
            from .qualification import SCHEMA as CHECK_SCHEMA
            self.connection.executescript(CHECK_SCHEMA)
            with self.transaction() as connection:
                self._prune(connection)
        except BaseException:
            if self.connection is not None:
                self.connection.close()
            if self.owner is not None:
                self.owner.close()
            raise

    def _lock_owner(self):
        """Acquire a nonblocking platform-local file lock, released by closing this owned descriptor."""
        try:
            if os.name == 'nt':
                import msvcrt
                self.owner.seek(0)
                if not self.owner.read(1):
                    self.owner.write(b'0')
                    self.owner.flush()
                self.owner.seek(0)
                msvcrt.locking(self.owner.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.owner.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as error:
            raise DesignError('storage_in_use', 'This data directory is already in use', 503) from error

    @contextmanager
    def transaction(self):
        """Commit one mutation and its retention changes together, rolling back both on error."""
        with self.lock:
            self.connection.execute('BEGIN IMMEDIATE')
            try:
                yield self.connection
                self.connection.execute('COMMIT')
            except BaseException:
                self.connection.execute('ROLLBACK')
                raise

    def _prune(self, connection):
        """Keep the newest notes and combined reports; payloads and component links disappear atomically."""
        for predicate, maximum in [("kind='notes'", self.settings.maxNotes), ("kind IN ('audits','performance')", self.settings.maxReports)]:
            connection.execute('DELETE FROM records WHERE sequence IN (SELECT sequence FROM records WHERE ' + predicate + ' ORDER BY sequence DESC LIMIT -1 OFFSET ?)', (maximum,))

    def append(self, kind, payload, components):
        """Create a server identity/time and durably store validated, caller-reported evidence."""
        item = {**payload, 'id': uuid.uuid4().hex, 'createdAt': datetime.now(timezone.utc).isoformat()}
        encoded = encode(item)
        if len(encoded.encode('utf-8')) > 65536:
            raise DesignError('too_large', 'Stored record exceeds 64 KiB', 413)
        with self.transaction() as connection:
            connection.execute('INSERT INTO records(id,kind,created,payload) VALUES(?,?,?,?)', (item['id'],kind,item['createdAt'],encoded))
            for component in components:
                connection.execute('INSERT OR IGNORE INTO record_components VALUES(?,?)', (item['id'],component))
            self._prune(connection)
        return item

    def get(self, kind, identifier):
        """Read only one identity in the requested record kind; reports never resolve file paths."""
        record_id(identifier)
        with self.lock:
            row = self.connection.execute('SELECT payload FROM records WHERE id=? AND kind=?', (identifier,kind)).fetchone()
        if row is None:
            raise DesignError('not_found', 'Record not found or no longer retained', 404)
        return json.loads(row['payload'])

    def list(self, kind, *, componentId=None, limit=50, offset=0):
        """Read a bounded newest-first page with counts from one consistent local lock scope."""
        predicate, args = 'kind=?', [kind]
        if componentId:
            predicate += ' AND EXISTS(SELECT 1 FROM record_components WHERE record_id=records.id AND component_id=?)'
            args.append(componentId)
        with self.lock:
            count = self.connection.execute('SELECT count(*) FROM records WHERE ' + predicate,args).fetchone()[0]
            rows = self.connection.execute('SELECT payload FROM records WHERE ' + predicate + ' ORDER BY sequence DESC LIMIT ? OFFSET ?', [*args,limit,offset])
            items, used = [], 1024
            try:
                for row in rows:
                    size = len(row['payload'].encode('utf-8')) + 1
                    if items and used + size > MAX_PAGE_BYTES:
                        break
                    items.append(json.loads(row['payload']))
                    used += size
            finally:
                rows.close()
        more = offset + len(items) < count
        return {'items':items,'total':count,'hasMore':more,'nextOffset':offset+len(items) if more else None}

    def counts(self):
        """Expose retained item counts and effective retention, without inventing benchmark results."""
        with self.lock:
            counts = {row['kind']:row['amount'] for row in self.connection.execute('SELECT kind,count(*) amount FROM records GROUP BY kind')}
        return {kind:counts.get(kind,0) for kind in ('notes','audits','performance')}

    def close(self):
        """Release the owned connection and process lock once; committed data survives restart."""
        with self.lock:
            if not self.closed:
                self.closed = True
                self.connection.close()
                self.owner.close()
