"""External editable design metadata; bundled catalog files are upgrade seeds, never the live library."""

from copy import deepcopy
import hashlib
import os
from pathlib import Path
from threading import RLock

from .config import resource_root
from .errors import DesignError
from .library_json import atomic_json, digest, read_json


def default_library_dir():
    """Resolve a separate operator-configured library folder, independent of service code and report storage."""
    if os.environ.get('AG_DESIGN_LIBRARY_DIR'):
        return Path(os.environ['AG_DESIGN_LIBRARY_DIR']).expanduser().resolve()
    from platformdirs import user_data_path
    return user_data_path('AGDesignCommunityLibrary', appauthor=False)


class Library:
    """Keep authored definitions and local package artifacts in a folder outside the replaceable application."""

    def __init__(self, directory=None, *, seed=None):
        """Install missing seeds and upgrade only unchanged managed definitions; never overwrite local edits."""
        proposed = Path(directory) if directory is not None else default_library_dir()
        if proposed.is_symlink():
            raise DesignError('unsafe_library', 'Library directory symlinks are not supported', 503)
        self.directory = proposed.expanduser().resolve()
        resource = resource_root().resolve()
        if self.directory == resource or self.directory.is_relative_to(resource):
            raise DesignError('unsafe_library', 'Library must be outside application code', 422)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.lock, self.conflicts = RLock(), []
        self.seed = Path(seed) if seed is not None else resource / 'catalog'
        marker = self.directory / '.seed-hashes.json'
        previous = read_json(marker) if marker.exists() else {}
        if not isinstance(previous, dict):
            raise DesignError('invalid_library', 'Invalid library seed index', 503)
        hashes = {}
        for section in ('components', 'rules', 'usage', 'debt', 'profiles', 'patterns', 'sections', 'styles'):
            source = self.seed / (section + '.json')
            if not source.exists():
                continue
            base = read_json(source)
            path = self.directory / source.name
            if not path.exists():
                atomic_json(path, base)
            else:
                current = read_json(path)
                if not isinstance(current, dict) or not isinstance(current.get('items'), list) or len(current['items']) > 2000:
                    raise DesignError('invalid_library', 'Invalid library collection', 503)
                if any(not isinstance(item,dict) or not isinstance(item.get('id'),str) for item in current['items']):
                    raise DesignError('invalid_library', 'Every entry requires a string id', 503)
                actual = {item['id']: item for item in current['items']}
                for item in base['items']:
                    key = section + ':' + item['id']
                    old = actual.get(item['id'])
                    if old is None or digest(old) == previous.get(key):
                        actual[item['id']] = item
                    elif old != item:
                        self.conflicts.append(key)
                current['items'] = list(actual.values())
                atomic_json(path, current)
            for item in base['items']:
                hashes[section + ':' + item['id']] = digest(item)
        atomic_json(marker, hashes)
        packages = self.directory / 'packages'
        if packages.is_symlink():
            raise DesignError('unsafe_library', 'Package directory symlinks are not supported', 503)
        packages.mkdir(exist_ok=True)
        # Archives are immutable, hash-checked build products, never loaded as executable service plugins.
        bundled = resource / 'library-packages'
        if not bundled.is_dir():
            bundled = resource / 'dist/library-packages'
        if bundled.is_dir():
            for artifact in bundled.glob('*.tgz'):
                target = packages / artifact.name
                if target.is_symlink():
                    raise DesignError('unsafe_library', 'Package symlinks are not supported', 503)
                if not target.exists():
                    target.write_bytes(artifact.read_bytes())
                elif hashlib.sha256(target.read_bytes()).digest() != hashlib.sha256(artifact.read_bytes()).digest():
                    self.conflicts.append('package:' + artifact.name)

    def collection(self, name):
        """Read one known declarative collection without accepting a caller-controlled filename."""
        if name not in ('profiles', 'patterns'):
            raise DesignError('invalid_library', 'Unknown library collection')
        items = deepcopy(read_json(self.directory / (name + '.json'))['items'])
        if name == 'profiles':
            from .element_libraries import ElementLibraries
            items.extend(ElementLibraries(self.directory).profiles())
        return items

    def register(self, value, catalog, *, expected_revision=None):
        """Register draft metadata only; no code, package installation or qualification is executed by registration."""
        with self.lock:
            if expected_revision is not None and expected_revision != catalog.revision:
                raise DesignError('library_conflict', 'Retrieve current catalog revision before updating metadata', 409)
            item = deepcopy(value)
            if type(item) is not dict or 'design' not in item:
                raise DesignError('invalid_fields', 'Describe intended use, rationale, limitations and sources')
            item.setdefault('colorProfiles', [profile['id'] for profile in self.collection('profiles')])
            catalog._validate_item('components', item)
            if set(item['colorProfiles']) - {profile['id'] for profile in self.collection('profiles')}:
                raise DesignError('invalid_fields', 'Unknown color profile')
            catalog._validate_item('components', item)
            if set(item['rules']) - {rule['id'] for rule in catalog.sections['rules']}:
                raise DesignError('invalid_fields', 'Unknown component rule')
            if set(item) & {'libraryId', 'libraryVersion', 'localId', 'previewHash'} or catalog.by_id.get(item['id'], {}).get('libraryId'):
                raise DesignError('library_owned_component', 'Update the owning immutable library bundle instead', 409)
            existing = catalog.by_id.get(item['id'])
            if existing and expected_revision is None:
                raise DesignError('library_conflict', 'Existing component requires expectedRevision', 409)
            design = item.setdefault('design', {})
            design['lifecycle'] = 'draft'
            path = self.directory / 'components.json'
            data = read_json(path)
            items = {entry['id']: entry for entry in data['items']}
            if not existing and len(items) >= 2000:
                raise DesignError('library_full', 'Component collection is full', 413)
            items[item['id']] = item
            data['items'] = list(items.values())
            # Validate the complete projected collection before its atomic persistence.
            catalog._validate_section('components', data['items'])
            atomic_json(path, data)
            catalog.reload()
            return catalog.get(item['id'])
