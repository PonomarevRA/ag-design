"""Authored section localization and compact agent projections; source records remain unchanged."""
from copy import deepcopy
import hashlib
import json
import re
from .errors import DesignError
from .book_lessons import validate_lesson, lesson_search
from .validation import object_fields, text

LOCALE = re.compile(r'^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$')


def locale_key(value):
    """Accept bounded language tags; unsupported valid languages use an explicitly reported fallback."""
    if not isinstance(value, str) or len(value) > 48 or not LOCALE.fullmatch(value.lower()):
        raise DesignError('invalid_locale', 'Use a bounded language tag such as ru or en', 422)
    return value.lower()


def source_hash(section):
    """Bind translations to the authored source and citations so edited managed records cannot serve stale advice."""
    source = {key: section[key] for key in ('id', 'title', 'summary', 'body', 'ruleIds', 'sources')}
    if 'lesson' in section:
        source['lesson'] = section['lesson']
    raw = json.dumps(source, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(raw).hexdigest()


def validate_translations(section):
    """Validate optional additive metadata without requiring translations in legacy/custom sections."""
    variants = section.get('localizations', {})
    if not isinstance(variants, dict) or len(variants) > 8:
        raise DesignError('invalid_section', 'At most eight localized editions are supported', 422)
    for locale, edition in variants.items():
        if locale_key(locale) != locale or locale == 'ru':
            raise DesignError('invalid_section', 'Use canonical language IDs; ru is the source edition', 422)
        object_fields(edition, {'title', 'summary', 'body', 'sourceHash', 'lesson'}, {'title', 'summary', 'body', 'sourceHash'})
        for key, limit in [('title', 256), ('summary', 2048), ('body', 16384)]:
            text(edition[key], key, limit)
        if 'lesson' in edition:
            validate_lesson(edition['lesson'])
        _validate_hash(edition['sourceHash'])
    guidance = section.get('agentInstructions')
    if guidance is not None:
        object_fields(guidance, {'language', 'body', 'sourceHash'}, {'language', 'body', 'sourceHash'})
        if guidance['language'] != 'en':
            raise DesignError('invalid_section', 'Canonical agent instructions are English', 422)
        text(guidance['body'], 'agentInstructions.body', 8192)
        _validate_hash(guidance['sourceHash'])


def _validate_hash(value):
    """Reject malformed lineage; a well-formed stale hash is retained and reported instead of erasing the source."""
    if not isinstance(value, str) or not re.fullmatch(r'[a-f0-9]{64}', value):
        raise DesignError('invalid_section', 'Translation sourceHash must be SHA-256', 422)


def project_section(section, *, locale='ru', audience='user', include_body=True):
    """Select one current edition, omit raw language dictionaries, and disclose unsupported/stale fallbacks."""
    requested = locale_key(locale)
    if audience not in ('user', 'agent'):
        raise DesignError('invalid_audience', 'Use user or agent audience', 422)
    revision = source_hash(section)
    variants = {key: value for key, value in section.get('localizations', {}).items() if value['sourceHash'] == revision}
    available = ['ru', *variants]
    desired = requested if requested in available else requested.split('-')[0]
    if audience == 'agent':
        desired = 'en'
    if desired in available:
        actual = desired
    elif 'en' in variants:
        actual = 'en'
    else:
        actual = 'ru'
    edition = variants.get(actual, section)
    result = {key: deepcopy(value) for key, value in section.items() if key not in ('body', 'localizations', 'agentInstructions', 'lesson')}
    result.update(title=edition['title'], summary=edition['summary'], locale=actual,
                  requestedLocale=requested, audience=audience, availableLocales=available, sourceHash=revision,
                  fallbackUsed=actual != desired, contentMode='user-edition')
    if audience == 'user' and include_body and 'lesson' in edition:
        result['lesson'] = deepcopy(edition['lesson'])
    if audience == 'user' and not include_body:
        if 'lesson' in edition:
            result['learningGroup'] = edition['lesson']['group']

        terms = [section['title'], section['summary']]
        if 'lesson' in section:
            terms.append(section['lesson']['takeaway'])
        for variant in variants.values():
            terms.extend([variant['title'], variant['summary']])
            if 'lesson' in variant:
                terms.append(variant['lesson']['takeaway'])
        result['searchTerms'] = terms
    instructions = section.get('agentInstructions')
    current_agent = bool(instructions and instructions['sourceHash'] == revision)
    if audience == 'agent' and current_agent:
        result.update(locale='en', fallbackUsed=False, contentMode='agent-instructions')
        # Keep exact source references while excluding prose annotations from compact agent responses.
        result['sources'] = [{k: s[k] for k in ('title', 'url', 'kind')} for s in section['sources']]
        if include_body:
            result['body'] = instructions['body']
    elif include_body:
        result['body'] = edition['body']
    if audience == 'agent' and not current_agent:
        result['agentInstructionsStatus'] = 'stale' if instructions else 'missing'
    if actual != desired or (audience == 'agent' and not current_agent):
        result['fallbackReason'] = 'Requested current edition/instructions unavailable; original source remains accessible'
    return result


def searchable_text(section):
    """Search current RU/translated/agent text without exposing every edition in list responses."""
    parts = [section[key] for key in ('id', 'title', 'summary', 'body')]
    parts.extend(section['tags'])
    parts.append(lesson_search(section.get('lesson')))
    revision = source_hash(section)
    for variant in section.get('localizations', {}).values():
        if variant['sourceHash'] == revision:
            parts.extend(variant[key] for key in ('title', 'summary', 'body'))
            parts.append(lesson_search(variant.get('lesson')))
    agent = section.get('agentInstructions')
    if agent and agent['sourceHash'] == revision:
        parts.append(agent['body'])
    return ' '.join(parts)
