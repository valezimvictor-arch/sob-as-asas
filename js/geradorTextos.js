// ════════════════════════════════════════════════════════════════════════════
// Gerador de Textos · Sob as Asas
// Centraliza a auto-geração de mensagens textuais pros 72 anjos a partir do
// data/anjos-conteudo.json. Sem Monica precisar escrever uma palavra a mais.
//
// Tom: avó-sacerdotisa. Sem "energias", "vibrações", "frequência" no sentido
// espiritual, "Universo conspirando" (manual-marca.html).
//
// Determinístico: mesma data + mesmo anjo = mesmo texto. Variação por rotação
// (hash do dia escolhe template do pool).
//
// Uso no browser:  <script type="module" src="/js/geradorTextos.js"></script>
//                  → window.GeradorTextos.mensagemDoDia(anjo, new Date())
// Uso em /api/*:   import G from '../js/geradorTextos.js'
//                  → G.cartaMensal(anjo, 7, 2026)
// ════════════════════════════════════════════════════════════════════════════

// ── util ────────────────────────────────────────────────────────────────────
export function hashStr(s){
  // FNV-1a 32-bit — determinístico, sem libs
  let h = 0x811c9dc5; s = String(s);
  for (let i=0; i<s.length; i++){ h ^= s.charCodeAt(i); h = (h*0x01000193) >>> 0; }
  return h;
}
export function pick(arr, seed){ if(!arr || !arr.length) return ''; return arr[hashStr(seed) % arr.length]; }
function _capit(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }
function _primeira(s){ return (s||'').split(/[\s,]+/).filter(Boolean)[0] || ''; }
function _isoDia(d){ return d.toISOString().slice(0,10); }

const MESES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

// ── 1) Mensagem do dia — 1 a 2 linhas, no home + push ───────────────────────
export function mensagemDoDia(anjo, data){
  if(!anjo) return '';
  data = data || new Date();
  const seed = anjo.n + '|' + _isoDia(data);

  const templates = [
    'Hoje seu anjo te pede {dom_curto}. ' + _capit(anjo.afirmacao||'').replace(/\.$/,''),
    'Aproxime-se devagar. ' + anjo.nome + ' está perto — e o que ele oferece hoje é {dom_principal}.',
    '"' + (anjo.salmo_texto||'').replace(/\.$/,'') + '." ' + anjo.salmo_ref + '. Esse é o salmo que ' + anjo.nome + ' rege.',
    'Há cuidado invisível ao seu redor agora. ' + anjo.nome + ', anjo de {dom_curto}, segura o que pesa.',
    'A presença de ' + anjo.nome + ' se faz forte entre ' + (anjo.horario||'as horas dele') + '. Aproveite pra estar com ele.',
    _capit(anjo.afirmacao||''),
    'Receba a palavra de ' + anjo.nome + ': "{dom_principal}". Deixe que ela trabalhe em você hoje.',
    'Você não chega aqui por acaso. ' + anjo.nome + ' te chamou — e a palavra de hoje é {dom_curto}.',
  ];

  return pick(templates, seed)
    .replace('{dom_curto}', (anjo.dom_principal||'').toLowerCase())
    .replace('{dom_principal}', anjo.dom_principal||'')
    .trim();
}

// ── 2) Push notification — título curto + corpo ─────────────────────────────
export function pushDoDia(anjo, data){
  if(!anjo) return { title:'Sob as Asas', body:'Seu anjo tem uma mensagem para você.' };
  data = data || new Date();
  const seed = 'push|' + anjo.n + '|' + _isoDia(data);

  const titulos = [
    anjo.nome + ' está com você',
    'Uma palavra de ' + anjo.nome,
    'Sob as asas de ' + anjo.nome,
    anjo.nome + ' — agora',
    'Hoje com ' + anjo.nome,
  ];

  const corpos = [
    _primeira(anjo.dom_principal||'') ? ('A palavra de hoje é '+_primeira(anjo.dom_principal||'').toLowerCase()+'.') : '',
    anjo.afirmacao ? _capit(anjo.afirmacao) : '',
    'Toque pra ler a mensagem do dia.',
    'O salmo de hoje é ' + (anjo.salmo_ref||'') + '.',
    'Seu anjo te espera dentro do app.',
  ].filter(Boolean);

  return {
    title: pick(titulos, seed),
    body:  pick(corpos, seed+'b'),
    angelN: anjo.n
  };
}

// ── 3) Carta mensal — 600-900 palavras, formato carta da Monica ─────────────
export function cartaMensal(anjo, mes, ano){
  if(!anjo) return '';
  const mesNome = MESES_PT[Math.max(0,Math.min(11,(mes||1)-1))];
  const seed = 'mensal|' + anjo.n + '|' + mes + '|' + ano;
  const coro = anjo.coro || '';
  const dom = anjo.dom_principal || '';
  const domL = dom.toLowerCase();
  const firstDom = _primeira(dom);

  const aberturas = [
    'Minha querida, meu querido,\n\nO mês de '+mesNome+' chega — e com ele '+anjo.nome+', do coro dos '+coro+'.',
    'Olha quem volta para essa janela do ano: '+anjo.nome+'.\n\nNo mês de '+mesNome+', ele se aproxima — e o dom que ele traz é '+domL+'.',
    'Você sabia que cada mês tem um anjo que se inclina sobre ele com mais força? Em '+mesNome+', esse anjo é '+anjo.nome+'.',
  ];

  const apresentacoes = [
    anjo.atributos,
    'Os antigos descreviam '+anjo.nome+' assim: '+(anjo.atributos||''),
    'O que '+anjo.nome+' faz na vida de quem o acolhe? '+(anjo.atributos||''),
  ];

  const convites = [
    'Pra esse mês, eu te peço uma coisa só: '+(anjo.quando_invocar||'invoque ele quando precisar'),
    'A prática deste mês é simples. '+(anjo.quando_invocar||'')+' E nesses momentos, lembre-se: você não está sozinha. Você não está sozinho.',
    'Se o mês de '+mesNome+' for difícil, lembre-se de '+anjo.nome+'. '+(anjo.quando_invocar||''),
  ];

  const despedidas = [
    'Que '+mesNome+' te encontre debaixo das asas dele.\n\nMonica',
    'Boa travessia.\n\nSob as asas,\nMonica',
    'Que '+anjo.nome+' te acompanhe — silenciosamente, do jeito dele.\n\nMonica',
  ];

  const paragrafos = [
    pick(aberturas, seed),
    pick(apresentacoes, seed+'a'),
    'Esse é o anjo da '+firstDom.toLowerCase()+'. O dom que ele oferece — o que vai começar a se mover na sua vida se você se permitir estar com ele — é '+domL+'. Outros dons que vêm junto: '+(anjo.dons_secundarios||[]).slice(0,3).join(', ')+'.',
    pick(convites, seed+'b'),
    'O salmo de '+anjo.nome+' é o '+(anjo.salmo_ref||'')+':\n\n"'+(anjo.salmo_texto||'')+'"\n\nLeia uma vez por semana neste mês. Devagar. Em voz alta se puder.',
    'Quando faltar palavra, use a oração que '+anjo.nome+' ensina:\n\n'+(anjo.invocacao||''),
    'E quando precisar de uma frase pra carregar no bolso da alma, leve essa:\n\n— '+(anjo.afirmacao||'')+' —',
    pick(despedidas, seed+'c'),
  ];

  return paragrafos.filter(Boolean).join('\n\n');
}

// ── 4) Newsletter Carta dos Anjos — bloco editorial semanal ──────────────────
export function newsletterSemana(anjo, dataReferencia){
  if(!anjo) return null;
  const data = dataReferencia || new Date();
  const seed = 'nl|' + anjo.n + '|' + _isoDia(data);

  const aberturas = [
    'Esta semana, quem se aproxima é '+anjo.nome+' — do coro dos '+anjo.coro+'.',
    'Há uma presença sutil entrando esta semana. Ela tem um nome: '+anjo.nome+'.',
    'Você talvez não tenha reparado, mas '+anjo.nome+' está perto. Os dias '+(anjo.regencia_dias||[]).slice(0,3).join(', ')+' são dele.',
  ];

  const praticasTit = [
    'A prática de '+anjo.nome,
    'A vela de '+_primeira(anjo.dom_principal||'').toLowerCase(),
    'Uma respiração com '+anjo.nome,
  ];

  const corVela = anjo.elemento==='Fogo'?'vermelha':anjo.elemento==='Água'?'azul':anjo.elemento==='Terra'?'verde':'branca';
  const praticasPassos = [
    '<strong>1.</strong> Acenda uma vela '+corVela+'. ' +
    '<strong>2.</strong> Leia em voz alta: "'+(anjo.afirmacao||'')+'". ' +
    '<strong>3.</strong> Fique em silêncio por 2 minutos.',
    '<strong>1.</strong> Respire fundo três vezes. <strong>2.</strong> Diga o nome dele em voz baixa: '+anjo.nome+'. <strong>3.</strong> Peça por '+(anjo.dom_principal||'').toLowerCase()+'.',
    '<strong>1.</strong> Anote em algum lugar visível: "'+(anjo.dom_principal||'')+'". <strong>2.</strong> Volte ao bilhete uma vez por dia, durante 7 dias.',
  ];

  return {
    anjo: anjo.nome,
    coro: anjo.coro,
    datas: (anjo.regencia_dias||[]).slice(0,5).join(' · '),
    subject: 'Sua Carta dos Anjos desta semana 🕊️ · ' + anjo.nome,
    mensagem: pick(aberturas, seed) + ' ' + (anjo.atributos||''),
    monica: '"'+(anjo.afirmacao||'')+'" — uma frase pra você carregar essa semana.',
    pratica_titulo: pick(praticasTit, seed+'p'),
    pratica_passos: pick(praticasPassos, seed+'pp'),
    para_esta_semana: {
      salmo: anjo.salmo_ref + ' — "' + (anjo.salmo_texto||'').slice(0,90) + '…"',
      ouvir: 'Áudio do dia 1 da Jornada de ' + anjo.nome + ' (no app)',
      escrever: 'Uma carta de 5 linhas pro seu anjo, no Correio Angelical'
    }
  };
}

// ── 5) Bênção curta — pool dinâmico derivado dos atributos do anjo ──────────
export function bencaoAnjo(anjo){
  if(!anjo) return 'Você está sob as asas.';
  const seed = 'bencao|' + anjo.n;
  const firstDom = _primeira(anjo.dom_principal||'').toLowerCase();
  const templates = [
    'Que '+anjo.nome+' te acompanhe hoje. Sob as asas.',
    'A palavra de '+anjo.nome+' é '+firstDom+'. Deixe que ela te encontre.',
    'Há um anjo segurando o que você não vê. O nome dele é '+anjo.nome+'.',
    '"'+(anjo.afirmacao||'Você está sob as asas')+'"',
    'Você é vista, você é visto. '+anjo.nome+' está aqui.',
  ];
  return pick(templates, seed);
}

// ── 6) Manchete — pra título de email, push, header de tela ─────────────────
export function manchete(anjo){
  if(!anjo) return 'Sob as Asas';
  const seed = 'manchete|' + anjo.n;
  const templates = [
    anjo.nome + ' — anjo da ' + _primeira(anjo.dom_principal||'').toLowerCase(),
    'A travessia com ' + anjo.nome,
    anjo.nome + ': ' + (anjo.dom_principal||''),
    'Sob as asas de ' + anjo.nome,
  ];
  return pick(templates, seed);
}

// ── 7) Anjo do dia — escolhe um dos 72 baseado no dia do ano ────────────────
export function anjoDoDia(dadosAnjos, data){
  data = data || new Date();
  if(!dadosAnjos) return null;
  const inicio = new Date(data.getFullYear(), 0, 0);
  const diff = data - inicio;
  const dia = Math.floor(diff / (1000*60*60*24));
  const n = ((dia - 1) % 72) + 1;
  return dadosAnjos[String(n)] || dadosAnjos['1'];
}

// ── Export default + window (pra inline scripts) ────────────────────────────
const GeradorTextos = { mensagemDoDia, pushDoDia, cartaMensal, newsletterSemana, bencaoAnjo, manchete, anjoDoDia, hashStr, pick };
export default GeradorTextos;

if (typeof window !== 'undefined') window.GeradorTextos = GeradorTextos;
