"""Background release discovery and explicit reminders for the public ag-design edition."""

import asyncio
import json
from pathlib import Path
import platform
import re
import sys
import tempfile
from threading import Lock
import time

import httpx

from desktop_support.updates import version_tuple

REPOSITORY_URL = 'https://github.com/PonomarevRA/ag-design'
RELEASES_URL = REPOSITORY_URL + '/releases'
API_URL = 'https://api.github.com/repos/PonomarevRA/ag-design/releases/latest'
CHECK_INTERVAL_SECONDS = 24 * 60 * 60
REMINDER_INTERVAL_SECONDS = 3 * CHECK_INTERVAL_SECONDS
RETRY_INTERVAL_SECONDS = 60 * 60
MAX_RESPONSE_BYTES = 256 * 1024
VERSION = re.compile(r'v?(?:0|[1-9][0-9]{0,7})\.(?:0|[1-9][0-9]{0,7})\.(?:0|[1-9][0-9]{0,7})', re.ASCII)
CONTROL = re.compile(r'[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]')


def _version(value):
    """Return a bounded stable release tuple or reject a malformed version."""
    if not isinstance(value, str) or not VERSION.fullmatch(value):
        raise ValueError('Invalid stable version')
    return version_tuple(value)


def _installer_suffix():
    """Identify the installer that can run on this operating system and architecture."""
    os_names = {'darwin': ('macos', 'dmg'), 'win32': ('windows', 'exe'), 'linux': ('linux', 'tar.gz')}
    arches = {'arm64': 'arm64', 'aarch64': 'arm64', 'x86_64': 'x64', 'amd64': 'x64'}
    os_info = os_names.get(sys.platform)
    arch = arches.get(platform.machine().lower())
    if os_info and arch:
        return f'{os_info[0]}-{arch}.{os_info[1]}'
    return None


def _notes(body):
    """Return the first three short user-facing release notes as literal strings."""
    if not isinstance(body, str):
        return []
    result = []
    for line in body[:16000].splitlines():
        if result and line.lstrip().startswith('#'):
            break
        if line.startswith(('- ', '* ')):
            item = CONTROL.sub('', line[2:]).strip()
            if item:
                result.append(item[:160])
            if len(result) == 3:
                break
    return result


async def fetch_release():
    """Read bounded public GitHub metadata without cookies, credentials or redirects."""
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'ag-design-update-check'}
    async with httpx.AsyncClient(follow_redirects=False, trust_env=False) as client:
        async with client.stream('GET', API_URL, headers=headers) as response:
            if response.status_code == 404:
                return None
            response.raise_for_status()
            content = bytearray()
            async for chunk in response.aiter_bytes(chunk_size=16 * 1024):
                if len(content) + len(chunk) > MAX_RESPONSE_BYTES:
                    raise ValueError('Release metadata exceeds its size limit')
                content.extend(chunk)
    return json.loads(content)


def _project(payload, installed, suffix):
    """Validate stable identity and matching native assets before offering an update."""
    if payload is None:
        return {'status': 'no-release'}
    if not isinstance(payload, dict) or payload.get('draft') is not False or payload.get('prerelease') is not False:
        raise ValueError('Invalid release metadata')
    tag = payload.get('tag_name')
    if not isinstance(tag, str) or not tag.startswith('v'):
        raise ValueError('Invalid release tag')
    version = _version(tag)
    url = f'{RELEASES_URL}/tag/{tag}'
    if payload.get('html_url') != url:
        raise ValueError('Unexpected release URL')
    normalized = '.'.join(map(str, version))
    result = {'latestVersion': normalized, 'releaseUrl': url, 'notes': _notes(payload.get('body'))}
    if version <= _version(installed):
        return {**result, 'status': 'current'}
    assets = payload.get('assets')
    if not isinstance(assets, list):
        raise ValueError('Invalid release assets')
    uploaded = {asset.get('name') for asset in assets if isinstance(asset, dict)
                and asset.get('state') == 'uploaded' and isinstance(asset.get('name'), str)}
    installer = f'ag-design-community-{normalized}-{suffix}'
    required = {installer, installer + '.json', 'SHA256SUMS'}
    return {**result, 'status': 'available' if suffix and required <= uploaded else 'no-installer'}


class UpdateChecker:
    """Own a single public metadata check and an on-disk cooldown for this app instance."""

    def __init__(self, directory, installed_version, *, fetch=None, clock=time.time, suffix=None):
        self.path = Path(directory) / 'update-reminder.json'
        self.installed = installed_version
        self.fetch = fetch if fetch is not None else fetch_release
        self.clock = clock
        self.suffix = suffix if suffix is not None else _installer_suffix()
        self._check_lock = asyncio.Lock()
        self._deadline_changed = asyncio.Event()
        self._lock = Lock()
        self._snapshot = {}
        self._load_reminder()

    def _load_reminder(self):
        """Recover only a finite, nonnegative timestamp from bounded local state."""
        self._reminded_at = None
        try:
            if self.path.is_symlink():
                return
            with self.path.open('rb') as stream:
                raw = stream.read(4097)
            if len(raw) > 4096:
                return
            data = json.loads(raw)
            timestamp = data.get('remindedAt') if isinstance(data, dict) else None
            if type(timestamp) in (int, float) and 0 <= timestamp < 1e12:
                self._reminded_at = timestamp
        except (OSError, ValueError):
            pass

    def _due(self, now):
        """Respect the shared cooldown even when a newer version appears in the meantime."""
        return (self._snapshot.get('status') == 'available'
                and now < self._snapshot.get('nextCheckAt', 0)
                and (self._reminded_at is None or now >= self._reminded_at + REMINDER_INTERVAL_SECONDS))

    def _status(self, now):
        """Return detached state for a client while the caller owns the state lock."""
        next_check = self._snapshot.get('nextCheckAt')
        return {
            'status': 'unchecked',
            'installedVersion': self.installed,
            'latestVersion': None,
            'releaseUrl': None,
            'releasesUrl': RELEASES_URL,
            'repositoryUrl': REPOSITORY_URL,
            'checkedAt': None,
            'nextCheckAt': None,
            **self._snapshot,
            'notes': list(self._snapshot.get('notes', [])),
            'stale': next_check is not None and now >= next_check,
            'reminderDue': self._due(now),
        }

    def status(self):
        """Read cached data immediately without attempting a network check."""
        with self._lock:
            return self._status(self.clock())

    async def check(self, *, force=False):
        """Deduplicate concurrent checks. Manual checks may bypass the polling interval."""
        before = self._snapshot
        async with self._check_lock:
            with self._lock:
                snapshot = self._snapshot
                if snapshot is not before or not force and self.clock() < snapshot.get('nextCheckAt', 0):
                    return self._status(self.clock())
            try:
                async with asyncio.timeout(8):
                    result = _project(await self.fetch(), self.installed, self.suffix)
                interval = CHECK_INTERVAL_SECONDS
            except (TimeoutError, httpx.HTTPError, OSError, ValueError, RecursionError):
                result = {'status': 'unavailable'}
                interval = RETRY_INTERVAL_SECONDS
            now = self.clock()
            with self._lock:
                self._snapshot = {**result, 'checkedAt': now, 'nextCheckAt': now + interval}
                status = self._status(now)
            if force:
                self._deadline_changed.set()
            return status

    async def run_periodic(self, *, initial_delay=10):
        """Follow the cached deadline and wake early if Help changes it."""
        await asyncio.sleep(initial_delay)
        while True:
            self._deadline_changed.clear()
            result = await self.check()
            delay = max(1, result['nextCheckAt'] - self.clock())
            try:
                await asyncio.wait_for(self._deadline_changed.wait(), timeout=delay)
            except TimeoutError:
                pass

    def claim(self):
        """Persist one notice before returning it to an agent at the end of a task."""
        with self._lock:
            now = self.clock()
            if not self._due(now):
                return {'update': None}
            temp = None
            try:
                with tempfile.NamedTemporaryFile(dir=self.path.parent, delete=False) as stream:
                    temp = Path(stream.name)
                    stream.write(json.dumps({'remindedAt': now}).encode())
                temp.replace(self.path)
            except OSError:
                if temp is not None:
                    try:
                        temp.unlink(missing_ok=True)
                    except OSError:
                        pass
                return {'update': None}
            self._reminded_at = now
            return {'update': {'version': self._snapshot['latestVersion'],
                               'url': self._snapshot['releaseUrl'],
                               'notes': list(self._snapshot['notes'])}}
