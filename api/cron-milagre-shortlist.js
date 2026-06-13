// GET /api/cron-milagre-shortlist
// Roda dia 25 de cada mês. NÃO escolhe vencedor e NÃO faz sorteio.
//
// ⚖️  POSICIONAMENTO JURÍDICO (essencial — não alterar sem advogado):
// O "Milagre do mês" é um ATO EDITORIAL E DE GENEROSIDADE da marca, NÃO um
// prêmio sorteado nem contrapartida da assinatura. Por isso este job apenas
// AGRUPA pedidos elegíveis e os entrega para CURADORIA HUMANA da equipe
// (Monica + LVSV), que escolhe uma história por critérios subjetivos
// (sensibilidade, viabilidade, impacto). NÃO há aleatoriedade, NÃO há garantia
// e a escolha NÃO depende de quanto/quando a pessoa pagou.
//
// Saída: marca uma leva de pedidos como `em_curadoria` para o painel admin.

import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1';
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) return res.status(401).json({ ok: false });

  // Pedidos que o próprio usuário marcou como "quero compartilhar com a
  // comunidade / candidatar ao olhar da Monica" (consentimento explícito) e
  // que ainda não passaram por curadoria.
  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('id, user_id, texto, criado_em')
    .eq('candidato_milagre', true)
    .eq('status', 'aberto')
    .order('criado_em', { ascending: true })
    .limit(200);

  if (error) return res.status(500).json({ ok: false, error: error.message });

  if (!pedidos || pedidos.length === 0) {
    return res.status(200).json({ ok: true, shortlist: 0, nota: 'Nenhum candidato neste ciclo.' });
  }

  // Apenas SINALIZA para curadoria — NÃO decide nada automaticamente.
  const ids = pedidos.map(p => p.id);
  const { error: upErr } = await supabase
    .from('pedidos')
    .update({ status: 'em_curadoria' })
    .in('id', ids);

  if (upErr) return res.status(500).json({ ok: false, error: upErr.message });

  return res.status(200).json({
    ok: true,
    shortlist: ids.length,
    nota: 'Pedidos enviados para curadoria humana (Monica + equipe). Escolha editorial, sem sorteio.',
  });
}
