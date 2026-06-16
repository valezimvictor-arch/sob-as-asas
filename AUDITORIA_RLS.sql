-- ─────────────────────────────────────────────────────────────────────────
-- AUDITORIA RLS — Sob as Asas
-- Cole no Supabase → SQL Editor → Run. Veja se TODAS as tabelas têm rls=true.
-- Tabelas sem RLS ativo + sem service_role no servidor = expostas via anon key.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Status do RLS em cada tabela do schema public
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_ativo
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_ativo ASC, tablename;

-- 2) Listar políticas (RLS policies) existentes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS comando,
  qual AS condicao_using,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3) Caso encontre tabelas sem RLS (rls_ativo = false), ative com:
--    ALTER TABLE public.<nome_tabela> ENABLE ROW LEVEL SECURITY;
--
-- Recomendações por tabela (ajuste conforme seu schema real):
--
-- users:              policy "self read/write" — auth.uid() = id
-- pedidos:            policy "owner only"      — auth.uid() = user_id
-- gratidao:           policy "owner only"      — auth.uid() = user_id
-- comunidade:         policy "read public, write own" — SELECT true; INSERT/UPDATE auth.uid() = user_id
-- push_subscriptions: policy "owner only"      — auth.uid() = user_id (ou só service_role)
-- leads:              policy "anon insert only" — INSERT WITH CHECK true; sem SELECT pra anon
-- conteudos:          policy "read se publicado" — SELECT publicado=true
-- assinaturas:        policy "owner read"      — auth.uid() = user_id; writes só service_role
-- denuncias:          policy "anon insert"     — INSERT WITH CHECK true; sem SELECT pra anon
--
-- Lembre-se: o backend (Vercel /api/*.js) usa a SERVICE_KEY, que bypassa RLS.
-- RLS protege APENAS o que o cliente acessa direto via anon key (no app).

-- 4) Exemplo de policy padrão "owner only" (substitua <tabela>):
--    ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;
--    CREATE POLICY "<tabela>_owner_select" ON public.<tabela>
--      FOR SELECT TO authenticated USING (auth.uid() = user_id);
--    CREATE POLICY "<tabela>_owner_insert" ON public.<tabela>
--      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
--    CREATE POLICY "<tabela>_owner_update" ON public.<tabela>
--      FOR UPDATE TO authenticated USING (auth.uid() = user_id);
--    CREATE POLICY "<tabela>_owner_delete" ON public.<tabela>
--      FOR DELETE TO authenticated USING (auth.uid() = user_id);
