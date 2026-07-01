# Glossário

[← voltar ao índice](./README.md)

Vocabulário do domínio (espiritual/produto) e técnico, para alinhar o time. Onde fizer sentido, aponta pra tabela/tela/endpoint correspondente.

## Domínio espiritual / produto

| Termo | O que é |
|---|---|
| **72 anjos** | Os 72 anjos cabalísticos (Shem HaMephorash). Cada pessoa tem um **anjo regente** e cada anjo rege um período do ano e ~20 min do dia. Os dados dos anjos vivem em **código** (`api/_lib/anjos.js`), não em tabela. |
| **Anjo regente / anjo da guarda** | O anjo do usuário, calculado pela **data de nascimento**. Guardado em `users.anjo_n` (1..72) e `users.anjo_nome`. |
| **Anjo da hora / do momento** | O anjo que "rege" o horário atual (os 72 cobrem as 24h, ~20 min cada). Tela `s-anjo-hora`; no Altar aparece como "rege às HH:MM". |
| **Coro** | Agrupamento dos anjos (Serafins, Querubins, Tronos, Dominações, Potências, Virtudes, Principados, Arcanjos, Anjos). |
| **Mapa Cabalístico** | Feature **premium**: a "tríade" de anjos do usuário — nascimento + humanidade + momento. Tela `s-mapa`, endpoint `api/mapa-cabalistico`. |
| **Revelação (reveal)** | Momento do onboarding em que o app revela o anjo da guarda. Tela `s-reveal`. |
| **Altar** | A home (`s-home`): cartão central do anjo do momento, streak e atalhos. |
| **Pedido** | Pedido de oração do usuário (`pedidos`). Pode ser marcado como **público** (opt-in) para entrar no Círculo. |
| **Círculo (de Velas)** | Feed **anônimo** de pedidos públicos onde qualquer um pode "acender uma vela" por outro. Leitura via RPC `circulo_feed()`. |
| **Vela / acender vela** | Ato de orar por um pedido no Círculo (`velas_pedidos`). 1 por pessoa × pedido × dia. `pedidos.velas_recebidas` conta **pessoas distintas**. |
| **Caminhos (da Monica)** | Jornadas guiadas de **7 dias** com um áudio por dia. 3 caminhos: *acolher a perda*, *atravessar a ansiedade*, *receber prosperidade*. Tabelas `caminhos`, `caminhos_dias`, `caminhos_progresso`. |
| **Carta / Mensagem Mensal** | Carta "manuscrita" do anjo, publicada mês a mês (com envelope que abre). Tela `s-mensagem-mensal`, admin em `admin-mensagem-mensal`. |
| **Correio Angelical** | Mensagens/correspondência do anjo. Tela `s-correio`. |
| **Milagre do mês** | Depoimento selecionado mensalmente (`milagres`). Shortlist gerada por `cron-milagre-shortlist`. Regulamento em `regulamento-milagre.html`. |
| **Reconciliação** | Cálculo "viral" entre duas pessoas (compartilhável). Tela `s-reconcilia`, `api/calc-reconciliacao`. |
| **Compatibilidade** | Compatibilidade entre anjos. Tela `s-compat`, `api/calc-compatibilidade`. |
| **Magia dos Anjos** | Rituais/velas guiados. Tela `s-magia`. |
| **Gratidão** | Diário de gratidão do usuário (`gratidao`). Tela `s-gratidao`. |
| **Socorro** | Oração de emergência/acolhimento. Tela `s-socorro`. |
| **Streak / "dias sob as asas"** | Sequência de dias de prática. Contada com a **data local** do dispositivo. Marcos em `s-medalhas`. É "perdoador" (não pune ausência de forma dura). |
| **Biblioteca** | Acervo de conteúdos (`conteudos`) por coleção: salmos, mensagens, áudios da Monica, etc. |
| **Loja** | `s-loja`: presentear, cursos, livros, consultas e **experiências (viagens)** — Israel · Terra Santa, Caminhos de São Miguel. |
| **Experiências / viagens** | Cards estáticos na Loja que captam interesse (Israel, São Miguel) e abrem um formulário de intenção. |
| **Comunidade** | Feed social de posts dos usuários (`comunidade`), com moderação (`oculto`). |

## Monetização

| Termo | O que é |
|---|---|
| **Plano** | `users.plano ∈ free / trial / mensal / anual` (+ `cortesia`). **Premium** = tudo menos `free`. |
| **Assinatura** | Assinatura recorrente premium via Stripe (`assinaturas`). Fluxo: `create-checkout` → Stripe → `stripe-webhook`. |
| **Trial** | Período de teste gratuito (X dias, env `TRIAL_DAYS`). |
| **Oferta dos Mantenedores** | Assinatura **voluntária** de R$ 9,90/mês de apoio (sem trazer benefício premium). Tabela `mantenedores`, `checkout-oferta`/`cancel-oferta`. |
| **Mantenedor(a)** | Quem tem a Oferta ativa. |
| **Presente (gift)** | Assinatura anual **presenteada** (pagamento único). Gera um **código de resgate** (`PRES-XXXX-XXXX`). `presente.html` → `create-gift-checkout` → e-mail → `resgatar.html`/`resgatar-presente`. |
| **Cortesia / tempo de graça** | Acesso liberado manualmente pela equipe (ex.: quem não pode pagar). `plano = cortesia`, pedido via `tempo-de-graca`. |
| **Indicação (referral)** | Programa "convide e ganhe" (`indicacoes`). Tela `s-indicar`. |

## Técnico

| Termo | O que é |
|---|---|
| **RLS** | Row Level Security do Postgres. É a fronteira de acesso do cliente: cada um só vê/edita as próprias linhas. Ver [MODELO-DE-DADOS](./MODELO-DE-DADOS.md). |
| **anon key** | Chave pública do Supabase usada pelo front (segura, porque a RLS protege). Fica em `config.js`. |
| **service-role key** | Chave privilegiada usada **só no backend** (`_lib/supabase.js`) — ignora RLS. Segredo crítico. |
| **`verifyUser` / `adminKeyValida`** | Autenticação nas funções: JWT do usuário (Bearer) / chave do admin (`x-admin-key`, timing-safe). |
| **signed-URL** | Token que a função emite para o browser subir arquivo **direto** pro Storage (contorna o limite de 4.5MB da Vercel). |
| **SW (service worker)** | `sw.js` — cache/offline/push. Só intercepta same-origin não-`/api`. |
| **"modo demo"** | Estado degradado quando o `supabase-js` não carrega (sem login/dados). Dispara evento Plausible `modo_demo_supabase_falhou`. |
| **Sentinela / smoke-test / pulse** | Agentes cron: monitor de hora em hora / teste diário de APIs / métricas diárias por e-mail. Ver [BACKEND](./BACKEND.md#agentes-cron). |
| **`window.SAA_CONFIG`** | Config pública do front (carregada de `config.js`): URL + anon key do Supabase, DSN do Sentry, domínio do Plausible, VAPID public key. |
| **circulo_feed()** | Função `security definer` do Postgres que devolve o feed do Círculo **anônimo** (sem `user_id`). |
| **LVSV Ventures** | Empresa por trás do app (2º app da LVSV). Monica Buonfiglio é a autora/curadora do conteúdo espiritual. |
