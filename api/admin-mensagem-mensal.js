// API do Admin para gerenciar Mensagens Mensais.
// Protegido por ADMIN_KEY.
//
// GET  /api/admin-mensagem-mensal                          → lista todas
// GET  /api/admin-mensagem-mensal?mes=8&ano=2026           → filtra por mes/ano
// POST /api/admin-mensagem-mensal {action:'criar', ...}
// POST /api/admin-mensagem-mensal {action:'toggle', id}    → publica/despublica
// POST /api/admin-mensagem-mensal {action:'excluir', id}

import { supabase } from './_lib/supabase.js';

function ok(req){ return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY; }

export default async function handler(req, res) {
  if (!ok(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' });

  if (req.method === 'GET') {
    let q = supabase.from('mensagens_mensais')
      .select('id, anjo_n, mes, ano, titulo, audio_url, duracao_seg, publicado, atualizado_em')
      .order('ano', { ascending: false }).order('mes', { ascending: false }).order('anjo_n', { ascending: true })
      .limit(500);
    if (req.query.mes) q = q.eq('mes', Number(req.query.mes));
    if (req.query.ano) q = q.eq('ano', Number(req.query.ano));
    const { data, error } = await q;
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, mensagens: data || [] });
  }

  if (req.method === 'POST') {
    const b = req.body || {};

    if (b.action === 'criar') {
      const requeridos = ['anjo_n', 'mes', 'ano', 'texto'];
      for (const k of requeridos) {
        if (b[k] === undefined || b[k] === null || b[k] === '') {
          return res.status(400).json({ ok: false, error: `Campo obrigatório: ${k}` });
        }
      }
      const linha = {
        anjo_n: Number(b.anjo_n),
        mes: Number(b.mes),
        ano: Number(b.ano),
        titulo: b.titulo || null,
        texto: b.texto,
        audio_url: b.audio_url || null,
        duracao_seg: b.duracao_seg ? Number(b.duracao_seg) : null,
        publicado: !!b.publicado,
        atualizado_em: new Date().toISOString(),
      };
      // upsert: se já existe (anjo_n, mes, ano) atualiza
      const { data, error } = await supabase
        .from('mensagens_mensais')
        .upsert(linha, { onConflict: 'anjo_n,mes,ano' })
        .select().single();
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true, mensagem: data });
    }

    if (b.action === 'toggle') {
      if (!b.id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
      const { data: cur } = await supabase.from('mensagens_mensais').select('publicado').eq('id', b.id).single();
      const { error } = await supabase.from('mensagens_mensais').update({ publicado: !(cur && cur.publicado) }).eq('id', b.id);
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'excluir') {
      if (!b.id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
      const { error } = await supabase.from('mensagens_mensais').delete().eq('id', b.id);
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: 'ação inválida' });
  }

  return res.status(405).end();
}
