// GET /api/calc-reconciliacao?n1=4&n2=17&vinculo=familia|amor|amizade|trabalho
// Aponta qual anjo reconcilia duas pessoas em fricção. Inverso da
// compatibilidade — feito pra ser shareable/viral ("que anjo nos reconcilia?").
// Sem auth — endpoint público, sem PII.

const COROS = {
  serafins:    [1, 8],   querubins:   [9, 16],  tronos:      [17, 24],
  dominacoes:  [25, 32], potencias:   [33, 40], virtudes:    [41, 48],
  principados: [49, 56], arcanjos:    [57, 64], anjos:       [65, 72],
};
function coroDe(n){ for(const k in COROS){ const [a,b]=COROS[k]; if(n>=a&&n<=b) return k; } return 'anjos'; }

// Anjos reconciliadores especialistas, por tipo de vínculo
const RECONCILIADORES = {
  familia:   { n: 35, nome: 'Chavahiah',  dom: 'Harmonia familiar' },
  amor:      { n: 64, nome: 'Mehiel',     dom: 'Inspiração e proteção do amor' },
  amizade:   { n: 13, nome: 'Yesalel',    dom: 'Reconciliação' },
  trabalho:  { n: 12, nome: 'Hahaiah',    dom: 'Refúgio e abrigo' },
  outro:     { n: 40, nome: 'Yeiazel',    dom: 'Consolo e libertação' },
};

// Leituras por intensidade de fricção (calculada por distância de coros)
function tipoFriccao(c1, c2){
  if(c1 === c2) return 'eco';       // mesmo coro — fricção por espelho
  // Distância entre os 9 coros (0 = mesmo, 4 = oposto extremo)
  const ks = Object.keys(COROS);
  const d = Math.abs(ks.indexOf(c1) - ks.indexOf(c2));
  if(d <= 2) return 'proxima';
  if(d <= 4) return 'distancia';
  return 'oposicao';
}

function leituraDaFriccao(tipo, vinculo, anjo1, anjo2){
  const v = {
    familia:  'na família',
    amor:     'no amor',
    amizade:  'na amizade',
    trabalho: 'no trabalho',
    outro:    'nessa relação',
  }[vinculo] || 'nessa relação';
  if(tipo === 'eco'){
    return `Vocês ${v} se chocam porque são parecidos demais. O mesmo coro angelical rege os dois — e o que incomoda no outro é um espelho do que ainda não foi aceito em si.`;
  }
  if(tipo === 'proxima'){
    return `A fricção ${v} entre vocês é de tempo, não de essência. Os anjos de cada um pedem ritmos diferentes — e os ritmos podem se acertar quando alguém escuta primeiro.`;
  }
  if(tipo === 'distancia'){
    return `Vocês ${v} chegam por caminhos espirituais bem distintos. Não há erro nisso — há tradução pendente. Cada um precisa aprender a língua angelical do outro.`;
  }
  // oposicao
  return `A oposição que sentem ${v} é forte porque os coros são opostos no céu. Mas oposto não é inimigo — é parte do mesmo plano, em ângulo diferente. Reconciliar aqui é grande.`;
}

function ritualDe(anjoReconciliador){
  return [
    `Antes de qualquer conversa, acenda uma vela e chame ${anjoReconciliador.nome} em silêncio por 1 minuto.`,
    `Escreva no Livro de Pedidos o melhor que você lembra dessa pessoa. Não a pior memória — a melhor.`,
    `Quando a conversa real acontecer, faça uma pausa de 3 respirações antes de cada resposta. ${anjoReconciliador.nome} mora nessa pausa.`,
  ];
}

export default async function handler(req, res){
  const n1 = Number(req.query.n1);
  const n2 = Number(req.query.n2);
  const vinculo = String(req.query.vinculo || 'outro').toLowerCase();
  if(!Number.isInteger(n1) || !Number.isInteger(n2) || n1<1 || n1>72 || n2<1 || n2>72){
    return res.status(400).json({ ok:false, error:'n1 e n2 devem ser inteiros 1..72' });
  }
  const reconciliador = RECONCILIADORES[vinculo] || RECONCILIADORES.outro;
  const c1 = coroDe(n1), c2 = coroDe(n2);
  const tipo = tipoFriccao(c1, c2);
  return res.status(200).json({
    ok: true,
    anjo_reconciliador: reconciliador,
    tipo_friccao: tipo,
    leitura: leituraDaFriccao(tipo, vinculo, n1, n2),
    ritual: ritualDe(reconciliador),
    coro1: c1, coro2: c2,
    vinculo,
  });
}
