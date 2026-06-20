// POST /api/save-perfil
// Headers: Authorization: Bearer <jwt do Supabase> (opcional — sem ele, retorna só o anjo calculado)
// Body: { nome, nascimento: 'YYYY-MM-DD', hora?, ritual_horario? }
// Calcula o anjo regente no servidor e faz upsert do perfil em public.users
// usando o id do JWT validado (nunca confiar em userId vindo do body).

import { supabase } from './_lib/supabase.js';
import { verifyUser } from './_lib/auth.js';
import { anjoRegente } from './_lib/anjos.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { nome, nascimento, hora, ritual_horario } = req.body || {};

  if (!nome || !/^\d{4}-\d{2}-\d{2}$/.test(nascimento || '')) {
    return res.status(400).json({ ok: false, error: 'Informe nome e nascimento (YYYY-MM-DD).' });
  }
  // Anti-DoS: limita tamanho do nome
  if (typeof nome === 'string' && nome.length > 120) {
    return res.status(413).json({ ok: false, error: 'Nome muito longo.' });
  }

  let anjo;
  try { anjo = anjoRegente(nascimento); }
  catch (e) { return res.status(400).json({ ok: false, error: e.message }); }

  // Sem JWT → onboarding pré-login: devolve só o anjo, não persiste.
  const userId = await verifyUser(req);
  if (!userId) {
    return res.status(200).json({ ok: true, persistido: false, anjo });
  }

  const { error } = await supabase.from('users').upsert({
    id: userId,
    nome,
    nascimento,
    hora_nasc: hora || null,
    anjo_n: anjo.n,
    anjo_nome: anjo.nome,
    ritual_horario: ritual_horario || 'morning',
  }, { onConflict: 'id' });

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true, persistido: true, anjo });
}
