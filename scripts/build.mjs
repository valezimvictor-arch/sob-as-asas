/**
 * Sob as Asas — Build script para Capacitor (iOS/Android)
 * Copia os arquivos estáticos para o diretório www/ que o Capacitor usa.
 *
 * Uso: node scripts/build.mjs
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
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

console.log(`\n🪽 Build concluído: ${copied} arquivo(s) copiado(s) → www/`);
