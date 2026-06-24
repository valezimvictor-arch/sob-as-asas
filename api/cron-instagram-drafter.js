// GET /api/cron-instagram-drafter — Agente que rascunha posts pro Instagram.
// Roda 3x/semana (seg, qua, sex às 9h BRT). Monta sugestão de post:
//   - Texto (quote do anjo do dia + convite à prática)
//   - Hashtags otimizadas pro nicho
//   - Sugestão visual (descrição pra equipe gráfica criar imagem)
// Envia email pra Monica/equipe revisar e postar manualmente.
//
// NOTA: posting AUTOMÁTICO direto no Instagram exige:
//   1. Conta Instagram BUSINESS (não Creator nem Pessoal)
//   2. Vinculação a uma página Facebook
//   3. Token long-lived da Meta Graph API
//   4. App registrado na Meta Developers
// Esses passos têm fricção (24-48h de aprovação + setup operacional).
//
// Este agente entrega o RASCUNHO PRONTO. Postar leva 30 segundos manualmente.
// Quando o volume justificar, ativamos auto-post.

import { enviarEmail } from './_lib/resend.js';
import fs from 'fs';
import path from 'path';

const DRAFT_TO = process.env.INSTAGRAM_DRAFT_TO || process.env.SMOKE_ALERT_TO || 'vv@unitedmfo.com.br';

function carregarAnjos() {
  try {
    const file = path.join(process.cwd(), 'data', 'anjos-conteudo.json');
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) { return null; }
}

// Anjo do dia — rotação determinística baseada no dia do ano
function anjoDoDia(dados, agora) {
  if (!dados) return null;
  const inicioAno = new Date(agora.getFullYear(), 0, 1);
  const dia = Math.floor((agora - inicioAno) / 86400000);
  const n = ((dia - 1) % 72) + 1;
  return dados[String(Math.max(1, n))];
}

// Templates de copy — 3 estilos rotacionais (evita repetição)
const TEMPLATES_COPY = [
  // Estilo 1 — quote contemplativo
  (anjo) => `${anjo.afirmacao || ''}

— ${anjo.nome}, anjo ${anjo.dom_principal ? 'da ' + anjo.dom_principal.toLowerCase() : ''}

Está no ${anjo.salmo_ref || ''}. Sob as asas.`,

  // Estilo 2 — convite à prática
  (anjo) => `Hoje o anjo da hora é ${anjo.nome}.

Ele rege das ${anjo.horario}. Se você está nesse intervalo, é o momento dele estar mais perto.

A prática é simples:
• Acenda uma vela
• Diga: "${anjo.afirmacao || ''}"
• Fique 1 minuto em silêncio

Sob as asas dele, você não está sozinha.`,

  // Estilo 3 — pergunta + revelação
  (anjo) => `Você sabe qual é o anjo das ${anjo.dom_principal ? anjo.dom_principal.toLowerCase() : 'horas'}?

É ${anjo.nome}. Do coro dos ${anjo.coro}.

${anjo.atributos || ''}

Pra invocá-lo, basta dizer o nome dele três vezes, em voz baixa, com calma. Ele escuta.

(Quer saber qual é o SEU anjo? Link na bio.)`,
];

const HASHTAGS_FIXAS = '#sobasasas #monicabuonfiglio #anjosdeguarda #72anjos #espiritualidade #angelologia #cabala #fé #oração #pratica';

function sugestaoVisual(anjo) {
  // Descrição do visual ideal pro grafista/Monica criar
  const cor = anjo.elemento === 'Fogo' ? 'tons de vermelho-dourado' :
              anjo.elemento === 'Água' ? 'tons de azul-prateado' :
              anjo.elemento === 'Terra' ? 'tons de verde-musgo dourado' :
              'tons de dourado-marfim';
  return `Fundo: ${cor}. Sigilo cabalístico de ${anjo.nome} no centro (rosácea de 8 pétalas + número ${anjo.n} em Playfair). Textura sutil de papel envelhecido. Nome "${anjo.nome}" em serif elegante. Logo Sob as Asas pequeno no rodapé.`;
}

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  try {
    const dados = carregarAnjos();
    if (!dados) return res.status(500).json({ ok: false, erro: 'anjos-conteudo.json não encontrado' });

    const agora = new Date();
    const anjo = anjoDoDia(dados, agora);
    if (!anjo) return res.status(500).json({ ok: false, erro: 'anjo não encontrado' });

    // Escolhe template rotacionalmente (seg=0, qua=1, sex=2)
    const diaSemana = agora.getDay();  // 1=seg, 3=qua, 5=sex
    const idxTemplate = diaSemana === 1 ? 0 : diaSemana === 3 ? 1 : 2;
    const copy = TEMPLATES_COPY[idxTemplate](anjo);
    const visual = sugestaoVisual(anjo);

    const htmlNotif = `<!doctype html><html><body style="font-family:-apple-system,sans-serif; background:#FBFAF7; color:#2C2C2A; padding:30px; max-width:560px; margin:0 auto">
      <div style="text-align:center">
        <div style="font-size:28px">📱</div>
        <h1 style="margin:8px 0 4px; font-family:Georgia,'Playfair Display',serif; font-weight:400; font-size:22px">Sugestão de post pro Instagram</h1>
        <p style="margin:0; font-size:13px; color:#5F5E5A">${agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} · anjo: <strong style="color:#BA7517">${anjo.nome}</strong></p>
      </div>

      <div style="background:#fff; border:1px solid rgba(186,117,23,.16); border-radius:14px; padding:20px; margin:24px 0">
        <p style="margin:0 0 8px; font-size:11px; letter-spacing:.16em; color:#BA7517; text-transform:uppercase; font-weight:600">Texto da legenda</p>
        <pre style="margin:0; font-family:inherit; font-size:14.5px; color:#2C2C2A; line-height:1.6; white-space:pre-wrap">${copy}

${HASHTAGS_FIXAS}</pre>
      </div>

      <div style="background:#FAF3E4; border-left:3px solid #BA7517; border-radius:0 10px 10px 0; padding:14px 18px; margin:16px 0">
        <p style="margin:0 0 6px; font-size:11px; letter-spacing:.16em; color:#BA7517; text-transform:uppercase; font-weight:600">Sugestão visual</p>
        <p style="margin:0; font-size:14px; color:#2C2C2A; line-height:1.55">${visual}</p>
      </div>

      <p style="font-size:13px; color:#5F5E5A; line-height:1.65; margin-top:24px">
        <strong>Próximo passo:</strong> equipe gráfica monta a arte (template + nome do anjo), Monica revisa, publica.
      </p>
      <p style="font-size:11.5px; color:#9F9D98; text-align:center; margin-top:30px">Instagram Drafter · seg/qua/sex 9h · Sob as Asas · LVSV Ventures</p>
    </body></html>`;

    await enviarEmail({
      to: DRAFT_TO,
      subject: `📱 Post Instagram pra hoje · ${anjo.nome}`,
      html: htmlNotif,
    });

    return res.status(200).json({ ok: true, anjo: anjo.nome, idxTemplate });
  } catch (e) {
    console.error('[cron-instagram-drafter]', e?.message);
    return res.status(500).json({ ok: false, erro: e.message });
  }
}
