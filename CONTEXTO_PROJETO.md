# Sob as Asas — Contexto do Projeto

> Segundo app da **LVSV Ventures** (o primeiro foi o Tacada). Mesma stack, alma oposta.

## O que é
App de **prática espiritual diária com os anjos da guarda**, ao lado de **Monica Buonfiglio** (autora de "Anjos Cabalísticos", maior autoridade de anjos do Brasil). O usuário descobre seu **anjo regente** (sistema dos 72 anjos), recebe **ritual e mensagens diárias**, registra **pedidos** e, todo mês, a marca realiza um **"Milagre do mês"** na vida de alguém da comunidade.

## Modelo de negócio
- **Freemium → assinatura**: R$ 24,90/mês ou R$ 199/ano, com 7 dias de trial. Pagamento via **Stripe**.
- **Fundo do Milagre**: ~10% da receita líquida custeia o milagre mensal. Cresce com a comunidade.

## ⚖️ Posicionamento jurídico (CRÍTICO)
O assinante paga pela **PRÁTICA** (conteúdo, ritual, biblioteca) — **não** por um sorteio. O "Milagre do mês" é **ato editorial e de generosidade da marca**: seleção **humana e curada** (Monica + equipe), **sem aleatoriedade, sem garantia e sem vínculo com quanto/quando a pessoa pagou**. Isso o mantém **fora** de sorteio (Lei 5.768/71 / SECAP) e de consórcio (Bacen).
- O cron `cron-milagre-shortlist` **só agrupa candidatos para curadoria** — nunca decide.
- Só entram pedidos com **consentimento explícito** do usuário (`candidato_milagre`).
- Validar o regulamento final com advogado de direito digital/consumo (espelhar `BRIEFING_JURIDICO_ADVOGADO.md` do Tacada).

## Diferencial / fosso
A **presença diária da Monica** (conteúdo recorrente, exclusivo + acervo). Inimitável: nenhum concorrente BR tem uma Monica. Benchmark: **Hallow** (app de oração, US$ 157M levantados, Top 1 da App Store).

## Loop de retenção
Descoberta do anjo (ativação "uau") → ritual manhã/noite (hábito) → livro de pedidos (retenção emocional + matéria-prima do milagre) → comunidade → Milagre do mês (propósito + marketing).

## Stack (espelha o Tacada/`pitaco`)
- **App**: web app único (`index.html`) + Tailwind + Google Fonts (Marcellus/Cormorant), empacotado com **Capacitor 6** (iOS/Android). Plugins: push, haptics, splash, status bar.
- **Backend**: funções serverless na **Vercel** (`api/*.js`) + crons.
- **Dados/Auth**: **Supabase**. **Pagamento**: **Stripe**. **Push**: web-push (VAPID).
- **Build**: `npm run build` copia estáticos → `www/`; `npm run sync:ios|android`.

## Design
Claro, etéreo, dourado/celeste. Serifada nos títulos sagrados. Efeitos angelicais: halo que respira, partículas de luz, transições suaves, som/háptico na revelação do anjo. "Calm encontra um santuário".
- Cores: branco `#FBFAF7`, ouro `#BA7517`/`#EF9F27`, celeste `#378ADD`.

## Escopo do MVP
**v1 (lançamento):** onboarding + revelação do anjo · ritual diário + push · biblioteca da Monica · livro de pedidos · Milagre do mês · assinatura (Stripe + trial).
**v1.1+:** comunidade (oração em grupo, acender vela) · streak · notificações inteligentes · personalização avançada por anjo.

## ⚠️ Pendências antes de publicar
1. **Validar os 72 anjos com o material da Monica** — `api/_lib/anjos.js` usa o calendário cabalístico padrão; nomes/atributos/orações DEFINITIVOS são os dela. Não publicar os textos como dela sem curadoria.
2. **Teste de 4 semanas de conteúdo com a Monica** (valida a premissa mais cara: sustentabilidade da cadência).
3. **Briefing jurídico** do regulamento do milagre.
4. Conteúdo de assinatura na App Store pode exigir **IAP** — hoje está com Stripe (decisão: Stripe, revisitar antes do sprint de monetização).

## Estrutura
```
sob-as-asas/
├── index.html              # o app (SPA)
├── manifest.json  sw.js  asa-icon.svg
├── capacitor.config.json   vercel.json   package.json
├── scripts/build.mjs
└── api/
    ├── _lib/{supabase,anjos}.js
    ├── calc-anjo.js                # anjo regente por data
    ├── create-checkout.js          # assinatura Stripe + trial
    ├── cron-ritual.js              # push diário (manhã/noite)
    └── cron-milagre-shortlist.js   # candidatos p/ curadoria (NÃO sorteia)
```
