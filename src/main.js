import { CONFIG } from "./config.js";
import { renderPhotoCarousel, startPhotoCarousel } from "./carousel.js";
import "./styles.css";

const DEMO_GUESTS = [
  {
    timestamp: "2026-10-25T10:30:00.000Z",
    name: "João Manuel",
    phone: "+244 923 000 000",
    status: "confirmed",
    note: "Com alegria!",
  },
  {
    timestamp: "2026-10-25T12:15:00.000Z",
    name: "Ana Paula",
    phone: "+244 924 000 000",
    status: "confirmed",
    note: "",
  },
];

const PHOTO_MOMENTS = [
  {
    image:
      "https://res.cloudinary.com/jmnylxfb/image/upload/f_auto,q_auto/moment-01",
    title: "Um começo bonito",
    text: "Onde a nossa história começou.",
  },
  {
    image: "/gallery/moment-02.jpg",
    title: "Caminhando juntos",
    text: "Cada passo torna o nosso amor mais forte.",
  },
  {
    image: "/gallery/moment-03.jpg",
    title: "O nosso momento",
    text: "Pequenos instantes, grandes memórias.",
  },
  {
    image: "/gallery/moment-04.jpg",
    title: "Para Sempre",
    text: "Hoje, amanhã e por toda a vida.",
  },
  {
    image: "/gallery/moment-05.jpeg",
    title: "O melhor de nós",
    text: "Ao teu lado, a vida ganha outro sentido.",
  },
  {
    image: "/gallery/moment-06.jpg",
    title: "Um amor abençoado",
    text: "Guiados por Deus, seguimos o mesmo caminho.",
  },
];

const app = document.querySelector("#app");
const isAdmin =
  window.location.pathname === "/admin" ||
  window.location.pathname.endsWith("/admin.html");

const params = new URLSearchParams(window.location.search);
const token = params.get(CONFIG.ADMIN_TOKEN_PARAM);

const formatNumber = (value) => String(Math.max(0, value)).padStart(2, "0");
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

function demoReadAll() {
  const stored = JSON.parse(localStorage.getItem("filipe-rsvp") || "[]");
  const saved = Array.isArray(stored) ? stored : [];
  return [...DEMO_GUESTS, ...saved];
}

async function apiRsvp(payload) {
  if (!CONFIG.SHEETS_ENDPOINT) {
    const saved = JSON.parse(localStorage.getItem("filipe-rsvp") || "[]");
    const entry = {
      ...payload,
      status: "confirmed",
      timestamp: new Date().toISOString(),
    };
    saved.push(entry);
    localStorage.setItem("filipe-rsvp", JSON.stringify(saved));
    return entry;
  }
  const response = await fetch(CONFIG.SHEETS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || result.ok === false)
    throw new Error(result.error || "Não foi possível guardar a resposta.");
  return result.guest;
}

async function apiAdmin() {
  if (!CONFIG.SHEETS_ENDPOINT) return demoReadAll();
  const response = await fetch(
    `${CONFIG.SHEETS_ENDPOINT}?action=admin&token=${encodeURIComponent(token || "")}`,
  );
  const payload = await response.json();
  if (!response.ok || payload.ok === false)
    throw new Error(payload.error || "Acesso administrativo não autorizado.");
  return payload.guests || [];
}

function shell(content, admin = false) {
  return `<div class="page-shell ${admin ? "admin-shell" : ""}">
      <header class="site-header">
        <a class="wordmark" href="/" aria-label="Filipe e Mayika — início"><span>F</span><span class="amp">&</span><span>M</span></a>
        <div class="header-note">${admin ? "Área reservada" : "Um passo de fé, amor e compromisso"}</div>
        ${admin ? '<a class="back-link" href="/">Voltar ao convite <i class="fa-solid fa-square-arrow-up-right"></i></a>' : ""}
      </header>
      ${content}
      <footer class="site-footer"><span>Filipe & Mayika</span><span>28.11.2026 · Palanca</span></footer>
    </div>`;
}

function countdownMarkup() {
  return `<div class="countdown" aria-label="Contagem regressiva para o noivado" data-countdown>
      <div><strong data-unit="days">00</strong><span>dias</span></div><i>:</i>
      <div><strong data-unit="hours">00</strong><span>horas</span></div><i>:</i>
      <div><strong data-unit="minutes">00</strong><span>minutos</span></div><i>:</i>
      <div><strong data-unit="seconds">00</strong><span>segundos</span></div>
    </div>`;
}

function startCountdown() {
  const root = document.querySelector("[data-countdown]");
  if (!root) return;
  const target = new Date(CONFIG.EVENT_DATE).getTime();
  const tick = () => {
    const delta = target - Date.now();
    if (delta <= 0) {
      root.innerHTML =
        '<p class="event-live">O grande momento chegou. Até já!</p>';
      return;
    }
    const values = {
      days: Math.floor(delta / 86400000),
      hours: Math.floor(delta / 3600000) % 24,
      minutes: Math.floor(delta / 60000) % 60,
      seconds: Math.floor(delta / 1000) % 60,
    };
    Object.entries(values).forEach(([unit, value]) => {
      const node = root.querySelector(`[data-unit="${unit}"]`);
      if (node) node.textContent = formatNumber(value);
    });
  };
  tick();
  setInterval(tick, 1000);
}

function renderHome() {
  app.innerHTML = shell(`<main>
      <section class="hero section-wrap">
        <div class="eyebrow"><span class="dot"></span> Convite especial · 2026</div>
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="kicker">Com alegria e gratidão a Deus,</p>
            <h1>O nosso<br /><em>noivado.</em></h1>
            <p class="hero-intro">Convidamos você para celebrar connosco um momento muito especial.</p>
            <a class="primary-button" href="/confirmar.html#confirmar">Confirmar presença <span><i class="fa-solid fa-square-arrow-up-right"></i></span></a>
          </div>
        <div class="hero-card" aria-label="Detalhes do evento">
    <div class="monogram">Filipe <span>&</span> Mayika</div>
    <div class="rule"></div>
    <p class="card-label">Sábado</p><p class="event-date">28 <small>de</small> Novembro</p><p class="event-year">2026 · às 16h00</p>
    <a class="location" href="https://maps.app.goo.gl/wyxcRXd3PfjaYABQ6" target="_blank" rel="noopener noreferrer" aria-label="Abrir localização no Google Maps">
      <span class="pin"><i class="fa-solid fa-map-pin"></i></span>
      <span>Palanca, Rua F<br />Quintal em frente ao campo<br /><small>Próximo da Igreja IEBA</small><br /><small class="map-cta">Ver no mapa <i class="fa-solid fa-square-arrow-up-right"></i></small></span>
    </a>
  </div>
        </div>
      </section>
      <section class="timer-section section-wrap"><div class="section-overline">A contagem começou</div>${countdownMarkup()}<p class="timer-note">Até celebrarmos este passo de fé, amor e compromisso.</p></section>
      <section class="invite-section section-wrap"><div class="section-overline">Uma presença que importa</div><div class="invite-grid"><h2>O seu lugar<br /><em>é connosco.</em></h2><div><p>Este dia será ainda mais bonito com as pessoas que amamos por perto. Use o link “Confirmar presença” no seu convite em PDF.</p><p class="small-note">Basta informar o seu nome, telefone e, se quiser, deixar uma mensagem.</p></div></div></section>
     ${renderPhotoCarousel(PHOTO_MOMENTS)}
      <section id="confirmar" class="rsvp-section section-wrap"><div class="rsvp-card"><div class="rsvp-title"><div class="section-overline">RSVP</div><h2>Vamos contar<br /><em>com você?</em></h2><p class="rsvp-subtitle">Preencha os seus dados para confirmar a presença.</p></div><div id="rsvp-content"></div></div></section>
    </main>`);
  startCountdown();
  startPhotoCarousel();
  const content = document.querySelector("#rsvp-content");
  renderRsvpForm(content);
  if (window.location.hash === "#confirmar")
    content.scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderRsvpForm(container) {
  container.innerHTML = `<form id="rsvp-form" class="rsvp-form"><p class="form-intro">Será uma alegria saber que estará connosco. Deixe os seus dados abaixo.</p><label class="field-label" for="name">Nome completo <input id="name" name="name" type="text" autocomplete="name" required placeholder="Digite o seu nome" /></label><label class="field-label" for="phone">Telefone <input id="phone" name="phone" type="tel" autocomplete="tel" required placeholder="Digite o seu telefone" /></label><label class="field-label" for="note">Mensagem <textarea id="note" name="note" rows="3" placeholder="Uma mensagem para os noivos (opcional)"></textarea></label><button class="primary-button full-button" type="submit">Confirmar presença <span><i class="fa-solid fa-square-arrow-up-right"></i></span></button><div id="form-feedback" aria-live="polite"></div></form>`;
  document
    .querySelector("#rsvp-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const feedback = form.querySelector("#form-feedback");
      if (!form.reportValidity()) return;
      const button = form.querySelector("button");
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span> A guardar…';
      try {
        const data = {
          name: form.name.value.trim(),
          phone: form.phone.value.trim(),
          note: form.note.value.trim(),
        };
        await apiRsvp(data);
        fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).catch(() => {});
        
        feedback.innerHTML =
          '<div class="success-message" role="status"><strong>Presença confirmada.</strong><p>Ficamos muito felizes por contar consigo. Até ao grande dia!</p></div>';
      } catch (error) {
        feedback.innerHTML = `<p class="form-error" role="alert">${escapeHtml(error.message)} Tente novamente.</p>`;
      }
      button.disabled = false;
      button.innerHTML = `Confirmar presença <span><i class="fa-solid fa-square-arrow-up-right"></i></span>`;
    });
}

async function renderAdmin() {
  app.innerHTML = shell(
    `<main class="admin-main section-wrap"><div class="eyebrow"><span class="dot"></span> Visão geral · RSVP</div><div class="admin-heading"><div><h1>Presenças<br /><em>confirmadas.</em></h1><p>Uma vista simples para acompanhar quem estará connosco.</p></div><button class="secondary-button" id="refresh">Atualizar ↻</button></div><div id="admin-content"><div class="loading-state"><span class="spinner"></span><p>A carregar respostas…</p></div></div></main>`,
    true,
  );
  document.querySelector("#refresh").addEventListener("click", loadAdmin);
  await loadAdmin();
}

async function loadAdmin() {
  const target = document.querySelector("#admin-content");
  target.innerHTML =
    '<div class="loading-state"><span class="spinner"></span><p>A carregar respostas…</p></div>';
  try {
    const guests = await apiAdmin();
    const confirmed = guests.filter((guest) => guest.status === "confirmed");
    target.innerHTML = `<div class="stats"><div><strong>${confirmed.length}</strong><span>confirmados</span></div><div><strong>${guests.length}</strong><span>registos</span></div></div><div class="table-card"><div class="table-heading"><h2>Lista de convidados</h2><span>${guests.length} respostas</span></div><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Telefone</th><th>Estado</th><th>Mensagem</th><th>Data</th></tr></thead><tbody>${guests.map((guest) => `<tr><td><strong>${escapeHtml(guest.name)}</strong></td><td>${escapeHtml(guest.phone || "—")}</td><td><span class="status status-confirmed">Confirmado</span></td><td class="note-cell">${escapeHtml(guest.note || "—")}</td><td>${guest.timestamp ? new Date(guest.timestamp).toLocaleDateString("pt-PT") : "—"}</td></tr>`).join("")}</tbody></table></div></div>`;
  } catch (error) {
    target.innerHTML = `<div class="message error-message" role="alert"><strong>Não foi possível carregar a área administrativa.</strong><p>${escapeHtml(error.message)}</p><p class="small-note">Verifique o token e a URL do Apps Script.</p></div>`;
  }
}

if (isAdmin) renderAdmin();
else renderHome();
