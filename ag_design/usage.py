"""Qualified usage writes and a bounded read-only summary of declared integration locations."""

from copy import deepcopy

from .errors import DesignError
from .library import read_json, atomic_json
from .qualification import history
from .validation import page


def _component_identity(component):
    """Group explicit library metadata across versions; never infer ownership from an ID string."""
    if component.get('libraryId') and component.get('localId'):
        return (component['libraryId'], component['localId'])
    return ('ag-core', component['id'])


def usage_summary(catalog, *, component_id=None, limit=100, offset=0):
    """Count registered consumer/component/location tuples, not runtime calls or version records.

    The dataset always covers all active component definitions before filtering and paging,
    including unused components. It lets clients normalize against one stable population.
    Only counts leave this boundary: consumer names, locations and notes remain private to
    the existing explicit usage reader. Duplicate locations across versions count once.
    """
    if type(limit) is not int or not 1 <= limit <= 100:
        raise DesignError('invalid_query', 'Invalid limit')
    if type(offset) is not int or not 0 <= offset <= 100000:
        raise DesignError('invalid_query', 'Invalid offset')
    with catalog.lock:
        if component_id is not None:
            catalog.get(component_id)
        components = sorted(catalog.sections['components'], key=lambda item: item['id'])
        identities, locations = {}, {}
        for component in components:
            identity = _component_identity(component)
            identities[component['id']] = identity
            locations.setdefault(identity, set())
        for item in catalog.sections['usage']:
            # Catalog validation guarantees each usage references an actual definition.
            # Explicit metadata aliases share one identity, while similarly named IDs do not.
            identity = identities[item['componentId']]
            locations[identity].add((item['consumerId'], item['location']))
        items, counts = [], []
        for component in components:
            count = len(locations[identities[component['id']]])
            counts.append(count)
            if component_id is None or component['id'] == component_id:
                items.append({'componentId': component['id'], 'count': count})
        result = page(items, limit, offset, catalog.revision)
        result.update({
            'dataset': {'componentCount': len(components), 'counts': counts,
                        'min': min(counts, default=0), 'max': max(counts, default=0)},
            'basis': 'unique-consumer-component-location',
            'trust': 'registered-facts-not-runtime',
        })
        return result


def register_usage(library, catalog, store, value):
    """Persist qualified usage or return its exact retry; changed fields never overwrite evidence.

    Hold library and qualification locks through admission and persistence, so competing
    writes cannot duplicate an identity or admit usage across a newly recorded failure.
    """
    item = deepcopy(value)
    with library.lock, store.lock:
        catalog._validate_item('usage', item)
        component = catalog.get(item['componentId'])
        claims = history(store, component)
        latest = None
        for claim in claims['items']:
            if claim['current'] and claim['stage'] == 'consumer' and claim.get('consumerId') == item['consumerId']:
                latest = claim
                break
        admitted = bool(latest and latest['outcome'] == 'pass'
                        and latest['version'] == item['version'] and claims['readyForConsumer'])
        if not admitted:
            raise DesignError('consumer_check_required', 'Record current passing product verification before registering usage', 409)
        path = library.directory / 'usage.json'
        data = read_json(path)
        for existing in data['items']:
            if existing['id'] != item['id']:
                continue
            # Dict equality ignores JSON key order but preserves all observed field values.
            if existing == item:
                return deepcopy(existing)
            raise DesignError('library_conflict', 'Usage id already has different fields; read the existing usage or choose a new id', 409)
        data['items'].append(item)
        catalog._validate_section('usage', data['items'])
        atomic_json(path, data)
        catalog.reload()
        return item
