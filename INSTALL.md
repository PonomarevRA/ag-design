# Installation

[Русский](INSTALL.ru.md)

Run commands from this checkout. Python 3.11+ and Node 22+/npm are required. Dependency installation downloads declared packages from their configured registries; it is not an offline bootstrap. After installation the bundled catalogue/components work locally.

## Automatic setup

```sh
python3 tools/install.py --agent codex
```

Choose `codex`, `cursor` or `claude` only for the client you actually use. Omit `--agent` for application-only installation. `--dry-run` prints destinations without writing; `--skill-only --agent codex` installs only the skill. `--scope project --project /path/to/project` uses a project skill rather than the default user skill.

The installer creates `.venv`, installs this source checkout with pip, runs `npm ci --ignore-scripts` and builds current local archives. It refuses conflicting skills and incomplete environments. It never replaces an existing different skill. Resolve a conflict by choosing project scope or reviewing the existing installation yourself.

## Manual macOS / Linux

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -e .
npm ci --ignore-scripts
npm run build
.venv/bin/python -m ag_design
```

## Manual Windows PowerShell

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .
npm ci --ignore-scripts
npm run build
.\.venv\Scripts\python.exe -m ag_design
```

The web source launch opens no native window. For an optional desktop window install `'.[desktop]'` instead of `.` and run `-m ag_design --desktop`. Linux desktop needs a Qt-compatible graphical session and system WebEngine libraries; use web mode when these are absent. Native binaries/signing/installers are not produced by these commands.

## Connect the agent

Start the application with the same virtual environment first. A standard MCP client uses:

```json
{"mcpServers":{"ag-design":{"command":"/absolute/checkout/.venv/bin/python","args":["-m","ag_design","--mcp"]}}}
```

Use `.venv\Scripts\python.exe` on Windows. Automatic setup writes this snippet with the actual executable to `.ag-design/mcp.json`; merge it through your client's supported MCP settings without removing other servers. Reconnect the client, call `design_status`, and confirm the public catalogue's actual version and component count. Adding a configuration entry does not start the HTTP owner; the application must remain running.

The bundled skill lives in `skills/ag-design`. Standard targets are `~/.codex/skills/ag-design`, `~/.cursor/skills/ag-design` and `~/.claude/skills/ag-design`; project scope uses `.agents/skills/ag-design` for Codex and the corresponding client directory for the others. A client may need a new session to discover a newly installed skill.

For a ZIP download, Git is optional. In a clone, enable local push checks with `git config --local core.hooksPath .githooks`; the automatic installer does this only inside a Git checkout. The verifier inspects the Git index/history; it does not upload or change data.


## Optional local semantic search

Install `python -m pip install -e ".[search]"`, run `python tools/setup-search-model.py` explicitly, then restart the app and reconnect MCP. Weights stay in the external operator cache; search never downloads weights or sends text to an embedding API. Missing model/runtime falls back to FTS5 and strict results. `AG_DESIGN_SEARCH_MODE=fts` disables model loading. `design_discover` returns candidates for inspection, never automatic applicability or qualification.
