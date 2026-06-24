// GET /api/cron-newsletter-draft — Agente que rascunha newsletter semanal.
// Roda toda sexta às 17h BRT (20h UTC). Usa o GeradorTextos pra criar
// um rascunho pronto na tabela `newsletters` (status='rascunho')
// e envia notificação por email pra Vinicius/Monica revisarem antes do envio
// automático de sábado 8h.
//
// Sem isso, você precisa lembrar de escrever toda sexta. Com isso,
// o app puxa o anjo da semana, monta tudo, e o trabalho seu é APROVAR
// (ou ajustar) em 5 minutos no /admin → ✉️ Newsletter.

import { enviarEmail } from './_lib/resend.js';
import { supabase } from './_lib/supabase.js';
import fs from 'fs';
import path from 'path';

const APP_URL = process.env.APP_URL || 'https://www.sobasasas.com.br';
const DRAFT_TO = process.env.NEWSLETTER_DRAFT_TO || process.env.SMOKE_ALERT_TO || 'vv@unitedmfo.com.br';

// Carrega dados dos 72 anjos (mesmo JSON que o app usa)
function carregarAnjos() {
  try {
    const file = path.join(process.cwd(), 'data', 'anjos-conteudo.json');
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return null;
  }
}

// Picks angel of the week — usa weekNum do ano pra rotação determinística
// dos 72. Garante que CADA anjo é coberto ao longo do ano (52 sem = 52 anjos
// por ano, ciclo completo em ~1.4 anos).
function anjoDaSemana(dados, agora) {
  if (!dados) return null;
  const inicioAno = new Date(agora.getFullYear(), 0, 1);
  const diasNoAno = Math.floor((agora - inicioAno) / 86400000);
  const semana = Math.floor(diasNoAno / 7);
  const n = (semana % 72) + 1;
  return dados[String(n)];
}

// Gera o objeto newsletter inteiro a partir do anjo
function montarNewsletter(anjo, dataReferencia) {
  if (!anjo) return null;
  const semanaIso = dataReferencia.toISOString().slice(0, 10);

  const corVela = anjo.elemento === 'Fogo' ? 'vermelha' : anjo.elemento === 'Água' ? 'azul' : anjo.elemento === 'Terra' ? 'verde' : 'branca';
  const primeiraPalavra = (anjo.dom_principal || '').split(/[\s,]+/).filter(Boolean)[0] || '';

  return {
    semana_de: semanaIso,
    publicado: false,  // ← RASCUNHO. Victor precisa publicar manualmente.
    subject: `Sua Carta dos Anjos desta semana 🕊️ · ${anjo.nome}`,
    preheader: `${anjo.nome}, do coro dos ${anjo.coro}, se aproxima esta semana. Uma prática curta + um salmo + uma frase pra carregar.`,
    anjo_nome: anjo.nome,
    anjo_datas: (anjo.regencia_dias || []).slice(0, 5).join(' · '),
    anjo_coro: anjo.coro || '',
    anjo_mensagem: `${anjo.atributos || ''}\n\n${anjo.quando_invocar ? 'Esta semana, lembre-se: ' + anjo.quando_invocar.charAt(0).toLowerCase() + anjo.quando_invocar.slice(1) : ''}`,
    monica_quote: `"${anjo.afirmacao || ''}" — leve essa frase no bolso da alma esta semana.`,
    pratica_titulo: `A vela de ${primeiraPalavra.toLowerCase()}`,
    pratica_passos: `<strong>1.</strong> Acenda uma vela ${corVela}. <strong>2.</strong> Leia em voz baixa: "${anjo.afirmacao || ''}" <strong>3.</strong> Fique em silêncio por 2 minutos com ${anjo.nome} ao seu lado.`,
    atualizado_em: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  try {
    const dados = carregarAnjos();
    if (!dados) return res.status(500).json({ ok: false, erro: 'anjos-conteudo.json não encontrado' });

    const agora = new Date();
    const anjo = anjoDaSemana(dados, agora);
    const rascunho = montarNewsletter(anjo, agora);
    if (!rascunho) return res.status(500).json({ ok: false, erro: 'falha ao montar rascunho' });

    // Já existe rascunho dessa semana? Não duplica.
    const { data: existente } = await supabase
      .from('newsletters')
      .select('id, publicado')
      .eq('semana_de', rascunho.semana_de)
      .maybeSingle();

    if (existente) {
      return res.status(200).json({
        ok: true,
        ja_existia: true,
        publicado: existente.publicado,
        anjo: anjo.nome,
      });
    }

    // Insere rascunho
    const { error: insErr } = await supabase.from('newsletters').insert(rascunho);
    if (insErr) {
      console.error('[cron-newsletter-draft] erro insert:', insErr.message);
      return res.status(500).json({ ok: false, erro: insErr.message });
    }

    // Notifica Vinicius/Monica
    const htmlNotif = `<!doctype html><html><body style="font-family:-apple-system,sans-serif; background:#FBFAF7; color:#2C2C2A; padding:30px; max-width:520px; margin:0 auto">
      <div style="text-align:center">
        <div style="font-size:28px; color:#EF9F27">&#10022;</div>
        <h1 style="margin:8px 0 0; font-family:Georgia,'Playfair Display',serif; font-weight:400; font-size:22px">Newsletter da semana — rascunho pronto</h1>
        <p style="margin:6px 0 0; font-family:Georgia,'Cormorant Garamond',serif; font-style:italic; color:#BA7517">Anjo desta semana: <strong>${anjo.nome}</strong></p>
      </div>
      <div style="background:#fff; border:1px solid rgba(186,117,23,.16); border-radius:14px; padding:20px; margin:24px 0">
        <p style="margin:0 0 8px; font-size:11px; letter-spacing:.16em; color:#BA7517; text-transform:uppercase; font-weight:600">Subject</p>
        <p style="margin:0 0 14px; font-size:15px">${rascunho.subject}</p>
        <p style="margin:0 0 8px; font-size:11px; letter-spacing:.16em; color:#BA7517; text-transform:uppercase; font-weight:600">Anjo · datas</p>
        <p style="margin:0 0 14px; font-size:14px; color:#5F5E5A">${anjo.coro} · ${rascunho.anjo_datas}</p>
        <p style="margin:0 0 8px; font-size:11px; letter-spacing:.16em; color:#BA7517; text-transform:uppercase; font-weight:600">Prática</p>
        <p style="margin:0; font-size:14px; color:#2C2C2A; line-height:1.65"><strong>${rascunho.pratica_titulo}</strong></p>
      </div>
      <p style="font-size:14px; color:#2C2C2A; line-height:1.65">
        O rascunho está em <strong>status='rascunho'</strong> no banco — <strong>não será enviado automaticamente</strong>.
      </p>
      <p style="font-size:14px; color:#2C2C2A; line-height:1.65">
        Pra revisar e publicar:
      </p>
      <ol style="font-size:14px; color:#2C2C2A; line-height:1.8">
        <li>Acesse <a href="${APP_URL}/admin" style="color:#BA7517">${APP_URL}/admin</a></li>
        <li>Aba <strong>✉️ Newsletter</strong></li>
        <li>Edite o que quiser</li>
        <li>Clica <strong>"Publicar"</strong></li>
        <li>Sábado 8h o cron envia pra toda a base</li>
      </ol>
      <p style="font-size:12px; color:#5F5E5A; margin-top:24px; text-align:center">Drafter automático sexta 17h · Sob as Asas · LVSV Ventures</p>
    </body></html>`;

    await enviarEmail({
      to: DRAFT_TO,
      subject: `📝 Newsletter rascunhada · ${anjo.nome} (revise até sábado 8h)`,
      html: htmlNotif,
    });

    return res.status(200).json({
      ok: true,
      anjo: anjo.nome,
      semana_de: rascunho.semana_de,
      publicado: false,
    });
  } catch (e) {
    console.error('[cron-newsletter-draft]', e?.message);
    return res.status(500).json({ ok: false, erro: e.message });
  }
}
