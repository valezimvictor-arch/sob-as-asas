// POST /api/stripe-webhook  — recebe eventos do Stripe e sincroniza a assinatura
// no Supabase (tabela `assinaturas` + `users.plano`).
//
// Configurar no Stripe Dashboard → Developers → Webhooks:
//   URL: https://SEU_DOMINIO/api/stripe-webhook
//   Eventos: checkout.session.completed, customer.subscription.updated,
//            customer.subscription.deleted
//   Copie o "Signing secret" para a env var STRIPE_WEBHOOK_SECRET na Vercel.

import Stripe from 'stripe';
import { supabase } from './_lib/supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe exige o corpo CRU para validar a assinatura → desliga o parser.
export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let event;
  try {
    const buf = await rawBody(req);
    event = stripe.webhooks.constructEvent(buf, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send('Webhook Error: ' + e.message);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const userId = s.client_reference_id || (s.metadata && s.metadata.userId);
      const plano = (s.metadata && s.metadata.plano) || 'mensal';
      if (userId) {
        await supabase.from('assinaturas').upsert({
          user_id: userId, stripe_customer_id: s.customer, stripe_subscription_id: s.subscription,
          plano, status: 'trialing', atualizado_em: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        await supabase.from('users').update({ plano: 'trial' }).eq('id', userId);
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const userId = sub.metadata && sub.metadata.userId;
      const plano = (sub.metadata && sub.metadata.plano) || null;
      const status = sub.status; // active | trialing | past_due | canceled | ...
      if (userId) {
        await supabase.from('assinaturas').upsert({
          user_id: userId, stripe_subscription_id: sub.id, status, plano,
          periodo_fim: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        const planoUser = status === 'active' ? (plano || 'mensal') : (status === 'trialing' ? 'trial' : 'free');
        await supabase.from('users').update({ plano: planoUser }).eq('id', userId);
      }
    }
  } catch (e) {
    console.error('[stripe-webhook]', e?.message);
  }

  return res.status(200).json({ received: true });
}
