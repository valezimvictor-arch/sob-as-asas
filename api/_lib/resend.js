// Cliente Resend via HTTP — não exige dependência npm, usa fetch nativo.
// Espera RESEND_API_KEY na env. RESEND_FROM = "Sob as Asas <contato@sobasasas.com.br>".

const FROM_DEFAULT = process.env.RESEND_FROM || 'Sob as Asas <contato@sobasasas.com.br>';

export async function enviarEmail({ to, subject, html, replyTo, from, headers }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY ausente');
  }
  if (!to || !subject || !html) {
    throw new Error('to, subject e html são obrigatórios');
  }
  const body = {
    from: from || FROM_DEFAULT,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (replyTo) body.reply_to = replyTo;
  if (headers) body.headers = headers;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(j.message || `Resend HTTP ${r.status}`);
    err.status = r.status; err.body = j;
    throw err;
  }
  return j;
}
