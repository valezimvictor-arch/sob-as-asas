-- ─────────────────────────────────────────────────────────────────────────
-- Sob as Asas — Schema do Supabase (PostgreSQL)
-- Rode no SQL Editor do Supabase (ou via migration). Idempotente onde dá.
--
-- Codifica o modelo de conteúdo (texto/áudio/vídeo/Salmo), a jornada e o
-- Milagre do mês (curadoria, não-sorteio).
-- ─────────────────────────────────────────────────────────────────────────

-- ── USERS (perfil estende auth.users do Supabase) ──────────────────────────
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text not null,
  email         text unique,
  nascimento    date,                          -- usado p/ calcular o anjo regente
  hora_nasc     time,                           -- opcional, refina o cálculo
  anjo_n        smallint,                        -- 1..72 (cache do regente)
  anjo_nome     text,
  ritual_horario text default 'morning'          -- 'morning' | 'evening' | 'both'
                 check (ritual_horario in ('morning','evening','both')),
  plano         text default 'free'              -- 'free' | 'trial' | 'mensal' | 'anual'
                 check (plano in ('free','trial','mensal','anual')),
  criado_em     timestamptz default now()
);

-- ── CONTEÚDO (biblioteca da Monica) ────────────────────────────────────────
-- Um registro por peça. `formato` define como o app renderiza.
create table if not exists public.conteudos (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  formato       text not null                    -- 'audio' | 'video' | 'texto' | 'salmo'
                 check (formato in ('audio','video','texto','salmo')),
  colecao       text,                            -- 'protecao'|'prosperidade'|'salmo_diario'|'72_anjos'|'para_dormir'|'mensagem_semana'
  corpo         text,                            -- texto/oração (p/ formato texto/salmo)
  media_url     text,                            -- URL do áudio/vídeo (Supabase Storage)
  thumb_url     text,
  duracao_seg   int,
  anjo_n        smallint,                        -- se a peça é específica de um anjo (1..72)
  salmo_num     smallint,                        -- se for Salmo, o número
  premium       boolean default true,            -- false = amostra grátis (isca)
  data_pub      date,                            -- p/ "conteúdo do dia" e "novos da Monica"
  publicado     boolean default false,
  criado_em     timestamptz default now()
);
create index if not exists idx_conteudos_colecao on public.conteudos(colecao) where publicado;
create index if not exists idx_conteudos_data    on public.conteudos(data_pub) where publicado;

-- ── PEDIDOS (livro de pedidos) ─────────────────────────────────────────────
create table if not exists public.pedidos (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  texto             text not null,
  status            text default 'aberto'        -- 'aberto'|'em_curadoria'|'realizado'|'arquivado'
                     check (status in ('aberto','em_curadoria','realizado','arquivado')),
  candidato_milagre boolean default false,        -- consentimento explícito (grátis p/ todos)
  criado_em         timestamptz default now()
);
create index if not exists idx_pedidos_user on public.pedidos(user_id);
create index if not exists idx_pedidos_candidatos on public.pedidos(status) where candidato_milagre;

-- ── MILAGRE DO MÊS (curadoria editorial — NÃO sorteio) ─────────────────────
create table if not exists public.milagres (
  id            uuid primary key default gen_random_uuid(),
  mes_ref       date not null,                   -- 1º dia do mês de referência
  pedido_id     uuid references public.pedidos(id),
  historia      text,                            -- a história contada no app
  video_url     text,                            -- vídeo da Monica entregando
  publicado     boolean default false,
  criado_em     timestamptz default now()
);

-- ── PUSH SUBSCRIPTIONS (web-push) ──────────────────────────────────────────
create table if not exists public.push_subscriptions (
  endpoint        text primary key,
  p256dh          text not null,
  auth            text not null,
  user_id         uuid references public.users(id) on delete cascade,
  ritual_horario  text default 'morning',
  criado_em       timestamptz default now()
);

-- ── ASSINATURAS (espelho do Stripe via webhook) ────────────────────────────
create table if not exists public.assinaturas (
  user_id              uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id   text,
  stripe_subscription_id text,
  plano                text,                      -- 'mensal' | 'anual'
  status               text,                      -- 'trialing'|'active'|'past_due'|'canceled'
  trial_fim            timestamptz,
  periodo_fim          timestamptz,
  atualizado_em        timestamptz default now()
);

-- ── PROGRESSO / HÁBITO (streak, conteúdos consumidos) ──────────────────────
create table if not exists public.progresso (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  conteudo_id uuid references public.conteudos(id),
  tipo        text,                               -- 'ritual_manha'|'ritual_noite'|'salmo'|'conteudo'
  data        date default current_date,
  criado_em   timestamptz default now()
);
create index if not exists idx_progresso_user_data on public.progresso(user_id, data);

-- ── DIÁRIO DE GRATIDÃO ─────────────────────────────────────────────────────
create table if not exists public.gratidao (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id) on delete cascade,
  texto     text not null,
  data      date default current_date,
  criado_em timestamptz default now()
);
create index if not exists idx_gratidao_user on public.gratidao(user_id, data desc);

-- ── LEADS (captação pré-lançamento — landing page) ────────────────────────
create table if not exists public.leads (
  id        uuid primary key default gen_random_uuid(),
  email     text not null,
  origem    text default 'landing',
  criado_em timestamptz default now()
);
create unique index if not exists idx_leads_email on public.leads(lower(email));

-- ── RLS (Row Level Security) ───────────────────────────────────────────────
-- Cada usuário só enxerga os próprios dados. Conteúdo publicado é legível por
-- assinantes (regra de premium aplicada na API/edge, não aqui).
alter table public.users              enable row level security;
alter table public.pedidos            enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.assinaturas        enable row level security;
alter table public.progresso          enable row level security;
alter table public.gratidao           enable row level security;
alter table public.leads              enable row level security;
alter table public.conteudos          enable row level security;

-- Policies idempotentes (drop antes de create → pode re-rodar o schema sem erro).
drop policy if exists "self_users"     on public.users;
create policy "self_users"     on public.users        for all using (auth.uid() = id);
drop policy if exists "self_pedidos"   on public.pedidos;
create policy "self_pedidos"   on public.pedidos      for all using (auth.uid() = user_id);
drop policy if exists "self_push"      on public.push_subscriptions;
create policy "self_push"      on public.push_subscriptions for all using (auth.uid() = user_id);
drop policy if exists "self_assin"     on public.assinaturas;
create policy "self_assin"     on public.assinaturas  for select using (auth.uid() = user_id);
drop policy if exists "self_progresso" on public.progresso;
create policy "self_progresso" on public.progresso    for all using (auth.uid() = user_id);
drop policy if exists "self_gratidao"  on public.gratidao;
create policy "self_gratidao"  on public.gratidao     for all using (auth.uid() = user_id);
-- leads: qualquer um pode inserir (captação pública); ninguém lê pelo anon.
drop policy if exists "insert_leads"   on public.leads;
create policy "insert_leads"   on public.leads        for insert with check (true);
drop policy if exists "read_conteudos" on public.conteudos;
create policy "read_conteudos" on public.conteudos    for select using (publicado = true);
-- milagres publicados são públicos (leitura)
alter table public.milagres enable row level security;
drop policy if exists "read_milagres" on public.milagres;
create policy "read_milagres" on public.milagres for select using (publicado = true);
