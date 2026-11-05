"""Small explicit validators for bounded JSON, identifiers and pagination."""

import json
import math
import re

from .errors import DesignError

IDENTIFIER = re.compile(r'^[a-z][a-z0-9._-]{0,79}$')
RECORD_ID = re.compile(r'^[a-f0-9]{32}$')
MAX_PAGE_BYTES = 524288


def encode(value):
    """Serialize finite JSON as UTF-8 for stable hashing and actual byte accounting."""
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False)


def text(value, name, maximum=8192, *, empty=False):
    """Require bounded text without silently coercing objects or losing supplied evidence."""
    if not isinstance(value, str) or len(value) > maximum or (not empty and not value.strip()):
        raise DesignError('invalid_fields', f'{name} must be bounded text')
    try:
        value.encode('utf-8')
    except UnicodeError as error:
        raise DesignError('invalid_fields', f'{name} must be valid Unicode text') from error
    return value


def identifier(value, name='id'):
    """Accept a catalog identity as data; it never becomes a filesystem path."""
    if not isinstance(value, str) or not IDENTIFIER.fullmatch(value):
        raise DesignError('invalid_id', f'Invalid {name}')
    return value


def record_id(value):
    """Accept exactly one server-issued record identity, excluding path traversal and encoded separators."""
    if not isinstance(value, str) or not RECORD_ID.fullmatch(value):
        raise DesignError('invalid_id', 'Invalid record identity')
    return value


def object_fields(value, allowed, required=()):
    """Reject unknown/missing fields rather than persisting ignored caller controls."""
    if not isinstance(value, dict) or set(value) - set(allowed) or set(required) - set(value):
        raise DesignError('invalid_fields', 'Unexpected or missing fields')
    return value


def string_list(value, name, maximum=100):
    """Validate a bounded list while retaining order and requiring actual strings."""
    if not isinstance(value, list) or len(value) > maximum:
        raise DesignError('invalid_fields', f'{name} must be a bounded list')
    for item in value:
        text(item, name, 256)
    return value


def finite_number(value, name):
    """Reject booleans, NaN, infinity and negative measurements before persistence."""
    if type(value) not in (int, float) or not 0 <= value <= 1e15 or not math.isfinite(value):
        raise DesignError('invalid_fields', f'{name} must be a finite nonnegative number')
    return value


def query_parameters(request, allowed):
    """Reject unknown/repeated query controls and validate canonical bounded pagination."""
    values = {}
    for name, value in request.query_params.multi_items():
        if name not in allowed or name in values or len(value) > 512:
            raise DesignError('invalid_query', 'Unexpected, repeated or oversized query parameter')
        values[name] = value
    for name, default, maximum in [('limit', 50, 100), ('offset', 0, 100000)]:
        if name not in allowed:
            continue
        value = values.get(name, str(default))
        if not value.isascii() or not value.isdecimal() or str(int(value)) != value:
            raise DesignError('invalid_query', f'Invalid {name}')
        number = int(value)
        if number > maximum or number < (1 if name == 'limit' else 0):
            raise DesignError('invalid_query', f'Invalid {name}')
        values[name] = number
    return values


def page(items, limit, offset, revision=None):
    """Return deterministic source pagination with a nullable next offset, never a fake cursor."""
    selected, used = [], 1024
    for item in items[offset:offset + limit]:
        size = len(encode(item).encode('utf-8')) + 1
        if selected and used + size > MAX_PAGE_BYTES:
            break
        selected.append(item)
        used += size
    more = offset + len(selected) < len(items)
    result = {'items': selected, 'total': len(items), 'hasMore': more,
              'nextOffset': offset + len(selected) if more else None}
    if revision is not None:
        result['catalogRevision'] = revision
    return result
