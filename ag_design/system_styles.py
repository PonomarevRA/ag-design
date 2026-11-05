"""Declarative system aesthetics, separate from component contracts and project color profiles."""

from copy import deepcopy
import re
import unicodedata

from .errors import DesignError
from .validation import identifier, object_fields, page, string_list, text

STYLE_SCHEMA = 'ag-design/system-styles-v1'
COLOR_KEYS = {'background', 'surface', 'surfaceAlt', 'text', 'muted', 'border', 'accent', 'onAccent'}
GUIDANCE = ('Choose an aesthetic only for a matching explicit user request. Preserve host semantics, '
            'component behavior and accessibility. Style examples are authored concepts, not qualified components.')


def validate_style(item):
    """Validate bounded prose and tokens; stored references never become URLs, imports or CSS execution."""
    fields = {'id', 'name', 'summary', 'description', 'theme', 'tags', 'aliases', 'suitableFor', 'avoidFor',
              'userRequests', 'reference', 'colors', 'typography', 'geometry', 'materials', 'layout',
              'componentGuidance', 'adaptation', 'applicationPrompt', 'preview'}
    object_fields(item, fields | {'graphics', 'concept'}, fields)
    identifier(item['id'])
    for field, maximum in [('name', 120), ('summary', 256), ('description', 2000), ('applicationPrompt', 3000)]:
        text(item[field], field, maximum)
    if item['theme'] not in ('light', 'dark'):
        raise DesignError('invalid_fields', 'Use an explicit preferred light or dark appearance')
    for field in ('tags', 'aliases', 'suitableFor', 'avoidFor', 'userRequests', 'componentGuidance', 'adaptation'):
        string_list(item[field], field, maximum=20)
    validate_reference(item['reference'])
    object_fields(item['colors'], COLOR_KEYS, COLOR_KEYS)
    for value in item['colors'].values():
        if not isinstance(value, str) or not re.fullmatch(r'#[0-9a-fA-F]{6}', value):
            raise DesignError('invalid_fields', 'Style colors must be opaque #RRGGBB values')
    for field in ('typography', 'geometry', 'materials', 'layout'):
        object_fields(item[field], STYLE_FIELDS[field], STYLE_FIELDS[field])
        for value in item[field].values():
            text(value, field, 1000)
    if 'graphics' in item:
        object_fields(item['graphics'], GRAPHICS_FIELDS, GRAPHICS_FIELDS)
        for value in item['graphics'].values():
            text(value, 'graphics guidance', 2000)
    if 'concept' in item:
        object_fields(item['concept'], {'assetId', 'notes'}, {'assetId', 'notes'})
        if item['concept']['assetId'] not in STYLE_ASSETS:
            raise DesignError('invalid_fields', 'Unknown local concept asset')
        text(item['concept']['notes'], 'concept notes', 1000)
    # Only reviewed local examples may be linked. Custom prose has no executable preview by default.
    if item['preview'] not in (None, *STYLE_ASSETS):
        raise DesignError('invalid_fields', 'Unknown reviewed system-style preview')


STYLE_ASSETS = ('violet-soft-3d', 'midnight-glass', 'coral-pulse', 'graphite-gold', 'amber-circuit', 'saas-clarity', 'learning-air', 'orchid-studio', 'periwinkle-cms')
REFERENCE_ASSETS = (*STYLE_ASSETS, 'amber-circuit-diagonal', 'amber-circuit-portal')


def validate_reference(reference):
    """Retain bounded image provenance and known local assets; no submitted path or URL is fetched."""
    object_fields(reference, {'label', 'sha256', 'interpretation', 'assetId', 'related'}, {'label', 'sha256', 'interpretation'})
    identities = [reference]
    if 'related' in reference:
        if not isinstance(reference['related'], list) or len(reference['related']) > 3:
            raise DesignError('invalid_fields', 'At most three related image references are supported')
        for item in reference['related']:
            object_fields(item, {'label', 'sha256', 'assetId'}, {'label', 'sha256'})
            identities.append(item)
    text(reference['interpretation'], 'reference interpretation', 2000)
    for item in identities:
        text(item['label'], 'reference label', 120)
        if not isinstance(item['sha256'], str) or not re.fullmatch(r'[0-9a-f]{64}', item['sha256']):
            raise DesignError('invalid_fields', 'Image reference requires SHA-256')
        if 'assetId' in item and item['assetId'] not in REFERENCE_ASSETS:
            raise DesignError('invalid_fields', 'Unknown local reference asset')


GRAPHICS_FIELDS = {'language', 'icons', 'illustrations', 'charts', 'generationPrompt', 'negativePrompt', 'delivery'}

STYLE_FIELDS = {
    'typography': {'family', 'body', 'headings', 'numbers'},
    'geometry': {'spacing', 'panels', 'controls', 'density'},
    'materials': {'surfaces', 'borders', 'shadows', 'decoration', 'fallback'},
    'layout': {'shell', 'dashboard', 'workScreen', 'hierarchy'},
}


def normalized_words(value):
    """Normalize Russian/English aliases without network inference or treating matching as admission."""
    normalized = unicodedata.normalize('NFKC', value).casefold().replace('ё', 'е')
    return re.findall(r'[\w-]+', normalized)


def style_matches(item, query):
    """Match explicit style names/tags/aliases; partial lexical matches remain advisory suggestions."""
    generic = {'сдел', 'созд', 'хочу', 'нужн', 'сист', 'инте', 'прил', 'длян', 'make', 'crea', 'inte', 'syst', 'with'}
    terms = [term for term in normalized_words(query) if len(term) >= 3 and term[:4] not in generic]
    searchable = [item['id'], item['name'], *item['tags'], *item['aliases']]
    words = set(normalized_words(' '.join(searchable)))
    russian_prefixes = set()
    for word in words:
        if len(word) >= 4 and re.fullmatch(r'[а-я]+', word):
            russian_prefixes.add(word[:4])
    matched = []
    for term in terms:
        # Russian adjective inflections share a short stem. English terms must match exactly.
        if term in words:
            matched.append(term)
        elif len(term) >= 4 and re.fullmatch(r'[а-я]+', term) and term[:4] in russian_prefixes:
            matched.append(term)
    return sorted(set(matched))


def style_page(catalog, *, q='', limit=20, offset=0):
    """Search a bounded snapshot with match evidence and a revision shared with the component catalog."""
    text(q, 'query', 256, empty=True)
    with catalog.lock:
        found = []
        for item in catalog.sections.get('styles', []):
            matches = style_matches(item, q)
            if q.strip() and not matches:
                continue
            summary = {key: deepcopy(item[key]) for key in ('id', 'name', 'summary', 'theme', 'tags', 'preview', 'colors')}
            summary['matchedTerms'] = matches
            found.append(summary)
        query_words = normalized_words(q)
        # An explicit full style name takes precedence over shared aesthetic vocabulary.
        found.sort(key=lambda item: (
            -int(bool(query_words) and query_words in (normalized_words(item['name']), normalized_words(item['id']))),
            -len(item['matchedTerms']), item['id']))
        result = page(found, limit, offset, catalog.revision)
    result.update(schemaVersion=STYLE_SCHEMA, guidance=GUIDANCE, selection='lexical-advisory')
    return result


def style_detail(catalog, style_id):
    """Read complete application guidance by identity, never by a caller-supplied filesystem path."""
    identifier(style_id, 'styleId')
    with catalog.lock:
        for item in catalog.sections.get('styles', []):
            if item['id'] == style_id:
                return {**deepcopy(item), 'schemaVersion': STYLE_SCHEMA, 'catalogRevision': catalog.revision, 'guidance': GUIDANCE}
    raise DesignError('not_found', 'System style not found', 404)


def install_style_routes(app, catalog):
    """Expose read-only style search/details even for an isolated source catalog without a live library."""
    from fastapi import Request
    from .validation import query_parameters

    @app.get('/api/v1/system-styles')
    def system_styles(request: Request):
        """Return a bounded style page, rejecting unknown and repeated controls."""
        values = query_parameters(request, {'q', 'limit', 'offset'})
        return style_page(catalog, **values)

    @app.get('/api/v1/system-styles/{style_id}')
    def system_style(style_id: str):
        """Return one complete authored style and its application recipe."""
        return style_detail(catalog, style_id)
