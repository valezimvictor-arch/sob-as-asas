# Autenticação e planos

[← voltar ao índice](./README.md)

Toda a autenticação é feita pelo **Supabase Auth**. O front usa o `supabase-js` (anon key) direto; o backend valida o JWT quando precisa de uma operação privilegiada.

## Cadastro (signup)

Tela `s-cadastro`. Função `criarConta()` em `index.html`.

```
auth.signUp({ email, password, options: { data: { nome, whatsapp } } })
   → cria a conta no Supabase Auth (auth.users)
   → upsert em public.users (perfil: nome, nascimento, anjo_n, anjo_nome, whatsapp, consent…)
```

- O **anjo regente** é calculado a partir da data de nascimento (cliente e/ou `api/calc-anjo`, lógica em `_lib/anjos.js`).
- Se a confirmação de e-mail estiver ligada no Supabase, o usuário passa pela tela `s-confirma-email`.

## Login — dois caminhos

Tela `s-login`. O usuário escolhe:

### 1. E-mail + senha
```
auth.signInWithPassword({ email, password })
```
Erros mapeados em `entrarComSenha()`:
- `invalid/credentials` → mensagem que **guia para o magic link** ou "Esqueci minha senha" (porque a causa comum é conta sem senha — veja abaixo).
- `email not confirmed` → pede confirmação.
- `rate/many` → muitas tentativas.

### 2. Código por e-mail (magic link / OTP)
```
auth.signInWithOtp({ email, options: { emailRedirectTo } })   // saaAuth.enviarLink
```
O usuário recebe um link/código e entra sem senha. Botão "Entrar com código por e-mail".

> ⚠️ **Armadilha conhecida:** uma conta criada/usada **só por magic link nunca teve senha**. Tentar entrar com "e-mail + senha" devolve *credenciais inválidas* mesmo o usuário "sabendo" a senha (ela não existe). Solução: entrar pelo link e **definir senha em Ajustes → Segurança**, ou usar "Esqueci minha senha". A mensagem de erro do login já orienta isso.

### Esqueci minha senha / recuperação
- `esqueciSenha()` → `auth.resetPasswordForEmail(email, { redirectTo: '/?recuperar=1' })`.
- Tela `s-recovery` trata o retorno e chama `auth.updateUser({ password })`.
- ⚠️ A URL de redirect precisa estar na allowlist de **Redirect URLs** do Supabase Auth.

## Sessão

- O `supabase-js` mantém a sessão no `localStorage` e renova o token sozinho.
- `window.saaAuth.client` é o cliente Supabase; `window._userId`, `window._nome`, `window._anjo`, `window._plano` são globais preenchidos no login (`aoLogar(session)`).
- No login, registra-se `users.ultimo_acesso_em` (usado pelo `cron-ritual` para personalização).

## Planos e premium

`users.plano`:

| Plano | Significado |
|---|---|
| `free` | gratuito (padrão) |
| `trial` | em período de teste (X dias, `TRIAL_DAYS`) |
| `mensal` / `anual` | assinante pagante |
| `cortesia` | liberado manualmente pela equipe (fluxo "tempo de graça") |

- **Premium = `plano ∈ {trial, mensal, anual, cortesia}`.** `free` é o único não-premium.
- O gating de premium é aplicado **na API/edge e no front**, não na RLS. Ex.: `api/mapa-cabalistico.js` checa `users.plano` antes de gerar o mapa.
- `users.plano` **só é escrito pela service-role** (webhook do Stripe, painel admin, resgate de presente) — o cliente não consegue se autoconceder premium (ver [MODELO-DE-DADOS → Hardening](./MODELO-DE-DADOS.md#hardening-de-users-importante)).

## Quem valida o quê (resumo)

| Contexto | Quem autentica | Como |
|---|---|---|
| Leitura/escrita do próprio dado | Supabase RLS | JWT do usuário no `supabase-js` |
| Endpoint de usuário (`/api/...`) | `_lib/auth.js` → `verifyUser(req)` | header `Authorization: Bearer <jwt>` |
| Endpoint admin (`/api/admin-*`) | `_lib/adminAuth.js` → `adminKeyValida(req)` | header `x-admin-key` (comparação timing-safe) |
| Cron (`/api/cron-*`) | header `x-vercel-cron: 1` ou `adminKeyValida` | agendado pela Vercel |
| Webhook Stripe | assinatura HMAC | `stripe.webhooks.constructEvent` + `STRIPE_WEBHOOK_SECRET` |

Ver o fluxo desenhado em [FLUXOGRAMAS → Autenticação](./FLUXOGRAMAS.md#autenticação).
