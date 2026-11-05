"""
Owned background indexing and hybrid candidate retrieval; canonical records always remain authoritative.
"""

import logging
import os
from pathlib import Path
import sqlite3
from contextlib import closing
from threading import Event, RLock, Thread

from .search_documents import extract, digest
from .search_model import LocalE5, FINGERPRINT
from . import search_index
from .purpose_search import interpret
from .validation import text
from .validation import encode, MAX_PAGE_BYTES


def attach_candidates(result, discovery, knowledge=None):
    """
    Fit optional discovery summaries inside the existing page byte budget without trimming canonical page items.
    """
    additions = {'discoveryCandidates': discovery['candidates'], 'discoveryStatus': discovery['status']}
    if knowledge is not None:
        additions['knowledgeCandidates'] = knowledge['candidates']
    result.update(additions)
    for key in ('knowledgeCandidates', 'discoveryCandidates'):
        while result.get(key) and len(encode(result).encode('utf-8')) > MAX_PAGE_BYTES:
            result[key].pop()
    if len(encode(result).encode('utf-8')) > MAX_PAGE_BYTES:
        for key in additions:
            result.pop(key, None)
    return result


class Discovery:
    """
    Own one replaceable index, one optional local model and one coalescing background worker.
    """

    def __init__(self, directory, model_dir=None):
        """
        Use operator directory/model_dir only; no network activity or ML imports occur during construction.
        """
        self.directory = Path(directory)
        self.path = self.directory / 'discovery.sqlite3'
        self.model_dir = model_dir
        self.lock = RLock()
        self.stop = Event()
        self.wake = Event()
        self.documents = []
        self.corpus = None
        self.metadata = {}
        self.model = None
        self.model_attempted = False
        self.semantic_state = 'warming' if model_dir else 'disabled'
        self.index_state = 'warming'
        self.thread = None

    def refresh(self, catalog):
        """
        Schedule the latest catalog snapshot; unchanged indexed source does not rebuild after usage/report changes.
        """
        documents, corpus = extract(catalog)
        with self.lock:
            if self.stop.is_set() or corpus == self.corpus:
                return
            self.documents, self.corpus = documents, corpus
            self.index_state = 'warming'
            if self.thread is None:
                self.thread = Thread(target=self._run, name='ag-design-search', daemon=True)
                self.thread.start()
            self.wake.set()

    def close(self):
        """
        Fence final publication and stop between inference batches; wait at most two seconds for the daemon worker.
        """
        self.stop.set()
        self.wake.set()
        if self.thread:
            self.thread.join(timeout=2)

    def status(self):
        """
        Return cheap nonsecret capability state; availability never imports/loads a model.
        """
        with self.lock:
            return {'schemaVersion': 'ag-design/discovery-v1', 'index': self.index_state,
                    'semantic': self.semantic_state, 'model': 'intfloat/multilingual-e5-small',
                    'modelFingerprint': FINGERPRINT, 'documents': int(self.metadata.get('documents', '0')),
                    'candidateOnly': True, 'runtimeDownloads': False}

    def _publish(self, temporary, corpus):
        """
        Atomically publish temporary only while this source generation is current; stale builds are discarded.
        """
        if temporary is None:
            return False
        try:
            metadata = search_index.read_meta(temporary)
            with self.lock:
                if self.stop.is_set() or self.corpus != corpus:
                    return False
                os.replace(temporary, self.path)
                self.metadata = metadata
                self.index_state = 'ready'
                return True
        finally:
            temporary.unlink(missing_ok=True)

    def _run(self):
        """
        Build FTS first, then optionally E5; failures retain strict search/current FTS and never publish partial vectors.
        """
        while not self.stop.is_set():
            self.wake.wait()
            self.wake.clear()
            if self.stop.is_set():
                break
            with self.lock:
                documents, corpus = self.documents, self.corpus
            cancelled = lambda: self.stop.is_set() or self.corpus != corpus
            try:
                self.directory.mkdir(parents=True, exist_ok=True)
                if self.directory.is_symlink() or self.path.is_symlink():
                    raise ValueError('search_cache_symlink')
                try:
                    metadata = search_index.read_meta(self.path)
                except (sqlite3.Error, OSError, ValueError):
                    metadata = {}
                compatible = (metadata.get('schema') == search_index.SCHEMA and metadata.get('model') == FINGERPRINT and metadata.get('corpus') == corpus)
                cached = search_index.cached_vectors(self.path) if not compatible else {}
                if compatible:
                    with self.lock:
                        if not cancelled():
                            self.metadata, self.index_state = metadata, 'ready'
                else:
                    temporary = search_index.create_generation(self.directory, documents, corpus, stopped=cancelled)
                    if not self._publish(temporary, corpus):
                        continue
                if self.model_dir and not self.model_attempted:
                    self.model_attempted = True
                    try:
                        self.model = LocalE5(self.model_dir)
                    except (ImportError, OSError, ValueError, RuntimeError):
                        self.semantic_state = 'unavailable'
                        logging.getLogger(__name__).warning('Local semantic search unavailable; FTS and strict search remain active')
                if self.model is None or cancelled():
                    continue
                if not compatible or metadata.get('semantic') != 'ready':
                    self.semantic_state = 'indexing'
                    if not cached:
                        cached = search_index.cached_vectors(self.path)
                    temporary = search_index.create_generation(self.directory, documents, corpus, model=self.model, cached=cached, stopped=cancelled)
                    if not self._publish(temporary, corpus):
                        continue
                self.semantic_state = 'ready'
            except Exception:
                # Indexing is derived best-effort work. Never take canonical reads or app startup down with it.
                self.semantic_state = 'unavailable'
                if self.metadata.get('corpus') != self.corpus:
                    self.index_state = 'unavailable'
                logging.getLogger(__name__).warning('Discovery index unavailable; canonical lexical search remains active')

    def search(self, query, kind, allowed, *, limit=4):
        """
        Return bounded current candidates from allowed records, preserving source identity and negation abstention.

        Args:
            query: Literal text, at most256 characters; never an SQL expression.
            kind: components or sections; callers validate domain filters before building allowed.
            allowed: Current id-to-record mapping already filtered for platform/category/library.
            limit: Candidate budget1–8; defaults to4 independently of strict pagination.

        Returns:
            Status plus advisory candidates. Exact identities pin first; RRF60 combines FTS/cosine ranks.
            A match is not applicability or qualification; missing/stale/busy/model failure falls back safely.
        """
        text(query, 'query', 256, empty=True)
        if kind not in ('components', 'sections') or not 1 <= limit <= 8:
            raise ValueError('Invalid discovery domain/budget')
        result = {'status': self.status(), 'candidates': [], 'limitations': 'Candidate metadata only. Inspect the current definition and applicable rules; similarity does not establish capability, applicability or qualification.'}
        interpretation = interpret(query)
        if not query.strip() or interpretation['ambiguousNegation']:
            result['abstention'] = 'ambiguous-negation' if interpretation['ambiguousNegation'] else 'empty-query'
            return result
        eligible = {kind + ':' + key: item for key, item in allowed.items()}
        try:
            with self.lock:
                if self.stop.is_set() or self.metadata.get('corpus') != self.corpus or self.index_state != 'ready':
                    result['status']['index'] = 'stale-or-warming'
                    return result
                with closing(search_index.connect(self.path)) as db:
                    hashes = dict(db.execute('SELECT key,source_hash FROM documents'))
                    eligible = {key: item for key, item in eligible.items() if hashes.get(key) == digest(item)}
                    lexical = search_index.lexical(db, query, eligible)
                    vector, semantic = None, []
                    try:
                        if self.model and self.metadata.get('semantic') == 'ready':
                            vector = self.model.query(query)
                        if vector is not None:
                            semantic = search_index.semantic(db, vector, self.model, eligible)
                    except Exception:
                        # The already retrieved FTS ranking remains usable when optional inference fails.
                        result['status']['semantic'] = 'unavailable'
                    if self.model and self.metadata.get('semantic') == 'ready' and vector is None and result['status']['semantic'] != 'unavailable':
                        result['status']['semantic'] = 'busy'
            return self._fuse(result, query, kind, eligible, lexical, semantic, limit)
        except (sqlite3.Error, OSError, ValueError, RuntimeError):
            result['status']['index'] = 'unavailable'
            return result

    def _fuse(self, result, query, kind, eligible, lexical, semantic, limit):
        """
        Combine stable rank evidence without mixing incompatible BM25/cosine scales; return actual current record summaries.
        """
        ranked = {}
        for method, rows in [('fts5', lexical), ('e5-cosine', semantic)]:
            for rank, (key, score, snippet) in enumerate(rows, 1):
                item = ranked.setdefault(key, {'score': 0., 'methods': [], 'snippet': snippet, 'cosine': None})
                item['score'] += 1 / (60 + rank)
                item['methods'].append(method)
                if method == 'e5-cosine':
                    item['cosine'], item['snippet'] = score, snippet
        exact = set()
        for key, item in eligible.items():
            names = [item['id'], item.get('name', item.get('title', '')), item.get('exportName', '')]
            if query.strip().casefold() in {name.casefold() for name in names if name}:
                exact.add(key)
                ranked.setdefault(key, {'score': 0., 'methods': ['exact-identity'], 'snippet': item['summary'], 'cosine': None})
        keys = sorted(ranked, key=lambda key: (key not in exact, -ranked[key]['score'], key))[:limit]
        for key in keys:
            item, evidence = eligible[key], ranked[key]
            result['candidates'].append({'id': item['id'], 'kind': kind, 'title': item.get('name', item.get('title')),
                'summary': item['summary'], 'sourceHash': digest(item), 'methods': evidence['methods'],
                'similarity': evidence['cosine'], 'snippet': evidence['snippet'], 'matchType': 'discovery-candidate',
                'action': 'inspect', 'qualification': 'not-assessed', 'version': item.get('version')})
        return result
