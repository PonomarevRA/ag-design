"""Verify the native Help controller against its owner event loop."""

import asyncio
from threading import Event, Thread
from types import SimpleNamespace

from ag_design.native_updates_help import UpdateHelp
from ag_design.update_checker import RELEASES_URL


def test_help_uses_owner_loop_and_opens_fixed_release_url(monkeypatch):
    """An explicit manual check renders notes once and opens GitHub only on acceptance."""
    loop = asyncio.new_event_loop()
    worker = Thread(target=loop.run_forever)
    worker.start()
    shown = Event()
    dialogs = []
    urls = []

    async def check(*, force):
        assert force and asyncio.get_running_loop() is loop
        return {'status': 'available', 'installedVersion': '0.47.5', 'latestVersion': '0.47.6',
                'notes': ['Новая подсказка']}

    def dialog(title, message):
        dialogs.append((title, message))
        return True

    def open_url(url):
        urls.append(url)
        shown.set()

    monkeypatch.setattr('ag_design.native_updates_help.webbrowser.open', open_url)
    try:
        help_menu = UpdateHelp(SimpleNamespace(create_confirmation_dialog=dialog), SimpleNamespace(check=check), loop)
        assert len(help_menu.actions()) == 3
        assert not dialogs
        help_menu.check()
        assert shown.wait(3)
        assert '0.47.5' in dialogs[0][1] and '0.47.6' in dialogs[0][1]
        assert 'Новая подсказка' in dialogs[0][1]
        assert urls == [RELEASES_URL]
    finally:
        loop.call_soon_threadsafe(loop.stop)
        worker.join(3)
        loop.close()


def test_cached_status_exposes_availability_without_network(monkeypatch):
    """Opening status shows the cached version and changelog without checking GitHub."""
    shown = Event()
    messages = []

    def dialog(title, message):
        messages.append(message)
        shown.set()
        return False

    checker = SimpleNamespace(status=lambda: {'status': 'available', 'installedVersion': '0.47.5',
                                             'latestVersion': '0.47.6', 'notes': ['Новый экспорт']})
    menu = UpdateHelp(SimpleNamespace(create_confirmation_dialog=dialog), checker, None)
    menu.status()
    assert shown.wait(3)
    assert 'Доступна версия 0.47.6' in messages[0]
    assert 'Новый экспорт' in messages[0]
