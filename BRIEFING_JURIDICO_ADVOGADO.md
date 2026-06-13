# Briefing Jurídico — Sob as Asas (para o advogado)

> Objetivo: validar a estrutura do app, em especial o **"Milagre do mês"**, garantindo que NÃO se configure (a) distribuição gratuita de prêmios mediante sorteio (Lei 5.768/1971 / regulação SECAP–ME), (b) consórcio (Lei 11.795/2008 / Bacen), nem (c) captação irregular / pirâmide.

## 1. O que é o produto
App de assinatura de **prática espiritual diária** (conteúdo em áudio/vídeo/texto da Monica Buonfiglio, ritual diário, Salmo Diário, livro de pedidos pessoais). Assinatura: R$ 24,90/mês ou R$ 199/ano, com 7 dias de trial. Pagamento via Stripe.

## 2. O ponto sensível — "Milagre do mês"
Uma vez por mês, a marca **escolhe uma história** entre pedidos de usuários que **consentiram explicitamente** em compartilhá-la, e **realiza** aquele pedido (ato de generosidade), transformando em conteúdo (vídeo da Monica). Inspirado no antigo programa de TV dela.

### Como desenhamos para NÃO ser sorteio
- **A assinatura paga a prática, não um bilhete.** O acesso ao conteúdo/ritual é a contraprestação; o milagre não é o que o cliente "compra".
- **Seleção 100% editorial e humana** (Monica + equipe), por critérios subjetivos (sensibilidade, viabilidade, impacto). **Sem aleatoriedade, sem sorteio, sem algoritmo de chance.**
- **Sem garantia e sem vínculo com pagamento:** a escolha não depende de quanto/quando/se a pessoa pagou.
- **Candidatura é gratuita para todos** (inclusive não assinantes) e exige **consentimento explícito** (opt-in por pedido). O paywall do app nunca controla a candidatura.
- **Fundo do Milagre** (~10% da receita líquida) é orçamento de uma ação da marca, não um "prêmio acumulado" dos participantes.

## 3. Perguntas que precisamos que você responda
1. Com o desenho acima, **confirma que está fora** do regime de promoção comercial/sorteio (sem necessidade de autorização SECAP)? Que ajustes tornam isso inequívoco?
2. Há risco de interpretação como **consórcio** ou **captação de poupança popular**? Como blindar?
3. O fato de o **fundo** ser um percentual da receita cria algum vínculo problemático? Melhor desvincular publicamente (ex.: não comunicar o "10%")?
4. **Regulamento do Milagre do mês** — pode redigir/revisar? Deve deixar claro: caráter editorial, ausência de sorteio, consentimento, uso de imagem, ausência de garantia.
5. **Termos de Uso e Política de Privacidade** (LGPD) — coletamos data de nascimento (cálculo do anjo) e textos de pedidos (dados sensíveis? religiosos?). Como tratar base legal, consentimento e armazenamento?
6. **Uso de imagem/voz** dos contemplados e da Monica — termos necessários.
7. **Publicidade/claims:** que limites para comunicar "milagre", "pedido realizado", proteção — para não configurar propaganda enganosa ou charlatanismo?
8. **App Store/Play:** implicações de vender assinatura de conteúdo digital via Stripe (fora do IAP)?

## 4. Contexto societário
Operado pela **LVSV Ventures Participações Ltda.** (mesma do app Tacada). Reaproveitar a estrutura/termos do Tacada onde fizer sentido.

## 5. Materiais anexos
- `CONTEXTO_PROJETO.md` (visão geral), `VISAO_ESTRATEGICA.md` (modelo), `MARCA.md`.
- Código do cron `api/cron-milagre-shortlist.js` (evidência de que o sistema só agrupa candidatos para curadoria, sem decidir).
