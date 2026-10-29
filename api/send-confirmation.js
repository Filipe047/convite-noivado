import nodemailer from "nodemailer";

const esc = (v = "") =>
  String(v).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[c]);

const NAVY = "#05124f";
const LIME = "#d6fb78";
const MAPS = "https://maps.app.goo.gl/wyxcRXd3PfjaYABQ6";

const label = `font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${NAVY};margin:0 0 4px;`;
const value = `font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:${NAVY};margin:0 0 18px;`;

function template({ heading, intro, name, phone, note, date }) {
  const row = (l, v) => `<p style="${label}">${l}</p><p style="${value}">${esc(v || "—")}</p>`;
  return `<!doctype html><html lang="pt"><body style="margin:0;padding:0;background:#e9ffe0;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9ffe0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">

  <!-- Cabeçalho -->
  <tr><td style="background:${NAVY};padding:48px 36px 28px;">
    <p style="margin:0 0 70px;text-align:right;"><span style="background:${LIME};color:${NAVY};padding:8px 14px;font-size:14px;font-weight:700;">F &amp; M</span></p>
    <p style="margin:0;font-size:26px;letter-spacing:1px;color:#ffffff;text-transform:uppercase;border-bottom:3px solid #ffffff;padding-bottom:10px;display:inline-block;">${esc(heading)}</p>
  </td></tr>

  <!-- Mensagem -->
  <tr><td style="padding:34px 36px;color:${NAVY};font-size:14px;line-height:1.7;">
    <p style="margin:0 0 14px;">${intro}</p>
    <p style="margin:0;">Veja abaixo os dados do convidado e os detalhes do evento.</p>
  </td></tr>

  <!-- Os seus dados -->
  <tr><td style="background:${LIME};padding:34px 36px 16px;">
    <p style="margin:0 0 28px;font-size:18px;font-weight:700;letter-spacing:1px;color:${NAVY};text-transform:uppercase;">Dados do convidado</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="top" width="50%">${row("Nome", name)}${row("Telefone", phone)}</td>
      <td valign="top" width="50%">${row("Estado", "Presença confirmada")}${row("Data da resposta", date)}</td>
    </tr></table>
    ${note ? row("Mensagem", note) : ""}
  </td></tr>

  <!-- Detalhes do evento -->
  <tr><td style="padding:34px 36px 10px;">
    <p style="margin:0 0 20px;font-size:18px;font-weight:700;letter-spacing:1px;color:${NAVY};text-transform:uppercase;">Detalhes do evento</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${NAVY};">
      <tr><td style="background:${NAVY};color:#fff;padding:14px 12px;font-weight:700;letter-spacing:1px;font-size:12px;">EVENTO</td>
          <td style="background:${NAVY};color:#fff;padding:14px 12px;font-weight:700;letter-spacing:1px;font-size:12px;">DATA</td>
          <td style="background:${NAVY};color:#fff;padding:14px 12px;font-weight:700;letter-spacing:1px;font-size:12px;">HORA</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid ${NAVY};">Noivado</td>
          <td style="padding:16px 12px;border-bottom:1px solid ${NAVY};">28 Nov 2026</td>
          <td style="padding:16px 12px;border-bottom:1px solid ${NAVY};">16h00</td></tr>
    </table>
    <p style="margin:22px 0 4px;${label.replace("margin:0 0 4px;", "")}">Local</p>
    <p style="margin:0 0 22px;font-size:13px;line-height:1.7;color:${NAVY};">Palanca, Rua F<br/>Quintal em frente ao campo<br/>Próximo da Igreja IEBA</p>
    <p style="margin:0 0 40px;"><a href="${MAPS}" style="background:${NAVY};color:#ffffff;text-decoration:none;padding:14px 26px;font-size:13px;font-weight:700;letter-spacing:1px;display:inline-block;">VER NO MAPA</a></p>
  </td></tr>

  <tr><td style="background:${NAVY};padding:22px 36px;color:#ffffff;font-size:12px;letter-spacing:1px;">
    Filipe &amp; Mayika &nbsp;·&nbsp; 28.11.2026 &nbsp;·&nbsp; Palanca
  </td></tr>
</table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método não permitido" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const name = String(body.name || "").trim().slice(0, 120);
  const phone = String(body.phone || "").trim().slice(0, 40);
  const note = String(body.note || "").trim().slice(0, 500);

  if (!name || !phone) return res.status(400).json({ ok: false, error: "Dados em falta." });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD)
    return res.status(500).json({ ok: false, error: "SMTP não configurado." });

  // Destinatários: apenas os noivos (pode ser sobreposto por NOTIFY_EMAIL, separado por vírgulas)
  const recipients = (process.env.NOTIFY_EMAIL || "filipycr20@gmail.com","mayikamakasi@gmail.com")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  const date = new Date().toLocaleString("pt-PT", { timeZone: "Africa/Luanda", dateStyle: "short", timeStyle: "short" });

  try {
    await transporter.sendMail({
      from: `"Convite Noivado" <${SMTP_USER}>`,
      to: recipients,
      subject: `Nova confirmação: ${name}`,
      html: template({
        heading: "Nova confirmação",
        intro: `<strong>${esc(name)}</strong> acabou de confirmar presença no vosso noivado.`,
        name, phone, note, date,
      }),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar email:", err.message);
    return res.status(502).json({ ok: false, error: "Falha ao enviar email." });
  }
}