// POST /api/save-push  { userId, subscription, ritual_horario }
// Salva a inscrição de push do navegador em public.push_subscriptions.
// O cron-ritual usa essa tabela para enviar o lembrete do ritual/salmo.

import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, subscription, ritual_horario } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ ok: false, error: 'subscription inválida' });
  }
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys && subscription.keys.p256dh,
    auth: subscription.keys && subscription.keys.auth,
    user_id: userId || null,
    ritual_horario: ritual_horario || 'morning',
  }, { onConflict: 'endpoint' });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true });
}
