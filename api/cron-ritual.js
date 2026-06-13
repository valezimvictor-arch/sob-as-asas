// GET /api/cron-ritual?type=morning|evening
// Cron diário: envia o push do ritual (manhã = proteção, noite = gratidão).
// Agendado no vercel.json. Protegido para rodar só via cron da Vercel.
//
// v1: envia a mesma mensagem-âncora do dia para quem optou pelo horário.
// Evolução: personalizar pelo anjo regente de cada usuário.

import { supabase } from './_lib/supabase.js';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const COPY = {
  morning: { title: '🕊️ Bom dia, você está sob as asas', body: 'Receba a proteção do seu anjo para hoje.' },
  evening: { title: '✨ Hora da gratidão', body: 'Feche o dia em paz com seu anjo da guarda.' },
};

export default async function handler(req, res) {
  // Só cron da Vercel (header) ou chave admin.
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  const type = req.query.type === 'evening' ? 'evening' : 'morning';
  const copy = COPY[type];

  // Busca inscrições push de quem escolheu este horário de ritual.
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')
    .eq('ritual_horario', type);

  if (error) return res.status(500).json({ ok: false, error: error.message });

  let enviados = 0, removidos = 0;
  for (const s of subs || []) {
    const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
    try {
      await webpush.sendNotification(subscription, JSON.stringify({ ...copy, url: '/?action=ritual' }));
      enviados++;
    } catch (err) {
      // 410/404 = inscrição morta → limpa.
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        removidos++;
      }
    }
  }

  return res.status(200).json({ ok: true, type, enviados, removidos });
}
