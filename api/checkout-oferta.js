// POST /api/checkout-oferta
// Auth: Bearer access_token
// Cria sessão de checkout Stripe pra Oferta dos Mantenedores (R$ 9,90/mês).
// É uma contribuição voluntária pro trabalho do app + Monica — não compra
// prioridade espiritual, não destaca o pedido do pagante.
// O webhook stripe-webhook.js processa e marca user.oferta_ativa = true.

import Stripe from 'stripe';
import { supabase } from './_lib/supabase.js';
import { verifyUser } from './_lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const APP_URL = process.env.APP_URL || 'https://sobasasas.com.br';
// Mesma env var de antes — pode reaproveitar o price R$ 9,90/mês criado no Stripe
const PRICE_OFERTA = process.env.STRIPE_PRICE_OFERTA || process.env.STRIPE_PRICE_VELA_PERMANENTE;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!PRICE_OFERTA) {
    return res.status(500).json({ ok: false, error: 'STRIPE_PRICE_OFERTA não configurado no servidor.' });
  }

  const userId = await verifyUser(req);
  if (!userId) return res.status(401).json({ ok: false, error: 'Faça login pra ofertar.' });

  try {
    // Já tem oferta ativa? (1ª barreira: nosso banco)
    const { data: existing } = await supabase
      .from('users').select('email, oferta_ativa').eq('id', userId).maybeSingle();
    if (existing?.oferta_ativa) {
      return res.status(409).json({ ok: false, error: 'Você já é Mantenedora ativa. Obrigada pela presença.' });
    }

    // 2ª barreira (fecha a janela de duplo-checkout): reusa o customer no
    // Stripe e checa se já há uma assinatura de oferta ativa lá — mesmo que o
    // webhook ainda não tenha atualizado nosso banco. Stripe é a fonte de
    // verdade; sem isso, dois cliques rápidos criavam 2 assinaturas.
    let customerId;
    if (existing?.email) {
      try {
        const found = await stripe.customers.list({ email: existing.email, limit: 1 });
        if (found.data.length) {
          customerId = found.data[0].id;
          const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
          const jaTem = subs.data.some(s =>
            ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status) &&
            s.metadata && s.metadata.tipo === 'oferta'
          );
          if (jaTem) {
            return res.status(409).json({ ok: false, error: 'Você já tem uma oferta ativa. Obrigada pela presença.' });
          }
        }
      } catch (e) {
        // Falha na checagem de duplicidade não deve bloquear a oferta nova.
        console.warn('[checkout-oferta] dedupe Stripe:', e?.message);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_OFERTA, quantity: 1 }],
      ...(customerId ? { customer: customerId } : { customer_email: existing?.email || undefined }),
      client_reference_id: userId,
      subscription_data: {
        metadata: {
          tipo: 'oferta',
          userId,
        },
      },
      locale: 'pt-BR',
      success_url: `${APP_URL}/?oferta=ok`,
      cancel_url:  `${APP_URL}/?oferta=cancelada`,
    });

    // Registro pendente — webhook vai ativar
    await supabase.from('mantenedores').upsert({
      user_id: userId,
      status: 'pendente',
    }, { onConflict: 'user_id' });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    console.error('[checkout-oferta]', e?.message);
    return res.status(500).json({ ok: false, error: 'Erro ao criar checkout: ' + e.message });
  }
}
