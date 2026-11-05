"""Canonical catalog with strict lexical results, separate advisory discovery and explicit usage facts."""

from copy import deepcopy
import hashlib
import json
import re
from pathlib import Path
from threading import RLock
from functools import wraps

from .catalog_text import normalized
from .config import resource_root
from .errors import DesignError
from .purpose_search import component_index, interpret, match_component, annotate_page, annotate_reuse
from .validation import encode, finite_number, identifier, object_fields, page, string_list, text

SCHEMA = 'ag-design/catalog-v1'
SECTIONS = ('components', 'rules', 'usage', 'debt', 'sections', 'styles')


def synchronized(method):
    """Keep each catalog read coherent with an explicit reload, including its provenance revision."""
    @wraps(method)
    def call(self, *args, **kwargs):
        with self.lock:
            return method(self, *args, **kwargs)
    return call


class Catalog:
    """Load four fixed files once; requests never supply filesystem locations or trigger consumer scans."""

    def __init__(self, directory=None):
        """Validate bundled source facts and retain a hash revision for bounded result provenance."""
        self.lock = RLock()
        self.discovery = None
        self.directory = Path(directory) if directory is not None else resource_root() / 'catalog'
        self.reload()

    @synchronized
    def reload(self):
        """Publish a fully validated replacement; failed reloads retain the prior coherent catalog."""
        replacement = object.__new__(Catalog)
        replacement.directory = self.directory
        replacement._load()
        self.__dict__.update(sections=replacement.sections, by_id=replacement.by_id, revision=replacement.revision, search_index=replacement.search_index, core_components=replacement.core_components)
        if self.discovery is not None:
            self.discovery.refresh(self)

    def _load(self):
        """Reload validated metadata after an explicit library mutation; request files are never executable."""
        self.sections = {}
        digest = hashlib.sha256()
        for section in SECTIONS:
            path = self.directory / f'{section}.json'
            if section in ('sections', 'styles') and not path.exists():
                self.sections[section] = []
                continue
            if path.is_symlink() or not path.is_file() or path.stat().st_size > 4_194_304:
                raise DesignError('invalid_catalog', 'Catalog files are absent, unsafe or oversized', 503)
            raw = path.read_bytes()
            try:
                value = json.loads(raw)
                object_fields(value, {'schemaVersion', 'items'}, {'schemaVersion', 'items'})
                if value['schemaVersion'] != SCHEMA or not isinstance(value['items'], list) or len(value['items']) > 2000:
                    raise ValueError('Invalid catalog envelope')
                items = self._validate_section(section, value['items'])
            except (ValueError, UnicodeError, DesignError) as error:
                raise DesignError('invalid_catalog', f'Invalid {section} catalog', 503) from error
            self.sections[section] = items
            digest.update(section.encode() + b'\0' + raw)
        from .element_libraries import ElementLibraries
        libraries = ElementLibraries(self.directory)
        self.core_components = deepcopy(self.sections['components'])
        plugin_index = libraries.index()
        from .element_bundles import validate_bundle
        profile_path = self.directory / 'profiles.json'
        profile_ids = {p['id'] for p in json.loads(profile_path.read_text())['items']} if profile_path.exists() else set()
        for bundle in libraries.bundles(index=plugin_index):
            validate_bundle(bundle, self)
            for profile in bundle.get('profiles', []):
                if profile['id'] in profile_ids:
                    raise DesignError('profile_conflict', 'Active libraries must have unique profile IDs', 409)
                profile_ids.add(profile['id'])
        self.sections['components'].extend(libraries.components(plugin_index))
        self.sections['components'] = self._validate_section('components', self.sections['components'])
        if libraries.path.exists():
            digest.update(encode(plugin_index).encode())
        self._validate_references()
        self.revision = digest.hexdigest()
        self.by_id = {item['id']: item for item in self.sections['components']}
        self.search_index = component_index(self.sections['components'])
        self._merge_version_debt()

    def _validate_section(self, section, items):
        """Validate known source shapes, duplicate IDs and per-item byte budgets before publishing any catalog."""
        if section == 'styles' and len(items) > 128:
            raise DesignError('invalid_catalog', 'At most 128 system styles are supported', 503)
        if section == 'sections' and len(items) > 128:
            raise DesignError('invalid_catalog', 'At most 128 readable rule sections are supported', 503)
        seen = set()
        for item in items:
            if not isinstance(item, dict) or len(encode(item).encode('utf-8')) > 65536:
                raise ValueError('Invalid catalog item')
            self._validate_item(section, item)
            key = identifier(item['id'])
            if key in seen:
                raise ValueError('Duplicate catalog identity')
            seen.add(key)
        return sorted(items, key=lambda item: item['id'])

    def _validate_item(self, section, item):
        """Keep component metadata, rules, observed usage and declared debt as separate source contracts."""
        if section == 'styles':
            from .system_styles import validate_style
            validate_style(item)
            return
        if section == 'sections':
            from .rule_sections import validate_section
            validate_section(item)
            return
        fields = {
            'components': {'id','name','summary','category','tags','version','package','exportName','platforms','rules','extensions','usageExample','budget'},
            'rules': {'id','title','summary','severity','check','sourceUrl','componentIds','tags'},
            'usage': {'id','componentId','consumerId','consumerName','version','location','note'},
            'debt': {'id','componentId','consumerId','severity','summary','status','targetVersion'},
        }[section]
        required = set(fields)
        if section == 'components':
            fields = fields | {'design', 'colorProfiles', 'artifactHash', 'anatomy', 'variants', 'states', 'libraryId', 'libraryVersion', 'localId', 'previewHash'}
        object_fields(item, fields, required)
        for name, value in item.items():
            if name in {'anatomy', 'variants', 'states'}:
                if not isinstance(value, list) or len(value) > 20:
                    raise DesignError('invalid_fields', f'{name} must be a list of at most 20 notes')
                for note in value:
                    text(note, name, 400)
            elif name in {'tags','platforms','rules','extensions','componentIds','colorProfiles'}:
                string_list(value, name)
            elif name == 'version':
                text(value, name, 64)
            elif name not in {'budget', 'design'}:
                text(value, name, 16384 if name == 'usageExample' else 4096, empty=name in {'note','sourceUrl','targetVersion'})
        if section == 'components':
            if 'artifactHash' in item and re.fullmatch(r'[0-9a-f]{64}',item['artifactHash']) is None:
                raise DesignError('invalid_fields','artifactHash must be a SHA-256 digest')
            if 'design' in item:
                object_fields(item['design'], {'intendedUse','rationale','alternatives','limitations','lifecycle','sources'}, {'intendedUse','rationale','limitations','lifecycle','sources'})
                for key, value in item['design'].items():
                    if key in ('sources', 'alternatives'):
                        string_list(value, key)
                    else:
                        text(value, key, 4096)
                if item['design']['lifecycle'] not in ('draft','candidate','available'):
                    raise DesignError('invalid_fields', 'Unknown component lifecycle')
            object_fields(item['budget'], {'mountP95Ms','interactionP95Ms','retainedBytesPerInstance'}, {'mountP95Ms','interactionP95Ms','retainedBytesPerInstance'})
            for name, value in item['budget'].items():
                finite_number(value, name)
            if set(item['platforms']) - {'web','macos','windows','linux'}:
                raise ValueError('Unsupported platform')
        elif section == 'rules':
            if item['severity'] not in {'error','warning','manual'} or item['check'] not in {'automated','manual'}:
                raise ValueError('Invalid rule classification')

    def _validate_references(self):
        """Reject dangling component/rule references rather than showing invented relationships."""
        components = {item['id'] for item in self.sections['components']}
        rules = {item['id'] for item in self.sections['rules']}
        for item in self.sections['components']:
            if set(item['rules']) - rules:
                raise DesignError('invalid_catalog', 'Component references an unknown rule', 503)
        for item in self.sections['rules']:
            if set(item['componentIds']) - components:
                raise DesignError('invalid_catalog', 'Rule references an unknown component', 503)
        for item in self.sections.get('sections', []):
            if set(item['ruleIds']) - rules:
                raise DesignError('invalid_catalog', 'Section references an unknown rule', 503)
        for section in ('usage', 'debt'):
            for item in self.sections[section]:
                if item['componentId'] not in components:
                    raise DesignError('invalid_catalog', 'Source fact references an unknown component', 503)

    def _merge_version_debt(self):
        """Compare declared usage versions only; source debt takes precedence over the same migration target."""
        debt = list(self.sections['debt'])
        covered = {(item['componentId'],item['consumerId'],item['targetVersion']) for item in debt}
        seen, identities = set(), {item['id'] for item in debt}
        for usage in self.sections['usage']:
            component = self.by_id[usage['componentId']]
            target = component['version']
            comparison = (usage['componentId'],usage['consumerId'],usage['version'],target)
            if usage['version'] == target or comparison in seen:
                continue
            seen.add(comparison)
            if (usage['componentId'],usage['consumerId'],target) in covered:
                continue
            key = 'usage-version-' + hashlib.sha256(encode(comparison).encode('utf-8')).hexdigest()[:32]
            if key in identities:
                raise DesignError('invalid_catalog', 'Derived debt identity conflicts with source debt', 503)
            identities.add(key)
            previous_label, target_label = usage['version'][:256], target[:256]
            debt.append({'id':key,'componentId':usage['componentId'],'consumerId':usage['consumerId'],
                'severity':'warning','summary':f'Declared usage version {previous_label!r} differs from catalog version {target_label!r}. Version comparison only; consumers were not inspected.',
                'status':'open','targetVersion':target})
        self.sections['debt'] = sorted(debt,key=lambda item:item['id'])


    @synchronized
    def get(self, component_id):
        """Return one actual component definition with an explicit catalog revision."""
        identifier(component_id, 'componentId')
        if component_id not in self.by_id:
            raise DesignError('not_found', 'Component not found', 404)
        return {**deepcopy(self.by_id[component_id]), 'catalogRevision': self.revision}

    @synchronized
    def list(self, section, *, limit=50, offset=0, **filters):
        """Filter source facts exactly; keep strict lexical items separate from optional current discovery candidates."""
        items = []
        query = normalized(filters.pop('q', '')).strip()
        tokens = query.split()
        interpretation = interpret(query) if section == 'components' and query else None
        match_details, related, filtered = {}, [], []
        for item in self.sections[section]:
            matches = True
            for name, expected in filters.items():
                if expected is None or expected == '':
                    continue
                if name == 'tag':
                    actual = item.get('tags', [])
                elif name == 'platform':
                    actual = item.get('platforms', [])
                elif name == 'componentId' and section == 'rules':
                    # Empty componentIds means a global guideline, applicable to every known component.
                    actual = item['componentIds'] or [expected]
                elif name == 'libraryId':
                    actual = item.get(name, 'ag-core')
                else:
                    actual = item.get(name)
                field_matches = expected in actual if isinstance(actual, list) else actual == expected
                if not field_matches:
                    matches = False
                    break
            if not matches:
                continue
            if interpretation:
                filtered.append(item)
                detail = match_component(item, self.search_index[item['id']], interpretation)
                if detail is None:
                    continue
                if detail['matchType'] == 'related-guidance':
                    if len(related) < 4:
                        related.append({'componentId':item['id'], 'name':item['name'], 'summary':item['summary'], **detail})
                    continue
                match_details[item['id']] = detail
            elif tokens:
                haystack = normalized(' '.join(str(item.get(name, '')) for name in ('id','name','title','summary','tags','exportName')))
                if not all(token in haystack for token in tokens):
                    continue
            items.append(item)
        if query and section == 'components':
            items.sort(key=lambda item: (-match_details[item['id']]['rankingScore'], 0 if normalized(item['id']) == query else 1,
                                         0 if normalized(item['name']).startswith(query) else 1, item['id']))
        # Pagination enforces the UTF-8 budget before copying. Non-returned catalog rows stay immutable and shared.
        result = page(items, limit, offset, self.revision)
        result['items'] = deepcopy(result['items'])
        if interpretation:
            annotate_page(result, interpretation, match_details, related)
            annotate_reuse(result, filtered, self.search_index, interpretation)
            if self.discovery is not None and int(offset) == 0:
                discovery = self.discovery.search(query, 'components', {item['id']: item for item in filtered})
                knowledge = self.discovery.search(query, 'sections', {item['id']: item for item in self.sections.get('sections', [])})
                from .discovery import attach_candidates
                attach_candidates(result, discovery, knowledge)
        return result
