"""Validate portable element-library bundles without importing or executing their preview code."""

from copy import deepcopy
import hashlib
import json
import re
from urllib.parse import urlsplit

from .errors import DesignError
from .validation import object_fields, text

SCHEMA = 'ag-design/element-library-v1'
INDEX_SCHEMA = 'ag-design/element-libraries-v1'
MAX_BUNDLE_BYTES = 524288
COLOR_KEYS = {'accent', 'onAccent', 'surface', 'surfaceAlt', 'text', 'muted', 'border', 'danger', 'success'}


def library_id(value):
    """Reserve a bounded namespace that cannot alias built-ins or form a filesystem path."""
    if not isinstance(value, str) or not re.fullmatch(r'[a-z][a-z0-9-]{1,47}', value) or value == 'ag-core' or '--' in value:
        raise DesignError('invalid_library_id', 'Use a lower-case library namespace; ag-core is reserved', 422)
    return value


def bundle_hash(bundle):
    """Bind preview code, styles, metadata and package provenance to one immutable library version."""
    raw = json.dumps(bundle, sort_keys=True, ensure_ascii=True, separators=(',', ':')).encode()
    return hashlib.sha256(raw).hexdigest()


def validate_profiles(profiles, namespace):
    """Accept bounded semantic color sets, never stylesheet snippets or URLs in token values."""
    if not isinstance(profiles, list) or len(profiles) > 5:
        raise DesignError('invalid_profiles', 'At most five library profiles are supported', 422)
    seen = set()
    for profile in profiles:
        object_fields(profile, {'id', 'name', 'light', 'dark', 'highContrast'}, {'id', 'name', 'light', 'dark'})
        key = profile['id']
        if not isinstance(key, str) or not (key == namespace or key.startswith(namespace + '-')) or key in seen:
            raise DesignError('invalid_profiles', 'Profile IDs must belong to their unique library namespace', 422)
        library_id(key)
        seen.add(key)
        text(profile['name'], 'profile name', 120)
        appearances = [profile]
        if 'highContrast' in profile:
            object_fields(profile['highContrast'], {'light', 'dark'}, {'light', 'dark'})
            appearances.append(profile['highContrast'])
        for appearance in appearances:
            for theme in ('light', 'dark'):
                object_fields(appearance[theme], COLOR_KEYS, COLOR_KEYS)
                for color in appearance[theme].values():
                    if not isinstance(color, str) or not re.fullmatch(r'#[0-9a-fA-F]{6}', color):
                        raise DesignError('invalid_profiles', 'Use opaque #RRGGBB semantic colors', 422)
    return profiles


def validate_bundle(value, catalog):
    """Validate complete library metadata and bounded opaque assets before any persistent write."""
    object_fields(value, {'schemaVersion', 'id', 'name', 'version', 'description', 'sources', 'package', 'components', 'previewScript', 'previewStyles', 'profiles'},
                  {'schemaVersion', 'id', 'name', 'version', 'description', 'sources', 'package', 'components', 'previewScript', 'previewStyles'})
    if value['schemaVersion'] != SCHEMA:
        raise DesignError('invalid_bundle', 'Unsupported element-library schema', 422)
    namespace = library_id(value['id'])
    for key, maximum in [('name', 120), ('description', 2000), ('previewScript', 196608), ('previewStyles', 65536)]:
        text(value[key], key, maximum, empty=key == 'previewStyles')
    if not isinstance(value['version'], str) or not re.fullmatch(r'\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?', value['version']):
        raise DesignError('invalid_version', 'Use an explicit semantic library version', 422)
    if len(json.dumps(value, ensure_ascii=False).encode()) > MAX_BUNDLE_BYTES:
        raise DesignError('too_large', 'Element library exceeds 512 KiB', 413)
    sources = value['sources']
    if not isinstance(sources, list) or not 1 <= len(sources) <= 8:
        raise DesignError('invalid_bundle', 'Declare one to eight source references', 422)
    for source in sources:
        text(source, 'source', 512)
        url = urlsplit(source)
        if url.scheme != 'https' or not url.hostname or url.username or url.password:
            raise DesignError('invalid_bundle', 'Source references must be HTTPS URLs without credentials', 422)
    package = value['package']
    object_fields(package, {'name', 'version', 'sha256'}, {'name', 'version', 'sha256'})
    if not isinstance(package['name'], str) or not re.fullmatch(r'(?:@[a-z0-9-]+/)?[a-z0-9][a-z0-9._-]{0,95}', package['name']):
        raise DesignError('invalid_bundle', 'Invalid npm package name', 422)
    if package['version'] != value['version'] or not isinstance(package['sha256'], str) or not re.fullmatch(r'[0-9a-f]{64}', package['sha256']):
        raise DesignError('invalid_bundle', 'Package version and SHA-256 are required', 422)
    profiles = validate_profiles(value.get('profiles', []), namespace)
    known_profiles = {'atlas', 'memory', 'observer', 'tasks', 'design'} | {p['id'] for p in profiles}
    components = value['components']
    if not isinstance(components, list) or not 1 <= len(components) <= 40:
        raise DesignError('invalid_bundle', 'A library contains one to forty components', 422)
    seen = set()
    for component in components:
        if not isinstance(component, dict) or set(component) & {'libraryId', 'libraryVersion', 'localId', 'previewHash'}:
            raise DesignError('invalid_bundle', 'Library ownership fields are server-generated', 422)
        key = component.get('id')
        if not isinstance(key, str) or not re.fullmatch(r'[a-z][a-z0-9-]{0,47}', key) or key in seen or '--' in key:
            raise DesignError('invalid_bundle', 'Component local IDs must be unique lower-case names', 422)
        seen.add(key)
        if 'design' not in component:
            raise DesignError('invalid_bundle', 'Describe component purpose, rationale and limitations', 422)
        catalog._validate_item('components', component)
        if component['package'] != package['name'] or component['version'] != value['version']:
            raise DesignError('invalid_bundle', 'Every component must belong to this package version', 422)
        if set(component['rules']) - {rule['id'] for rule in catalog.sections['rules']}:
            raise DesignError('invalid_bundle', 'Component references an unknown design rule', 422)
        if set(component.get('colorProfiles', [])) - known_profiles:
            raise DesignError('invalid_bundle', 'Component references an unknown semantic profile', 422)
        if not re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*', component['exportName']):
            raise DesignError('invalid_bundle', 'Component export must be an identifier', 422)
    return deepcopy(value)


def owned_components(bundle):
    """Project local IDs into stable global identities and bind each preview to the complete bundle."""
    projected = []
    preview_hash = bundle_hash(bundle)
    for definition in bundle['components']:
        item = deepcopy(definition)
        local = item['id']
        item.update(id=bundle['id'] + '--' + local, localId=local, libraryId=bundle['id'],
                    libraryVersion=bundle['version'], artifactHash=bundle['package']['sha256'], previewHash=preview_hash)
        projected.append(item)
    return projected
