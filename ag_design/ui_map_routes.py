"""Five fixed local UI-map operations with route-specific budgets and immutable graph paging."""
import asyncio
import json
from threading import Event
from fastapi import Request
from fastapi.responses import JSONResponse
from .security import json_body
from .validation import object_fields
from .errors import DesignError
from .ui_map_store import UiMapStore
from .ui_map_evaluation import evaluate_ui_map
from .ui_map_compare import compare_ui_maps

UI_MAP_PATHS = {'/api/v1/ui-snapshots':201,'/api/v1/ui-map':200,'/api/v1/ui-node':200,
                '/api/v1/ui-map-evaluation':200,'/api/v1/ui-map-comparison':200}
RESPONSE_LIMIT = 2_000_000
PUBLIC_MAP_ERRORS = {
    'invalid_snapshot':((422,), 'Supply a bounded redacted UI snapshot.'),
    'unsupported_schema':((422,), 'Use the advertised UI snapshot schema.'),
    'invalid_reference':((422,404), 'A UI map reference is invalid or missing.'),
    'hash_mismatch':((409,), 'Snapshot content hash does not match sanitized content.'),
    'policy_mismatch':((409,), 'The map policy changed; explicitly create a new map.'),
    'invalid_provider':((422,), 'Choose semantic, spatial or hybrid.'),
    'limit_exceeded':((413,), 'The UI map operation exceeded its bounded budget.'),
    'cancelled':((409,), 'The UI map operation was cancelled.'),
    'capture_timeout':((408,), 'The UI map deadline expired.'),
    'snapshot_not_found':((404,), 'The snapshot expired; explicitly import it again.'),
    'graph_not_found':((404,), 'The graph expired; explicitly create a new map.'),
    'graph_mismatch':((409,), 'Continue only the selected immutable graph generation.'),
    'too_large':((413,), 'The request exceeded this fixed route byte budget.'),
}


def _encoded(value):
    """Count actual finite UTF-8 JSON bytes, not declared Content-Length or Python characters."""
    return json.dumps(value,ensure_ascii=False,allow_nan=False,separators=(',',':')).encode('utf-8')


def _reply(value,status=200):
    """Never return an oversized result; callers receive an explicit safe error instead of silent loss."""
    if len(_encoded(value))>RESPONSE_LIMIT:
        raise DesignError('limit_exceeded','UI map response exceeds its byte budget',413)
    return JSONResponse(value,status_code=status)


def _map_page(store,value,cancelled):
    """Delegate graph identity and paging; shorten only a byte-limited page with its true continuation."""
    allowed={'snapshotId','graphId','provider','parameters','collection','offset','limit'}
    object_fields(value,allowed)
    names={'snapshotId':'snapshot_id','graphId':'graph_id'}
    request={names.get(key,key):part for key,part in value.items()}
    page=store.read_map(**request,cancelled=cancelled)
    original=page['items']
    page['items']=[]
    used=len(_encoded(page))
    for item in original:
        charge=len(_encoded(item))+1
        if used+charge>524288:
            break
        page['items'].append(item)
        used+=charge
    if not page['items'] and page['total']>page['offset']:
        raise DesignError('limit_exceeded','A UI map item exceeds the page budget',413)
    next_offset=page['offset']+len(page['items'])
    page['nextOffset']=next_offset if next_offset<page['total'] else None
    return page


async def _work(request,operation,*args):
    """Keep heavy bounded work off the event loop; a disconnected request cancels its own generation only."""
    cancelled=Event()
    async def watch():
        """Wait for ASGI disconnect after the route has consumed the request body."""
        # Polling is_disconnected cancels each receive attempt. A pending receive
        # can instead be cancelled once, when the worker finishes.
        while True:
            message = await request.receive()
            if message['type'] == 'http.disconnect':
                cancelled.set()
                return
    monitor=asyncio.create_task(watch())
    try:
        return await asyncio.to_thread(operation,*args,cancelled=cancelled.is_set)
    finally:
        cancelled.set();monitor.cancel()
        await asyncio.gather(monitor,return_exceptions=True)


def install(app):
    """Own one memory-only store per app; routes never navigate, execute snapshot text or write qualification."""
    store=UiMapStore()
    app.state.ui_maps=store

    @app.post('/api/v1/ui-snapshots',status_code=201)
    async def import_snapshot(request:Request):
        """Import a direct structural snapshot under the sole four-MiB route budget."""
        payload=await json_body(request,maximum=4*1024*1024)
        return _reply(await asyncio.to_thread(store.import_snapshot,payload),201)

    @app.post('/api/v1/ui-map')
    async def map_page(request:Request):
        """Create only an explicit first graph or page its immutable graphId."""
        value=await json_body(request)
        return _reply(await _work(request,_map_page,store,value))

    @app.post('/api/v1/ui-node')
    async def node(request:Request):
        """Read one bounded node and its direct evidence from a selected immutable graph."""
        value=await json_body(request)
        object_fields(value,{'graphId','nodeId'},{'graphId','nodeId'})
        return _reply(await asyncio.to_thread(store.read_node,value['graphId'],value['nodeId']))

    @app.post('/api/v1/ui-map-evaluation')
    async def evaluation(request:Request):
        """Translate supported graph evidence into the existing current-policy evaluator."""
        value=await json_body(request);object_fields(value,{'graphId'},{'graphId'})
        return _reply(await _work(request,evaluate_ui_map,store,value['graphId']))

    @app.post('/api/v1/ui-map-comparison')
    async def comparison(request:Request):
        """Compare graph IDs only; no URL, source script or caller-selected policy is accepted."""
        value=await json_body(request);object_fields(value,{'beforeId','afterId'},{'beforeId','afterId'})
        return _reply(await _work(request,compare_ui_maps,store,value['beforeId'],value['afterId']))
