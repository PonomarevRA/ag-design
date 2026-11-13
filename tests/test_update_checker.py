"""Test stable release checks and the shared reminder cooldown offline."""

import asyncio
from concurrent.futures import ThreadPoolExecutor

from ag_design.update_checker import CHECK_INTERVAL_SECONDS, REMINDER_INTERVAL_SECONDS, RELEASES_URL, UpdateChecker


def release(version):
    """Build the minimal published metadata with a verified platform asset set."""
    name = f'ag-design-community-{version}-macos-arm64.dmg'
    return {'tag_name': f'v{version}', 'draft': False, 'prerelease': False,
            'html_url': f'{RELEASES_URL}/tag/v{version}', 'body': '## Что нового\n\n- Проверка в Help',
            'assets': [{'name': item, 'state': 'uploaded'} for item in (name, name + '.json', 'SHA256SUMS')]}


def test_cooldown_shared_and_persisted(tmp_path):
    """Only one agent can claim a notice, including when a restart occurs within three days."""
    now = 1000

    async def fetch():
        return release('0.47.6')

    def checker(installed='0.47.5'):
        return UpdateChecker(tmp_path, installed, fetch=fetch, clock=lambda: now, suffix='macos-arm64.dmg')

    first = checker()
    assert asyncio.run(first.check())['reminderDue']
    assert first.status()['notes'] == ['Проверка в Help']
    with ThreadPoolExecutor(max_workers=8) as workers:
        claims = list(workers.map(lambda _: first.claim(), range(8)))
    assert sum(claim['update'] is not None for claim in claims) == 1
    second = checker()
    now += REMINDER_INTERVAL_SECONDS - 1
    asyncio.run(second.check())
    assert second.claim() == {'update': None}
    now += 1
    assert second.claim()['update']['version'] == '0.47.6'
    current = checker('0.47.6')
    assert asyncio.run(current.check())['status'] == 'current'
    assert current.claim() == {'update': None}


def test_fetch_interval_and_offline_recovery(tmp_path):
    """Cache checks, ignore incomplete releases and recover on an explicit manual check."""
    now = 1000
    calls = 0
    candidate = release('0.47.6')
    candidate['assets'] = []

    async def fetch():
        nonlocal calls
        calls += 1
        if calls == 2:
            raise OSError('offline')
        return candidate

    check = UpdateChecker(tmp_path, '0.47.5', fetch=fetch, clock=lambda: now, suffix='macos-arm64.dmg')
    assert asyncio.run(check.check())['status'] == 'no-installer'
    assert asyncio.run(check.check())['status'] == 'no-installer'
    assert calls == 1
    now += CHECK_INTERVAL_SECONDS
    assert asyncio.run(check.check())['status'] == 'unavailable'
    assert check.claim() == {'update': None}
    candidate = release('0.47.6')
    assert asyncio.run(check.check(force=True))['status'] == 'available'
