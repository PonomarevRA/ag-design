"""Fixed library lifecycle routes and opaque-origin preview documents with restrictive CSP."""

import asyncio
import html
import json
import re
import secrets

from fastapi import Request
from fastapi.responses import HTMLResponse

from .element_bundles import MAX_BUNDLE_BYTES
from .element_libraries import ElementLibraries
from .security import json_body
from .validation import object_fields, query_parameters


def preview_document(bundle, local_id, theme, colors):
    """Render opaque assets only in a sandboxed browser frame, never in the service or parent document."""
    nonce = secrets.token_urlsafe(24)
    script = re.sub(r'</script', r'<\\/script', bundle['previewScript'], flags=re.I)
    styles = re.sub(r'</style', r'<\\/style', bundle['previewStyles'], flags=re.I)
    settings = json.dumps({'id': local_id, 'theme': theme}).replace('<', '\\u003c')
    variables = ';'.join('--ag-' + re.sub(r'[A-Z]', lambda m: '-' + m[0].lower(), key) + ':' + value for key, value in colors.items())
    bootstrap = f"AGElementLibrary.render({settings},document.getElementById('sample'));"
    markup = f"""<!doctype html><html lang="ru" data-theme="{theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style nonce="{nonce}">:root{{{variables}}}body{{margin:0;padding:12px;box-sizing:border-box;background:var(--ag-surface);color:var(--ag-text);font:13px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}}{styles}</style></head><body><main id="sample" aria-label="Пример компонента"></main><script nonce="{nonce}">{script}\n{bootstrap}</script></body></html>"""
    policy = f"default-src 'none'; script-src 'nonce-{nonce}'; style-src 'nonce-{nonce}'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox allow-scripts"
    return HTMLResponse(markup, headers={'Content-Security-Policy': policy})


def install(app, catalog, library):
    """Expose bounded bundle import, explicit version activation and fixed sandboxed preview lookups."""
    owner = ElementLibraries(library.directory, library.lock)
    owner.seed(library.seed / 'libraries', catalog)

    @app.get('/api/v1/libraries')
    def libraries():
        """Read installed library versions and the authoritative catalog revision."""
        return owner.describe(catalog)

    @app.post('/api/v1/libraries/import', status_code=201)
    @app.post('/api/v1/agent/libraries', status_code=201)
    async def import_library(request: Request):
        """Import one bounded portable bundle; its JavaScript is stored but never run by the server."""
        value = await json_body(request, maximum=MAX_BUNDLE_BYTES + 4096)
        object_fields(value, {'bundle', 'expectedRevision'}, {'bundle', 'expectedRevision'})
        return await asyncio.to_thread(owner.import_bundle, value['bundle'], catalog, value['expectedRevision'])

    @app.post('/api/v1/libraries/state')
    @app.post('/api/v1/agent/libraries/state')
    async def library_state(request: Request):
        """Explicitly activate a retained version or hide its components without deleting evidence."""
        value = await json_body(request)
        object_fields(value, {'libraryId', 'enabled', 'version', 'expectedRevision'}, {'libraryId', 'enabled', 'expectedRevision'})
        return await asyncio.to_thread(owner.set_state, value['libraryId'], value['enabled'], value.get('version'), catalog, value['expectedRevision'])

    @app.get('/api/v1/library-previews/{namespace}/{local_id}')
    def preview(namespace: str, local_id: str, request: Request):
        """Serve one active component in an opaque sandbox with connect/form restrictions and no parent DOM access."""
        values = query_parameters(request, {'theme', 'profile'})
        theme = 'dark' if values.get('theme') == 'dark' else 'light'
        bundle = owner.component_bundle(namespace, local_id)
        profiles = library.collection('profiles')
        profile_id = values.get('profile', bundle.get('profiles', [{}])[0].get('id') if bundle.get('profiles') else 'design')
        profile = next((p for p in profiles if p['id'] == profile_id), profiles[0])
        return preview_document(bundle, local_id, theme, profile[theme])
