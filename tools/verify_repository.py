"""
Verify the publishable Git surface, including every reachable commit, without reading ignored runtime data.
"""
import argparse
import json
from pathlib import Path
import re
import runpy
import subprocess

PACKAGES = {'components', 'rules', 'visual-tools', 'interaction-tools'}
FORBIDDEN = {'node_modules', '.venv', '__pycache__', 'agent-memory', 'engineering', 'outputs', 'reports', 'evidence', 'archives', 'dist', 'build', '.ag-design', '.codex', '.cursor', '.claude', '.agents', '.idea', '.vscode'}
FORBIDDEN.update({'agent-memmory','agent_memory','.cache','.pytest_cache','.ruff_cache','backups','coverage'})
CHECK_SECRETS = runpy.run_path(str(Path(__file__).with_name('secret_scan.py')))['check_secrets']
# Escape namespace codepoints so the public guard does not itself reproduce denied private labels.
PRIVATE_NAMESPACE = re.compile(r'(?<![a-z0-9])(?:\x62\x63\x73|\u0431\u043a\u0441)(?![a-z0-9])', re.I)
LOCAL_USER_PATH = re.compile(b'/' + rb'Users/[^/\s]+/|[A-Z]:\\Users\\')


def check_blob(name, content):
    """
    Reject runtime/credential paths, foreign package roots and private keys; never print suspected secret bytes.

    Args:
        name: Relative Git path, used only in safe diagnostic messages.
        content: Blob bytes to inspect; suspected private content is never printed.
    """
    path = Path(name)
    CHECK_SECRETS(name, content)
    if path.is_absolute() or '..' in path.parts or FORBIDDEN.intersection(part.casefold() for part in path.parts):
        raise ValueError('Unpublishable path: ' + name)
    if PRIVATE_NAMESPACE.search(name) or name.lower().endswith('.a2a.yaml'):
        raise ValueError('Private namespace or internal memory path: ' + name)
    if re.search(r'\.(?:sqlite3?|db)(?:[-.].*)?$',path.name,re.I):
        raise ValueError('Runtime database file: '+name)
    if path.name.startswith('.env') or path.name in {'.mcp.json', 'credentials.json', 'id_rsa', 'id_ed25519'} or path.suffix.lower() in {'.sqlite', '.sqlite3', '.db', '.log', '.tgz', '.pem', '.key', '.p12', '.pyc'}:
        raise ValueError('Runtime or credential file: ' + name)
    if path.parts[0] == 'packages' and (len(path.parts) < 2 or path.parts[1] not in PACKAGES):
        raise ValueError('Unexpected package: ' + name)
    if len(content) > 8 * 1024 * 1024:
        raise ValueError('Review large publication file: ' + name)
    if path.suffix.lower() in {'.zip','.gz','.tar','.7z','.dmg','.exe','.pkl','.pickle','.onnx','.safetensors'}:
        raise ValueError('Local binary/archive is outside the source edition: ' + name)
    if LOCAL_USER_PATH.search(content):
        raise ValueError('Local user path in: ' + name)
    try:
        text = content.decode('utf-8')
    except UnicodeDecodeError:
        if path.suffix.lower() not in {'.png','.jpg','.jpeg','.webp','.gif','.ico','.woff2','.ttf','.otf'}:
            raise ValueError('Unreviewed binary file: ' + name)
        return
    if PRIVATE_NAMESPACE.search(text):
        raise ValueError('Private namespace in: ' + name)
    private_path = '/' + r'Users/[^/\s]+/|[A-Z]:\\Users\\'
    if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|' + private_path, text):
        raise ValueError('Private material in: ' + name)


def check(root, history=True):
    """
    Inspect staged/tracked bytes and all reachable commit blobs, rejecting links and preserving all repository content.

    Args:
        root: Exact checkout or publication root for this operation.
        history: Include every reachable Git commit when true.
    """
    def git(*args):
        return subprocess.check_output(['git', '-C', str(root), *args])
    checked = set()
    revisions = git('rev-list', '--all').decode().splitlines() if history else []
    if len(revisions) > 1000:
        raise ValueError('History exceeds bounded local review; use a reviewed publication process')
    trees = [git('ls-files', '--stage', '-z')]
    trees.extend(git('ls-tree', '-rz', revision) for revision in revisions)
    for tree in trees:
        for record in tree.split(b'\0'):
            if not record:
                continue
            header, name = record.split(b'\t', 1)
            fields = header.decode().split()
            mode, oid = fields[0], fields[-1] if len(fields) == 3 and fields[1] == 'blob' else fields[1]
            if mode not in {'100644', '100755'}:
                raise ValueError('Nonregular Git entry')
            key = (name, oid)
            if key in checked:
                continue
            check_blob(name.decode('utf-8'), git('cat-file', 'blob', oid))
            checked.add(key)
    return {'commits': len(revisions), 'checkedBlobs': len(checked)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--git', action='store_true')
    options = parser.parse_args()
    print(json.dumps(check(Path(__file__).resolve().parents[1], options.git)))
