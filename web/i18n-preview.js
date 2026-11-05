import {
  createI18n,
  createGitHistory,
  createMarkdownEditor,
} from "./vendor/ag-design/index.js";
const context = createI18n({
  locale: "en",
  availableLocales: ["en", "ru", "en-XA", "ar"],
  fallbackLocale: "en",
  messages: {
    "en-XA": {
      "history.git":
        "[A deliberately expanded history heading to check wrapping and alignment]",
      "history.search":
        "[Search history with an intentionally long descriptive label]",
      "md.open": "[Open a local Markdown document]",
      "md.download": "[Download the complete Markdown document]",
    },
    ar: {
      "history.git": "سجل التغييرات",
      "history.search": "البحث في السجل",
      "md.open": "فتح المستند",
    },
  },
});
const history = createGitHistory({
  document,
  i18n: context,
  commits: [
    {
      id: "c3",
      title: "Merge the release editor",
      parents: ["c2", "c1"],
      refs: ["main"],
      author: "Alex",
      date: "2026-10-26",
    },
    {
      id: "c2",
      title: "Add language preferences",
      parents: ["c1"],
      author: "Sam",
      date: "2026-10-25",
    },
    {
      id: "c1",
      title: "Create workspace",
      parents: [],
      author: "Alex",
      date: "2026-10-24",
    },
  ],
});
const editor = createMarkdownEditor({
  document,
  i18n: context,
  label: "Draft content",
  markdown:
    "# A retained draft\n\nChanging interface language keeps this text and its undo history.",
  height: 260,
});
document.querySelector("#history").append(history.element);
document.querySelector("#editor").append(editor.element);
/** Switch only the explicit preview context; the host document and saved preferences are unaffected. */
function change() {
  context.setLocale(document.querySelector("#locale").value);
}
document.querySelector("#locale").addEventListener("change", change);
window.addEventListener(
  "pagehide",
  () => {
    history.dispose();
    editor.dispose();
    context.dispose();
  },
  { once: true },
);
