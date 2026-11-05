"""Fixed local geometry/capture routes; only numeric declarative evidence crosses the boundary."""
import asyncio
import json
from fastapi import Request
from .security import json_body
from .validation import object_fields
from .layout_grids import grid_catalog,check_tree
from .grid_icon_draft import icon_draft
from .layout_grid_capture import GridCaptureStore
from .layout_grid_pptx import review_layout_pptx
from .golden_canon_pptx import MAX_INPUT
from .errors import DesignError

GRID_PATHS={f'/api/v1/layout-grids/{name}':200 for name in ('check','configure','inspect','icon-draft')}
PUBLIC_GRID_ERRORS={
 'invalid_layout_grid':(422,'Supply bounded numeric scopes, units, compatible anchors and supported grid settings.'),
 'grid_revision_conflict':(409,'Read the current composition revision and capture that exact scenario.'),
 'grid_configuration_conflict':(409,'Read the addressed grid configuration before changing settings or publishing evidence.'),
 'grid_capture_conflict':(409,'A newer browser activity/capture sequence exists; do not replay stale evidence.'),
 'grid_capacity':(409,'Bounded ephemeral grid capture capacity reached; existing active evidence is retained.'),
}


def install(app):
    """Register pure checks, CAS configuration and addressed transient readback over the lifespan-owned store."""
    @app.get('/api/v1/layout-grids')
    def profiles(q:str=''):
        """Read shipped purpose guidance without remote fetches or execution."""
        return grid_catalog(q)

    @app.get('/api/v1/layout-grids/configuration')
    def configuration(documentId:str):
        """Read one addressed configuration; polling does not extend its lifetime."""
        return app.state.grid_captures.configuration(documentId)

    async def body(request,allowed,required):
        """Bound bytes and reject extra fields before dispatching work off the event loop."""
        data=await json_body(request,maximum=524288)
        object_fields(data,set(allowed),set(required))
        return data

    @app.post('/api/v1/layout-grids/icon-draft')
    async def draft_icon(request:Request):
        """Return bounded original SVG/data/geometry only; no persistent write, file access or arbitrary SVG input."""
        data=await body(request,('symbol','purpose','grid','label','strokeWidth'),())
        return await asyncio.to_thread(icon_draft,symbol=data.get('symbol','focus'),purpose=data.get('purpose','ui'),grid=data.get('grid'),label=data.get('label'),stroke_width=data.get('strokeWidth',1.5))

    @app.post('/api/v1/layout-grids/check')
    async def check(request:Request):
        """Evaluate caller-supplied numeric scopes without saving them or reading files/images."""
        data=await body(request,('unit','tolerance','scopes'),('scopes',))
        return await asyncio.to_thread(check_tree,data)

    @app.post('/api/v1/layout-grids/configure')
    async def configure(request:Request):
        """Change only transient inspection settings; composition baselines and layout remain unchanged."""
        data=await body(request,('documentId','expectedRevision','settings','expectedConfigurationId'),('documentId','expectedRevision','settings'))
        return await asyncio.to_thread(app.state.grid_captures.configure,data['documentId'],data['expectedRevision'],data['settings'],data.get('expectedConfigurationId'))

    @app.post('/api/v1/layout-grids/inspect')
    async def inspect(request:Request):
        """Return an explicit document/scenario's latest eligible capture, otherwise unknown/stale without old hits."""
        data=await body(request,('documentId','scenarioId','expectedRevision'),('documentId',))
        return await asyncio.to_thread(app.state.grid_captures.inspect,data['documentId'],data.get('scenarioId','default'),data.get('expectedRevision'))

    @app.post('/api/v1/layout-grids/publish')
    async def publish(request:Request):
        """Require the UI guard for automatic numeric captures; server recomputes every target and status."""
        data=await body(request,('documentId','expectedRevision','configurationId','capture'),('documentId','expectedRevision','configurationId','capture'))
        return await asyncio.to_thread(app.state.grid_captures.publish,data['documentId'],data['expectedRevision'],data['configurationId'],data['capture'])

    @app.post('/api/v1/layout-grids/invalidate')
    async def invalidate(request:Request):
        """Mark real DOM activity stale using the same monotonically ordered capture channel."""
        data=await body(request,('documentId','expectedRevision','configurationId','scenarioId','sequence'),('documentId','expectedRevision','configurationId','scenarioId','sequence'))
        return await asyncio.to_thread(app.state.grid_captures.invalidate,data['documentId'],data['expectedRevision'],data['configurationId'],data['scenarioId'],data['sequence'])

    @app.post('/api/v1/layout-grids/pptx')
    async def pptx(request:Request,grid_type:str='golden-canon',grid_options:str='{}',anchor:str='center',tolerance:float=.008,diagnostic:bool=False):
        """Review uploaded bounded bytes and return editable diagnostic copies, never caller paths or URLs."""
        if request.headers.get('content-type','').split(';')[0]!='application/vnd.openxmlformats-officedocument.presentationml.presentation':
            raise DesignError('invalid_content_type','Expected PowerPoint PPTX content type',415)
        raw=bytearray()
        async for chunk in request.stream():
            if len(raw)+len(chunk)>MAX_INPUT:
                raise DesignError('too_large','PPTX input exceeds12MiB',413)
            raw.extend(chunk)
        if len(grid_options)>4096:raise DesignError('invalid_layout_grid','Grid options exceed budget',422)
        try:options=json.loads(grid_options)
        except ValueError:raise DesignError('invalid_layout_grid','Grid options require JSON',422)
        if not isinstance(options,dict):raise DesignError('invalid_layout_grid','Grid options require an object',422)
        return await asyncio.to_thread(review_layout_pptx,bytes(raw),grid={**options,'type':grid_type},anchor=anchor,tolerance=tolerance,diagnostic=diagnostic)
