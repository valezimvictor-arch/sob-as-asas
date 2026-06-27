// POST /api/create-checkout
// Body: { userId, plano: 'mensal' | 'anual', email }
// Cria uma sessão de checkout do Stripe para a assinatura do Sob as Asas.
// Inclui período de trial gratuito (TRIAL_DAYS).
//
// O assinante paga pela PRÁTICA diária (conteúdo, ritual, biblioteca) — não por
// um sorteio. O "Milagre do mês" é ato editorial da marca, sem contrapartida.

import { stripe } from './_lib/stripe.js';

const APP_URL = process.env.APP_URL || 'https://sobasasas.com.br';

const PRICES = {
  mensal: process.env.STRIPE_PRICE_MENSAL,
  anual:  process.env.STRIPE_PRICE_ANUAL,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, plano = 'mensal', email, ref } = req.body || {};
  const price = PRICES[plano];
  if (!price) return res.status(400).json({ ok: false, error: 'Plano inválido' });

  // Trial estendido pra quem entrou por indicação
  const trialPadrao = Number(process.env.TRIAL_DAYS || 7);
  const trialDias = (ref && /^[a-z0-9]{4,12}$/i.test(ref)) ? Math.max(trialPadrao, 14) : trialPadrao;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      subscription_data: {
        trial_period_days: trialDias,
        metadata: { userId: userId || '', plano, ref: ref || '' },
      },
      allow_promotion_codes: true,
      locale: 'pt-BR',
      success_url: `${APP_URL}/?assinatura=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?assinatura=cancelada`,
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    console.error('[create-checkout]', e?.message);
    return res.status(500).json({ ok: false, error: 'Falha ao criar checkout' });
  }
}
