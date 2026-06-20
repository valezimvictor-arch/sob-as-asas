// POST /api/tempo-de-graca
// Body: { userId, email, motivo }
// Envia email pra equipe (contato@sobasasas.com.br) com a solicitação de
// 30 dias de cortesia. Não tem rejeição automática — postura editorial:
// "quem precisa, recebe". A equipe responde manualmente liberando o plano
// cortesia via /admin → Usuários.
//
// Sem julgamento, sem comprovação. É o trato com os anjos.

import { enviarEmail } from './_lib/resend.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, email, motivo } = req.body || {};
  if (!email || !/.+@.+\..+/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Email obrigatório.' });
  }
  // Limites anti-DoS
  const motivoLimpo = (motivo || '').toString().slice(0, 1000);

  try {
    await enviarEmail({
      to: 'contato@sobasasas.com.br',
      subject: '🪽 Pedido de Tempo de Graça — ' + email,
      html: `
        <div style="font-family:-apple-system,sans-serif; max-width:560px; margin:0 auto; padding:20px; color:#2C2C2A">
          <h2 style="color:#BA7517; font-family:Georgia,serif; font-weight:400">Tempo de Graça solicitado</h2>
          <p>Um usuário pediu 30 dias de cortesia. Sem julgamento, sem comprovação — libere via <a href="https://sobasasas.com.br/admin">/admin → Usuários</a>, mudando o plano pra <strong>cortesia</strong>.</p>
          <table style="margin-top:18px; font-size:14px; line-height:1.7">
            <tr><td style="color:#7C4E0F; padding-right:14px"><strong>Email:</strong></td><td>${escapeHtml(email)}</td></tr>
            <tr><td style="color:#7C4E0F; padding-right:14px"><strong>User ID:</strong></td><td>${escapeHtml(userId || '(não logado)')}</td></tr>
            <tr><td style="color:#7C4E0F; padding-right:14px; vertical-align:top"><strong>Motivo:</strong></td><td>${motivoLimpo ? escapeHtml(motivoLimpo).replace(/\n/g,'<br>') : '<em>(não informado)</em>'}</td></tr>
          </table>
          <p style="margin-top:24px; padding:12px 16px; background:#FAF3E4; border-radius:10px; font-size:13px; color:#7C4E0F; font-style:italic">"Quem precisa, recebe. Esse é o trato com os anjos."</p>
          <p style="margin-top:16px; font-size:12px; color:#5F5E5A">Responda ao usuário em até 48h confirmando a liberação.</p>
        </div>
      `,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[tempo-de-graca]', e?.message);
    return res.status(500).json({ ok: false, error: 'Falha ao enviar pedido. Tente em alguns segundos.' });
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
