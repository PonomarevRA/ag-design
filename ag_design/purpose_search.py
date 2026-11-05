"""Offline purpose discovery with a reviewed RU/EN vocabulary; no model, network or inferred functionality."""

import re
import unicodedata
from copy import deepcopy
from .validation import MAX_PAGE_BYTES, encode, text

# Explicit inflections are deliberate: generic Russian stemming can confuse fields and actions.
GROUPS = {
    'button': 'button buttons кнопка кнопки кнопку кнопке кнопкой кнопок',
    'confirm': 'confirm confirmation confirming approve approval подтверждение подтверждения подтверждению подтверждением подтвердить подтверждать подтверждающая подтверждающий подтверждающие подтвержения подктвержения',
    'action': 'action actions действие действия действию действием',
    'help': 'help hint hints tooltip tooltips explanation explain подсказка подсказки подсказку подсказке подсказкой подсказок пояснение пояснения пояснением пояснить справка справки справку',
    'inline': 'inline contextual beside adjacent near nearby alongside рядом около возле встроенная встроенную контекстная контекстной',
    'text': 'text label labels текст текста текстом тексту подпись подписи подписью',
    'field': 'field fields input поле поля полем полю',
    'setting': 'setting settings настройка настройки настройке настройку',
    'tree': 'tree trees hierarchy hierarchies layer layers дерево дерева дереву деревом дереве деревья деревьев иерархия иерархии иерархию иерархией иерархий вложенность вложенности вложенную вложенный вложенные слой слоя слою слоем слое слои слоев слоёв',
    'object': 'object objects объект объекта объекту объектом объекте объекты объектов',
    'expand': 'expand expands expanded expanding expansion раскрытие раскрытия раскрытию раскрытием раскрывать раскрыть раскрытый раскрытая раскрытые разворачивание развернуть',
    'compact': 'compact компактный компактная компактное компактную компактной компактных компактности',
}
ALIASES = {word: canonical for canonical, words in GROUPS.items() for word in words.split()}
STOP = {'для', 'с', 'со', 's', 'на', 'к', 'в', 'во', 'и', 'a', 'an', 'the', 'for', 'to', 'with', 'of', 'please', 'нужна', 'нужен', 'нужно', 'зачем', 'покажи', 'find', 'show', 'me'}
NEGATIONS = {'не', 'без', 'нет', 'никакой', 'никаких', 'кроме', 'исключая', 'not', 'without', 'no', 'never', 'exclude', 'excluding'}
MAX_REUSE_CANDIDATES = 4
MAX_REUSE_BYTES = 16384
GENERIC_ANCHORS = {'text', 'control', 'controls', 'component', 'components', 'create', 'object', 'compact', 'expand',
                   'ui', 'ux', 'web', 'interface', 'design', 'layout', 'value', 'data', 'engineering', 'management',
                   'компонент', 'компоненты', 'управление', 'интерфейс', 'дизайн'}
REUSE_LIMITATION = ('Declared metadata only: unmatched terms are not evidenced, not proven unsupported. '
                    'Inspect the current definition, extension points and checks before adapting in ag-design; '
                    'search does not establish functional fit or consumer qualification.')


def words(value):
    """Normalize case, Unicode and only known inflections; camelCase exports also contribute readable words."""
    separated = re.sub(r'([a-z])([A-Z])', r'\1 \2', value)
    normalized = unicodedata.normalize('NFKC', separated).casefold()
    result = [ALIASES.get(word, word) for word in re.findall(r'[^\W_]+', normalized, flags=re.UNICODE)]
    if separated != value:
        # Preserve literal exported names alongside human-readable camelCase words.
        literal = unicodedata.normalize('NFKC', value).casefold()
        for word in re.findall(r'[^\W_]+', literal, flags=re.UNICODE):
            canonical = ALIASES.get(word, word)
            if canonical not in result:
                result.append(canonical)
    return result


def component_index(items):
    """Cache bounded search-only fields at catalog reload, excluding code examples, URLs and unrelated rationale."""
    result = {}
    for item in items:
        fields = {}
        for name in ('id', 'name', 'summary', 'category', 'exportName'):
            fields[name] = set(words(item.get(name, '')))
        for name in ('tags', 'anatomy', 'variants', 'states'):
            fields[name] = set(words(' '.join(item.get(name, []))))
        fields['design.intendedUse'] = set(words(item.get('design', {}).get('intendedUse', '')))
        all_words = set()
        primary = set()
        for name, tokens in fields.items():
            all_words.update(tokens)
            if name in ('id', 'name', 'tags', 'exportName'):
                primary.update(tokens)
        result[item['id']] = {'fields': fields, 'words': all_words, 'primary': primary}
    return result


def interpret(query):
    """Explain deterministic purpose vocabulary and retained constraints; unknown terms are never silently discarded."""
    text(query, 'query', 256, empty=True)
    tokens = words(query)
    intents = []
    if 'confirm' in tokens:
        intents.append('confirmation-action')
    if 'help' in tokens:
        intents.append('contextual-help')
    ignored = set(STOP)
    if 'confirmation-action' in intents:
        ignored.add('action')
    if 'contextual-help' in intents:
        ignored.update(('inline', 'text', 'field', 'setting'))
        if re.search(r'\bnext\s+to\b', query.casefold()):
            # The phrase describes adjacency here; `next` remains meaningful in all other queries.
            ignored.add('next')
    significant = list(dict.fromkeys(word for word in tokens if word not in ignored))
    negation_text = unicodedata.normalize('NFKC', query).casefold().replace('’', "'")
    contraction = re.search(r"\b(?:don'?t|doesn'?t|isn'?t|aren'?t|can'?t|cannot)\b", negation_text)
    negative_terms = set(tokens) & NEGATIONS
    # This established empty-state phrase remains literal searchable metadata, including both words.
    # The whole-query exception cannot waive an added prohibition or a different missing object.
    if tokens == ['нет', 'данных']:
        negative_terms.discard('нет')
    return {'mode': 'purpose' if intents else 'lexical', 'normalizedTerms': significant,
            'intents': intents, 'ignoredTerms': list(dict.fromkeys(word for word in tokens if word in ignored)),
            'ambiguousNegation': bool(negative_terms) or contraction is not None,
            'limitations': 'Small explicit RU/EN vocabulary; no semantic model or capability execution. Inspect component contract and qualification.'}


def _term_matches(term, tokens):
    """Keep existing useful lexical prefixes while short terms require exact words to avoid accidental matches."""
    if term in tokens:
        return True
    return len(term) >= 3 and any(word.startswith(term) for word in tokens)


def match_component(item, index, query):
    """Return evidenced purpose/lexical matches; related hints stay separate from real component matches."""
    terms, intents = query['normalizedTerms'], query['intents']
    available, primary = index['words'], index['primary']
    if query['ambiguousNegation'] or not terms:
        return None
    matched_terms = [term for term in terms if _term_matches(term, available)]
    intent_terms = set()
    if 'confirmation-action' in intents:
        intent_terms.update(('confirm', 'button'))
    if 'contextual-help' in intents:
        intent_terms.add('help')
    residual = [term for term in terms if term not in intent_terms]
    if any(not _term_matches(term, available) for term in residual):
        return None
    if not intents:
        if len(matched_terms) != len(terms):
            return None
        classification, notes, score = 'lexical-match', [], 1
    else:
        classification, notes, score = 'purpose-match', [], 0
        for intent in intents:
            if intent == 'confirmation-action':
                # A segmented selector may contain buttons, but its purpose is choosing a value.
                selection_role = primary & {'segmented', 'choice', 'radio', 'checkbox', 'switch', 'tabs', 'toggle', 'переключатель', 'выбор'}
                if selection_role:
                    return None
                if 'button' in primary:
                    score += 100 + (20 if 'confirm' in available else 0)
                    notes.append('Use the action button with an explicit outcome label and primary/secondary priority; confirmation alone does not require a modal dialog.')
                elif 'confirm' in available:
                    classification = 'related-guidance'
                    notes.append('Related confirmation container, not a substitute for the requested action control. Inspect consequences before choosing a dialog.')
                else:
                    return None
            elif intent == 'contextual-help':
                if 'help' in primary:
                    score += 100 + (20 if 'inline' in available else 0)
                    notes.append('Place the help trigger beside the label/text. Compare persistent explanation with a keyboard/touch-operable contextual popup; keep essential instructions visible.')
                elif 'help' in available:
                    classification = 'related-guidance'
                    notes.append('Related explanatory content only; this definition does not establish a dedicated contextual-help control.')
                else:
                    return None
    fields = []
    for name, tokens in index['fields'].items():
        if any(_term_matches(term, tokens) for term in matched_terms):
            fields.append(name)
    return {'componentId': item['id'], 'matchType': classification, 'matchedTerms': matched_terms,
            'matchedFields': fields, 'intents': intents, 'rankingScore': score,
            'rationale': 'Matched reviewed purpose vocabulary in registered metadata; inspect actual behavior and evidence.',
            'compositionNotes': notes}


def annotate_page(result, interpretation, matches, related):
    """Attach explanations only for this page; related candidates never masquerade as exact search results."""
    result['queryInterpretation'] = interpretation
    result['matchExplanations'] = [matches[item['id']] for item in result['items']]
    result['relatedSuggestions'] = related[:4] if result['total'] == 0 else []
    if result['total']:
        result['selection'] = 'purpose-match' if interpretation['intents'] else 'lexical-match'
    else:
        result['selection'] = 'related-guidance' if related else 'no-match'
    if not result['total']:
        result['nextSteps'] = ['Read relevant design-book sections and stage recommendations.',
                               'If no existing contract fits, register and test a draft in ag-design before consumer use.']
    return result


def reuse_match(item, index, interpretation):
    """Describe a partial metadata basis only when a meaningful primary field anchors the retained query."""
    terms = interpretation['normalizedTerms']
    if interpretation['ambiguousNegation'] or not terms:
        return None
    matched = [term for term in terms if _term_matches(term, index['words'])]
    unmatched = [term for term in terms if term not in matched]
    if not unmatched:
        return None
    primary = []
    for term in matched:
        if _term_matches(term, GENERIC_ANCHORS):
            continue
        if _term_matches(term, index['primary']):
            primary.append(term)
    if not primary:
        return None
    fields = [name for name, tokens in index['fields'].items()
              if any(_term_matches(term, tokens) for term in matched)]
    return {'componentId': item['id'], 'name': item['name'], 'version': item['version'],
            'exportName': item['exportName'], 'package': item['package'],
            'libraryId': item.get('libraryId', 'ag-core'), 'libraryVersion': item.get('libraryVersion'),
            'platforms': item['platforms'], 'declaredLifecycle': item.get('design', {}).get('lifecycle'),
            'matchType': 'reuse-candidate', 'matchedTerms': matched, 'unmatchedTerms': unmatched,
            'primaryMatchedTerms': primary, 'matchedFields': fields, 'action': 'inspect/adapt',
            'limitations': REUSE_LIMITATION}


def _fit_exact_details(result):
    """Keep exact page records unchanged; trim optional explanations explicitly if annotation exceeds its byte allowance."""
    result['reuseCandidates'] = []
    result['reuseCandidatesTruncated'] = False
    result['discoveryDetailsTruncated'] = False
    for name in ('relatedSuggestions', 'matchExplanations'):
        while result.get(name) and len(encode(result).encode('utf-8')) > MAX_PAGE_BYTES:
            result[name].pop()
            result['discoveryDetailsTruncated'] = True
    if len(encode(result).encode('utf-8')) > MAX_PAGE_BYTES:
        result['queryInterpretation'] = {'detailsTruncated': True,
                                        'limitations': 'Discovery explanations omitted to retain the exact page byte budget; narrow the query or page.'}
        result['discoveryDetailsTruncated'] = True


def annotate_reuse(result, filtered, index, interpretation):
    """Attach at most four separate, byte-bounded candidates; fit serialization before copying any candidate metadata."""
    if not result['total'] and not interpretation['ambiguousNegation']:
        result['nextSteps'].insert(0, 'Inspect any reuseCandidates with design_component, then adapt and test the existing basis in ag-design before considering custom authoring; unmatched terms remain not evidenced.')
    _fit_exact_details(result)
    if result['total'] or interpretation['ambiguousNegation']:
        return result
    ranked = []
    omitted = False
    for item in filtered:
        candidate = reuse_match(item, index[item['id']], interpretation)
        if candidate is None:
            continue
        size = len(encode(candidate).encode('utf-8'))
        if size > MAX_REUSE_BYTES:
            omitted = True
            continue
        fields = index[item['id']]['fields']
        identity_words = fields['id'] | fields['name'] | fields['exportName']
        identity_matches = sum(_term_matches(term, identity_words) for term in candidate['primaryMatchedTerms'])
        score = (-len(candidate['primaryMatchedTerms']), -len(candidate['matchedTerms']), -identity_matches, item['id'])
        ranked.append((score, candidate))
        ranked.sort(key=lambda row: row[0])
        if len(ranked) > MAX_REUSE_CANDIDATES:
            ranked.pop()
            omitted = True
    for _, candidate in ranked:
        proposal = {**result, 'reuseCandidates': result['reuseCandidates'] + [candidate],
                    'reuseCandidatesTruncated': omitted}
        if len(encode(proposal['reuseCandidates']).encode('utf-8')) > MAX_REUSE_BYTES or len(encode(proposal).encode('utf-8')) > MAX_PAGE_BYTES:
            omitted = True
            continue
        result['reuseCandidates'].append(deepcopy(candidate))
    result['reuseCandidatesTruncated'] = omitted
    return result
