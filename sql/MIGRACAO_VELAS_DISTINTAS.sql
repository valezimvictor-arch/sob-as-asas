-- Migração: velas_recebidas = PESSOAS distintas (não soma de acendimentos).
--
-- Por quê: o Círculo promete "quantas pessoas oraram pelo seu pedido", mas o
-- trigger antigo incrementava a cada vela. Como a UNIQUE é por (pedido,
-- acendedor, DIA), a mesma pessoa renovando a oração em dias diferentes
-- inflava a contagem. Aqui: (1) trigger passa a contar distintos; (2)
-- recomputa os valores já existentes pra refletir a contagem correta.
--
-- Idempotente. Rode UMA vez no Supabase (SQL Editor).

-- 1) Trigger contando acendedores distintos
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

-- 2) Recompute: corrige a contagem inflada que já está gravada
update public.pedidos p set velas_recebidas = (
  select count(distinct v.acendedor_id)
  from public.velas_pedidos v
  where v.pedido_id = p.id
)
where exists (select 1 from public.velas_pedidos v where v.pedido_id = p.id)
   or p.velas_recebidas <> 0;
