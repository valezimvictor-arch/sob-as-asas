# Onboarding — Sob as Asas

Guia de entrada para desenvolvedores. App de prática espiritual diária com os 72 anjos da guarda, por **Monica Buonfiglio** (LVSV Ventures).

> 📚 **Documentação completa e detalhada em [`docs/`](./docs/README.md)** — este arquivo é o resumo de entrada. Fluxogramas em [`docs/FLUXOGRAMAS.md`](./docs/FLUXOGRAMAS.md), diagrama ER em [`docs/MODELO-DE-DADOS.md`](./docs/MODELO-DE-DADOS.md#diagrama-er), e glossário dos termos em [`docs/GLOSSARIO.md`](./docs/GLOSSARIO.md).

## Comece por aqui (ordem sugerida)
1. Este arquivo (visão geral + stack).
2. [`docs/FLUXOGRAMAS.md`](./docs/FLUXOGRAMAS.md) — a dinâmica em diagramas.
3. [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) — como tudo se conecta + mapa do repo.
4. [`docs/CONVENCOES.md`](./docs/CONVENCOES.md) — **leia antes de codar**: decisões de segurança e armadilhas já vividas.

## O produto em uma frase
Um santuário digital: o usuário descobre seu **anjo regente**, recebe práticas diárias (orações, salmos, áudios na voz da Monica), participa de um **Círculo** de orações coletivas, segue **Caminhos** guiados de 7 dias, e acessa biblioteca, loja e experiências (viagens). Há monetização (assinatura premium, presentes, oferta de mantenedores) e um painel admin completo.

## Stack
| Camada | Tecnologia | Onde |
|---|---|---|
| Front | HTML/CSS/JS puro, SPA de arquivo único (sem framework, sem build) | `index.html`, `js/`, `config.js` |
| PWA / Mobile | Service worker + Capacitor (iOS/Android) | `sw.js`, `scripts/build.mjs` |
| Back | Funções serverless Node (ESM) | `api/*.js`, `api/_lib/*.js` |
| Banco/Auth/Storage | Supabase (Postgres + RLS + Auth + Storage) | `*.sql`, `supabase/schema.sql` |
| Pagamentos / E-mail | Stripe / Resend | `api/*checkout*`, `api/stripe-webhook.js`, `_lib/resend.js` |
| Observabilidade / Push | Sentry + Plausible / Web Push (VAPID) | `js/observabilidade.js`, `api/save-push.js` |
| Deploy | Vercel — **deploy automático no push pra `main`** | `vercel.json` |

## O modelo mental mais importante
- **Dado do próprio usuário** → lido/escrito direto pelo `supabase-js` (anon key), protegido por **RLS**.
- **Operação privilegiada** (pagamento, e-mail, escrever plano, dados de outros) → passa por uma função **`/api`** que usa a **service-role key** (server-side, ignora RLS).
- **Tarefa agendada** → Vercel Cron chama `/api/cron-*`.

## Pegadinhas que você precisa saber já (resumo do [CONVENCOES](./docs/CONVENCOES.md))
- **Sem build no front:** editou `index.html`, é isso que vai pro ar. A cada deploy, **suba `const CACHE` em `sw.js`**.
- **Service worker** só intercepta same-origin não-`/api`; nunca devolva `undefined` em `respondWith` (já derrubou o app pra "modo demo").
- **RLS é row-level:** colunas sensíveis (`plano`, `oferta_*`) só escrevem via service-role (GRANTs por coluna em `users`).
- **Uploads grandes:** signed-URL direto pro Storage (limite de ~4.5MB da Vercel).
- **Stripe:** `apiVersion` pinada; webhook é idempotente via `stripe_events`.
- **Migrações** rodam à mão no SQL Editor do Supabase (idempotentes).

## Rodar localmente
```bash
npm install
# preencher config.js (público) com URL + anon key do Supabase
npx vercel dev   # front + funções /api (precisa das env vars em .env.local)
```
Env vars completas em [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md#variáveis-de-ambiente).

## Convenções
- Código e comentários em **português**.
- Commits por categoria: `Fix:`, `Feat:`, `Admin:`, `Melhorias:`…
- Mudança grande → branch + merge; pequena → direto na `main`.
