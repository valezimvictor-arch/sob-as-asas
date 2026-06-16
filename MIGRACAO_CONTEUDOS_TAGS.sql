-- ─────────────────────────────────────────────────────────────────────────
-- MIGRAÇÃO — Filtros por sentimento + jornada "Conhecer seu anjo em 7 dias"
-- Rode no Supabase → SQL Editor → Run.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Sentimentos (tags por conteúdo). Um conteúdo pode atender mais de um.
--    Valores aceitos: 'ansiedade', 'tristeza', 'duvida', 'gratidao',
--                     'protecao', 'cura', 'prosperidade', 'reconciliacao',
--                     'sono', 'foco'
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS sentimentos text[] DEFAULT '{}'::text[];
CREATE INDEX IF NOT EXISTS conteudos_sentimentos_gin ON public.conteudos USING gin(sentimentos);

-- 2) Para a jornada "Conhecer seu anjo em 7 dias":
--    colecao='conhecer_anjo' + dia_jornada (1..7) + anjo_n (NULL = genérico).
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS dia_jornada smallint;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS anjo_n smallint;
CREATE INDEX IF NOT EXISTS conteudos_jornada_idx ON public.conteudos(colecao, dia_jornada);

-- 3) Coleção "para_dormir" já existe nos labels do app; nada a fazer no banco.
--    Quando subir conteúdo, marque colecao='para_dormir' e sentimentos='{sono}'.

-- ─────────────────────────────────────────────────────────────────────────
-- (Opcional) Tagueamento em lote dos conteúdos já cadastrados.
-- Descomente e ajuste os títulos conforme seu catálogo real.
-- ─────────────────────────────────────────────────────────────────────────
-- UPDATE public.conteudos SET sentimentos = ARRAY['protecao']
--   WHERE titulo ILIKE '%salmo 91%';
-- UPDATE public.conteudos SET sentimentos = ARRAY['ansiedade','tristeza']
--   WHERE titulo ILIKE '%acolh%';
-- UPDATE public.conteudos SET sentimentos = ARRAY['sono']
--   WHERE colecao = 'para_dormir';
