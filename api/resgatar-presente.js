// POST /api/resgatar-presente
// Body: { codigo, nome, whatsapp, nascimento (YYYY-MM-DD), senha }
// Resgata um presente: valida código, calcula anjo, cria usuário no Supabase
// com senha, marca presente como resgatado e seta plano=anual cortesia.
// Retorna ok+email — usuário entra com email + senha logo em seguida.

import { supabase } from './_lib/supabase.js';
import { anjoRegente } from './_lib/anjos.js';
import { enviarEmail } from './_lib/resend.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { codigo, nome, whatsapp, nascimento, senha } = req.body || {};

  // Validação básica
  if (!codigo || !/^PRES-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(codigo).toUpperCase())) {
    return res.status(400).json({ ok: false, error: 'Código inválido. Verifique no email que você recebeu.' });
  }
  if (!nome || nome.length > 120 || nome.length < 2) {
    return res.status(400).json({ ok: false, error: 'Informe seu nome completo.' });
  }
  const whatsappLimpo = String(whatsapp || '').replace(/\D/g, '');
  if (whatsappLimpo.length < 10 || whatsappLimpo.length > 11) {
    return res.status(400).json({ ok: false, error: 'WhatsApp incompleto. Use DDD + número.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento || '')) {
    return res.status(400).json({ ok: false, error: 'Informe sua data de nascimento (formato AAAA-MM-DD).' });
  }
  if (!senha || String(senha).length < 8) {
    return res.status(400).json({ ok: false, error: 'Senha precisa ter pelo menos 8 caracteres.' });
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

    // 3) Cria usuário Supabase com senha — usuário entra com email+senha
    //    Se já existir, atualiza a senha (idempotente).
    let userId = null;
    let jaExistia = false;
    try {
      const { data: criado, error: errUser } = await supabase.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,  // pula confirmação — quem resgatou via código tem o email
        user_metadata: { fonte: 'presente', codigo: codigoNorm, nome, whatsapp: whatsappLimpo },
      });
      if (criado && criado.user) userId = criado.user.id;
      if (errUser) {
        if (/already (registered|exists)/i.test(errUser.message || '')) {
          jaExistia = true;
        } else {
          console.warn('[resgatar] createUser:', errUser.message);
        }
      }
    } catch (e) {
      // se admin API falhar (provedor diferente), continua
    }

    // 4) Se já existia, busca o ID e ATUALIZA a senha
    if (!userId) {
      try {
        const { data: listed } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listed && listed.users) {
          const found = listed.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
          if (found) {
            userId = found.id;
            // Atualiza senha pra senha que ela acabou de criar
            try {
              await supabase.auth.admin.updateUserById(userId, { password: senha, email_confirm: true });
            } catch (e) {
              console.warn('[resgatar] updateUserById:', e?.message);
            }
          }
        }
      } catch (_) {}
    }

    // 5) Upsert perfil + plano cortesia
    if (userId) {
      await supabase.from('users').upsert({
        id: userId,
        email,
        nome,
        nome_completo: nome,
        whatsapp: whatsappLimpo,
        nascimento,
        anjo_n: anjo.n,
        anjo_nome: anjo.nome,
        plano: 'anual',  // cortesia anual de 1 ano
        consent_lgpd_em: new Date().toISOString(),
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

    return res.status(200).json({
      ok: true,
      email,
      anjo: { n: anjo.n, nome: anjo.nome },
      ja_existia: jaExistia,
    });
  } catch (e) {
    console.error('[resgatar-presente]', e?.message);
    return res.status(500).json({ ok: false, error: 'Erro ao resgatar. Tente novamente em alguns minutos.' });
  }
}
