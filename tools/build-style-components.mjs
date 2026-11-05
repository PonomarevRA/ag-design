import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Bundle core factories, example adapters and chart assets for standalone/offline style pages.
 * @param {string} root Absolute repository root containing packages and web/system-styles.
 * @returns {Promise<object>} Filename-to-SHA256 map also written to the lab manifest; chart hashes have their own manifest.
 * @throws {Error} A source cannot be read or an offline bundle cannot be built/written.
 * The Markdown engine remains lazy and separately licensed.
 */
export async function buildStyleComponents(
  root = path.resolve(fileURLToPath(new URL("..", import.meta.url))),
) {
  const output = path.join(root, "web/system-styles/vendor/lab");
  await mkdir(output, { recursive: true });
  // The examples share one locale runtime without downloading the complete core module graph.
  await build({
    absWorkingDir: root,
    entryPoints: ["web/locale-preferences.js"],
    outfile: path.join(output, "locale.js"),
    bundle: true,
    format: "esm",
    target: ["safari16", "chrome110"],
  });
  await build({
    absWorkingDir: root,
    entryPoints: ["web/system-styles/component-lab.js"],
    outfile: path.join(output, "components.js"),
    bundle: true,
    format: "esm",
    target: ["safari16", "chrome110"],
    plugins: [
      {
        name: "local-editor",
        setup(builder) {
          builder.onResolve(
            { filter: /^\.\.\/locale-preferences\.js$/ },
            () => ({ path: "./locale.js", external: true }),
          );
          builder.onResolve(
            { filter: /^\.\/vendor\/cms\/editor\.js$/ },
            () => ({ path: "../cms/editor.js", external: true }),
          );
        },
      },
    ],
  });
  await build({
    absWorkingDir: root,
    entryPoints: ["packages/components/styles.css"],
    outfile: path.join(output, "components.css"),
    bundle: true,
  });
  await build({
    absWorkingDir: root,
    entryPoints: ["packages/components/audit.js"],
    outfile: path.join(output, "audit.js"),
    bundle: true,
    format: "esm",
    target: ["safari16", "chrome110"],
  });
  await build({
    absWorkingDir: root,
    entryPoints: ["web/system-styles/style-choice.js"],
    outfile: path.join(output, "choices.js"),
    bundle: true,
    format: "esm",
    target: ["safari16", "chrome110"],
  });
  // Purpose-specific layout recipes use the same core factory, bundled for standalone/offline pages.
  await build({
    absWorkingDir: root,
    entryPoints: ["web/system-styles/example-bento.js"],
    outfile: path.join(output, "bento.js"),
    bundle: true,
    format: "esm",
    target: ["safari16", "chrome110"],
  });
  const files = {};
  for (const name of [
    "components.js",
    "components.css",
    "audit.js",
    "locale.js",
    "choices.js",
    "bento.js",
  ])
    files[name] = createHash("sha256")
      .update(await readFile(path.join(output, name)))
      .digest("hex");
  const metadata = JSON.parse(
    await readFile(path.join(root, "packages/components/package.json"), "utf8"),
  );
  await writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify(
      { package: metadata.name, version: metadata.version, files },
      null,
      2,
    ) + "\n",
  );
  await buildStyleCharts(root);
  return files;
}
/** Bundle chart source and CSS on every normal pack, recording exact offline input/output hashes. */
async function buildStyleCharts(root) {
  const output = path.join(root, "web/system-styles/vendor");
  const script = await build({
    absWorkingDir: root,
    entryPoints: ["packages/visual-tools/chart.js"],
    outfile: path.join(output, "chart.js"),
    bundle: true,
    format: "esm",
    target: ["safari16", "chrome110"],
    metafile: true,
  });
  const css = await build({
    absWorkingDir: root,
    entryPoints: ["packages/visual-tools/styles.css"],
    outfile: path.join(output, "chart.css"),
    bundle: true,
    metafile: true,
  });
  const files = {};
  for (const file of [
    ...Object.keys(script.metafile.inputs),
    ...Object.keys(css.metafile.inputs),
  ].sort())
    files[file] = createHash("sha256")
      .update(await readFile(path.join(root, file)))
      .digest("hex");
  const outputs = {};
  for (const file of ["chart.js", "chart.css"])
    outputs[file] = createHash("sha256")
      .update(await readFile(path.join(output, file)))
      .digest("hex");
  const metadata = JSON.parse(
    await readFile(
      path.join(root, "packages/visual-tools/package.json"),
      "utf8",
    ),
  );
  await writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify(
      {
        package: metadata.name,
        version: metadata.version,
        basis: "exact offline package source; not consumer qualification",
        files,
        outputs,
      },
      null,
      2,
    ) + "\n",
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  await buildStyleComponents();
