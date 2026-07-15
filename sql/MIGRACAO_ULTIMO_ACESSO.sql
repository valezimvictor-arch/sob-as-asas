-- Migração: rastrear último acesso do usuário pra personalização comportamental
-- do push (cron-ritual v3).
--
-- Por quê: o cron precisa saber há quantos dias o usuário não abriu o app
-- pra escolher entre prefixos contextuais ("Você voltou.", "Senti sua
-- falta.", etc). Sem isso, o push é universal demais.

alter table public.users
  add column if not exists ultimo_acesso_em timestamptz;

-- Index pra queries de re-engajamento (cron-reengagement já existe e pode
-- aproveitar este campo no futuro)
create index if not exists idx_users_ultimo_acesso on public.users(ultimo_acesso_em desc) where ultimo_acesso_em is not null;
