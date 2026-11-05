"""Service-owned paths and bounded retention; settings never select executable actions."""

from dataclasses import dataclass
import json
import os
from pathlib import Path
import sys

from .errors import DesignError


def resource_root():
    """Resolve bundled catalog/web assets independently of the working directory."""
    return Path(getattr(sys, '_MEIPASS', Path(__file__).resolve().parent.parent))


def default_data_dir():
    """Keep notes and reports outside the repository, with an explicit operator-only override."""
    override = os.environ.get('AG_DESIGN_DATA_DIR')
    if override:
        return Path(override).expanduser().resolve()
    from platformdirs import user_data_path
    from desktop_support import configured_data_dir
    return user_data_path('AGDesignCommunity', appauthor=False)


def default_backup_dir():
    """Read the installer's separate backup location without creating or migrating a store."""
    from desktop_support import configured_backup_dir
    return default_data_dir().parent / 'AGDesignCommunityBackups'


@dataclass(frozen=True)
class Settings:
    """Limit notes separately from the combined audit/performance report history."""
    maxNotes: int = 1000
    maxReports: int = 1000

    @classmethod
    def load(cls, directory):
        """Read only the external settings.json, refusing malformed values and symlink redirection."""
        path = Path(directory) / 'settings.json'
        if path.is_symlink():
            raise DesignError('invalid_settings', 'Settings symlinks are not supported')
        if not path.exists():
            return cls()
        if path.stat().st_size > 4096:
            raise DesignError('invalid_settings', 'Settings exceed the supported size')
        try:
            value = json.loads(path.read_text(encoding='utf-8'))
        except (ValueError, UnicodeError) as error:
            raise DesignError('invalid_settings', 'Settings must be valid JSON') from error
        if not isinstance(value, dict) or set(value) - {'maxNotes', 'maxReports'}:
            raise DesignError('invalid_settings', 'Unexpected settings fields')
        for item in value.values():
            if type(item) is not int or not 1 <= item <= 1000:
                raise DesignError('invalid_settings', 'Retention limits must be integers from 1 to 1000')
        return cls(**value)
