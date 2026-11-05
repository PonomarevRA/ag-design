import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
/** Rebuild the trusted service runtime from the same public model. No caller data selects modules. */
export async function buildPalette(
  root = fileURLToPath(new URL("../", import.meta.url)),
) {
  await build({
    entryPoints: [path.join(root, "packages/components/palette-model.js")],
    bundle: true,
    format: "iife",
    globalName: "AGPalette",
    outfile: path.join(root, "packages/components/palette-runtime.js"),
    legalComments: "inline",
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await buildPalette();
