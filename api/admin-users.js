// API do Admin para gerenciar usuários cadastrados.
// Protegido por ADMIN_KEY.
//
// GET  /api/admin-users                        -> lista usuários
// POST /api/admin-users {action:'plano', id, plano}        -> altera o plano
// POST /api/admin-users {action:'excluir', id}             -> exclui conta (auth + users)
// POST /api/admin-users {action:'redefinir_perfil', id}    -> limpa perfil pra refazer onboarding

import { supabase } from './_lib/supabase.js';

function ok(req){ return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY; }

export default async function handler(req, res) {
  if (!ok(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' });

  if (req.method === 'GET') {
    // Lista os perfis
    const { data: perfis, error: e1 } = await supabase
      .from('users')
      .select('id,nome,nascimento,anjo_n,anjo_nome,plano,ritual_horario,criado_em')
      .order('criado_em', { ascending: false })
      .limit(500);
    if (e1) return res.status(500).json({ ok: false, error: e1.message });

    // Busca os e-mails do auth.users e mescla
    try {
      const { data: authList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const emails = {};
      (authList && authList.users || []).forEach(u => { emails[u.id] = u.email; });
      const linhas = (perfis || []).map(p => ({ ...p, email: emails[p.id] || null }));
      return res.status(200).json({ ok: true, usuarios: linhas });
    } catch (_) {
      return res.status(200).json({ ok: true, usuarios: perfis || [] });
    }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.id) return res.status(400).json({ ok: false, error: 'id obrigatório' });

    if (b.action === 'plano') {
      if (!b.plano) return res.status(400).json({ ok: false, error: 'plano obrigatório' });
      const validos = ['free', 'mensal', 'anual', 'cortesia'];
      if (validos.indexOf(b.plano) < 0) return res.status(400).json({ ok: false, error: 'plano inválido' });
      const { error } = await supabase.from('users').update({ plano: b.plano }).eq('id', b.id);
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'redefinir_perfil') {
      const { error } = await supabase.from('users')
        .update({ nome: null, nascimento: null, anjo_n: null, anjo_nome: null })
        .eq('id', b.id);
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'excluir') {
      // Exclui auth.users (cascateia via foreign key se configurado) + perfil
      try {
        await supabase.from('users').delete().eq('id', b.id);
        const { error } = await supabase.auth.admin.deleteUser(b.id);
        if (error) return res.status(500).json({ ok: false, error: error.message });
        return res.status(200).json({ ok: true });
      } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
      }
    }

    return res.status(400).json({ ok: false, error: 'ação inválida' });
  }

  return res.status(405).end();
}
