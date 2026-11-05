import {
  createAsciiBackground,
  createButton,
} from "./vendor/ag-design/index.js";

/** Draw a local recognizable planet fixture; no remote images, fonts or content are fetched. */
function planet(document) {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 280;
  if (!document.defaultView.CanvasRenderingContext2D) return canvas;
  const c = canvas.getContext("2d");
  c.fillStyle = "black";
  c.fillRect(0, 0, 480, 280);
  c.fillStyle = "white";
  for (let i = 0; i < 45; i++) {
    const x = (i * 137) % 480,
      y = (i * 73) % 280;
    c.fillRect(x, y, i % 3 === 0 ? 2 : 1, 1);
  }
  const gradient = c.createRadialGradient(210, 110, 3, 250, 150, 85);
  gradient.addColorStop(0, "white");
  gradient.addColorStop(1, "#181818");
  c.fillStyle = gradient;
  c.beginPath();
  c.arc(250, 140, 72, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#bcbcbc";
  c.lineWidth = 9;
  c.beginPath();
  c.ellipse(250, 140, 133, 24, -0.3, 0, Math.PI * 2);
  c.stroke();
  return canvas;
}

/** Demonstrate host-owned composition and text streaming controls separately from the decorative reusable layer. */
export function buildAsciiSample() {
  const document = globalThis.document,
    element = document.createElement("section"),
    stage = document.createElement("div"),
    content = document.createElement("div"),
    controls = document.createElement("div"),
    status = document.createElement("output");
  element.className = "ascii-sample";
  stage.className = "ascii-sample__stage";
  content.className = "ascii-sample__content";
  controls.className = "ascii-sample__controls";
  status.className = "ascii-sample__status";
  const heading = document.createElement("h3"),
    copy = document.createElement("p");
  heading.textContent = "Смыслы в движении";
  copy.textContent =
    "Паттерны, изображения, видео и поток текста — в палитре вашего сайта.";
  content.append(heading, copy);
  const names = {
    playing: "Анимация",
    paused: "Пауза",
    still: "Статичный кадр",
    "reduced-motion": "Движение отключено системой",
    offscreen: "Вне экрана",
    hidden: "Скрытая вкладка",
    detached: "Ожидает размещения",
    error: "Медиа недоступно",
    "playback-blocked": "Нажмите «Продолжить» для видео",
    disposed: "Остановлено",
  };
  let video = null,
    disposed = false;
  const background = createAsciiBackground({
    document,
    onState: (state) => {
      status.textContent = names[state] || state;
      if (video) {
        if (["playing", "still"].includes(state))
          void video.play().catch(() => {});
        else video.pause();
      }
    },
  });
  stage.append(background.element, content);
  const mode = document.createElement("select");
  mode.setAttribute("aria-label", "Содержимое ASCII-фона");
  for (const [value, label] of [
    ["flow", "Плавный шум"],
    ["rain", "Символьный дождь"],
    ["noise", "Шум"],
    ["image", "Изображение"],
    ["video", "Видео"],
    ["text", "Поток текста"],
  ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    mode.append(option);
  }
  const effect = document.createElement("select");
  effect.setAttribute("aria-label", "Анимация изображения");
  for (const [value, label] of [
    ["none", "Без эффекта"],
    ["wave", "Волна"],
    ["scan", "Сканирование"],
    ["reveal", "Проявление"],
  ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    effect.append(option);
  }
  effect.disabled = true;
  const textEffect = document.createElement("select");
  textEffect.setAttribute("aria-label", "Эффект бегущей строки");
  textEffect.hidden = true;
  for (const [value, label] of [
    ["shimmer", "Перелив"],
    ["wave", "Волна и перелив"],
    ["none", "Без перелива"],
  ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    textEffect.append(option);
  }
  const textWeight = document.createElement("select");
  textWeight.setAttribute("aria-label", "Толщина ASCII-букв");
  textWeight.hidden = true;
  for (const [value, label] of [
    ["auto", "Авто · толщина букв"],
    ["thin", "Тонкие буквы"],
    ["regular", "Обычные буквы"],
    ["bold", "Плотные буквы"],
  ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    textWeight.append(option);
  }
  const changeTextWeight = () =>
    background.update({ textWeight: textWeight.value });
  textWeight.addEventListener("change", changeTextWeight);
  const changeTextEffect = () =>
    background.update({ textEffect: textEffect.value });
  textEffect.addEventListener("change", changeTextEffect);
  const pause = createButton({
    document,
    label: "Пауза",
    variant: "quiet",
    onClick: () => {
      if (background.playbackRequested) background.pause();
      else background.play();
      pause.textContent = background.playbackRequested ? "Пауза" : "Продолжить";
      pause.setAttribute("aria-pressed", String(!background.playbackRequested));
    },
  });
  pause.setAttribute("aria-pressed", "false");
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png,image/jpeg,image/webp,video/mp4,video/webm";
  input.setAttribute("aria-label", "Локальное изображение или видео");
  const text = document.createElement("input");
  text.type = "text";
  text.maxLength = 512;
  text.placeholder = "Новый фрагмент текста";
  text.setAttribute("aria-label", "Фрагмент потока");
  text.hidden = true;
  const append = createButton({
    document,
    label: "Добавить в поток",
    variant: "quiet",
    onClick: () => {
      background.appendText("  " + text.value);
      text.value = "";
    },
  });
  append.hidden = true;
  const cleanupVideo = () => {
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      video = null;
    }
  };
  const changed = () => {
    cleanupVideo();
    stage.dataset.mode = ["image", "video"].includes(mode.value)
      ? "media"
      : mode.value;
    effect.disabled = !["image", "video"].includes(mode.value);
    text.hidden =
      append.hidden =
      textEffect.hidden =
      textWeight.hidden =
        mode.value !== "text";
    if (mode.value === "image") background.setSource(planet(document));
    else if (mode.value === "video") {
      video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.className = "ag-ascii-background__decoder";
      stage.append(video);
      video.src = "/media/ascii-orbit.mp4";
      video.addEventListener(
        "loadeddata",
        () => {
          if (!disposed && video) {
            background.setSource(video);
            if (background.playbackRequested)
              void video.play().catch(() => {
                status.textContent = "Нажмите «Продолжить» для видео";
              });
          }
        },
        { once: true },
      );
      background.setSource(video);
      video.addEventListener(
        "error",
        () => {
          if (!disposed) {
            background.pause();
            status.textContent = "Локальное видео не поддерживается браузером";
          }
        },
        { once: true },
      );
      video.load();
    } else if (mode.value === "text")
      background.setText(
        "AG DESIGN  ·  Идеи превращаются в интерфейсы  ·  Локальные данные, живой характер  ·  ",
      );
    else background.setPattern(mode.value);
  };
  const animate = () => background.update({ animation: effect.value });
  const local = () => {
    const file = input.files?.[0];
    if (!file) return;
    cleanupVideo();
    stage.dataset.mode = "media";
    mode.value = file.type.startsWith("video/") ? "video" : "image";
    effect.disabled = false;
    text.hidden = append.hidden = textEffect.hidden = textWeight.hidden = true;
    void background.setFile(file).catch(() => {
      if (!disposed) status.textContent = "Не удалось открыть локальное медиа";
    });
  };
  mode.addEventListener("change", changed);
  effect.addEventListener("change", animate);
  input.addEventListener("change", local);
  controls.append(
    mode,
    effect,
    textEffect,
    textWeight,
    pause,
    input,
    text,
    append,
  );
  element.append(stage, controls, status);
  return {
    element,
    interact: () => background.setText("Поток локального текста · "),
    dispose() {
      disposed = true;
      mode.removeEventListener("change", changed);
      effect.removeEventListener("change", animate);
      textEffect.removeEventListener("change", changeTextEffect);
      textWeight.removeEventListener("change", changeTextWeight);
      input.removeEventListener("change", local);
      cleanupVideo();
      background.dispose();
      element.remove();
    },
  };
}
