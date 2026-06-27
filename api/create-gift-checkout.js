// POST /api/create-gift-checkout
// Body: { deNome, deEmail, paraNome, paraEmail, mensagem, dataEnvio }
// Cria checkout one-shot (anual presente) — paga R$ 149 e o presente é entregue
// na data combinada. O webhook de payment_intent.succeeded notifica equipe
// pra preparar o email de resgate com link único.

import { stripe } from './_lib/stripe.js';

const APP_URL = process.env.APP_URL || 'https://sobasasas.com.br';
const PRICE_PRESENTE = process.env.STRIPE_PRICE_PRESENTE_ANUAL || process.env.STRIPE_PRICE_ANUAL;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { deNome, deEmail, paraNome, paraEmail, mensagem, dataEnvio } = req.body || {};
  if (!deNome || !deEmail || !paraNome || !paraEmail) {
    return res.status(400).json({ ok: false, error: 'Dados incompletos' });
  }

  try {
    // Checkout em modo payment (pagamento único, sem renovação automática)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_PRESENTE, quantity: 1 }],
      customer_email: deEmail,
      locale: 'pt-BR',
      payment_intent_data: {
        metadata: {
          tipo: 'presente_anual',
          de_nome: deNome,
          de_email: deEmail,
          para_nome: paraNome,
          para_email: paraEmail,
          mensagem: (mensagem||'').slice(0, 500),
          data_envio: dataEnvio || '',
        }
      },
      metadata: { tipo: 'presente_anual', para_email: paraEmail },
      success_url: `${APP_URL}/presente?ok=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/presente?cancelado=1`,
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    console.error('[create-gift-checkout]', e?.message);
    return res.status(500).json({ ok: false, error: 'Falha ao criar checkout do presente' });
  }
}
