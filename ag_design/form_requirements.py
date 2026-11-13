"""Source-backed supplemental form observations; never mix them with automatic component qualification."""
from functools import lru_cache
import hashlib
import json
from .config import resource_root
from .composition_store import encoded
from .errors import DesignError


@lru_cache(maxsize=2)
def form_requirements(purpose='operations'):
    """Return a pinned authored checklist for funnel or operational forms, with explicit caller-evidence limits."""
    if purpose not in ('funnel','operations'):
        raise DesignError('invalid_studio','Use funnel or operations form purpose.',422)
    policy = json.loads((resource_root()/'catalog/form-requirements.json').read_text(encoding='utf-8'))
    profile = policy['profiles'][purpose]
    result = {'schema':policy['schema'],'version':policy['version'],'purpose':purpose,'title':profile['title'],
              'origin':policy['origin'],'checkedAt':policy['checkedAt'],'sources':policy['sources'],
              'checks':policy['common']+profile['checks']}
    result['hash'] = hashlib.sha256(encoded(result).encode()).hexdigest()
    return result


def evaluate_checks(requirements, raw=None):
    """Unobserved checks remain unknown, failures are not averaged away; even all-pass is only caller observation."""
    raw = {} if raw is None else raw
    allowed = {item['id'] for item in requirements['checks']}
    if not isinstance(raw,dict) or set(raw)-allowed:
        raise DesignError('invalid_studio','Use only checks pinned when the trial started.',422)
    values = {}
    for key in allowed:
        value = raw.get(key,'unknown')
        if value not in ('pass','fail','unknown'):
            raise DesignError('invalid_studio','Form observations must be pass, fail or unknown.',422)
        values[key] = value
    gate = 'fail' if 'fail' in values.values() else 'unknown' if 'unknown' in values.values() else 'pass'
    return {'values':values,'gate':gate,'requirementsHash':requirements['hash'],'trust':'caller-observed-not-certified'}
