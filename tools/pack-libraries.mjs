import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

/** Build an offline portable library from the same public factories shipped in the immutable npm tarball. */
export async function packLibrary({
  directory,
  id,
  name,
  description,
  sources,
  profiles = [],
}) {
  const root = new URL("../", import.meta.url);
  const packageDefinition = JSON.parse(
    await readFile(new URL(`packages/${directory}/package.json`, root), "utf8"),
  );
  const version = packageDefinition.version;
  const specs = JSON.parse(
    await readFile(
      new URL(`packages/${directory}/component-specs.json`, root),
      "utf8",
    ),
  );
  const script = await build({
    entryPoints: [
      new URL(`packages/${directory}/preview-entry.js`, root).pathname,
    ],
    bundle: true,
    write: false,
    format: "iife",
    globalName: "AGElementLibrary",
    target: ["es2020"],
    minify: true,
  });
  const archive = await readFile(
    new URL(`dist/ag-design-${directory}-${version}.tgz`, root),
  );
  const packageHash = createHash("sha256").update(archive).digest("hex");
  const components = specs.map(
    ([
      id,
      name,
      summary,
      category,
      exportName,
      usageExample,
      anatomy,
      states,
      extraTags = [],
    ]) => ({
      id,
      name,
      summary,
      category,
      tags: [directory, "offline", id, ...extraTags],
      version,
      package: packageDefinition.name,
      exportName,
      platforms: ["web", "macos", "windows", "linux"],
      rules: [
        "accessible-name",
        "keyboard-flow",
        "color-profiles",
        "qualification",
        "design-rationale",
        ...(["chart-line", "chart-area", "chart-bar", "particle-chart", "ascii-chart", "analytic-chart"].includes(id) ? ["chart-time-axis-context"] : []),
      ],
      extensions: [
        "host callbacks",
        "semantic CSS variables",
        "update",
        "dispose",
      ],
      usageExample,
      budget: {
        mountP95Ms: 16,
        interactionP95Ms: 16,
        retainedBytesPerInstance: [
          "analytic-chart",
          "stat-sparkline",
          "stat-sparkline-ascii",
          "heatmap",
          "heatmap-ascii",
          "state-timeline",
          "state-timeline-ascii",
          "chart-settings",
        ].includes(id)
          ? 8388608
          : 262144,
      },
      colorProfiles: [
        "atlas",
        "memory",
        "observer",
        "tasks",
        "design",
        ...profiles.map((profile) => profile.id),
      ],
      anatomy,
      variants: ["light", "dark"],
      states,
      design: {
        intendedUse: summary,
        rationale:
          "Самостоятельный локальный элемент; данные, сервисы и расчёты принадлежат приложению.",
        alternatives: [
          "Использовать базовый AG-компонент, если предметная композиция не нужна.",
        ],
        limitations:
          "Синтетические примеры. Без сетевых загрузок. Ограничения форматов, размеров и функций описаны в README пакета. Ручная проверка экранного диктора и физических touch-устройств не выполнена.",
        lifecycle: "draft",
        sources: ["content-rail", "conversation-rail", "feed-rail"].includes(id)
          ? [
              "https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html",
              "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
            ]
          : sources,
      },
    }),
  );
  const bundle = {
    schemaVersion: "ag-design/element-library-v1",
    id,
    name,
    version,
    description: `${components.length} элементов. ${description}`,
    sources,
    package: {
      name: packageDefinition.name,
      version,
      sha256: packageHash,
    },
    components,
    previewScript: script.outputFiles[0].text,
    // Inline local CSS imports so sandboxed previews remain entirely offline.
    previewStyles: (await build({
      entryPoints: [new URL(`packages/${directory}/styles.css`, root).pathname],
      bundle: true, write: false, target: ["es2020"],
    })).outputFiles[0].text,
    profiles,
  };
  const outputDirectory = new URL("catalog/libraries/", root);
  await mkdir(outputDirectory, { recursive: true });
  const text = JSON.stringify(bundle, null, 2) + "\n";
  const immutablePath = new URL(`${id}-${version}.aglib.json`, outputDirectory);
  const previous = await readFile(immutablePath, "utf8").catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (previous !== null) {
    const existing = JSON.parse(previous);
    if (existing.id !== id || existing.version !== version || existing.package?.sha256 !== packageHash)
      throw new Error(`Library ${id}@${version} already exists with different implementation; bump its version`);
    // A newer generator must not rewrite retained releases, including their preview CSS.
    await writeFile(new URL(`dist/${id}-${version}.aglib.json`, root), previous);
    return {library: id, version, components: existing.components.length, bytes: Buffer.byteLength(previous), packageSha256: packageHash, retained: true};
  }
  await writeFile(immutablePath, text);
  await writeFile(new URL(`dist/${id}-${version}.aglib.json`, root), text);
  return {
    library: bundle.id,
    version: bundle.version,
    components: components.length,
    bytes: Buffer.byteLength(text),
    packageSha256: packageHash,
  };
}

/** Package current versions only; retained immutable releases are never rewritten. */
export async function packElementLibraries() {
  const visual = await packLibrary({
    directory: "visual-tools",
    id: "visual-tools",
    name: "AG · Графики и планирование",
    description: "Автономная навигация, графики, время и планирование.",
    sources: [
      "https://www.w3.org/WAI/tutorials/images/complex/",
      "https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html",
      "https://html.spec.whatwg.org/multipage/canvas.html",
    ],
  });
  const interactions = await packLibrary({
    directory: "interaction-tools",
    id: "interaction-tools",
    name: "AG · Взаимодействие",
    description: "Локальные уведомления, фильтры и анимированные значения.",
    sources: [
      "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
      "https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html",
      "https://tc39.es/ecma402/",
    ],
  });
  return [visual, interactions];
}
if (process.argv[1] === new URL(import.meta.url).pathname)
  console.log(JSON.stringify(await packElementLibraries()));
