// GET  /api/admin-newsletter           -> retorna a edição mais recente
// POST /api/admin-newsletter           -> salva nova edição (rascunho ou publicada)
// Protegido por ADMIN_KEY no header x-admin-key.

import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: 'Não autorizado' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('semana_de', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, edicao: data });
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    const requeridos = ['anjo_nome', 'anjo_mensagem'];
    for (const k of requeridos) {
      if (!b[k]) return res.status(400).json({ ok: false, error: `Campo obrigatório: ${k}` });
    }
    const linha = {
      semana_de: b.semana_de || new Date().toISOString().slice(0, 10),
      publicado: !!b.publicado,
      subject: b.subject || 'Sua Carta dos Anjos desta semana 🕊️',
      preheader: b.preheader || 'O anjo da semana, uma mensagem da Monica e uma prática curta.',
      anjo_nome: b.anjo_nome,
      anjo_datas: b.anjo_datas || '',
      anjo_coro: b.anjo_coro || '',
      anjo_mensagem: b.anjo_mensagem,
      monica_quote: b.monica_quote || '',
      pratica_titulo: b.pratica_titulo || '',
      pratica_passos: b.pratica_passos || '',
      atualizado_em: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('newsletters').insert(linha).select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, edicao: data });
  }

  return res.status(405).end();
}
