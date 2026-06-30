# Painel administrativo (`/admin`)

[← voltar ao índice](./README.md)

Arquivo: `admin.html` (página standalone, fora da SPA). Servida em `/admin` (rewrite no `vercel.json`).

## Autenticação

- Login com a **`ADMIN_KEY`** (chave única, não há usuários de admin).
- A chave fica em `sessionStorage`. No boot e no login, é **revalidada** contra `/api/admin-validate` antes de revelar o painel (não basta ter algo no storage).
- Toda chamada manda o header `x-admin-key`. No servidor, `adminKeyValida()` compara de forma timing-safe.

## Abas (em `admin.html`)

A navegação tem um separador entre "operação" e "produção de conteúdo":

```
Painel · Usuários · Leads · Atendimento · Agentes
─────────────────────────────────────────────────
Roteiros Monica · Roteiros 72 anjos · Roteiros Caminhos · Conteúdos · Mensagem Mensal · Newsletter · Milagre
```

| Aba (`aba(...)`) | Função |
|---|---|
| `painel` | métricas (MRR, assinantes, trials, usuários, cadastros 30d) — `admin-metrics` |
| `usuarios` | listar/buscar/editar usuários (mudar plano, redefinir perfil, excluir) — `admin-users` |
| `leads` | leads de newsletter + stats — `admin-leads*` |
| `triagem` (Atendimento) | triagem/resposta de e-mails — `admin-triagem-email` |
| `agentes` | **dispara cada agente cron manualmente** ("Rodar agora") e mostra o resultado |
| `monica` (Roteiros Monica) | checklist por semana com nome de cada arquivo + upload (lido de `data/roteiro-monica.json`) |
| `roteiro` (Roteiros 72 anjos) | checklist dos 72 áudios por anjo cabalístico |
| `caminhos` (Roteiros Caminhos) | 21 áudios (3 caminhos × 7 dias) + progresso + "Ver roteiro do dia" (modal lê `ROTEIROS_CAMINHOS.md`) |
| `conteudo` | CRUD da biblioteca (`conteudos`) — agendar por data |
| `mensal` | grava a carta/mensagem mensal por anjo |
| `newsletter` | gerenciar/disparar newsletter |
| `milagre` | selecionar o Milagre do mês |

## Roteiros & upload de áudio

As 3 abas de roteiro (Monica, 72 anjos, Caminhos) usam o endpoint genérico **`admin-upload-audio`** com upload **signed-URL** (ver [BACKEND → Upload de áudio](./BACKEND.md#upload-de-áudio-signed-url)). Pré-requisitos no Supabase: bucket **`audios-monica`** (público, MIME `audio/*`, limite 50MB) e a `MIGRACAO_CAMINHOS.sql` rodada (semeia os 21 dias).

> A aba **Agentes** é ótima pra depurar produção: dispara o Sentinela/smoke-test na hora e mostra quais endpoints passaram/falharam.

## Convenções do admin

- Padrão visual reaproveitado: `.card`, barra de progresso dourada, chips `✓`/`⏳`.
- Nomes de usuário **nunca** entram crus em `onclick` (XSS) — usa-se o id (UUID) + lookup no cache. Ver [CONVENCOES](./CONVENCOES.md#esc-e-xss).
