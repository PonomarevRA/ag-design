/** Explain an empty, loading or failed region without pretending that missing data is success. */
export function createStatePanel({
  document = globalThis.document,
  state = "empty",
  title,
  description = "",
  actionLabel,
  onAction,
} = {}) {
  if (!["empty", "loading", "error"].includes(state) || !title)
    throw new TypeError("A known state and title are required");
  const element = document.createElement("section");
  element.className = "ag-state-panel";
  element.dataset.state = state;
  // This panel explains state; the host marks its separate result subtree busy.
  // Keep the live message outside any busy region owned by this component.
  const heading = document.createElement("h3"),
    text = document.createElement("p");
  heading.textContent = title;
  text.textContent = description;
  const content = document.createElement("div");
  content.setAttribute("role", state === "error" ? "alert" : "status");
  content.append(heading, text);
  element.append(content);
  let button;
  const activate = () => onAction?.();
  if (actionLabel && onAction && state !== "loading") {
    button = document.createElement("button");
    button.type = "button";
    button.className = "ag-button ag-button--secondary";
    button.textContent = actionLabel;
    button.addEventListener("click", activate);
    element.append(button);
  }
  return {
    element,
    dispose: () => button?.removeEventListener("click", activate),
  };
}
