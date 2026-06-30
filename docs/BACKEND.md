# Backend (funções serverless)

[← voltar ao índice](./README.md)

Cada arquivo em `api/` é **um endpoint** (Vercel serverless, Node ESM). Padrão de resposta: `{ ok: true, ... }` ou `{ ok: false, error }`. Erros internos são **logados via `console.error`** mas **não** vazam `error.message` cru pro cliente em endpoints públicos.

## Helpers (`api/_lib/`)

| Arquivo | Export | Uso |
|---|---|---|
| `supabase.js` | `supabase` | **cliente service-role** (ignora RLS). Toda escrita privilegiada usa este. |
| `auth.js` | `verifyUser(req)` | valida o JWT do usuário (cliente anon); retorna `userId` ou `null`. |
| `adminAuth.js` | `adminKeyValida(req)` | compara `x-admin-key` com `ADMIN_KEY` de forma **timing-safe** (`crypto.timingSafeEqual`). |
| `stripe.js` | `stripe` | cliente Stripe único, **`apiVersion` pinada** (`2024-06-20`). |
| `resend.js` | `enviarEmail(...)` | envio de e-mail transacional. |
| `anjos.js` | `anjoRegente(data)`, `anjoDaHora(...)` | cálculo do anjo (data → anjo regente; hora → anjo do momento). |
| `mensagens-anjo.js` | mensagens dos anjos | textos por anjo. |
| `presenteEmail.js` | `emailPresenteHtml(...)` | template do e-mail de presente. |

## Endpoints de usuário / público

Auth via `verifyUser` (Bearer JWT) salvo quando indicado.

| Endpoint | Método | O que faz |
|---|---|---|
| `calc-anjo` | GET | calcula o anjo regente. **Param: `?data=YYYY-MM-DD`** (não `nascimento`!). Público. |
| `calc-compatibilidade` | GET | compatibilidade entre anjos. |
| `calc-reconciliacao` | GET | cálculo viral de reconciliação. |
| `save-perfil` | POST | salva perfil do usuário (auth). |
| `save-push` | POST | registra a inscrição de Web Push (auth). |
| `acender-vela-pedido` | POST | acende vela no pedido de outro (auth). Valida que o pedido é público e não é do próprio. |
| `mapa-cabalistico` | GET | gera o Mapa (auth + **gate premium** via `users.plano`). |
| `create-checkout` | POST | cria sessão Stripe da **assinatura** (mensal/anual). |
| `create-gift-checkout` | POST | cria sessão Stripe do **presente** (pagamento único). |
| `checkout-oferta` | POST | cria sessão Stripe da **Oferta dos Mantenedores** (auth). Deduplica via Stripe pra não cobrar 2×. |
| `cancel-oferta` | POST | cancela a oferta no fim do ciclo (`cancel_at_period_end`). |
| `resgatar-presente` | POST | resgata um presente pelo código → cria/atualiza conta + plano anual cortesia. **Não sobrescreve senha de conta existente** (anti-takeover). |
| `tempo-de-graca` | POST | pedido de "30 dias de cortesia" (libera plano manualmente pela equipe). |
| `newsletter-unsub` | GET | descadastro de newsletter (devolve HTML). |
| `stripe-webhook` | POST | **recebe eventos do Stripe** e sincroniza o banco. Auth = assinatura HMAC. Idempotente via `stripe_events`. |

### O webhook do Stripe (`stripe-webhook.js`) — leia com atenção
É o coração da monetização. Trata 3 fluxos por `metadata.tipo`:
- **presente** (`checkout.session.completed`, mode payment) → grava `presentes` + e-mail com código.
- **oferta** → grava `mantenedores` + `users.oferta_*` (data estável, só na 1ª ativação).
- **assinatura** (default) → grava `assinaturas` + `users.plano`.
- `customer.subscription.updated/deleted` → atualiza status/plano.
- **Idempotência:** checa `stripe_events` antes de processar (Stripe reenvia eventos). `apiVersion` pinada pré-Basil garante `current_period_end` no objeto subscription.

## Endpoints do admin (`x-admin-key`)

Todos validam `adminKeyValida(req)`. Consumidos por `admin.html` (ver [ADMIN.md](./ADMIN.md)).

| Endpoint | O que faz |
|---|---|
| `admin-validate` | valida a chave (200/401) — usado no login/boot do admin (barato) |
| `admin-metrics` | métricas do painel (MRR, assinantes, trials, usuários…) |
| `admin-users` | lista/edita usuários (mudar plano, redefinir perfil, excluir) |
| `admin-leads` / `admin-leads-stats` | leads de newsletter + estatísticas |
| `admin-conteudo` | CRUD da biblioteca (`conteudos`) |
| `admin-milagre` | gerencia o Milagre do mês |
| `admin-mensagem-mensal` | grava a carta mensal |
| `admin-newsletter` | dispara/gerencia newsletter |
| `admin-triagem-email` | atendimento (triagem de e-mails) |
| `admin-upload-url` | emite signed URL pro bucket `conteudos` |
| `admin-upload-audio` | emite signed URL pro bucket `audios-monica` + grava metadados (roteiros) |

### Upload de áudio (signed URL)
Por causa do limite de ~4.5MB no corpo das funções da Vercel, o arquivo **não passa pela função**. Fluxo (`admin-upload-audio.js`):
```
1. POST {action:'sign', tipo, refId, filename}  → função valida e devolve { token, path, publicUrl }
2. browser: supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)   // upload DIRETO
3. POST {action:'commit', tipo, refId, audio_url, duracao_seg}  → grava na tabela (conteudos/caminhos_dias)
```
`tipo ∈ '72-anjos' | 'monica' | 'caminhos'`. Validações server-side rígidas (anjo_n 1..72, slug whitelist, dia 1..7, extensão). MIME/tamanho impostos na config do bucket.

## Agentes (cron)

Agendados em `vercel.json`. Rodam como `GET /api/cron-*` com header `x-vercel-cron: 1` (ou `x-admin-key` para disparo manual pelo painel → aba **Agentes**). Quase todos enviam e-mail (Resend) e têm destinatário em env var.

| Agente | Quando (UTC) | O que faz |
|---|---|---|
| `cron-ritual?type=morning` | 09:00 diário | push do ritual da manhã (anjo do dia, personalizado) |
| `cron-ritual?type=evening` | 23:00 diário | push do ritual da noite |
| `cron-sentinela` | de hora em hora | **monitora endpoints críticos**; alerta por e-mail após 2 falhas consecutivas (grava em `sentinela_checks`) |
| `cron-smoke-test` | 10:00 diário | smoke test das APIs + CDN do supabase-js; e-mail em falha |
| `cron-pulse-diario` | 11:00 diário | "pulse" — métricas do dia por e-mail |
| `cron-presentes-agendados` | 11:30 diário | envia presentes com data de envio agendada |
| `cron-reengagement` | ter/sex 17:00 | reengajamento de usuários inativos |
| `cron-milagre-shortlist` | dia 25, 12:00 | monta shortlist de candidatos ao Milagre do mês |
| `cron-newsletter` | sáb 11:00 | dispara a newsletter |
| `cron-newsletter-draft` | sex 20:00 | gera rascunho da newsletter (para revisão) |
| `cron-instagram-drafter` | seg/qua/sex 12:00 | gera rascunho de post pro Instagram |

> O **Sentinela** e o **smoke-test** são sua rede de segurança em produção: se algo crítico cair (homepage, calc-anjo, Supabase, CDN do supabase-js), você recebe e-mail. Ver a história do falso-positivo do `calc-anjo` em [CONVENCOES](./CONVENCOES.md).

## Convenções dos endpoints

- Sempre `if (req.method !== '...') return res.status(405).end();` quando aplicável.
- Validar entrada (regex/whitelist/limites) **antes** de tocar no banco.
- Logar o erro real (`console.error`), devolver mensagem genérica ao cliente.
- Endpoints admin podem devolver o erro real (o admin é confiável e precisa depurar).
