// GET /api/admin-leads-stats — série diária dos últimos N dias + breakdown por origem.
// Protegido por ADMIN_KEY.

import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: 'Não autorizado' });
  }
  const dias = Math.min(60, Math.max(7, Number(req.query.dias) || 30));
  const inicio = new Date(Date.now() - dias * 86400000);
  const inicioISO = inicio.toISOString();

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('criado_em, origem')
      .gte('criado_em', inicioISO)
      .order('criado_em', { ascending: true });
    if (error) return res.status(500).json({ ok: false, error: error.message });

    // bucket por dia (YYYY-MM-DD) e contagem por origem
    const porDia = {};
    const porOrigem = {};
    (data || []).forEach(l => {
      const d = (l.criado_em || '').slice(0, 10);
      if (!d) return;
      porDia[d] = (porDia[d] || 0) + 1;
      const o = l.origem || 'organico';
      porOrigem[o] = (porOrigem[o] || 0) + 1;
    });

    // Preenche zero nos dias sem cadastro pra o gráfico ficar contínuo
    const serie = [];
    for (let i = 0; i < dias; i++) {
      const dt = new Date(inicio.getTime() + i * 86400000);
      const k = dt.toISOString().slice(0, 10);
      serie.push({ data: k, total: porDia[k] || 0 });
    }

    return res.status(200).json({
      ok: true,
      dias,
      total: data ? data.length : 0,
      serie,
      origens: porOrigem,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
