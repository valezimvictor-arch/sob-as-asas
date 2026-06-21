#!/usr/bin/env node
// Gera ROTEIROS_72_ANJOS.md — cartilha de gravação da Monica pros 72 anjos individuais.
// Cada roteiro: ~3,5 min spoken (~400-450 palavras), tom avó-sacerdotisa,
// pausas marcadas com [...], estrutura consistente entre os 72.
//
// Base: data/anjos-conteudo.json + tom do BRIEFING_GRAVACAO_MONICA.md.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANJOS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/anjos-conteudo.json'), 'utf-8'));
const OUT = path.join(ROOT, 'ROTEIROS_72_ANJOS.md');

// ── util: extrai a "palavra-chave" do dom_principal (1ª palavra significativa) ──
function chaveDoDom(dom) {
  if (!dom) return 'presença';
  const limpos = dom.toLowerCase().split(/[\s,]+/).filter(p => p.length > 2 && !['e','de','da','do','para','com','que','seu','sua'].includes(p));
  return limpos[0] || 'presença';
}

// ── número por extenso (1-72) ──
function porExtenso(n) {
  const m = { 1:'primeiro',2:'segundo',3:'terceiro',4:'quarto',5:'quinto',6:'sexto',7:'sétimo',8:'oitavo',9:'nono',10:'décimo',11:'décimo primeiro',12:'décimo segundo',13:'décimo terceiro',14:'décimo quarto',15:'décimo quinto',16:'décimo sexto',17:'décimo sétimo',18:'décimo oitavo',19:'décimo nono',20:'vigésimo',21:'vigésimo primeiro',22:'vigésimo segundo',23:'vigésimo terceiro',24:'vigésimo quarto',25:'vigésimo quinto',26:'vigésimo sexto',27:'vigésimo sétimo',28:'vigésimo oitavo',29:'vigésimo nono',30:'trigésimo',31:'trigésimo primeiro',32:'trigésimo segundo',33:'trigésimo terceiro',34:'trigésimo quarto',35:'trigésimo quinto',36:'trigésimo sexto',37:'trigésimo sétimo',38:'trigésimo oitavo',39:'trigésimo nono',40:'quadragésimo',41:'quadragésimo primeiro',42:'quadragésimo segundo',43:'quadragésimo terceiro',44:'quadragésimo quarto',45:'quadragésimo quinto',46:'quadragésimo sexto',47:'quadragésimo sétimo',48:'quadragésimo oitavo',49:'quadragésimo nono',50:'quinquagésimo',51:'quinquagésimo primeiro',52:'quinquagésimo segundo',53:'quinquagésimo terceiro',54:'quinquagésimo quarto',55:'quinquagésimo quinto',56:'quinquagésimo sexto',57:'quinquagésimo sétimo',58:'quinquagésimo oitavo',59:'quinquagésimo nono',60:'sexagésimo',61:'sexagésimo primeiro',62:'sexagésimo segundo',63:'sexagésimo terceiro',64:'sexagésimo quarto',65:'sexagésimo quinto',66:'sexagésimo sexto',67:'sexagésimo sétimo',68:'sexagésimo oitavo',69:'sexagésimo nono',70:'septuagésimo',71:'septuagésimo primeiro',72:'septuagésimo segundo' };
  return m[n] || String(n);
}

// ── gera o roteiro de UM anjo ──
function roteiroDeUm(anjo) {
  const n = anjo.n;
  const nome = anjo.nome;
  const coro = anjo.coro;
  const principe = anjo.principe;
  const horario = anjo.horario;
  const dias = (anjo.regencia_dias || []).join(', ');
  const dom = anjo.dom_principal || '';
  const domL = dom.toLowerCase();
  const dons = (anjo.dons_secundarios || []).slice(0, 3).join(', ').toLowerCase();
  const atributos = anjo.atributos || '';
  const quando = anjo.quando_invocar || '';
  const salmoRef = anjo.salmo_ref || '';
  const salmoTexto = anjo.salmo_texto || '';
  const invocacao = anjo.invocacao || '';
  const afirmacao = anjo.afirmacao || '';
  const chave = chaveDoDom(dom);
  const ext = porExtenso(n);

  return `## Anjo nº ${n} — ${nome}

> **Coro:** ${coro} · **Príncipe:** ${principe} · **Horário:** ${horario} · **Regência:** ${dias}
> **Duração estimada:** ~3 min 30 s · **Naming:** \`anjo-${String(n).padStart(2,'0')}-${nome.toLowerCase().replace(/[^a-z]/g,'')}.mp3\`

---

**[ABERTURA — voz baixa, devagar]**

Respire fundo. [...]

Hoje, eu quero te apresentar um anjo. [...]

O nome dele é **${nome}**. [...]

Ele é o ${ext} anjo entre os setenta e dois. Pertence ao coro dos **${coro}**, sob o príncipe ${principe}. [...]

Tem uma janela do dia em que ele se aproxima mais — entre **${horario}**. Se você nasceu num desses dias — ${dias} — ele rege a sua vida de forma especial. [...]

**[APRESENTAÇÃO — pausada]**

${atributos} [...]

Esse é o **anjo de ${domL}**. [...]

E junto vêm outros dons: ${dons}. [...]

**[CONVITE — íntimo]**

Quando você pode chamar ${nome}? [...]

${quando} [...]

Nesses momentos, lembre-se: ele já está aqui. Você só precisa nomear. [...]

**[SALMO — leitura sussurrada]**

O salmo de ${nome} é o **${salmoRef}**. [pausa longa]

"${salmoTexto}" [pausa longa]

Leia esse salmo quando precisar dele perto. Devagar. Em voz alta se puder. [...]

**[ORAÇÃO — voz mais firme, mas baixa]**

A oração de ${nome}: [pausa]

${invocacao} [pausa longa]

**[AFIRMAÇÃO — pra carregar no dia]**

E pra levar com você, ${nome} ensina essa frase: [pausa]

— ${afirmacao} —

Anote em algum lugar visível. Lembre-se dela quando o dia apertar. [...]

**[DESPEDIDA — quase silêncio]**

Esse foi ${nome}, ${ext} anjo, do coro dos ${coro}. [...]

Sob as asas dele, você está protegida. [pausa longa]

Você está sob as asas.

---

`;
}

// ── gera o arquivo completo ──
const cabecalho = `# Roteiros de Gravação — Catálogo dos 72 Anjos

**Para:** Monica Buonfiglio
**Coleção:** Bloco 3 do PLANO_PRODUCAO_MONICA.md — apresentação individual de cada um dos 72 anjos cabalísticos.
**Total:** 72 áudios · ~3 min 30 s cada · ~4 horas de gravação total
**Ritmo sugerido:** 2 anjos por semana (~36 semanas pra completar tudo)

---

## Como ler estes roteiros

- **Tom:** avó-sacerdotisa. Devagar, contemplativa. Falando direto pra uma única pessoa.
- **Ritmo:** ~110 palavras por minuto (mais lento que podcast normal). Não tenha medo do silêncio.
- **Pausas:** marcadas com \`[...]\` (pausa curta, ~1s), \`[pausa]\` (~2s) e \`[pausa longa]\` (~3-4s). Respeite-as.
- **Indicações entre colchetes** (ex: \`[ABERTURA — voz baixa, devagar]\`) são pra guiar a entonação. Não leia em voz alta.
- **Naming dos arquivos:** sempre \`anjo-NN-nome.mp3\`, dois dígitos pro número, nome em minúsculas sem acento.
- **Sem call-to-action no final.** Não diga "curta", "siga", "baixe". O fechamento é silêncio + "Você está sob as asas."

---

## Como subir no app

1. Grave o arquivo conforme o roteiro
2. Abra \`/admin → 📥 Roteiro Monica\`
3. Procure o item correspondente (ex: "Anjo 1 — Vehuiah")
4. Clique em **Enviar áudio**
5. O sistema valida o naming e marca como ✓ enviado

---

`;

let conteudo = cabecalho;

// Índice rápido
conteudo += '## Índice\n\n';
for (let i = 1; i <= 72; i++) {
  const a = ANJOS[String(i)];
  if (a) conteudo += `${i}. **${a.nome}** — ${a.dom_principal} (${a.horario})\n`;
}
conteudo += '\n---\n\n';

// Os 72 roteiros
for (let i = 1; i <= 72; i++) {
  const a = ANJOS[String(i)];
  if (a) conteudo += roteiroDeUm(a);
}

// Rodapé
conteudo += `## Notas finais

- Total de roteiros gerados: 72
- Estes roteiros foram **gerados a partir do conteúdo autoral dos 72 anjos** já curado no app (data/anjos-conteudo.json).
- Monica tem total liberdade pra **adaptar a linguagem**, adicionar histórias pessoais, exemplos, ou variar a abertura/despedida — desde que mantenha a estrutura: apresentação → atributos → salmo → oração → afirmação → silêncio.
- Quando preferir gravar em sessão única, recomenda-se ir do nº 1 (Vehuiah) ao nº 72 (Mumiah) em ordem — o app respeita essa ordem na biblioteca.

**Conteúdo autoral de Monica Buonfiglio. Lei 9.610/98. Uso interno da equipe Sob as Asas — não reproduza.**
`;

fs.writeFileSync(OUT, conteudo, 'utf-8');
const linhas = conteudo.split('\n').length;
const palavras = conteudo.split(/\s+/).length;
console.log(`✓ Gerado: ${OUT}`);
console.log(`  ${linhas} linhas · ${palavras} palavras · 72 roteiros`);
