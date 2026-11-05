import {
  createButton,
  createField,
  createSelect,
} from "./vendor/ag-design/index.js";

let sequence = 0;
const modes = {
  free: "Свободно",
  row: "В строку",
  column: "В столбец",
  grid: "Сетка",
};
const alignments = {
  start: "По началу",
  center: "По центру",
  end: "По концу",
  stretch: "Растянуть",
};

/** Return valid frame parents without deriving parentage from geometry or allowing cycles. */
function parentChoices(node, nodes) {
  const children = new Map();
  for (const item of nodes) {
    if (!children.has(item.parentId)) children.set(item.parentId, []);
    children.get(item.parentId).push(item.id);
  }
  const excluded = new Set(),
    pending = [node.id];
  while (pending.length) {
    const id = pending.pop();
    if (excluded.has(id)) continue;
    excluded.add(id);
    pending.push(...(children.get(id) || []));
  }
  return nodes
    .filter((item) => item.kind === "frame" && !excluded.has(item.id))
    .map((item) => {
      const title = String(item.title || item.id);
      return {
        value: item.id,
        label: title.length > 180 ? `${title.slice(0, 179)}…` : title,
        title,
      };
    });
}

/** Build a host-controlled inspector; only native change commits scalar envelopes, never network writes. */
export function createCompositionProperties({
  node,
  nodes = [],
  depth = 0,
  fields = [],
  onUpdate,
  onRemove,
  onError,
  document = globalThis.document,
} = {}) {
  if (!node || !node.layout || !Array.isArray(nodes) || !Array.isArray(fields))
    throw new TypeError(
      "A composition node, layout and field definitions are required",
    );
  const controller = new document.defaultView.AbortController();
  const signal = controller.signal,
    prefix = `composition-properties-${++sequence}`;
  const disposers = [];
  let disposed = false,
    fieldSequence = 0;
  const element = make("div", "composition-properties");

  /** Create literal DOM content so object names and properties cannot become markup. */
  function make(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  /** Keep grouping structural: heading and spacing, without another decorative card. */
  function group(title, { collapsed = false } = {}) {
    const section = make(
      collapsed ? "details" : "section",
      "composition-properties__group",
    );
    const heading = make(
      collapsed ? "summary" : "h4",
      "composition-properties__heading",
      title,
    );
    section.append(heading);
    element.append(section);
    return section;
  }
  function pair(container) {
    const row = make("div", "composition-properties__pair");
    container.append(row);
    return row;
  }
  /** Native constraints and a persistent local error describe failure without erasing draft input. */
  function input(
    container,
    {
      label,
      value,
      type = "text",
      multiline = false,
      maxlength = 4096,
      required = false,
      min,
      max,
      step = "any",
      hint = "",
      describedBy,
      parse,
      commit,
    },
  ) {
    const id = `${prefix}-field-${++fieldSequence}`;
    const wrapper = createField({
      document,
      id,
      label,
      type,
      required,
      density: "compact",
      hint,
    });
    let control = wrapper.querySelector("input");
    if (multiline) {
      // Keep the original AG label/error association while preserving literal newlines in source fields.
      const textarea = document.createElement("textarea");
      for (const attribute of control.attributes)
        if (attribute.name !== "type")
          textarea.setAttribute(attribute.name, attribute.value);
      textarea.rows = 6;
      textarea.maxLength = maxlength;
      control.replaceWith(textarea);
      control = textarea;
    }
    if (type === "text" || multiline) control.maxLength = maxlength;
    control.setAttribute("aria-label", label);
    if (type === "checkbox") control.checked = value === true;
    else control.value = value ?? "";
    if (type === "number") {
      control.step = String(step);
      if (min !== undefined) control.min = String(min);
      if (max !== undefined) control.max = String(max);
    }
    if (describedBy)
      control.setAttribute(
        "aria-describedby",
        [control.getAttribute("aria-describedby"), describedBy]
          .filter(Boolean)
          .join(" "),
      );
    const error = make("span", "composition-properties__error");
    error.id = `${id}-error`;
    error.hidden = true;
    error.setAttribute("aria-live", "polite");
    wrapper.append(error);
    container.append(wrapper);
    const helpIds = control.getAttribute("aria-describedby") || "";
    control.addEventListener(
      "change",
      () => {
        if (disposed || control.disabled) return;
        control.setCustomValidity("");
        error.hidden = true;
        error.textContent = "";
        control.removeAttribute("aria-invalid");
        if (helpIds) control.setAttribute("aria-describedby", helpIds);
        else control.removeAttribute("aria-describedby");
        try {
          const raw = type === "checkbox" ? control.checked : control.value;
          const next = parse ? parse(raw) : raw;
          if (!control.checkValidity())
            throw new Error(`Проверьте поле «${label}» и указанный диапазон.`);
          commit(next);
        } catch (failure) {
          const message = failure?.message || `Проверьте поле «${label}».`;
          control.setCustomValidity(message);
          control.setAttribute("aria-invalid", "true");
          control.setAttribute(
            "aria-describedby",
            [helpIds, error.id].filter(Boolean).join(" "),
          );
          error.textContent = message;
          error.hidden = false;
          onError?.(message);
        }
      },
      { signal },
    );
    return control;
  }
  /** Numeric input never converts an empty draft into zero or accepts symbolic sizing keywords. */
  function numeric(
    container,
    {
      key,
      label,
      min = 0,
      max = 10000,
      integer = false,
      step = "any",
      constraintHint,
      layout = true,
      value,
      commit,
    },
  ) {
    return input(container, {
      label,
      value: value ?? node.layout[key],
      type: "number",
      required: true,
      min,
      max,
      step: integer ? 1 : step,
      describedBy: constraintHint,
      hint: constraintHint
        ? ""
        : `${integer ? "Целое число" : "Число"} от ${min} до ${max}.`,
      parse(raw) {
        const next = Number(raw);
        if (
          !raw.trim() ||
          !Number.isFinite(next) ||
          next < min ||
          next > max ||
          (integer && !Number.isInteger(next))
        )
          throw new Error(
            `«${label}»: введите ${integer ? "целое число" : "число"} от ${min} до ${max}.`,
          );
        if (
          layout &&
          key.startsWith("min") &&
          next > node.layout[key.replace("min", "max")]
        )
          throw new Error(
            "Минимальный размер не может быть больше максимального.",
          );
        if (
          layout &&
          key.startsWith("max") &&
          next < node.layout[key.replace("max", "min")]
        )
          throw new Error(
            "Максимальный размер не может быть меньше минимального.",
          );
        return next;
      },
      commit:
        commit ||
        ((next) => onUpdate?.({ layout: { ...node.layout, [key]: next } })),
    });
  }
  /** Existing AG native selects own their listeners and are disposed with this inspector. */
  function choice(
    container,
    { label, value, options, labels, placeholder, commit },
  ) {
    const normalized = options.map((item) =>
      typeof item === "string"
        ? { value: item, label: labels?.[item] || item }
        : item,
    );
    const known = normalized.some(
      (item) => item.value === value && !item.disabled,
    );
    const select = createSelect({
      document,
      label,
      value: known ? value : "",
      options: normalized,
      placeholder: placeholder ?? (!known ? "Выберите значение" : undefined),
      onChange(next) {
        if (!disposed) commit(next);
      },
    });
    select.select.setAttribute("aria-label", label);
    for (const option of select.select.options) {
      const source = normalized.find((item) => item.value === option.value);
      if (source?.title) option.title = source.title;
    }
    disposers.push(() => select.dispose());
    container.append(select.element);
    return select;
  }

  const object = group("Объект");
  input(object, {
    label: "Название объекта",
    value: node.title || "",
    required: true,
    parse(raw) {
      if (!raw.trim()) throw new Error("Введите название объекта.");
      return raw;
    },
    commit: (title) => onUpdate?.({ title }),
  });
  choice(object, {
    label: "Родитель",
    value: node.parentId || "",
    options: parentChoices(node, nodes),
    placeholder: "Страница",
    commit: (parentId) => onUpdate?.({ parentId: parentId || null }),
  });

  const position = group("Положение");
  const positionHint = make(
    "p",
    "composition-properties__hint",
    "Координаты в px, от −10000 до 10000.",
  );
  positionHint.id = `${prefix}-position-hint`;
  position.append(positionHint);
  const coordinates = pair(position);
  numeric(coordinates, {
    key: "x",
    label: "X, px",
    min: -10000,
    constraintHint: positionHint.id,
  });
  numeric(coordinates, {
    key: "y",
    label: "Y, px",
    min: -10000,
    constraintHint: positionHint.id,
  });

  const sizes = group("Размеры");
  const sizeHint = make(
    "p",
    "composition-properties__hint",
    "Положительное число до 10000 px; fill — занять место, hug — по содержимому.",
  );
  sizeHint.id = `${prefix}-size-hint`;
  const dimensions = pair(sizes);
  sizes.append(sizeHint);
  for (const [key, label] of [
    ["width", "Ширина"],
    ["height", "Высота"],
  ])
    input(dimensions, {
      label,
      value: node.layout[key],
      required: true,
      describedBy: sizeHint.id,
      parse(raw) {
        const value = raw.trim();
        if (value === "fill" || value === "hug") return value;
        const next = Number(value);
        if (
          !/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) ||
          !Number.isFinite(next) ||
          next <= 0 ||
          next > 10000
        )
          throw new Error(
            `«${label}»: введите положительное число до 10000, fill или hug.`,
          );
        return next;
      },
      commit: (next) => onUpdate?.({ layout: { ...node.layout, [key]: next } }),
    });

  const layout = group("Раскладка");
  choice(layout, {
    label: "Расположение",
    value: node.layout.mode,
    options: Object.keys(modes),
    labels: modes,
    commit: (mode) => onUpdate?.({ layout: { ...node.layout, mode } }),
  });
  choice(layout, {
    label: "Выравнивание",
    value: node.layout.align,
    options: Object.keys(alignments),
    labels: alignments,
    commit: (align) => onUpdate?.({ layout: { ...node.layout, align } }),
  });
  const spaceHint = make(
    "p",
    "composition-properties__hint",
    "Расстояния в px, от 0 до 10000.",
  );
  spaceHint.id = `${prefix}-spacing-hint`;
  layout.append(spaceHint);
  const spacing = pair(layout);
  numeric(spacing, {
    key: "gap",
    label: "Между элементами, px",
    constraintHint: spaceHint.id,
  });
  numeric(spacing, {
    key: "padding",
    label: "Внутренний отступ, px",
    constraintHint: spaceHint.id,
  });
  if (node.layout.mode === "grid")
    numeric(layout, {
      key: "columns",
      label: "Число столбцов",
      min: 1,
      max: 12,
      integer: true,
    });

  if (node.kind === "component" && fields.length) {
    const properties = group("Свойства компонента");
    for (const definition of fields) {
      const value = node.props?.[definition.key] ?? definition.value;
      const commit = (next) =>
        onUpdate?.({ props: { ...node.props, [definition.key]: next } });
      if (definition.type === "select")
        choice(properties, {
          ...definition,
          value: String(value ?? ""),
          commit,
        });
      else if (definition.type === "number")
        numeric(properties, {
          ...definition,
          value,
          layout: false,
          min: definition.min ?? -10000,
          max: definition.max ?? 10000,
          commit,
        });
      else
        input(properties, {
          label: definition.label,
          value,
          type: definition.type === "boolean" ? "checkbox" : "text",
          multiline: definition.multiline === true,
          maxlength: definition.maxlength || 4096,
          required: definition.nonempty === true,
          parse(raw) {
            if (definition.nonempty && !raw.trim())
              throw new Error(`Введите «${definition.label}».`);
            if (raw.length > (definition.maxlength || 4096))
              throw new Error(
                `«${definition.label}»: слишком длинное значение.`,
              );
            return raw;
          },
          commit,
        });
    }
  }

  const constraints = group("Ограничения размеров", { collapsed: true });
  const constraintHint = make(
    "p",
    "composition-properties__hint",
    "От 0 до 10000 px. Минимум не больше максимума.",
  );
  constraintHint.id = `${prefix}-constraints-hint`;
  constraints.append(constraintHint);
  for (const [minimum, maximum, minLabel, maxLabel] of [
    ["minWidth", "maxWidth", "Мин. ширина, px", "Макс. ширина, px"],
    ["minHeight", "maxHeight", "Мин. высота, px", "Макс. высота, px"],
  ]) {
    const limits = pair(constraints);
    numeric(limits, {
      key: minimum,
      label: minLabel,
      constraintHint: constraintHint.id,
    });
    numeric(limits, {
      key: maximum,
      label: maxLabel,
      constraintHint: constraintHint.id,
    });
  }
  const technical = group("Технические сведения", { collapsed: true });
  const identity = make("dl", "composition-properties__identity");
  identity.append(
    make("dt", null, "ID объекта"),
    make("dd", null, String(node.id)),
    make("dt", null, "Глубина вложенности"),
    make("dd", null, String(depth)),
  );
  technical.append(identity);
  const remove = createButton({
    document,
    label: "Удалить объект",
    variant: "danger",
    disabled: !onRemove,
  });
  remove.addEventListener(
    "click",
    () => {
      if (!disposed && !remove.disabled) onRemove?.();
    },
    { signal },
  );
  element.append(remove);

  return {
    element,
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      for (const dispose of disposers) dispose();
    },
  };
}
