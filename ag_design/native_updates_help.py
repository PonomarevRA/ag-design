"""Manual native Help actions sharing the HTTP owner's update checker."""

import asyncio
from concurrent.futures import CancelledError, TimeoutError
from threading import Lock, Thread
import webbrowser

from .update_checker import RELEASES_URL


def update_message(result):
    """Format checked release metadata as native plain text."""
    current = result['installedVersion']
    latest = result.get('latestVersion')
    messages = {
        'available': f'Доступна версия {latest}. Установлена {current}.',
        'current': f'Установлена актуальная версия {current}.',
        'no-release': f'Установлена версия {current}. Стабильный релиз на GitHub пока отсутствует.',
        'no-installer': f'Доступна версия {latest}. Установщик для этой платформы пока отсутствует.',
        'unchecked': f'Установлена версия {current}. Проверка ещё не выполнялась.',
    }
    lines = [messages.get(result['status'], f'Установлена версия {current}. GitHub сейчас недоступен.')]
    if result.get('stale'):
        lines.append('Результат последней проверки. Обновите статус через Help.')
    if result['status'] == 'available':
        lines.extend(f'• {note}' for note in result.get('notes', []))
    return '\n'.join(lines)


class UpdateHelp:
    """Keep explicit update checks and dialog handling off the native GUI thread."""

    def __init__(self, window, checker, loop):
        self.window = window
        self.checker = checker
        self.loop = loop
        self.active = Lock()

    def check(self):
        """Start a single manual check from Help or the tray."""
        if self.active.acquire(blocking=False):
            Thread(target=self._check, name='ag-design-update-help', daemon=True).start()

    def _check(self):
        """Render the outcome of an explicit check and offer the official releases page."""
        try:
            operation = self.checker.check(force=True)
            try:
                pending = asyncio.run_coroutine_threadsafe(operation, self.loop)
            except RuntimeError:
                operation.close()
                return
            try:
                result = pending.result(timeout=10)
            except TimeoutError:
                pending.cancel()
                result = {**self.checker.status(), 'status': 'unavailable'}
            except CancelledError:
                return
            self._show(result)
        finally:
            self.active.release()

    def status(self):
        """Show cached availability immediately, without reserving an agent reminder."""
        Thread(target=self._show, args=(self.checker.status(),), name='ag-design-update-status', daemon=True).start()

    def _show(self, result):
        """Show plain release details and open GitHub only after explicit acceptance."""
        message = update_message(result) + '\n\nОткрыть релизы на GitHub?'
        if self.window.create_confirmation_dialog('Ag Design · Обновления', message):
            self.open_releases()

    @staticmethod
    def open_releases():
        """Open the fixed public releases page in the system browser."""
        webbrowser.open(RELEASES_URL)

    def actions(self):
        """Return equivalent commands for each supported native menu."""
        return (
            ('Статус обновлений / Update Status', self.status),
            ('Проверить обновления / Check for Updates', self.check),
            ('Релизы на GitHub / GitHub Releases', self.open_releases),
        )
