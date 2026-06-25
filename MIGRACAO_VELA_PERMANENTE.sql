-- Migração: Vela Permanente — upsell de R$ 9,90/mês
--
-- Por quê: um usuário (free ou premium) pode acender uma "vela permanente"
-- em um pedido específico. Enquanto a assinatura mensal estiver ativa, a
-- vela fica acesa todos os dias automaticamente — visível no Círculo com
-- um halo dourado e contagem amplificada (cada dia conta como vela ativa).
--
-- Mecânica:
--   1. User clica em "Acender vela permanente" num pedido seu
--   2. Vai pro Stripe Checkout (subscription R$ 9,90/mês)
--   3. Webhook ativa a vela_permanente_ativa = true no pedido + grava
--      stripe_subscription_id pra poder cancelar depois
--   4. Cron diário "acende" a vela em velas_pedidos automaticamente
--   5. Se cancelar a assinatura, a vela vira normal (não some — fica em
--      paz, sem o status premium)

alter table public.pedidos
  add column if not exists vela_permanente_ativa boolean not null default false,
  add column if not exists vela_permanente_desde timestamptz,
  add column if not exists vela_permanente_stripe_sub_id text;

create index if not exists idx_pedidos_vela_perm on public.pedidos(vela_permanente_ativa)
  where vela_permanente_ativa = true;

-- Histórico de assinaturas de vela permanente (1 user pode ter várias
-- velas ativas em pedidos diferentes — uma assinatura por pedido).
create table if not exists public.velas_permanentes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  pedido_id           uuid not null references public.pedidos(id) on delete cascade,
  stripe_subscription_id  text unique,
  status              text not null default 'pendente'
                       check (status in ('pendente','ativa','pausada','cancelada')),
  iniciada_em         timestamptz default now(),
  cancelada_em        timestamptz,
  unique (pedido_id, user_id)
);
create index if not exists idx_velas_perm_user on public.velas_permanentes(user_id);
create index if not exists idx_velas_perm_status on public.velas_permanentes(status) where status = 'ativa';

-- RLS
alter table public.velas_permanentes enable row level security;

drop policy if exists "velas perm self" on public.velas_permanentes;
create policy "velas perm self" on public.velas_permanentes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
