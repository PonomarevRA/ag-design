"""Same-origin in-memory PPTX diagnostics with fixed byte budgets and no path or network access."""
import asyncio
from fastapi import Request
from .errors import DesignError
from .golden_canon import grid_policy,check_grid
from .security import json_body
from .validation import object_fields
from .golden_canon_pptx import review_pptx,MAX_INPUT


def install(app):
    """Install read-only policy discovery and an explicitly guarded diagnostic-copy operation."""
    @app.get('/api/v1/golden-canon')
    def policy():
        """Return the current authored geometry profile and evidence limits."""
        return grid_policy()

    @app.post('/api/v1/golden-canon/check')
    async def check(request:Request):
        """Evaluate a bounded declarative carrier; supplied coordinates remain caller evidence."""
        body=await json_body(request)
        object_fields(body,{'width','height','anchors','tolerance'},{'width','height','anchors'})
        return check_grid(body['width'],body['height'],body['anchors'],body.get('tolerance',0.008))

    @app.post('/api/v1/golden-canon/pptx')
    async def pptx(request:Request, anchor:str='top-left', tolerance:float=0.008, diagnostic:bool=False):
        """Review uploaded bytes without extraction, persistence, URL fetching or original-file mutation."""
        if request.headers.get('content-type','').split(';')[0] != 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            raise DesignError('invalid_content_type','Expected PowerPoint PPTX content type',415)
        raw=bytearray()
        async for chunk in request.stream():
            if len(raw)+len(chunk)>MAX_INPUT:
                raise DesignError('too_large','PPTX input exceeds 12 MiB',413)
            raw.extend(chunk)
        return await asyncio.to_thread(review_pptx,bytes(raw),anchor=anchor,tolerance=tolerance,diagnostic=diagnostic)
