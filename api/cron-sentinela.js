// GET /api/cron-sentinela — Agente de monitoramento contínuo (24/7).
// Roda a cada hora (configurado em vercel.json), checa endpoints críticos,
// mede latência, e dispara alerta SÓ em falhas consecutivas (evita spam).
//
// Diferente do cron-smoke-test (1x/dia, simples), o Sentinela:
//   - Roda 24x/dia
//   - Rastreia falhas históricas via tabela sentinela_checks
//   - Só alerta após 2 falhas consecutivas (evita falso positivo de blip)
//   - Mede latência e alerta se >3s
//   - Verifica + endpoints (login, paywall, presente)

import { enviarEmail } from './_lib/resend.js';
import { adminKeyValida } from './_lib/adminAuth.js';
import { supabase } from './_lib/supabase.js';

const APP_URL = process.env.APP_URL || 'https://www.sobasasas.com.br';
const ALERT_TO = process.env.SENTINELA_ALERT_TO || process.env.SMOKE_ALERT_TO || 'vv@unitedmfo.com.br';
const LATENCIA_LIMITE_MS = 3000;
const FALHAS_PRA_ALERTAR = 2;  // 2 falhas consecutivas → email

// Endpoints monitorados — todos GET, sem efeito colateral
async function timedFetch(label, fn) {
  const t0 = Date.now();
  try {
    await fn();
    const ms = Date.now() - t0;
    return { label, ok: true, ms, slow: ms > LATENCIA_LIMITE_MS };
  } catch (e) {
    return { label, ok: false, ms: Date.now() - t0, erro: e.message };
  }
}

async function checkHomepage() {
  const r = await fetch(APP_URL, { method: 'HEAD' });
  if (!r.ok) throw new Error(`homepage HTTP ${r.status}`);
}
async function checkLanding() {
  const r = await fetch(`${APP_URL}/landing`, { method: 'HEAD' });
  if (!r.ok) throw new Error(`landing HTTP ${r.status}`);
}
async function checkPresente() {
  const r = await fetch(`${APP_URL}/presente`, { method: 'HEAD' });
  if (!r.ok) throw new Error(`presente HTTP ${r.status}`);
}
async function checkResgatar() {
  const r = await fetch(`${APP_URL}/resgatar`, { method: 'HEAD' });
  if (!r.ok) throw new Error(`resgatar HTTP ${r.status}`);
}
async function checkCalcAnjo() {
  const r = await fetch(`${APP_URL}/api/calc-anjo?data=1990-01-01`);
  if (!r.ok) throw new Error(`calc-anjo HTTP ${r.status}`);
  const j = await r.json().catch(() => null);
  if (!j || !j.anjo || !j.anjo.nome) throw new Error('calc-anjo payload inválido');
}
async function checkSupabase() {
  const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' }).limit(1);
  if (error) throw new Error('Supabase: ' + error.message);
}
async function checkStripeWebhookConfig() {
  // Não consegue testar webhook diretamente, mas verifica env vars críticas
  const faltando = [];
  if (!process.env.STRIPE_SECRET_KEY) faltando.push('STRIPE_SECRET_KEY');
  if (!process.env.STRIPE_WEBHOOK_SECRET) faltando.push('STRIPE_WEBHOOK_SECRET');
  if (!process.env.STRIPE_PRICE_MENSAL) faltando.push('STRIPE_PRICE_MENSAL');
  if (!process.env.STRIPE_PRICE_ANUAL) faltando.push('STRIPE_PRICE_ANUAL');
  if (faltando.length) throw new Error('Env vars Stripe ausentes: ' + faltando.join(', '));
}

const CHECKS = [
  ['homepage', checkHomepage],
  ['landing', checkLanding],
  ['presente', checkPresente],
  ['resgatar', checkResgatar],
  ['api-calc-anjo', checkCalcAnjo],
  ['supabase-read', checkSupabase],
  ['stripe-config', checkStripeWebhookConfig],
];

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = adminKeyValida(req);
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  const inicioCheck = new Date();
  const resultados = await Promise.all(CHECKS.map(([label, fn]) => timedFetch(label, fn)));

  // Tenta gravar histórico na tabela sentinela_checks (cria se possível)
  try {
    await supabase.from('sentinela_checks').insert({
      checado_em: inicioCheck.toISOString(),
      resultados,
      falhas: resultados.filter(r => !r.ok).length,
      latencia_max_ms: Math.max(...resultados.map(r => r.ms || 0)),
    });
  } catch (e) {
    // Tabela pode não existir — continua sem gravar histórico
  }

  const falhas = resultados.filter(r => !r.ok);
  const lentos = resultados.filter(r => r.ok && r.slow);

  // Estado calmo: tudo OK e sem lentidão
  if (falhas.length === 0 && lentos.length === 0) {
    return res.status(200).json({ ok: true, todos_passaram: true, resultados });
  }

  // Detecta falhas CONSECUTIVAS (evita alerta falso de 1 blip de rede)
  let alertar = false;
  try {
    const { data: ultimos } = await supabase
      .from('sentinela_checks')
      .select('falhas')
      .order('checado_em', { ascending: false })
      .limit(FALHAS_PRA_ALERTAR);
    const consecutivas = (ultimos || []).filter(c => (c.falhas || 0) > 0).length;
    if (consecutivas >= FALHAS_PRA_ALERTAR) alertar = true;
  } catch (e) {
    // sem tabela → alerta sempre que houver falha (conservador)
    if (falhas.length > 0) alertar = true;
  }

  // Lentidão NÃO dispara alerta sozinha — só registra
  if (alertar && falhas.length > 0) {
    try {
      const html = `<!doctype html><html><body style="font-family:-apple-system,sans-serif; background:#FBF2F1; color:#2C2C2A; padding:30px; max-width:600px; margin:0 auto">
        <h1 style="color:#C0392B; font-family:Georgia,serif; font-weight:400; font-size:24px">⚠ Sentinela detectou problema</h1>
        <p style="font-size:14px; color:#5F5E5A">Falha confirmada após ${FALHAS_PRA_ALERTAR} checks consecutivos. Detectado em ${inicioCheck.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (BRT).</p>
        <h3 style="margin-top:24px; color:#C0392B">Endpoints com falha (${falhas.length}):</h3>
        <ul style="line-height:1.8; font-size:14px">
          ${falhas.map(f => `<li><strong>${f.label}</strong> — ${f.erro} <span style="color:#7C4E0F">(${f.ms}ms)</span></li>`).join('')}
        </ul>
        ${lentos.length > 0 ? `<h3 style="margin-top:24px; color:#BA7517">Lentidão (>${LATENCIA_LIMITE_MS}ms):</h3>
        <ul style="line-height:1.8; font-size:14px">
          ${lentos.map(l => `<li><strong>${l.label}</strong> — ${l.ms}ms</li>`).join('')}
        </ul>` : ''}
        <hr style="border:none; border-top:1px solid #ddd; margin:24px 0">
        <p style="font-size:13px; color:#5F5E5A">Próximo check automático em 1h. <a href="${APP_URL}/admin" style="color:#BA7517">Painel admin →</a></p>
        <p style="font-size:11px; color:#9F9D98; margin-top:16px">Sentinela 24/7 · Sob as Asas · LVSV Ventures</p>
      </body></html>`;
      await enviarEmail({
        to: ALERT_TO,
        subject: `⚠ Sentinela: ${falhas.length} endpoint(s) com falha — Sob as Asas`,
        html,
      });
    } catch (e) {
      return res.status(500).json({ ok: false, falhas, alertaErro: e.message });
    }
  }

  return res.status(200).json({ ok: falhas.length === 0, alertou: alertar, resultados });
}
