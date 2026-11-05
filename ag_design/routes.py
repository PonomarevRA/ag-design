"""Fixed HTTP catalog/report routes; no endpoint interprets a path, command or remote scenario."""

from fastapi import Request
from starlette.concurrency import run_in_threadpool

from .errors import DesignError
from .reports import validate_report
from .security import json_body
from .validation import identifier, query_parameters
from .usage_routes import install as install_usage_routes

SOURCE_FILTERS = {
    'components': {'q','tag','category','platform','libraryId','limit','offset'},
    'rules': {'q','componentId','tag','limit','offset'},
    'usage': {'componentId','consumerId','limit','offset'},
    'debt': {'componentId','consumerId','limit','offset'},
}


def install_routes(app, catalog):
    """Register fixed catalog reads and bounded report writes, including versioned agent evidence."""
    from .system_styles import install_style_routes
    install_style_routes(app, catalog)
    install_usage_routes(app, catalog)
    for section in SOURCE_FILTERS:
        app.add_api_route('/api/v1/' + section, source_reader(catalog, section), methods=['GET'])
    app.add_api_route('/api/v1/components/{component_id}', component_reader(catalog), methods=['GET'])
    app.add_api_route('/api/v1/agent/performance', record_writer(app, catalog, 'performance', versioned=True), methods=['POST'], status_code=201)
    for kind in ('notes','audits','performance'):
        app.add_api_route('/api/v1/' + kind, record_reader(app, kind), methods=['GET'])
        app.add_api_route('/api/v1/' + kind, record_writer(app, catalog, kind), methods=['POST'], status_code=201)
        app.add_api_route('/api/v1/' + kind + '/{record_id}', record_detail(app, kind), methods=['GET'])


def source_reader(catalog, section):
    """Bind a fixed source section without exposing the binding as a caller-controlled query parameter."""
    def read(request: Request):
        """Read one deterministic page with only that source section's documented filters."""
        parameters = query_parameters(request, SOURCE_FILTERS[section])
        component = parameters.get('componentId')
        if component:
            identifier(component, 'componentId')
            if section == 'rules':
                catalog.get(component)
        return catalog.list(section, **parameters)
    return read


def component_reader(catalog):
    """Bind actual immutable component lookup to its fixed catalog."""
    def read(component_id: str):
        """Read a complete component definition, example, rules, declared budgets and provenance revision."""
        return catalog.get(component_id)
    return read


def storage(app):
    """Require the HTTP lifespan owner; direct MCP calls never create another database connection."""
    store = getattr(app.state, 'store', None)
    if store is None or store.closed:
        raise DesignError('storage_unavailable', 'Local report storage unavailable', 503)
    return store


def record_reader(app, kind):
    """Bind a fixed report kind to its bounded storage page."""
    def read(request: Request):
        """Read retained records newest-first, optionally scoped to an actual component identity."""
        parameters = query_parameters(request, {'componentId','limit','offset'})
        if parameters.get('componentId'):
            identifier(parameters['componentId'], 'componentId')
        return storage(app).list(kind, **parameters)
    return read


def record_writer(app, catalog, kind, *, versioned=False):
    """Bind report appends; versioned agent evidence still cannot execute code or grant qualification."""
    async def write(request: Request):
        """Validate finite bounded JSON, then commit caller-reported evidence before returning 201."""
        payload = await json_body(request)
        if versioned and (not isinstance(payload, dict) or not payload.get('componentId') or 'componentVersion' not in payload):
            raise DesignError('invalid_fields', 'Agent performance requires a versioned component')
        validated, components = validate_report(kind, payload, catalog)
        # SQLite FULL commit and its retention transaction finish before 201; disk waits must not block the event loop.
        store = storage(app)
        return await run_in_threadpool(store.append, kind, validated, components)
    return write


def record_detail(app, kind):
    """Bind only one report kind so a note identity cannot read a different record class."""
    def read(record_id: str):
        """Return a retained record or explicit 404 after bounded retention evicts it."""
        return storage(app).get(kind, record_id)
    return read
