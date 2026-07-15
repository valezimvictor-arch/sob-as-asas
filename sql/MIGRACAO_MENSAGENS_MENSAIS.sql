-- ─────────────────────────────────────────────────────────────────────────
-- MIGRAÇÃO — Mensagem mensal do seu anjo
-- Produto-âncora premium: uma mensagem por anjo por mês.
-- Rode no Supabase → SQL Editor → Run.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mensagens_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anjo_n smallint NOT NULL,                       -- 1..72
  mes smallint NOT NULL,                          -- 1..12
  ano smallint NOT NULL,                          -- 2026, 2027...
  titulo text,                                    -- "Junho de Vehuiah", etc.
  texto text NOT NULL,                            -- corpo da mensagem (800-1500 palavras)
  audio_url text,                                 -- opcional: voz da Monica
  duracao_seg int,                                -- duração do áudio se houver
  publicado boolean DEFAULT false,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(anjo_n, mes, ano)
);

ALTER TABLE public.mensagens_mensais ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer um logado pode ler — gating de premium é no front
-- (mensagem aparece para todos, mas o card mostra teaser + paywall para free)
DROP POLICY IF EXISTS "mensagens_mensais_read" ON public.mensagens_mensais;
CREATE POLICY "mensagens_mensais_read" ON public.mensagens_mensais
  FOR SELECT TO anon, authenticated
  USING (publicado = true);
-- Escrita: somente service_role (via admin)

CREATE INDEX IF NOT EXISTS mensagens_mensais_idx ON public.mensagens_mensais(anjo_n, ano, mes);
CREATE INDEX IF NOT EXISTS mensagens_mensais_publicado_idx ON public.mensagens_mensais(publicado, ano, mes);
