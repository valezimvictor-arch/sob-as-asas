# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Sob as Asas** — PWA de prática espiritual diária com os 72 anjos cabalísticos (curadoria de Monica Buonfiglio). HTML/CSS/JS vanilla + Vercel serverless functions + Supabase + Stripe. Empacotado com Capacitor para iOS/Android.

## Documentação de referência (leia antes de mexer)

- **`docs/ARQUITETURA.md`** (+ os irmãos em `docs/`: `BACKEND.md`, `FRONTEND.md`, `MODELO-DE-DADOS.md`, `CONVENCOES.md`, `AUTENTICACAO.md`, `ADMIN.md`) — estado real do código: stack, mapa do frontend, os ~37 endpoints, modelo de dados + decisões de RLS, service worker, postura de segurança, dívidas técnicas deliberadas e convenções. **É a fonte de verdade; se divergir do código, o código vence e o arquivo deve ser corrigido.**
- **`CONTEXTO_PROJETO.md`** — o "porquê": produto, modelo de negócio, posicionamento jurídico do Milagre do Mês, escopo.
- **`DEPLOY.md`** — Vercel, env vars, DNS, e-mail (Resend/Zoho, SPF/DMARC), observabilidade.
- **`SUPABASE_SETUP.md`** — setup do banco.

## Comandos

Não há build step para desenvolvimento web — os arquivos estáticos são servidos direto. `npm run build` existe só para empacotar com Capacitor.

```bash
npm install                 # instala deps (Capacitor, supabase-js, stripe, web-push)
npm run build               # copia estáticos → www/ (scripts/build.mjs) — só para o Capacitor
npm run sync:ios            # build + npx cap sync ios
npm run sync:android        # build + npx cap sync android
```

- **Deploy**: push na `main` → Vercel (sem staging). `vercel.json` define crons, headers/CSP e rewrites.
- **Não há testes automatizados** (decisão pré-lançamento — ver `docs/ARQUITETURA.md` § Dívidas técnicas). Não invente um comando de teste.
- **Servir localmente**: qualquer servidor estático na raiz (o `config.js` guarda URL + anon key do Supabase para o front). Redirect URLs do Supabase Auth incluem `http://localhost:8910`.

## Regras críticas (quebrar isto causa bug em produção ou brecha de segurança)

- **Toda mudança em `index.html` exige bump de `CACHE = 'sobasasas-vX.YY'` no `sw.js`** — senão usuários ficam presos na versão velha e não recebem o banner de atualização.
- **Gates de premium sempre no servidor**, no endpoint — nunca só no front. `PLANOS_PREMIUM = ['trial','mensal','anual','cortesia']`.
- **Colunas `plano`/`oferta_*` de `users` só são graváveis via service-role** (grants por coluna). Cliente não se autoconcede plano. Idem `mantenedores` (escrita só do webhook).
- **Nunca sobrescrever credenciais de conta preexistente** no resgate de presente (era account-takeover) — conta existente só recebe o plano, nunca `updateUserById({password})`.
- **`/api/*` e `*.supabase.co` nunca passam pelo service worker** (PII em CacheStorage sobreviveria ao logout).
- **Toda migração nova**: arquivo `MIGRACAO_<TEMA>.sql` em `sql/`, **idempotente** (`if not exists` / `drop ... if exists` + `create`), com comentário de propósito no topo. Rodadas manualmente no SQL Editor do Supabase. Alguns objetos são redefinidos em mais de um arquivo (hardening) — os cabeçalhos marcam os espelhos ("ANTI-DRIFT").
- **Segredos só em env vars da Vercel** — nada de `sk_live_`/`whsec_` no repo ou no chat.

## Convenções

- **Backend** (`api/*.js`, ESM): auth de usuário via `api/_lib/auth.js → verifyUser()` (Bearer JWT); auth de admin via header `x-admin-key` vs `ADMIN_KEY`; crons validam `x-vercel-cron: 1` ou admin key. Helpers em `api/_lib/`.
- **Frontend**: funções `camelCase` em PT (`abrirCaminhos`), estado global em `window._userId/_nome/_anjo/_plano/_perfil`, `esc()` para escapar HTML, eventos Plausible em snake_case PT.
- **Commits**: em PT, corpo explicando o *porquê*; `Co-Authored-By` quando gerado com IA.
- **Texto de produto**: tom devocional PT-BR informal-reverente ("você está sob as asas"). Nunca prometer resultado material — o Milagre do Mês é **curadoria editorial**, não sorteio (Lei 5.768/71 / LGPD — ver `CONTEXTO_PROJETO.md` e `regulamento-milagre.html`).
