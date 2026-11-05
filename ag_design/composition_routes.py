"""Fixed bounded composition routes: no navigation, script evaluation or caller-selected storage."""
import asyncio
from fastapi import Request
from fastapi.responses import JSONResponse
from .security import json_body
from .validation import object_fields
from .composition_store import encoded

COMPOSITION_PATHS={f'/api/v1/composition/{name}':200 for name in
                   ('prepare','inspect','patch','checks','report','compare','undo','qualification')}
PUBLIC_COMPOSITION_ERRORS={
    'invalid_composition':(422,'Supply a valid bounded composition document or command.'),
    'composition_not_found':(404,'Inspect an existing document or report identity.'),
    'composition_revision_conflict':(409,'Inspect the current revision before issuing a new command.'),
    'composition_idempotency_conflict':(409,'Reuse an operation key only with exactly the same command.'),
    'composition_baseline_protected':(409,'Mandatory checks, original artifacts and scenario coverage cannot be weakened.'),
    'composition_context_required':(409,'Read the prepared context receipt before writing.'),
    'composition_policy_mismatch':(409,'Prepare a new composition under the current policy.'),
    'composition_pin_mismatch':(409,'Prepare a new composition for changed component artifacts.'),
    'composition_undo_conflict':(409,'Only the author of the latest change can undo it.'),
    'composition_comparison_mismatch':(409,'Compare only compatible document, policy, environment and scenarios.'),
    'composition_capacity':(409,'The bounded composition store reached capacity; no history was silently discarded.'),
}


def install(app):
    """Register a compact command vocabulary over the lifespan-owned durable store."""
    async def dispatch(request, method, allowed, required, arguments):
        """Validate the route envelope before running a synchronous SQLite transaction off the event loop."""
        body=await json_body(request,maximum=524288)
        object_fields(body,allowed,required)
        values={target:body.get(source) for target,source in arguments.items()}
        store=app.state.compositions
        result=await asyncio.to_thread(getattr(store,method),**values)
        encoded(result,2_000_000)
        return JSONResponse(result)

    @app.post('/api/v1/composition/prepare')
    async def prepare(request:Request):
        """Prepare a document baseline and provide current authoring rules and component pins."""
        return await dispatch(request,'prepare',{'document','authorId'},{'document','authorId'},
                              {'raw':'document','author_id':'authorId'})

    @app.post('/api/v1/composition/inspect')
    async def inspect(request:Request):
        """Read one explicit bounded document, never whichever tab is currently focused."""
        return await dispatch(request,'inspect',{'documentId'},{'documentId'},{'document_id':'documentId'})

    @app.post('/api/v1/composition/patch')
    async def patch(request:Request):
        """Commit exactly one CAS-protected idempotent batch, or leave the entire document unchanged."""
        fields={'documentId','expectedRevision','idempotencyKey','authorId','contextReceipt','operations'}
        return await dispatch(request,'mutate',fields,fields,{'document_id':'documentId','expected_revision':'expectedRevision',
            'key':'idempotencyKey','author_id':'authorId','receipt':'contextReceipt','operations':'operations'})

    @app.post('/api/v1/composition/undo')
    async def undo(request:Request):
        """Undo only the latest own change; another author's work produces a conflict."""
        body=await json_body(request,maximum=524288)
        fields={'documentId','expectedRevision','idempotencyKey','authorId','contextReceipt'}
        object_fields(body,fields,fields)
        result=await asyncio.to_thread(app.state.compositions.mutate,body['documentId'],body['expectedRevision'],
            body['idempotencyKey'],body['authorId'],body['contextReceipt'],undo=True)
        encoded(result,2_000_000)
        return JSONResponse(result)

    @app.post('/api/v1/composition/checks')
    async def checks(request:Request):
        """Compute findings from supplied DOM facts; pass flags and caller-selected policy are not accepted."""
        fields={'documentId','expectedRevision','contextReceipt','facts'}
        return await dispatch(request,'checks',fields,fields,{'document_id':'documentId','expected_revision':'expectedRevision',
            'receipt':'contextReceipt','facts':'facts'})

    @app.post('/api/v1/composition/report')
    async def report(request:Request):
        """Read one immutable evaluated report with its exact document identity."""
        return await dispatch(request,'report',{'reportId'},{'reportId'},{'report_id':'reportId'})

    @app.post('/api/v1/composition/compare')
    async def compare(request:Request):
        """Compare compatible reports with explicit regressions and unknown results."""
        return await dispatch(request,'compare',{'beforeId','afterId'},{'beforeId','afterId'},
                              {'before_id':'beforeId','after_id':'afterId'})

    @app.post('/api/v1/composition/qualification')
    async def qualification(request:Request):
        """Return an admission decision bound to evidence, preserving unresolved host and manual checks."""
        return await dispatch(request,'qualification',{'reportId'},{'reportId'},{'report_id':'reportId'})
