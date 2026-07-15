-- ─────────────────────────────────────────────────────────────────────────
-- MIGRAÇÃO — Contador "velas acesas hoje no Brasil"
-- Rode no Supabase → SQL Editor → Run.
--
-- Estratégia: agregado por dia (uma linha por data, total incrementado).
-- Sem PII, sem user_id — só estatística pública de presença coletiva.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.velas_diarias (
  data date PRIMARY KEY,
  total bigint NOT NULL DEFAULT 0,
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE public.velas_diarias ENABLE ROW LEVEL SECURITY;

-- Leitura aberta: qualquer um pode ver quantas velas acesas hoje
DROP POLICY IF EXISTS "velas_diarias_read" ON public.velas_diarias;
CREATE POLICY "velas_diarias_read" ON public.velas_diarias
  FOR SELECT TO anon, authenticated USING (true);
-- Escrita: somente service_role (via backend) — RLS bloqueia o resto

-- Função para incrementar atomicamente (chamada pelo backend)
CREATE OR REPLACE FUNCTION public.incrementar_velas_hoje()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  novo_total bigint;
BEGIN
  INSERT INTO public.velas_diarias (data, total, atualizado_em)
  VALUES (hoje, 1, now())
  ON CONFLICT (data) DO UPDATE
    SET total = public.velas_diarias.total + 1,
        atualizado_em = now()
  RETURNING total INTO novo_total;
  RETURN novo_total;
END;
$$;

-- Permissão de execução (anon pode chamar via RPC; backend usa service_role)
GRANT EXECUTE ON FUNCTION public.incrementar_velas_hoje() TO anon, authenticated;

-- Função para ler o total de hoje (timezone-aware)
CREATE OR REPLACE FUNCTION public.velas_acesas_hoje()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v bigint;
BEGIN
  SELECT total INTO v FROM public.velas_diarias WHERE data = hoje;
  RETURN COALESCE(v, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.velas_acesas_hoje() TO anon, authenticated;
