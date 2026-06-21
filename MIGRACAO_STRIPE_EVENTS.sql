-- Tabela de eventos do Stripe — usada pra idempotência do webhook.
-- Stripe retenta eventos quando o endpoint demora >20s ou retorna 5xx.
-- Sem essa tabela, um retry pode duplicar uma assinatura (cobrar 2x, marcar
-- "trial" 2 vezes, etc). Com ela, processamos cada event.id apenas uma vez.

create table if not exists public.stripe_events (
  id text primary key,                  -- event.id do Stripe (ex: evt_1Nx...)
  tipo text not null,                   -- event.type (checkout.session.completed, etc)
  processado_em timestamptz not null default now(),
  payload jsonb                         -- raw event pra debug (opcional, pode ser null em prod)
);

create index if not exists idx_stripe_events_tipo on public.stripe_events(tipo);
create index if not exists idx_stripe_events_processado_em on public.stripe_events(processado_em desc);

-- RLS habilitado mas SEM policies de leitura — só backend acessa via service_role.
alter table public.stripe_events enable row level security;
