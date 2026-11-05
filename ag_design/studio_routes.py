"""Fixed same-origin brand studio routes using the existing bounded JSON and storage owners."""
import asyncio
from fastapi import Request
from .security import json_body
from .validation import object_fields
from .studio_model import studio_contract

STUDIO_PATHS = {f'/api/v1/studio/{name}':200 for name in ('contract','create','inspect','list','command','export','copy-temporary','extend','touch','trial-start','trial-finish','trial-report','form-requirements')}
PUBLIC_STUDIO_ERRORS = {
    'invalid_studio':(422,'Read design_studio_contract and supply bounded data with valid references.'),
    'studio_expired':(410,'Temporary data expired; create a new prototype or restore your own export.'),
    'studio_not_found':(404,'List existing studio documents and inspect an explicit identity.'),
    'studio_source_conflict':(409,'Inspect the composition and bind its exact current revision and hash.'),
    'studio_revision_conflict':(409,'Inspect the current studio revision before issuing a new command.'),
    'studio_idempotency_conflict':(409,'Reuse an operation key only for the identical command.'),
    'studio_history_conflict':(409,'Undo or redo only an available own history step.'),
    'studio_capacity':(409,'Export documents before explicit storage maintenance; history was not discarded.'),
}


def install(app):
    """Expose a small explicit command vocabulary to browser and local MCP clients."""
    async def dispatch(request, method, fields, required, arguments):
        """Validate the envelope before moving synchronous transactions off the event loop."""
        body = await json_body(request,maximum=600000)
        object_fields(body,fields,required)
        values = {target:body.get(source) for target,source in arguments.items()}
        return await asyncio.to_thread(getattr(app.state.studio,method),**values)

    @app.post('/api/v1/studio/contract')
    async def contract(request: Request):
        """Read a fixed declarative schema/template, without arbitrary source retrieval."""
        object_fields(await json_body(request,maximum=1024),set(),set())
        return studio_contract()

    @app.post('/api/v1/studio/create')
    async def create(request: Request):
        """Create a bounded board, optionally bound to existing composition revisions."""
        return await dispatch(request,'create',{'document','authorId','ttlSeconds'},{'document','authorId'},{'document':'document','author_id':'authorId','ttl_seconds':'ttlSeconds'})

    @app.post('/api/v1/studio/inspect')
    async def inspect(request: Request):
        """Read an explicit studio identity and its current revision."""
        return await dispatch(request,'inspect',{'documentId'},{'documentId'},{'document_id':'documentId'})

    @app.post('/api/v1/studio/list')
    async def list_documents(request: Request):
        """Read titles only; document content remains explicitly addressed."""
        return await dispatch(request,'list',set(),set(),{})

    @app.post('/api/v1/studio/command')
    async def command(request: Request):
        """Apply one revision-checked replace or own undo/redo, without automatic network retry."""
        fields = {'documentId','expectedRevision','idempotencyKey','authorId','kind','document'}
        return await dispatch(request,'command',fields,fields-{'document'},
                              {'document_id':'documentId','expected_revision':'expectedRevision','key':'idempotencyKey',
                               'author_id':'authorId','kind':'kind','document':'document'})

    @app.post('/api/v1/studio/export')
    async def export(request: Request):
        """Return data, never write to a caller-selected path or fetch remote resources."""
        return await dispatch(request,'export',{'documentId','expectedRevision','format'},{'documentId','expectedRevision','format'},
                              {'document_id':'documentId','expected_revision':'expectedRevision','format':'format'})


    @app.post('/api/v1/studio/copy-temporary')
    async def temporary_copy(request: Request):
        """Create an explicit short-lived copy without changing the original permanent board."""
        names={'documentId','expectedRevision','authorId','ttlSeconds'}
        return await dispatch(request,'temporary_copy',names,names,{'document_id':'documentId','expected_revision':'expectedRevision','author_id':'authorId','ttl_seconds':'ttlSeconds'})

    @app.post('/api/v1/studio/extend')
    async def extend(request: Request):
        """Explicitly select a bounded sliding retention window for the current temporary graph."""
        names={'documentId','expectedRevision','ttlSeconds'}
        return await dispatch(request,'extend',names,names,{'document_id':'documentId','expected_revision':'expectedRevision','ttl_seconds':'ttlSeconds'})

    @app.post('/api/v1/studio/touch')
    async def touch(request: Request):
        """Renew only a specifically addressed active board; list/health/cleanup do not renew."""
        return await dispatch(request,'touch',{'documentId'},{'documentId'},{'document_id':'documentId'})

    @app.post('/api/v1/studio/trial-start')
    async def trial_start(request: Request):
        """Start a declared task with pinned revision and an idempotent start key."""
        names={'documentId','expectedRevision','taskId','idempotencyKey'}
        return await dispatch(request,'start_trial',names,names,{'document_id':'documentId','expected_revision':'expectedRevision','task_id':'taskId','key':'idempotencyKey'})

    @app.post('/api/v1/studio/trial-finish')
    async def trial_finish(request: Request):
        """Validate a bounded navigation trace and a separate reported outcome; field values are unsupported."""
        names={'trialId','idempotencyKey','events','durationMs','outcome','notes','checks'}
        return await dispatch(request,'finish_trial',names,names-{'checks'},{'trial_id':'trialId','key':'idempotencyKey','events':'events','duration_ms':'durationMs','outcome':'outcome','notes':'notes','checks':'checks'})

    @app.post('/api/v1/studio/trial-report')
    async def trial_report(request: Request):
        """Read evidence for the current exact graph hash without refreshing its cache window."""
        return await dispatch(request,'trial_report',{'documentId'},{'documentId'},{'document_id':'documentId'})


    @app.post('/api/v1/studio/form-requirements')
    async def form_requirements(request: Request):
        """Read source-backed funnel/operations checklists without loading external sites."""
        from .form_requirements import form_requirements as read
        body=await json_body(request,maximum=1024)
        object_fields(body,{'purpose'},{'purpose'})
        return read(body['purpose'])
