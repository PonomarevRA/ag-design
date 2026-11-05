/** Render a small Markdown subset with text nodes only: HTML, URLs and media remain inert text. */
export function renderConversationText(element, value, markdown = false) {
  const document = element.ownerDocument;
  if (!markdown) {
    if (
      element.childNodes.length === 1 &&
      element.firstChild.nodeType === 3 &&
      value.startsWith(element.firstChild.data)
    )
      element.firstChild.appendData(
        value.slice(element.firstChild.data.length),
      );
    else element.textContent = value;
    return;
  }
  const fragment = document.createDocumentFragment();
  let code = null,
    buffer = [];
  /** Inline spans do not interpret supplied attributes or link destinations. */
  function inline(parent, text) {
    for (const token of text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g)) {
      if (token.startsWith("`") && token.endsWith("`")) {
        const node = document.createElement("code");
        node.textContent = token.slice(1, -1);
        parent.append(node);
      } else if (token.startsWith("**") && token.endsWith("**")) {
        const node = document.createElement("strong");
        node.textContent = token.slice(2, -2);
        parent.append(node);
      } else parent.append(document.createTextNode(token));
    }
  }
  for (const line of value.split("\n")) {
    if (line.startsWith("```")) {
      if (code) {
        code.textContent = buffer.join("\n");
        fragment.append(code);
        code = null;
        buffer = [];
      } else code = document.createElement("pre");
    } else if (code) buffer.push(line);
    else {
      const paragraph = document.createElement("p");
      if (/^#{1,3} /.test(line)) {
        const strong = document.createElement("strong");
        inline(strong, line.replace(/^#{1,3} /, ""));
        paragraph.append(strong);
      } else inline(paragraph, line);
      fragment.append(paragraph);
    }
  }
  if (code) {
    code.textContent = buffer.join("\n");
    fragment.append(code);
  }
  element.replaceChildren(fragment);
}
