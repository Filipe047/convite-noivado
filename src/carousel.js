import "./carousel.css";

const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>'"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[char],
  );

/**
 * Markup do carrossel. Nenhuma imagem é pedida aqui: o src só é definido
 * em startPhotoCarousel(), quando o carrossel se aproxima do ecrã.
 */
export function renderPhotoCarousel(moments) {
  const total = moments.length;

  const slides = moments
    .map((moment, index) => {
      const file = moment.image.split("/").pop();
      return `<article class="gallery-slide${index === 0 ? " is-active" : ""}" data-slide="${index}" role="group" aria-roledescription="slide" aria-label="${index + 1} de ${total}" aria-hidden="${index !== 0}">
        <img class="gallery-img" data-src="${escapeHtml(moment.image)}" alt="${escapeHtml(moment.title)}" decoding="async" draggable="false" />
        <div class="gallery-placeholder"><span>Foto ${String(index + 1).padStart(2, "0")}</span><small>Adicionar imagem em<br /><b>public/gallery/${escapeHtml(file)}</b></small></div>
        <div class="gallery-caption"><strong>${escapeHtml(moment.title)}</strong><span>${escapeHtml(moment.text)}</span></div>
      </article>`;
    })
    .join("");

  const dots = moments
    .map(
      (_, index) =>
        `<button type="button" class="gallery-dot${index === 0 ? " is-active" : ""}" data-dot="${index}" aria-label="Mostrar momento ${index + 1}"${index === 0 ? ' aria-current="true"' : ""}></button>`,
    )
    .join("");

  return `<section class="moments-section section-wrap" aria-labelledby="moments-title">
    <div class="section-overline">Memórias a dois</div>
    <div class="moments-heading">
      <h2 id="moments-title">Alguns dos nossos<br /><em>momentos.</em></h2>
      <p>Um espaço reservado para fotografias que contam um pouco da nossa caminhada.</p>
    </div>
    <div class="gallery" data-carousel role="region" aria-roledescription="carrossel" aria-label="Fotografias dos noivos" tabindex="0">
      <div class="gallery-track">${slides}</div>
      <button class="gallery-arrow gallery-prev" type="button" aria-label="Momento anterior">←</button>
      <button class="gallery-arrow gallery-next" type="button" aria-label="Próximo momento">→</button>
      <div class="gallery-dots">${dots}</div>
    </div>
  </section>`;
}

export function startPhotoCarousel() {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;

  const slides = [...root.querySelectorAll("[data-slide]")];
  const dots = [...root.querySelectorAll("[data-dot]")];
  const total = slides.length;
  if (!total) return;

  const INTERVAL = 6000; // tempo entre fotos
  const FADE_MS = 900; // deve coincidir com a transição no CSS
  const NAV_LOCK_MS = 600; // evita cliques em rajada a meio do fade
  const SWIPE_PX = 40;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const idle =
    window.requestIdleCallback || ((fn) => window.setTimeout(fn, 200));

  const loaded = new Map(); // índice -> Promise<boolean>
  const holds = new Set(["offscreen"]); // motivos para o autoplay estar parado
  let current = 0;
  let navId = 0;
  let lastShow = 0;
  let autoplay = 0;
  let leaveTimer = 0;

  const wrap = (index) => (index + total) % total;

  /** Carrega e descodifica a imagem fora da thread principal (uma única vez). */
  function load(index) {
    index = wrap(index);
    if (loaded.has(index)) return loaded.get(index);

    const slide = slides[index];
    const img = slide.querySelector(".gallery-img");
    img.src = img.dataset.src;

    const ready = img.decode
      ? img.decode()
      : new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

    const promise = ready.then(
      () => {
        slide.classList.add("has-image");
        return true;
      },
      () => false, // ficheiro em falta: mantém o placeholder
    );
    loaded.set(index, promise);
    return promise;
  }

  /** Só alterna classes: o CSS anima apenas opacity/transform (GPU). */
  function show(next) {
    if (next === current) return;
    const previous = current;

    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === next);
      slide.classList.toggle("is-leaving", index === previous);
      slide.setAttribute("aria-hidden", String(index !== next));
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === next);
      if (index === next) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    // Liberta a camada da foto anterior assim que o fade termina.
    clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(
      () => slides[previous].classList.remove("is-leaving"),
      FADE_MS + 80,
    );

    current = next;
    lastShow = performance.now();
    idle(() => load(current + 1)); // pré-carrega a seguinte
  }

  /** Espera a imagem estar pronta antes de trocar: nunca mostra um "vazio". */
  async function go(index) {
    const target = wrap(index);
    if (target === current) return;
    const id = ++navId;
    await load(target);
    if (id !== navId) return; // houve navegação mais recente
    show(target);
  }

  function schedule() {
    clearTimeout(autoplay);
    autoplay = 0;
    if (holds.size || reduceMotion.matches) return;
    autoplay = window.setTimeout(async () => {
      await go(current + 1);
      schedule();
    }, INTERVAL);
  }

  function hold(reason, on) {
    if (on) holds.add(reason);
    else holds.delete(reason);
    schedule();
  }

  function userGo(index) {
    if (performance.now() - lastShow < NAV_LOCK_MS) return;
    go(index);
    schedule();
  }

  // Controlos
  root
    .querySelector(".gallery-prev")
    .addEventListener("click", () => userGo(current - 1));
  root
    .querySelector(".gallery-next")
    .addEventListener("click", () => userGo(current + 1));
  dots.forEach((dot, index) =>
    dot.addEventListener("click", () => userGo(index)),
  );
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") userGo(current - 1);
    else if (event.key === "ArrowRight") userGo(current + 1);
  });

  // Pausas: rato por cima, foco por teclado
  root.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") hold("hover", true);
  });
  root.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") hold("hover", false);
  });
  root.addEventListener("focusin", (event) => {
    if (event.target.matches(":focus-visible")) hold("focus", true);
  });
  root.addEventListener("focusout", () => hold("focus", false));

  // Swipe no telemóvel (o CSS usa touch-action: pan-y)
  const track = root.querySelector(".gallery-track");
  let startX = 0;
  let startY = 0;
  let dragging = false;

  track.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
    },
    { passive: true },
  );
  track.addEventListener("pointerup", (event) => {
    if (!dragging) return;
    dragging = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      userGo(current + (dx < 0 ? 1 : -1));
    }
  });
  track.addEventListener("pointercancel", () => {
    dragging = false;
  });

  // Poupança de CPU/bateria: para quando o separador está oculto
  document.addEventListener("visibilitychange", () =>
    hold("hidden", document.hidden),
  );
  if (reduceMotion.addEventListener)
    reduceMotion.addEventListener("change", schedule);

  // Só carrega imagens e corre o autoplay quando o carrossel está perto do ecrã
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        hold("offscreen", !entry.isIntersecting);
        if (entry.isIntersecting) {
          load(current);
          idle(() => load(current + 1));
        }
      },
      { rootMargin: "250px 0px" },
    ).observe(root);
  } else {
    holds.delete("offscreen");
    load(0);
    idle(() => load(1));
    schedule();
  }
}
