-- Migração: adiciona campos do cadastro completo na tabela users
-- (nome_completo, whatsapp, aceita_newsletter, consent_lgpd_em)
--
-- Antes: users tinha só nome, email, nascimento, anjo_n, anjo_nome, plano.
-- Depois: incorpora os campos do novo signup estruturado (nome completo, WhatsApp,
-- consentimento explícito de newsletter, timestamp do consentimento LGPD).

alter table public.users
  add column if not exists nome_completo text,
  add column if not exists whatsapp text,
  add column if not exists aceita_newsletter boolean not null default false,
  add column if not exists consent_lgpd_em timestamptz;

-- Index pra busca por WhatsApp (útil pra suporte e segmentação de campanha)
create index if not exists idx_users_whatsapp on public.users(whatsapp) where whatsapp is not null;

-- Index pra segmentação de quem aceitou newsletter (cron-newsletter usa)
create index if not exists idx_users_aceita_newsletter on public.users(aceita_newsletter) where aceita_newsletter = true;
