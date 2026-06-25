-- Migração: Sprint de Hardening — correções de RLS/segurança nas Sprints 1-3.
--
-- Rode UMA vez no Supabase (SQL Editor) em bancos que já tinham
-- MIGRACAO_CIRCULO_VELAS.sql e MIGRACAO_OFERTA.sql aplicadas. É idempotente
-- (drop/create + create or replace), pode rodar de novo sem efeito colateral.
--
-- Os arquivos de origem (MIGRACAO_CIRCULO_VELAS.sql / MIGRACAO_OFERTA.sql) já
-- refletem estas mesmas definições — este aqui é só o delta pra produção.

-- ── #5: Círculo de Velas não pode ser de-anonimizado ──────────────────────
-- A leitura direta de `pedidos` públicos expunha user_id (autor) a qualquer
-- logado. Removemos essa policy; a leitura própria segue em "self_pedidos".
-- O feed anônimo passa a vir de uma função security-definer (só colunas
-- públicas, já excluindo os pedidos do próprio usuário).
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

-- ── #6: não acender vela em pedido privado ────────────────────────────────
-- A policy de insert só exigia ser o acendedor; agora exige também que o
-- pedido-alvo seja público (impede inflar velas_recebidas em pedidos
-- privados só conhecendo o UUID).
drop policy if exists "vela inserir autenticado" on public.velas_pedidos;
create policy "vela inserir autenticado" on public.velas_pedidos
  for insert with check (
    acendedor_id = auth.uid()
    and exists (
      select 1 from public.pedidos p
      where p.id = velas_pedidos.pedido_id and p.publico = true
    )
  );

-- ── #7: usuário não pode se autoconceder status de Mantenedora ────────────
-- Antes "for all" deixava o cliente inserir/atualizar a própria linha como
-- status='ativa' sem passar pelo Stripe. Cliente agora só LÊ; a escrita é
-- exclusiva do webhook via service-role (ignora RLS).
drop policy if exists "mantenedores self" on public.mantenedores;
create policy "mantenedores self" on public.mantenedores
  for select using (user_id = auth.uid());
