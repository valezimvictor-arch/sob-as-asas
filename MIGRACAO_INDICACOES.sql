-- Programa de indicação Sob as Asas
-- Cada signup que veio com ?ref=<codigo> gera 1 registro aqui.
-- Quando a pessoa indicada vira assinante, o webhook do Stripe atualiza
-- virou_assinante = true e estende +30 dias no plano do indicador.

create table if not exists public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  indicador_id uuid not null references auth.users(id) on delete cascade,
  indicado_id uuid not null references auth.users(id) on delete cascade,
  codigo_usado text not null,  -- código curto que estava na URL
  criado_em timestamptz not null default now(),
  virou_assinante boolean not null default false,
  data_assinatura timestamptz,
  bonus_aplicado boolean not null default false,
  unique(indicado_id)  -- cada pessoa só pode ser indicada uma vez
);

create index if not exists idx_indicacoes_indicador on public.indicacoes(indicador_id);
create index if not exists idx_indicacoes_codigo on public.indicacoes(codigo_usado);

alter table public.indicacoes enable row level security;

-- Usuário só vê suas próprias indicações (como indicador)
create policy "indicacoes_self_read" on public.indicacoes
  for select using (auth.uid() = indicador_id);

-- Inserts vão pelo service role (webhook + signup hook); sem policy de insert pra anon.
