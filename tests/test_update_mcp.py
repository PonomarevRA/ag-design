"""Exercise local update discovery and final-answer claims through MCP."""

import asyncio
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from ag_design.app import create_app

from ag_design.mcp_server import build_mcp
from ag_design.update_routes import REMINDER_PATH, UPDATE_PATH


@pytest.fixture
def update_owner(tmp_path):
    """Start a local owner with isolated data and no background release requests."""
    app = create_app(tmp_path / 'data', library_dir=tmp_path / 'library')
    with TestClient(app, base_url='http://127.0.0.1:8897') as client:
        yield client


def test_update_tools_are_local_and_reminder_is_optional():
    """A cached status read and a failed claim both keep GitHub outside the MCP path."""
    origin = 'http://127.0.0.1:8897'
    calls = []

    def handle(request):
        """Return a release only from the pinned local owner."""
        calls.append((request.method, request.url.path))
        assert request.url.host == '127.0.0.1'
        assert request.extensions['timeout']['read'] == 1
        if request.url.path == '/api/v1/status':
            return httpx.Response(200, json={'application': 'ag-design'})
        if request.url.path == UPDATE_PATH:
            return httpx.Response(200, json={'checked': True, 'update': None})
        assert request.url.path == REMINDER_PATH
        assert json.loads(request.content) == {}
        return httpx.Response(503, json={'error': {'code': 'storage_unavailable'}})

    async def exercise(server):
        """Validate the advertised MCP schemas and the two responses."""
        tools = {tool.name: tool for tool in await server.list_tools()}
        assert tools['design_update_status'].annotations.readOnlyHint
        assert not tools['design_claim_update_reminder'].annotations.readOnlyHint
        status = await server.call_tool('design_update_status', {})
        reminder = await server.call_tool('design_claim_update_reminder', {})
        assert json.loads(status[0].text) == {'checked': True, 'update': None}
        assert json.loads(reminder[0].text) == {'update': None}

    with httpx.Client(transport=httpx.MockTransport(handle)) as client:
        asyncio.run(exercise(build_mcp(origin=origin, client=client)))

    assert calls == [
        ('GET', '/api/v1/status'), ('GET', UPDATE_PATH),
        ('GET', '/api/v1/status'), ('POST', REMINDER_PATH),
    ]


def test_local_routes_do_not_fetch_for_status_or_claim(update_owner, monkeypatch):
    """Keep GitHub off the request path even when the service has never checked."""
    client = update_owner
    checker = client.app.state.native_updates

    async def unexpected_check(*args, **kwargs):
        raise AssertionError('Local status and claims must not fetch releases')

    monkeypatch.setattr(checker, 'check', unexpected_check)
    response = client.get(UPDATE_PATH)
    assert response.status_code == 200
    assert response.json()['status'] == 'unchecked'
    assert client.post(REMINDER_PATH, json={}).json()['update'] is None
    assert client.post(REMINDER_PATH, json={'force': True}).status_code == 422
    assert client.post(REMINDER_PATH, json={}, headers={'Origin': 'https://example.test'}).status_code == 403
