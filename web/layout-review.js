const frame = document.getElementById("preview");
/** Use an actual nested browsing viewport; never pretend CSS scaling changes media queries. */
function update() {
  frame.style.width = `${document.getElementById("width").value}px`;
  const documentInFrame = frame.contentDocument;
  if (!documentInFrame?.body) return;
  const scale = Number(document.getElementById("text-size").value) / 100;
  // Save computed sizes once per document so changing the control is reversible, not cumulative.
  const elements = [
    ...documentInFrame.querySelectorAll(
      "h1,h2,h3,p,span,a,button,input,select,label",
    ),
  ].filter(
    (element) =>
      !element.closest('[aria-hidden="true"],.ag-icon-button,.nav-symbol'),
  );
  // Capture all baselines before changing ancestors; otherwise inherited fonts would be doubled repeatedly.
  for (const element of elements)
    if (!element.dataset.reviewFont)
      element.dataset.reviewFont = String(
        parseFloat(frame.contentWindow.getComputedStyle(element).fontSize),
      );
  for (const element of elements)
    element.style.fontSize = `${Number(element.dataset.reviewFont) * scale}px`;
  document.getElementById("dimensions").textContent =
    `Ширина: ${documentInFrame.documentElement.clientWidth}px. Содержимое: ${documentInFrame.body.scrollWidth}px. Текст: ${scale * 100}%.`;
}
frame.addEventListener("load", update);
for (const id of ["width", "text-size"])
  document.getElementById(id).addEventListener("change", update);
