// GET /api/mapa-cabalistico?nascimento=YYYY-MM-DD&hora=HH:MM
// Auth: Bearer access_token (premium-only)
// Gera o "Mapa Cabalístico" único do usuário, combinando:
//   1. Anjo de NASCIMENTO  — quem o usuário é
//   2. Anjo da HUMANIDADE  — quem a humanidade era naquele instante
//   3. Anjo do DIA ATUAL   — quem rege o momento em que ele consulta
//
// Os três formam uma "tríade" — não é horóscopo, é leitura de presença.
// Texto programático (não GPT) — vem da doutrina da Monica.

import { anjoRegente, anjoDaHora } from './_lib/anjos.js';
import { verifyUser } from './_lib/auth.js';
import { supabase } from './_lib/supabase.js';

// Oferta NÃO concede premium (reframe ético): só planos pagos/cortesia.
// 'cortesia' é setado pela equipe via /admin (tempo-de-graça) — premium real.
const PLANOS_PREMIUM = ['trial', 'mensal', 'anual', 'cortesia'];

function pretty(coro){
  const m = {
    'Serafins':'Serafins','Querubins':'Querubins','Tronos':'Tronos',
    'Dominações':'Dominações','Potências':'Potências','Virtudes':'Virtudes',
    'Principados':'Principados','Arcanjos':'Arcanjos','Anjos':'Anjos',
  };
  return m[coro] || coro;
}

function tipoTriade(a1, a2, a3){
  // Conta quantos coros são iguais entre os 3
  const coros = [a1.coro, a2.coro, a3.coro];
  const unicos = new Set(coros);
  if(unicos.size === 1) return 'concentrada';   // tudo no mesmo coro — vocação clara
  if(unicos.size === 3) return 'expansiva';     // três coros diferentes — alma multidimensional
  return 'focada';                              // 2 iguais 1 diferente
}

function leituraTriade(tipo, a1, a2, a3){
  switch(tipo){
    case 'concentrada':
      return `Os três anjos da sua tríade pertencem ao mesmo coro — os ${pretty(a1.coro)}. Sua presença no mundo é uma vocação clara, sem dispersão. O que você nasceu pra carregar, o céu reforça em cada instante. Esse alinhamento é raro — significa que sua existência tem direção espiritual definida desde a origem.`;
    case 'expansiva':
      return `Os três anjos vêm de coros diferentes — ${pretty(a1.coro)}, ${pretty(a2.coro)}, ${pretty(a3.coro)}. Sua alma é multidimensional: nasceu de uma fonte, foi entregue ao mundo por outra, e agora vive sob uma terceira. Isso é riqueza, não confusão. Você consegue transitar entre realidades espirituais que outras pessoas só vislumbram.`;
    default:
      return `Sua tríade tem dois anjos do mesmo coro e um terceiro distinto — uma combinação focada. Existe um eixo central na sua presença (o que se repete) e um chamado complementar (o que se diferencia). Os dois funcionam juntos: o eixo te sustenta, o terceiro te chama pra crescer.`;
  }
}

function ritualTriade(a1, a2, a3){
  return [
    `De manhã, ao acordar, dedique 30 segundos a ${a1.nome} — o anjo que te trouxe ao mundo. Diga em silêncio: "Sou aquela(e) que você guarda."`,
    `Durante o dia, quando passar pelo intervalo de ${a3.nome} (${a3.intervalo}), faça uma pausa. Este é o anjo que rege seu agora — escute o que ele aproxima.`,
    `À noite, antes de dormir, acenda uma vela (ou só imagine a chama) e chame ${a2.nome}, o anjo que regia a humanidade quando você chegou. Devolva o dia ao todo de onde você veio.`,
  ];
}

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).end();

  // Auth (mapa é premium)
  const userId = await verifyUser(req);
  if(!userId) return res.status(401).json({ ok: false, error: 'Faça login pra ver seu mapa.' });

  // Gate de premium: login sozinho não basta — o Mapa é exclusivo de assinantes.
  const { data: u } = await supabase.from('users').select('plano').eq('id', userId).maybeSingle();
  if(!u || !PLANOS_PREMIUM.includes(u.plano)){
    return res.status(402).json({ ok: false, error: 'O Mapa Cabalístico é exclusivo para assinantes.' });
  }

  const nascimento = String(req.query.nascimento || '');
  const hora = String(req.query.hora || '');

  if(!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)){
    return res.status(400).json({ ok: false, error: 'Data de nascimento inválida (use YYYY-MM-DD).' });
  }

  try {
    // 1. Anjo de nascimento
    const aNascimento = anjoRegente(nascimento);
    aNascimento.coro = aNascimento.coro || 'Anjos';

    // 2. Anjo da Humanidade — se tem hora, calcula pelo nascimento; senão pega meio-dia
    let aHumanidade;
    if(/^\d{2}:\d{2}$/.test(hora)){
      const [h, m] = hora.split(':').map(Number);
      const totalMin = h * 60 + m;
      aHumanidade = anjoDaHora(totalMin);
    } else {
      aHumanidade = anjoDaHora(12 * 60); // meio-dia como referência neutra
    }

    // 3. Anjo do momento atual (servidor)
    const aMomento = anjoDaHora(new Date());

    const a1 = { n:aNascimento.n, nome:aNascimento.nome, dom:aNascimento.atributo, coro:aNascimento.coro };
    const a2 = { n:aHumanidade.n, nome:aHumanidade.nome, dom:aHumanidade.atributo, coro:aHumanidade.coro, intervalo:aHumanidade.intervalo };
    const a3 = { n:aMomento.n, nome:aMomento.nome, dom:aMomento.atributo, coro:aMomento.coro, intervalo:aMomento.intervalo };

    const tipo = tipoTriade(a1, a2, a3);
    return res.status(200).json({
      ok: true,
      tipo,
      leitura: leituraTriade(tipo, a1, a2, a3),
      ritual: ritualTriade(a1, a2, a3),
      anjos: { nascimento: a1, humanidade: a2, momento: a3 },
      gerado_em: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[mapa-cabalistico]', e?.message);
    return res.status(500).json({ ok: false, error: 'Não consegui gerar seu mapa agora.' });
  }
}
