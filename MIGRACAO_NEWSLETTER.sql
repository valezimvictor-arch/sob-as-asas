-- ─────────────────────────────────────────────────────────────────────────
-- MIGRAÇÃO — Newsletter "Carta dos Anjos"
-- Rode no Supabase → SQL Editor → Run.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Colunas em leads para opt-out e token de unsubscribe one-click
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS unsub_token uuid DEFAULT gen_random_uuid();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS newsletter_optout boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS optout_em timestamptz;

-- Garantir token para leads pré-existentes
UPDATE public.leads SET unsub_token = gen_random_uuid() WHERE unsub_token IS NULL;

-- Índice no token (lookup de unsubscribe)
CREATE INDEX IF NOT EXISTS leads_unsub_token_idx ON public.leads(unsub_token);

-- 2) Tabela `newsletters` — conteúdo curado por semana
CREATE TABLE IF NOT EXISTS public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_de date NOT NULL,                  -- data de início da semana referente
  publicado boolean DEFAULT false,
  subject text,
  preheader text,
  anjo_nome text,
  anjo_datas text,
  anjo_coro text,
  anjo_mensagem text,
  monica_quote text,
  pratica_titulo text,
  pratica_passos text,                       -- HTML simples permitido (negrito, quebras)
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
-- Leitura: nada via anon (só service_role/admin). Sem policy = bloqueado.

CREATE INDEX IF NOT EXISTS newsletters_publicado_idx ON public.newsletters(publicado, semana_de DESC);

-- 3) (Opcional) primeira newsletter de exemplo já cadastrada
-- Descomente para já ter conteúdo no banco no próximo sábado:
--
-- INSERT INTO public.newsletters (semana_de, publicado, subject, preheader,
--   anjo_nome, anjo_datas, anjo_coro, anjo_mensagem,
--   monica_quote, pratica_titulo, pratica_passos)
-- VALUES (
--   CURRENT_DATE, true,
--   'Sua Carta dos Anjos desta semana 🕊️',
--   'O anjo da semana, uma mensagem da Monica e uma prática curta para os próximos dias.',
--   'Vehuiah', '21 a 25 de março', 'Serafins',
--   'Vehuiah é o anjo do começo. Esta semana, recomece — mesmo que seja um gesto pequeno.',
--   'Anjos não atendem por sorteio. Eles atendem por presença.',
--   'A vela do recomeço',
--   '<strong>1.</strong> Acenda uma vela branca. <strong>2.</strong> Diga: "Vehuiah, me dá coragem do primeiro passo." <strong>3.</strong> Silêncio por 1 minuto. Repita por 3 noites.'
-- );
