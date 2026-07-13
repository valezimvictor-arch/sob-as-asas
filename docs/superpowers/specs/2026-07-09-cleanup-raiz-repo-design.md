# Cleanup do repositório — mover material não-software pra fora — Design

**Data:** 2026-07-09
**Branch:** `cleanup`
**Contexto:** "Sob as Asas" é um protótipo (sem usuários/pagamentos reais). Antes de uma futura migração pra Next.js, o repositório precisa refletir só o **software**. Hoje há material operacional/editorial misturado (briefings, roteiros de gravação, mensagens, PDFs, varreduras, páginas de impressão) e 17 arquivos SQL soltos na raiz.

Este cleanup **não** altera comportamento do app, banco, regras de negócio ou visual. É higiene de repositório.

## Decisão central

Tudo que **não tem relação com o código do projeto** é **movido fisicamente pra fora do repositório**, pra:

```
C:\Users\PedroAlmeida\Desktop\arquivos sob as asas\
```

**Não usamos `.gitignore`.** Como os arquivos são versionados, movê-los pra fora faz o git registrar deleções — eles saem do repositório de vez, mas ficam preservados naquela pasta externa. O histórico do git também preserva as versões anteriores.

## Não-objetivos (YAGNI)

- Não migrar pra Next.js (projeto futuro).
- Não mexer em `index.html`, telas, endpoints ou lógica de negócio.
- Não alterar Supabase, RLS ou schema.
- Não consolidar a documentação duplicada (`docs/` vs raiz) — anotado como dívida, fora do escopo.
- Não refatorar o admin agora (ver "Trabalho futuro").

---

## Pasta externa — estrutura de destino

```
C:\Users\PedroAlmeida\Desktop\arquivos sob as asas\
  BRIEFING_GRAVACAO_MONICA.md
  BRIEFING_JURIDICO_ADVOGADO.md
  PLANO_PRODUCAO_MONICA.md
  EXEMPLO_MENSAGEM_MENSAL_ELEMIAH.md
  ROTEIROS_72_ANJOS.md
  ROTEIROS_72_ANJOS.pdf
  ROTEIROS_GRAVACAO_MONICA.md
  ROTEIROS_MENSAGENS_SEMANAIS.md
  ROTEIROS_MENSAGENS_SEMANAIS.pdf
  ROTEIROS_CAMINHOS.pdf            (o .md FICA no repo — ver exceção)
  SPRINT_PROXIMA.md
  VISAO_ESTRATEGICA.md
  MARCA.md
  VARREDURA_SEMANAL_2026-06-16.md
  VARREDURA_SEMANAL_2026-06-17.md
  VARREDURA_SEMANAL_2026-06-23.md
  VARREDURA_SEMANAL_2026-06-30.md
  interno\                          (as 12 páginas de impressão, estrutura preservada)
    home-header-novo.html
    monica-roteiro-completo.html
    monica-roteiros-index.html
    monica-semana-1-imprimir.html
    monica-semana-2-imprimir.html
    monica-semana-3-imprimir.html
    monica-semana-4-imprimir.html
    monica-semana-5-imprimir.html
    monica-semana-6-imprimir.html
    monica-semana-7-8-imprimir.html
    monica-semana-9-imprimir.html
    monica-semana-10-imprimir.html
```

---

## Inventário e classificação

### Grupo A — Material operacional/editorial → MOVER pra pasta externa

Arquivos soltos na raiz (versionados, exceto `ROTEIROS_CAMINHOS.pdf` que já está no `.gitignore`):
- `BRIEFING_GRAVACAO_MONICA.md`, `BRIEFING_JURIDICO_ADVOGADO.md`
- `PLANO_PRODUCAO_MONICA.md`, `EXEMPLO_MENSAGEM_MENSAL_ELEMIAH.md`
- `ROTEIROS_72_ANJOS.md` (+`.pdf`, 1,7 MB)
- `ROTEIROS_GRAVACAO_MONICA.md`
- `ROTEIROS_MENSAGENS_SEMANAIS.md` (+`.pdf`, 747 KB)
- `ROTEIROS_CAMINHOS.pdf` (gitignored; move físico, sem efeito no git)
- `SPRINT_PROXIMA.md`, `VISAO_ESTRATEGICA.md`, `MARCA.md`
- `VARREDURA_SEMANAL_2026-06-16/17/23/30.md` (4)

### Grupo A2 — Pasta `interno/` → MOVER pra pasta externa (`interno/` preservada)

As 12 páginas HTML de impressão dos roteiros da Monica. Nada no app referencia `interno/` — só o `robots.txt` tem `Disallow: /interno/`. São auto-contidas (texto embutido; não dependem dos `.md`). Inclui `home-header-novo.html` (rascunho de UI, também sai).

### Grupo B — ⚠️ Dado de RUNTIME → FICA no repo (exceção)

- `ROTEIROS_CAMINHOS.md` — `admin.html:1209` faz `fetch('/ROTEIROS_CAMINHOS.md')`. A Vercel só publica o que está no git; sair quebraria o admin em produção. **Fica rastreado na raiz.** Ver "Trabalho futuro".

### Grupo C — Documentação de engenharia → FICA no repo

`CLAUDE.md` (obrigatório na raiz), `ARCHITECTURE.md`, `CONTEXTO_PROJETO.md`, `DEPLOY.md`, `SUPABASE_SETUP.md`, `ONBOARDING.md`. (Duplicação com a pasta `docs/` fica anotada como dívida, fora do escopo.)

### Grupo D — SQL → MOVER pra `sql/` DENTRO do repo

SQL define o banco de que o código depende — **é parte do projeto**, então NÃO vai pra pasta externa; só sai da raiz pra uma subpasta. Nenhum SQL é lido em runtime (menções no código são só comentários/mensagens de erro).

Movem pra `sql/`: os 16 `MIGRACAO_*.sql` + `AUDITORIA_RLS.sql`.
Ficam: `supabase/schema.sql`, `supabase/seed.sql`.

---

## Plano de execução (fases)

### Fase 1 — Criar destino e mover Grupo A + A2
1. Criar `C:\Users\PedroAlmeida\Desktop\arquivos sob as asas\` (e `interno\` dentro).
2. Mover fisicamente (`mv`) os arquivos do Grupo A e a pasta `interno/` inteira pra lá.
3. `git add -A` pra registrar as deleções no índice (arquivos versionados) — os arquivos ficam preservados no destino.

### Fase 2 — Mover SQL pra `sql/` (dentro do repo)
1. Criar `sql/`.
2. `git mv` dos 16 `MIGRACAO_*.sql` + `AUDITORIA_RLS.sql` pra `sql/`.
3. Adicionar `sql/README.md` curto: migrações idempotentes, rodadas manualmente no SQL Editor, ordem, espelhos ANTI-DRIFT.

### Fase 3 — Ajustar documentação e referências órfãs
1. `robots.txt` — remover `Disallow: /interno/` (a pasta não existe mais no repo).
2. `CLAUDE.md` — regra "toda migração nova na raiz" → `sql/`.
3. `ARCHITECTURE.md` — §4 e §8 ("arquivos `MIGRACAO_*.sql` na raiz"; "fonte de verdade: `supabase/schema.sql` + migrações") → atualizar pra `sql/`.
4. Menções textuais em mensagens de erro (opcional, baixo valor):
   - `api/admin-upload-audio.js:123`, `api/stripe-webhook.js:60` — "rode MIGRACAO_X.sql" → "rode sql/MIGRACAO_X.sql". OK atualizar (backend, sem impacto de cache).
   - `admin.html:1186` — idem (admin não tem regra de SW).
   - `index.html:4179` — comentário `// ver MIGRACAO_HARDENING.sql`. ⚠️ **Editar `index.html` obriga bump de `CACHE` no `sw.js`** (regra crítica). Por ser só um comentário e o nome do arquivo continuar igual (achável por busca), a recomendação é **NÃO editar** o `index.html`.

### Fase 4 — Verificação
1. `git status` coerente: Grupo A/A2 como deleções; SQL como renames pra `sql/`.
2. Confirmar `ROTEIROS_CAMINHOS.md` ainda rastreado na raiz.
3. Confirmar arquivos presentes em `C:\Users\PedroAlmeida\Desktop\arquivos sob as asas\`.
4. Servir localmente → abrir admin → aba Caminhos → "Ver roteiro do dia": o `fetch('/ROTEIROS_CAMINHOS.md')` ainda funciona.
5. `grep` de sanidade: nenhum caminho quebrado pros SQL movidos em código servido.
6. Commit em PT explicando o porquê (higiene pré-migração).

---

## Trabalho futuro (registrado, fora deste cleanup)

- **Mover `ROTEIROS_CAMINHOS.md` pra fora + refatorar o admin** pra não depender do arquivo em runtime (ex.: mover o conteúdo do roteiro do dia pro banco, ou embutir no admin). Vira mini-projeto à parte, com seu próprio spec.
- Consolidar a documentação duplicada (`docs/` vs raiz).

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Mover pra fora um arquivo que o app busca em runtime | Inventário feito: só `ROTEIROS_CAMINHOS.md` é buscado (fica). Fase 4 valida o admin. |
| Quebrar a convenção de migrações documentada | Fase 3 atualiza `CLAUDE.md` + `ARCHITECTURE.md` junto com o move. |
| `Disallow: /interno/` órfão no robots.txt | Fase 3 remove a linha. |
| Editar `index.html` sem bump de cache | Decisão explícita de NÃO editar o comentário no `index.html`. |
| Perder material movido | Nada se perde: vai pra pasta externa preservada; histórico git guarda as versões. |

## Critério de pronto

- Raiz sem os arquivos do Grupo A e sem os 17 SQL soltos; sem a pasta `interno/`.
- Material não-software presente em `C:\Users\PedroAlmeida\Desktop\arquivos sob as asas\`.
- `sql/` com as migrações + README.
- `CLAUDE.md`, `ARCHITECTURE.md`, `robots.txt` coerentes.
- Admin funcional (roteiro do dia carrega).
- Nada no comportamento do app mudou.
