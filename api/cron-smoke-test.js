// GET /api/cron-smoke-test — verifica diariamente se as APIs principais estão de pé.
// Agendado em vercel.json: 10h UTC (~7h BRT) — antes do tráfego do dia.
//
// Verifica:
//   1) calc-anjo (cálculo do anjo regente)
//   2) /api/admin-metrics (responde 401, prova que está vivo)
//   3) Supabase reachable (RPC velas_acesas_hoje)
//   4) Resend reachable (HEAD /domains)
//
// Se algum falhar, envia e-mail pelo Resend para SMOKE_ALERT_TO.
// Sem falhas → 200 vazio (silêncio é ouro).

import { enviarEmail } from './_lib/resend.js';
import { supabase } from './_lib/supabase.js';

const APP_URL = process.env.APP_URL || 'https://www.sobasasas.com.br';
const ALERT_TO = process.env.SMOKE_ALERT_TO || 'vv@unitedmfo.com.br';

async function checkCalcAnjo() {
  const r = await fetch(`${APP_URL}/api/calc-anjo?nascimento=1990-01-01`);
  if (!r.ok) throw new Error(`calc-anjo HTTP ${r.status}`);
  const j = await r.json().catch(() => ({}));
  if (!j || !j.anjo) throw new Error('calc-anjo retornou payload inesperado');
  return { ok: true, detalhe: j.anjo.nome };
}

async function checkAdminMetrics() {
  // sem header → 401 esperado. Qualquer outra coisa = vivo errado.
  const r = await fetch(`${APP_URL}/api/admin-metrics`);
  if (r.status === 401) return { ok: true, detalhe: 'auth ok' };
  throw new Error(`admin-metrics status inesperado ${r.status}`);
}

async function checkSupabaseRPC() {
  const { error } = await supabase.rpc('velas_acesas_hoje');
  if (error) throw new Error(`RPC velas_acesas_hoje: ${error.message}`);
  return { ok: true };
}

async function checkResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY ausente');
  const r = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (!r.ok) throw new Error(`Resend HTTP ${r.status}`);
  return { ok: true };
}

// O front carrega o supabase-js do CDN (jsdelivr → unpkg). Se AMBOS caírem, o
// app inteiro vai pra "modo demo" (sem login/dados) — silenciosamente. Esta
// checagem garante que pelo menos um CDN serve o script.
async function checkSupabaseCDN() {
  const fontes = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js',
  ];
  const erros = [];
  for (const url of fontes) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (r.ok) return { ok: true, detalhe: url.includes('jsdelivr') ? 'jsdelivr' : 'unpkg' };
      erros.push(`${url.split('/')[2]} HTTP ${r.status}`);
    } catch (e) { erros.push(`${url.split('/')[2]}: ${e.message}`); }
  }
  throw new Error('supabase-js indisponível em TODOS os CDNs — o app cairia em modo demo. ' + erros.join(' | '));
}

const CHECKS = [
  ['calc-anjo', checkCalcAnjo],
  ['admin-metrics', checkAdminMetrics],
  ['supabase-rpc', checkSupabaseRPC],
  ['supabase-cdn', checkSupabaseCDN],
  ['resend', checkResend],
];

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  const resultados = [];
  for (const [nome, fn] of CHECKS) {
    try { const r = await fn(); resultados.push({ nome, ok: true, detalhe: r.detalhe || '' }); }
    catch (e) { resultados.push({ nome, ok: false, erro: e.message }); }
  }

  const falhas = resultados.filter(r => !r.ok);
  if (falhas.length === 0) {
    return res.status(200).json({ ok: true, todos_passaram: true });
  }

  // Envia alerta por e-mail
  try {
    const html = `<!doctype html><html><body style="font-family:-apple-system,sans-serif; background:#FBF2F1; color:#2C2C2A; padding:30px">
      <h1 style="color:#C0392B; font-family:Georgia,serif; font-weight:400">⚠ Smoke test falhou — Sob as Asas</h1>
      <p>Detectado em ${new Date().toISOString()} (UTC)</p>
      <h3 style="margin-top:24px">Falhas:</h3>
      <ul style="line-height:1.7">
        ${falhas.map(f => `<li><strong>${f.nome}</strong>: ${f.erro}</li>`).join('')}
      </ul>
      <h3 style="margin-top:24px">Resultados completos:</h3>
      <pre style="background:#fff; padding:12px; border-radius:10px; font-size:13px; white-space:pre-wrap">${JSON.stringify(resultados, null, 2)}</pre>
      <p style="color:#5F5E5A; font-size:12px; margin-top:24px">Painel: ${APP_URL}/admin · LVSV Ventures</p>
    </body></html>`;
    await enviarEmail({
      to: ALERT_TO,
      subject: `⚠ Smoke test falhou em ${falhas.length} check(s) — Sob as Asas`,
      html,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, falhas, alertaErro: e.message });
  }
  return res.status(200).json({ ok: false, falhas });
}
