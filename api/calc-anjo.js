// GET /api/calc-anjo?data=1990-05-18
// Calcula o anjo regente para uma data de nascimento (tabela da Monica).
// Retorna { ok, anjo: { n, nome, coro, atributo, dias } }
// É só leitura — pode ser chamada antes do cadastro concluir.

import { anjoRegente } from './_lib/anjos.js';

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const data = (req.query.data || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({ ok: false, error: 'Use data=YYYY-MM-DD' });
  }

  try {
    const anjo = anjoRegente(data);
    const dias = (anjo.datas || []).map(([d, m]) => `${d} ${MESES[m - 1]}`);
    return res.status(200).json({
      ok: true,
      anjo: { n: anjo.n, nome: anjo.nome, coro: anjo.coro, atributo: anjo.atributo, dias },
    });
  } catch (e) {
    console.error('[calc-anjo]', e?.message);
    return res.status(400).json({ ok: false, error: 'Data inválida.' });
  }
}
