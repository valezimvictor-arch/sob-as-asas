-- Migração: Círculo — usuários podem acender velas pelos pedidos dos outros.
--
-- Por quê: o pedido individual já existia. Agora cada um pode "amplificar" o
-- pedido alheio acendendo uma vela. O autor vê quantas pessoas oraram pelo
-- pedido dele — isso cria o vínculo de comunidade que mantém o usuário no
-- longo prazo (estratégia Insight Timer).
--
-- Mecânica:
--   1. Autor marca o pedido como `publico` (opt-in explícito, default false)
--   2. Pedidos públicos aparecem no Círculo (anonimizados)
--   3. Usuários acendem vela → registro em velas_pedidos
--   4. Contagem `velas_recebidas` é mantida no pedido (denormalizada pra
--      performance — uma query no Círculo retorna pedido + contagem direto)
--   5. Constraint UNIQUE (pedido_id, acendedor_id, data) — cada um acende
--      uma vela por pedido por DIA. Pode renovar a oração no dia seguinte.

alter table public.pedidos
  add column if not exists publico boolean not null default false,
  add column if not exists velas_recebidas int not null default 0,
  add column if not exists publicado_em timestamptz;

-- Quando vira público, registra o timestamp (pra ordenar feed por recência
-- do compartilhamento, não do pedido em si).
create or replace function set_publicado_em()
returns trigger as $$
begin
  if NEW.publico = true and (OLD.publico is null or OLD.publico = false) then
    NEW.publicado_em := now();
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_set_publicado_em on public.pedidos;
create trigger trg_set_publicado_em
before update on public.pedidos
for each row execute function set_publicado_em();

-- Tabela de velas acesas (uma por user × pedido × dia)
create table if not exists public.velas_pedidos (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references public.pedidos(id) on delete cascade,
  acendedor_id    uuid not null references public.users(id) on delete cascade,
  acesa_em        timestamptz not null default now(),
  data_local      date not null default current_date,
  unique (pedido_id, acendedor_id, data_local)
);
create index if not exists idx_velas_pedido on public.velas_pedidos(pedido_id);
create index if not exists idx_velas_acendedor on public.velas_pedidos(acendedor_id, data_local desc);

-- Trigger que mantém velas_recebidas em sincronia
create or replace function bump_velas_recebidas()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.pedidos set velas_recebidas = velas_recebidas + 1 where id = NEW.pedido_id;
  elsif TG_OP = 'DELETE' then
    update public.pedidos set velas_recebidas = greatest(0, velas_recebidas - 1) where id = OLD.pedido_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_bump_velas on public.velas_pedidos;
create trigger trg_bump_velas
after insert or delete on public.velas_pedidos
for each row execute function bump_velas_recebidas();

-- RLS — public pedidos são visíveis a todos os logados; velas podem ser
-- inseridas por qualquer logado, leitura pública (pra contagem).
alter table public.velas_pedidos enable row level security;

drop policy if exists "vela inserir autenticado" on public.velas_pedidos;
create policy "vela inserir autenticado" on public.velas_pedidos
  for insert with check (acendedor_id = auth.uid());

drop policy if exists "vela ler autenticado" on public.velas_pedidos;
create policy "vela ler autenticado" on public.velas_pedidos
  for select using (auth.role() = 'authenticated');

drop policy if exists "vela apagar autor" on public.velas_pedidos;
create policy "vela apagar autor" on public.velas_pedidos
  for delete using (acendedor_id = auth.uid());

-- Pedidos públicos: qualquer um logado pode ler os públicos
drop policy if exists "pedidos publicos legiveis" on public.pedidos;
create policy "pedidos publicos legiveis" on public.pedidos
  for select using (publico = true or user_id = auth.uid());
