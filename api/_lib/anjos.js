// ─────────────────────────────────────────────────────────────────────────
// Sob as Asas — Os 72 Anjos (tabela oficial da Monica Buonfiglio)
//
// Modelo correto: cada anjo rege 5 DIAS específicos do ano (não faixas de 5
// dias consecutivos). As 5 datas por anjo, juntas, cobrem o ano inteiro — então
// a cada data de nascimento corresponde exatamente UM anjo regente.
//
// Dados transcritos da tabela enviada pela Monica (Correio/Curso Angelical).
// `coro` é derivado do número (grupos de 8). `atributo` é provisório até a
// curadoria final dos textos da Monica.
//
// Datas como [dia, mes] (mes 1=jan ... 12=dez).
// ─────────────────────────────────────────────────────────────────────────

export const ANJOS = [
  [1,  'Vehuiah',    'Vontade e força de iniciar',  [[1,6],[13,8],[20,3],[25,10],[6,1]]],
  [2,  'Jeliel',     'Amor e fidelidade',           [[2,6],[14,8],[21,3],[26,10],[7,1]]],
  [3,  'Sitael',     'Construção e proteção',       [[3,6],[15,8],[22,3],[27,10],[8,1]]],
  [4,  'Elemiah',    'Viagens interiores e paz',    [[4,6],[16,8],[23,3],[28,10],[9,1]]],
  [5,  'Mahasiah',   'Retidão e harmonia',          [[5,6],[17,8],[24,3],[29,10],[10,1]]],
  [6,  'Lelahel',    'Luz, cura e talento',         [[6,6],[18,8],[25,3],[30,10],[11,1]]],
  [7,  'Achaiah',    'Paciência e descoberta',      [[7,6],[19,8],[26,3],[31,10],[12,1]]],
  [8,  'Cahethel',   'Bênção e gratidão',           [[8,6],[20,8],[27,3],[1,11],[13,1]]],
  [9,  'Haziel',     'Misericórdia e perdão',       [[9,6],[21,8],[28,3],[2,11],[14,1]]],
  [10, 'Aladiah',    'Graça e regeneração',         [[10,6],[22,8],[29,3],[3,11],[15,1]]],
  [11, 'Laoviah',    'Vitória e renome',            [[11,6],[23,8],[30,3],[4,11],[16,1]]],
  [12, 'Hahaiah',    'Refúgio e abrigo',            [[12,6],[24,8],[31,3],[5,11],[17,1]]],
  [13, 'Yesalel',    'Reconciliação',               [[13,6],[25,8],[1,4],[6,11],[18,1]]],
  [14, 'Mebahel',    'Verdade e justiça',           [[14,6],[26,8],[2,4],[7,11],[19,1]]],
  [15, 'Hariel',     'Pureza e clareza',            [[15,6],[27,8],[3,4],[8,11],[20,1]]],
  [16, 'Hacamiah',   'Lealdade e proteção',         [[16,6],[28,8],[4,4],[9,11],[21,1]]],
  [17, 'Lahuviah',   'Revelação e intuição',        [[17,6],[29,8],[5,4],[10,11],[22,1]]],
  [18, 'Caliel',     'Justiça e verdade',           [[18,6],[30,8],[6,4],[11,11],[23,1]]],
  [19, 'Leuviah',    'Memória e inteligência',      [[19,6],[31,8],[7,4],[12,11],[24,1]]],
  [20, 'Pahaliah',   'Vocação e fé',                [[20,6],[1,9],[8,4],[13,11],[25,1]]],
  [21, 'Nelchael',   'Conhecimento e estudo',       [[21,6],[2,9],[9,4],[14,11],[26,1]]],
  [22, 'Yeiaiel',    'Renome e fortuna',            [[22,6],[3,9],[10,4],[15,11],[27,1]]],
  [23, 'Melahel',    'Cura e coragem',              [[23,6],[4,9],[11,4],[16,11],[28,1]]],
  [24, 'Haheuiah',   'Proteção e abrigo',           [[24,6],[5,9],[12,4],[17,11],[29,1]]],
  [25, 'NithHaiah',  'Sabedoria e magia',           [[25,6],[6,9],[13,4],[18,11],[30,1]]],
  [26, 'Haaiah',     'Ordem e política',            [[26,6],[7,9],[14,4],[19,11],[31,1]]],
  [27, 'Lerathel',   'Difusão da luz',              [[27,6],[8,9],[15,4],[20,11],[1,2]]],
  [28, 'Seheiah',    'Saúde e longevidade',         [[28,6],[9,9],[16,4],[21,11],[2,2]]],
  [29, 'Reyel',      'Libertação e fé',             [[29,6],[10,9],[17,4],[22,11],[3,2]]],
  [30, 'Omael',      'Paciência e fertilidade',     [[30,6],[11,9],[18,4],[23,11],[4,2]]],
  [31, 'Lecabel',    'Talento e prosperidade',      [[1,7],[12,9],[19,4],[24,11],[5,2]]],
  [32, 'Vassahiah',  'Clemência e justiça',         [[2,7],[13,9],[20,4],[25,11],[6,2]]],
  [33, 'Yehuiah',    'Discernimento',               [[3,7],[14,9],[21,4],[26,11],[7,2]]],
  [34, 'Lehahiah',   'Obediência e sorte',          [[4,7],[15,9],[22,4],[27,11],[8,2]]],
  [35, 'Chavahiah',  'Harmonia familiar',           [[5,7],[16,9],[23,4],[28,11],[9,2]]],
  [36, 'Menadel',    'Trabalho e vocação',          [[6,7],[17,9],[24,4],[29,11],[10,2]]],
  [37, 'Aniel',      'Coragem e rompimento',        [[7,7],[18,9],[25,4],[30,11],[11,2]]],
  [38, 'Haamiah',    'Ritual e proteção',           [[8,7],[19,9],[26,4],[1,12],[12,2]]],
  [39, 'Rehael',     'Cura e filiação',             [[9,7],[20,9],[27,4],[2,12],[13,2]]],
  [40, 'Yeiazel',    'Consolo e libertação',        [[10,7],[21,9],[28,4],[3,12],[14,2]]],
  [41, 'Hahahel',    'Missão e fé',                 [[11,7],[22,9],[29,4],[4,12],[15,2]]],
  [42, 'Micael',     'Ordem e providência',         [[12,7],[23,9],[30,4],[5,12],[16,2]]],
  [43, 'Veuliah',    'Prosperidade e paz',          [[13,7],[24,9],[1,5],[6,12],[17,2]]],
  [44, 'Yelaiah',    'Coragem e proteção',          [[14,7],[25,9],[2,5],[7,12],[18,2]]],
  [45, 'Sehaliah',   'Motivação e vida',            [[15,7],[26,9],[3,5],[8,12],[19,2]]],
  [46, 'Ariel',      'Percepção e descoberta',      [[16,7],[27,9],[4,5],[9,12],[20,2]]],
  [47, 'Assaliah',   'Contemplação e verdade',      [[17,7],[28,9],[5,5],[10,12],[21,2]]],
  [48, 'Michael',    'Fertilidade e amizade',       [[18,7],[29,9],[6,5],[11,12],[22,2]]],
  [49, 'Vehuel',     'Grandeza e elevação',         [[19,7],[30,9],[7,5],[12,12],[23,2]]],
  [50, 'Daniel',     'Eloquência e clemência',      [[20,7],[1,10],[8,5],[13,12],[24,2]]],
  [51, 'Hahassiah',  'Medicina universal',          [[21,7],[2,10],[9,5],[14,12],[25,2]]],
  [52, 'Ymamiah',    'Resistência e liberdade',     [[22,7],[3,10],[10,5],[15,12],[26,2]]],
  [53, 'Nanael',     'Comunicação espiritual',      [[23,7],[4,10],[11,5],[16,12],[27,2]]],
  [54, 'Nithael',    'Juventude e graça',           [[24,7],[5,10],[12,5],[17,12],[28,2],[29,2]]],
  [55, 'Mebahiah',   'Consolo e lucidez',           [[25,7],[6,10],[13,5],[18,12],[1,3]]],
  [56, 'Poiel',      'Fortuna e renome',            [[26,7],[7,10],[14,5],[19,12],[2,3]]],
  [57, 'Nemamiah',   'Discernimento e prosperidade',[[27,7],[8,10],[15,5],[20,12],[3,3]]],
  [58, 'Yeialel',    'Força mental e cura',         [[28,7],[9,10],[16,5],[21,12],[4,3]]],
  [59, 'Harahel',    'Riqueza e conhecimento',      [[29,7],[10,10],[17,5],[22,12],[5,3]]],
  [60, 'Mitsrael',   'Reparação e fidelidade',      [[30,7],[11,10],[18,5],[23,12],[6,3]]],
  [61, 'Umabel',     'Amizade e afinidade',         [[31,7],[12,10],[19,5],[24,12],[7,3]]],
  [62, 'Iah-Hel',    'Sabedoria e quietude',        [[1,8],[13,10],[20,5],[25,12],[8,3]]],
  [63, 'Anauel',     'Proteção e unidade',          [[2,8],[14,10],[21,5],[26,12],[9,3]]],
  [64, 'Mehiel',     'Inspiração e proteção',       [[3,8],[15,10],[22,5],[27,12],[10,3]]],
  [65, 'Damabiah',   'Fonte e abundância',          [[4,8],[16,10],[23,5],[28,12],[11,3]]],
  [66, 'Manakel',    'Bondade e sono',              [[5,8],[17,10],[24,5],[29,12],[12,3]]],
  [67, 'Eyael',      'Consolo e elevação',          [[6,8],[18,10],[25,5],[30,12],[13,3]]],
  [68, 'Habuiah',    'Cura e fertilidade',          [[7,8],[19,10],[26,5],[31,12],[14,3]]],
  [69, 'Rochel',     'Restituição e justiça',       [[8,8],[20,10],[27,5],[1,1],[15,3]]],
  [70, 'Yabamiah',   'Regeneração e alquimia',      [[9,8],[21,10],[28,5],[2,1],[16,3]]],
  [71, 'Haiaiel',    'Coragem e proteção',          [[10,8],[22,10],[29,5],[3,1],[17,3]]],
  [72, 'Mumiah',     'Renascimento e conclusão',    [[11,8],[23,10],[30,5],[4,1],[18,3]]],
];

const COROS = ['Serafins','Querubins','Tronos','Dominações','Potências','Virtudes','Principados','Arcanjos','Anjos'];
export function coroDe(n){ return COROS[Math.floor((n - 1) / 8)]; }

// Índice data → anjo (chave = mes*100 + dia)
const INDICE = {};
for (const [n, nome, atributo, datas] of ANJOS) {
  for (const [d, m] of datas) INDICE[m * 100 + d] = { n, nome, atributo, coro: coroDe(n), datas };
}

// Datas de transição (não regidas por um único anjo) → "Anjos da Humanidade":
// pessoas nascidas nesses dias têm um papel especial e escolhem o anjo que
// mais ressoa com elas (doutrina da Monica).
export const ANJOS_HUMANIDADE = {
  n: 0,
  nome: 'Anjos da Humanidade',
  atributo: 'Uma data rara e sagrada — você tem um papel fundamental.',
  coro: null,
  humanidade: true,
  datas: [[31,5],[12,8],[24,10],[5,1],[19,3]],
};

/**
 * Retorna o anjo regente para a data de nascimento, ou ANJOS_HUMANIDADE
 * quando a data é um dia de transição.
 * @param {string|{mes,dia}} isoDate  'YYYY-MM-DD' ou {mes,dia}
 */
export function anjoRegente(isoDate) {
  let mes, dia;
  if (typeof isoDate === 'string') {
    const [, m, d] = isoDate.split('-').map(Number);
    mes = m; dia = d;
  } else { mes = isoDate.mes; dia = isoDate.dia; }
  if (!mes || !dia) throw new Error('Data inválida para cálculo do anjo regente');
  return INDICE[mes * 100 + dia] || ANJOS_HUMANIDADE;
}
