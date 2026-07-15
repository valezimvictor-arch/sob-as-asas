# SQL — migrações e auditorias

Arquivos SQL do projeto. **Não há framework de migração** — tudo é rodado **manualmente no SQL Editor do Supabase**.

## Como usar

- **Banco novo:** rode `supabase/schema.sql` (schema base canônico) e depois as `MIGRACAO_*.sql` em ordem cronológica.
- **Banco já provisionado:** rode só a migração nova.

Toda migração é **idempotente** (`if not exists`, `drop ... if exists` + `create`), com um comentário de propósito no topo. Dá pra rodar de novo sem quebrar.

## ⚠️ ANTI-DRIFT

Alguns objetos são redefinidos em mais de um arquivo (as correções de hardening espelham o que os arquivos-fonte já têm). Os cabeçalhos dos arquivos marcam esses espelhos. Ao mexer num objeto, cheque se ele aparece em outro arquivo pra não divergir.

## Convenção (ao criar uma migração nova)

- Nome: `MIGRACAO_<TEMA>.sql` **nesta pasta** (`sql/`).
- Idempotente, com comentário de propósito no topo.

## Arquivos

- `AUDITORIA_RLS.sql` — auditoria das políticas de RLS (leitura/diagnóstico, não altera schema).
- `MIGRACAO_*.sql` — deltas de features/segurança aplicados após o schema base.
