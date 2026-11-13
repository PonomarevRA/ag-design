# Native independent standalone bundle; no dependency on Atlas, Observer or external Python.
from pathlib import Path
import sys
import json
import ssl
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, copy_metadata

root = Path(SPECPATH).parent
product = json.loads((root / 'packaging/desktop-product.json').read_text())
# Include the renderer selected by desktop.py, and omit unused native GUI stacks.
gui_imports = {'darwin': ['webview.platforms.cocoa'],
               'win32': ['webview.platforms.winforms', 'webview.platforms.edgechromium']}.get(sys.platform, ['webview.platforms.qt'])
gui_excludes = ['webview.platforms.gtk', 'PyQt5', 'PySide2', 'PySide6']
if sys.platform != 'linux':
    gui_excludes += ['PyQt6', 'webview.platforms.qt']
if sys.platform != 'darwin':
    gui_excludes += ['webview.platforms.cocoa']
if sys.platform != 'win32':
    gui_excludes += ['webview.platforms.winforms', 'webview.platforms.edgechromium']
hiddenimports = collect_submodules('ag_design') + collect_submodules('desktop_support') + collect_submodules('service_telemetry') + gui_imports + [
    'uvicorn.logging', 'uvicorn.loops.asyncio',
    'uvicorn.protocols.http.h11_impl', 'uvicorn.lifespan.on', 'sqlite3', '_sqlite3',
]
datas = [(str(root / 'web'), 'web'), (str(root / 'catalog'), 'catalog'), (str(root / 'dist/library-packages'), 'library-packages')] + collect_data_files('webview')
ssl_policy = Path(ssl.__file__).parent / 'codex-rejected-cas.pem'
if ssl_policy.is_file():
    datas.append((str(ssl_policy), '.'))
for name in ['fastapi', 'uvicorn', 'httpx', 'pywebview', 'mcp', 'platformdirs']:
    datas += copy_metadata(name)
analysis = Analysis([str(root / 'packaging/entrypoint.py')], pathex=[str(root)], datas=datas,
    binaries=[], hiddenimports=hiddenimports,
    excludes=gui_excludes + ['atlas', 'ag_observer', 'ag_tasks', 'pytest', 'IPython', 'jupyter', 'notebook', 'tkinter', 'torch',
              'langgraph', 'langchain', 'langchain_core'], noarchive=False)
archive = PYZ(analysis.pure)
executable = EXE(archive, analysis.scripts, [], exclude_binaries=True, name='AgDesign', console=True,
                 icon=str(root / 'packaging/icons/app.ico') if sys.platform == 'win32' else None,
                 target_arch=None, codesign_identity=None, entitlements_file=None)
collection = COLLECT(executable, analysis.binaries, analysis.datas, name='AgDesign')
if sys.platform == 'darwin':
    bundle = BUNDLE(collection, icon=str(root / 'packaging/icons/AppIcon.icns'), name=product['name'] + '.app', bundle_identifier=product['bundleId'], version=json.loads((root / 'package.json').read_text())['version'],
        info_plist={'CFBundleDisplayName': 'ag-design', 'NSHighResolutionCapable': True,
                    'NSAppTransportSecurity': {'NSAllowsLocalNetworking': True}})
