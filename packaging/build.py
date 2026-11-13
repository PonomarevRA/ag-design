"""Build an independent native Ag Design artifact without installing or changing global developer tools."""

import json
import os
from pathlib import Path
import subprocess
import sys


def build_environment(current=None, tools=Path('/Library/Developer/CommandLineTools')):
    """Default to installed CLT only when no toolchain was explicitly selected by the caller."""
    environment = dict(os.environ if current is None else current)
    if sys.platform == 'darwin' and (tools / 'usr/bin/lipo').is_file():
        environment.setdefault('DEVELOPER_DIR',str(tools))
    return environment


def main():
    """Bundle Python, the actual web/vendor files and source catalog; verify the macOS outer seal."""
    root = Path(__file__).resolve().parents[1]
    if not (root/'web/index.html').is_file():
        raise RuntimeError('The actual design UI must be ready before packaging')
    environment = build_environment()
    subprocess.run([sys.executable,'-m','PyInstaller','--noconfirm','--clean',str(root/'packaging/ag_design.spec')],
                   cwd=root,env=environment,check=True)
    if sys.platform == 'darwin':
        product = json.loads((root / 'packaging/desktop-product.json').read_text())
        app = root / 'dist' / (product['name'] + '.app')
        subprocess.run(['codesign','--force','--sign','-',str(app)],env=environment,check=True)
        subprocess.run(['codesign','--verify','--deep','--strict',str(app)],env=environment,check=True)


if __name__ == '__main__':
    main()
