-- Sistema de Presente Sob as Asas — automação completa do fluxo
-- "Alguém paga R$ 149 → outra pessoa recebe email com código → resgata e ganha 1 ano"
--
-- Diferente de `assinaturas` (recorrente, ligado a userId), aqui:
-- - Não existe userId no momento da compra (a pessoa pode nem ter conta ainda)
-- - O presente é "ativado" quando a pessoa presenteada usa o código
-- - Vínculo se cria APÓS o resgate

create table if not exists public.presentes (
  id uuid primary key default gen_random_uuid(),

  -- Código curto único pra resgate (gerado pelo backend, ex: PRES-A1B2-C3D4)
  codigo text unique not null,

  -- Stripe
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  valor_centavos integer,                   -- 14900 = R$ 149,00

  -- Quem deu
  de_nome text not null,
  de_email text not null,

  -- Quem recebe
  para_nome text not null,
  para_email text not null,

  -- Personalização
  mensagem text,                            -- mensagem pessoal opcional
  data_envio date,                          -- se preenchido e no futuro, agenda envio do email
  email_enviado_em timestamptz,             -- quando o email pro destinatário foi disparado

  -- Resgate
  status text not null default 'pago',      -- pago | email_enviado | resgatado | expirado
  resgatado_em timestamptz,
  resgatado_por_user_id uuid references auth.users(id) on delete set null,

  -- Validade (1 ano pra resgatar; depois disso, expira sem perder dinheiro do dador,
  -- mas o destinatário precisa contatar a equipe)
  expira_em timestamptz not null default (now() + interval '1 year'),

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_presentes_codigo on public.presentes(codigo);
create index if not exists idx_presentes_para_email on public.presentes(para_email);
create index if not exists idx_presentes_status on public.presentes(status);
create index if not exists idx_presentes_data_envio on public.presentes(data_envio) where status = 'pago';

-- RLS: ninguém acessa direto pelo cliente — só backend via service_role
-- (presente_email == auth.email() poderia ser permissivo, mas o resgate vai
--  por endpoint específico que valida o código)
alter table public.presentes enable row level security;

-- Trigger pra manter atualizado_em
create or replace function public.trg_presentes_updated() returns trigger as $$
begin new.atualizado_em = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_presentes_updated on public.presentes;
create trigger trg_presentes_updated
  before update on public.presentes
  for each row execute function public.trg_presentes_updated();
