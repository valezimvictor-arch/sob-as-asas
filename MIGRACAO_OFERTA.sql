-- Migração: Oferta dos Mantenedores — R$ 9,90/mês de contribuição voluntária
--
-- Reframe ético (substitui MIGRACAO_VELA_PERMANENTE.sql):
-- Antes: "Vela Permanente" destacava o pedido do pagante no Círculo, criando
--        comunidade de dois andares (pagantes brilhavam mais).
-- Agora: OFERTA pura — você ajuda a manter o trabalho da Monica + app vivo,
--        sem ganhar prioridade espiritual. Visível só no seu perfil
--        ("Mantenedora desde X meses"). Sem halo, sem topo, sem tag pública.
--        Inspirado em dízimo/oferta tradicional: você dá, ninguém vê.

-- ── Cleanup defensivo: caso MIGRACAO_VELA_PERMANENTE.sql tenha sido rodada ──
alter table public.pedidos
  drop column if exists vela_permanente_ativa,
  drop column if exists vela_permanente_desde,
  drop column if exists vela_permanente_stripe_sub_id;

drop index if exists idx_pedidos_vela_perm;
drop table if exists public.velas_permanentes;

-- ── Schema novo: oferta a nível de USER, não de pedido ──
alter table public.users
  add column if not exists oferta_ativa boolean not null default false,
  add column if not exists oferta_desde timestamptz,
  add column if not exists oferta_stripe_sub_id text;

create index if not exists idx_users_ofertantes on public.users(oferta_ativa) where oferta_ativa = true;

-- Tabela mantenedores: 1 user = no máximo 1 oferta ativa
create table if not exists public.mantenedores (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade unique,
  stripe_subscription_id  text unique,
  status                  text not null default 'pendente'
                           check (status in ('pendente','ativa','pausada','cancelada')),
  iniciada_em             timestamptz default now(),
  cancelada_em            timestamptz
);
create index if not exists idx_mantenedores_status on public.mantenedores(status) where status = 'ativa';

alter table public.mantenedores enable row level security;
drop policy if exists "mantenedores self" on public.mantenedores;
create policy "mantenedores self" on public.mantenedores
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
