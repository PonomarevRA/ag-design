"""Local transport for the project component registry."""

import asyncio

from fastapi import Request

from .project_catalog import PROJECT_COMPONENTS, PROJECT_COMPONENT_REMOVE, PROJECT_COMPONENT_WRITE
from .security import json_body
from .validation import object_fields, query_parameters, record_id


def install(app):
    """Register fixed endpoints so component identities are never part of the logged URL path."""
    @app.get(PROJECT_COMPONENTS)
    def project_components(request: Request):
        """Read a project index or an exact component without a shared-catalog fallback."""
        values = query_parameters(request, {'projectId', 'componentId', 'limit', 'offset'})
        return app.state.project_catalog.read(
            values.get('projectId'), values.get('componentId'),
            limit=min(values['limit'], 50), offset=values['offset'],
        )

    @app.post(PROJECT_COMPONENT_WRITE)
    async def save_project_component(request: Request):
        """Persist one bounded declaration through the owning SQLite transaction."""
        required = {'projectId', 'componentId', 'definition'}
        values = object_fields(await json_body(request), required | {'expectedRevision'}, required)
        revision = values.get('expectedRevision')
        if revision is not None:
            record_id(revision)
        return await asyncio.to_thread(
            app.state.project_catalog.save, values['projectId'], values['componentId'], values['definition'], revision,
        )

    @app.post(PROJECT_COMPONENT_REMOVE)
    async def remove_project_component(request: Request):
        """Remove one current component revision from its project catalog."""
        fields = {'projectId', 'componentId', 'expectedRevision'}
        values = object_fields(await json_body(request), fields, fields)
        return await asyncio.to_thread(
            app.state.project_catalog.remove, values['projectId'], values['componentId'],
            record_id(values['expectedRevision']),
        )
