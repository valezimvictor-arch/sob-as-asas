// GET /api/cron-presentes-agendados — roda diariamente (configurar em vercel.json)
//
// Quando alguém compra um presente com `data_envio` no futuro, o webhook insere
// o presente em status='pago' mas NÃO envia email. Este cron varre diariamente
// os presentes pagos cuja data_envio chegou (<= hoje) e dispara o email.

import { supabase } from './_lib/supabase.js';
import { enviarEmail } from './_lib/resend.js';
import { emailPresenteHtml } from './_lib/presenteEmail.js';

export default async function handler(req, res) {
  // Vercel Cron envia GET; também aceitamos POST pra teste manual
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  // Proteção opcional via CRON_SECRET (configurar na Vercel)
  if (process.env.CRON_SECRET) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: 'Não autorizado' });
    }
  }

  try {
    const hojeISO = new Date().toISOString().slice(0, 10);

    // Busca presentes pagos cuja data_envio chegou e ainda não foram enviados
    const { data: pendentes, error } = await supabase
      .from('presentes')
      .select('codigo, de_nome, para_nome, para_email, mensagem')
      .eq('status', 'pago')
      .lte('data_envio', hojeISO)
      .limit(50);  // batch razoável

    if (error) {
      console.error('[cron-presentes]', error.message);
      return res.status(500).json({ ok: false, error: error.message });
    }

    if (!pendentes || pendentes.length === 0) {
      return res.status(200).json({ ok: true, enviados: 0 });
    }

    let enviados = 0;
    let falhas = 0;
    for (const p of pendentes) {
      if (!p.para_email) continue;
      const link = `https://sobasasas.com.br/resgatar?codigo=${encodeURIComponent(p.codigo)}`;
      try {
        await enviarEmail({
          to: p.para_email,
          subject: `${p.de_nome} preparou um presente pra você 🕊️`,
          html: emailPresenteHtml({
            paraNome: p.para_nome,
            deNome: p.de_nome,
            mensagem: p.mensagem,
            codigo: p.codigo,
            link,
          }),
          replyTo: 'contato@sobasasas.com.br',
        });
        await supabase
          .from('presentes')
          .update({ status: 'email_enviado', email_enviado_em: new Date().toISOString() })
          .eq('codigo', p.codigo);
        enviados++;
      } catch (e) {
        console.error(`[cron-presentes] falha ao enviar ${p.codigo}:`, e?.message);
        falhas++;
      }
    }

    return res.status(200).json({ ok: true, enviados, falhas, total_pendente: pendentes.length });
  } catch (e) {
    console.error('[cron-presentes]', e?.message);
    return res.status(500).json({ ok: false, error: 'Erro no cron de presentes' });
  }
}
