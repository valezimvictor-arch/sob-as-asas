// GET /api/cron-reengagement — re-engaja usuários que não voltaram.
// Agendado em vercel.json: ter/sex 17h (BRT ~14:00 UTC já registrado como 17 UTC).
//
// Regras:
//   - Usuário tem perfil em `users` (passou pelo onboarding)
//   - NÃO abre o app há >=3 dias (sem registro em saa_streak_last persistido
//     — usamos last_seen em users; se sua tabela não tem essa coluna, o cron
//     simplesmente envia para todos os push_subscriptions cujo user_id tem
//     perfil e foi criado há >=3 dias e <=30 dias)
//   - Tem subscription de push válida
//
// Mensagens variadas (3 versões alternadas para não ficar repetitivo).

import { supabase } from './_lib/supabase.js';
import { adminKeyValida } from './_lib/adminAuth.js';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:contato@sobasasas.com.br',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const MENSAGENS = [
  { title: '🕊️ Seu anjo sente sua falta', body: 'Volte por um minuto. Só um. Ele já espera.' },
  { title: '✨ Tem uma mensagem te esperando', body: 'Abra o app — seu anjo tem algo pra hoje.' },
  { title: '🕯️ Uma vela acesa por você', body: 'Mesmo quando você esquece, ele lembra. Volte sob as asas.' },
];

function pickMensagem(i){ return MENSAGENS[i % MENSAGENS.length]; }

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = adminKeyValida(req);
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(200).json({ ok: true, skipped: 'VAPID não configurado' });
  }

  const corteRecente = new Date(Date.now() - 3 * 86400000).toISOString();
  const corteAntigo  = new Date(Date.now() - 30 * 86400000).toISOString();

  try {
    // Perfis cadastrados há 3–30 dias (suficientemente recentes pra interessar,
    // suficientemente antigos pra terem esfriado)
    const { data: perfis } = await supabase
      .from('users')
      .select('id, nome, anjo_nome, criado_em')
      .gte('criado_em', corteAntigo)
      .lte('criado_em', corteRecente);

    if (!perfis || !perfis.length) {
      return res.status(200).json({ ok: true, candidatos: 0, enviados: 0 });
    }

    const ids = perfis.map(p => p.id);

    // Suas push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', ids);

    if (!subs || !subs.length) {
      return res.status(200).json({ ok: true, candidatos: perfis.length, enviados: 0, motivo: 'sem push' });
    }

    const perfisById = Object.fromEntries(perfis.map(p => [p.id, p]));
    let enviados = 0, removidos = 0;
    let i = 0;

    for (const s of subs) {
      const perfil = perfisById[s.user_id]; if (!perfil) continue;
      const base = pickMensagem(i++);
      // toque pessoal: se temos o anjo do usuário, usa no body
      const body = perfil.anjo_nome
        ? `${perfil.anjo_nome} espera por você no app.`
        : base.body;
      const payload = JSON.stringify({
        title: base.title,
        body,
        url: '/?utm_source=push&utm_campaign=reengajamento',
      });
      const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(subscription, payload);
        enviados++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
          removidos++;
        }
      }
    }

    return res.status(200).json({ ok: true, candidatos: perfis.length, enviados, removidos });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
