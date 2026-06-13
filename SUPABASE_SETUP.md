# Supabase Setup — Sob as Asas

> ⚠️ **O Tacada NÃO é afetado.** Vamos criar um projeto **novo e separado** no Supabase.
> Outro banco, outras chaves, outro deploy. Zero contato com o projeto do Tacada.

## Passo a passo (≈ 10 min)

### 1. Criar o projeto
1. Entre em https://supabase.com e faça login (pode ser a mesma conta do Tacada — os projetos são isolados).
2. Clique em **New project**.
   - **Name:** `sob-as-asas`
   - **Database Password:** gere uma forte e **guarde** (cofre/1Password).
   - **Region:** `South America (São Paulo)` — menor latência no Brasil.
3. Aguarde ~2 min o provisionamento.

### 2. Rodar o schema
1. No projeto, menu lateral → **SQL Editor** → **New query**.
2. Cole **todo** o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique **Run**.
3. Confira em **Table Editor** se as tabelas apareceram (`users`, `conteudos`, `pedidos`, `milagres`, `assinaturas`, `push_subscriptions`, `progresso`).

### 3. Pegar as chaves
Menu → **Project Settings** → **API**. Copie:
| Chave | Onde usar | Pública? |
|---|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | `SUPABASE_URL` (server) + `window.SAA_CONFIG.url` (app) | sim |
| **anon public** key | `window.SAA_CONFIG.anon` (app, no navegador) | sim — protegida por RLS |
| **service_role** key | `SUPABASE_SERVICE_KEY` (**só** no servidor/Vercel) | **NÃO — segredo** |

> A `anon` key é segura no navegador porque o RLS (já configurado no schema) garante que cada usuário só acessa os próprios dados. A `service_role` **nunca** vai pro frontend.

### 4. Habilitar login por e-mail (magic link)
Menu → **Authentication** → **Providers** → **Email**: deixe **Enable Email provider** ligado e ative **Confirm email / Magic Link**. (Sem senha — o usuário recebe um link. UX ideal pra esse público.)

### 5. Configurar as chaves no projeto
- **No app (frontend):** edite [`config.js`](config.js) e preencha `url` e `anon`.
- **No servidor (Vercel):** em Project Settings → Environment Variables, adicione `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` (e as do Stripe). Use [`.env.example`](.env.example) como lista.

### 6. (Opcional) Storage para áudios/vídeos da Monica
Menu → **Storage** → **New bucket** → nome `conteudos`, **Public** (leitura pública dos arquivos). É de onde o player vai puxar a mídia (`media_url`).

---

## Checklist de isolamento do Tacada
- [ ] Projeto Supabase com nome próprio (`sob-as-asas`)
- [ ] `.env` do Sob as Asas com chaves **próprias** (nunca as do Tacada)
- [ ] Projeto Vercel separado, com env vars próprias
- [ ] `config.js` do app aponta para a URL nova

Feito isso, me passe a **Project URL** e a **anon key** (essas duas são públicas, pode mandar) que eu finalizo a ligação do cadastro/login. A `service_role` você cola direto na Vercel — não preciso dela.
