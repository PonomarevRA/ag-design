import { get, post } from "./api.js";
import { h } from "./dom.js";
import { createButton, createNotice } from "./vendor/ag-design/index.js";

const previewControllers = new WeakMap();

/** Keep the opaque document hidden until its styles and initial Canvas paints have settled. */
function bindPreviewLoad(frame) {
  const view = frame.ownerDocument.defaultView;
  let disposed = false,
    revision = 0,
    firstPaint = 0,
    secondPaint = 0;
  /** Cancel both bounded paint callbacks on a replacement navigation or disposal. */
  function cancelReveal() {
    if (firstPaint) view.cancelAnimationFrame(firstPaint);
    if (secondPaint) view.cancelAnimationFrame(secondPaint);
    firstPaint = secondPaint = 0;
  }
  function loaded() {
    if (disposed) return;
    cancelReveal();
    const current = revision;
    firstPaint = view.requestAnimationFrame(() => {
      firstPaint = 0;
      if (disposed || current !== revision) return;
      secondPaint = view.requestAnimationFrame(() => {
        secondPaint = 0;
        if (disposed || current !== revision) return;
        frame.style.visibility = "visible";
        frame.dataset.previewReady = "true";
        frame.setAttribute("aria-busy", "false");
      });
    });
  }
  frame.addEventListener("load", loaded);
  /** Same URL preserves local state/focus; a real change starts a fresh, cancellable reveal. */
  function navigate(next, theme) {
    if (disposed || frame.getAttribute("src") === next) return;
    revision++;
    cancelReveal();
    frame.style.colorScheme = theme === "dark" ? "dark" : "light";
    frame.style.visibility = "hidden";
    frame.dataset.previewReady = "false";
    frame.setAttribute("aria-busy", "true");
    frame.src = next;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelReveal();
    frame.removeEventListener("load", loaded);
    frame.src = "about:blank";
    frame.remove();
  }
  const controller = { navigate, dispose };
  previewControllers.set(frame, controller);
  return controller;
}

/** Build only a same-origin, namespace-bound preview URL; no manifest-provided URLs execute. */
function previewUrl(component, palette, theme) {
  return `/api/v1/library-previews/${encodeURIComponent(component.libraryId)}/${encodeURIComponent(component.localId)}?theme=${theme}&profile=${encodeURIComponent(palette)}`;
}

/** Isolate all library preview code from the catalog DOM, storage and credentials; restrict resources with CSP. */
export function createLibraryPreview(component, palette, theme) {
  const frame = h("iframe", {
    title: `Пример: ${component.name}`,
    className: "library-preview",
    sandbox: "allow-scripts",
    referrerPolicy: "no-referrer",
    loading: "lazy",
  });
  frame.dataset.libraryId = component.libraryId;
  frame.dataset.localId = component.localId;
  const controller = bindPreviewLoad(frame);
  controller.navigate(previewUrl(component, palette, theme), theme);
  return {
    element: frame,
    dispose: controller.dispose,
    interact: () => {},
  };
}

/** Refresh explicitly selected theme/profile without accepting messages or arbitrary parent commands. */
export function updateLibraryPreview(frame, palette, theme) {
  const next = previewUrl(
    { libraryId: frame.dataset.libraryId, localId: frame.dataset.localId },
    palette,
    theme,
  );
  const controller = previewControllers.get(frame);
  if (controller) controller.navigate(next, theme);
  else if (frame.getAttribute("src") !== next) frame.src = next;
}

/** Render explicit local-file import and retained version selection; the server owns CAS and validation. */
export async function renderElementLibraries(
  host,
  { refresh, openLibrary, isCurrent = () => true },
) {
  const response = await get("libraries");
  if (!isCurrent()) return;
  const notice = h("div", { role: "status" });
  const input = h("input", {
    type: "file",
    accept: ".aglib.json,application/json",
    id: "library-import",
  });
  const form = h(
    "section",
    { className: "library-import" },
    h("h2", {}, "Подключить библиотеку"),
    h(
      "p",
      {},
      "Выберите файл .aglib.json с компонентами, версией и примерами. Опубликованные версии сохраняются для возврата.",
    ),
    h("label", { for: "library-import" }, "Файл библиотеки"),
    input,
    notice,
  );
  const list = h("div", { className: "library-list" });
  host.replaceChildren(form, list);
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    input.disabled = true;
    try {
      if (file.size > 524288)
        throw new Error("Файл библиотеки превышает 512 КиБ");
      const bundle = JSON.parse(await file.text());
      await post("libraries/import", {
        bundle,
        expectedRevision: response.catalogRevision,
      });
      if (isCurrent()) await refresh();
    } catch (cause) {
      if (isCurrent())
        notice.replaceChildren(
          createNotice({ text: cause.message, tone: "danger" }),
        );
    } finally {
      input.disabled = false;
    }
  });
  for (const library of response.items) {
    const status = h(
      "p",
      { className: "muted" },
      library.builtIn
        ? "Встроенная · всегда доступна"
        : `${library.enabled ? "Подключена" : "Отключена"} · ${library.componentCount} компонентов`,
    );
    const card = h(
      "article",
      { className: "library-card" },
      h("h2", {}, library.name),
      status,
    );
    if (library.description) card.append(h("p", {}, library.description));
    if (!library.builtIn) {
      const versions = h("select", { "aria-label": `Версия: ${library.name}` });
      for (const version of [...library.versions].sort((a,b) => b.localeCompare(a, undefined, {numeric:true})))
        versions.append(h("option", { value: version }, version));
      versions.value = library.activeVersion;
      const change = async (enabled) => {
        try {
          await post("libraries/state", {
            libraryId: library.id,
            enabled,
            version: versions.value,
            expectedRevision: response.catalogRevision,
          });
          if (isCurrent()) await refresh();
        } catch (cause) {
          if (isCurrent())
            notice.replaceChildren(
              createNotice({ text: cause.message, tone: "danger" }),
            );
        }
      };
      versions.addEventListener("change", () => change(library.enabled));
      card.append(
        h("label", {}, "Версия ", versions),
        createButton({
          label: library.enabled ? "Отключить" : "Подключить",
          onClick: () => change(!library.enabled),
        }),
      );
      card.append(
        h(
          "details",
          {},
          h("summary", {}, "Происхождение и пакет"),
          h("p", {}, `${library.package.name} ${library.package.version}`),
          h("code", {}, `SHA-256: ${library.package.sha256}`),
        ),
      );
    }
    if (library.enabled)
      card.append(
        createButton({
          label: "Показать компоненты",
          variant: "quiet",
          onClick: () => openLibrary(library),
        }),
      );
    list.append(card);
  }
}
