// Verificação timing-safe da chave de admin.
// Substitui o `header === process.env.ADMIN_KEY` (vulnerável a timing attack)
// por uma comparação byte-a-byte com tempo constante via crypto.timingSafeEqual.

import crypto from 'crypto';

export function adminKeyValida(req) {
  const enviada = req.headers['x-admin-key'];
  const esperada = process.env.ADMIN_KEY;
  if (!enviada || !esperada) return false;
  // crypto.timingSafeEqual exige buffers de mesmo tamanho — se diferentes,
  // ainda fazemos uma comparação "fake" pra não vazar info de tamanho.
  const a = Buffer.from(String(enviada));
  const b = Buffer.from(String(esperada));
  if (a.length !== b.length) {
    // Compara b contra ele mesmo só pra gastar o mesmo tempo
    try { crypto.timingSafeEqual(b, b); } catch (_) {}
    return false;
  }
  try {
    return crypto.timingSafeEqual(a, b);
  } catch (_) {
    return false;
  }
}
