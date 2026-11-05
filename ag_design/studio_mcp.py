"""Agent tools share the browser's studio store rather than maintaining a second board model."""


def install(mcp, bridge):
    """Publish explicit revisioned authoring and export contracts; no arbitrary URL or script execution."""
    @mcp.tool()
    def design_studio_contract() -> dict:
        """Read exact authoring fields, empty template, examples, limits and relevant brand/journey design-book chapters."""
        return bridge.write('/api/v1/studio/contract',{})

    @mcp.tool()
    def design_studio_list() -> dict:
        """List local brand boards and customer journeys; read design-book brand guidance before authoring."""
        return bridge.write('/api/v1/studio/list',{})

    @mcp.tool()
    def design_studio_create(document:dict, author_id:str, ttl_seconds:int|None=None) -> dict:
        """Create ag-design/brand-studio-v1; bind screens to exact prepared composition IDs, revisions and hashes."""
        return bridge.write('/api/v1/studio/create',{'document':document,'authorId':author_id,'ttlSeconds':ttl_seconds})

    @mcp.tool()
    def design_studio_inspect(document_id:str) -> dict:
        """Open an addressed board and slide its temporary lifetime; list/report do not renew. Screen snapshots are prototypes."""
        return bridge.write('/api/v1/studio/inspect',{'documentId':document_id})

    @mcp.tool()
    def design_studio_command(document_id:str, expected_revision:int, idempotency_key:str, author_id:str, kind:str, document:dict|None=None) -> dict:
        """Replace a whole validated document or undo/redo own history; after timeout inspect or retry the exact same key/payload."""
        return bridge.write('/api/v1/studio/command',{'documentId':document_id,'expectedRevision':expected_revision,
                            'idempotencyKey':idempotency_key,'authorId':author_id,'kind':kind,'document':document})

    @mcp.tool()
    def design_studio_export(document_id:str, expected_revision:int, format:str='svg') -> dict:
        """Export svg/json/tokens or base64 pptx. PPTX has editable graph and schematic cards, not live forms/screenshots. This renews temporary retention."""
        return bridge.write('/api/v1/studio/export',{'documentId':document_id,'expectedRevision':expected_revision,'format':format})


    @mcp.tool()
    def design_studio_temporary_copy(document_id:str, expected_revision:int, author_id:str, ttl_seconds:int=86400) -> dict:
        """Copy a pinned board into a compressed cache; original stays permanent. Sliding window 1h–7d, default 24h."""
        return bridge.write('/api/v1/studio/copy-temporary',{'documentId':document_id,'expectedRevision':expected_revision,'authorId':author_id,'ttlSeconds':ttl_seconds})

    @mcp.tool()
    def design_studio_retention(document_id:str, expected_revision:int, ttl_seconds:int=86400) -> dict:
        """Choose the sliding lifetime for an existing temporary board. Expired identities cannot be resurrected."""
        return bridge.write('/api/v1/studio/extend',{'documentId':document_id,'expectedRevision':expected_revision,'ttlSeconds':ttl_seconds})

    @mcp.tool()
    def design_studio_touch(document_id:str) -> dict:
        """Renew an explicitly active board after real work, never a background keepalive. UI calls at most once/minute."""
        return bridge.write('/api/v1/studio/touch',{'documentId':document_id})

    @mcp.tool()
    def design_form_requirements(purpose:str='operations') -> dict:
        """Read local source-backed common and purpose-specific manual form checks (funnel or operations)."""
        return bridge.write('/api/v1/studio/form-requirements',{'purpose':purpose})

    @mcp.tool()
    def design_journey_trial_start(document_id:str, expected_revision:int, task_id:str, idempotency_key:str) -> dict:
        """Start a declared task with exact graph/hash/checklist pins, expiring within 24h; retry only identical input."""
        return bridge.write('/api/v1/studio/trial-start',{'documentId':document_id,'expectedRevision':expected_revision,'taskId':task_id,'idempotencyKey':idempotency_key})

    @mcp.tool()
    def design_journey_trial_finish(trial_id:str, idempotency_key:str, events:list[dict], duration_ms:int, outcome:str, notes:str='', checks:dict|None=None) -> dict:
        """Submit <=256 edge/back/reset events with elapsedMs; no field values. Separate reported outcome and manual checks from route success."""
        return bridge.write('/api/v1/studio/trial-finish',{'trialId':trial_id,'idempotencyKey':idempotency_key,'events':events,'durationMs':duration_ms,'outcome':outcome,'notes':notes,'checks':checks})

    @mcp.tool()
    def design_journey_trial_report(document_id:str) -> dict:
        """Read only this graph hash's prototype observations, with explicit N and unknowns; does not renew retention."""
        return bridge.write('/api/v1/studio/trial-report',{'documentId':document_id})
