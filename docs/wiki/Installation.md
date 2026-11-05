# Installation

[Русский](Installation-ru.md) · [Home](Home.md)

Use Python3.11+, Node22+ and npm. Clone or download the repository, open its root and run:

```sh
python3 tools/install.py
.venv/bin/python -m ag_design
```

Windows uses `py -3` and `.venv\Scripts\python.exe`. Open the printed loopback URL rather than assuming a port. Manual steps, Linux desktop prerequisites and troubleshooting are in the repository's `INSTALL.md` / `INSTALL.ru.md`.

For an agent, add `--agent codex`, `--agent cursor` or `--agent claude`. `--scope project` selects project skill installation. Different existing skills are never overwritten. `--skill-only` and `--dry-run` are available. Merge the generated `.ag-design/mcp.json` entry into your client's configuration, preserving other servers, then reconnect.

The source edition supplies web/MCP code and reviewed assets, not prebuilt native installers. `--desktop` adds optional desktop dependencies. Validate platform-specific behaviour on the target OS. No cloud credential is needed for the core application. Optional local semantic search is installed separately; see the shipped model setup tool and package extras.
