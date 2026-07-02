#!/usr/bin/env node
// Converte ROTEIROS_MENSAGENS_SEMANAIS.md → ROTEIROS_MENSAGENS_SEMANAIS.pdf usando Chrome headless.
// Sem dependências externas — usa parser MD simples + Chrome do macOS.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MD = path.join(ROOT, 'ROTEIROS_MENSAGENS_SEMANAIS.md');
const HTML_TMP = path.join(ROOT, '.tmp-semanais.html');
const PDF = path.join(ROOT, 'ROTEIROS_MENSAGENS_SEMANAIS.pdf');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// ── Parser Markdown simples (suficiente pro nosso conteúdo) ──
function mdParaHtml(md) {
  const linhas = md.split('\n');
  let html = '';
  let dentroBlockquote = false;
  let dentroLista = false;

  function escapaHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function processaInline(t) {
    return t
      // bold (**texto**)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // italic (*texto*)
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
      // código inline `coisa`
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // links [texto](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  for (let i = 0; i < linhas.length; i++) {
    let linha = linhas[i];

    // h1 (# titulo)
    if (/^# /.test(linha)) {
      html += '<h1>' + processaInline(escapaHtml(linha.replace(/^# /, ''))) + '</h1>\n';
      continue;
    }
    // h2 (## titulo)
    if (/^## /.test(linha)) {
      html += '<h2>' + processaInline(escapaHtml(linha.replace(/^## /, ''))) + '</h2>\n';
      continue;
    }
    // h3 (### titulo)
    if (/^### /.test(linha)) {
      html += '<h3>' + processaInline(escapaHtml(linha.replace(/^### /, ''))) + '</h3>\n';
      continue;
    }
    // hr (---)
    if (/^---\s*$/.test(linha)) {
      html += '<hr>\n';
      continue;
    }
    // blockquote (> texto)
    if (/^>\s/.test(linha)) {
      if (!dentroBlockquote) { html += '<blockquote>\n'; dentroBlockquote = true; }
      html += '<p>' + processaInline(escapaHtml(linha.replace(/^>\s/, ''))) + '</p>\n';
      continue;
    } else if (dentroBlockquote) {
      html += '</blockquote>\n';
      dentroBlockquote = false;
    }
    // lista (- ou * ou numerada 1.)
    if (/^[-*]\s/.test(linha) || /^\d+\.\s/.test(linha)) {
      if (!dentroLista) { html += '<ul>\n'; dentroLista = true; }
      html += '<li>' + processaInline(escapaHtml(linha.replace(/^([-*]|\d+\.)\s/, ''))) + '</li>\n';
      continue;
    } else if (dentroLista) {
      html += '</ul>\n';
      dentroLista = false;
    }
    // linha vazia (separa parágrafos)
    if (/^\s*$/.test(linha)) {
      html += '\n';
      continue;
    }
    // parágrafo normal
    html += '<p>' + processaInline(escapaHtml(linha)) + '</p>\n';
  }
  if (dentroBlockquote) html += '</blockquote>\n';
  if (dentroLista) html += '</ul>\n';
  return html;
}

// ── CSS book-style contemplativo ──
const CSS = `
  @page { size: A4; margin: 25mm 22mm 22mm 22mm; }
  @page :first { margin-top: 35mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'EB Garamond', Georgia, 'Times New Roman', serif;
    font-size: 11.5pt;
    line-height: 1.65;
    color: #2C2C2A;
    background: #FBFAF7;
  }

  /* Capa (primeiro h1) */
  h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 500;
    font-size: 32pt;
    text-align: center;
    color: #2C2C2A;
    margin: 30mm 0 8mm;
    letter-spacing: 0.01em;
    page-break-after: always;
  }

  /* h2 = título de cada anjo — começa em nova página */
  h2 {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 500;
    font-size: 22pt;
    color: #BA7517;
    margin: 0 0 4mm;
    page-break-before: always;
    page-break-after: avoid;
    border-bottom: 1px solid rgba(186,117,23,0.18);
    padding-bottom: 4mm;
  }
  /* Mas o primeiro h2 depois da capa NÃO precisa de page-break porque a capa já fez */
  h1 + h2 { page-break-before: auto; }

  h3 {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 500;
    font-size: 14pt;
    color: #BA7517;
    margin: 8mm 0 3mm;
    page-break-after: avoid;
  }

  p { margin: 0 0 3mm; }

  /* Blockquote = metadados do anjo (coro, príncipe, horário) */
  blockquote {
    background: #FAF3E4;
    border-left: 3px solid #BA7517;
    padding: 4mm 5mm;
    margin: 0 0 6mm;
    font-style: italic;
    color: #5A3A06;
    font-size: 10pt;
    line-height: 1.5;
    page-break-inside: avoid;
  }
  blockquote p { margin: 1mm 0; }

  hr {
    border: none;
    border-top: 1px solid rgba(186,117,23,0.22);
    margin: 6mm 0;
  }

  strong { color: #2C2C2A; font-weight: 600; }
  em { font-style: italic; color: #BA7517; }

  /* Indicações de pausa: [...] [pausa] [pausa longa] e [INSTRUÇÕES] */
  /* Não dá pra estilizar via simple parser — vai como texto normal */

  /* Listas (índice) */
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    column-count: 2;
    column-gap: 8mm;
  }
  ul li {
    padding: 1.5mm 0;
    font-size: 10.5pt;
    break-inside: avoid;
  }

  /* Code (naming dos arquivos) */
  code {
    font-family: Menlo, 'Courier New', monospace;
    font-size: 9pt;
    background: #FAF3E4;
    padding: 0.5mm 1.5mm;
    border-radius: 2pt;
    color: #7C4E0F;
  }

  a { color: #BA7517; text-decoration: none; }

  /* Numeração de página no rodapé */
  @page { @bottom-center { content: counter(page) " / " counter(pages); font-size: 9pt; color: #7C4E0F; } }

  /* Marca d'água sutil — Sob as Asas no canto superior */
  body::before {
    content: "Sob as Asas · Roteiros 72 Anjos · Monica Buonfiglio";
    position: fixed;
    top: 8mm;
    left: 0; right: 0;
    text-align: center;
    font-size: 8pt;
    color: #BA7517;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
`;

// ── Pipeline ──
console.log('• Lendo Markdown...');
const md = fs.readFileSync(MD, 'utf-8');

console.log('• Convertendo MD → HTML...');
const corpo = mdParaHtml(md);

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Sob as Asas — Roteiros dos 72 Anjos</title>
<style>${CSS}</style>
</head>
<body>
${corpo}
</body>
</html>
`;

fs.writeFileSync(HTML_TMP, html, 'utf-8');
console.log('  HTML temp: ' + HTML_TMP);

console.log('• Gerando PDF via Chrome headless...');
const cmd = `"${CHROME}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${PDF}" --print-to-pdf-no-header "file://${HTML_TMP}"`;
try {
  execSync(cmd, { stdio: 'pipe' });
} catch (e) {
  console.error('Erro:', e.message);
  process.exit(1);
}

// Limpa tmp
try { fs.unlinkSync(HTML_TMP); } catch (_) {}

const stat = fs.statSync(PDF);
console.log('✓ Gerado: ' + PDF);
console.log('  Tamanho: ' + (stat.size / 1024 / 1024).toFixed(2) + ' MB');
