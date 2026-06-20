// GET /api/admin-metrics — painel de controle (usuários, receita, engajamento).
// Protegido por ADMIN_KEY.

import { supabase } from './_lib/supabase.js';
import { adminKeyValida } from './_lib/adminAuth.js';

const PRECO = { mensal: 19.90, anual: 149 / 12 }; // MRR equivalente (R$ 12,42/mês no anual)

async function count(tabela, filtro) {
  let q = supabase.from(tabela).select('id', { count: 'exact', head: true });
  if (filtro) q = filtro(q);
  const { count } = await q;
  return count || 0;
}

export default async function handler(req, res) {
  if (!adminKeyValida(req)) {
    return res.status(401).json({ ok: false, error: 'Não autorizado' });
  }

  const seteDias = new Date(Date.now() - 7 * 86400000).toISOString();

  try {
    const [usuarios, novos7d, pedidos, candidatos, conteudos, gratidoes, leads] = await Promise.all([
      count('users'),
      count('users', q => q.gte('criado_em', seteDias)),
      count('pedidos'),
      count('pedidos', q => q.eq('candidato_milagre', true)),
      count('conteudos'),
      count('gratidao'),
      count('leads'),
    ]);

    // assinaturas para MRR
    const { data: assin } = await supabase.from('assinaturas').select('status, plano');
    let ativos = 0, trials = 0, mrr = 0;
    (assin || []).forEach(a => {
      if (a.status === 'active') { ativos++; mrr += PRECO[a.plano] || PRECO.mensal; }
      else if (a.status === 'trialing') trials++;
    });

    return res.status(200).json({
      ok: true,
      metricas: {
        usuarios, novos7d, pedidos, candidatos, conteudos, gratidoes, leads,
        assinantes: ativos, trials,
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
