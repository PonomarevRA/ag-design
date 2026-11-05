"""Bounded readable guideline sections with explicit source provenance and deterministic lexical search."""

from urllib.parse import urlsplit
from .catalog_text import normalized
from .book_localization import validate_translations, project_section, searchable_text, locale_key
from .errors import DesignError
from .book_lessons import validate_lesson
from .validation import identifier, object_fields, page, string_list, text


def validate_section(item):
    """Validate authored text and citation metadata; citations are data and are never fetched or executed."""
    object_fields(item, {'id', 'title', 'summary', 'tags', 'ruleIds', 'sources', 'body', 'localizations', 'agentInstructions', 'lesson'},
                  {'id', 'title', 'summary', 'tags', 'ruleIds', 'sources', 'body'})
    identifier(item['id'])
    for name, maximum in [('title', 256), ('summary', 2048), ('body', 16384)]:
        text(item[name], name, maximum)
    string_list(item['tags'], 'tags', 32)
    string_list(item['ruleIds'], 'ruleIds', 100)
    if not isinstance(item['sources'], list) or not 1 <= len(item['sources']) <= 16:
        raise DesignError('invalid_section', 'Sections require 1–16 source citations')
    for source in item['sources']:
        object_fields(source, {'title', 'url', 'kind', 'note'}, {'title', 'url', 'kind', 'note'})
        text(source['title'], 'source.title', 256)
        text(source['url'], 'source.url', 2048)
        text(source['note'], 'source.note', 2048, empty=True)
        parsed = urlsplit(source['url'])
        secure_origin = parsed.scheme == 'https' and bool(parsed.hostname)
        has_credentials = bool(parsed.username or parsed.password)
        concatenated_url = 'https://' in parsed.path
        if not secure_origin or has_credentials or concatenated_url:
            raise DesignError('invalid_section', 'Use distinct HTTPS source citations without credentials')
        if source['kind'] not in ('primary', 'secondary', 'ag-policy'):
            raise DesignError('invalid_section', 'Declare primary, secondary or AG-policy provenance')

    if 'lesson' in item:
        validate_lesson(item['lesson'])
    validate_translations(item)


def section_page(catalog, *, q='', limit=50, offset=0, locale='ru', audience='user'):
    """Search all authored text under a coherent catalog revision; summary pages omit bodies to stay compact."""
    text(q, 'query', 256, empty=True)
    locale_key(locale)
    if audience not in ('user', 'agent'):
        raise DesignError('invalid_audience', 'Use user or agent audience', 422)
    tokens = normalized(q).split()
    with catalog.lock:
        selected = []
        for item in catalog.sections.get('sections', []):
            haystack = normalized(searchable_text(item))
            if all(token in haystack for token in tokens):
                selected.append(project_section(item, locale=locale, audience=audience, include_body=False))
        result = page(selected, limit, offset, catalog.revision)
        if q.strip() and catalog.discovery is not None and int(offset) == 0:
            discovery = catalog.discovery.search(q, 'sections', {item['id']: item for item in catalog.sections.get('sections', [])})
            from .discovery import attach_candidates
            attach_candidates(result, discovery)
        return result


def section_detail(catalog, key, *, locale='ru', audience='user'):
    """Read exactly one complete section; identity cannot become a filesystem path or arbitrary URL."""
    identifier(key, 'sectionId')
    with catalog.lock:
        for item in catalog.sections.get('sections', []):
            if item['id'] == key:
                return {**project_section(item, locale=locale, audience=audience), 'catalogRevision': catalog.revision}
    raise DesignError('not_found', 'Rule section not found', 404)
