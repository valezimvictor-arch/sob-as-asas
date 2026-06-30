# Frontend

[← voltar ao índice](./README.md)

## Como o app é construído

`index.html` é uma **SPA de arquivo único** (~7.400 linhas), dividida em 3 blocos:

1. **`<style>`** — design system: CSS custom properties (tokens de cor `--ouro`, `--tinta`, `--branco`…), classes utilitárias (`.card`, `.btn-ouro`, `.btn-secundario`, `.label`…).
2. **HTML** — cada "tela" é uma `<section class="screen" id="s-...">`. Só uma fica visível por vez.
3. **`<script>` inline** — toda a lógica do app (vanilla JS, sem framework).

Carregados à parte: `config.js` (`window.SAA_CONFIG`), `js/observabilidade.js` (Sentry/Plausible), `js/geradorTextos.js`, e o `supabase-js` via CDN.

### Navegação entre telas

```js
show('s-home')   // esconde todas as .screen e mostra a alvo (com transição)
```
A tela atual recebe a classe `.active`. Telas devocionais (`s-reveal`, `s-acolhimento`) têm transição mais lenta. No **desktop (≥720px)**, o app vira um "casulo" centralizado de 420px (media query) — overlays full-screen também são centralizados nesse casulo.

### Estado global (no `window`)

Preenchido no login (`aoLogar`): `window.saaAuth` (`{ client, enviarLink, ... }`), `window._userId`, `window._nome`, `window._anjo`, `window._plano`, `window._email`. Helpers úteis: `esc()` (escapa HTML), `toast()`, `chime()`/`buzz()` (som/haptics), `_accessToken()` (pega o JWT da sessão).

## Telas (seções `s-*`) por feature

### Onboarding e autenticação
| Tela | Função |
|---|---|
| `s-welcome` | tela inicial pré-login ("Conhecer meu anjo da guarda" / "Já tenho conta") |
| `s-cadastro` | cadastro completo (nome, nascimento, whatsapp, senha) |
| `s-reveal` | **revelação do anjo da guarda** (momento-chave do onboarding) |
| `s-acolhimento` | onboarding emocional pós-reveal ("como você chega hoje?") |
| `s-primeira-pratica` | primeira prática guiada |
| `s-confirma-email` | confirmação de e-mail |
| `s-recovery` | redefinir senha (retorno do link de recuperação) |

### Home e o anjo
| Tela | Função |
|---|---|
| `s-home` | **Altar**: cartão central do anjo do momento ("rege às HH:MM"), streak, e cards das funcionalidades |
| `s-meuanjo` | detalhe do anjo regente do usuário |
| `s-anjo-hora` | o anjo que rege o horário atual (os 72 cobrem as 24h, 20min cada) |
| `s-mapa` | **Mapa Cabalístico** (premium): tríade nascimento + humanidade + momento |
| `s-carta-anjo` | carta/invocação do anjo |
| `s-medalhas` | streak "dias sob as asas" + marcos |

### Práticas espirituais
| Tela | Função |
|---|---|
| `s-magia` | Magia dos Anjos (velas, rituais) |
| `s-vela` / `s-velinha` | acender vela (própria e no Círculo) |
| `s-jornada` / `s-jornada-anjo` | jornada/novena guiada |
| `s-gratidao` | diário de gratidão |
| `s-socorro` | oração de socorro/emergência |
| `s-reconcilia` | Reconciliação (cálculo viral entre duas pessoas) |
| `s-compat` | compatibilidade entre anjos |
| `s-calendario` | calendário angelical |

### Conteúdo da Monica
| Tela | Função |
|---|---|
| `s-caminhos` / `s-caminho-dia` | **Caminhos da Monica** (3 jornadas de 7 dias, com áudio por dia) |
| `s-mensagem-mensal` | **Carta mensal** manuscrita do anjo (com envelope que abre) |
| `s-correio` | Correio Angelical |
| `s-milagre` | **Milagre do mês** (depoimentos selecionados) |
| `s-player` | player de áudio/vídeo (biblioteca, salmos, mensagens) |
| `s-monica` | conteúdos/seção da Monica |

### Social, loja e config
| Tela | Função |
|---|---|
| **Círculo** | feed anônimo de pedidos públicos — acender vela pelos outros (via `circulo_feed()` + `acenderVelaPedido`) |
| `s-indicar` | programa de indicação (link de convite) |
| `s-loja` | **Loja**: presentear, cursos, livros, consultas e **experiências/viagens** (Israel · Terra Santa, Caminhos de São Miguel) |
| `s-ajustes` | conta, segurança (senha), plano, Oferta dos Mantenedores |

### Navegação principal (bottom nav)
A home tem 4 abas fixas no rodapé: **Início · Biblioteca · Pedidos · Comunidade**.

## Funcionalidades que tocam o backend

| Feature | Front | Backend / dados |
|---|---|---|
| Calcular anjo | `criarConta`, reveal | `_lib/anjos.js` (client) / `api/calc-anjo` |
| Acender vela no Círculo | `acenderVelaPedido` | `api/acender-vela-pedido` → `velas_pedidos` |
| Feed do Círculo | `carregarCirculo` | RPC `circulo_feed()` (anônimo) |
| Mapa Cabalístico | `abrirMapa` | `api/mapa-cabalistico` (gate premium) |
| Reconciliação | `s-reconcilia` | `api/calc-reconciliacao` |
| Compatibilidade | `s-compat` | `api/calc-compatibilidade` |
| Assinar premium | paywall | `api/create-checkout` → Stripe → webhook |
| Presentear | `presente.html` | `api/create-gift-checkout` → webhook → e-mail com código |
| Oferta dos Mantenedores | `s-ajustes` | `api/checkout-oferta` / `api/cancel-oferta` |
| Push (ritual diário) | permissão | `api/save-push` → `cron-ritual` |
| Caminhos | `s-caminhos` | tabelas `caminhos*` |
| Carta mensal | `s-mensagem-mensal` | `api/admin-mensagem-mensal` (admin grava) |

## PWA / Service Worker (`sw.js`)

- **HTML:** network-first (sempre busca a versão fresca; cai no cache só offline).
- **Assets same-origin:** cache-first.
- **NUNCA intercepta `/api/*` nem cross-origin** (CDN, Supabase, Stripe). Isso é **crítico** — ver a armadilha em [CONVENCOES](./CONVENCOES.md#service-worker).
- **Push:** recebe notificações e abre a URL ao clicar.
- **Versão do cache:** `const CACHE = 'sobasasas-vX.Y'`. **Suba esse número a cada deploy** que mexe no front — dispara o banner "Nova versão disponível" e troca o SW.

## Observabilidade (`js/observabilidade.js`)

- **Sentry**: captura erros não tratados (com PII redigida).
- **Plausible**: analytics privacy-first; eventos custom via `window.plausible('nome_evento')`.
- **Error boundary global**: mostra tela de fallback após 3 erros/5s; ignora ruído conhecido (ResizeObserver, falhas de rede). Há um evento `modo_demo_supabase_falhou` se o supabase-js não carregar.
