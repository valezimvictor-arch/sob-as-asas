// POST /api/acender-vela-pedido
// Body: { pedidoId }
// Auth: Bearer access_token (Supabase)
// Acende uma vela pelo pedido de outro usuário no Círculo.
// Idempotente por dia: o mesmo user só acende UMA vela pelo mesmo pedido
// por dia (constraint do banco). Repetição no mesmo dia → ok silencioso.

import { supabase } from './_lib/supabase.js';
import { verifyUser } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const userId = await verifyUser(req);
  if (!userId) return res.status(401).json({ ok: false, error: 'Faça login pra acender uma vela.' });

  const { pedidoId } = req.body || {};
  if (!pedidoId || typeof pedidoId !== 'string') {
    return res.status(400).json({ ok: false, error: 'ID do pedido ausente.' });
  }

  try {
    // 1) Valida que o pedido existe E é público E não é do próprio user
    const { data: pedido, error: errBusca } = await supabase
      .from('pedidos')
      .select('id, user_id, publico, velas_recebidas')
      .eq('id', pedidoId)
      .maybeSingle();

    if (errBusca || !pedido) return res.status(404).json({ ok: false, error: 'Pedido não encontrado.' });
    if (!pedido.publico) return res.status(403).json({ ok: false, error: 'Pedido privado.' });
    if (pedido.user_id === userId) return res.status(400).json({ ok: false, error: 'Você já está orando pelo seu próprio pedido — não precisa acender vela aqui.' });

    // 2) Insere a vela. Constraint UNIQUE (pedido, acendedor, data_local) faz
    //    a deduplicação. Se já acendeu hoje, ignora silenciosamente.
    const { error: errInsert } = await supabase
      .from('velas_pedidos')
      .insert({ pedido_id: pedidoId, acendedor_id: userId });

    let jaAcesoHoje = false;
    if (errInsert) {
      if (/duplicate|unique/i.test(errInsert.message)) {
        jaAcesoHoje = true;
      } else {
        return res.status(500).json({ ok: false, error: errInsert.message });
      }
    }

    // 3) Lê a contagem atual (já bumped pelo trigger)
    const { data: atualizado } = await supabase
      .from('pedidos')
      .select('velas_recebidas')
      .eq('id', pedidoId)
      .maybeSingle();

    return res.status(200).json({
      ok: true,
      ja_aceso_hoje: jaAcesoHoje,
      velas_total: atualizado ? atualizado.velas_recebidas : pedido.velas_recebidas + (jaAcesoHoje ? 0 : 1),
    });
  } catch (e) {
    console.error('[acender-vela-pedido]', e?.message);
    return res.status(500).json({ ok: false, error: 'Erro ao acender vela.' });
  }
}
