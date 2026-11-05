"""Restart-safe library versions and explicit activation; preview assets remain opaque server-side."""

from copy import deepcopy
from threading import RLock
import re

from .element_bundles import INDEX_SCHEMA, bundle_hash, library_id, owned_components, validate_bundle
from .errors import DesignError
from .library_json import atomic_json, read_json

# Keep rollback history bounded while allowing routine patch releases without deleting operator-owned versions.
MAX_RETAINED_VERSIONS = 32


def release_order(version):
    """
    Order bounded major/minor/patch releases before prereleases of the same numeric version.

    Args:
        version: Validated immutable bundle release string.

    Returns:
        Comparable numeric release tuple and prerelease precedence.
    """
    if not isinstance(version,str) or len(version)>128 or not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?',version):
        raise DesignError('invalid_version','Invalid bounded bundled release',422)
    number, separator, suffix = version.partition('-')
    identifiers=[]
    for part in suffix.split('.') if separator else []:
        identifiers.append((0,int(part)) if part.isdigit() else (1,part))
    return (tuple(int(part) for part in number.split('.')), not separator, tuple(identifiers))



class ElementLibraries:
    """Own one bounded metadata index independently of the built-in editable component catalog."""

    def __init__(self, directory, lock=None):
        """Use a fixed index path; client input never chooses directories or archive members."""
        self.path = directory / 'element-libraries.json'
        self.lock = lock or RLock()

    def index(self):
        """Read the last atomic snapshot, keeping disabled versions available for explicit rollback."""
        if not self.path.exists():
            return {'schemaVersion': INDEX_SCHEMA, 'items': []}
        value = read_json(self.path)
        if not isinstance(value, dict) or value.get('schemaVersion') != INDEX_SCHEMA or not isinstance(value.get('items'), list) or len(value['items']) > 16:
            raise DesignError('invalid_library', 'Invalid element-library index', 503)
        ids = set()
        for item in value['items']:
            if not isinstance(item, dict):
                raise DesignError('invalid_library', 'Invalid element-library entry', 503)
            key = library_id(item.get('id'))
            if key in ids or type(item.get('enabled')) is not bool or not isinstance(item.get('versions'), list) or not 1 <= len(item['versions']) <= MAX_RETAINED_VERSIONS:
                raise DesignError('invalid_library', 'Invalid element-library state', 503)
            versions = [entry.get('version') for entry in item['versions'] if isinstance(entry, dict)]
            if len(versions) != len(item['versions']) or len(versions) != len(set(versions)) or item.get('activeVersion') not in versions:
                raise DesignError('invalid_library', 'Active library version is absent or duplicated', 503)
            ids.add(key)
        return value

    def bundles(self, enabled_only=True, index=None):
        """Return selected immutable bundles; disabled libraries contribute no components or profiles."""
        result = []
        for item in (index or self.index())['items']:
            if enabled_only and not item['enabled']:
                continue
            result.append(next(bundle for bundle in item['versions'] if bundle['version'] == item['activeVersion']))
        return result

    def components(self, index=None):
        """Expand enabled namespaces while keeping built-in component IDs unchanged."""
        result = []
        for bundle in self.bundles(index=index):
            result.extend(owned_components(bundle))
        return result

    def profiles(self):
        """Expose only active libraries' own validated semantic profiles."""
        result = []
        for bundle in self.bundles():
            result.extend(deepcopy(bundle.get('profiles', [])))
        return result

    def describe(self, catalog):
        """List version/ownership facts without returning code assets in ordinary discovery."""
        items = [{'id': 'ag-core', 'name': 'AG · основная библиотека', 'enabled': True, 'builtIn': True,
                  'activeVersion': None, 'versions': [], 'componentCount': len(catalog.core_components)}]
        for entry in self.index()['items']:
            bundle = next(b for b in entry['versions'] if b['version'] == entry['activeVersion'])
            items.append({'id': entry['id'], 'name': bundle['name'], 'description': bundle['description'],
                          'enabled': entry['enabled'], 'builtIn': False, 'activeVersion': entry['activeVersion'],
                          'versions': [b['version'] for b in entry['versions']], 'componentCount': len(bundle['components']),
                          'sources': bundle['sources'], 'bundleHash': bundle_hash(bundle), 'package': bundle['package'],
                          'defaultProfile': bundle.get('profiles', [{}])[0].get('id') if bundle.get('profiles') else 'design'})
        return {'items': items, 'catalogRevision': catalog.revision, 'schemaVersion': INDEX_SCHEMA,
                'previewIsolation': 'sandbox allow-scripts; opaque origin; restrictive resource CSP; no parent DOM access'}

    def _publish(self, value, previous, catalog):
        """Roll back persisted metadata if a projected catalog cannot be published coherently."""
        atomic_json(self.path, value)
        try:
            catalog.reload()
        except Exception:
            atomic_json(self.path, previous)
            raise

    def import_bundle(self, value, catalog, expected_revision, *, activate=True):
        """Import a complete version under CAS; a published version can never change its bytes."""
        with self.lock:
            if expected_revision != catalog.revision:
                raise DesignError('library_conflict', 'Retrieve the current catalog revision before importing', 409)
            bundle = validate_bundle(value, catalog)
            previous = self.index()
            projected = deepcopy(previous)
            entry = next((e for e in projected['items'] if e['id'] == bundle['id']), None)
            if entry is None:
                if len(projected['items']) >= 16:
                    raise DesignError('library_full', 'At most sixteen external libraries are supported', 413)
                entry = {'id': bundle['id'], 'enabled': True, 'activeVersion': bundle['version'], 'versions': []}
                projected['items'].append(entry)
            existing = next((b for b in entry['versions'] if b['version'] == bundle['version']), None)
            if existing is not None:
                if bundle_hash(existing) != bundle_hash(bundle):
                    raise DesignError('immutable_library_version', 'Publish a new version instead of changing existing bytes', 409)
                return self.describe(catalog)
            if len(entry['versions']) >= MAX_RETAINED_VERSIONS:
                raise DesignError('library_full', f'At most {MAX_RETAINED_VERSIONS} retained versions per library are supported', 413)
            entry['versions'].append(bundle)
            if activate:
                entry['activeVersion'] = bundle['version']
            self._publish(projected, previous, catalog)
            return self.describe(catalog)

    def set_state(self, namespace, enabled, version, catalog, expected_revision):
        """Enable, disable or pin an installed version atomically; core remains available."""
        library_id(namespace)
        if type(enabled) is not bool:
            raise DesignError('invalid_fields', 'enabled must be boolean', 422)
        with self.lock:
            if expected_revision != catalog.revision:
                raise DesignError('library_conflict', 'Retrieve the current catalog revision before changing libraries', 409)
            previous = self.index()
            projected = deepcopy(previous)
            entry = next((e for e in projected['items'] if e['id'] == namespace), None)
            if entry is None:
                raise DesignError('not_found', 'Element library not found', 404)
            target = version or entry['activeVersion']
            if target not in [b['version'] for b in entry['versions']]:
                raise DesignError('not_found', 'Installed library version not found', 404)
            entry.update(enabled=enabled, activeVersion=target)
            self._publish(projected, previous, catalog)
            return self.describe(catalog)

    def seed(self, directory, catalog):
        """
        Offer only the newest bundled release in each namespace; explicit operator pins remain.

        Args:
            directory: Trusted application seed folder; absent folders are a no-op.
            catalog: Current catalogue reloaded after each actual import.

        Returns:
            None. Adds newest immutable bundles without deleting installed versions or changing selection.

        Raises:
            DesignError: Invalid seeds, immutable version conflicts or existing storage limits.
        """
        if not directory.is_dir():
            return
        newest = {}
        component_ids = {}
        for path in sorted(directory.glob('*.aglib.json')):
            bundle = read_json(path)
            component_ids.setdefault(bundle['id'],set()).update(component['id'] for component in bundle['components'])
            current = newest.get(bundle['id'])
            if current is None or release_order(bundle['version']) > release_order(current['version']):
                newest[bundle['id']] = bundle
        # Check every namespace before importing any release: newest must preserve the complete shipped identity set.
        for key, bundle in newest.items():
            if component_ids[key] - {component['id'] for component in bundle['components']}:
                raise DesignError('incomplete_bundled_release','Latest bundled release omits older component IDs',503)
        for key in sorted(newest):
            self.import_bundle(newest[key], catalog, catalog.revision, activate=False)

    def component_bundle(self, namespace, local_id):
        """Resolve only active bundled components; disabled libraries cannot serve executable previews."""
        library_id(namespace)
        for bundle in self.bundles():
            if bundle['id'] == namespace and any(c['id'] == local_id for c in bundle['components']):
                return bundle
        raise DesignError('not_found', 'Active library preview not found', 404)
