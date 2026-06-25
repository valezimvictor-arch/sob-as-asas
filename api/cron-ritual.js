// GET /api/cron-ritual?type=morning|evening
// Cron diário: envia o push do ritual personalizado por anjo regente.
// Agendado no vercel.json. Protegido para rodar só via cron da Vercel.
//
// v3: combina 3 camadas de personalização:
//   1. Anjo de nascimento do usuário (mensagem por coro)
//   2. Anjo da HORA atual (contexto cósmico no momento do envio)
//   3. Contexto comportamental (último login → "sentiu falta" /
//      "celebrou retorno" / "primeira vez do dia")

import { supabase } from './_lib/supabase.js';
import webpush from 'web-push';
import { escolherMensagem } from './_lib/mensagens-anjo.js';
import { anjoDaHora } from './_lib/anjos.js';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:contato@sobasasas.com.br',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Fallback genérico se o usuário não tiver perfil ainda
const FALLBACK = {
  morning: { title: '🕊️ Bom dia, você está sob as asas', body: 'Receba a proteção do seu anjo para hoje.' },
  evening: { title: '✨ Hora da gratidão', body: 'Feche o dia em paz com seu anjo da guarda.' },
};

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  const type = req.query.type === 'evening' ? 'evening' : 'morning';
  const dia = new Date().getDate();
  const tituloPrefix = type === 'evening' ? '✨' : '🕊️';

  // Busca inscrições push do horário
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')
    .eq('ritual_horario', type);
  if (error) return res.status(500).json({ ok: false, error: error.message });

  if (!subs || !subs.length) {
    return res.status(200).json({ ok: true, type, enviados: 0, removidos: 0 });
  }

  // Busca os perfis de uma vez (n + nome do anjo + última atividade)
  const userIds = [...new Set(subs.map(s => s.user_id).filter(Boolean))];
  const perfisById = {};
  if (userIds.length) {
    const { data: perfis } = await supabase
      .from('users')
      .select('id, anjo_n, anjo_nome, ultimo_acesso_em')
      .in('id', userIds);
    (perfis || []).forEach(p => { perfisById[p.id] = p; });
  }

  // Anjo regente do MOMENTO do envio — mesmo pra todos (é universal)
  const anjoMomento = anjoDaHora(new Date());

  // Contexto comportamental — quantos dias desde o último acesso
  function diasDesdeUltimoAcesso(ts) {
    if (!ts) return null;
    const ms = Date.now() - new Date(ts).getTime();
    return Math.floor(ms / 86400000);
  }
  // Prefixos contextuais — sutis, devocionais
  function prefixoBehavior(dias) {
    if (dias === null) return '';                // primeira vez sem registro
    if (dias <= 1) return '';                    // recorrente, sem prefixo
    if (dias === 2) return '';
    if (dias <= 6) return 'Você voltou. ';
    if (dias <= 14) return 'Senti sua falta. ';
    return 'A chama ficou acesa esperando você. ';
  }

  let enviados = 0, removidos = 0, personalizados = 0, comContexto = 0;
  for (const s of subs) {
    const perfil = perfisById[s.user_id];
    let payload;
    if (perfil && perfil.anjo_n && perfil.anjo_nome) {
      let body = escolherMensagem(type, perfil.anjo_nome, perfil.anjo_n, dia);
      const dias = diasDesdeUltimoAcesso(perfil.ultimo_acesso_em);
      const prefBeh = prefixoBehavior(dias);
      if (prefBeh) { body = prefBeh + body; comContexto++; }

      // Anjo da hora atual entra como "sub-linha" — contexto cósmico
      // do momento exato em que o push chega. Diferente do anjo de
      // nascimento (que é fixo do usuário): este muda a cada 20 min.
      const sublineMomento = (anjoMomento.nome && anjoMomento.nome !== perfil.anjo_nome)
        ? ` (${anjoMomento.nome} rege agora)` : '';

      payload = {
        title: `${tituloPrefix} ${perfil.anjo_nome} está com você${sublineMomento}`,
        body,
        url: '/?action=ritual&utm_source=push&utm_campaign=ritual_diario',
      };
      personalizados++;
    } else {
      payload = { ...FALLBACK[type], url: '/?action=ritual&utm_source=push' };
    }
    const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      enviados++;
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        removidos++;
      }
    }
  }

  return res.status(200).json({ ok: true, type, enviados, removidos, personalizados, comContexto, anjoMomento: anjoMomento.nome });
}
