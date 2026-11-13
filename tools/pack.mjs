import { normalizeCommunityArchive } from "./community-archive.mjs";
import { buildPalette } from "./build-palette.mjs";
import { buildStyleComponents } from "./build-style-components.mjs";
import { buildCmsEditor } from "./build-cms-editor.mjs";
import {
  mkdir,
  copyFile,
  writeFile,
  readdir,
  readFile,
  lstat,
  unlink,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Compare validated numeric/prerelease archive versions without lossy number conversion.
 * @param {string} left Validated archive semantic version.
 * @param {string} right Validated current receipt version.
 * @returns {number} Negative, zero or positive relative precedence.
 */
function compareRelease(left, right) {
  /**
   * Split validated release coordinates without evaluating any package content.
   * @param {string} value Validated semantic version.
   * @returns {Array} Numeric coordinate strings and optional prerelease identifiers.
   */
  function parts(value) {
    const split = value.indexOf("-");
    return split < 0
      ? [value.split("."), null]
      : [value.slice(0, split).split("."), value.slice(split + 1).split(".")];
  }
  const [a, ap] = parts(left),
    [b, bp] = parts(right);
  for (let i = 0; i < 3; i++) {
    if (BigInt(a[i]) !== BigInt(b[i]))
      return BigInt(a[i]) < BigInt(b[i]) ? -1 : 1;
  }
  if (ap === null && bp === null) return 0;
  if (ap === null) return 1;
  if (bp === null) return -1;
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    if (ap[i] === undefined || bp[i] === undefined)
      return ap[i] === undefined ? -1 : 1;
    if (ap[i] === bp[i]) continue;
    const an = /^[0-9]+$/.test(ap[i]),
      bn = /^[0-9]+$/.test(bp[i]);
    if (an && bn) {
      if (BigInt(ap[i]) === BigInt(bp[i])) continue;
      return BigInt(ap[i]) < BigInt(bp[i]) ? -1 : 1;
    }
    if (an !== bn) return an ? -1 : 1;
    return ap[i] < bp[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Keep only current AG release archives in generated distribution staging.
 * @param {string} directory Generated library-packages folder, never an operator library.
 * @param {Array<object>} receipts Successful current package receipts with fixed filenames.
 * @returns {Promise<void>} Deletes obsolete known AG archives; unrelated files remain.
 * @throws {Error} A known archive is a symlink or a receipt filename is malformed.
 */
export async function prunePackageStaging(directory, receipts) {
  const pattern =
    /^(ag-design-(?:components|rules|visual-tools|interaction-tools))-([0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?)\.tgz$/;
  const keep = new Set();
  const current = new Map();
  for (const receipt of receipts) {
    if (!pattern.test(receipt.file))
      throw new Error("Invalid generated archive receipt");
    const match = receipt.file.match(pattern);
    if (current.has(match[1]))
      throw new Error("Duplicate generated archive receipt");
    current.set(match[1], match[2]);
    keep.add(receipt.file);
  }
  const obsolete = [];
  for (const name of await readdir(directory)) {
    const match = name.match(pattern);
    if (!match || keep.has(name) || !current.has(match[1])) continue;
    // A copied future release is not obsolete merely because an older receipt exists.
    if (compareRelease(match[2], current.get(match[1])) >= 0) continue;
    const target = path.join(directory, name);
    if (!(await lstat(target)).isFile())
      throw new Error("Unsafe generated archive");
    obsolete.push(target);
  }
  // Validate the complete generated set before removing an old staging file.
  for (const target of obsolete) await unlink(target);
}

/**
 * Synchronize declared first-party integration versions with the artifacts just built.
 * @param {string} root Owning repository root; an absent integration descriptor is supported.
 * @param {Array<object>} receipts Successful npm package receipts from this build.
 * @returns {Promise<boolean>} Whether package coordinates changed; qualification/usage fields stay untouched.
 * @throws {Error} The existing descriptor cannot be read, parsed or has no package map.
 */
export async function syncIntegrationPackages(root, receipts) {
  const target = path.join(root, "ag-design.integration.json");
  const source = await readFile(target, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (source === null) return false;
  const integration = JSON.parse(source);
  if (
    !integration.packages ||
    typeof integration.packages !== "object" ||
    Array.isArray(integration.packages)
  )
    throw new TypeError("Integration package map required");
  const versions = new Map(
    receipts.map((receipt) => [receipt.name, receipt.version]),
  );
  let changed = false;
  for (const name of Object.keys(integration.packages)) {
    const version = versions.get(name);
    if (version && integration.packages[name] !== version) {
      integration.packages[name] = version;
      changed = true;
    }
  }
  if (changed)
    await writeFile(target, JSON.stringify(integration, null, 2) + "\n");
  return changed;
}

/** Produce offline tarballs and the exact same static assets for vanilla Python consumers. */
export async function pack(
  root = path.resolve(fileURLToPath(new URL("..", import.meta.url))),
) {
  // Ship the same numeric inspector in both independently installable packages.
  await copyFile(
    path.join(root, "packages/rules/form-row.js"),
    path.join(root, "packages/components/form-row-inspection.js"),
  );
  // Both offline packages ship byte-identical axis helpers from the core source.
  for (const file of ["chart-axis.js", "chart-axis-svg.js"])
    await copyFile(path.join(root, "packages/components", file), path.join(root, "packages/visual-tools", file));
  await buildPalette(root);
  // Package-only editions have no application examples. Full app builds refresh both owned subsets.
  const hasExamples = await lstat(
    path.join(root, "web/system-styles/component-lab.js"),
  )
    .then((entry) => entry.isFile())
    .catch((error) => {
      if (error.code === "ENOENT") return false;
      throw error;
    });
  if (hasExamples) {
    await buildStyleComponents(root);
    await buildCmsEditor(root);
  }
  const destination = path.join(root, "dist");
  await mkdir(destination, { recursive: true });
  const receipts = [];
  const publication = await readFile(path.join(root, "PUBLICATION.json"), "utf8").catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  const community = publication !== null && JSON.parse(publication).edition === "community";
  const libraryPackages = path.join(destination, "library-packages");
  await mkdir(libraryPackages, { recursive: true });
  const npmCli = process.platform === "win32" ? process.env.npm_execpath : null;
  if (process.platform === "win32" && !npmCli)
    throw new Error("Run the pack script through npm on Windows");
  for (const name of [
    "components",
    "rules",
    "visual-tools",
    "interaction-tools",
  ]) {
    const directory = path.join(root, "packages", name);
    const output = execFileSync(
      npmCli ? process.execPath : "npm",
      [...(npmCli ? [npmCli] : []), "pack", "--ignore-scripts", "--json", "--pack-destination", destination],
      { cwd: directory, encoding: "utf8" },
    );
    const [entry] = JSON.parse(output);
    if (community) {
      const bytes = await normalizeCommunityArchive(path.join(destination, entry.filename));
      entry.integrity = "sha512-" + createHash("sha512").update(bytes).digest("base64");
    }
    await copyFile(
      path.join(destination, entry.filename),
      path.join(libraryPackages, entry.filename),
    );
    receipts.push({
      name: entry.name,
      version: entry.version,
      file: entry.filename,
      integrity: entry.integrity,
      sha256: createHash("sha256")
        .update(await readFile(path.join(destination, entry.filename)))
        .digest("hex"),
    });
  }
  const vendor = path.join(root, "web/vendor/ag-design");
  await mkdir(vendor, { recursive: true });
  for (const name of await readdir(path.join(root, "packages/components"))) {
    if (!/\.(js|css|ts|md)$/.test(name) && name !== "TEXT-ENGINE-MANIFEST.json")
      continue;
    await copyFile(
      path.join(root, "packages/components", name),
      path.join(vendor, name),
    );
  }
  const files = {};
  for (const name of await readdir(vendor))
    if (name !== "manifest.json")
      files[name] = createHash("sha256")
        .update(await readFile(path.join(vendor, name)))
        .digest("hex");
  await writeFile(
    path.join(vendor, "manifest.json"),
    JSON.stringify(
      {
        version: receipts.find((item) => item.name === "@ag-design/components")
          .version,
        files,
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    path.join(destination, "packages.json"),
    JSON.stringify(receipts, null, 2) + "\n",
  );
  await prunePackageStaging(libraryPackages, receipts);
  // The catalogue uses this exact public navigation package; include its local CSS imports and helpers.
  const railVendor = path.join(root, "web/vendor/content-rail");
  await mkdir(railVendor, { recursive: true });
  const railFiles = {};
  for (const name of [
    "content-rail.js",
    "runtime.js",
    "rail-preview.js",
    "styles.css",
    "feed-rail.js",
    "feed-rail-position.js",
    "feed-rail-progress.js",
    "feed-rail-tracker.js",
    "feed-rail.css",
    "package.json",
  ]) {
    const bytes = await readFile(
      path.join(root, "packages/visual-tools", name),
    );
    await writeFile(path.join(railVendor, name), bytes);
    railFiles[name] = createHash("sha256").update(bytes).digest("hex");
  }
  const visual = receipts.find(
    (item) => item.name === "@ag-design/visual-tools",
  );
  await writeFile(
    path.join(railVendor, "manifest.json"),
    JSON.stringify(
      {
        version: visual.version,
        packageSha256: visual.sha256,
        files: railFiles,
      },
      null,
      2,
    ) + "\n",
  );
  // Qualification binds to immutable implementation bytes as well as version/metadata.
  const catalogPath = path.join(root, "catalog/components.json");
  const rawCatalog = await readFile(catalogPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (rawCatalog !== null) {
    const catalog = JSON.parse(rawCatalog);
    const artifact = receipts.find(
      (item) => item.name === "@ag-design/components",
    );
    for (const item of catalog.items) item.artifactHash = artifact.sha256;
    await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
  }
  await syncIntegrationPackages(root, receipts);
  return receipts;
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(JSON.stringify(await pack(), null, 2));
