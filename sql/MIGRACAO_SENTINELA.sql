-- Tabela de histórico do Sentinela (agente de monitoramento 24/7).
-- Permite detectar falhas CONSECUTIVAS (não alerta a cada blip de rede)
-- + gerar gráficos de uptime/latência ao longo do tempo.

create table if not exists public.sentinela_checks (
  id uuid primary key default gen_random_uuid(),
  checado_em timestamptz not null default now(),
  resultados jsonb not null,           -- array de {label, ok, ms, erro?, slow?}
  falhas integer not null default 0,   -- shortcut pra query rápida
  latencia_max_ms integer              -- maior latência entre todos checks
);

create index if not exists idx_sentinela_checado_em on public.sentinela_checks(checado_em desc);
create index if not exists idx_sentinela_falhas on public.sentinela_checks(falhas) where falhas > 0;

-- Limpeza automática: mantém só os últimos 30 dias (90 * 24 = 2160 linhas no máximo)
-- Roda 1x por dia via cron (opcional — descomentar quando quiser ativar)
-- create or replace function public.trg_sentinela_cleanup() returns trigger as $$
-- begin
--   delete from public.sentinela_checks where checado_em < now() - interval '30 days';
--   return null;
-- end;
-- $$ language plpgsql;

-- RLS habilitada — só backend acessa
alter table public.sentinela_checks enable row level security;
