// POST /api/admin-upload-url  { filename }
// Devolve uma URL assinada pra subir o arquivo DIRETO pro Supabase Storage
// (bucket 'conteudos'), sem passar pelo limite de body da Vercel. Assim dá pra
// subir vídeos/áudios grandes. Protegido por ADMIN_KEY; o segredo fica no servidor.

import { supabase } from './_lib/supabase.js';

const BUCKET = 'conteudos';

export default async function handler(req, res) {
  if (!(req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY)) {
    return res.status(401).json({ ok: false, error: 'Não autorizado' });
  }
  if (req.method !== 'POST') return res.status(405).end();

  const { filename } = req.body || {};
  if (!filename) return res.status(400).json({ ok: false, error: 'filename obrigatório' });

  const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${Date.now()}_${safe}`;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return res.status(500).json({ ok: false, error: error.message });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return res.status(200).json({ ok: true, path, token: data.token, publicUrl: pub.publicUrl });
}
