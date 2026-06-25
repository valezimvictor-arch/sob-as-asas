-- Migração: Hardening 2 — fecha escrita de colunas sensíveis em `users` e
-- restringe leitura de `velas_pedidos`. Rode UMA vez no Supabase (SQL Editor).
-- Idempotente.
--
-- Nota anti-drift (#12): as definições de policy/grant aqui são a fonte para
-- bancos JÁ provisionados. Os arquivos-fonte (supabase/schema.sql,
-- MIGRACAO_CIRCULO_VELAS.sql) foram atualizados pra refletir o mesmo estado
-- num setup novo. Se editar uma, edite a outra.

-- ── #10: cliente não pode escrever plano/oferta_* na PRÓPRIA linha ──
-- RLS é row-level (não filtra coluna) e a policy self_users é "for all",
-- então sem isto um usuário autenticado podia rodar, pelo client anon:
--     client.from('users').update({ plano: 'anual' })
-- e se autoconceder premium de graça. Aqui restringimos INSERT/UPDATE do
-- papel `authenticated` às colunas de PERFIL; plano e oferta_* passam a ser
-- graváveis apenas via service-role (webhook do Stripe, admin, resgatar —
-- que têm GRANT ALL do Supabase + BYPASSRLS e não são afetados por isto).
revoke insert, update on public.users from authenticated, anon;

grant insert (id, email, nome, nome_completo, whatsapp, nascimento, hora_nasc,
              anjo_n, anjo_nome, ritual_horario, aceita_newsletter,
              consent_lgpd_em, ultimo_acesso_em)
  on public.users to authenticated;

grant update (email, nome, nome_completo, whatsapp, nascimento, hora_nasc,
              anjo_n, anjo_nome, ritual_horario, aceita_newsletter,
              consent_lgpd_em, ultimo_acesso_em)
  on public.users to authenticated;
-- Colunas deliberadamente FORA da allowlist (só service-role escreve):
--   plano, oferta_ativa, oferta_desde, oferta_stripe_sub_id, criado_em.

-- ── #11: velas_pedidos — cada usuário só lê as PRÓPRIAS velas ──
-- Antes "using (auth.role() = 'authenticated')" deixava qualquer logado ler
-- TODAS as linhas (quem acendeu vela pra qual pedido). O cliente só precisa
-- saber o que ELE acendeu hoje (carregarCirculo → jaAcesos). A contagem
-- pública vem de pedidos.velas_recebidas via circulo_feed(), não daqui.
drop policy if exists "vela ler autenticado" on public.velas_pedidos;
create policy "vela ler autenticado" on public.velas_pedidos
  for select using (acendedor_id = auth.uid());
