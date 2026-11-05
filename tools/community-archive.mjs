import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { gzipSync } from "fflate";
import { fileURLToPath } from "node:url";

/**
 * Preserve npm's portable tar bytes while giving community archives reproducible gzip bytes.
 * Node22 and Node24 use different native compressors; pinned pure-JS fflate avoids that drift.
 * @param {string} file Newly generated, owned npm archive; never an installed library artifact.
 * @returns {Promise<Buffer>} Canonical archive bytes, also written to the generated file.
 */
export async function normalizeCommunityArchive(file) {
  const tar = gunzipSync(await readFile(file));
  const archive = Buffer.from(gzipSync(tar, { level: 9, mtime: 0 }));
  await writeFile(file, archive);
  return archive;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error("Expected one generated archive path");
  await normalizeCommunityArchive(process.argv[2]);
}
