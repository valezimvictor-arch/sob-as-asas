# Sob as Asas — Documentação técnica

> App de prática espiritual diária com os 72 anjos da guarda, ao lado de **Monica Buonfiglio**. 2º app da LVSV Ventures.

Este diretório é o material de onboarding para quem vai desenvolver na plataforma. Comece por aqui.

## 🚀 Comece por aqui (primeiros 30 minutos)

1. Leia esta página inteira (visão geral + stack).
2. Veja os **[fluxogramas](./FLUXOGRAMAS.md)** — entende-se a dinâmica em 5 minutos.
3. Leia **[ARQUITETURA](./ARQUITETURA.md)** e o **[mapa do repositório](./ARQUITETURA.md#mapa-do-repositório)**.
4. Antes de tocar em qualquer coisa, leia **[CONVENÇÕES E ARMADILHAS](./CONVENCOES.md)** — concentra os "porquês" e os erros que já custaram caro.

## 📚 Índice

| Doc | O que cobre |
|---|---|
| [ARQUITETURA.md](./ARQUITETURA.md) | Stack, mapa do repositório, ciclo de uma requisição, ambientes e deploy |
| [MODELO-DE-DADOS.md](./MODELO-DE-DADOS.md) | Tabelas do Postgres, **diagrama ER**, RLS, migrações, buckets de Storage |
| [GLOSSARIO.md](./GLOSSARIO.md) | Vocabulário do domínio (anjo regente, Círculo, Caminhos, Oferta…) e técnico |
| [AUTENTICACAO.md](./AUTENTICACAO.md) | Cadastro, login (senha + código por e-mail), sessão, planos/premium |
| [FRONTEND.md](./FRONTEND.md) | SPA de arquivo único, todas as telas, navegação, PWA/service worker |
| [BACKEND.md](./BACKEND.md) | Endpoints serverless, integrações (Stripe/Resend/Storage/Push), agentes cron |
| [ADMIN.md](./ADMIN.md) | Painel administrativo: abas, upload de roteiros, agentes |
| [FLUXOGRAMAS.md](./FLUXOGRAMAS.md) | Diagramas Mermaid (jornada, auth, pagamento, upload, agentes) |
| [CONVENCOES.md](./CONVENCOES.md) | Convenções de código, decisões de segurança, armadilhas conhecidas |

## 🌅 O que é o produto, em uma frase

Um santuário digital: o usuário descobre seu **anjo regente**, recebe práticas diárias (orações, salmos, áudios na voz da Monica), participa de um **Círculo** de orações coletivas, segue **Caminhos** guiados de 7 dias, e tem acesso à biblioteca, loja e experiências (viagens) da Monica. Há uma camada de monetização (assinatura premium, presentes, oferta de mantenedores) e um painel admin completo para a equipe operar tudo.

## 🧱 Stack em uma olhada

| Camada | Tecnologia | Onde |
|---|---|---|
| **Front** | HTML/CSS/JS puro (sem framework), SPA de arquivo único | `index.html` + `js/*.js` + `config.js` |
| **PWA** | Service worker (offline/caching/push) | `sw.js`, `manifest.json` |
| **Mobile** | Capacitor (wrappers iOS/Android do mesmo front) | `scripts/build.mjs`, `ios/`, `android/` |
| **Back** | Funções serverless Node (ESM) na Vercel | `api/*.js` + `api/_lib/*.js` |
| **Banco / Auth / Storage** | Supabase (Postgres + Auth + Storage) | `*.sql`, `supabase/schema.sql` |
| **Pagamentos** | Stripe (assinatura, presente, oferta) | `api/*checkout*`, `api/stripe-webhook.js` |
| **E-mail** | Resend | `api/_lib/resend.js` |
| **Observabilidade** | Sentry (erros) + Plausible (analytics) | `js/observabilidade.js`, `config.js` |
| **Push** | Web Push (VAPID) | `api/save-push.js`, `api/cron-ritual.js`, `sw.js` |
| **Deploy** | Vercel (deploy automático no push pra `main`) | `vercel.json` |

> ⚠️ **Não há build step para o app web.** O `index.html` e os assets são servidos como estão (`outputDirectory: "."` no `vercel.json`). O `npm run build` (`scripts/build.mjs`) existe só para empacotar o app no Capacitor (mobile). Editou `index.html`? É isso que vai pro ar.

## 🔑 O fluxo mental mais importante

```
Browser (index.html SPA)
   │  Supabase JS (anon key)  ──►  Supabase: Auth + leitura/escrita com RLS
   │  fetch('/api/...')        ──►  Funções serverless (service-role, ignoram RLS)
   │                                    │
   │                                    ├─► Supabase (escrita privilegiada)
   │                                    ├─► Stripe / Resend / Web Push
   │                                    └─► Crons (Vercel agenda) rodam os mesmos /api
```

- **Leitura/escrita do próprio usuário** → direto pelo cliente Supabase (protegido por RLS).
- **Tudo que precisa de privilégio** (pagamento, e-mail, escrever plano, dados de outros) → passa por uma função `/api` que usa a **service-role key** (server-side, nunca no browser).

## ⏱️ Rodar localmente (resumo)

O app web é estático. Para rodar de verdade você precisa de um Supabase + as env vars (veja [ARQUITETURA → Ambientes](./ARQUITETURA.md#ambientes-e-deploy)). Caminho mais rápido:

```bash
npm install
# preencher config.js (público) com URL + anon key do Supabase
npx vercel dev        # sobe o front + as funções /api localmente
```

As **funções `/api` precisam das env vars** (`SUPABASE_SERVICE_KEY`, `STRIPE_*`, etc.) num `.env.local` — lista completa em [ARQUITETURA](./ARQUITETURA.md#variáveis-de-ambiente).

## 📝 Convenções rápidas

- Código e comentários em **português** (pt-BR). Mantenha o tom.
- Commits costumam começar por categoria: `Fix:`, `Feat:`, `Admin:`, `Melhorias:` etc.
- Deploy é **direto na `main`** (cada push publica). Para mudanças grandes, use branch + merge.
- **A cada deploy que mexe no front, suba a versão do cache em `sw.js`** (`const CACHE = 'sobasasas-vX.Y'`) — senão usuários ficam com versão velha.

---
Dúvidas sobre uma decisão específica? Quase sempre a resposta está em [CONVENCOES.md](./CONVENCOES.md) ou nos comentários do próprio código (são densos de propósito).
