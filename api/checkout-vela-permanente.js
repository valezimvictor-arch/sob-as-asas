// POST /api/checkout-vela-permanente
// Body: { pedidoId }
// Auth: Bearer access_token
// Cria sessão de checkout Stripe pra Vela Permanente (R$ 9,90/mês).
// O webhook stripe-webhook.js processa o evento e ativa a vela.

import Stripe from 'stripe';
import { supabase } from './_lib/supabase.js';
import { verifyUser } from './_lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const APP_URL = process.env.APP_URL || 'https://sobasasas.com.br';
const PRICE_VELA_PERMANENTE = process.env.STRIPE_PRICE_VELA_PERMANENTE;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!PRICE_VELA_PERMANENTE) {
    return res.status(500).json({ ok: false, error: 'STRIPE_PRICE_VELA_PERMANENTE não configurado no servidor.' });
  }

  const userId = await verifyUser(req);
  if (!userId) return res.status(401).json({ ok: false, error: 'Faça login pra acender uma vela permanente.' });

  const { pedidoId } = req.body || {};
  if (!pedidoId || typeof pedidoId !== 'string') {
    return res.status(400).json({ ok: false, error: 'ID do pedido ausente.' });
  }

  try {
    // Verifica que o pedido existe e pertence ao user
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select('id, user_id, texto, vela_permanente_ativa')
      .eq('id', pedidoId)
      .maybeSingle();
    if (error || !pedido) return res.status(404).json({ ok: false, error: 'Pedido não encontrado.' });
    if (pedido.user_id !== userId) return res.status(403).json({ ok: false, error: 'Você só pode acender vela permanente no seu próprio pedido.' });
    if (pedido.vela_permanente_ativa) {
      return res.status(409).json({ ok: false, error: 'Já existe uma vela permanente acesa neste pedido.' });
    }

    // Busca email do user pro Stripe Checkout
    const { data: userRow } = await supabase
      .from('users').select('email').eq('id', userId).maybeSingle();

    // Cria checkout subscription R$ 9,90/mês — sem trial (é um gesto contínuo)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_VELA_PERMANENTE, quantity: 1 }],
      customer_email: userRow?.email || undefined,
      client_reference_id: userId,
      subscription_data: {
        metadata: {
          tipo: 'vela_permanente',
          userId,
          pedidoId,
        },
      },
      locale: 'pt-BR',
      success_url: `${APP_URL}/?vela_permanente=ok&pedido=${encodeURIComponent(pedidoId)}`,
      cancel_url:  `${APP_URL}/?vela_permanente=cancelada`,
    });

    // Cria registro pendente (webhook vai ativar)
    await supabase.from('velas_permanentes').upsert({
      user_id: userId,
      pedido_id: pedidoId,
      status: 'pendente',
    }, { onConflict: 'pedido_id,user_id' });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    console.error('[checkout-vela-permanente]', e?.message);
    return res.status(500).json({ ok: false, error: 'Erro ao criar checkout: ' + e.message });
  }
}
