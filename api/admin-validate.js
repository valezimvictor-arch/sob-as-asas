// GET /api/admin-validate — valida a ADMIN_KEY de forma barata (sem puxar
// dados). Usado pelo boot e pelo login do /admin pra checar a chave antes de
// revelar o painel, em vez de chamar /api/admin-metrics (que computa o
// dashboard inteiro só pra validar).
import { adminKeyValida } from './_lib/adminAuth.js';

export default function handler(req, res) {
  if (!adminKeyValida(req)) {
    return res.status(401).json({ ok: false, error: 'Não autorizado' });
  }
  return res.status(200).json({ ok: true });
}
