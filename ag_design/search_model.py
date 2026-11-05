"""
Optional, local-only E5 inference; this module imports no ML runtime until explicitly opened.
"""

import hashlib
import json
from pathlib import Path
from threading import Lock

MODEL_ID = 'intfloat/multilingual-e5-small'
MODEL_REVISION = '614241f622f53c4eeff9890bdc4f31cfecc418b3'
FILES = {
    'model.onnx': ('onnx/model_qint8_avx512_vnni.onnx', 'dd476dd0c2514e9b9be83aeb3853fac0763e0bdf4a71645407587d77c48a2d88'),
    'tokenizer.json': ('onnx/tokenizer.json', '0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39'),
}
FINGERPRINT = hashlib.sha256(json.dumps([MODEL_ID, MODEL_REVISION, FILES, 'mask-mean-l2-query-passage-v1'], sort_keys=True).encode()).hexdigest()


def default_model_dir():
    """
    Return the operator cache path; reads never download a missing model.
    """
    from platformdirs import user_cache_dir
    return Path(user_cache_dir('ag-design')) / 'models' / 'multilingual-e5-small'


def verify_files(directory):
    """
    Verify the pinned local weights/tokenizer; directory is operator supplied, never request supplied.
    """
    root = Path(directory)
    for name, (_, expected) in FILES.items():
        path = root / name
        if path.is_symlink() or not path.is_file():
            raise ValueError('search_model_missing')
        if file_hash(path) != expected:
            raise ValueError('search_model_hash_mismatch')


def file_hash(path):
    """
    Hash the local path in bounded blocks without reading the entire model into memory.
    """
    result = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


class LocalE5:
    """
    Own one CPU session/tokenizer and a bounded query cache; callers serialize inference via gate.
    """

    def __init__(self, directory):
        """
        Load verified local files from directory; missing dependencies or incompatible models propagate to fallback.
        """
        verify_files(directory)
        import numpy as np
        import onnxruntime as ort
        from tokenizers import Tokenizer
        options = ort.SessionOptions()
        options.intra_op_num_threads = 2
        options.inter_op_num_threads = 1
        options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        options.add_session_config_entry('session.intra_op.allow_spinning', '0')
        self.session = ort.InferenceSession(str(Path(directory) / 'model.onnx'), options, providers=['CPUExecutionProvider'])
        self.tokenizer = Tokenizer.from_file(str(Path(directory) / 'tokenizer.json'))
        self.tokenizer.no_padding()
        self.tokenizer.no_truncation()
        self.np = np
        self.gate = Lock()
        self.cache = {}

    def passages(self, value):
        """
        Split value at token offsets into <=448-token passages without silently discarding a tail.
        """
        encoded = self.tokenizer.encode(value, add_special_tokens=False)
        for start in range(0, len(encoded.ids), 448):
            end = min(start + 448, len(encoded.ids))
            left = 0 if start == 0 else encoded.offsets[start][0]
            right = len(value) if end == len(encoded.ids) else encoded.offsets[end][0]
            yield value[left:right]

    def encode(self, values, *, query=False):
        """
        Encode nonempty values with E5 prefixes and mask-mean/L2 pooling; caller holds gate, overflow raises ValueError.
        """
        np = self.np
        prefix = 'query: ' if query else 'passage: '
        encodings = self.tokenizer.encode_batch([prefix + value for value in values])
        width = max(len(item.ids) for item in encodings)
        if width > 512:
            raise ValueError('search_model_token_budget')
        ids = np.full((len(values), width), self.tokenizer.token_to_id('<pad>'), dtype=np.int64)
        mask = np.zeros_like(ids)
        for row, item in enumerate(encodings):
            ids[row, :len(item.ids)] = item.ids
            mask[row, :len(item.ids)] = 1
        supplied = {'input_ids': ids, 'attention_mask': mask, 'token_type_ids': np.zeros_like(ids)}
        inputs = {item.name: supplied[item.name] for item in self.session.get_inputs()}
        hidden = self.session.run(None, inputs)[0]
        vectors = (hidden * mask[..., None]).sum(axis=1) / mask.sum(axis=1)[:, None]
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        if vectors.shape[1] != 384 or not np.isfinite(vectors).all() or (norms <= 0).any():
            raise ValueError('search_model_invalid_vectors')
        return (vectors / norms).astype('<f4')

    def query(self, value):
        """
        Return a normalized vector for bounded value, or None while the build/inference gate is busy.
        """
        if not self.gate.acquire(timeout=.02):
            return None
        try:
            if value not in self.cache:
                result = self.encode([value], query=True)[0]
                if len(self.cache) >= 128:
                    self.cache.pop(next(iter(self.cache)))
                self.cache[value] = result
            return self.cache[value]
        finally:
            self.gate.release()
