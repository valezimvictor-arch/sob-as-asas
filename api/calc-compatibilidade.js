// GET /api/calc-compatibilidade?n1=4&n2=17
// Calcula a compatibilidade angelical entre dois anjos (1..72).
// Sem auth — endpoint público, sem dado pessoal.

const COROS = {
  serafins:    { range: [1, 8],   principe: 'Metatron',  elemento: 'fogo'    },
  querubins:   { range: [9, 16],  principe: 'Raziel',    elemento: 'água'    },
  tronos:      { range: [17, 24], principe: 'Tsaphkiel', elemento: 'água'    },
  dominacoes:  { range: [25, 32], principe: 'Tsadkiel',  elemento: 'fogo'    },
  potencias:   { range: [33, 40], principe: 'Camael',    elemento: 'terra'   },
  virtudes:    { range: [41, 48], principe: 'Rafael',    elemento: 'ar'      },
  principados: { range: [49, 56], principe: 'Haniel',    elemento: 'terra'   },
  arcanjos:    { range: [57, 64], principe: 'Miguel',    elemento: 'fogo'    },
  anjos:       { range: [65, 72], principe: 'Gabriel',   elemento: 'ar'      },
};

function coroDe(n) {
  for (const k in COROS) {
    const [a, b] = COROS[k].range;
    if (n >= a && n <= b) return k;
  }
  return 'anjos';
}

function pretty(coro) {
  return coro === 'dominacoes' ? 'Dominações'
       : coro === 'potencias'  ? 'Potências'
       : coro === 'serafins'   ? 'Serafins'
       : coro === 'querubins'  ? 'Querubins'
       : coro === 'tronos'     ? 'Tronos'
       : coro === 'virtudes'   ? 'Virtudes'
       : coro === 'principados'? 'Principados'
       : coro === 'arcanjos'   ? 'Arcanjos'
       : 'Anjos';
}

function analisar(n1, n2) {
  const c1 = coroDe(n1), c2 = coroDe(n2);
  const info1 = COROS[c1], info2 = COROS[c2];
  const mesmoCoro = c1 === c2;
  const mesmoPrincipe = info1.principe === info2.principe;
  const mesmoElemento = info1.elemento === info2.elemento;
  const elementosCompatíveis = (info1.elemento === 'fogo' && info2.elemento === 'ar')
    || (info1.elemento === 'ar' && info2.elemento === 'fogo')
    || (info1.elemento === 'terra' && info2.elemento === 'água')
    || (info1.elemento === 'água' && info2.elemento === 'terra');

  // Score 0–100
  let score = 50;
  let tipo = 'complementar';
  let titulo = '';
  let analise = '';
  let pratica = '';

  if (mesmoCoro) {
    score = 90;
    tipo = 'harmonia';
    titulo = 'Harmonia profunda';
    analise = `Os dois anjos pertencem ao mesmo coro — os ${pretty(c1)}. Há uma sintonia natural entre vocês, como duas vozes que cantam na mesma oitava. O cuidado angelical chega pelo mesmo canal — vocês reconhecem os mesmos sinais e respondem aos mesmos chamados.`;
    pratica = 'Quando um dos dois acender uma vela, o outro pode acender a sua na mesma cor. Os pedidos se amplificam quando feitos na mesma frequência angelical.';
  } else if (mesmoPrincipe) {
    score = 80;
    tipo = 'harmonia';
    titulo = 'Mesma linhagem angelical';
    analise = `Os anjos de vocês servem ao mesmo arcanjo regente — ${info1.principe}. Mesmo pertencendo a coros diferentes, há uma hierarquia compartilhada que cria afinidade espiritual. Pensem juntos sobre questões maiores — propósito, missão, caminho.`;
    pratica = 'Façam juntos a oração ao arcanjo regente comum. Em silêncio, no mesmo horário, mesmo que estejam fisicamente longe.';
  } else if (elementosCompatíveis) {
    score = 75;
    tipo = 'complementar';
    titulo = 'Complementaridade poderosa';
    analise = `Os anjos de vocês regem elementos complementares — ${info1.elemento} e ${info2.elemento}. Onde um sustenta, o outro impulsiona. Onde um aquieta, o outro acende. Vocês são úteis um para o outro de jeitos que não percebem ainda.`;
    pratica = 'Numa decisão difícil, peçam orientação para os dois anjos. Comparem o que veio. A resposta combinada costuma ser mais sábia que cada uma sozinha.';
  } else if (mesmoElemento) {
    score = 70;
    tipo = 'afinidade';
    titulo = 'Afinidade elementar';
    analise = `Ambos os anjos regem o mesmo elemento — ${info1.elemento}. Há um modo parecido de cuidar, embora os coros sejam diferentes. Cuidem das mesmas coisas, do mesmo jeito — mas com perspectivas distintas que enriquecem.`;
    pratica = 'Compartilhem regularmente — uma vez por semana — o que cada anjo tem ensinado a cada um. O paralelo vai surpreender.';
  } else {
    score = 60;
    tipo = 'aprendizado';
    titulo = 'Encontro de mundos';
    analise = `Os anjos de vocês são de coros bem diferentes — ${pretty(c1)} e ${pretty(c2)}. Não é incompatibilidade. É chamado pra ampliar. Cada um traz o que o outro não conheceria sozinho — uma diferença que ensina.`;
    pratica = 'Marquem um momento por mês para conversar sobre o que está se passando na vida espiritual de cada um. Aprendam o vocabulário do outro.';
  }

  // Modifiers leves
  if (mesmoCoro && mesmoElemento) score = Math.min(95, score + 5);
  if (mesmoPrincipe && mesmoElemento) score = Math.min(90, score + 5);

  return {
    score,
    tipo,
    titulo,
    analise,
    pratica,
    coro1: pretty(c1),
    coro2: pretty(c2),
    elemento1: info1.elemento,
    elemento2: info2.elemento,
    principe1: info1.principe,
    principe2: info2.principe,
    mesmoCoro,
    mesmoPrincipe,
    mesmoElemento,
  };
}

export default async function handler(req, res) {
  const n1 = Number(req.query.n1);
  const n2 = Number(req.query.n2);
  if (!Number.isInteger(n1) || !Number.isInteger(n2)) {
    return res.status(400).json({ ok: false, error: 'n1 e n2 obrigatórios e inteiros' });
  }
  if (n1 < 1 || n1 > 72 || n2 < 1 || n2 > 72) {
    return res.status(400).json({ ok: false, error: 'n1 e n2 devem estar entre 1 e 72' });
  }
  return res.status(200).json({ ok: true, ...analisar(n1, n2) });
}
