"""
Install this source edition and optionally its agent skill without overwriting existing skills.
"""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import venv


def skill_destination(agent, scope, home, project):
    """
    Resolve an explicit client's standard skill directory for the selected scope.

    Args:
        agent: Explicit client identifier: codex, cursor or claude.
        scope: User or project skill scope, selected by the caller.
        home: User home root; ordinary platform aliases are resolved.
        project: Explicit target project root for project-scoped skills.
    """
    locations = {'codex': '.codex', 'cursor': '.cursor', 'claude': '.claude'}
    home, project = home.resolve(), project.resolve()
    if scope == 'project':
        base = project / ('.agents' if agent == 'codex' else locations[agent])
    else:
        base = home / locations[agent]
    return base / 'skills/ag-design'


def skill_files(directory):
    """
    Read bounded ordinary skill files; refuse links or mixed ownership rather than following them.

    Args:
        directory: Skill directory whose regular file bytes are inspected.
    """
    result = {}
    if directory.is_symlink():
        raise ValueError('Skill destination is a symlink')
    for path in directory.rglob('*'):
        if path.is_symlink():
            raise ValueError('Skill contains a symlink')
        if path.is_file():
            if path.stat().st_size > 1024 * 1024:
                raise ValueError('Unexpected skill file size')
            result[str(path.relative_to(directory))] = path.read_bytes()
    return result


def install_skill(source, target):
    """
    Install a missing skill atomically, or accept identical bytes; never replace differing existing content.

    Args:
        source: Trusted source directory containing ordinary reviewed files.
        target: Explicit new destination; existing content must remain intact.
    """
    expected = skill_files(source)
    if not expected or 'SKILL.md' not in expected:
        raise ValueError('Missing bundled skill')
    if target.exists() or target.is_symlink():
        if skill_files(target) != expected:
            raise ValueError('Existing skill differs; preserved unchanged. Choose project scope or review it manually.')
        return 'already-current'
    # Do not let a parent symlink redirect a write into an unexpected location.
    for parent in [target.parent, *target.parent.parents]:
        if parent.is_symlink():
            raise ValueError('Skill parent is a symlink')
    target.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.ag-design-', dir=target.parent))
    try:
        for name, data in expected.items():
            path = staging / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        if target.exists():
            raise ValueError('Skill destination changed during installation')
        staging.rename(target)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return 'installed'


def run(command, root):
    """
    Run fixed argument vectors in the selected checkout and propagate installation failures.

    Args:
        command: Fixed argument vector; values are never passed through a shell.
        root: Exact checkout or publication root for this operation.
    """
    subprocess.run([str(item) for item in command], cwd=root, check=True)


def ensure_environment(root):
    """
    Create a checkout virtual environment using the platform's normal interpreter strategy.

    Args:
        root: Exact checkout root; its .venv must be absent or a usable ordinary environment.
    Returns:
        The environment's Python executable after verifying that pip starts successfully.
    Raises:
        ValueError: An existing environment is redirected, incomplete or unusable; it is preserved.
    """
    environment = root / '.venv'
    python = environment / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    if environment.is_symlink():
        raise ValueError('Existing .venv is a symlink; preserved unchanged')
    if environment.exists() and not python.exists():
        raise ValueError('Existing .venv is incomplete; preserved unchanged')
    if not environment.exists():
        # Match `python -m venv`: copied signed macOS interpreters can abort before ensurepip.
        venv.EnvBuilder(with_pip=True, symlinks=os.name != 'nt').create(environment)
    ready = subprocess.run([str(python), '-m', 'pip', '--version'], capture_output=True)
    if ready.returncode:
        raise ValueError('Existing .venv cannot start pip; preserved unchanged')
    return python


def main(argv=None, *, root=None):
    """
    Install requested dependencies/skill and generate a local MCP snippet; existing client settings remain owned by the client.

    Args:
        argv: Optional CLI argument list; None reads the process arguments.
        root: Owning source checkout supplied by the private edition wrapper; defaults to this installed tree.
    """
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--agent', choices=['codex', 'cursor', 'claude'])
    parser.add_argument('--scope', choices=['user', 'project'], default='user')
    parser.add_argument('--project', type=Path, default=Path.cwd())
    parser.add_argument('--skill-only', action='store_true')
    parser.add_argument('--desktop', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    options = parser.parse_args(argv)
    if sys.version_info < (3, 11):
        parser.error('Python3.11 or newer is required')
    root = Path(root).resolve() if root is not None else Path(__file__).resolve().parents[1]
    python = root / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    target = skill_destination(options.agent, options.scope, Path.home(), options.project.absolute()) if options.agent else None
    if options.skill_only and not target:
        parser.error('--skill-only requires --agent')
    if options.dry_run:
        print(json.dumps({'source': str(root), 'python': str(python), 'skill': str(target) if target else None, 'installDependencies': not options.skill_only}, indent=2))
        return
    # Preflight skill conflicts before dependency downloads or changes to the virtual environment.
    if target and (target.exists() or target.is_symlink()) and skill_files(target) != skill_files(root / 'skills/ag-design'):
        raise ValueError('Existing skill differs; no changes made. Use --scope project or review manually.')
    if not options.skill_only:
        node, npm = shutil.which('node'), shutil.which('npm')
        if not node or not npm:
            raise ValueError('Install Node22+ and npm first; see INSTALL.md')
        version = subprocess.check_output([node, '--version'], text=True).strip()
        if int(version.lstrip('v').split('.')[0]) < 22:
            raise ValueError('Node22 or newer is required')
        python = ensure_environment(root)
        run([python, '-m', 'pip', 'install', '-e', '.[desktop]' if options.desktop else '.'], root)
        npm_command = [npm]
        if os.name == 'nt':
            cli = Path(npm).parent / 'node_modules/npm/bin/npm-cli.js'
            if not cli.is_file():
                raise ValueError('Cannot locate npm CLI safely; use the manual PowerShell steps')
            npm_command = [node, cli]
        run(npm_command + ['ci', '--ignore-scripts'], root)
        scripts = json.loads((root/'package.json').read_text()).get('scripts', {})
        build_script = 'build' if 'build' in scripts else 'pack:local'
        if build_script not in scripts:
            raise ValueError('Owning checkout has no supported build script')
        run(npm_command + ['run', build_script], root)
    if target:
        print('Skill: ' + install_skill(root / 'skills/ag-design', target))
    if not options.skill_only:
        config = root / '.ag-design/mcp.json'
        if config.parent.is_symlink() or config.is_symlink():
            raise ValueError('MCP snippet path is a symlink')
        content = json.dumps({'mcpServers': {'ag-design': {'command': str(python), 'args': ['-m', 'ag_design', '--mcp']}}}, indent=2) + '\n'
        if config.exists() and config.read_text() != content:
            raise ValueError('Existing different MCP snippet preserved; review it manually')
        config.parent.mkdir(exist_ok=True)
        config.write_text(content)
        if (root / '.git').exists() and shutil.which('git'):
            existing = subprocess.run(['git', 'config', '--local', '--get', 'core.hooksPath'], cwd=root, capture_output=True, text=True).stdout.strip()
            if existing not in {'', '.githooks'}:
                print('Existing hooks preserved; integrate the publication verifier manually.')
            else:
                run(['git', 'config', '--local', 'core.hooksPath', '.githooks'], root)
        print('Start: ' + str(python) + ' -m ag_design')
        print('MCP snippet: ' + str(config) + '; merge using your client, preserving other servers.')


if __name__ == '__main__':
    main()
