"""
Same-source candidate discovery for people and agents; no mutation/model download endpoint.
"""

from fastapi import Request
from .errors import DesignError
from .validation import query_parameters, text, identifier


def install(app, catalog):
    """
    Expose bounded discovery on app/catalog; request filters never supply paths, SQL or model configuration.
    """
    @app.get('/api/v1/discovery')
    def discover(request: Request):
        """
        Retrieve current component/section candidates within strict domain filters; query max256, limit1–8.
        """
        values = query_parameters(request, {'q', 'kind', 'platform', 'category', 'libraryId', 'limit'})
        if 'limit' not in request.query_params:
            values['limit'] = 4
        query, kind = values.get('q', ''), values.get('kind', 'all')
        text(query, 'query', 256, empty=True)
        try:
            limit = int(values.get('limit', 4))
        except (TypeError, ValueError) as error:
            raise DesignError('invalid_limit', 'Use limit1–8', 422) from error
        if not 1 <= limit <= 8 or kind not in ('all', 'components', 'sections'):
            raise DesignError('invalid_discovery', 'Use components/sections/all and limit1–8', 422)
        platform = values.get('platform')
        if platform and platform not in ('web', 'macos', 'windows', 'linux'):
            raise DesignError('invalid_platform', 'Unknown platform', 422)
        for key in ('libraryId', 'category'):
            if values.get(key):
                identifier(values[key], key)
        with catalog.lock:
            result = {'catalogRevision': catalog.revision, 'candidateOnly': True}
            for domain in ('components', 'sections'):
                if kind not in ('all', domain):
                    continue
                allowed = {}
                for item in catalog.sections.get(domain, []):
                    if domain == 'components':
                        if platform and platform not in item['platforms']:
                            continue
                        if values.get('category') and values['category'] != item['category']:
                            continue
                        if values.get('libraryId') and values['libraryId'] != item.get('libraryId', 'ag-core'):
                            continue
                    allowed[item['id']] = item
                result[domain] = catalog.discovery.search(query, domain, allowed, limit=limit) if catalog.discovery else {'candidates': [], 'status': {'index': 'unavailable'}}
            return result
