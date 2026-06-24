// GET /api/cron-pulse-diario — Agente de pulse diário.
// Roda toda manhã às 8h BRT (11h UTC). Compila métricas das últimas 24h
// e envia digest por email pra Vinicius. Sem isso, você precisa abrir
// 5 dashboards (Plausible, Sentry, Stripe, Supabase, admin) toda manhã.
//
// Métricas:
//   - Cadastros (Supabase users novos últimas 24h)
//   - Trials iniciados (assinaturas com status='trialing' criadas hoje)
//   - Assinaturas concluídas (users com plano!=free)
//   - Presentes comprados
//   - Erros críticos (placeholder — integração Sentry virá depois)
//   - Comparação % com semana anterior (mesmo dia)
//   - Sugestão acionável do dia
//
// Sem dependência de Plausible/Sentry API (que exigem keys e setup
// adicional) — usa direto o Supabase como fonte da verdade.

import { enviarEmail } from './_lib/resend.js';
import { supabase } from './_lib/supabase.js';

const ALERT_TO = process.env.PULSE_TO || process.env.SMOKE_ALERT_TO || 'vv@unitedmfo.com.br';

// Conta linhas de uma tabela criadas num período
async function contar(tabela, colunaTimestamp, desde, ate, filtros = {}) {
  let q = supabase.from(tabela).select('id', { count: 'exact', head: true }).gte(colunaTimestamp, desde).lt(colunaTimestamp, ate);
  for (const [col, val] of Object.entries(filtros)) {
    if (Array.isArray(val)) q = q.in(col, val);
    else q = q.eq(col, val);
  }
  const { count } = await q;
  return count || 0;
}

function delta(atual, anterior) {
  if (anterior === 0) return atual > 0 ? '+∞' : '—';
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  return (pct >= 0 ? '+' : '') + pct + '%';
}

function chip(label, valor, deltaPct, cor) {
  cor = cor || '#BA7517';
  return `<td style="text-align:center; padding:0 8px; width:25%">
    <div style="background:#FAF3E4; border-radius:14px; padding:14px 6px">
      <div style="font-size:11px; letter-spacing:.14em; color:${cor}; text-transform:uppercase; font-weight:600">${label}</div>
      <div style="font-family:Georgia,'Playfair Display',serif; font-size:30px; color:#2C2C2A; margin:6px 0 0; line-height:1">${valor}</div>
      <div style="font-size:11px; color:#7C4E0F; margin-top:4px">${deltaPct} vs sem. ant.</div>
    </div>
  </td>`;
}

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  try {
    // Períodos: ontem (24h passadas) + mesmo dia semana anterior
    const agora = new Date();
    const ontemInicio = new Date(agora); ontemInicio.setHours(0, 0, 0, 0); ontemInicio.setDate(ontemInicio.getDate() - 1);
    const ontemFim = new Date(ontemInicio); ontemFim.setDate(ontemFim.getDate() + 1);
    const semAntInicio = new Date(ontemInicio); semAntInicio.setDate(semAntInicio.getDate() - 7);
    const semAntFim = new Date(ontemFim); semAntFim.setDate(semAntFim.getDate() - 7);

    const fmt = d => d.toISOString();

    // Coleta paralela
    const [
      cadastros24h, cadastrosSemAnt,
      trialsHoje, trialsSemAnt,
      assinaturasHoje, assinaturasSemAnt,
      presentesHoje, presentesSemAnt,
      pedidosHoje,
      candidatosMilagre,
      sentinelaFalhasHoje,
    ] = await Promise.all([
      contar('users', 'criado_em', fmt(ontemInicio), fmt(ontemFim)),
      contar('users', 'criado_em', fmt(semAntInicio), fmt(semAntFim)),
      contar('assinaturas', 'atualizado_em', fmt(ontemInicio), fmt(ontemFim), { status: 'trialing' }),
      contar('assinaturas', 'atualizado_em', fmt(semAntInicio), fmt(semAntFim), { status: 'trialing' }),
      contar('assinaturas', 'atualizado_em', fmt(ontemInicio), fmt(ontemFim), { status: 'active' }),
      contar('assinaturas', 'atualizado_em', fmt(semAntInicio), fmt(semAntFim), { status: 'active' }),
      contar('presentes', 'criado_em', fmt(ontemInicio), fmt(ontemFim)),
      contar('presentes', 'criado_em', fmt(semAntInicio), fmt(semAntFim)),
      contar('pedidos', 'criado_em', fmt(ontemInicio), fmt(ontemFim)),
      contar('pedidos', 'criado_em', fmt(ontemInicio), fmt(ontemFim), { candidato_milagre: true }),
      contar('sentinela_checks', 'checado_em', fmt(ontemInicio), fmt(ontemFim), { falhas: [1, 2, 3, 4, 5, 6, 7] }).catch(() => 0),
    ]);

    // Sugestão acionável do dia (regra simples — escalonar com mais dados)
    let sugestao = '';
    const conv = cadastros24h > 0 ? Math.round((trialsHoje / cadastros24h) * 100) : 0;
    if (cadastros24h === 0) {
      sugestao = '<strong>Sem cadastros ontem.</strong> Considere ativar uma campanha — post da Monica no Instagram + WhatsApp pro círculo.';
    } else if (conv < 10 && trialsHoje === 0) {
      sugestao = '<strong>Conversão cadastro→trial está baixa.</strong> Reveja o paywall + o card de "Sua 1ª mensagem mensal" no home.';
    } else if (sentinelaFalhasHoje > 5) {
      sugestao = '<strong>Sentinela detectou ' + sentinelaFalhasHoje + ' falhas nas últimas 24h.</strong> Olhe o painel admin pra ver qual endpoint está instável.';
    } else if (cadastros24h > 50) {
      sugestao = '<strong>Pico de cadastros!</strong> Aproveite — escreva um agradecimento curto no Instagram e mencione o que esses ' + cadastros24h + ' usuários têm em comum.';
    } else {
      sugestao = 'Operação saudável. Foco do dia: <strong>fazer o conteúdo da Monica chegar</strong> nos novos cadastros (newsletter de sábado já está agendada).';
    }

    const dataPtBr = ontemInicio.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

    const html = `<!doctype html><html><body style="font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif; background:#FBFAF7; color:#2C2C2A; padding:0; margin:0">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FBFAF7">
        <tr><td align="center" style="padding:40px 16px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px">
            <!-- Topo -->
            <tr><td align="center" style="padding-bottom:24px">
              <div style="font-size:28px; color:#EF9F27">&#10022;</div>
              <h1 style="margin:6px 0 2px; font-family:Georgia,'Playfair Display',serif; font-weight:400; font-size:24px; color:#2C2C2A">Pulse Diário</h1>
              <p style="margin:0; font-family:Georgia,'Cormorant Garamond',serif; font-style:italic; font-size:14px; color:#BA7517; text-transform:capitalize">${dataPtBr}</p>
            </td></tr>

            <!-- Métricas -->
            <tr><td style="background:#fff; border:1px solid rgba(186,117,23,.16); border-radius:18px; padding:20px 14px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  ${chip('Cadastros', cadastros24h, delta(cadastros24h, cadastrosSemAnt))}
                  ${chip('Trials', trialsHoje, delta(trialsHoje, trialsSemAnt))}
                  ${chip('Assinaturas', assinaturasHoje, delta(assinaturasHoje, assinaturasSemAnt), '#1E8449')}
                  ${chip('Presentes', presentesHoje, delta(presentesHoje, presentesSemAnt))}
                </tr>
              </table>
            </td></tr>

            <!-- Pedidos + Milagre -->
            <tr><td style="padding-top:14px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="background:#fff; border:1px solid rgba(186,117,23,.16); border-radius:14px; padding:14px 16px; vertical-align:top">
                    <p style="margin:0; font-size:11px; letter-spacing:.14em; color:#BA7517; text-transform:uppercase; font-weight:600">Pedidos novos</p>
                    <p style="margin:6px 0 0; font-family:Georgia,'Playfair Display',serif; font-size:26px; line-height:1">${pedidosHoje}</p>
                    <p style="margin:6px 0 0; font-size:12px; color:#5F5E5A">${candidatosMilagre} candidato(s) ao milagre do mês</p>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Sugestão -->
            <tr><td style="padding-top:18px">
              <div style="background:#FAF3E4; border-left:3px solid #BA7517; border-radius:0 12px 12px 0; padding:16px 18px">
                <p style="margin:0 0 6px; font-size:11px; letter-spacing:.16em; color:#BA7517; text-transform:uppercase; font-weight:600">Sugestão do dia</p>
                <p style="margin:0; font-family:Georgia,'Cormorant Garamond',serif; font-size:16px; color:#2C2C2A; line-height:1.55">${sugestao}</p>
              </div>
            </td></tr>

            ${sentinelaFalhasHoje > 0 ? `<tr><td style="padding-top:14px">
              <div style="background:#FBF2F1; border:1px solid rgba(192,57,43,.22); border-radius:12px; padding:12px 16px; font-size:13px; color:#C0392B">
                ⚠ Sentinela detectou <strong>${sentinelaFalhasHoje}</strong> falha(s) nas últimas 24h. <a href="https://www.sobasasas.com.br/admin" style="color:#C0392B; text-decoration:underline">Ver detalhes</a>
              </div>
            </td></tr>` : ''}

            <!-- Rodapé -->
            <tr><td align="center" style="padding-top:30px">
              <p style="margin:0; font-size:12px; color:#5F5E5A; line-height:1.6">
                Pulse Diário · gerado automaticamente todo dia 8h<br>
                <a href="https://www.sobasasas.com.br/admin" style="color:#BA7517; text-decoration:none">Painel completo →</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;

    await enviarEmail({
      to: ALERT_TO,
      subject: `🪽 Pulse · ${cadastros24h} cadastros, ${trialsHoje} trials, ${assinaturasHoje} assinaturas`,
      html,
    });

    return res.status(200).json({
      ok: true,
      cadastros: cadastros24h,
      trials: trialsHoje,
      assinaturas: assinaturasHoje,
      presentes: presentesHoje,
      pedidos: pedidosHoje,
    });
  } catch (e) {
    console.error('[cron-pulse-diario]', e?.message);
    return res.status(500).json({ ok: false, erro: e.message });
  }
}
