# AG Design

**Design knowledge, reusable components and verifiable interface composition — running locally.**

[Русский](README.ru.md) · [Install](INSTALL.md) · [Documentation](docs/wiki/Home.md)

AG Design helps people and agents choose existing components, compose screens and review the result. It combines a live component catalogue, a source-backed Design Book, a composition sandbox, application examples and an MCP server.

| Need | What to use |
| --- | --- |
| Find a component | Search the catalogue by purpose and inspect its actual contract |
| Design a screen | Read the brief, select local grids and reuse pinned components |
| Check a change | Review affected blocks, field tracks, inner-column widths and real states |
| Use an agent | Connect the local MCP and install the bundled ag-design skill |
| Ship without the service | Build exact local component/rules archives and vendor checked assets |

[Download a native installer](https://github.com/PonomarevRA/ag-design/releases/latest) for macOS, Windows or Linux.

## Quick start

Python **3.11+**, Node **22+** and npm are required for the source edition.

```sh
git clone https://github.com/PonomarevRA/ag-design.git
cd ag-design
python3 tools/install.py
.venv/bin/python -m ag_design
```

Open the loopback URL printed by the application. Port 8897 is preferred; an occupied port causes an owned free port to be selected. On Windows, run `py -3 tools/install.py` and `.\.venv\Scripts\python.exe -m ag_design`. Manual and desktop prerequisites: [English](INSTALL.md), [Русский](INSTALL.ru.md).

The core catalogue runs locally and requires no cloud API key. Semantic search optionally uses a separately downloaded local model; exact metadata and SQLite FTS5 remain available without it.

## Install with an agent

> Read AGENTS.md and INSTALL.md. Install this checkout and its bundled ag-design skill for your current client. Preserve existing skills and MCP servers. Verify the actual catalogue URL, version and tool availability.

```sh
python3 tools/install.py --agent codex
```

`cursor` and `claude` are also supported. Use `--scope project` to keep the skill local to a project. An existing different skill is preserved and reported as a conflict. The installer creates a ready-to-merge `.ag-design/mcp.json`; it never silently replaces client MCP settings.

## How the project is organised

| Directory | Responsibility |
| --- | --- |
| `ag_design/` | Local HTTP/MCP service, catalogue, search and review contracts |
| `web/` | Catalogue, sandbox, Design Book and example applications |
| `packages/components/` | Reusable controls, layouts, chat, charts and lifecycle helpers |
| `packages/rules/` | Offline guidance, grids, composition and audit contracts |
| `packages/visual-tools/` | Independent visual elements library |
| `packages/interaction-tools/` | Independent interaction elements library |
| `catalog/` | Shipped component/rule definitions and clean library seeds |
| `skills/ag-design/` | Portable instructions for agents |
| `docs/wiki/` | Versioned Wiki documentation |

Four independent packages are included. Consumer components do not require a running catalogue or a sibling checkout. See [architecture](docs/wiki/Architecture.md), [MCP workflow](docs/wiki/Using-MCP.md) and [component review](docs/wiki/Components-and-review.md).

## Development

```sh
npm ci --ignore-scripts
npm run build
npm test
python3 -m pip install -e '.[test]'
python3 -m pytest -q
python3 tools/verify_repository.py --git
```

Generated packages live under `dist/` and stay outside Git. Runtime data and the editable library use separate platform directories named **AGDesignCommunity** and **AGDesignCommunityLibrary**. Explicit overrides are supported. [Local data and publication rules](docs/wiki/Publishing.md).

Geometry, accessibility, keyboard, content and host qualification are separate checks. Reports supplied through an API are caller-reported evidence, not independent accessibility or production certification. Components retain the consumer's semantic palette.

## Licence and contributions

Owned public source is distributed under [MIT](LICENSE). Bundled third-party code, fonts, graphics and notices retain their own terms; keep the supplied licence/notice files, including the contrast-library notices. Submit changes through a pull request and include the relevant verification. Please report suspected sensitive data privately rather than putting its value in a public issue.
