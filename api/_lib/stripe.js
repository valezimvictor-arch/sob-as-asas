// Cliente Stripe único, com apiVersion PINADA pra evitar drift silencioso da
// API (ex.: current_period_end migrando pro item da subscription em versões
// 2025+). Pré-2025 o campo fica no objeto subscription — o stripe-webhook.js
// depende disso. NÃO suba a versão sem revisar o webhook.
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
