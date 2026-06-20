#!/usr/bin/env node
// Gera 72 páginas SEO estáticas em /anjo/<slug>.html a partir de data/anjos-conteudo.json
// Atualiza sitemap.xml com as 72 URLs.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANJOS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/anjos-conteudo.json'), 'utf-8'));
const OUT_DIR = path.join(ROOT, 'anjo');
const BASE = 'https://www.sobasasas.com.br';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function slugify(s) {
  return s.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function pagina(anjo) {
  const slug = slugify(anjo.nome);
  const titulo = `${anjo.nome} — Anjo nº ${anjo.n} dos 72 nomes cabalísticos`;
  const desc = `${anjo.nome}, anjo do coro dos ${anjo.coro}. Dom: ${anjo.dom_principal}. Salmo, oração e horário de regência (${anjo.horario}).`;
  const url = `${BASE}/anjo/${slug}.html`;
  const ano = '2026';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Sob as Asas">
<meta property="og:image" content="${BASE}/asa-icon.svg">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/asa-icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=EB+Garamond:ital@0;1&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify({
  "@context":"https://schema.org",
  "@type":"Article",
  "headline": titulo,
  "description": desc,
  "datePublished": `${ano}-06-19`,
  "author": {"@type":"Person","name":"Monica Buonfiglio"},
  "publisher": {"@type":"Organization","name":"Sob as Asas","logo":{"@type":"ImageObject","url":`${BASE}/asa-icon.svg`}},
  "mainEntityOfPage": url
})}</script>
<style>
:root{
  --ouro:#BA7517; --ouro-claro:#EF9F27; --ouro-bg:#FAF3E4;
  --bg:#FBFAF7; --tinta:#1F1F1D; --suave:#5F5E5A; --linha:rgba(186,117,23,.16);
}
*{box-sizing:border-box}
body{margin:0; font-family:'Manrope',-apple-system,sans-serif; background:var(--bg); color:var(--tinta); line-height:1.65;}
.wrap{max-width:680px; margin:0 auto; padding:32px 22px 80px;}
header{text-align:center; padding:8px 0 28px;}
.brand{font-family:'Playfair Display',Georgia,serif; font-size:22px; color:var(--ouro); letter-spacing:.02em;}
.brand-sub{font-family:'EB Garamond',Georgia,serif; font-style:italic; font-size:13px; color:var(--suave); margin-top:2px;}
h1{font-family:'Playfair Display',Georgia,serif; font-weight:500; font-size:38px; letter-spacing:.005em; margin:24px 0 6px; line-height:1.15;}
.subtit{font-family:'EB Garamond',Georgia,serif; font-style:italic; font-size:18px; color:var(--ouro); margin:0 0 28px;}
.bloco{background:#fff; border:1px solid var(--linha); border-radius:18px; padding:22px 22px; margin:18px 0;}
.bloco h2{font-family:'Playfair Display',Georgia,serif; font-weight:500; font-size:22px; margin:0 0 12px; color:var(--ouro);}
.bloco p{margin:0 0 10px;}
.serif{font-family:'EB Garamond',Georgia,serif; font-size:19px; line-height:1.55;}
.kv{display:flex; gap:14px; flex-wrap:wrap; font-size:14px; color:var(--suave); margin:0 0 24px;}
.kv span{background:var(--ouro-bg); padding:6px 12px; border-radius:99px; color:var(--ouro);}
.salmo{background:var(--ouro-bg); border-radius:14px; padding:18px 20px; font-family:'EB Garamond',Georgia,serif; font-style:italic; font-size:18px; color:var(--tinta);}
.salmo .ref{display:block; font-style:normal; font-size:13px; color:var(--ouro); margin-top:8px;}
.cta{display:block; text-align:center; background:linear-gradient(180deg,#F6C868,#D89A2C); color:#5A3A06; text-decoration:none; padding:16px 22px; border-radius:14px; font-weight:600; margin:32px 0 14px;}
.cta-sub{text-align:center; font-size:13px; color:var(--suave); margin:0 0 30px;}
.dons{list-style:none; padding:0; margin:8px 0 0; display:flex; gap:8px; flex-wrap:wrap;}
.dons li{background:#fff; border:1px solid var(--linha); border-radius:99px; padding:6px 12px; font-size:13px;}
.nav-anjos{display:flex; justify-content:space-between; gap:12px; margin-top:36px; font-size:14px;}
.nav-anjos a{color:var(--ouro); text-decoration:none;}
.rodape{text-align:center; font-size:12px; color:var(--suave); margin-top:46px; padding-top:22px; border-top:1px solid var(--linha);}
.rodape a{color:var(--ouro); text-decoration:none;}
</style>
</head>
<body>
<div class="wrap">

<header>
  <div class="brand">Sob as Asas</div>
  <div class="brand-sub">por Monica Buonfiglio</div>
</header>

<p class="kv">
  <span>Anjo nº ${anjo.n}</span>
  <span>${esc(anjo.coro)}</span>
  <span>Príncipe: ${esc(anjo.principe)}</span>
  <span>Elemento: ${esc(anjo.elemento||'')}</span>
</p>

<h1>${esc(anjo.nome)}</h1>
<p class="subtit">${esc(anjo.dom_principal)}</p>

<div class="bloco">
  <h2>Quem é ${esc(anjo.nome)}</h2>
  <p class="serif">${esc(anjo.atributos)}</p>
</div>

<div class="bloco">
  <h2>Quando invocar</h2>
  <p>${esc(anjo.quando_invocar)}</p>
  <h2 style="margin-top:18px">Dons que ${esc(anjo.nome)} traz</h2>
  <ul class="dons">${(anjo.dons_secundarios||[]).map(d=>`<li>${esc(d)}</li>`).join('')}</ul>
</div>

<div class="bloco">
  <h2>Horário de regência</h2>
  <p>${esc(anjo.nome)} rege diariamente o intervalo <strong>${esc(anjo.horario)}</strong>. É o momento de maior força da sua energia — ideal para meditar, orar ou pedir orientação.</p>
  <h2 style="margin-top:18px">Dias de regência no ano</h2>
  <p>${(anjo.regencia_dias||[]).map(esc).join(' · ')}</p>
</div>

<div class="bloco">
  <h2>Oração de ${esc(anjo.nome)}</h2>
  <p class="serif">${esc(anjo.invocacao)}</p>
</div>

<div class="bloco">
  <h2>Salmo de ${esc(anjo.nome)}</h2>
  <p class="salmo">"${esc(anjo.salmo_texto)}"<span class="ref">${esc(anjo.salmo_ref)} · Almeida Revista e Corrigida</span></p>
</div>

<div class="bloco">
  <h2>Afirmação para o dia</h2>
  <p class="serif">${esc(anjo.afirmacao)}</p>
</div>

<a href="/?anjo=${anjo.n}" class="cta">Praticar com ${esc(anjo.nome)} no app</a>
<p class="cta-sub">7 dias grátis · sem cartão para começar · R$ 19,90/mês ou R$ 149/ano</p>

<div class="bloco">
  <h2>Os 72 anjos cabalísticos</h2>
  <p>Os 72 nomes formam o <em>Shem HaMephorash</em> — o Nome Inefável de Deus dividido em 72 sílabas, conforme tradição cabalística. Cada anjo rege uma faixa de 20 minutos do dia e cinco dias específicos do ano. ${esc(anjo.nome)} é o ${anjo.n}º deles.</p>
  <p><a href="/" style="color:var(--ouro)">Descobrir meu anjo da guarda →</a></p>
</div>

<nav class="nav-anjos">
  ${anjo.n>1 ? `<a href="/anjo/${slugify(ANJOS[String(anjo.n-1)].nome)}.html">← ${esc(ANJOS[String(anjo.n-1)].nome)}</a>` : '<span></span>'}
  ${anjo.n<72 ? `<a href="/anjo/${slugify(ANJOS[String(anjo.n+1)].nome)}.html">${esc(ANJOS[String(anjo.n+1)].nome)} →</a>` : '<span></span>'}
</nav>

<div class="rodape">
  Sob as Asas · uma realização <strong>LVSV Ventures</strong><br>
  <a href="/">sobasasas.com.br</a> · <a href="/privacidade">Privacidade</a> · <a href="/termos">Termos</a>
</div>

</div>
</body>
</html>
`;
}

// Gera as 72 páginas
let urls = [];
for (let n = 1; n <= 72; n++) {
  const a = ANJOS[String(n)];
  if (!a) continue;
  const slug = slugify(a.nome);
  const html = pagina(a);
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html, 'utf-8');
  urls.push(`/anjo/${slug}.html`);
}
console.log(`✓ ${urls.length} páginas geradas em /anjo/`);

// Atualiza sitemap.xml
const sitemapPath = path.join(ROOT, 'sitemap.xml');
const novaSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE}/landing</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE}/privacidade</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
  <url><loc>${BASE}/termos</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
  <url><loc>${BASE}/regulamento-milagre</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
${urls.map(u => `  <url><loc>${BASE}${u}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(sitemapPath, novaSitemap, 'utf-8');
console.log(`✓ sitemap.xml atualizado com ${urls.length+5} URLs`);
