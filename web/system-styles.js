import { get } from "./api.js";
import { h } from "./dom.js";

const previews = new Map([
  ["violet-soft-3d", "/system-styles/example.html?style=violet-soft-3d"],
  ["midnight-glass", "/system-styles/example.html?style=midnight-glass"],
  ["coral-pulse", "/system-styles/coral-pulse.html"],
  ["graphite-gold", "/system-styles/gold-console.html"],
  ["amber-circuit", "/system-styles/amber-circuit.html"],
  ["saas-clarity", "/system-styles/saas-clarity.html"],
  ["learning-air", "/system-styles/learning-air.html"],
  ["orchid-studio", "/system-styles/orchid-studio.html"],
  ["periwinkle-cms", "/system-styles/periwinkle-cms.html"],
]);
const previewHeights = {
  "orchid-studio": 1750,
  "periwinkle-cms": 1750,
  "saas-clarity": 1331,
  "learning-air": 1179,
  "coral-pulse": 1500,
  "graphite-gold": 1514,
  "amber-circuit": 1434,
  "violet-soft-3d": 1571,
  "midnight-glass": 1243,
};
const labels = {
  typography: "Типографика",
  geometry: "Геометрия и плотность",
  materials: "Материалы",
  layout: "Композиция",
};

/** Render trusted text nodes for the complete style recipe without interpreting authored prose as HTML. */
export function styleRecipe(style) {
  const root = h(
    "div",
    { className: "system-style-recipe" },
    h("p", {}, style.description),
  );
  for (const [key, title] of Object.entries(labels)) {
    const list = h("ul");
    for (const value of Object.values(style[key]))
      list.append(h("li", {}, value));
    root.append(h("section", {}, h("h3", {}, title), list));
  }
  if (style.graphics) {
    const list = h("dl", { className: "system-style-graphics" });
    const graphicLabels = {
      language: "Визуальный язык",
      icons: "Иконки",
      illustrations: "Иллюстрации",
      charts: "Диаграммы",
      generationPrompt: "Промпт для генерации",
      negativePrompt: "Что исключить",
      delivery: "Форматы и проверка",
    };
    for (const [key, title] of Object.entries(graphicLabels))
      list.append(h("dt", {}, title), h("dd", {}, style.graphics[key]));
    root.append(h("section", {}, h("h3", {}, "Графика и её генерация"), list));
  }
  for (const [key, title] of [
    ["suitableFor", "Когда подходит"],
    ["avoidFor", "Когда выбрать другой подход"],
    ["userRequests", "Примеры запросов"],
    ["componentGuidance", "Компоненты"],
    ["adaptation", "Адаптация и доступность"],
  ]) {
    const list = h("ul");
    for (const value of style[key]) list.append(h("li", {}, value));
    root.append(h("section", {}, h("h3", {}, title), list));
  }
  if (style.concept && previews.has(style.concept.assetId)) {
    root.append(
      h(
        "details",
        { className: "system-style-concept" },
        h("summary", {}, "Переработанный концепт по референсу"),
        h("p", {}, style.concept.notes),
        h(
          "a",
          {
            href: `/system-styles/concepts/${style.concept.assetId}.png`,
            target: "_blank",
            rel: "noopener",
          },
          h("img", {
            src: `/system-styles/concepts/${style.concept.assetId}.png`,
            alt: `Переработанный концепт ${style.name}`,
            loading: "lazy",
          }),
        ),
      ),
    );
  }
  const referenceIds = new Set([
    ...previews.keys(),
    "amber-circuit-diagonal",
    "amber-circuit-portal",
  ]);
  const originals = h(
    "details",
    { className: "system-style-originals" },
    h("summary", {}, "Исходные референсы"),
  );
  for (const reference of [
    style.reference,
    ...(style.reference.related || []),
  ]) {
    if (referenceIds.has(reference.assetId))
      originals.append(
        h(
          "figure",
          {},
          h("img", {
            src: `/system-styles/references/${reference.assetId}.png`,
            alt: reference.label,
            loading: "lazy",
          }),
          h("figcaption", {}, reference.label),
        ),
      );
  }
  if (originals.children.length > 1) root.append(originals);
  const tokens = h("dl", { className: "system-style-tokens" });
  for (const [name, value] of Object.entries(style.colors))
    tokens.append(h("dt", {}, name), h("dd", {}, value));
  root.append(
    h("section", {}, h("h3", {}, "Цветовые токены"), tokens),
    h(
      "section",
      {},
      h("h3", {}, "Инструкция для применения"),
      h("p", {}, style.applicationPrompt),
    ),
    h(
      "p",
      { className: "muted" },
      style.reference.label,
      ". ",
      style.reference.interpretation,
    ),
    h(
      "p",
      { className: "muted" },
      "Исходный референс SHA-256: ",
      h("code", {}, style.reference.sha256),
    ),
  );
  return root;
}

/** Mount style search with generation guards; disposal prevents stale requests from repopulating another page. */
export async function renderSystemStyles(
  root,
  { isCurrent = () => true, read = get } = {},
) {
  let generation = 0;
  let disposed = false;
  const query = h("input", {
    type: "search",
    id: "system-style-search",
    placeholder: "Мягкий фиолетовый объём, тёмное стекло…",
    maxlength: 256,
  });
  const submit = h(
    "button",
    { type: "submit", className: "ag-button" },
    "Найти стиль",
  );
  const form = h(
    "form",
    { className: "system-style-search" },
    h(
      "label",
      { className: "ag-field", for: query.id },
      "Опишите желаемый стиль",
      query,
    ),
    submit,
  );
  const results = h("div", { className: "system-style-grid" });
  const status = h("p", { role: "status", className: "muted" });
  root.replaceChildren(
    h(
      "p",
      { className: "system-style-intro" },
      "Стиль задаёт визуальный язык всей системы. Цветовой профиль меняет палитру, а компоненты отвечают за поведение. Выбирайте стиль по запросу пользователя; готовность продукта проверяется отдельно.",
    ),
    form,
    status,
    results,
  );

  /** Load a complete recipe only on demand; a failed read remains retryable on the next opening. */
  function card(item, current) {
    const article = h("article", {
      className: `system-style-card system-style-card--${item.theme}`,
    });
    if (previews.has(item.preview))
      article.append(
        h(
          "a",
          {
            href: previews.get(item.preview),
            target: "_blank",
            rel: "noopener",
          },
          h("img", {
            src: `/system-styles/previews/${item.preview}.jpg`,
            alt: `Пример рабочего интерфейса ${item.name}`,
            loading: "lazy",
            width: 1265,
            height: previewHeights[item.preview],
          }),
        ),
      );
    const detail = h(
      "details",
      {},
      h("summary", {}, "Правила применения и токены"),
    );
    let loading = false;
    let loaded = false;
    detail.addEventListener("toggle", async () => {
      if (!detail.open || loaded || loading || disposed) return;
      loading = true;
      try {
        const style = await read(
          `system-styles/${encodeURIComponent(item.id)}`,
        );
        if (disposed || !isCurrent() || current !== generation) return;
        detail.append(styleRecipe(style));
        loaded = true;
      } catch {
        if (!disposed && isCurrent() && current === generation)
          status.textContent =
            "Описание не загрузилось. Закройте и откройте правила для повтора.";
      } finally {
        loading = false;
      }
    });
    const body = h(
      "div",
      { className: "system-style-card-body" },
      h(
        "p",
        { className: "system-style-eyebrow" },
        item.theme === "dark" ? "Тёмная тема" : "Светлая тема",
      ),
      h("h2", {}, item.name),
      h("p", {}, item.summary),
    );
    if (previews.has(item.preview))
      body.append(
        h(
          "a",
          {
            className: "ag-button",
            href: previews.get(item.preview),
            target: "_blank",
            rel: "noopener",
          },
          "Открыть рабочий пример ↗",
        ),
      );
    body.append(detail);
    article.append(body);
    return article;
  }

  /** Replace only this page's current result; HTTP failures keep the search available. */
  async function load() {
    const current = ++generation;
    submit.disabled = true;
    status.textContent = "Ищем стили…";
    try {
      const page = await read(
        `system-styles?${new URLSearchParams({ q: query.value.trim(), limit: "100" })}`,
      );
      // The catalogue allows 128 styles, so a full gallery can require a second bounded page.
      const items = [...page.items];
      let continuation = page;
      let previousOffset = 0;
      while (continuation.hasMore && items.length < 128) {
        if (disposed || !isCurrent() || current !== generation) return;
        const offset = continuation.nextOffset;
        if (!Number.isInteger(offset) || offset <= previousOffset)
          throw new Error("Invalid style page");
        continuation = await read(
          `system-styles?${new URLSearchParams({ q: query.value.trim(), limit: "100", offset: String(offset) })}`,
        );
        previousOffset = offset;
        items.push(...continuation.items);
      }
      if (disposed || !isCurrent() || current !== generation) return;
      results.replaceChildren(...items.map((item) => card(item, current)));
      status.textContent = page.total
        ? `Стили: ${page.total}. Совпадения по словам — кандидаты для выбора.`
        : "Подходящий стиль не найден. Попробуйте описать цвет, материал или настроение.";
    } catch {
      if (!disposed && isCurrent() && current === generation)
        status.textContent = "Каталог стилей недоступен. Повторите поиск.";
    } finally {
      if (!disposed && current === generation) submit.disabled = false;
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    load();
  });
  await load();
  return () => {
    disposed = true;
    generation++;
  };
}
