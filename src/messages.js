import "./messages.css";

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

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "♥";

export function renderMessagesCarousel() {
  return `<section id="mensagens" class="messages-section section-wrap" aria-labelledby="messages-title">
    <div class="section-overline">Palavras de carinho</div>
    <div class="moments-heading">
      <h2 id="messages-title">Mensagens de<br /><em>quem nos ama.</em></h2>
      <p>Recados deixados pelos nossos convidados. Cada palavra faz este dia ainda mais especial.</p>
    </div>
    <div class="msg-carousel" data-msg-carousel>
      <div class="msg-track" data-msg-track tabindex="0" role="region" aria-roledescription="carrossel" aria-label="Mensagens dos convidados"></div>
      <div class="msg-controls" data-msg-controls>
        <button type="button" class="msg-arrow" data-msg-prev aria-label="Mensagem anterior"><span class="fa-solid fa-chevron-left"></span></button>
        <button type="button" class="msg-arrow" data-msg-next aria-label="Próxima mensagem"><span class="fa-solid fa-chevron-right"></span></button>
      </div>
    </div>
  </section>`;
}

export function startMessagesCarousel(fetchMessages) {
  const root = document.querySelector("[data-msg-carousel]");
  if (!root) return { add() {} };

  const track = root.querySelector("[data-msg-track]");
  const controls = root.querySelector("[data-msg-controls]");
  const INTERVAL = 5000;
  const MAX = 30;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const holds = new Set(["offscreen"]);
  let messages = [];
  let timer = 0;

  const cardMarkup = (m) => `<article class="msg-card">
      <span class="msg-quote" aria-hidden="true">“</span>
      <p class="msg-text">${escapeHtml(m.note)}</p>
      <div class="msg-author"><span class="msg-avatar" aria-hidden="true">${escapeHtml(initials(m.name))}</span><strong>${escapeHtml(m.name)}</strong></div>
    </article>`;

  function render() {
    if (!messages.length) {
      track.innerHTML = `<article class="msg-card msg-empty"><span class="msg-quote" aria-hidden="true">“</span><p class="msg-text">Ainda não há mensagens. Seja a primeira pessoa a deixar uma palavra de carinho ao confirmar a sua presença.</p><a class="text-link" href="#confirmar">Deixar mensagem</a></article>`;
    } else {
      track.innerHTML = messages.slice(0, MAX).map(cardMarkup).join("");
    }
    track.scrollTo({ left: 0 });
    requestAnimationFrame(() => {
      controls.hidden = track.scrollWidth <= track.clientWidth + 4;
    });
  }

  function step(dir) {
    const card = track.querySelector(".msg-card");
    if (!card) return;
    const amount = card.getBoundingClientRect().width + 16;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const atStart = track.scrollLeft <= 4;
    if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir < 0 && atStart)
      track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
    else track.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  function schedule() {
    clearTimeout(timer);
    timer = 0;
    if (holds.size || reduceMotion.matches || controls.hidden) return;
    timer = window.setTimeout(() => {
      step(1);
      schedule();
    }, INTERVAL);
  }

  function hold(reason, on) {
    if (on) holds.add(reason);
    else holds.delete(reason);
    schedule();
  }

  root.querySelector("[data-msg-prev]").addEventListener("click", () => {
    step(-1);
    schedule();
  });
  root.querySelector("[data-msg-next]").addEventListener("click", () => {
    step(1);
    schedule();
  });
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });

  root.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") hold("hover", true);
  });
  root.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse") hold("hover", false);
  });
  root.addEventListener("touchstart", () => hold("touch", true), { passive: true });
  root.addEventListener("touchend", () => setTimeout(() => hold("touch", false), 4000), { passive: true });
  root.addEventListener("focusin", () => hold("focus", true));
  root.addEventListener("focusout", () => hold("focus", false));
  document.addEventListener("visibilitychange", () => hold("hidden", document.hidden));
  window.addEventListener("resize", () => {
    controls.hidden = track.scrollWidth <= track.clientWidth + 4;
    schedule();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => hold("offscreen", !entries[entries.length - 1].isIntersecting),
      { rootMargin: "100px 0px" },
    ).observe(root);
  } else {
    holds.delete("offscreen");
  }

  // Carrega as mensagens
  render();
  Promise.resolve(fetchMessages())
    .then((list) => {
      messages = (list || [])
        .filter((g) => g && g.note && String(g.note).trim())
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      render();
      schedule();
    })
    .catch(() => {});

  return {
    /** Chamado quando um convidado acaba de enviar uma mensagem. */
    add(message) {
      if (!message || !message.note) return;
      messages.unshift(message);
      render();
      schedule();
    },
  };
}