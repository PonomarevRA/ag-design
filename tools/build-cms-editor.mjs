import { build } from "esbuild";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
/** Produce the offline localized Markdown editor with external CSP-compatible styles and exact hashes. */
export async function buildCmsEditor(
  root = path.resolve(fileURLToPath(new URL("..", import.meta.url))),
) {
  const output = path.join(root, "web/system-styles/vendor/cms");
  await mkdir(output, { recursive: true });
  await build({
    absWorkingDir: root,
    entryPoints: ["packages/components/markdown-editor-localized.js"],
    outfile: path.join(output, "editor.js"),
    bundle: true,
    format: "esm",
    target: ["safari16", "chrome110"],
  });
  const css = [
    "code-viewer-base.css",
    "code-viewer.css",
    "markdown-viewer.css",
    "markdown-editor.css",
  ];
  const contents = css.map((file) => '@import "./' + file + '";').join("\n");
  await build({
    stdin: {
      contents,
      loader: "css",
      resolveDir: path.join(root, "packages/components"),
    },
    outfile: path.join(output, "editor.css"),
    bundle: true,
  });
  const files = {};
  for (const name of ["editor.js", "editor.css"])
    files[name] = createHash("sha256")
      .update(await readFile(path.join(output, name)))
      .digest("hex");
  await copyFile(
    path.join(root, "packages/components/TEXT-ENGINE-LICENSES.md"),
    path.join(output, "TEXT-ENGINE-LICENSES.md"),
  );
  const { version } = JSON.parse(
    await readFile(path.join(root, "packages/components/package.json"), "utf8"),
  );
  await writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify(
      { component: "markdown-editor", version, outputs: files },
      null,
      2,
    ) + "\n",
  );
  return files;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await buildCmsEditor();
