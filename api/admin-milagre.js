// API do painel de curadoria do Milagre do mês. Protegido por ADMIN_KEY.
//
// ⚖️  A ESCOLHA É HUMANA E EDITORIAL — esta API não sorteia nem ranqueia.
// Ela só lista os candidatos (que consentiram) e registra a decisão que a
// Monica/equipe tomou. Mantém a blindagem de não-sorteio.
//
// GET  /api/admin-milagre?action=candidatos        → lista candidatos
// POST /api/admin-milagre { action:'escolher', pedidoId, historia, mesRef }
// POST /api/admin-milagre { action:'publicar', milagreId }

import { supabase } from './_lib/supabase.js';

function authorized(req) {
  return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' });

  // ── Listar candidatos para curadoria ──
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, texto, criado_em, status, users(nome)')
      .eq('candidato_milagre', true)
      .in('status', ['aberto', 'em_curadoria'])
      .order('criado_em', { ascending: true })
      .limit(200);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, candidatos: data || [] });
  }

  if (req.method === 'POST') {
    const { action, pedidoId, historia, mesRef, milagreId } = req.body || {};

    // ── Escolher um pedido como o Milagre do mês (cria rascunho) ──
    if (action === 'escolher') {
      if (!pedidoId) return res.status(400).json({ ok: false, error: 'pedidoId obrigatório' });
      const mes = mesRef || new Date().toISOString().slice(0, 8) + '01'; // 1º dia do mês

      const { data: milagre, error: e1 } = await supabase
        .from('milagres')
        .insert({ pedido_id: pedidoId, historia: historia || null, mes_ref: mes, publicado: false })
        .select()
        .single();
      if (e1) return res.status(500).json({ ok: false, error: e1.message });

      // marca o pedido como realizado (consequência editorial, não sorteio)
      await supabase.from('pedidos').update({ status: 'realizado' }).eq('id', pedidoId);
      return res.status(200).json({ ok: true, milagre });
    }

    // ── Publicar o milagre (vai pro app dos usuários) ──
    if (action === 'publicar') {
      if (!milagreId) return res.status(400).json({ ok: false, error: 'milagreId obrigatório' });
      const { error } = await supabase.from('milagres').update({ publicado: true }).eq('id', milagreId);
      if (error) return res.status(500).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: 'Ação inválida' });
  }

  return res.status(405).end();
}
