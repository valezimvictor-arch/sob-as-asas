// Verifica o JWT do usuário no header Authorization e devolve o id.
// Uso:  const userId = await verifyUser(req); if(!userId) return 401.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
// Cliente "anon" só para validar o JWT — não usar para escrever.
const authClient = (url && anon) ? createClient(url, anon, { auth: { persistSession: false } }) : null;

export async function verifyUser(req) {
  try {
    const h = req.headers['authorization'] || req.headers['Authorization'];
    if (!h || !h.startsWith('Bearer ')) return null;
    const token = h.slice(7).trim();
    if (!token || !authClient) return null;
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data || !data.user) return null;
    return data.user.id;
  } catch (_) {
    return null;
  }
}
