/**
 * Sob as Asas — Build script para Capacitor (iOS/Android)
 * Copia os arquivos estáticos para o diretório www/ que o Capacitor usa.
 *
 * Uso: node scripts/build.mjs
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WWW  = join(ROOT, 'www');

mkdirSync(WWW, { recursive: true });

const files = [
  'index.html',
  'config.js',
  'admin.html',
  'landing.html',
  'regulamento-milagre.html',
  'termos.html',
  'privacidade.html',
  'manifest.json',
  'asa-icon.svg',
  'sw.js',
];

let copied = 0;
for (const f of files) {
  const src = join(ROOT, f);
  const dst = join(WWW, f);
  if (existsSync(src)) {
    copyFileSync(src, dst);
    console.log(`  ✅ ${f}`);
    copied++;
  } else {
    console.warn(`  ⚠️  ${f} não encontrado — pulando`);
  }
}

// Copia pasta data/ inteira (anjos-conteudo.json e futuros arquivos)
const DATA_SRC = join(ROOT, 'data');
if (existsSync(DATA_SRC)) {
  const DATA_DST = join(WWW, 'data');
  mkdirSync(DATA_DST, { recursive: true });
  for (const f of readdirSync(DATA_SRC)) {
    const s = join(DATA_SRC, f);
    if (statSync(s).isFile()) {
      copyFileSync(s, join(DATA_DST, f));
      console.log(`  ✅ data/${f}`);
      copied++;
    }
  }
}

console.log(`\n🪽 Build concluído: ${copied} arquivo(s) copiado(s) → www/`);
