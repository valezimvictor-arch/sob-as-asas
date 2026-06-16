// GET /api/newsletter-unsub?token=xxx
// One-click unsubscribe (LGPD + RFC 8058 List-Unsubscribe-Post).
// Marca newsletter_optout=true no lead correspondente ao token.

import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  const token = (req.query.token || '').toString().trim();

  function pagina(titulo, msg, ok) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${titulo} — Sob as Asas</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Cormorant+Garamond:wght@400&family=Manrope:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  body{margin:0; padding:64px 24px; background:#FBFAF7; color:#2C2C2A; font-family:'Manrope',sans-serif; text-align:center;}
  .wrap{max-width:480px; margin:0 auto;}
  h1{font-family:'Playfair Display',serif; font-weight:400; font-size:30px; margin:18px 0 6px;}
  .sub{font-family:'Cormorant Garamond',serif; font-style:italic; font-size:18px; color:#BA7517;}
  p{font-size:15px; color:#5F5E5A; line-height:1.7; margin-top:20px;}
  a.btn{display:inline-block; margin-top:30px; padding:13px 26px; background:linear-gradient(180deg,#F6C868,#D89A2C); color:#5A3A06; text-decoration:none; border-radius:14px; font-weight:600;}
</style>
</head><body><div class="wrap">
<div style="font-size:36px; color:#EF9F27">✦</div>
<h1>${titulo}</h1>
<p class="sub">Sob as Asas</p>
<p>${msg}</p>
<a class="btn" href="https://www.sobasasas.com.br">Voltar ao app</a>
</div></body></html>`);
  }

  if (!token) return pagina('Link inválido', 'Não recebi um token de identificação. Se você estava tentando sair da Carta dos Anjos, abra o e-mail novamente e clique pelo link.', false);

  // Marca opt-out
  const { data, error } = await supabase
    .from('leads')
    .update({ newsletter_optout: true, optout_em: new Date().toISOString() })
    .eq('unsub_token', token)
    .select('email')
    .maybeSingle();

  if (error || !data) {
    return pagina('Não encontramos seu cadastro', 'Talvez o link tenha expirado, ou você já tenha saído antes. De qualquer forma — não enviaremos mais a Carta dos Anjos para esse e-mail.', false);
  }

  return pagina('Pronto, você saiu', `Não enviaremos mais a Carta dos Anjos para <strong>${escHtml(data.email)}</strong>. Se mudar de ideia, basta se cadastrar de novo na <a href="https://www.sobasasas.com.br/landing" style="color:#BA7517">página de pré-lançamento</a>.`, true);
}

function escHtml(s) {
  return String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}
