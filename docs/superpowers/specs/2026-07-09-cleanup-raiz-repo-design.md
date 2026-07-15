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

### Grupo C — Documentação de engenharia → FICA no repo (com 1 consolidação)

Ficam na raiz: `CLAUDE.md` (obrigatório na raiz), `CONTEXTO_PROJETO.md`, `DEPLOY.md`, `SUPABASE_SETUP.md`, `ONBOARDING.md`.

**Consolidação do `ARCHITECTURE.md`:** o `ARCHITECTURE.md` da raiz é mais rico que o `docs/ARQUITETURA.md` e tem conteúdo que este não cobre (§6 postura de segurança/hardening, §7 dívidas técnicas com gatilhos, decisões de RLS não-óbvias). Decisão: **fundir esse conteúdo único no `docs/ARQUITETURA.md`**, depois **mover o `ARCHITECTURE.md` da raiz pra pasta externa** e reapontar as referências no `CLAUDE.md`. Assim o `docs/` vira a fonte única e mais rica, sem perda de conhecimento. Restante da duplicação `docs/` ↔ raiz (outros arquivos) segue como dívida futura.

### Scripts geradores (`scripts/`) → FICAM no repo

Decisão: os geradores de material editorial (`gerar-roteiros-72-anjos.cjs`, `gerar-pdf-roteiros.cjs`, `gerar-pdf-semanais.cjs`, `gerar-pdf-caminhos.cjs`) **ficam** — são código e leem `data/` (que fica no repo). `build.mjs` e `gerar-paginas-anjos.cjs` (geram o produto) obviamente ficam. **Caveat conhecido:** rodar os geradores recria os roteiros/PDFs na raiz; isso só ocorre sob demanda, durante produção de conteúdo. O estado commitado do repo fica limpo. (Os `.md` de entrada de alguns geradores agora vivem na pasta externa — ajustar os caminhos é trabalho futuro se/quando forem rodados de novo.)

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

### Fase 3 — Consolidar e mover o ARCHITECTURE.md
1. Ler `docs/ARQUITETURA.md`, `docs/MODELO-DE-DADOS.md`, `docs/CONVENCOES.md` pra ver o que já está coberto.
2. Fundir no `docs/ARQUITETURA.md` o conteúdo único do `ARCHITECTURE.md` da raiz **que ainda não exista** nos irmãos: §6 (postura de segurança/hardening — as 7 correções), §7 (dívidas técnicas + gatilhos de revisão), decisões de RLS não-óbvias (`circulo_feed`, grants por coluna, `velas_pedidos`). Já atualizando os caminhos de migração pra `sql/`.
3. Mover `ARCHITECTURE.md` da raiz pra pasta externa.
4. `CLAUDE.md` — reapontar as 2 referências (linha 9 "fonte de verdade" e linha 26 "§7") pra `docs/ARQUITETURA.md`.

### Fase 4 — Ajustar documentação e referências órfãs
1. `robots.txt` — remover `Disallow: /interno/` (a pasta não existe mais no repo).
2. `CLAUDE.md` — regra "toda migração nova na raiz" → `sql/`.
3. Menções textuais em mensagens de erro (opcional, baixo valor):
   - `api/admin-upload-audio.js:123`, `api/stripe-webhook.js:60` — "rode MIGRACAO_X.sql" → "rode sql/MIGRACAO_X.sql". OK atualizar (backend, sem impacto de cache).
   - `admin.html:1186` — idem (admin não tem regra de SW).
   - `index.html:4179` — comentário `// ver MIGRACAO_HARDENING.sql`. ⚠️ **Editar `index.html` obriga bump de `CACHE` no `sw.js`** (regra crítica). Por ser só um comentário e o nome do arquivo continuar igual (achável por busca), a recomendação é **NÃO editar** o `index.html`.

### Fase 5 — Verificação
1. `git status` coerente: Grupo A/A2 + `ARCHITECTURE.md` como deleções; SQL como renames pra `sql/`; `docs/ARQUITETURA.md` e `CLAUDE.md` modificados.
2. Confirmar `ROTEIROS_CAMINHOS.md` ainda rastreado na raiz.
3. Confirmar arquivos presentes em `C:\Users\PedroAlmeida\Desktop\arquivos sob as asas\`.
4. `grep` por `ARCHITECTURE.md` no repo → zero referências órfãs (só o spec pode citar historicamente).
5. Servir localmente → abrir admin → aba Caminhos → "Ver roteiro do dia": o `fetch('/ROTEIROS_CAMINHOS.md')` ainda funciona.
6. `grep` de sanidade: nenhum caminho quebrado pros SQL movidos em código servido.
7. Commit em PT explicando o porquê (higiene pré-migração).

---

## Trabalho futuro (registrado, fora deste cleanup)

- **Mover `ROTEIROS_CAMINHOS.md` pra fora + refatorar o admin** pra não depender do arquivo em runtime (ex.: mover o conteúdo do roteiro do dia pro banco, ou embutir no admin). Vira mini-projeto à parte, com seu próprio spec.
- Consolidar o **restante** da documentação duplicada `docs/` ↔ raiz (fora o `ARCHITECTURE.md`, já resolvido aqui).

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Mover pra fora um arquivo que o app busca em runtime | Inventário feito: só `ROTEIROS_CAMINHOS.md` é buscado (fica). Fase 5 valida o admin. |
| Perder o conteúdo único do `ARCHITECTURE.md` (§6/§7/RLS) | Fase 3 funde no `docs/ARQUITETURA.md` **antes** de mover. |
| Referências órfãs ao `ARCHITECTURE.md` no `CLAUDE.md` | Fase 3.4 reaponta pra `docs/ARQUITETURA.md`; Fase 5.4 confirma com grep. |
| Quebrar a convenção de migrações documentada | Fases 3 e 4 atualizam `CLAUDE.md` + `docs/ARQUITETURA.md` junto com o move do SQL. |
| `Disallow: /interno/` órfão no robots.txt | Fase 4 remove a linha. |
| Editar `index.html` sem bump de cache | Decisão explícita de NÃO editar o comentário no `index.html`. |
| Perder material movido | Nada se perde: vai pra pasta externa preservada; histórico git guarda as versões. |

## Critério de pronto

- Raiz sem os arquivos do Grupo A, sem os 17 SQL soltos, sem a pasta `interno/` e sem o `ARCHITECTURE.md`.
- Material não-software presente em `C:\Users\PedroAlmeida\Desktop\arquivos sob as asas\`.
- `sql/` com as migrações + README.
- `docs/ARQUITETURA.md` enriquecido com §6/§7/RLS; `CLAUDE.md` e `robots.txt` coerentes; zero referência órfã a `ARCHITECTURE.md`.
- Admin funcional (roteiro do dia carrega).
- Nada no comportamento do app mudou.
