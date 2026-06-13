-- ─────────────────────────────────────────────────────────────────────────
-- Sob as Asas — Seed de conteúdo inicial (rode no SQL Editor do Supabase)
--
-- ⚠️  PLACEHOLDERS: títulos/coleções são a estrutura; os TEXTOS e as MÍDIAS
-- (media_url) definitivos são da Monica. Suba os áudios/vídeos no Storage
-- (bucket `conteudos`) e cole as URLs públicas em media_url. NÃO publicar
-- textos "como dela" sem curadoria.
--
-- `premium=false` = amostra grátis (isca de hábito/ativação).
-- ─────────────────────────────────────────────────────────────────────────

insert into public.conteudos (titulo, formato, colecao, corpo, duracao_seg, salmo_num, premium, data_pub, publicado) values
  -- Mensagem da semana (âncora — vídeo)
  ('Mensagem da Monica — esta semana', 'video', 'mensagem_semana', null, 240, null, false, current_date, true),
  ('Como falar com seu anjo',          'video', 'mensagem_semana', null, 480, null, true,  current_date, true),

  -- Salmo Diário (pilar de recorrência — áudio)
  ('Salmo 91 — o salmo da proteção',      'salmo', 'salmo_diario', 'Aquele que habita no esconderijo do Altíssimo…', 120, 91,  false, current_date, true),
  ('Salmo 23 — o Senhor é meu pastor',    'salmo', 'salmo_diario', 'O Senhor é o meu pastor; nada me faltará…',        120, 23,  true,  current_date, true),
  ('Salmo 121 — meu socorro vem do alto', 'salmo', 'salmo_diario', 'Elevo os meus olhos para os montes…',              120, 121, true,  current_date, true),

  -- Os 72 Anjos (série)
  ('Os 72 nomes e suas forças',          'video', '72_anjos', null, 720, null, true, current_date, true),
  ('Seu anjo regente em profundidade',   'audio', '72_anjos', null, 540, null, true, current_date, true),

  -- Para dormir
  ('Oração da noite',                    'audio', 'para_dormir', null, 240, null, false, current_date, true),
  ('Meditação guiada para dormir',       'audio', 'para_dormir', null, 720, null, true,  current_date, true),

  -- Prosperidade / Proteção
  ('Anjo da prosperidade',               'audio', 'prosperidade', null, 360, null, true, current_date, true),
  ('Oração de proteção do dia',          'audio', 'protecao',     null, 180, null, false, current_date, true);

-- Rótulos amigáveis das coleções (usados na UI):
--   mensagem_semana → "Mensagem da semana"
--   salmo_diario    → "Salmo Diário"
--   72_anjos        → "Os 72 Anjos"
--   para_dormir     → "Para dormir"
--   prosperidade    → "Prosperidade"
--   protecao        → "Proteção"
