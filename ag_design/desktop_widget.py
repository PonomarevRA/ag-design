"""Process-local operation metadata for genuine OS widgets; never retain query/body contents."""

from collections import deque
from datetime import datetime, timezone
from threading import Lock
import math

RESOURCES = {'components', 'rules', 'usage', 'debt', 'notes', 'audits', 'performance'}


def utc_now():
    """Format UTC capture times explicitly; a widget snapshot is not a real-time stream."""
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


class RecentOperations:
    """Bound metadata to eight entries without retaining agent input, report bodies or client headers."""

    def __init__(self):
        """Own one small per-process ring; a restart intentionally starts with empty coverage."""
        self.rows = deque(maxlen=8)
        self.lock = Lock()
        self.started_at = utc_now()

    def record(self, method, path, status_code, duration_ms):
        """Keep only fixed API resource names and observed HTTP outcomes; exclude static/widget/status polling."""
        parts = path.split('/')
        if len(parts) not in (4, 5) or parts[:3] != ['', 'api', 'v1'] or parts[3] not in RESOURCES:
            return
        if method not in {'GET', 'POST'}:
            return
        resource = parts[3]
        detail = len(parts) == 5
        operation = f'{method} {resource}' + (' detail' if detail else '')
        elapsed = duration_ms if math.isfinite(duration_ms) else 0.0
        row = {'timestamp': utc_now(), 'operation': operation, 'actorLabel': 'Unknown client',
               'status': 'ok' if 200 <= status_code < 400 else 'error',
               'durationMs': round(max(0.0, min(elapsed, 86_400_000.0)), 3),
               'requestSummary': ('Read ' if method == 'GET' else 'Store caller-reported ') + resource + (' record' if detail else ''),
               'responseSummary': f'HTTP {status_code}'}
        with self.lock:
            self.rows.append(row)

    def snapshot(self, origin, version):
        """Return bounded plain-text evidence with honest identity, process lifetime and coverage limits."""
        with self.lock:
            rows = [dict(row) for row in self.rows]
        return {'schemaVersion': 'ag-desktop/widget-v1', 'appId': 'ag-design',
                'applicationVersion': version, 'capturedAt': utc_now(), 'status': 'ok',
                'origin': origin, 'requests': rows,
                'source': f'Process-local HTTP metadata since {self.started_at}; latest 8 operations, oldest first. MCP uses these HTTP reads; agent/session identity is unavailable. Query values and bodies are omitted. Widget/status polling is excluded.'}
