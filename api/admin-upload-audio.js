// POST/GET /api/admin-upload-audio  — endpoint genérico das 3 abas de roteiro.
// Auth: x-admin-key (única defesa — validações abaixo são rígidas de propósito).
//
// Upload é SIGNED-URL: o arquivo sobe DIRETO pro Storage (bucket audios-monica),
// sem passar pela função — driblando o limite de ~4.5MB de body da Vercel.
// Fluxo no cliente: sign → uploadToSignedUrl → commit.
//
//   POST {action:'sign',   tipo, refId, filename, contentType, size}
//        → { ok, bucket, path, token, publicUrl }
//   POST {action:'commit', tipo, refId, audio_url, duracao_seg, meta? }
//        → grava na tabela (conteudos p/ 72-anjos|monica · caminhos_dias p/ caminhos)
//   GET  ?action=caminhos  → { ok, caminhos, dias }  (status da aba Caminhos)
//
// tipo ∈ '72-anjos' | 'monica' | 'caminhos'
// refId: 72-anjos → anjo_n (1..72) · caminhos → 'slug:dia' (dia 1..7) · monica → n/a
//
// PRÉ-REQUISITO no Supabase: criar o bucket `audios-monica` (público) com
// allowed MIME types (audio/*) e file size limit 50MB — é lá que MIME/tamanho
// são REALMENTE impostos (no signed-URL o arquivo não passa pela função).

import { supabase } from './_lib/supabase.js';
import { adminKeyValida } from './_lib/adminAuth.js';

const BUCKET = 'audios-monica';
const MAX_BYTES = 50 * 1024 * 1024; // 50MB
const MIME_OK = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/wav', 'audio/x-wav'];
const EXT_OK = ['mp3', 'm4a', 'ogg', 'wav'];
const SLUGS_CAMINHOS = ['acolher-perda', 'atravessar-ansiedade', 'receber-prosperidade'];
const COLECOES_MONICA = ['salmo_diario', 'mensagem_semana', 'para_dormir', 'prosperidade', 'protecao', 'conhecer_anjo', 'magia_velas', 'novena', 'bencao'];
const FORMATOS = ['audio', 'video', 'texto', 'salmo'];

const isSlug = (s) => typeof s === 'string' && /^[a-z-]+$/.test(s) && s.length <= 40;
const intIn = (v, lo, hi) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };

// caminhos: refId vem como "slug:dia". Valida ambos e devolve {slug, dia} ou null.
function parseCaminhoRef(refId) {
  const parts = String(refId || '').split(':');
  if (parts.length !== 2) return null;
  const slug = parts[0];
  const dia = intIn(parts[1], 1, 7);
  if (!isSlug(slug) || !SLUGS_CAMINHOS.includes(slug) || dia === null) return null;
  return { slug, dia };
}

export default async function handler(req, res) {
  if (!adminKeyValida(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' });

  // ── GET ?action=caminhos — status pra aba Caminhos ──
  if (req.method === 'GET') {
    if ((req.query.action || '') !== 'caminhos') return res.status(400).json({ ok: false, error: 'ação inválida' });
    const { data: caminhos, error: e1 } = await supabase
      .from('caminhos').select('id, slug, titulo, cover_emoji, ordem').order('ordem');
    if (e1) return res.status(500).json({ ok: false, error: e1.message });
    const ids = (caminhos || []).map(c => c.id);
    let dias = [];
    if (ids.length) {
      const { data, error: e2 } = await supabase
        .from('caminhos_dias').select('caminho_id, dia, titulo, audio_url, duracao_seg').in('caminho_id', ids).order('dia');
      if (e2) return res.status(500).json({ ok: false, error: e2.message });
      dias = data || [];
    }
    return res.status(200).json({ ok: true, caminhos: caminhos || [], dias });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const b = req.body || {};
  const tipo = b.tipo;
  if (!['72-anjos', 'monica', 'caminhos'].includes(tipo)) return res.status(400).json({ ok: false, error: 'tipo inválido' });

  // ── action: sign — gera token de upload assinado pro audios-monica ──
  if (b.action === 'sign') {
    const filename = String(b.filename || '');
    const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
    if (!EXT_OK.includes(ext)) return res.status(400).json({ ok: false, error: 'Extensão inválida (use mp3/m4a/ogg/wav).' });
    if (b.contentType && !MIME_OK.includes(String(b.contentType).toLowerCase())) {
      return res.status(415).json({ ok: false, error: 'Tipo de arquivo inválido (só áudio).' });
    }
    if (b.size != null && Number(b.size) > MAX_BYTES) return res.status(413).json({ ok: false, error: 'Arquivo acima de 50MB.' });

    let path;
    if (tipo === '72-anjos') {
      const n = intIn(b.refId, 1, 72);
      if (n === null) return res.status(400).json({ ok: false, error: 'anjo_n fora de 1..72' });
      path = `72-anjos/anjo-${String(n).padStart(2, '0')}-${Date.now()}.${ext}`;
    } else if (tipo === 'caminhos') {
      const ref = parseCaminhoRef(b.refId);
      if (!ref) return res.status(400).json({ ok: false, error: 'refId de caminho inválido (slug:dia)' });
      path = `caminhos/${ref.slug}/dia-${ref.dia}-${Date.now()}.${ext}`;
    } else { // monica — nome higienizado, sem traversal
      const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.');
      path = `monica/${Date.now()}_${safe}`;
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return res.status(200).json({ ok: true, bucket: BUCKET, path, token: data.token, publicUrl: pub.publicUrl });
  }

  // ── action: commit — grava o metadado na tabela certa ──
  if (b.action === 'commit') {
    const audio_url = b.audio_url;
    if (!audio_url || typeof audio_url !== 'string' || audio_url.length > 1000) {
      return res.status(400).json({ ok: false, error: 'audio_url inválido' });
    }
    let dur = null;
    if (b.duracao_seg != null && b.duracao_seg !== '') {
      dur = Math.round(Number(b.duracao_seg));
      if (!Number.isFinite(dur) || dur < 0 || dur > 36000) return res.status(400).json({ ok: false, error: 'duracao_seg inválida' });
    }

    if (tipo === 'caminhos') {
      const ref = parseCaminhoRef(b.refId);
      if (!ref) return res.status(400).json({ ok: false, error: 'refId de caminho inválido (slug:dia)' });
      const { data: cam } = await supabase.from('caminhos').select('id').eq('slug', ref.slug).maybeSingle();
      if (!cam) return res.status(404).json({ ok: false, error: 'caminho não encontrado' });
      const { data: upd, error } = await supabase.from('caminhos_dias')
        .update({ audio_url, duracao_seg: dur }).eq('caminho_id', cam.id).eq('dia', ref.dia).select('id');
      if (error) return res.status(500).json({ ok: false, error: error.message });
      // Sem isso, um (caminho, dia) não-semeado dava update em 0 linhas e
      // retornava ok:true sem persistir o áudio. Falha explícita é melhor.
      if (!upd || !upd.length) return res.status(404).json({ ok: false, error: 'Dia do caminho não encontrado — rode MIGRACAO_CAMINHOS.sql.' });
      return res.status(200).json({ ok: true });
    }

    // 72-anjos | monica → tabela conteudos
    const meta = b.meta || {};
    const titulo = String(meta.titulo || '').trim().slice(0, 300);
    if (!titulo) return res.status(400).json({ ok: false, error: 'titulo obrigatório' });

    if (tipo === '72-anjos') {
      const n = intIn(b.refId, 1, 72);
      if (n === null) return res.status(400).json({ ok: false, error: 'anjo_n fora de 1..72' });
      // Upsert por anjo: se já existe áudio desse anjo, atualiza (Substituir).
      const { data: ja } = await supabase.from('conteudos')
        .select('id').eq('colecao', '72_anjos').eq('anjo_n', n).limit(1).maybeSingle();
      if (ja && ja.id) {
        const { error } = await supabase.from('conteudos')
          .update({ titulo, media_url: audio_url, duracao_seg: dur, formato: 'audio' }).eq('id', ja.id);
        if (error) return res.status(500).json({ ok: false, error: error.message });
      } else {
        const { error } = await supabase.from('conteudos').insert({
          titulo, formato: 'audio', colecao: '72_anjos', anjo_n: n,
          media_url: audio_url, duracao_seg: dur, premium: true, publicado: true,
        });
        if (error) return res.status(500).json({ ok: false, error: error.message });
      }
      return res.status(200).json({ ok: true });
    }

    // monica (conteúdo geral)
    const colecao = String(meta.colecao || '');
    if (!COLECOES_MONICA.includes(colecao)) return res.status(400).json({ ok: false, error: 'coleção inválida' });
    const formato = FORMATOS.includes(meta.formato) ? meta.formato : 'audio';
    const { error } = await supabase.from('conteudos').insert({
      titulo, formato, colecao, media_url: audio_url, duracao_seg: dur,
      premium: meta.premium !== false, publicado: true,
      data_pub: meta.data_pub || null,
      sentimentos: Array.isArray(meta.sentimentos) ? meta.sentimentos.slice(0, 20) : [],
    });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ ok: false, error: 'ação inválida' });
}
