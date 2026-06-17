// Banco de mensagens diárias por coro angelical.
// 9 coros × (5 manhã + 5 noite) = 90 templates.
// Substituição: {nome} = nome do anjo do usuário.
// O cron escolhe o template por: coro + day_of_month % 5.

// Mapeamento de anjo_n (1..72) → coro
// 8 anjos por coro, na ordem hierárquica clássica.
export const COROS_POR_ANJO_N = {
  // Serafins (1-8) — Metatron
  serafins:    [1, 2, 3, 4, 5, 6, 7, 8],
  // Querubins (9-16) — Raziel
  querubins:   [9, 10, 11, 12, 13, 14, 15, 16],
  // Tronos (17-24) — Tsaphkiel
  tronos:      [17, 18, 19, 20, 21, 22, 23, 24],
  // Dominações (25-32) — Tsadkiel
  dominacoes:  [25, 26, 27, 28, 29, 30, 31, 32],
  // Potências (33-40) — Camael
  potencias:   [33, 34, 35, 36, 37, 38, 39, 40],
  // Virtudes (41-48) — Rafael
  virtudes:    [41, 42, 43, 44, 45, 46, 47, 48],
  // Principados (49-56) — Haniel
  principados: [49, 50, 51, 52, 53, 54, 55, 56],
  // Arcanjos (57-64) — Miguel
  arcanjos:    [57, 58, 59, 60, 61, 62, 63, 64],
  // Anjos (65-72) — Gabriel
  anjos:       [65, 66, 67, 68, 69, 70, 71, 72],
};

export function coroDe(n) {
  for (const c in COROS_POR_ANJO_N) {
    if (COROS_POR_ANJO_N[c].includes(n)) return c;
  }
  return 'anjos';
}

// Templates por coro × 5 variações × 2 horários
// {nome} é substituído pelo nome do anjo
export const TEMPLATES = {
  serafins: {
    manha: [
      'Bom dia. Hoje {nome} pede que você comece pela coisa mais importante — não pela mais urgente.',
      'Seu anjo {nome} segura sua mão hoje. Não tem nada que você precisa fazer sozinha — sozinho.',
      'Hoje {nome} desperta antes de você. O dia começou abençoado.',
      'Bom dia. Sob a guarda de {nome}, hoje você vê o que importa — e ignora o que rouba paz.',
      '{nome} te recebe com calor neste primeiro instante do dia. Lembre disso quando o telefone tocar.',
    ],
    noite: [
      'A noite chegou. Entregue a {nome} o que você não soube resolver hoje. Ele leva.',
      'Hoje você fez o que pôde. {nome} aprova. Descanse.',
      '{nome} fica de vigília esta noite. Você pode dormir sem pesar.',
      'Solte o dia. Solte os pensamentos. {nome} cuida do silêncio.',
      'Boa noite. Sob as asas de {nome}, o que precisa amadurecer amadurece enquanto você dorme.',
    ],
  },
  querubins: {
    manha: [
      'Bom dia. {nome} ilumina seu pensamento hoje — confie no que vier com clareza, sem força.',
      'Hoje {nome} te oferece visão. Antes de decidir, pare três segundos. Vai vir a resposta.',
      'Sob a luz de {nome}, hoje as palavras chegam no tempo certo.',
      'Bom dia. Seu anjo {nome} pede atenção aos detalhes que ontem você não notou.',
      '{nome} caminha do seu lado hoje. Você não precisa ter pressa.',
    ],
    noite: [
      'A noite limpa o que o dia ensinou. {nome} te ajuda a guardar só o que importa.',
      'Boa noite. {nome} cobre as decisões pendentes — você acorda com mais clareza.',
      'Hoje você aprendeu. {nome} viu. Durma em paz.',
      '{nome} traduz seus sonhos esta noite. Preste atenção quando acordar.',
      'Sob a sabedoria de {nome}, descanse. Amanhã você vê com olhos novos.',
    ],
  },
  tronos: {
    manha: [
      'Bom dia. {nome} sustenta seu peso hoje — você pode se mover sem medo de cair.',
      '{nome} é seu trono interno. Mesmo que tudo balance, você fica de pé.',
      'Hoje {nome} pede que você não terceirize sua paz. A casa é dentro de você.',
      'Bom dia. Com {nome} como fundação, hoje você toma decisão sem culpa.',
      '{nome} já está aqui. Você só precisa lembrar de respirar.',
    ],
    noite: [
      'Boa noite. {nome} segura sua base esta noite. Você descansa em terra firme.',
      'O dia tentou te derrubar? {nome} te lembra: você não caiu.',
      'Sob {nome}, esta noite é abrigo. Permita-se.',
      '{nome} te recebe deitada — deitado — sem cobrar nada. Apenas descanse.',
      'Boa noite. Tudo o que sustentou hoje continua sustentando enquanto você dorme.',
    ],
  },
  dominacoes: {
    manha: [
      'Bom dia. {nome} te lembra que você comanda seu dia — não o contrário.',
      'Hoje {nome} pede que você diga não pra uma coisa que rouba sua atenção.',
      'Sob a regência de {nome}, hoje você lidera com leveza.',
      'Bom dia. {nome} caminha à frente — você só precisa seguir o ritmo.',
      '{nome} te entrega autoridade hoje. Use com cuidado.',
    ],
    noite: [
      'Boa noite. {nome} reconhece o que você deu o seu melhor hoje. Repouse.',
      'O dia obedeceu. {nome} aprovou. Durma orgulhosa — orgulhoso.',
      '{nome} cuida do amanhã. Você não precisa antecipar.',
      'Sob {nome}, o sono é descanso de quem cumpriu sua parte.',
      'Boa noite. Quem comanda também precisa descansar. {nome} te dá permissão.',
    ],
  },
  potencias: {
    manha: [
      'Bom dia. {nome} te dá força hoje — não pra brigar, pra atravessar.',
      'Hoje {nome} segura sua mão na hora em que você quiser desistir.',
      'Sob a coragem de {nome}, hoje você dá o passo que vinha adiando.',
      'Bom dia. {nome} caminha com você por terrenos difíceis. Você não está só.',
      '{nome} é músculo que cresce quando você usa. Use hoje.',
    ],
    noite: [
      'Boa noite. {nome} reconhece sua resistência hoje. Repouse a guerreira — o guerreiro.',
      '{nome} guarda a porta esta noite. Você dorme em segurança.',
      'Sob {nome}, o que te ameaçou hoje não te alcança no sono.',
      'Boa noite. A força que você usou hoje volta amanhã, com juros.',
      '{nome} te lembra: descansar também é coragem.',
    ],
  },
  virtudes: {
    manha: [
      'Bom dia. {nome} traz cura pra alguma coisa em você que pediu silenciosamente ontem.',
      'Hoje {nome} se aproxima das pessoas que cruzam seu caminho — e cura através de você.',
      'Sob {nome}, hoje é dia de gentileza com quem mora dentro de você.',
      'Bom dia. {nome} faz milagres pequenos. Preste atenção.',
      '{nome} cuida da sua saúde hoje — do corpo e do que está rachado por dentro.',
    ],
    noite: [
      'Boa noite. {nome} cura enquanto você dorme. Não precisa nem entender.',
      'O que doeu hoje, {nome} acolhe. Durma com isso entregue.',
      'Sob {nome}, esta noite é remédio.',
      '{nome} te lembra: a cura é processo. Continue dormindo.',
      'Boa noite. Acorde amanhã mais inteira — mais inteiro — do que se deitou.',
    ],
  },
  principados: {
    manha: [
      'Bom dia. {nome} cuida do que é grande na sua vida hoje — destino, propósito, caminho.',
      'Hoje {nome} pede que você não confunda o pequeno com o irrelevante.',
      'Sob a regência de {nome}, hoje uma coisa se alinha discretamente. Você só vai notar depois.',
      'Bom dia. {nome} caminha contigo nos próximos meses, não só hoje. Tenha paciência.',
      '{nome} te lembra que cada escolha pequena constrói uma estrada.',
    ],
    noite: [
      'Boa noite. {nome} olha pelo seu destino esta noite. Você pode soltar.',
      '{nome} sabe pra onde você está indo. Não precisa saber também.',
      'Sob {nome}, o futuro se cuida sozinho. Hoje você dormiu — já basta.',
      '{nome} alinha o que precisa enquanto você descansa.',
      'Boa noite. Acorde amanhã com uma pista do caminho.',
    ],
  },
  arcanjos: {
    manha: [
      'Bom dia. {nome} te protege hoje das pessoas que não percebem que estão te drenando.',
      'Hoje {nome} pede que você ative a couraça antes de sair de casa. Visualize.',
      'Sob {nome}, hoje nada de mal te atravessa — nem o que vem de fora, nem o que você mesmo criar.',
      'Bom dia. {nome} caminha como escudo na sua frente.',
      '{nome} te lembra: você tem direito divino à proteção. Não dispense.',
    ],
    noite: [
      'Boa noite. {nome} guarda sua porta, sua casa, sua família esta noite.',
      'Sob {nome}, esta noite é fortaleza.',
      '{nome} dispersa o que tentou entrar enquanto você descansa.',
      'Boa noite. Durma como quem está sob proteção arcangélica. Porque está.',
      '{nome} te lembra: não é fraqueza pedir proteção. É sabedoria.',
    ],
  },
  anjos: {
    manha: [
      'Bom dia. {nome} traz acolhimento simples hoje — uma xícara, um abraço, uma palavra boa.',
      'Hoje {nome} pede que você seja gentil consigo mesma — consigo mesmo — primeiro.',
      'Sob {nome}, hoje as coisas pequenas voltam a importar.',
      'Bom dia. {nome} caminha com você nos detalhes. Olhe pra eles.',
      '{nome} te lembra: gratidão também é proteção.',
    ],
    noite: [
      'Boa noite. {nome} apaga as velas conforme você dorme.',
      'Sob {nome}, esta noite é colo.',
      '{nome} acompanha seu sono respirando junto.',
      'Boa noite. Durma como criança bem cuidada. Porque está.',
      '{nome} te lembra: você é amada — você é amado.',
    ],
  },
};

// Escolhe a mensagem para um anjo específico no dia/hora atual.
// type: 'morning' | 'evening'
// nome: nome do anjo do usuário (ex: "Elemiah")
// anjoN: número do anjo (1..72)
// dia: dia do mês (1..31), usado pra rotacionar entre as 5 variações
export function escolherMensagem(type, nome, anjoN, dia) {
  const coro = coroDe(anjoN);
  const tipoKey = type === 'evening' ? 'noite' : 'manha';
  const lista = TEMPLATES[coro][tipoKey];
  const indice = (dia || 1) % lista.length;
  const template = lista[indice];
  return template.split('{nome}').join(nome || 'seu anjo');
}
