"""Deterministic stage/project recommendations; a missing component still yields actionable design principles."""

from .errors import DesignError
from .design_policy import authoring_brief
from .validation import text
from .system_styles import style_page

STAGES = ('plan', 'layout', 'component', 'review', 'release')
PLATFORMS = ('web', 'macos', 'windows', 'linux')
RECOMMENDATION_GUIDANCE = ('Use stage: ' + ', '.join(STAGES)
                           + '; platform: ' + ', '.join(PLATFORMS) + '.')


def _matches_topic(pattern, topic):
    """
    Match bounded authored queryTerms literally; library data never executes or supplies authority.

    Args:
        pattern: Declarative pattern record; malformed optional queryTerms are ignored.
        topic: Validated, casefolded user query with hyphens and repeated whitespace normalized.

    Returns:
        True when one of the first 32 entries is a nonempty string of at most 128 characters occurring in topic.
        This is lexical routing, not semantic understanding or evidence of component support.
    """
    terms = pattern.get('queryTerms', [])
    if not topic or not isinstance(terms, list):
        return False
    for term in terms[:32]:
        if not isinstance(term, str) or not 0 < len(term) <= 128:
            continue
        normalized = ' '.join(term.casefold().replace('-', ' ').split())
        if normalized and normalized in topic:
            return True
    return False


def _route_priority(pattern, baseline_routes, topic_routes, relevant_routes):
    """
    Keep baseline safety routes ahead of authored topics and preserve stable order within each tier.

    Args:
        pattern: Existing declarative record with a validated string id.
        baseline_routes: WebMCP/security routes applicable to the requested platform.
        topic_routes: IDs whose bounded authored queryTerms match this query.
        relevant_routes: Existing component/lifecycle routing IDs, unchanged by topic matching.

    Returns:
        Integer rank: system index 0, web baseline 1, matching topic 2, component route 3, other 4.
        Python stable sorting retains operator collection order when ranks are equal.
    """
    identity = pattern['id']
    if identity == 'component-system-routing':
        return 0
    if identity in baseline_routes:
        return 1
    if identity in topic_routes:
        return 2
    if identity in relevant_routes:
        return 3
    return 4


def recommend(catalog, library, *, query='', stage='plan', platform='web', project=''):
    """
    Rank reusable components and source-backed guidance within the existing 12-pattern response budget.

    Args:
        catalog: Current component/style metadata and immutable authoring policy context.
        library: Operator-owned declarative profile/pattern collections; their source order breaks rank ties.
        query: Literal search text, at most 256 characters; authored topic hints are lexical only.
        stage: One of plan/layout/component/review/release; unsupported stages raise DesignError.
        platform: One of web/macos/windows/linux; web baseline routes retain priority over topic hints.
        project: Optional registered project name, at most 128 characters, used only to select fitting profiles.

    Returns:
        Existing recommendation response with at most 12 patterns, source provenance and independent host briefs.
        Matching newly appended managed seeds remain discoverable; no inference or qualification is claimed.

    Raises:
        DesignError: Query/project text, stage or platform violates the existing validation contract.
    """
    text(query, 'query', 256, empty=True)
    text(project, 'project', 128, empty=True)
    if stage not in STAGES or platform not in PLATFORMS:
        raise DesignError('invalid_recommendation', RECOMMENDATION_GUIDANCE, 422)
    search = catalog.list('components', q=query, platform=platform, limit=8, offset=0) if query.strip() else {}
    exact = search.get('items', [])
    patterns = library.collection('patterns')
    selected = [item for item in patterns if stage in item['stages'] and platform in item['platforms']]
    # Managed upgrades retain operator collection order. Keep the decision index
    # reachable in bounded replies even when it was appended to an existing library.
    # Promote the lifecycle contract for the actual matching component, including appended upgrade seeds.
    lifecycle_routes = {'layout-grid-overlay': 'cinematic-photo-grids', 'grid-icon-draft': 'grid-icon-authoring', 'event-bus': 'scoped-runtime-coordination', 'request-router': 'scoped-runtime-coordination', 'async-boundary': 'async-component-lifecycle', 'render-window': 'offscreen-render-window', 'palette-builder': 'palette-harmony-candidates', 'catalog-card': 'catalog-choice-presentation', 'catalog-search-controls': 'catalog-choice-presentation'}
    relevant_routes = {lifecycle_routes[item['id']] for item in exact if item['id'] in lifecycle_routes}
    # This cross-component guide also needs a bounded route after managed seed append.
    topic = ' '.join(query.casefold().replace('-', ' ').split())
    semantic_query = ('agent interface' in topic or 'agent friendly' in topic or
                      ('интерфейс' in topic and 'агент' in topic))
    semantic_components = {'button', 'field', 'textarea', 'select', 'segmented-choice',
                           'tabs', 'menu', 'tree', 'data-table', 'state-panel',
                           'loading-indicator', 'async-boundary', 'catalog-card',
                           'catalog-search-controls'}
    if semantic_query or any(item['id'] in semantic_components for item in exact):
        relevant_routes.add('human-first-agent-interfaces')
    # Matching advice must survive an appended seed upgrade and the 12-item response budget.
    # Authored topic hints never displace the system index or baseline web safety guidance.
    baseline_routes = {'webmcp-first-design', 'web-security-by-design'} if platform == 'web' else set()
    topic_routes = set()
    for pattern in selected:
        if _matches_topic(pattern, topic):
            topic_routes.add(pattern['id'])
    selected.sort(key=lambda pattern: _route_priority(pattern, baseline_routes, topic_routes, relevant_routes))
    profiles = library.collection('profiles')
    fitting = [item for item in profiles if project.casefold() in [name.casefold() for name in item.get('projects', [])]] if project else []
    result = {'stage': stage, 'platform': platform, 'project': project, 'catalogRevision': catalog.revision,
            'selection': search.get('selection', 'lexical-match') if exact else 'general-guidance', 'components': exact,
            'queryInterpretation': search.get('queryInterpretation'), 'matchExplanations': search.get('matchExplanations', []),
            'relatedSuggestions': search.get('relatedSuggestions', []), 'recommendations': selected[:12],
            'reuseCandidates': search.get('reuseCandidates', []),
            'reuseCandidatesTruncated': search.get('reuseCandidatesTruncated', False),
            'discoveryDetailsTruncated': search.get('discoveryDetailsTruncated', False),
            'systemStyles': style_page(catalog, q=query, limit=4)['items'] if query.strip() else [],
            'styleSelection': 'advisory-only; apply only for an explicit matching aesthetic request',
            'colorProfiles': fitting or profiles, 'profileSelection': 'registered-project' if fitting else 'choose-to-fit-project',
            'authoringBrief': authoring_brief(),
            'componentBriefs': [authoring_brief(item) for item in exact],
            'nextSteps': ['Read authoringBrief and applicable componentBriefs before implementation.','Inspect purpose, rationale, limitations, profile and qualification before reuse.',
                          'An empty exact result does not mean no existing basis: inspect reuseCandidates with design_component, then adapt and test in ag-design; unmatched terms are not evidenced, not proven unsupported.',
                          'Only after inspecting existing bases, register a custom draft if no contract can fit; draft discovery never admits consumer use.',
                          'Record project/version/location and consumer verification; retain design debt if migration is incomplete.'],
            'assessment': 'advisory; manual design and accessibility review required'}
    if query.strip() and catalog.discovery is not None:
        result['componentCandidates'] = search.get('discoveryCandidates', [])
        with catalog.lock:
            knowledge = catalog.discovery.search(query, 'sections', {item['id']: item for item in catalog.sections.get('sections', [])})
        result['knowledgeCandidates'] = knowledge['candidates']
        result['discoveryStatus'] = knowledge['status']
    return result
