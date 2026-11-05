"""Addressed review of the application's own window, independent of visual capture."""

import asyncio
import json
import re
from threading import Lock
from uuid import uuid4

from .native_presentation import origin_key
from .security import json_body
from .validation import object_fields

WINDOW_COMMAND = '/api/v1/desktop-window/command'
WINDOW_CAPTURE = '/api/v1/desktop-window/capture'
WINDOW_WRITES = {WINDOW_COMMAND: 200, WINDOW_CAPTURE: 200}
REVISION = re.compile(r'[0-9a-f-]{36}:[0-9]{1,12}:[a-z-]{1,32}')


class WindowReview:
    """Keep one bounded operation in flight against the exact owned document."""

    def __init__(self, window, origin, capture=None):
        """Bind the exact window independently of optional native presentation features."""
        self.window = window
        self.origin = origin
        self.origin_key = origin_key(origin)
        self.generation = 0
        window.events.loaded += self._loaded
        self.capture = capture
        self.window_id = uuid4().hex
        self.lock = Lock()

    def _loaded(self):
        """Invalidate in-flight operations when the owned WebView finishes navigation."""
        self.generation += 1

    def _active(self, generation):
        """Reject closed, foreign and replaced documents."""
        if self.window.events.closed.is_set() or generation != self.generation:
            return False
        try:
            return origin_key(self.window.get_current_url()) == self.origin_key
        except (ValueError, TypeError, AttributeError):
            return False

    def _state(self, generation, command=None):
        """Use a fixed entry point and check origin on both sides of the call."""
        if not self._active(generation):
            return None
        call = 'review.state()' if command is None else 'review.command(' + json.dumps(command) + ')'
        script = (
            '(() => {if (location.origin !== ' + json.dumps(self.origin) +
            ' || location.pathname !== "/") return null;'
            'const review=window.agDesignWindowReview;'
            'return review ? JSON.stringify(' + call + ') : null;})()'
        )
        value = self.window.run_js(script)
        if not self._active(generation):
            return None
        if not isinstance(value, str) or len(value) > 8192:
            return None
        result = json.loads(value)
        return result if isinstance(result, dict) else None

    def execute(self, kind, request):
        """Return explicit capability/status without arbitrary scripts, selectors or paths."""
        if not self.lock.acquire(blocking=False):
            return {'status': 'busy'}
        try:
            generation = self.generation
            current = self._state(generation)
            if current is None:
                return {'status': 'unavailable', 'windowId': self.window_id}
            info = {'windowId': self.window_id, 'state': current}
            if kind == 'read':
                return {**info, 'status': 'ready',
                        'captureCapability': 'web-content' if self.capture else 'unsupported'}
            if request['windowId'] != self.window_id or request['expectedRevision'] != current.get('revision'):
                return {**info, 'status': 'stale'}
            if kind == 'command':
                result = self._state(generation, request)
                if result is None:
                    return {'windowId': self.window_id, 'status': 'unknown'}
                return {**result, 'windowId': self.window_id}
            if self.capture is None:
                return {**info, 'status': 'unsupported', 'scope': 'web-content'}
            image = self.capture()
            after = self._state(generation)
            if after != current:
                return {**info, 'status': 'stale', 'scope': 'web-content'}
            return {**info, **image, 'scope': 'web-content'}
        except Exception:
            # Navigation, window disposal and unavailable native APIs can race a request.
            return {'windowId': self.window_id, 'status': 'unknown'}
        finally:
            self.lock.release()


def _target(value, *, command=False):
    """Validate target and fixed command vocabulary before crossing into the WebView."""
    from .errors import DesignError

    required = {'windowId', 'expectedRevision'}
    allowed = required | {'action', 'value'} if command else required
    object_fields(value, allowed, required | {'action'} if command else required)
    window_id, revision = value['windowId'], value['expectedRevision']
    if not isinstance(window_id, str) or not re.fullmatch('[0-9a-f]{32}', window_id):
        raise DesignError('invalid_fields', 'Invalid window identity', 422)
    if not isinstance(revision, str) or not REVISION.fullmatch(revision):
        raise DesignError('invalid_fields', 'Invalid window revision', 422)
    if command:
        action, filter_value = value['action'], value.get('value')
        if action == 'filter-history' and filter_value in ('all', 'ok', 'error'):
            return value
        if action not in ('open-history', 'close-history') or filter_value is not None:
            raise DesignError('invalid_fields', 'Invalid window command or filter', 422)
    return value


def install(app):
    """Expose only the application's optional native owner through fixed loopback routes."""
    async def dispatch(kind, value=None):
        """Run the owned adapter off the server event loop with a bounded caller wait."""
        owner = getattr(app.state, 'window_review', None)
        if owner is None:
            return {'status': 'unavailable', 'reason': 'no-native-window'}
        try:
            return await asyncio.wait_for(asyncio.to_thread(owner.execute, kind, value), timeout=4)
        except TimeoutError:
            # The native callback may still finish. Re-read before issuing a new command.
            return {'windowId': owner.window_id, 'status': 'unknown', 'reason': 'timeout'}

    from fastapi import Request

    @app.get('/api/v1/desktop-window')
    async def state():
        """Read the current structured window observation."""
        return await dispatch('read')

    @app.post(WINDOW_COMMAND)
    async def command(request: Request):
        """Validate the addressed command before dispatching it."""
        return await dispatch('command', _target(await json_body(request, maximum=2048), command=True))

    @app.post(WINDOW_CAPTURE)
    async def capture(request: Request):
        """Request web content capture for the observed document."""
        return await dispatch('capture', _target(await json_body(request, maximum=2048)))
