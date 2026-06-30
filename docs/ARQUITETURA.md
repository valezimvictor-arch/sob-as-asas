# Arquitetura

[← voltar ao índice](./README.md)

## Visão geral

Sob as Asas é uma **SPA estática** (sem framework, sem bundler para o web) servida pela Vercel, com um **backend serverless** de funções Node na mesma Vercel, e **Supabase** (Postgres + Auth + Storage) como banco/autenticação/arquivos. Integrações externas: Stripe, Resend, Sentry, Plausible, Web Push.

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENTE (browser / app Capacitor)                            │
│  index.html  →  SPA de telas (.screen) + JS inline            │
│  config.js (window.SAA_CONFIG: url+anon do Supabase, etc.)    │
│  supabase-js (CDN) · sw.js (PWA) · js/observabilidade.js      │
└───────────────┬───────────────────────────┬──────────────────┘
                │ Supabase JS (anon key)     │ fetch('/api/...')
                ▼                            ▼
     ┌──────────────────────┐    ┌──────────────────────────────┐
     │ SUPABASE             │    │ FUNÇÕES SERVERLESS (/api/*.js) │
     │ • Auth (JWT)         │◄───┤ usam SERVICE-ROLE key          │
     │ • Postgres + RLS     │    │ (ignoram RLS) — auth via       │
     │ • Storage (buckets)  │    │ verifyUser (JWT) ou x-admin-key│
     └──────────────────────┘    └──────┬───────────────────────-┘
                                        │
              ┌─────────────────────────┼───────────────────────┐
              ▼                         ▼                        ▼
          Stripe                     Resend                  Web Push
       (assinatura,                 (e-mails)              (notificações)
        presente, oferta)
                                        ▲
                                        │ agenda (cron)
                              Vercel Cron → /api/cron-*
```

## Mapa do repositório

```
sob-as-asas/
├── index.html              # O APP INTEIRO (SPA): CSS + telas + JS inline (~7.400 linhas)
├── config.js               # Config PÚBLICA do front: window.SAA_CONFIG (supabase url+anon, sentry, plausible)
├── sw.js                   # Service worker (PWA): caching, offline, push
├── manifest.json           # PWA manifest
├── js/
│   ├── geradorTextos.js     # Geração de textos/orações (módulo)
│   └── observabilidade.js   # Sentry + Plausible + error boundary global
│
├── api/                    # Funções serverless (Vercel). 1 arquivo = 1 endpoint
│   ├── _lib/               #   helpers compartilhados (ver BACKEND.md)
│   │   ├── supabase.js      #   cliente service-role (escrita privilegiada)
│   │   ├── auth.js          #   verifyUser(req): valida JWT do usuário (anon)
│   │   ├── adminAuth.js     #   adminKeyValida(req): compara x-admin-key (timing-safe)
│   │   ├── stripe.js        #   cliente Stripe único, apiVersion pinada
│   │   ├── resend.js        #   envio de e-mail
│   │   ├── anjos.js         #   cálculo do anjo regente (data → anjo)
│   │   ├── mensagens-anjo.js
│   │   └── presenteEmail.js
│   ├── calc-*.js            #   cálculos (anjo, compatibilidade, reconciliação)
│   ├── save-*.js            #   perfil, push subscription
│   ├── *checkout*.js        #   Stripe checkout (assinatura, presente, oferta)
│   ├── stripe-webhook.js    #   recebe eventos do Stripe → sincroniza banco
│   ├── resgatar-presente.js #   resgate de presente
│   ├── admin-*.js           #   endpoints do painel admin (auth: x-admin-key)
│   └── cron-*.js            #   agentes agendados (ver BACKEND.md)
│
├── *.sql                   # Migrações (rodadas À MÃO no SQL Editor do Supabase)
├── supabase/
│   ├── schema.sql           # Schema base canônico (tabelas + RLS)
│   └── seed.sql             # Dados iniciais
│
├── scripts/                # Geradores de conteúdo + build mobile
│   ├── build.mjs            # empacota o front pro Capacitor (www/)
│   └── gerar-*.cjs          # geram páginas/PDFs/roteiros a partir de dados
│
├── *.html                  # Páginas standalone (fora da SPA):
│   ├── admin.html           #   painel administrativo (ver ADMIN.md)
│   ├── landing.html         #   landing de marketing
│   ├── presente.html        #   compra de presente
│   ├── resgatar.html        #   resgate de presente
│   ├── termos / privacidade / regulamento-milagre / manual-marca
│
├── vercel.json             # rewrites, headers (CSP/segurança), crons
└── package.json            # deps (supabase-js, stripe, web-push, capacitor)
```

> **Regra de ouro do repositório:** `index.html` é monolítico de propósito (sem build = deploy instantâneo e simples). Antes de "modularizar", leia [CONVENCOES.md](./CONVENCOES.md).

## Ciclo de uma requisição

**1. Ação do próprio usuário (ex.: acender vela, salvar gratidão)**
```
Browser → supabase-js (com JWT do usuário) → Postgres
         RLS decide se a linha é acessível (auth.uid() = user_id)
```
Sem passar por `/api`. Rápido e seguro (RLS é a fronteira).

**2. Ação privilegiada (ex.: pagar, calcular anjo, ler dados de outros)**
```
Browser → fetch('/api/algo', { Authorization: 'Bearer <jwt>' | 'x-admin-key': <key> })
        → função serverless
            → verifyUser(req)  (valida o JWT)  OU  adminKeyValida(req)
            → supabase service-role (ignora RLS) / Stripe / Resend
            → { ok: true, ... }  |  { ok: false, error }
```

**3. Tarefa agendada (ex.: push diário, monitoramento)**
```
Vercel Cron (vercel.json) → GET /api/cron-*  (header x-vercel-cron: 1)
        → mesma função serverless, sem usuário
```

## Ambientes e deploy

- **Produção:** `https://www.sobasasas.com.br` — Vercel, **deploy automático a cada push na `main`**.
- **Sem staging formal.** Mudanças grandes: branch → revisar → merge `main`. Mudanças pequenas vão direto.
- O front é estático (`outputDirectory: "."`). As funções `/api` viram serverless functions automaticamente.
- **`vercel.json`** define:
  - `rewrites`: `/admin → /admin.html`, `/presente`, `/resgatar`, `/termos`, etc.
  - `headers`: CSP rígida + headers de segurança (HSTS, X-Frame-Options…). `Cache-Control: no-store` no `/` (HTML sempre fresco).
  - `crons`: agenda dos `cron-*` (ver [BACKEND](./BACKEND.md#agentes-cron)).

### Variáveis de ambiente

**Front (público, em `config.js` → `window.SAA_CONFIG`):** URL do Supabase, anon key, DSN do Sentry, domínio do Plausible, VAPID public key. *Pode ser público* (anon key é protegida por RLS).

**Backend (Vercel env vars — NUNCA no front):**

| Var | Uso |
|---|---|
| `SUPABASE_URL` | endpoint do Supabase |
| `SUPABASE_ANON_KEY` | validar JWT do usuário (`_lib/auth.js`) |
| `SUPABASE_SERVICE_KEY` | **escrita privilegiada** (`_lib/supabase.js`) — segredo crítico |
| `STRIPE_SECRET_KEY` | cliente Stripe |
| `STRIPE_WEBHOOK_SECRET` | validar assinatura do webhook |
| `STRIPE_PRICE_MENSAL` / `STRIPE_PRICE_ANUAL` | preços da assinatura |
| `STRIPE_PRICE_PRESENTE_ANUAL` | preço do presente |
| `STRIPE_PRICE_OFERTA` | preço da Oferta dos Mantenedores |
| `ADMIN_KEY` | chave única do painel admin |
| `RESEND_API_KEY` / `RESEND_FROM` | envio de e-mail |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Web Push |
| `APP_URL` | base URL (default produção) |
| `TRIAL_DAYS` | dias de trial |
| `*_ALERT_TO` / `*_TO` | destinatários dos e-mails dos agentes (sentinela, smoke, pulse, newsletter, instagram) |
| `CRON_SECRET` | proteção extra de crons |

### Migrações de banco

**Não há framework de migração.** Os arquivos `MIGRACAO_*.sql` (raiz) são rodados **manualmente no SQL Editor do Supabase**, em ordem. São idempotentes (`if not exists`, `drop policy if exists`, etc.).

- `supabase/schema.sql` = schema base canônico.
- `MIGRACAO_*.sql` = features adicionadas depois (cada uma é um delta).
- `MIGRACAO_HARDENING*.sql` = correções de segurança para bancos **já provisionados** (espelham o que os arquivos-fonte já têm). Detalhes e ordem em [MODELO-DE-DADOS](./MODELO-DE-DADOS.md#migrações).

## Mobile (Capacitor)

O mesmo front roda como app iOS/Android via Capacitor. `npm run build` (`scripts/build.mjs`) gera `www/` e `npx cap sync` empacota. Não é necessário para desenvolver o web — só para gerar os apps de loja.
