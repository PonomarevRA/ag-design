"""
Offline, reference-aware library cleanup with explicit preview and recoverable apply.
The application never invokes this module automatically and the server exposes no deletion route.
"""

from contextlib import contextmanager
from copy import deepcopy
import argparse
import gzip
import io
import stat
import tarfile
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3

from .element_libraries import ElementLibraries, release_order
from .library import atomic_json, read_json
from .studio_cache import unpack

ARCHIVE = re.compile(
    r"^ag-design-(components|rules|visual-tools|interaction-tools)-[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?\.tgz$"
)
MAX_FILES = 1024
MAX_BYTES = 268435456


def safe_path(value):
    """
    Reject symlinked operator paths before resolving their absolute identity.

    Args:
        value: Explicit local operator path; no path is accepted from a library bundle.
    Returns:
        Absolute Path with no existing symlink ancestor.
    Raises:
        ValueError: A path or one of its parents is a symlink.
    """
    path = Path(value).expanduser().absolute()
    for part in (path, *path.parents):
        if part.is_symlink():
            raise ValueError("Symlinked maintenance paths are unsupported")
    return path.resolve()


def file_hash(path):
    """
    Hash one regular bounded artifact without loading or executing package code.

    Args:
        path: Operator-owned candidate file.
    Returns:
        SHA256 hex digest of at most32MiB.
    Raises:
        ValueError: Unsafe file type or excessive per-file size.
    """
    path = safe_path(path)
    if not path.is_file() or path.stat().st_size > 33554432:
        raise ValueError("Unsafe or oversized maintenance artifact")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def archive_definition(path):
    """
    Read only bounded npm package identity/export metadata; never extract or execute members.

    Args:
        path: Regular gzip tar archive selected by the fixed AG filename allowlist.
    Returns:
        Package metadata with validated matching name/version, or None for unknown/corrupt artifacts.
    """

    class LimitedReader:
        """Bound expanded tar bytes even when a compressed header is hostile."""

        def __init__(self, stream):
            """
            Own one bounded decompression reader for a single archive scan.

            Args:
                stream: Open gzip reader owned by the caller's context manager.
            """
            self.stream, self.remaining = stream, 67108864

        def read(self, size=-1):
            """
            Read a chunk within the remaining expanded-byte budget.

            Args:
                size: Requested byte count; negative means remaining permitted bytes.
            Returns:
                Bytes from the owned gzip stream, or empty bytes at EOF.
            Raises:
                ValueError: The tar stream expands beyond64MiB.
            """
            size = min(self.remaining + 1, size if size >= 0 else self.remaining + 1)
            value = self.stream.read(size)
            self.remaining -= len(value)
            if self.remaining < 0:
                raise ValueError("Expanded archive budget exceeded")
            return value

    try:
        metadata = None
        with path.open("rb") as handle, gzip.GzipFile(fileobj=handle) as expanded:
            with tarfile.open(fileobj=LimitedReader(expanded), mode="r|") as archive:
                for index, member in enumerate(archive):
                    if index >= 2048 or member.size > 33554432:
                        return None
                    if member.name != "package/package.json":
                        continue
                    if (
                        metadata is not None
                        or not member.isfile()
                        or member.size > 65536
                    ):
                        return None
                    metadata = json.load(archive.extractfile(member))
        if not isinstance(metadata, dict):
            return None
        name, version = metadata.get("name"), metadata.get("version")
        if (
            not isinstance(name, str)
            or not name.startswith("@ag-design/")
            or not isinstance(version, str)
        ):
            return None
        if (
            path.name
            != "ag-design-" + name.removeprefix("@ag-design/") + "-" + version + ".tgz"
        ):
            return None
        release_order(version)
        exports = metadata.get("exports", {})
        if not isinstance(exports, (dict, str)):
            return None
        return metadata
    except (ValueError, OSError, EOFError, tarfile.TarError):
        return None


def reference_fence(data_dir):
    """
    Read authored pins/history/cache under readonly SQLite snapshots without touching expiry.

    Args:
        data_dir: Explicit data owner directory; sibling journey cache is included when present.
    Returns:
        Protected artifact hashes, stable payload fingerprint and bounded row counts.
    Raises:
        ValueError: Unknown/corrupt or excessive reference data; cleanup fails closed.
    """
    main_database = safe_path(data_dir / "design.sqlite3")
    if not main_database.is_file():
        raise ValueError("Existing data-owner database is required")
    hashes, counts, digest = set(), {}, hashlib.sha256()

    def visit(value):
        """
        Collect literal artifactHash fields without interpreting authored text.

        Args:
            value: Decoded bounded JSON object, array or scalar.
        """
        if isinstance(value, dict):
            candidate = value.get("artifactHash")
            if isinstance(candidate, str) and re.fullmatch(r"[0-9a-f]{64}", candidate):
                hashes.add(candidate)
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    tables = {
        "compositions": ("payload", "baseline"),
        "composition_changes": ("before_doc", "response"),
        "studio_versions": ("payload",),
        "studio_commands": ("response",),
        "trial_snapshots": ("payload",),
        "journey_trials": ("payload",),
    }
    paths = [
        data_dir / "design.sqlite3",
        data_dir.with_name(data_dir.name + "-journey-cache") / "journeys.sqlite3",
    ]
    total = 0
    for path in paths:
        safe_path(path)
        if not path.exists():
            continue
        with sqlite3.connect(path.as_uri() + "?mode=ro", uri=True) as connection:
            connection.execute("BEGIN")
            present = {
                row[0]
                for row in connection.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                )
            }
            if path == main_database and "compositions" not in present:
                raise ValueError("Expected composition schema is absent")
            for table, columns in tables.items():
                if table not in present:
                    continue
                count = 0
                # Fixed identifiers only: no caller-selected SQL or private values are printed.
                for row in connection.execute(
                    "SELECT " + ",".join(columns) + " FROM " + table + " ORDER BY rowid"
                ):
                    count += 1
                    total += 1
                    if total > 10000:
                        raise ValueError("Reference row budget exceeded")
                    for raw in row:
                        data = raw.encode() if isinstance(raw, str) else bytes(raw)
                        if len(data) > 1900000:
                            raise ValueError("Reference payload budget exceeded")
                        digest.update(len(data).to_bytes(8, "big"))
                        digest.update(data)
                        visit(unpack(raw))
                counts[path.name + ":" + table] = count
    return hashes, digest.hexdigest(), counts


def plan_retention(source_root, library_dir, data_dir, consumer_roots=()):
    """
    Derive a dry-run from current receipts, complete component identities and actual authored pins.

    Args:
        source_root: Exact source checkout with dist/packages.json and catalogue seeds.
        library_dir: External operator library, separate from source and data.
        data_dir: Existing source owner's data root; document/history/cache pins protect archives.
        consumer_roots: Explicit consumer folders whose package.json file dependencies protect source artifacts.
    Returns:
        Public bounded plan plus private original-index projection used only by apply.
    Raises:
        ValueError: Missing current artifacts, unsafe paths, excessive files or ambiguous receipt/seed identity.
    """
    source, library, data = (safe_path(p) for p in (source_root, library_dir, data_dir))
    if any(
        a == b or a.is_relative_to(b) or b.is_relative_to(a)
        for a, b in [(source, library), (source, data), (library, data)]
    ):
        raise ValueError("Source, library and data roots must be separate")
    protected, reference_hash, reference_counts = reference_fence(data)
    pinned_hashes = set(protected)
    receipts = read_json(source / "dist/packages.json")
    if not isinstance(receipts, list) or len(receipts) != 5:
        raise ValueError("Expected the five current AG release receipts")
    keep = set()
    current_definitions = {}
    receipt_hashes = {}
    packages = set()
    for receipt in receipts:
        name = receipt["file"]
        if not ARCHIVE.fullmatch(name) or name in keep:
            raise ValueError("Ambiguous current release receipt")
        if file_hash(source / "dist" / name) != receipt["sha256"]:
            raise ValueError("Current release archive hash mismatch")
        expected_name = (
            "ag-design-"
            + receipt["name"].removeprefix("@ag-design/")
            + "-"
            + receipt["version"]
            + ".tgz"
        )
        if name != expected_name or receipt["name"] in packages:
            raise ValueError("Receipt identity mismatch")
        current_definition = archive_definition(source / "dist" / name)
        if current_definition is None:
            raise ValueError("Current archive package identity is invalid")
        current_definitions[receipt["name"]] = current_definition
        packages.add(receipt["name"])
        receipt_hashes[name] = receipt["sha256"]
        keep.add(name)
    if packages != {
        "@ag-design/" + name
        for name in [
            "components",
            "rules",
            "visual-tools",
            "interaction-tools",
        ]
    }:
        raise ValueError("Unexpected current package set")
    old_index = ElementLibraries(library).index()
    projected = deepcopy(old_index)
    retained, blocked = [], []
    for item in projected["items"]:
        latest = max(item["versions"], key=lambda b: release_order(b["version"]))
        all_ids = {c["id"] for b in item["versions"] for c in b["components"]}
        missing = all_ids - {c["id"] for c in latest["components"]}
        if missing:
            blocked.append(
                {
                    "libraryId": item["id"],
                    "reason": "latest-missing-components",
                    "componentIds": sorted(missing),
                }
            )
        else:
            # Keep operator selection and actual pinned bytes, even when they are older than latest.
            item["versions"] = [
                b
                for b in item["versions"]
                if b["version"] in {latest["version"], item["activeVersion"]}
                or b["package"]["sha256"] in protected
            ]
        for bundle in item["versions"]:
            protected.add(bundle["package"]["sha256"])
        retained.append(
            {
                "libraryId": item["id"],
                "activeVersion": item["activeVersion"],
                "versions": [b["version"] for b in item["versions"]],
                "componentCount": len(all_ids),
            }
        )
    protected_paths, consumer_fences = set(), []
    for root in consumer_roots:
        path = safe_path(root) / "package.json"
        definition = read_json(path)
        consumer_fences.append({"path": str(path), "sha256": file_hash(path)})
        for section in ["dependencies", "devDependencies", "optionalDependencies"]:
            for value in definition.get(section, {}).values():
                if isinstance(value, str) and value.startswith("file:"):
                    protected_paths.add(str(safe_path(path.parent / value[5:])))
    files, total_bytes = [], 0

    def candidate(path, root_label, root, action="remove"):
        """
        Add one fixed owned regular artifact to the bounded hash-addressed plan.

        Args:
            path: Candidate regular artifact beneath root.
            root_label: Stable source/library key in the plan roots.
            root: Absolute allowed carrier directory.
            action: Remove by default, or replace-index for library metadata.
        Raises:
            ValueError: Unsafe file identity or the total file/byte budget is exceeded.
        """
        nonlocal total_bytes
        digest = file_hash(path)
        size = path.stat().st_size
        total_bytes += size
        if len(files) >= MAX_FILES or total_bytes > MAX_BYTES:
            raise ValueError("Maintenance file/byte budget exceeded")
        files.append(
            {
                "root": root_label,
                "path": str(path.relative_to(root)),
                "sha256": digest,
                "bytes": size,
                "action": action,
            }
        )

    protected_archives = []
    unknown_archives = []
    available_hashes = set()
    for directory, label, root in [
        (source / "dist", "source", source),
        (source / "dist/library-packages", "source", source),
        (library / "packages", "library", library),
    ]:
        for path in sorted(directory.glob("*.tgz")):
            if not ARCHIVE.fullmatch(path.name):
                continue
            digest = file_hash(path)
            available_hashes.add(digest)
            if path.name in receipt_hashes and digest != receipt_hashes[path.name]:
                raise ValueError(
                    "Current archive differs across distribution/library copies"
                )
            if (
                path.name in keep
                or digest in protected
                or str(safe_path(path)) in protected_paths
            ):
                protected_archives.append(
                    {
                        "root": label,
                        "path": str(path.relative_to(root)),
                        "sha256": digest,
                        "reason": "current" if path.name in keep else "referenced",
                    }
                )
            else:
                definition = archive_definition(path)
                if definition is None or definition["name"] not in current_definitions:
                    unknown_archives.append(
                        {
                            "root": label,
                            "path": str(path.relative_to(root)),
                            "reason": "unverified-package-identity",
                        }
                    )
                    continue
                if release_order(definition["version"]) >= release_order(
                    current_definitions[definition["name"]]["version"]
                ):
                    unknown_archives.append(
                        {
                            "root": label,
                            "path": str(path.relative_to(root)),
                            "reason": "not-older-than-current-release",
                        }
                    )
                    continue
                old_exports = definition.get("exports", {})
                current_exports = current_definitions[definition["name"]].get(
                    "exports", {}
                )
                old_paths = set(old_exports) if isinstance(old_exports, dict) else {"."}
                current_paths = (
                    set(current_exports) if isinstance(current_exports, dict) else {"."}
                )
                if old_paths - current_paths:
                    blocked.append(
                        {
                            "package": definition["name"],
                            "reason": "latest-missing-export-paths",
                            "paths": sorted(old_paths - current_paths),
                        }
                    )
                    continue
                candidate(path, label, root)
    seed_groups = {}
    for path in sorted((source / "catalog/libraries").glob("*.aglib.json")):
        value = read_json(path)
        seed_groups.setdefault(value["id"], []).append((path, value))
    for namespace, rows in seed_groups.items():
        latest_path, latest = max(
            rows, key=lambda pair: release_order(pair[1]["version"])
        )
        all_ids = {c["id"] for _, b in rows for c in b["components"]}
        if all_ids - {c["id"] for c in latest["components"]}:
            blocked.append(
                {"libraryId": namespace, "reason": "shipped-latest-missing-components"}
            )
            continue
        for path, bundle in rows:
            if path != latest_path and bundle["package"]["sha256"] not in protected:
                candidate(path, "source", source)
                sibling = source / "dist" / path.name
                if sibling.exists():
                    candidate(sibling, "source", source)
    if old_index != projected:
        candidate(
            library / "element-libraries.json", "library", library, "replace-index"
        )
    public = {
        "schemaVersion": "ag-design/library-retention-v1",
        "roots": {"source": str(source), "library": str(library), "data": str(data)},
        "referenceHash": reference_hash,
        "referenceCounts": reference_counts,
        "unresolvedReferenceHashes": sorted(pinned_hashes - available_hashes),
        "consumerFences": consumer_fences,
        "retainedLibraries": retained,
        "blocked": blocked,
        "unknownArchives": unknown_archives,
        "protectedArchives": protected_archives,
        "files": files,
        "removedBytes": sum(row["bytes"] for row in files if row["action"] == "remove"),
        "newIndexHash": hashlib.sha256(
            json.dumps(projected, sort_keys=True).encode()
        ).hexdigest(),
    }
    public["planHash"] = hashlib.sha256(
        json.dumps(public, sort_keys=True).encode()
    ).hexdigest()
    return public, projected


@contextmanager
def stopped_owner(data_dir):
    """
    Acquire the existing POSIX data-owner lock without opening or migrating the database.

    Args:
        data_dir: Existing stopped owner's directory.
    Yields:
        None while the nonblocking OS lock is held.
    Raises:
        ValueError: Unsupported platform or a running owner; no mutation is attempted.
    """
    if os.name != "posix":
        raise ValueError("Offline apply currently requires POSIX owner locking")
    import fcntl

    path = safe_path(safe_path(data_dir) / "ag-design.lock")
    if not path.is_file():
        raise ValueError("Existing stopped data-owner lock is required")
    descriptor = os.open(path, os.O_RDWR | os.O_NOFOLLOW)
    with os.fdopen(descriptor, "a+b") as handle:
        opened, current = os.fstat(handle.fileno()), os.stat(
            path, follow_symlinks=False
        )
        if not stat.S_ISREG(opened.st_mode) or (opened.st_dev, opened.st_ino) != (
            current.st_dev,
            current.st_ino,
        ):
            raise ValueError("Data-owner lock identity changed")
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as error:
            raise ValueError(
                "Stop the exact data owner before applying cleanup"
            ) from error
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def apply_retention(
    source_root,
    library_dir,
    data_dir,
    backup_dir,
    expected_plan_hash,
    consumer_roots=(),
):
    """
    Recompute the exact dry-run under the stopped-owner lock, copy recovery bytes, then apply.

    Args:
        source_root: Same exact source root used by the preview.
        library_dir: Same external library root.
        data_dir: Same stopped data-owner root.
        backup_dir: New separate recovery directory, never inside a managed root.
        expected_plan_hash: Exact current preview identity; stale previews refuse all mutations.
        consumer_roots: Same explicit consumer folders used by the preview.
    Returns:
        Applied public plan and recovery directory; source/documents/history/retained bytes remain intact.
    Raises:
        ValueError: Running owner, stale preview, unsafe recovery path or changed original bytes.
        OSError: Recovery or mutation failure; completed edits are restored from verified recovery copies.
    """
    with stopped_owner(data_dir):
        plan, projected = plan_retention(
            source_root, library_dir, data_dir, consumer_roots
        )
        if plan["blocked"]:
            raise ValueError("Cleanup blocked by incomplete latest release coverage")
        if plan["planHash"] != expected_plan_hash:
            raise ValueError("Cleanup preview changed; read a fresh dry-run")
        backup = safe_path(backup_dir)
        for value in plan["roots"].values():
            root = Path(value)
            if (
                backup == root
                or backup.is_relative_to(root)
                or root.is_relative_to(backup)
            ):
                raise ValueError(
                    "Recovery directory must be separate from managed roots"
                )
        backup.mkdir(mode=0o700, parents=True, exist_ok=False)
        for row in plan["files"]:
            source = Path(plan["roots"][row["root"]]) / row["path"]
            saved = backup / row["root"] / row["path"]
            saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, saved)
            if file_hash(saved) != row["sha256"]:
                raise ValueError("Recovery copy hash mismatch; originals retained")
        atomic_json(backup / "manifest.json", plan)
        for row in plan["files"]:
            source = Path(plan["roots"][row["root"]]) / row["path"]
            if file_hash(source) != row["sha256"]:
                raise ValueError(
                    "Original bytes changed after preview; originals retained"
                )
        changed = []
        try:
            for row in plan["files"]:
                target = Path(plan["roots"][row["root"]]) / row["path"]
                if file_hash(target) != row["sha256"]:
                    raise ValueError("Original bytes changed during cleanup")
                if row["action"] == "replace-index":
                    atomic_json(target, projected)
                else:
                    target.unlink()
                changed.append(row)
        except BaseException:
            for row in reversed(changed):
                target = Path(plan["roots"][row["root"]]) / row["path"]
                if target.exists() and row["action"] != "replace-index":
                    continue
                if row["action"] == "replace-index" and target.exists():
                    expected_new = hashlib.sha256(
                        (
                            json.dumps(projected, ensure_ascii=False, indent=2) + "\n"
                        ).encode()
                    ).hexdigest()
                    if file_hash(target) != expected_new:
                        continue
                saved = backup / row["root"] / row["path"]
                temporary = target.with_name(target.name + ".retention-restore")
                shutil.copy2(saved, temporary)
                os.replace(temporary, target)
            raise
        return {"outcome": "applied", "plan": plan, "recoveryDirectory": str(backup)}


def main(argv=None):
    """
    Expose operator-only dry-run and explicit hash-bound apply; this does not start an HTTP owner.

    Args:
        argv: Optional CLI argument list; None uses process arguments.
    Returns:
        None; prints bounded structured evidence, without document text or executable content.
    """
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ["source-root", "library-dir", "data-dir"]:
        parser.add_argument("--" + key, required=True, type=Path)
    parser.add_argument("--consumer-root", action="append", type=Path, default=[])
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--backup-dir", type=Path)
    parser.add_argument("--expected-plan-hash")
    args = parser.parse_args(argv)
    if args.apply:
        if not args.backup_dir or not args.expected_plan_hash:
            parser.error("--apply requires --backup-dir and --expected-plan-hash")
        result = apply_retention(
            args.source_root,
            args.library_dir,
            args.data_dir,
            args.backup_dir,
            args.expected_plan_hash,
            args.consumer_root,
        )
    else:
        result = plan_retention(
            args.source_root, args.library_dir, args.data_dir, args.consumer_root
        )[0]
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
