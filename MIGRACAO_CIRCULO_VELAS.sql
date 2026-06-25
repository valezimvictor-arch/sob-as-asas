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

-- Trigger que mantém velas_recebidas em sincronia.
-- velas_recebidas = nº de PESSOAS distintas que oraram pelo pedido (não a
-- soma de acendimentos). Como a UNIQUE é por (pedido, acendedor, DIA), a
-- mesma pessoa renovando em dias diferentes geraria várias linhas; por isso
-- só conta quando é a 1ª linha daquele acendedor naquele pedido, e só
-- decrementa quando some a última linha dele.
create or replace function bump_velas_recebidas()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if not exists (
      select 1 from public.velas_pedidos
      where pedido_id = NEW.pedido_id and acendedor_id = NEW.acendedor_id and id <> NEW.id
    ) then
      update public.pedidos set velas_recebidas = velas_recebidas + 1 where id = NEW.pedido_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if not exists (
      select 1 from public.velas_pedidos
      where pedido_id = OLD.pedido_id and acendedor_id = OLD.acendedor_id and id <> OLD.id
    ) then
      update public.pedidos set velas_recebidas = greatest(0, velas_recebidas - 1) where id = OLD.pedido_id;
    end if;
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

-- Inserir vela exige: ser o próprio acendedor E o pedido-alvo ser público.
-- Sem o EXISTS, qualquer logado poderia inflar velas_recebidas em pedidos
-- privados (que nem consegue ler) só conhecendo/adivinhando o UUID.
drop policy if exists "vela inserir autenticado" on public.velas_pedidos;
create policy "vela inserir autenticado" on public.velas_pedidos
  for insert with check (
    acendedor_id = auth.uid()
    and exists (
      select 1 from public.pedidos p
      where p.id = velas_pedidos.pedido_id and p.publico = true
    )
  );

drop policy if exists "vela ler autenticado" on public.velas_pedidos;
create policy "vela ler autenticado" on public.velas_pedidos
  for select using (auth.role() = 'authenticated');

drop policy if exists "vela apagar autor" on public.velas_pedidos;
create policy "vela apagar autor" on public.velas_pedidos
  for delete using (acendedor_id = auth.uid());

-- Pedidos públicos NÃO são lidos diretamente: a leitura direta da tabela
-- exporia user_id (e demais colunas), de-anonimizando o Círculo, que é
-- anunciado como anônimo. A leitura do PRÓPRIO pedido continua coberta pela
-- policy "self_pedidos" do schema base. O feed anônimo vem da função
-- security-definer abaixo, que devolve só colunas públicas.
drop policy if exists "pedidos publicos legiveis" on public.pedidos;

create or replace function public.circulo_feed(lim int default 30)
returns table (id uuid, texto text, velas_recebidas int, publicado_em timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.texto, p.velas_recebidas, p.publicado_em
  from public.pedidos p
  where p.publico = true
    and p.status <> 'arquivado'
    and p.user_id <> auth.uid()
  order by p.publicado_em desc nulls last
  limit greatest(1, least(coalesce(lim, 30), 100));
$$;
revoke all on function public.circulo_feed(int) from public, anon;
grant execute on function public.circulo_feed(int) to authenticated;
