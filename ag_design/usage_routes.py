"""Read-only aggregate usage endpoint, available even without writable library adapters."""

from fastapi import Request

from .usage import usage_summary
from .validation import query_parameters


def install(app, catalog):
    """Expose only bounded counts; opening this route never registers a component use."""
    @app.get('/api/v1/usage-summary')
    def registered_usage_summary(request: Request):
        """Filter the page while preserving the full active normalization population."""
        values = query_parameters(request, {'componentId', 'limit', 'offset'})
        return usage_summary(catalog, component_id=values.get('componentId'),
                             limit=values['limit'], offset=values['offset'])
