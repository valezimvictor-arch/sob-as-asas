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
import { enviarEmail } from './_lib/resend.js';
import { emailPresenteHtml } from './_lib/presenteEmail.js';

// Gera código de resgate único: PRES-A1B2-C3D4 (10 chars úteis, fácil de digitar)
function gerarCodigoPresente() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I/Z pra evitar confusão
  let r = '';
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return 'PRES-' + r.slice(0, 4) + '-' + r.slice(4, 8);
}

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

  // ── Idempotência: já processamos este event.id antes? ──
  // Stripe retenta eventos quando o endpoint demora >20s ou retorna 5xx.
  // Sem essa checagem, retries criam duplicatas (cobrar 2x, etc).
  try {
    const { data: existente } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .maybeSingle();
    if (existente) {
      // Já processado — retorna 200 pra Stripe parar de retentar
      return res.status(200).json({ received: true, duplicate: true });
    }
  } catch (e) {
    // Se a tabela ainda não existe, segue (não bloqueia o webhook).
    // Pra ativar idempotência: rodar MIGRACAO_STRIPE_EVENTS.sql no Supabase.
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const meta = s.metadata || {};

      // ── PRESENTE (one-time payment) ──
      if (meta.tipo === 'presente_anual' && s.mode === 'payment') {
        // Pega metadata do payment_intent (que tem todos os campos do presente)
        let piMeta = meta;
        if (s.payment_intent) {
          try {
            const pi = await stripe.paymentIntents.retrieve(s.payment_intent);
            if (pi && pi.metadata) piMeta = pi.metadata;
          } catch (_) {}
        }

        const codigo = gerarCodigoPresente();
        const link = `https://sobasasas.com.br/resgatar?codigo=${encodeURIComponent(codigo)}`;
        const linhaPresente = {
          codigo,
          stripe_session_id: s.id,
          stripe_payment_intent_id: s.payment_intent,
          valor_centavos: s.amount_total || 14900,
          de_nome: piMeta.de_nome || '',
          de_email: piMeta.de_email || s.customer_email || '',
          para_nome: piMeta.para_nome || '',
          para_email: piMeta.para_email || meta.para_email || '',
          mensagem: piMeta.mensagem || null,
          data_envio: piMeta.data_envio || null,
        };

        // Insere no banco
        const { error: dbErr } = await supabase.from('presentes').insert(linhaPresente);
        if (dbErr) {
          console.error('[stripe-webhook] erro ao inserir presente:', dbErr.message);
          // Não retorna 500 — Stripe não tem o que retentar pra esse erro
        }

        // Decide se manda email agora ou agenda (cron diário lida com os agendados)
        const enviarAgora = !linhaPresente.data_envio ||
          new Date(linhaPresente.data_envio) <= new Date();

        if (enviarAgora && linhaPresente.para_email) {
          try {
            await enviarEmail({
              to: linhaPresente.para_email,
              subject: `${linhaPresente.de_nome} preparou um presente pra você 🕊️`,
              html: emailPresenteHtml({
                paraNome: linhaPresente.para_nome,
                deNome: linhaPresente.de_nome,
                mensagem: linhaPresente.mensagem,
                codigo,
                link,
              }),
              replyTo: 'contato@sobasasas.com.br',
            });
            await supabase
              .from('presentes')
              .update({ status: 'email_enviado', email_enviado_em: new Date().toISOString() })
              .eq('codigo', codigo);
          } catch (e) {
            console.error('[stripe-webhook] erro ao enviar email do presente:', e?.message);
          }
        }
        // Done com o caso presente — não cair no fluxo de assinatura
        // (segue pra marcação de processado no fim)
      } else {
        // Subscription metadata (pega antes pra detectar o tipo)
        let subMeta = meta;
        if (s.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(s.subscription);
            if (sub && sub.metadata) subMeta = { ...meta, ...sub.metadata };
          } catch (_) {}
        }

        // ── VELA PERMANENTE — subscription dedicada a 1 pedido ──
        if (subMeta.tipo === 'vela_permanente') {
          const userId = subMeta.userId;
          const pedidoId = subMeta.pedidoId;
          if (userId && pedidoId) {
            await supabase.from('velas_permanentes').upsert({
              user_id: userId,
              pedido_id: pedidoId,
              stripe_subscription_id: s.subscription,
              status: 'ativa',
            }, { onConflict: 'pedido_id,user_id' });
            await supabase.from('pedidos').update({
              vela_permanente_ativa: true,
              vela_permanente_desde: new Date().toISOString(),
              vela_permanente_stripe_sub_id: s.subscription,
              publico: true, // vela permanente automaticamente vira pública (faz sentido)
            }).eq('id', pedidoId);
          }
          // Não cai no fluxo de assinatura — vela permanente é separada
        } else {
          // ── ASSINATURA (recorrente) — fluxo original ──
          const userId = s.client_reference_id || meta.userId;
          const plano = meta.plano || 'mensal';
          if (userId) {
            await supabase.from('assinaturas').upsert({
              user_id: userId, stripe_customer_id: s.customer, stripe_subscription_id: s.subscription,
              plano, status: 'trialing', atualizado_em: new Date().toISOString(),
            }, { onConflict: 'user_id' });
            await supabase.from('users').update({ plano: 'trial' }).eq('id', userId);
          }
        }
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const meta = sub.metadata || {};
      const userId = meta.userId;
      const status = sub.status;

      // ── Vela permanente: trata status separadamente ──
      if (meta.tipo === 'vela_permanente' && meta.pedidoId) {
        const novoStatusVela = (status === 'active' || status === 'trialing') ? 'ativa'
                              : (status === 'past_due' || status === 'unpaid') ? 'pausada'
                              : 'cancelada';
        await supabase.from('velas_permanentes').upsert({
          user_id: userId, pedido_id: meta.pedidoId, stripe_subscription_id: sub.id,
          status: novoStatusVela,
          cancelada_em: novoStatusVela === 'cancelada' ? new Date().toISOString() : null,
        }, { onConflict: 'pedido_id,user_id' });
        const velaAtiva = novoStatusVela === 'ativa';
        await supabase.from('pedidos').update({ vela_permanente_ativa: velaAtiva }).eq('id', meta.pedidoId);
      } else {
        // Assinatura normal — fluxo original
        const plano = meta.plano || null;
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
    }
  } catch (e) {
    console.error('[stripe-webhook]', e?.message);
    // Em caso de erro no processamento, NÃO marca como processado —
    // o Stripe retenta e a próxima tentativa pode ter sucesso.
    return res.status(500).json({ error: 'processing failed' });
  }

  // Marca como processado pra evitar reprocessamento em retries.
  try {
    await supabase.from('stripe_events').insert({
      id: event.id,
      tipo: event.type,
      payload: null,  // não guarda payload por padrão (privacidade). Trocar pra event se precisar debugar.
    });
  } catch (_) {
    // tabela pode não existir ainda; ok ignorar (event ainda foi processado)
  }

  return res.status(200).json({ received: true });
}
