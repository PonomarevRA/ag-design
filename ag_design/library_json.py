"""Bounded declarative library I/O shared below library ownership and version selection."""

import hashlib
import json
import os
from pathlib import Path
import tempfile
from .errors import DesignError


def digest(value):
    """
    Hash one JSON-compatible metadata value with the existing canonical seed format.

    Args:
        value: Validated metadata to compare against a managed seed.

    Returns:
        SHA256 hex digest; serialization errors propagate rather than changing the seed format.
    """
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=True).encode()).hexdigest()


def read_json(path, maximum=4_194_304):
    """
    Read bounded JSON metadata from an exact operator-owned file without following a symlink.

    Args:
        path: Path to a regular metadata file.
        maximum: Maximum permitted file size in bytes; defaults to4MiB.

    Returns:
        Decoded JSON value; this function never executes library content.

    Raises:
        DesignError: Unsafe/missing/oversized path or invalid JSON/Unicode content.
        OSError: A filesystem operation fails while reading the accepted path.
    """
    if path.is_symlink() or not path.is_file() or path.stat().st_size > maximum:
        raise DesignError('unsafe_library', 'Library file is missing, unsafe or oversized', 503)
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (ValueError, UnicodeError) as error:
        raise DesignError('invalid_library', 'Invalid library JSON', 503) from error


def atomic_json(path, value):
    """
    Atomically replace one bounded metadata file and remove its owned temporary file.

    Args:
        path: Destination Path in an existing operator-owned library directory.
        value: JSON-compatible metadata, limited to4MiB after encoding.

    Raises:
        DesignError: Destination is a symlink or encoded metadata exceeds the bound.
        OSError: Creating, flushing or replacing the file fails; no alternate destination is used.
    """
    if path.is_symlink():
        raise DesignError('unsafe_library', 'Library symlinks are not supported', 503)
    raw = json.dumps(value, ensure_ascii=False, indent=2).encode('utf-8') + b'\n'
    if len(raw) > 4_194_304:
        raise DesignError('library_full', 'Library file exceeds 4MiB', 413)
    handle, temporary = tempfile.mkstemp(prefix='.library-', dir=path.parent)
    try:
        with os.fdopen(handle, 'wb') as stream:
            stream.write(raw)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)
