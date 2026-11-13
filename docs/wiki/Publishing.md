# Source, local data and publication

[Русский](Publishing-ru.md) · [Home](Home.md)

Community packages use distinct, versioned community prereleases and their own archive hashes.

The public repository is a separately curated source edition with its own Git history and `.gitignore`. It contains reusable libraries, clean catalogue seeds, the book, examples and installation tools. Internal project memory, client settings, local reports, runtime databases, dependency caches and generated archives are outside this edition. Usage/debt seeds and project-specific profile bindings start empty.

An ignore file does not remove a tracked file or an old commit. `python3 tools/verify_repository.py --git` checks staged bytes and all reachable history. The local pre-push hook and GitHub CI repeat the gate. Recognisable credentials, local machine paths, internal-memory paths and unreviewed binaries/archives fail closed. Independent Gitleaks complements these structural rules; metadata-checksum exceptions are scoped to exact formats/paths.

Never bypass a failing publication check. Investigate the file and history; report a suspected secret without reproducing its value. Signature scans cannot prove absence of every possible secret or sensitive image. Third-party notices remain in the source and built packages.

Runtime state lives in the platform data/library directories, not Git. `AG_DESIGN_DATA_DIR` and `AG_DESIGN_LIBRARY_DIR` are explicit overrides. Backups belong outside the repository. Generated `dist/` packages are rebuilt locally or delivered as separately reviewed release artifacts.

## Native releases

For every stable version, add a `## MAJOR.MINOR.PATCH` section to [CHANGELOG.md](../../CHANGELOG.md) with 1–3 bullets. Describe a concrete user-visible improvement in each bullet, using up to 160 characters. For example, “Check for a new version from the Help menu.” GitHub Actions uses these bullets for the “What’s new” section of the release.

Match the Python package version, npm manifest and lockfile, `PUBLICATION.json`, and installer manifest. Publish the reviewed commit to `main` in the public repository and tag the same commit `vMAJOR.MINOR.PATCH`. The tag builds installers for macOS Apple Silicon and Intel, Windows x64, and Linux x64. GitHub Actions publishes the draft after validating the installers, their receipts and checksums.

Use the native Help menu to check the current version or open [GitHub Releases](https://github.com/PonomarevRA/ag-design/releases).
