// API do Admin para gerenciar conteúdos (salmo do dia, vídeos, áudios, mensagens).
// Protegido por ADMIN_KEY.
//
// GET  /api/admin-conteudo                 → lista conteúdos (inclui não publicados/agendados)
// POST /api/admin-conteudo {action:'criar', ...campos}
// POST /api/admin-conteudo {action:'toggle', id}      → publica/despublica
// POST /api/admin-conteudo {action:'excluir', id}

import { supabase } from './_lib/supabase.js';
import { adminKeyValida } from './_lib/adminAuth.js';

function ok(req){ return adminKeyValida(req); }

export default async function handler(req, res) {
  if (!ok(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('conteudos')
      .select('id,titulo,formato,colecao,premium,publicado,data_pub,duracao_seg')
      .order('data_pub', { ascending: false, nullsFirst: false })
      .limit(300);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, conteudos: data || [] });
  }

  if (req.method === 'POST') {
    const b = req.body || {};

    if (b.action === 'criar') {
      if (!b.titulo || !b.formato) return res.status(400).json({ ok: false, error: 'titulo e formato são obrigatórios' });
      // Anti-DoS: limita tamanho de campos textuais (proteção independente do body limit da Vercel)
      if (typeof b.titulo === 'string' && b.titulo.length > 300) return res.status(413).json({ ok: false, error: 'titulo excede 300 caracteres' });
      if (typeof b.corpo === 'string' && b.corpo.length > 50000) return res.status(413).json({ ok: false, error: 'corpo excede 50000 caracteres' });
      const row = {
        titulo: b.titulo,
        formato: b.formato,                 // 'audio' | 'video' | 'texto' | 'salmo'
        colecao: b.colecao || null,
        corpo: b.corpo || null,
        media_url: b.media_url || null,
        duracao_seg: b.duracao_seg ? Number(b.duracao_seg) : null,
        salmo_num: b.salmo_num ? Number(b.salmo_num) : null,
        premium: b.premium !== false,
        data_pub: b.data_pub || null,       // data (pode ser futura → agendado)
        publicado: b.publicado !== false,
        sentimentos: Array.isArray(b.sentimentos) ? b.sentimentos : [],
        dia_jornada: b.dia_jornada ? Number(b.dia_jornada) : null,
        anjo_n: b.anjo_n ? Number(b.anjo_n) : null,
      };
      const { data, error } = await supabase.from('conteudos').insert(row).select().single();
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true, conteudo: data });
    }

    if (b.action === 'toggle') {
      if (!b.id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
      const { data: cur } = await supabase.from('conteudos').select('publicado').eq('id', b.id).single();
      const { error } = await supabase.from('conteudos').update({ publicado: !(cur && cur.publicado) }).eq('id', b.id);
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'excluir') {
      if (!b.id) return res.status(400).json({ ok: false, error: 'id obrigatório' });
      const { error } = await supabase.from('conteudos').delete().eq('id', b.id);
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: 'ação inválida' });
  }

  return res.status(405).end();
}
