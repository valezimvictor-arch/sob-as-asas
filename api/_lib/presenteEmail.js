// Template HTML do email enviado ao destinatário do presente.
// Inspirado no design do email-magic-link.html (light mode forçado, table-based
// pra compatibilidade com Outlook/Gmail/Apple Mail).

export function emailPresenteHtml({ paraNome, deNome, mensagem, codigo, link }) {
  const safeNome = (paraNome || '').split(' ')[0] || 'querida';
  const msgBloco = mensagem ? `
    <tr><td style="padding:6px 0">
      <div style="background:#FAF3E4; border-radius:14px; padding:18px 22px; margin:8px 0 4px">
        <p style="margin:0 0 8px; font-size:11px; letter-spacing:.2em; color:#BA7517; text-transform:uppercase; font-weight:600;">${esc(deNome)} escreveu</p>
        <p style="margin:0; font-family:'Cormorant Garamond',Georgia,serif; font-style:italic; font-size:17px; color:#2C2C2A; line-height:1.55;">"${esc(mensagem)}"</p>
      </div>
    </td></tr>` : '';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Sob as Asas — você recebeu um presente</title>
<style type="text/css">
  :root { color-scheme: light only; supported-color-schemes: light only; }
  @media (prefers-color-scheme: dark) {
    .force-light{ background-color:#FBFAF7 !important; color:#2C2C2A !important; }
    .force-light-card{ background-color:#FFFFFF !important; border-color:rgba(186,117,23,.18) !important; }
    .force-tinta{ color:#2C2C2A !important; }
    .force-suave{ color:#5F5E5A !important; }
    .force-ouro{ color:#BA7517 !important; }
  }
  body, table, td { font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  a { color:#BA7517 !important; }
</style>
</head>
<body class="force-light" style="margin:0; padding:0; background-color:#FBFAF7 !important; color:#2C2C2A !important;">

<div style="display:none; max-height:0; overflow:hidden; font-size:1px; color:#FBFAF7;">
  ${esc(deNome)} preparou um presente pra você no Sob as Asas — um ano inteiro com Monica Buonfiglio.
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="force-light" style="background-color:#FBFAF7 !important;">
  <tr><td align="center" style="padding:40px 16px 60px;">

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;">

      <!-- Topo: marca -->
      <tr><td align="center" style="padding-bottom:30px;">
        <div style="font-size:34px; color:#EF9F27; line-height:1;">&#10022;</div>
        <h1 style="margin:10px 0 4px; font-family:Georgia,'Playfair Display',serif; font-weight:400; font-size:30px; color:#2C2C2A !important;" class="force-tinta">Sob as Asas</h1>
        <p style="margin:0; font-family:Georgia,'Cormorant Garamond',serif; font-style:italic; font-size:15px; color:#BA7517 !important;" class="force-ouro">por Monica Buonfiglio</p>
      </td></tr>

      <!-- Card central -->
      <tr><td class="force-light-card" style="background-color:#FFFFFF !important; border:1px solid rgba(186,117,23,0.16); border-radius:22px; padding:34px 26px 30px;">

        <p style="margin:0 0 6px; font-size:12px; letter-spacing:.22em; color:#BA7517 !important; text-transform:uppercase; font-weight:600; text-align:center;" class="force-ouro">Você recebeu um presente</p>

        <h2 style="margin:14px 0 18px; font-family:Georgia,'Playfair Display',serif; font-weight:400; font-size:24px; color:#2C2C2A !important; text-align:center; line-height:1.3;" class="force-tinta">
          ${esc(safeNome)}, ${esc(deNome)} preparou algo especial pra você
        </h2>

        ${msgBloco}

        <p style="margin:18px 0 12px; font-family:Georgia,'Cormorant Garamond',serif; font-size:16px; color:#2C2C2A !important; line-height:1.65; text-align:center;" class="force-tinta">
          Um <strong>ano inteiro</strong> no Sob as Asas — uma prática diária com os 72 anjos cabalísticos, ao lado de Monica Buonfiglio.
          <br><br>
          Salmo do dia na voz dela, mensagem mensal do seu anjo, magia das velas, novena e muito mais. <strong>Sem custo nenhum pra você</strong> — ${esc(deNome)} já cuidou disso.
        </p>

        <hr style="border:none; border-top:1px solid rgba(186,117,23,.14); margin:24px 0;" />

        <p style="margin:0 0 8px; font-size:11px; letter-spacing:.2em; color:#BA7517 !important; text-transform:uppercase; font-weight:600; text-align:center;" class="force-ouro">Seu código de resgate</p>
        <div style="text-align:center; padding:18px 0;">
          <div style="display:inline-block; padding:14px 28px; background:#FAF3E4; border:2px solid #EF9F27; border-radius:14px;">
            <p style="margin:0; font-family:Menlo,'Courier New',monospace; font-size:22px; letter-spacing:.12em; color:#2C2C2A !important; font-weight:600;" class="force-tinta">${esc(codigo)}</p>
          </div>
        </div>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr><td align="center" style="padding:6px 0;">
            <a href="${esc(link)}" style="display:inline-block; font-family:-apple-system,Helvetica,Arial,sans-serif; font-weight:600; font-size:15px; color:#5A3A06 !important; background-color:#F6C868; background-image:linear-gradient(180deg,#F6C868,#D89A2C); padding:14px 32px; border-radius:14px; text-decoration:none;">
              Resgatar meu presente
            </a>
          </td></tr>
        </table>

        <p style="margin:18px 0 0; font-size:11.5px; color:#5F5E5A !important; line-height:1.6; text-align:center;" class="force-suave">
          Ou acesse <a href="https://sobasasas.com.br/resgatar" style="color:#BA7517 !important;">sobasasas.com.br/resgatar</a> e digite o código acima.
          <br>Válido por 1 ano. Acesso individual e intransferível.
        </p>

        <hr style="border:none; border-top:1px solid rgba(186,117,23,.14); margin:24px 0 18px;" />

        <p style="margin:0; font-family:Georgia,'Cormorant Garamond',serif; font-style:italic; font-size:16px; color:#BA7517 !important; text-align:center; line-height:1.55;" class="force-ouro">
          "Você não chega aqui por acaso.<br>Seu anjo te trouxe."
        </p>
      </td></tr>

      <!-- Rodapé -->
      <tr><td align="center" style="padding:24px 12px 0;">
        <p style="margin:0; font-size:11.5px; color:#5F5E5A !important; line-height:1.65;" class="force-suave">
          Sob as Asas &middot; uma realização <strong style="color:#5F5E5A !important;" class="force-suave">LVSV Ventures Participações Ltda.</strong><br>
          CNPJ 66.981.310/0001-42 &middot; <a href="https://sobasasas.com.br" style="color:#BA7517 !important; text-decoration:none;">sobasasas.com.br</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>

</body></html>`;
}

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
