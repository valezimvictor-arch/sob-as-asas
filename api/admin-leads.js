// GET /api/admin-leads — lista leads (landing + interesses em experiências).
// Protegido por ADMIN_KEY.

import { supabase } from './_lib/supabase.js';
import { adminKeyValida } from './_lib/adminAuth.js';

export default async function handler(req, res) {
  if (!adminKeyValida(req)) {
    return res.status(401).json({ ok: false, error: 'Não autorizado' });
  }

  const { data, error } = await supabase
    .from('leads')
    .select('id, email, origem, criado_em')
    .order('criado_em', { ascending: false })
    .limit(500);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true, leads: data || [] });
}
