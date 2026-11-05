"""
Replaceable SQLite FTS5/vector generations, separate from authoritative JSON and operator report databases.
"""

import os
from pathlib import Path
import re
import sqlite3
import tempfile
from contextlib import closing
from array import array
from .search_documents import digest, EXTRACTOR
from .search_model import FINGERPRINT
from .purpose_search import words, STOP
from .purpose_search import _term_matches
import math

SCHEMA = 'ag-discovery-index-v1'


def connect(path):
    """
    Open a read-only generation at the owned path; callers close it before atomic replacement.
    """
    return sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro', uri=True, timeout=.2)


def read_meta(path):
    """
    Read cheap provenance without importing ML; absent, corrupt or incompatible files propagate to rebuild.
    """
    with closing(connect(path)) as db:
        metadata = dict(db.execute('SELECT key,value FROM metadata'))
        count = db.execute('SELECT count(*) FROM documents').fetchone()[0]
        terms = db.execute('SELECT count(*) FROM terms').fetchone()[0]
        if count != int(metadata.get('documents', -1)) or count != terms or db.execute('PRAGMA quick_check(1)').fetchone()[0] != 'ok':
            raise ValueError('search_index_integrity')
        return metadata


def cached_vectors(path):
    """
    Read only compatible384-float cached chunks; corruption yields an empty reusable cache.
    """
    try:
        with closing(connect(path)) as db:
            metadata = dict(db.execute('SELECT key,value FROM metadata'))
            if metadata.get('model') != FINGERPRINT or metadata.get('schema') != SCHEMA:
                return {}
            result = {}
            for key, value in db.execute('SELECT text_hash,vector FROM chunks'):
                if len(value) != 384 * 4:
                    continue
                vector = array('f')
                vector.frombytes(value)
                norm = sum(number * number for number in vector)
                if math.isfinite(norm) and abs(norm - 1) < .02:
                    result[key] = value
            return result
    except (sqlite3.Error, OSError, ValueError):
        return {}


def create_generation(directory, documents, corpus_hash, *, model=None, cached=None, stopped=lambda: False):
    """
    Build a private complete generation; caller publishes returned path only if source ownership is still current.

    Args:
        directory: Owned external cache directory; never supplied by a query.
        documents: Bounded extractor records for both corpora.
        corpus_hash: Current extractor/source fingerprint.
        model: Optional opened E5 provider; None builds FTS only.
        cached: Compatible text-hash to vector mapping, reused without re-embedding.
        stopped: Cancellation predicate checked between bounded inference batches.

    Returns:
        Unpublished temporary SQLite path, or None after cancellation. Errors remove temporary files.
    """
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    if directory.is_symlink():
        raise ValueError('search_cache_symlink')
    descriptor, temporary = tempfile.mkstemp(prefix='.generation-', suffix='.sqlite3', dir=directory)
    os.close(descriptor)
    target = Path(temporary)
    try:
        with closing(sqlite3.connect(target)) as db, db:
            db.execute('CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL)')
            db.execute('CREATE TABLE documents(key TEXT PRIMARY KEY,kind TEXT,id TEXT,source_hash TEXT,title TEXT,body TEXT)')
            db.execute('CREATE VIRTUAL TABLE terms USING fts5(key UNINDEXED,title,body,aliases,tokenize="unicode61")')
            db.execute('CREATE TABLE chunks(parent_key TEXT,text_hash TEXT,body TEXT,vector BLOB)')
            for item in documents:
                db.execute('INSERT INTO documents VALUES(?,?,?,?,?,?)', (item['key'], item['kind'], item['id'], item['sourceHash'], item['title'], item['text']))
                db.execute('INSERT INTO terms VALUES(?,?,?,?)', (item['key'], item['title'], item['text'], item['aliases']))
            if model is not None:
                pending = []
                for item in documents:
                    if stopped():
                        break
                    for passage in model.passages(item['text']):
                        key = digest([FINGERPRINT, passage])
                        vector = (cached or {}).get(key)
                        if vector is not None:
                            db.execute('INSERT INTO chunks VALUES(?,?,?,?)', (item['key'], key, passage, vector))
                        else:
                            pending.append((item['key'], key, passage))
                        if len(pending) == 8:
                            _embed_batch(db, model, pending)
                            pending.clear()
                        if stopped():
                            break
                if pending and not stopped():
                    _embed_batch(db, model, pending)
            metadata = {'schema': SCHEMA, 'extractor': EXTRACTOR, 'corpus': corpus_hash,
                        'model': FINGERPRINT, 'semantic': 'ready' if model is not None else 'unavailable',
                        'documents': str(len(documents))}
            db.executemany('INSERT INTO metadata VALUES(?,?)', metadata.items())
        if stopped():
            target.unlink(missing_ok=True)
            return None
        return target
    except BaseException:
        target.unlink(missing_ok=True)
        raise


def _embed_batch(db, model, pending):
    """
    Encode up to eight pending passages while holding the provider gate; persist only finite normalized vectors.
    """
    with model.gate:
        vectors = model.encode([row[2] for row in pending])
    for row, vector in zip(pending, vectors):
        db.execute('INSERT INTO chunks VALUES(?,?,?,?)', (*row, vector.tobytes()))


def lexical(db, query, eligible):
    """
    Rank escaped literal query tokens by BM25, filtering current eligible keys before taking candidates.
    """
    tokens = list(dict.fromkeys(word for word in words(query) if word not in STOP))[:24]
    if not tokens:
        return []
    expression = ' OR '.join('"' + re.sub(r'[^\w]', '', word) + '"' + ('*' if len(word) >= 3 else '') for word in tokens)
    hits = db.execute('SELECT d.key,bm25(terms,0,6,1,2),d.body FROM terms JOIN documents d ON d.key=terms.key WHERE terms MATCH ? ORDER BY 2,d.key LIMIT 2128', (expression,))
    result = []
    minimum = max(1, math.ceil(len(tokens) / 2))
    for key, score, body in hits:
        if key not in eligible:
            continue
        available = set(words(body))
        if sum(_term_matches(term, available) for term in tokens) >= minimum:
            result.append((key, score, body[:280]))
    return result


def semantic(db, vector, model, eligible):
    """
    Exact cosine scan of eligible chunks; similarity>=.80 is an AG candidate cutoff, never a probability/fit claim.
    """
    rows = [(key, body, value) for key, body, value in db.execute('SELECT parent_key,body,vector FROM chunks') if key in eligible]
    if not rows:
        return []
    np = model.np
    matrix = np.frombuffer(b''.join(row[2] for row in rows), dtype='<f4').reshape(-1, 384)
    if not np.isfinite(matrix).all():
        raise ValueError('search_index_invalid_vectors')
    if (np.abs(np.linalg.norm(matrix, axis=1) - 1) > .01).any():
        raise ValueError('search_index_invalid_norms')
    scores = matrix @ vector
    best = {}
    for row, score in zip(rows, scores):
        key, body, _ = row
        value = float(score)
        if value >= .80 and (key not in best or value > best[key][1]):
            best[key] = (key, value, body[:280])
    return sorted(best.values(), key=lambda row: (-row[1], row[0]))
