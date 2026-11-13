"""Compose the independent local catalog API, durable evidence store and static design UI."""

from contextlib import asynccontextmanager
from dataclasses import asdict
from pathlib import Path
import secrets
import asyncio
import logging
import os
import sqlite3
import sys
import uuid
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from service_telemetry.integration import Telemetry, TelemetryMiddleware, install_routes as install_telemetry_routes

from . import __version__
from .catalog import Catalog
from .config import Settings, default_data_dir, resource_root
from .errors import DesignError
from .desktop_widget import RecentOperations
from .window_review import WINDOW_WRITES, install as install_window_review
from .routes import install_routes, storage
from .security import Discovery, local_origin, permitted_request
from .storage import Store
from .ui_map_routes import UI_MAP_PATHS, install as install_ui_map_routes
from .composition_routes import COMPOSITION_PATHS, install as install_composition_routes
from .composition_store import CompositionStore
from .layout_grid_routes import GRID_PATHS, install as install_layout_grid_routes
from .layout_grid_capture import GridCaptureStore
from .studio_workspace import StudioWorkspace
from .studio_routes import STUDIO_PATHS, install as install_studio_routes
from .project_catalog import PROJECT_CATALOG_WRITES, PROJECT_COMPONENTS, ProjectCatalog
from .project_catalog_routes import install as install_project_catalog
from .update_checker import UpdateChecker, CHECK_INTERVAL_SECONDS
from .update_routes import REMINDER_PATH, install as install_update_routes

CSP = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'"


def create_app(data_dir=None, *, catalog_dir=None, web_dir=None, origin=None, library_dir=None, search_model_dir=None):
    """Create isolated testable catalog/storage owners; only lifespan publishes live endpoint discovery."""
    directory = Path(data_dir) if data_dir is not None else default_data_dir()
    from .library import Library
    library = None
    if catalog_dir is None:
        location = library_dir or os.environ.get('AG_DESIGN_LIBRARY_DIR') or (directory.parent / (directory.name + '-library') if data_dir is not None else None)
        library = Library(location)
    catalog = Catalog(library.directory if library else catalog_dir)
    from .discovery import Discovery as SearchDiscovery
    from .search_model import default_model_dir
    model_dir = search_model_dir or (os.environ.get('AG_DESIGN_SEARCH_MODEL_DIR') or default_model_dir() if catalog_dir is None else None)
    if not search_model_dir and os.environ.get('AG_DESIGN_SEARCH_MODE') == 'fts':
        model_dir = None
    discovery_search = SearchDiscovery(directory / 'search-cache', model_dir=model_dir)
    catalog.discovery = discovery_search
    configured_origin = local_origin(origin) if origin else None
    instance_id, ui_token = uuid.uuid4().hex, secrets.token_urlsafe(32)

    @asynccontextmanager
    async def lifespan(app):
        """Acquire one external data owner, publish only its identity and close both resources on every exit."""
        store = Store(directory)
        discovery = studio = telemetry = maintenance = update_worker = None
        try:
            discovery_search.refresh(catalog)
            discovery = Discovery(directory, configured_origin, instance_id) if configured_origin else None
            app.state.store = store
            app.state.native_updates = UpdateChecker(directory, __version__)
            app.state.native_updates_loop = asyncio.get_running_loop()

            async def check_installed_updates():
                """Let startup finish, then refresh public release metadata in the background."""
                await asyncio.sleep(10)
                while True:
                    result = await app.state.native_updates.check()
                    interval = 3600 if result['status'] == 'unavailable' else CHECK_INTERVAL_SECONDS
                    await asyncio.sleep(interval)

            if configured_origin and getattr(sys, 'frozen', False) and os.getenv('AG_DESIGN_DISABLE_UPDATE_CHECK') != '1':
                update_worker = asyncio.create_task(check_installed_updates(), name='ag-design-native-updates')
            app.state.project_catalog = ProjectCatalog(store)
            app.state.compositions = CompositionStore(store,catalog)
            app.state.grid_captures = GridCaptureStore(app.state.compositions)
            studio = app.state.studio = StudioWorkspace(store,app.state.compositions)
            telemetry = app.state.telemetry = Telemetry(directory, 'ag-design')
            if discovery:
                discovery.publish()

            async def clean_temporary_graphs():
                """Sweep only ephemeral data each minute; empty sweeps perform no database writes."""
                while True:
                    await asyncio.sleep(60)
                    try:
                        await asyncio.to_thread(studio.cache.sweep)
                    except (sqlite3.Error, DesignError):
                        logging.getLogger(__name__).warning('Temporary journey cleanup failed; addressed reads still enforce expiration')

            maintenance = asyncio.create_task(clean_temporary_graphs())
            yield
        finally:
            discovery_search.close()
            if update_worker:
                update_worker.cancel()
                await asyncio.gather(update_worker, return_exceptions=True)
            if maintenance:
                maintenance.cancel()
                await asyncio.gather(maintenance,return_exceptions=True)
            try:
                if studio:
                    studio.close()
            finally:
                try:
                    if discovery:
                        discovery.close()
                finally:
                    try:
                        if telemetry:
                            await telemetry.close()
                    finally:
                        store.close()

    app = FastAPI(title='Ag Design',version=__version__,lifespan=lifespan)
    from desktop_support.activity import install_activity
    install_activity(app, 'ag-design-community')
    app.state.telemetry = None
    install_telemetry_routes(app, lambda: app.state.telemetry, directory)
    app.add_middleware(TelemetryMiddleware, owner=lambda: app.state.telemetry, excluded_paths=PROJECT_CATALOG_WRITES.keys() | {PROJECT_COMPONENTS})
    app.state.catalog = catalog
    app.state.desktop_operations = RecentOperations()

    @app.middleware('http')
    async def boundary(request: Request, call_next):
        """Require numeric loopback/same origin and an explicit UI guard for bounded record writes."""
        started = perf_counter()
        if not permitted_request(request, configured_origin):
            response = JSONResponse({'error':{'code':'forbidden','message':'Local same-origin access required'}},status_code=403)
        elif request.method in {'POST','PATCH','PUT','DELETE'} and request.url.path not in {REMINDER_PATH, '/api/v1/agent/performance','/api/v1/agent/components','/api/v1/agent/checks','/api/v1/agent/usage','/api/v1/color-scheme','/api/v1/palette','/api/v1/interface-evaluation','/api/v1/agent/libraries','/api/v1/agent/libraries/state','/api/v1/golden-canon/check'} | set(UI_MAP_PATHS) | set(COMPOSITION_PATHS) | set(STUDIO_PATHS) | set(GRID_PATHS) | set(WINDOW_WRITES) | set(PROJECT_CATALOG_WRITES) and not secrets.compare_digest(request.headers.get('x-ag-design-ui','').encode('utf-8'),ui_token.encode('ascii')):
            response = JSONResponse({'error':{'code':'ui_action_required','message':'Use the local UI session for writes'}},status_code=403)
        else:
            try:
                response = await call_next(request)
            except Exception:
                app.state.desktop_operations.record(request.method, request.url.path, 500, (perf_counter() - started) * 1000)
                raise
        app.state.desktop_operations.record(request.method, request.url.path, response.status_code, (perf_counter() - started) * 1000)
        headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN'}
        if not (request.url.path.startswith('/api/v1/library-previews/') and response.status_code == 200):
            headers['Content-Security-Policy'] = CSP
        response.headers.update(headers)
        return response

    @app.exception_handler(DesignError)
    async def domain_error(request, error):
        """Return fixed public validation/domain errors without raw local paths or report contents."""
        return JSONResponse({'error':{'code':error.code,'message':error.message}},status_code=error.status)

    @app.exception_handler(sqlite3.Error)
    async def storage_error(request, error):
        """Keep SQL, filesystem details and lock contents out of public service failures."""
        return JSONResponse({'error':{'code':'storage_unavailable','message':'Local report storage unavailable'}},status_code=503)

    @app.get('/healthz')
    def health():
        """Expose process liveness without pretending the UI or measurements have been rendered."""
        return {'status':'ok'}

    @app.get('/api/v1/status')
    def status():
        """Identify the actual instance and retained/catalog counts used by the read-only MCP bridge."""
        store = storage(app)
        return {'application':'ag-design','version':__version__,'instanceId':instance_id,'catalogRevision':catalog.revision,
                'counts':{name:len(items) for name,items in catalog.sections.items()},
                'storage':{'kind':'sqlite','external':True,'counts':store.counts(),'retention':asdict(store.settings)},
                'capabilities':{'mcpReadOnly':False,'metadataWritesOnly':True,'projectCatalog':'local-project-components-v1','performanceReports':'outcome-v2','agentPerformanceWrite':True,'reportTrust':'caller-reported','stageRecommendations':library is not None,'colorProfiles':library is not None,'ruleSections':library is not None,'interfaceRubric':'ag-interface-review-v2','authoringBrief':library is not None,'requirementsPolicy':'ag-component-requirements-v1','statelessEvaluation':library is not None,'nativeUpdates':'ag-design/native-updates-v1','systemStyles':'ag-design/system-styles-v1','componentPurposeSearch':'offline-ru-en-v1','uiMap':'ag-design/ui-graph-v1','uiMapImportBytes':4194304,'composition':'ag-design/composition-v2','compositionTrust':'caller-reported','compositionBytes':524288,'brandStudio':'ag-design/brand-studio-v1','journeyTesting':'exact-revision-v1','temporaryJourneyCache':'sliding-activity-v1','studioPptx':'editable-schematic-v1','layoutGrids':'ag-design/layout-grid-v1','layoutGridCapture':'numeric-only-transient-v1','goldenCanonGrid':'ag-diagonal-core-v1','goldenCanonPptx':'ag-design/golden-canon-pptx-v1'},
                'library':{'external':library is not None,'directory':str(library.directory) if library else None},
                'discovery': discovery_search.status()}

    @app.get('/api/v1/ui-session')
    def ui_session():
        """Issue the local workflow guard; it is not an authentication or trusted measurement attestation."""
        return {'token':ui_token}

    @app.get('/api/desktop/v1/widget')
    def desktop_widget(request: Request):
        """Supply safe metadata to OS widgets; use the actual validated bound origin, never a preferred-port guess."""
        actual_origin = configured_origin or local_origin(str(request.base_url).rstrip('/'))
        return app.state.desktop_operations.snapshot(actual_origin, __version__)

    from .golden_canon_routes import install as install_golden_canon
    install_golden_canon(app)
    install_layout_grid_routes(app)
    install_routes(app,catalog)
    from .search_routes import install as install_search_routes
    install_search_routes(app, catalog)
    install_ui_map_routes(app)
    install_window_review(app)
    install_composition_routes(app)
    install_studio_routes(app)
    install_project_catalog(app)
    install_update_routes(app)
    if library:
        from .design_routes import install as install_design_routes
        install_design_routes(app,catalog,library)
    web_root = Path(web_dir) if web_dir is not None else resource_root() / 'web'
    app.mount('/',StaticFiles(directory=web_root,html=True,check_dir=False),name='web')
    return app
