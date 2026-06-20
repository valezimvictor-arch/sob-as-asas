# Deploy — Sob as Asas (Vercel)

> Projeto **separado** do Tacada. Outro projeto Vercel, outras env vars. Zero contato.

## Pré-requisitos
- Projeto Supabase criado e `schema.sql` rodado (ver [SUPABASE_SETUP.md](SUPABASE_SETUP.md)). ✅
- `config.js` preenchido com URL + anon. ✅
- Domínio (opcional p/ agora): `sobasasas.com.br`.

## 1. Subir o código pro GitHub
```bash
cd "sob-as-asas"
git init
git add .
git commit -m "Sob as Asas — MVP inicial"
# crie um repo novo (privado) e:
git remote add origin git@github.com:SEU_USUARIO/sob-as-asas.git
git push -u origin main
```
> O `.gitignore` já protege `.env`, `node_modules/`, `www/`. **Confirme que o `.env` NÃO foi commitado** (`git status` não deve listá-lo).

## 2. Criar o projeto na Vercel
1. https://vercel.com → **Add New… → Project** → importe o repo `sob-as-asas`.
2. **Nome:** `sob-as-asas` (diferente do `pitaco`!).
3. Framework Preset: **Other**. Build/Output já vêm do `vercel.json`.

## 3. Variáveis de ambiente (Vercel → Settings → Environment Variables)
Adicione (use o [.env.example](.env.example) como lista). Mínimo pra o login + perfil funcionarem:
| Variável | Valor |
|---|---|
| `SUPABASE_URL` | sua URL do Supabase |
| `SUPABASE_SERVICE_KEY` | **service_role** (a rotacionada!) |
| `APP_URL` | a URL do projeto Vercel (ex.: `https://sob-as-asas.vercel.app`) |
| `ADMIN_KEY` | uma senha forte (acesso ao `/admin`) |

Depois, p/ assinatura/push: `STRIPE_*`, `VAPID_*`, `RESEND_API_KEY`.

## 4. Configurar o Auth no Supabase (essencial p/ o link mágico)
Supabase → **Authentication → URL Configuration**:
- **Site URL:** a URL da Vercel (ex.: `https://sob-as-asas.vercel.app`).
- **Redirect URLs:** adicione a URL da Vercel e, se for testar local, `http://localhost:8910`.
- Confirme **Email provider** habilitado (Authentication → Providers → Email).

## 5. Deploy e teste
1. **Deploy** na Vercel.
2. Abra a URL, faça o onboarding, toque em **Entrar no santuário** → digite seu e-mail → receba o link mágico → toque → você volta logado e o perfil é salvo em `public.users`.
3. Confira em Supabase → Table Editor → `users` se o registro apareceu (com `anjo_n`/`anjo_nome`).
4. Teste o `/admin` com a `ADMIN_KEY`.

## 6. Domínio (Registro.br → Vercel)

Domínio registrado: **sobasasas.com.br** (com `www`).

**Decida o canônico.** Recomendo o apex `sobasasas.com.br` como principal e `www` redirecionando pra ele (a Vercel faz o redirect automático). Tanto faz, mas escolha um.

### a) Adicionar na Vercel
Vercel → Project `sob-as-asas` → **Settings → Domains → Add**:
- adicione `sobasasas.com.br` e `www.sobasasas.com.br` (marque o apex como principal).
- A Vercel mostra os registros DNS a configurar.

### b) Configurar o DNS no Registro.br
Painel do Registro.br → seu domínio → **Editar Zona / DNS** (DNS do Registro.br). Adicione:
| Tipo | Nome/Host | Valor |
|---|---|---|
| **A** | `@` (apex / sobasasas.com.br) | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

> Apex não aceita CNAME — por isso o apex usa registro **A**. Esses são os valores padrão da Vercel.
> (Alternativa: apontar os *nameservers* do Registro.br pra `ns1.vercel-dns.com` / `ns2.vercel-dns.com` e deixar a Vercel gerenciar tudo — mais simples, porém muda o DNS inteiro.)

### c) Aguardar
- Propagação do DNS: minutos a algumas horas.
- **SSL (https):** a Vercel emite o certificado sozinha assim que o DNS resolve. Não precisa fazer nada.

### d) Atualizar variáveis e Auth (após o domínio resolver)
- Vercel → env var `APP_URL` = `https://sobasasas.com.br`.
- Supabase → Authentication → URL Configuration (ver §4): Site URL = `https://sobasasas.com.br`; Redirect URLs inclua `https://sobasasas.com.br` e `https://www.sobasasas.com.br`.

## 7. (Depois) App nas lojas
`npm run sync:ios` / `npm run sync:android` empacotam com Capacitor apontando pra esta URL.

## Checklist de isolamento do Tacada
- [ ] Repo Git próprio (`sob-as-asas`)
- [ ] Projeto Vercel próprio (nome diferente de `pitaco`)
- [ ] Env vars próprias (Supabase novo, não o do Tacada)
- [ ] `.env` não commitado

---

## 7. Observabilidade (Sentry + Plausible) — opcional, recomendado

O app carrega ambos CONDICIONALMENTE — só ativam se você preencher os IDs em `config.js`. Por padrão ficam desligados (sem coleta nenhuma).

### Sentry — erros em produção
1. Crie conta gratuita em [sentry.io](https://sentry.io) (50k erros/mês grátis)
2. **Create Project → Browser → JavaScript** (sem framework)
3. Copie o **DSN** (formato: `https://xxx@oXXX.ingest.sentry.io/YYY`)
4. Cole em `config.js`:
   ```js
   sentryDsn: 'https://xxx@oXXX.ingest.sentry.io/YYY',
   ```
5. Commit + push. Em ~1 min está rodando.

**Configuração de privacidade já embarcada** (em `js/observabilidade.js`):
- `tracesSampleRate: 0.1` — 10% das sessões com trace de performance
- `replaysSessionSampleRate: 0` — NÃO grava sessões normais (privacidade)
- `replaysOnErrorSampleRate: 0.5` — grava 50% das sessões em que houve erro
- `beforeSend` — redige `token=` e `code=` das URLs antes de enviar

### Plausible — analytics privacy-first
1. Crie conta em [plausible.io](https://plausible.io) (US$ 9/mês após trial 30d, ou self-host grátis)
2. **+ Add a website** → domínio `sobasasas.com.br`
3. Cole em `config.js`:
   ```js
   plausibleDomain: 'sobasasas.com.br',
   ```
4. Commit + push.

**Sem cookies. Sem consent banner.** Compatível com LGPD/GDPR sem precisar de aviso. Mostra: pageviews, origens, devices, conversões.

### Eventos custom (opcional)
Depois de ativar Plausible, dá pra rastrear ações específicas:
```js
plausible('trial_iniciado', { props: { plano: 'mensal' } });
plausible('anjo_revelado',  { props: { coro: 'Serafins' } });
plausible('presente_comprado');
```

---

## 8. Infraestrutura de email

### Outbound (envios do app)
- **Provedor:** Resend ([resend.com](https://resend.com))
- **Domínio verificado:** `sobasasas.com.br` (DKIM `resend._domainkey` no DNS)
- **From padrão:** `Sob as Asas <contato@sobasasas.com.br>` (configurado em `RESEND_FROM` no Vercel)
- **Usado por:** `api/_lib/resend.js` (newsletter, magic link, smoke test, re-engajamento, tempo de graça)

### Inbound (recebimento)
- **Provedor:** Zoho Mail Free
- **MX records no Registro.br:** `mx.zoho.com` (10), `mx2.zoho.com` (20), `mx3.zoho.com` (50)
- **DKIM Zoho:** `zoho._domainkey.sobasasas.com.br` no DNS
- **Acesso:** webmail `mail.zoho.com` com a conta `contato@sobasasas.com.br`
- **Plano:** Free (5 usuários, 5GB/usuário). Migrar pra Mail Lite ($1/usuário/mês) se passar de 5GB.

### SPF combinado
Registro TXT na raiz `sobasasas.com.br`:
```
v=spf1 include:zoho.com include:_spf.resend.com -all
```
⚠️ **Não criar 2 SPFs separados** — quebra autenticação. Deve ser 1 registro combinando os dois `include:`.

### DMARC
- **TXT em `_dmarc.sobasasas.com.br`:** `v=DMARC1; p=quarantine; rua=mailto:contato@sobasasas.com.br; pct=100; adkim=s; aspf=s`
- Status atual: **quarantine** (spam pra spoofs). Migrar pra `p=reject` após 60-90 dias confirmando que não tem falso positivo.

### Histórico
- Versão 1 (jun/2026): ImprovMX como forwarder + Resend pra envios → migrado para Zoho em jul/2026 quando precisamos de webmail real + múltiplos endereços (`contato@`, `monica@`, `imprensa@`, etc).
