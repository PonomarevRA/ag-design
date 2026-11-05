/* Browser fallback remains until native adapters confirm identity/toolbar capability. */
(() => {
  try {
    if (new URLSearchParams(location.search).get("desktop") === "1")
      sessionStorage.setItem("ag-design-desktop", "1");
    if (sessionStorage.getItem("ag-design-desktop") === "1")
      document.documentElement.classList.add("native-shell");
    const theme = localStorage.getItem("ag-design-theme");
    if (["auto", "light", "dark"].includes(theme))
      document.documentElement.dataset.theme = theme;
  } catch {
    /* A private WebView keeps the usable browser fallback. */
  }
})();
