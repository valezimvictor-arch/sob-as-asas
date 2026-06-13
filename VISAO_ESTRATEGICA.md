# Sob as Asas — Visão Estratégica

## Visão
Tornar-se o app de referência de espiritualidade e anjos da guarda do Brasil — a prática diária que acompanha milhões de brasileiros, com a Monica Buonfiglio como rosto e autoridade. Segundo app da **LVSV Ventures** (após o Tacada).

## Tese
1. Mercado BR de espiritualidade é enorme e crescente, mas **lotado de apps rasos, grátis e anônimos** — nenhuma marca de verdade.
2. Hallow (US$ 157M, Top 1 da App Store) provou que **fé + voz de autoridade + ritual** = negócio grande.
3. Temos a autoridade **já pronta**: Monica, ~1M de seguidores, dona do tema "anjos" no Brasil desde os anos 90.
4. O "anjo da guarda" foi febre nos anos 90 e o público que busca isso só cresce.

## Público
Majoritariamente mulheres 30–60 que buscam proteção, sentido e conexão espiritual diária; já conhecem ou confiam na Monica.

## Modelo de negócio
- **Freemium → assinatura.** R$ 24,90/mês ou R$ 199/ano, com 7 dias de trial. Pagamento via Stripe.
- **Fundo do Milagre:** ~10% da receita líquida custeia o Milagre do mês. Cresce com a comunidade (e vira argumento de marketing/indicação).

## Unit economics (premissas conservadoras)
- Receita líquida ≈ R$ 17,40/assinante/mês (após loja + imposto).
- Margem de contribuição ≈ R$ 12,20 (~49% da bruta), após fundo do milagre + custos.
- LTV ≈ R$ 244 (churn 5%/mês → ~20 meses).
- CAC baixo via canal orgânico da Monica → LTV/CAC saudável (>3) plausível.
- Break-even operacional estimado em ~2.000–4.000 assinantes.

## Jornada & conversão
Aquisição (Instagram da Monica) → Ativação grátis (descoberta do anjo, o "uau") → Hábito grátis-limitado (1 conteúdo/dia, Salmo Diário, livro de pedidos) → **Gatilhos de paywall** (profundidade: biblioteca/séries/72 anjos completos; continuidade: fim do trial; emoção: ritual guiado, áudios p/ dormir) → Retenção longo prazo (conteúdo novo semanal, Salmo Diário, streak, Milagre do mês).
- **Regra jurídica:** candidatura ao Milagre é sempre grátis. Paywall desbloqueia a *prática*, nunca a *chance* do milagre.

## Fosso competitivo
A presença diária e recorrente da Monica. Nenhum concorrente BR consegue copiar.

## Roadmap (sprints — mesma cadência do Tacada)
- **S0 Fundação:** design system + base/infra (Capacitor + Vercel + Supabase + Stripe). ✅ scaffold pronto.
- **S1 O "uau":** onboarding + revelação do anjo. ✅ feito e verificado.
- **S2 O hábito:** ritual diário + push + biblioteca/player + Salmo Diário. 🔄 em andamento.
- **S3 O coração:** livro de pedidos + Milagre do mês.
- **S4 Monetização:** paywall + assinatura Stripe + trial. 🔄 paywall pronto (UI).
- **S5 Polimento:** som, háptico, micro-animações, QA, App Store/Play.
- **v1.1+:** comunidade (oração em grupo, acender vela), streak, notificações inteligentes, personalização avançada por anjo.

## Métricas-chave (acompanhar)
- Ativação: % que completa a descoberta do anjo.
- Hábito: DAU/MAU, dias de uso/semana, abertura do Salmo Diário.
- Conversão: trial→pago, % free→assinante.
- Retenção: churn mensal, retenção D30/D90.
- Conteúdo: consumo por pilar, qual formato/coleção retém mais.

## Riscos
1. **(Maior) Operacional:** sustentabilidade da cadência de conteúdo da Monica. Mitigação: 1 âncora semanal + micro-conteúdos diários do acervo; testar 4 semanas antes de escalar.
2. **Jurídico:** estrutura do Milagre. Mitigação: curadoria humana, sem aleatoriedade, candidatura grátis; validar com advogado (ver BRIEFING_JURIDICO_ADVOGADO.md).
3. **Plataforma:** Apple pode exigir IAP para assinatura de conteúdo (hoje Stripe). Revisitar antes de S4 final.
4. **Dependência da Monica:** marca muito atrelada a uma pessoa. Mitigação de longo prazo: construir a marca "Sob as Asas" como ativo próprio.
