"""Composition MCP shares the HTTP command bus and never runs source text or arbitrary URLs."""

def install(mcp, bridge):
    """Expose eight explicit operations with address, CAS and evidence identities in their schemas."""
    @mcp.tool()
    def prepare_composition(document:dict, author_id:str)->dict:
        """First obtain design_brief and find fitting components; prepare a pinned document and keep its contextReceipt."""
        return bridge.write('/api/v1/composition/prepare',{'document':document,'authorId':author_id})

    @mcp.tool()
    def inspect_composition(document_id:str)->dict:
        """Read the addressed document and revision after a conflict or timeout; never retarget the active tab."""
        return bridge.write('/api/v1/composition/inspect',{'documentId':document_id})

    @mcp.tool()
    def apply_composition_patch(document_id:str,expected_revision:int,idempotency_key:str,author_id:str,context_receipt:str,operations:list[dict])->dict:
        """One atomic batch; reuse the exact operation key after timeout to recover its committed acknowledgement."""
        return bridge.write('/api/v1/composition/patch',{'documentId':document_id,'expectedRevision':expected_revision,
            'idempotencyKey':idempotency_key,'authorId':author_id,'contextReceipt':context_receipt,'operations':operations})

    @mcp.tool()
    def check_composition(document_id:str,expected_revision:int,context_receipt:str,facts:dict)->dict:
        """Evaluate measured DOM facts, coverage and required geometry; supplied evidence remains caller reported."""
        return bridge.write('/api/v1/composition/checks',{'documentId':document_id,'expectedRevision':expected_revision,
            'contextReceipt':context_receipt,'facts':facts})

    @mcp.tool()
    def composition_report(report_id:str)->dict:
        """Read immutable measurements and findings before deciding the next limited repair."""
        return bridge.write('/api/v1/composition/report',{'reportId':report_id})

    @mcp.tool()
    def compare_compositions(before_id:str,after_id:str)->dict:
        """Compare compatible report IDs; missing checks are unknown and cannot close an earlier failure."""
        return bridge.write('/api/v1/composition/compare',{'beforeId':before_id,'afterId':after_id})

    @mcp.tool()
    def undo_composition(document_id:str,expected_revision:int,idempotency_key:str,author_id:str,context_receipt:str)->dict:
        """Undo only the latest own command, keeping an atomic new revision and idempotent operation record."""
        return bridge.write('/api/v1/composition/undo',{'documentId':document_id,'expectedRevision':expected_revision,
            'idempotencyKey':idempotency_key,'authorId':author_id,'contextReceipt':context_receipt})

    @mcp.tool()
    def qualify_composition(report_id:str)->dict:
        """Check artifact-bound admission; caller facts alone cannot certify host integration or accessibility."""
        return bridge.write('/api/v1/composition/qualification',{'reportId':report_id})
