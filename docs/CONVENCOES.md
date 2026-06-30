# Convenções e armadilhas

[← voltar ao índice](./README.md)

> Este é o documento que evita refazer dor. Cada item abaixo já foi um bug em produção ou uma decisão deliberada. Leia antes de mexer.

## Convenções de código

- **Idioma:** código, comentários, mensagens de UI e de commit em **português (pt-BR)**.
- **Sem framework no front:** vanilla JS. Não introduza React/Vue/bundler sem alinhar — o valor do `index.html` único é o deploy instantâneo e a simplicidade.
- **Comentários densos são intencionais:** muitos blocos explicam o *porquê* (não só o quê). Mantenha o padrão ao alterar lógica não-óbvia.
- **Commits:** prefixo por categoria — `Fix:`, `Feat:`, `Admin:`, `Melhorias:`, `Refactor:`, `Polish:`. Mensagem explica o porquê.
- **Branches:** mudança pequena → direto na `main`. Mudança grande/arriscada → branch → revisar → merge (`--ff-only` quando possível).
- **Deploy:** cada push na `main` publica na Vercel. **Não há staging.**

## ⚠️ Service worker

`sw.js` **só intercepta requisições same-origin que não sejam `/api/*`**. Cross-origin (CDN do supabase-js, Supabase, Stripe, fontes) e `/api/*` passam **direto** pro browser.

- **Por quê:** já houve um bug em que o SW interceptava o `supabase-js` do CDN, o fetch interno falhava e o `respondWith()` resolvia com `undefined` → o `<script>` quebrava → **o app inteiro caía em "modo demo"** (sem login/dados) silenciosamente.
- **Regra:** nunca faça o SW devolver `undefined` em `respondWith`. Em falha, rejeite (erro de rede nativo) ou devolva `Response.error()`.
- **A cada deploy que mexe no front, suba `const CACHE = 'sobasasas-vX.Y'`.** Senão o SW antigo continua servindo HTML velho (sobrevive a hard refresh). Para destravar um cliente preso: aba anônima ou DevTools → Application → Unregister SW.

## ⚠️ RLS é row-level, não column-level

A policy `self_users` deixa o usuário escrever a **própria linha** — mas isso inclui **qualquer coluna**. Sem proteção, daria pra `update({ plano: 'anual' })` e virar premium de graça.

- **Solução:** GRANTs por coluna (`MIGRACAO_HARDENING_2.sql`) — `authenticated` só escreve colunas de perfil; `plano`/`oferta_*` só via service-role.
- **Regra:** colunas sensíveis (billing, flags de acesso) **nunca** na allowlist de escrita do cliente. Escreva-as por `/api` com service-role.

## ⚠️ Uploads grandes → signed-URL, nunca multipart pela função

Funções da Vercel têm limite de **~4.5MB** no corpo. Áudios (até 50MB) **não** podem passar pela função.

- **Padrão:** a função emite um **token assinado** (`createSignedUploadUrl`), o browser sobe **direto pro Storage** (`uploadToSignedUrl`), depois um `commit` grava o metadado.
- **MIME e tamanho** são impostos na **config do bucket** (não dá pra validar o arquivo na função, que nunca o vê). Validar **extensão/refId** no `sign`.

## ⚠️ `esc()` e XSS

`esc()` escapa `& < > " '`. Isso protege **texto** e **valores de atributo**.

- **NÃO protege** string JS dentro de `onclick="fn('...')"` — o browser decodifica as entidades **antes** do JS rodar. Para dados em handler inline, **passe um id/UUID seguro e faça lookup**, ou use `data-*` + `addEventListener`. Nunca interpole nome/título de usuário cru num `onclick`.

## ⚠️ Estilo inline vs classe `.hide` (especificidade)

Já causou 2 bugs (overlay de onboarding e modal do admin "presos" na tela): um elemento com `class="hide"` **e** `style="display:flex"` inline → o inline **vence** a classe e o `.hide` nunca esconde.

- **Regra:** controle visibilidade de overlays/modais por **um mecanismo só**. Preferir `element.style.display = 'none'|'flex'` via JS (vence sempre), ou classe sem `display` inline conflitante.

## ⚠️ Datas: local vs UTC

`new Date().toISOString().slice(0,10)` dá a data **UTC**. No Brasil (UTC-3), à noite isso já é "amanhã". O streak usa a **data local** do dispositivo de propósito. Cuidado ao comparar datas — defina explicitamente se a regra é local ou UTC (ex.: `velas.data_local` usa `current_date` do banco = UTC).

## ⚠️ Stripe

- **`apiVersion` pinada** (`2024-06-20`, pré-"Basil") no `_lib/stripe.js`. Versões 2025+ movem `current_period_end` pro item da subscription — o webhook depende do campo no objeto subscription. **Não suba a versão sem revisar `stripe-webhook.js`.**
- **Idempotência:** o webhook checa `stripe_events` antes de processar (o Stripe reenvia eventos). Sempre marque o evento como processado no fim.
- Sempre use o cliente de `_lib/stripe.js` (não `new Stripe(...)` solto).

## ⚠️ `calc-anjo` usa `?data=`, não `?nascimento=`

Param do endpoint é **`data=YYYY-MM-DD`**. Já houve falso-positivo do Sentinela por chamar com `nascimento=`. Confira o contrato antes de consumir um endpoint.

## Segurança — checklist ao criar/editar endpoint

- [ ] Auth no **topo** (`verifyUser` ou `adminKeyValida`), retornando 401 antes de qualquer lógica.
- [ ] `adminKeyValida` (timing-safe) — **nunca** `req.headers['x-admin-key'] === process.env.ADMIN_KEY`.
- [ ] Validar entrada (regex/whitelist/limites) antes do banco; cuidado com path traversal em paths de Storage.
- [ ] `console.error` no erro real; **mensagem genérica** ao cliente público (não vazar `error.message`). Admin pode ver o real.
- [ ] Escrita privilegiada só via service-role; nunca confie no cliente para flags de acesso.
- [ ] `req.method` guard quando fizer sentido.

## Migrações (sem framework)

- Rodadas **à mão** no SQL Editor do Supabase, **em ordem**, idempotentes.
- `supabase/schema.sql` + `MIGRACAO_*.sql` são a **fonte canônica**; `MIGRACAO_HARDENING*.sql` são **deltas** para bancos já provisionados e **espelham** os arquivos-fonte. Há cabeçalhos "anti-drift" apontando os espelhos — se editar a definição de um objeto (policy/função/trigger), **edite os dois lados**.
- Feature nova com tabela → novo `MIGRACAO_*.sql` + atualizar `schema.sql` + documentar em [MODELO-DE-DADOS](./MODELO-DE-DADOS.md).

## Observabilidade

- **Sentinela** (de hora em hora) e **smoke-test** (diário) mandam e-mail se algo crítico cair. São a primeira linha de aviso — mantenha os checks atualizados quando criar endpoints críticos.
- O front dispara evento Plausible `modo_demo_supabase_falhou` se o supabase-js não carregar (sinal de incidente em massa).
- Erros vão pro Sentry; o `cron-smoke-test` checa inclusive se o **CDN do supabase-js** está no ar.

## Artefatos gerados não vão pro git

PDFs/binários gerados (ex.: `ROTEIROS_CAMINHOS.pdf`) ficam no `.gitignore` — a fonte (`.md` + script gerador em `scripts/`) é que é versionada. Não comite binários derivados (incham o histórico). Cuidado com `git add -A` — prefira `git add` explícito.

## Dívidas técnicas conhecidas (oportunidades)

- **Sem testes automatizados.** Os incidentes mais sérios (SW→modo demo; bypass de premium por RLS) seriam pegos por testes simples de auth/RLS/carregamento.
- **`index.html` monolítico** (~4.500 linhas de JS inline) + 200+ `onclick` inline forçam `'unsafe-inline'` no CSP. Externalizar o JS permitiria endurecer o CSP — mas é refactor grande, alinhe antes.
- Duplicações pontuais (listas, helpers) e ~160 `catch` vazios em caminhos não-críticos.
