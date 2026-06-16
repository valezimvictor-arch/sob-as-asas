# Varredura Semanal — Sob as Asas

**Data:** 16 de junho de 2026
**Foco:** Hallow, Calm, Insight Timer, Lojong — o que cada um faz bem, onde a Monica/Sob as Asas pode capturar valor.

---

## 1. Hallow — referência absoluta no espiritual cristão

**O que faz bem:**
- **Rituais com hora marcada e duração definida** (5/10/20 min). O usuário escolhe "uma novena de 9 dias com Padre Mike Schmitz" e o app planeja: notificação na hora certa, áudio narrado, progresso visível.
- **Vozes humanas conhecidas como protagonistas.** Cada série é narrada por um padre/leigo com nome e bio. Não é "o app fala" — é "tal pessoa fala com você".
- **Modo "Lent challenge" / "Advent challenge"** — eventos sazonais com cronograma, vídeo diário e medalha simbólica. Cria FOMO e retenção.
- **Lock screen widgets** (iOS): salmo do dia direto na tela bloqueada.
- **Compartilhamento de pedidos em comunidades fechadas** (família, paróquia).

**O que aplicar no Sob as Asas:**

| Ideia | Por quê |
|---|---|
| **"Novena dos 9 dias com a Monica" como série lançada** — vídeo curto dela narrando cada dia, com áudio de fundo e progresso visível. | Diferencial gigantesco: a voz da Monica em sequência. A maioria dos apps espirituais BR não tem rosto/voz forte. |
| **Eventos sazonais** — "9 dias de São Miguel" (29/set), "Novena dos Anjos da Guarda" (1–9/out), "Janela 1–22 de fevereiro: Anjos da Humanidade". | Cria momentos de pico de download/engajamento. Posts no Insta da Monica + push no app. |
| **Compartilhamento de pedido para "círculo de oração"** (3–5 pessoas convidadas, sem ir pra comunidade pública). | Aumenta retenção viral. Cada usuário traz 3. Hallow cresceu com isso. |
| **Lock screen widget no iOS** — "Anjo do dia: Vehuiah · Salmo 23". | Visibilidade constante sem precisar abrir. Capacitor + iOS Widget Extension. |

**Atenção:** Hallow ESTOURA em produção de áudio e tem ~$50M em capital. Não copie estética — copie estrutura.

---

## 2. Calm — referência em retenção e produção sonora

**O que faz bem:**
- **Sleep Stories com celebridades** (Matthew McConaughey, etc) — o conteúdo é o produto principal, não o app.
- **Daily Calm de 10 min** — formato consistente diário cria hábito.
- **Soundscapes**: chuva, lareira, oceano — ambient com fade in/out elegante.
- **Trial de 7 dias com cobrança automática** — funil clássico, conversão alta.
- **Onboarding curtíssimo** (3 telas: o que te traz aqui, com que frequência, quando lembrar) → encaminha para a primeira meditação relevante.

**O que aplicar no Sob as Asas:**

| Ideia | Por quê |
|---|---|
| **"Para dormir sob as asas" — coleção de 8–10 áudios da Monica** (15–25 min) narrando o salmo + visualização de proteção angelical. | Categoria "antes de dormir" é o maior pool de tempo do usuário. Calm cobra US$70/ano e enche caixa só com isso. |
| **Ambient sounds curados** — harpa celestial (já temos no Salmo), sinos suaves, "som do céu" (vento + ressonância). Toggle on/off no player. | Reforça a estética sagrada. Custo baixo (royalty-free curado). |
| **Onboarding 3-telas focado em "qual sua dor agora"** — Ansiedade · Tristeza · Direção · Gratidão — direcionando à primeira prática certa. | Substitui "cadastro → revelar anjo" por "cadastro → você se sente X → comece com Y". Maior conversão para retenção. |
| **Streak visual mais forte** (Calm dá medalhas por 7, 30, 100 dias). Hoje temos só "X dias sob as asas". | Gamificação leve, sem cair em pontos. Marco simbólico: 7 dias = "primeira semana sob as asas", 30 = "primeiro mês", 72 = "um anjo por dia". |

**Atenção:** Calm é frio/laico. Sob as Asas é caloroso/sagrado. Use o framework de retenção, mas mantenha o tom.

---

## 3. Insight Timer — referência em comunidade e descoberta

**O que faz bem:**
- **Mural global de "X pessoas meditando agora"** — sensação de não estar só.
- **Biblioteca gigante com filtros por professor, duração, tema** — usuário acha o que precisa em 2 toques.
- **Bate-papo entre usuários por interesse** (grupos como "Ansiedade", "Reiki", "Anjos").
- **Conteúdo gratuito generoso** — só áudios de 30+ min e cursos são pagos. Atrai massa.

**O que aplicar no Sob as Asas:**

| Ideia | Por quê |
|---|---|
| **"X pessoas estão orando agora"** no rodapé da Home (contador real, atualizado). | Aumenta sensação de comunidade invisível. Implementação: Postgres NOTIFY ou polling de presença anônima a cada 60s. |
| **"X velas acesas hoje em todo o Brasil"** — agregado dos `saa_vela_n`. Mapa simplificado por estado (opcional). | Refrescante: dá escala emocional ao gesto individual. |
| **Filtros na biblioteca por sentimento** (Ansiedade, Cura, Prosperidade, Reconciliação) além de coleção. | O usuário chega no app já com dor. Filtrar por necessidade > filtrar por categoria abstrata. |
| **Grupos privados ao redor de jornadas** (ex.: "Iniciantes nos 72 anjos" — moderado pela equipe Monica). | Comunidade temática gera retenção 3x maior que feed aberto. |

**Atenção:** comunidade exige moderação. Não escalone antes de ter equipe de curadoria.

---

## 4. Lojong — referência brasileira, casa próxima nossa

**O que faz bem:**
- **Foco em meditação BR com sotaques locais e referências culturais (cordel, MPB).**
- **Pacote de meditações 1:1 com terapeutas parceiros** dentro do app — receita auxiliar.
- **Áudios curtos (3–5 min) "para o ônibus", "para a fila do banco"** — entram no dia-a-dia real.
- **Email semanal com 1 áudio gratuito + 1 conteúdo escrito** — channel de relacionamento forte com base.

**O que aplicar no Sob as Asas:**

| Ideia | Por quê |
|---|---|
| **Newsletter semanal "Carta dos Anjos"** — 1 mensagem da Monica + 1 anjo da semana + 1 prática curta. Sábado às 8h. | Custo zero, retenção alta de não-pagantes, prepara conversão. Resend já está configurado. |
| **Práticas de 1 minuto** — "Bênção do café da manhã", "Bênção do trânsito", "Bênção antes da reunião". 30s de áudio cada. | Entra na vida real. Diferencia de "tira 20 min do seu dia". |
| **Lista de Conselheiros Espirituais** parceiros (terapeutas, taróloga, astróloga, etc) com selo "indicado pela Monica" — agendamento 1:1 com fee. | Receita auxiliar sem produção de conteúdo. Monica curaria 3–5 nomes de confiança. |
| **Audioguia "Conhecer seu anjo em 7 dias"** (gratuito após cadastro) — sequência diária com mensagens crescendo em profundidade. | Onboarding de retenção. Hoje o usuário descobre o anjo e... fica perdido. |

---

## 5. O que NENHUM deles tem (a oportunidade Sob as Asas)

| Diferencial nosso | Por quê é capturável |
|---|---|
| **Sistema dos 72 nomes cabalísticos com data de nascimento** | Único no mercado brasileiro digital. Cria identidade instantânea no onboarding. |
| **Monica como ROSTO único** | Hallow tem múltiplos padres; Sob as Asas tem A figura. Concentra autoridade. |
| **Milagre do Mês (ação editorial)** | Ninguém atrela narrativa de transformação real à marca dessa forma. Risco de virar marketing barato — manter editorial e gratuito. |
| **Estética visual cabalista refinada** | Mercado BR de apps espirituais é estéticamente pobre. Aqui já estamos à frente com o manual de marca + dourado/Playfair. |

---

## 6. Lista priorizada — o que entregar nas próximas 4 semanas

**Semana 1 (alto impacto, baixo custo):**
1. ✉️ **Newsletter "Carta dos Anjos"** — template + agendamento sábado 8h via Resend
2. 🌬️ **Onboarding emocional** — substituir tela inicial "revelar anjo" por "como você se sente" → caminho personalizado
3. 🕯️ **Contador "velas acesas hoje no Brasil"** — sum() em `saa_vela_n` ou query Supabase

**Semana 2 (mexer no produto):**
4. 📿 **Áudio-guia "Conhecer seu anjo em 7 dias"** — gravar 7 áudios de 2 min com a Monica
5. 🌙 **Coleção "Para dormir sob as asas"** — gravar 5 áudios longos (sessões de domingo da Monica)
6. 🔍 **Filtros por sentimento na biblioteca**

**Semana 3 (eventos sazonais):**
7. 📅 **Calendário litúrgico angelical** — datas dos coros, anjos da humanidade, Arcanjos
8. 🎯 **Primeira "Novena dos Anjos" assistida** — evento de 9 dias com push diário, vídeo da Monica, medalha de conclusão

**Semana 4 (crescimento viral):**
9. 🤝 **Círculo de oração** — convidar 3–5 pessoas para um pedido específico
10. 📱 **iOS Lock Screen Widget** — "Anjo do dia · Salmo do dia"

---

## 7. O que NÃO copiar (importante)

- ❌ **Trial agressivo com cobrança automática silenciosa** (Calm faz, Hallow faz) — aqui temos `trial_period_days: 7` mas com aviso explícito. A Monica não pode estar associada a "cobrança escondida".
- ❌ **Streaks com pressão de culpa** ("você quebrou seu streak de 47 dias!"). A relação com anjos é de paz, não de cobrança.
- ❌ **Conteúdo gerado por IA** sem voz humana. A Monica é o produto. Áudios sintéticos quebram a magia.
- ❌ **Gamificação com pontos/coins/levels** (lojas in-app de vela virtual). Vira jogo. Vela é sagrada.

---

## 8. Próxima varredura

**Data:** Segunda-feira, 22 de junho de 2026
**Foco sugerido:** Astrocentro · Astrology Zone · Co-Star · Susan Miller — como o nicho astral BR/global posiciona autoridade feminina, monetiza horoscopo personalizado, e qual a sobreposição/distância do nosso público.
