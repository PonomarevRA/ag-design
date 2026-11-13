"""Local update metadata and optional agent reminders."""

import asyncio

from fastapi import Request

from .security import json_body
from .validation import object_fields

UPDATE_PATH = '/api/v1/native-updates'
REMINDER_PATH = UPDATE_PATH + '/reminder'


def install(app):
    """Expose cached release facts and a bounded reminder claim."""

    @app.get(UPDATE_PATH)
    def update_status():
        """Read the installed owner's cached release status."""
        return app.state.native_updates.status()

    @app.post(REMINDER_PATH)
    async def claim_reminder(request: Request):
        """Reserve at most one local reminder per cooldown period."""
        object_fields(await json_body(request, maximum=128), set())
        return await asyncio.to_thread(app.state.native_updates.claim)
