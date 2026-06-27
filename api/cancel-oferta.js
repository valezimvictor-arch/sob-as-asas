// POST /api/cancel-oferta
// Auth: Bearer access_token
// Agenda o cancelamento da Oferta dos Mantenedores no FIM do ciclo atual
// (cancel_at_period_end) — a pessoa segue Mantenedora até lá, sem nova
// cobrança. O webhook customer.subscription.* sincroniza o estado quando o
// ciclo encerra. Idempotente: cancelar uma sub já cancelada retorna ok.

import { stripe } from './_lib/stripe.js';
import { supabase } from './_lib/supabase.js';
import { verifyUser } from './_lib/auth.js';


export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const userId = await verifyUser(req);
  if (!userId) return res.status(401).json({ ok: false, error: 'Faça login.' });

  try {
    // Localiza a subscription do usuário (mantenedores primeiro, users como fallback).
    const { data: m } = await supabase
      .from('mantenedores').select('stripe_subscription_id').eq('user_id', userId).maybeSingle();
    let subId = m?.stripe_subscription_id || null;
    if (!subId) {
      const { data: u } = await supabase
        .from('users').select('oferta_stripe_sub_id').eq('id', userId).maybeSingle();
      subId = u?.oferta_stripe_sub_id || null;
    }
    if (!subId) {
      return res.status(404).json({ ok: false, error: 'Não encontrei uma oferta ativa pra cancelar.' });
    }

    let periodoFim = null;
    try {
      const sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
      periodoFim = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
    } catch (e) {
      // Sub já não existe no Stripe (cancelada antes) → sucesso idempotente.
      if (e?.code === 'resource_missing') {
        return res.status(200).json({ ok: true, ja_cancelada: true });
      }
      throw e;
    }

    return res.status(200).json({ ok: true, periodo_fim: periodoFim });
  } catch (e) {
    console.error('[cancel-oferta]', e?.message);
    return res.status(500).json({ ok: false, error: 'Não consegui cancelar agora. Tente em alguns minutos.' });
  }
}
