// GET /api/cron-newsletter — Carta dos Anjos semanal (sábado 8h BRT)
// Headers: x-vercel-cron=1 (auto) ou x-admin-key (envio manual via admin).
// Query: ?preview=1  → não envia, retorna HTML de preview
//        ?preview=1&email=foo@bar  → envia só para esse e-mail
//        ?dryrun=1   → conta destinatários, não envia
//
// Lê o conteúdo da semana de public.newsletters (linha mais recente publicada).
// Se não houver, monta um conteúdo padrão a partir do anjo da semana corrente.

import { supabase } from './_lib/supabase.js';
import { enviarEmail } from './_lib/resend.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.resolve(__dirname, '..', 'email-newsletter-template.html');
let TEMPLATE_CACHE = null;

function loadTemplate() {
  if (TEMPLATE_CACHE) return TEMPLATE_CACHE;
  TEMPLATE_CACHE = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  return TEMPLATE_CACHE;
}

function render(tpl, dados) {
  return Object.entries(dados).reduce(
    (acc, [k, v]) => acc.split(`{{${k}}}`).join(v ?? ''),
    tpl
  );
}

function escHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function semanaDoAno(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - start) / 86400000);
  return Math.ceil((days + start.getDay() + 1) / 7);
}

// Conteúdo padrão se newsletter da semana não tiver sido cadastrada no banco
function montarConteudoDefault() {
  return {
    subject: 'Sua Carta dos Anjos desta semana 🕊️',
    preheader: 'Anjo da semana, mensagem da Monica e uma prática curta para os próximos dias.',
    anjo_nome: 'Vehuiah',
    anjo_datas: '21 a 25 de março',
    anjo_coro: 'Serafins',
    anjo_mensagem: 'Vehuiah é o anjo do começo, da força que se levanta antes do amanhecer. Esta semana, recomece — mesmo que seja um gesto pequeno. O fim do ano ainda está longe; o que importa é o passo que você dá agora.',
    monica_quote: 'Anjos não atendem por sorteio. Eles atendem por presença. Esse app é o lugar onde a presença vira hábito.',
    pratica_titulo: 'A vela do recomeço',
    pratica_passos: '<strong>1.</strong> Acenda uma vela branca em um lugar silencioso. <strong>2.</strong> Diga, baixinho: "Vehuiah, anjo do começo, me dá a coragem do primeiro passo." <strong>3.</strong> Fique em silêncio por 1 minuto. Repita por 3 noites seguidas.',
  };
}

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  const isPreview = req.query.preview === '1';
  const isDryRun = req.query.dryrun === '1';
  const onlyEmail = (req.query.email || '').toString().trim().toLowerCase();

  // 1) Carrega conteúdo: tenta tabela newsletters; se vazio, usa default.
  let conteudo = null;
  try {
    const { data } = await supabase
      .from('newsletters')
      .select('*')
      .eq('publicado', true)
      .order('semana_de', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      conteudo = {
        subject: data.subject || 'Sua Carta dos Anjos desta semana 🕊️',
        preheader: data.preheader || '',
        anjo_nome: data.anjo_nome,
        anjo_datas: data.anjo_datas,
        anjo_coro: data.anjo_coro,
        anjo_mensagem: data.anjo_mensagem,
        monica_quote: data.monica_quote,
        pratica_titulo: data.pratica_titulo,
        pratica_passos: data.pratica_passos,
      };
    }
  } catch (_) { /* tabela pode não existir ainda */ }
  if (!conteudo) conteudo = montarConteudoDefault();

  const tpl = loadTemplate();
  const semana = semanaDoAno();

  function montarHtml(unsubToken) {
    const unsubUrl = `https://www.sobasasas.com.br/api/newsletter-unsub?token=${encodeURIComponent(unsubToken || 'preview')}`;
    return render(tpl, {
      SUBJECT: escHtml(conteudo.subject),
      PREHEADER: escHtml(conteudo.preheader),
      SEMANA: String(semana),
      ANJO_NOME: escHtml(conteudo.anjo_nome),
      ANJO_DATAS: escHtml(conteudo.anjo_datas),
      ANJO_CORO: escHtml(conteudo.anjo_coro),
      ANJO_MENSAGEM: escHtml(conteudo.anjo_mensagem),
      MONICA_QUOTE: escHtml(conteudo.monica_quote),
      PRATICA_TITULO: escHtml(conteudo.pratica_titulo),
      PRATICA_PASSOS: conteudo.pratica_passos, // permite negrito básico já sanitizado pela curadoria
      UNSUB_URL: unsubUrl,
    });
  }

  // Preview rápido
  if (isPreview && !onlyEmail) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(montarHtml('preview'));
  }

  // 2) Lista de destinatários: leads com newsletter_optout=false
  let alvos;
  if (onlyEmail) {
    alvos = [{ email: onlyEmail, unsub_token: 'preview' }];
  } else {
    const { data, error } = await supabase
      .from('leads')
      .select('email, unsub_token')
      .or('newsletter_optout.is.null,newsletter_optout.eq.false');
    if (error) return res.status(500).json({ ok: false, error: error.message });
    alvos = (data || []).filter(x => x.email);
  }

  if (isDryRun) return res.status(200).json({ ok: true, total: alvos.length });

  // 3) Envia
  let enviados = 0, falhas = 0, exemplos = [];
  for (const a of alvos) {
    try {
      const html = montarHtml(a.unsub_token);
      await enviarEmail({
        to: a.email,
        subject: conteudo.subject,
        html,
        headers: {
          'List-Unsubscribe': `<https://www.sobasasas.com.br/api/newsletter-unsub?token=${encodeURIComponent(a.unsub_token || '')}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      enviados++;
    } catch (e) {
      falhas++;
      if (exemplos.length < 3) exemplos.push({ email: a.email, erro: e.message });
    }
  }

  return res.status(200).json({ ok: true, total: alvos.length, enviados, falhas, exemplos, semana });
}
