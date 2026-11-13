"""Validate the tagged community release and collect its exact installer assets."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tomllib

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = 'PonomarevRA/ag-design'
PLATFORMS = {
    'macos-arm64.dmg': ('darwin', {'arm64', 'aarch64'}),
    'macos-x64.dmg': ('darwin', {'x86_64', 'amd64'}),
    'windows-x64.exe': ('win32', {'amd64', 'x86_64'}),
    'linux-x64.tar.gz': ('linux', {'x86_64', 'amd64'}),
}


def check_tag(tag):
    """Require a stable tag and matching application, export and installer versions."""
    if not re.fullmatch(r'v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)', tag, re.ASCII):
        raise ValueError('Expected a stable tag vMAJOR.MINOR.PATCH')
    version = tag[1:]
    project = tomllib.loads((ROOT / 'pyproject.toml').read_text())['project']
    publication = json.loads((ROOT / 'PUBLICATION.json').read_text())
    product = json.loads((ROOT / 'packaging/desktop-product.json').read_text())
    package = json.loads((ROOT / 'package.json').read_text())
    if {project['version'], package['version'], product['version'], publication['version']} != {version}:
        raise ValueError('Tag, source and installer versions must match')
    if publication['edition'] != 'community' or product['repository'] != REPOSITORY:
        raise ValueError('Expected the community source checkout')
    return product


def release_notes(changelog, version):
    """Extract one checked stable version section for display in GitHub and the native app."""
    heading = f'## {version}'
    lines = changelog.read_text(encoding='utf-8').splitlines()
    if lines.count(heading) != 1:
        raise ValueError(f'Expected one changelog section: {heading}')
    bullets = []
    for line in lines[lines.index(heading) + 1:]:
        if line.startswith('## '):
            break
        if not line.strip():
            continue
        if not line.startswith('- ') or not 1 <= len(line[2:].strip()) <= 160:
            raise ValueError('Use one short changelog bullet per line, up to 160 characters')
        bullets.append(line)
    if not 1 <= len(bullets) <= 3:
        raise ValueError('Expected 1–3 user-facing changes')
    return '\n'.join([
        '## Что нового', '', *bullets, '', '## Установка', '',
        'Установщики доступны для macOS (Apple Silicon и Intel), Windows x64 и Linux x64.',
        'Сверьте SHA-256 по файлу SHA256SUMS. macOS-сборки подписаны ad-hoc, Windows-сборки без подписи.',
    ])


def collect(directory, product):
    """Verify all four installers against their receipts and write one portable SHA256SUMS."""
    sums = []
    expected = set()
    for suffix, (platform, architectures) in PLATFORMS.items():
        name = f"{product['appId']}-{product['version']}-{suffix}"
        expected.update((name, name + '.json', name + '.sha256'))
        asset = directory / name
        if not asset.is_file() or asset.stat().st_size == 0:
            raise ValueError('Missing or empty installer: ' + name)
        with asset.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        receipt = json.loads((directory / (name + '.json')).read_text())
        fields = {
            'schemaVersion': 'ag-desktop/release-v1', 'appId': product['appId'],
            'version': product['version'], 'repository': REPOSITORY, 'asset': name,
            'sha256': digest, 'platform': platform,
        }
        if any(receipt.get(key) != value for key, value in fields.items()) or receipt.get('architecture', '').lower() not in architectures:
            raise ValueError('Installer receipt does not match: ' + name)
        line = f'{digest}  {name}\n'
        if (directory / (name + '.sha256')).read_text() != line:
            raise ValueError('Installer checksum does not match: ' + name)
        sums.append(line)
    for path in directory.iterdir():
        if path.name not in expected | {'SHA256SUMS'} or path.is_symlink() or not path.is_file():
            raise ValueError('Unexpected release asset: ' + path.name)
    (directory / 'SHA256SUMS').write_text(''.join(sums))


def publish(tag, directory, notes):
    """Upload verified assets to a draft and publish it once all uploads finish."""
    command = ['gh', 'release']
    repository = ['--repo', REPOSITORY]
    # Listing is a required read: an auth or network error must not be treated as an absent release.
    result = subprocess.check_output(
        ['gh', 'api', '--paginate', f'repos/{REPOSITORY}/releases', '--jq',
         f'.[] | select(.tag_name == "{tag}") | .draft'], text=True,
    ).strip()
    if result == 'false':
        raise ValueError('This release is already published. Bump the version to replace assets.')
    if not result:
        subprocess.run(command + ['create', tag, '--verify-tag', '--draft', '--title', tag,
                                  '--notes', notes] + repository, check=True)
    elif result != 'true':
        raise ValueError('Ambiguous GitHub release state')
    assets = [str(path) for path in sorted(directory.iterdir()) if path.suffix != '.sha256']
    subprocess.run(command + ['upload', tag, '--clobber'] + repository + ['--', *assets], check=True)
    subprocess.run(command + ['edit', tag, '--notes', notes, '--draft=false'] + repository, check=True)


def main():
    """Validate a tag before building, or validate and publish downloaded artifacts."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('tag')
    parser.add_argument('--assets', type=Path)
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    if args.publish and args.assets is None:
        parser.error('--publish requires --assets')
    product = check_tag(args.tag)
    notes = release_notes(ROOT / 'CHANGELOG.md', product['version'])
    if args.assets:
        collect(args.assets, product)
    if args.publish:
        publish(args.tag, args.assets, notes)


if __name__ == '__main__':
    main()
