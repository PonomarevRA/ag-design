# Agent installation and development

When the user asks to install AG Design, read INSTALL.md or INSTALL.ru.md first. Identify the actual client and run `python3 tools/install.py --agent codex` (or cursor/claude; on Windows use `py -3`). This installs the bundled skill explicitly; do not substitute a remote skill with a similar name. Use `--scope project` when a conflicting user skill must remain available. Preserve existing skills, environments, data and other MCP servers.

Start the source application from its `.venv`, merge the generated `.ag-design/mcp.json` using the client's supported configuration mechanism, reconnect, and verify actual `design_status`. Do not claim the MCP is connected merely because a file was written. Never overwrite client configuration wholesale. If the user wants only the skill, use `--skill-only`.

Use the bundled skill and current requirements before UI development. Source examples and caller reports are not accessibility or production certifications. Run the relevant tests and `tools/verify_repository.py --git` before publication. Never commit runtime data, credentials, local MCP settings, dependencies, generated archives or machine-specific reports.
