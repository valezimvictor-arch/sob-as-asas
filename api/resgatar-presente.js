// POST /api/resgatar-presente
// Body: { codigo, nome, nascimento (YYYY-MM-DD) }
// Resgata um presente: valida código, calcula anjo, cria usuário no Supabase
// (passwordless), marca presente como resgatado e seta plano=anual cortesia.
// Retorna ok+email — frontend dispara o magic link na sequência.

import { supabase } from './_lib/supabase.js';
import { anjoRegente } from './_lib/anjos.js';
import { enviarEmail } from './_lib/resend.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { codigo, nome, nascimento } = req.body || {};

  // Validação básica
  if (!codigo || !/^PRES-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(codigo).toUpperCase())) {
    return res.status(400).json({ ok: false, error: 'Código inválido. Verifique no email que você recebeu.' });
  }
  if (!nome || nome.length > 120) {
    return res.status(400).json({ ok: false, error: 'Informe seu nome.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento || '')) {
    return res.status(400).json({ ok: false, error: 'Informe sua data de nascimento (formato AAAA-MM-DD).' });
  }

  const codigoNorm = String(codigo).toUpperCase().trim();

  try {
    // 1) Busca o presente
    const { data: presente, error: errBusca } = await supabase
      .from('presentes')
      .select('*')
      .eq('codigo', codigoNorm)
      .maybeSingle();

    if (errBusca || !presente) {
      return res.status(404).json({ ok: false, error: 'Código não encontrado ou inválido.' });
    }
    if (presente.status === 'resgatado') {
      return res.status(409).json({ ok: false, error: 'Esse presente já foi resgatado. Acesse sobasasas.com.br para entrar.' });
    }
    if (presente.expira_em && new Date(presente.expira_em) < new Date()) {
      return res.status(410).json({ ok: false, error: 'Esse presente expirou. Entre em contato com contato@sobasasas.com.br.' });
    }

    const email = presente.para_email;

    // 2) Calcula anjo regente da pessoa
    let anjo;
    try {
      anjo = anjoRegente(nascimento);
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'Data de nascimento inválida.' });
    }

    // 3) Cria usuário Supabase (passwordless — usuário entra depois via magic link)
    //    Se já existir, ignora o erro (idempotente)
    let userId = null;
    try {
      const { data: criado, error: errUser } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,  // pula confirmação — quem resgatou via código tem o email
        user_metadata: { fonte: 'presente', codigo: codigoNorm },
      });
      if (criado && criado.user) userId = criado.user.id;
      if (errUser && !/already (registered|exists)/i.test(errUser.message || '')) {
        console.warn('[resgatar] createUser:', errUser.message);
      }
    } catch (e) {
      // se admin API falhar (provedor diferente), continua — o usuário pode entrar via magic link
    }

    // 4) Se não conseguiu criar (já existia), busca o ID
    if (!userId) {
      try {
        const { data: listed } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listed && listed.users) {
          const found = listed.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
          if (found) userId = found.id;
        }
      } catch (_) {}
    }

    // 5) Upsert perfil + plano cortesia
    if (userId) {
      await supabase.from('users').upsert({
        id: userId,
        email,
        nome,
        nascimento,
        anjo_n: anjo.n,
        anjo_nome: anjo.nome,
        plano: 'anual',  // cortesia anual de 1 ano
      }, { onConflict: 'id' });

      // Cria registro de assinatura "cortesia" com periodo_fim = +1 ano
      const umAno = new Date(); umAno.setFullYear(umAno.getFullYear() + 1);
      await supabase.from('assinaturas').upsert({
        user_id: userId,
        plano: 'anual',
        status: 'cortesia',
        periodo_fim: umAno.toISOString(),
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    // 6) Marca o presente como resgatado
    await supabase.from('presentes').update({
      status: 'resgatado',
      resgatado_em: new Date().toISOString(),
      resgatado_por_user_id: userId,
    }).eq('codigo', codigoNorm);

    // 7) Dispara magic link pro email pra que a pessoa entre no app
    try {
      const { error: errLink } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: 'https://sobasasas.com.br' },
      });
      if (errLink) console.warn('[resgatar] signInWithOtp:', errLink.message);
    } catch (_) {}

    return res.status(200).json({
      ok: true,
      email,
      anjo: { n: anjo.n, nome: anjo.nome },
    });
  } catch (e) {
    console.error('[resgatar-presente]', e?.message);
    return res.status(500).json({ ok: false, error: 'Erro ao resgatar. Tente novamente em alguns minutos.' });
  }
}
