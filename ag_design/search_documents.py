"""
Extract only authored discovery metadata; private notes, usage, reports, code and URLs are never embedded.
"""

import hashlib
import json
import re
from .book_localization import searchable_text
from .purpose_search import words, STOP

EXTRACTOR = 'ag-discovery-documents-v1'


def digest(value):
    """
    Hash a JSON value with stable ordering for source identity, not a trust or qualification claim.
    """
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def document(kind, item):
    """
    Project one current component/section item into bounded searchable text and a full-definition fingerprint.
    """
    if kind == 'components':
        parts = [item.get(key, '') for key in ('id', 'name', 'summary', 'category', 'exportName')]
        for key in ('tags', 'anatomy', 'variants', 'states'):
            parts.extend(item.get(key, []))
        parts.append(item.get('design', {}).get('intendedUse', ''))
        title = item['name']
        value = '\n'.join(parts)
    else:
        title = item['title']
        value = searchable_text(item)
    value = re.sub(r'```.*?```', ' ', value, flags=re.S)
    value = re.sub(r'https?://\S+', ' ', value)
    return {'key': kind + ':' + item['id'], 'kind': kind, 'id': item['id'], 'title': title,
            'text': value, 'sourceHash': digest(item),
            'aliases': ' '.join(dict.fromkeys(word for word in words(value) if word not in STOP))}


def extract(catalog):
    """
    Snapshot both authored corpora under catalog.lock; at most2128 records, no caller paths or private records.
    """
    with catalog.lock:
        result = []
        for kind in ('components', 'sections'):
            for item in catalog.sections.get(kind, []):
                result.append(document(kind, item))
        return result, digest([EXTRACTOR, result])
