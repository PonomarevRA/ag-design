"""
Explicit one-time download of pinned public E5 files; never called by search requests.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import urllib.request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ag_design.search_model import FILES, MODEL_ID, MODEL_REVISION, FINGERPRINT, default_model_dir, verify_files, file_hash


def prepare(destination):
    """
    Download fixed HTTPS artifacts into destination atomically and verify exact hashes before publication.
    """
    destination.mkdir(parents=True, exist_ok=True)
    if destination.is_symlink():
        raise ValueError('Model directory must not be a symlink')
    for name, (remote, expected) in FILES.items():
        target = destination / name
        if target.is_file() and not target.is_symlink() and file_hash(target) == expected:
            continue
        descriptor, temporary = tempfile.mkstemp(prefix='.download-', dir=destination)
        try:
            digest = hashlib.sha256()
            with os.fdopen(descriptor, 'wb') as output, urllib.request.urlopen(f'https://huggingface.co/{MODEL_ID}/resolve/{MODEL_REVISION}/{remote}', timeout=90) as response:
                for block in iter(lambda: response.read(1024 * 1024), b''):
                    output.write(block)
                    digest.update(block)
            if digest.hexdigest() != expected:
                raise ValueError('Downloaded model hash mismatch')
            os.replace(temporary, target)
        finally:
            Path(temporary).unlink(missing_ok=True)
    verify_files(destination)
    receipt = {'model': MODEL_ID, 'revision': MODEL_REVISION, 'license': 'MIT', 'source': f'https://huggingface.co/{MODEL_ID}', 'fingerprint': FINGERPRINT, 'files': {name: {'sha256': value[1], 'bytes': (destination / name).stat().st_size} for name, value in FILES.items()}}
    (destination / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    return receipt


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destination', type=Path, default=default_model_dir())
    arguments = parser.parse_args()
    print(json.dumps(prepare(arguments.destination)))
