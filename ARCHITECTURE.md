# Sob as Asas — Arquitetura

> Guia pra quem vai revisar ou evoluir a plataforma. Reflete o estado real do código — se divergir, o código vence e este arquivo deve ser corrigido.

**Produto**: PWA de prática espiritual diária com os 72 anjos cabalísticos, com curadoria de Monica Buonfiglio. Modelo freemium (Plano dos Anjos R$ 19,90/mês ou R$ 199/ano, trial de 7 dias) + presente one-time + oferta voluntária.

---

## 1. Stack e decisões estruturais

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | HTML/CSS/JS **vanilla, arquivo único** (`index.html`, ~7,4k linhas) | Zero build step, deploy instantâneo, um dev-produto iterando com IA. Decisão consciente, não acidente — ver §7 Dívidas |
| Backend | Vercel serverless functions (`api/*.js`, ESM) | Mesmo repo, deploy atômico com o front |
| Banco/Auth | Supabase (Postgres + RLS + Auth email/senha + magic link) | RLS como camada primária de autorização |
| Pagamentos | Stripe Checkout (subscriptions + one-time) + webhook | — |
| E-mail | Resend (saída) · Zoho (entrada `contato@`) | DMARC/SPF/DKIM configurados; DMARC em `quarantine` (migrar pra `reject`) |
| Áudio | Supabase Storage, bucket público `audios-monica` (50MB, `audio/*`) | Upload via admin com signed URLs |
| Observabilidade | Sentry (browser) + Plausible (events) + error boundary próprio | `js/observabilidade.js` |
| Deploy | Push na `main` → Vercel | Sem staging — ver §7 |

## 2. Mapa do frontend (`index.html`)

Single-page com telas `<section class="screen">` alternadas por `show(id)`. Views internas da home via `data-view`.

- **Fluxos de auth**: cadastro completo (nome/email/WhatsApp/nascimento/senha + LGPD) · login senha + magic link fallback · recovery (`s-recovery`, hash `type=recovery`) · confirmação de e-mail (`s-confirma-email` + perfil pendente em `sessionStorage`)
- **Home ("Altar")**: anjo do usuário + anjo da hora (rotação 20min) + rituais gratuitos (bênção 30s, Oração Profunda 9min) + card de push + conteúdo premium + seção **"Explorar mais"** (colapsada — features secundárias)
- **Comunidade**: Livro de Pedidos com aba **Círculo** — pedidos públicos anonimizados, velas por pessoa/dia
- **Conteúdo**: Caminhos (jornadas 7 dias), Mensagem Mensal (envelope animado), Jornada do Anjo, biblioteca
- **Convenções**: funções `camelCase` em PT (`abrirCaminhos`), estado global `window._userId/_nome/_anjo/_plano/_perfil`, helpers `esc()` (escapa `&<>"'`), `toast/buzz/chime`, eventos Plausible em snake_case PT

## 3. Backend (37 endpoints)

- **Auth de usuário**: Bearer JWT validado por `api/_lib/auth.js → verifyUser()` (client anon só pra validar; escrita via service-role)
- **Auth de admin**: header `x-admin-key` vs `ADMIN_KEY`
- **Crons** (11, em `vercel.json`): validam `x-vercel-cron: 1` ou admin key
- **Stripe webhook**: assinatura verificada com corpo cru (`bodyParser: false`), **idempotência via tabela `stripe_events`**, branches por `metadata.tipo` (`assinatura` padrão / `oferta` / `presente_anual`)
- Regras: gates de premium **sempre no servidor** (`PLANOS_PREMIUM = ['trial','mensal','anual','cortesia']`); nunca sobrescrever credenciais de conta preexistente (lição do resgate de presente — ver §6)

## 4. Modelo de dados (principais)

`users` (perfil + plano + oferta; **colunas `plano`/`oferta_*` só graváveis via service-role** — grants por coluna), `assinaturas`, `pedidos` (+ `publico`, `velas_recebidas`), `velas_pedidos` (UNIQUE pessoa×pedido×dia; trigger conta **pessoas distintas**), `caminhos`/`caminhos_dias`/`caminhos_progresso`, `mensagens_mensais`, `conteudos`, `presentes`, `mantenedores`, `leads`, `push_subscriptions`, `stripe_events`, `gratidao`, `milagres`, `indicacoes`.

**RLS — decisões que não são óbvias**:
- Feed do Círculo NÃO lê `pedidos` direto (exporia `user_id` = de-anonimização). Usa função **security-definer `circulo_feed(lim)`** que devolve só colunas públicas e exclui os pedidos do próprio usuário.
- `velas_pedidos`: SELECT restrito ao próprio acendedor; contagem pública vem denormalizada de `pedidos.velas_recebidas`.
- `mantenedores`: cliente só SELECT — escrita exclusiva do webhook (senão o usuário se autoconcede status).

**Migrações**: arquivos `MIGRACAO_*.sql` na raiz, rodados manualmente no SQL Editor. ⚠️ Alguns objetos são redefinidos em mais de um arquivo (hardening) — os cabeçalhos marcam os espelhos ("ANTI-DRIFT"). Fonte de verdade pra banco novo: `supabase/schema.sql` + migrações em ordem.

## 5. Service Worker (`sw.js`)

Network-first pra HTML; cache-first só pra assets estáticos. **`/api/*` e `*.supabase.co` NUNCA passam pelo SW** (PII em CacheStorage sobrevive logout + staleness). Bump manual de `CACHE = 'sobasasas-vX.YY'` a cada deploy dispara o banner de atualização.

## 6. Postura de segurança (hardening jul/2026)

Sprint auditado adversarialmente; correções relevantes pra quem for mexer:
1. **Resgate de presente**: nunca chama `updateUserById({password})` em conta existente (era account-takeover trivial via código de presente). Conta existente só recebe o plano.
2. SW não cacheia respostas autenticadas (item acima).
3. XSS no admin: nomes de usuário fora de `onclick`; `esc()` escapa aspas.
4. Streak: datas comparadas em UTC-midnight (bug de fuso queimava perdão diário).
5. Círculo anônimo **no banco**, não só no front (`circulo_feed`).
6. Grants por coluna em `users` (cliente não escreve `plano`).
7. Checkout de oferta com dedupe duplo (banco + Stripe como fonte de verdade).

Headers em `vercel.json`: CSP estrita (sem CDNs não usados), HSTS preload, X-Frame-Options DENY. Secrets só em env vars da Vercel — nada de `sk_live_`/`whsec_` no repo ou chat.

## 7. Dívidas técnicas conhecidas (deliberadas, com gatilho de revisão)

| Dívida | Racional atual | Revisar quando |
|---|---|---|
| `index.html` monolítico 7,4k linhas | Velocidade de iteração solo; sem build | >2 devs no front, ou LCP 3G >4s medido |
| Sem testes automatizados | Pre-launch, superfície mudando diariamente | Primeiro usuário pagante real → smoke de streak-math + RLS do Círculo |
| Sem staging (push = prod) | Volume de tráfego ~0 | Primeiros usuários ativos → preview deployments da Vercel |
| Migrações manuais no SQL Editor | Simplicidade | Segundo ambiente (staging) existir |
| `listUsers` paginado no resgate (fallback O(n)) | Caminho raro (conta no Auth sem linha em `users`) | Base >5k usuários |
| Tela `s-mapa` + `/api/mapa-cabalistico` sem entrada na home | Feature construída, despriorizada; código documentado | Decisão de produto |
| Áudios premium em bucket público (URL obscura) | Padrão do mercado (Calm/Insight Timer); signed URLs = complexidade | Vazamento real observado |

## 8. Convenções pra contribuir

- Commits em PT, corpo explicando o *porquê*; `Co-Authored-By` quando gerado com IA
- Todo deploy que muda `index.html`: **bump do `CACHE` no `sw.js`** (senão usuários ficam na versão velha)
- Toda migração nova: arquivo `MIGRACAO_<TEMA>.sql` idempotente (`if not exists` / `drop ... if exists` + `create`), com comentário de propósito no topo
- Feature premium nova: gate **no endpoint**, nunca só no front
- Texto de produto: tom devocional, PT-BR informal-reverente ("você está sob as asas"); nunca prometer resultado material (LGPD + ética da marca: Milagre do Mês é curadoria editorial, não sorteio — ver `regulamento-milagre.html`)
