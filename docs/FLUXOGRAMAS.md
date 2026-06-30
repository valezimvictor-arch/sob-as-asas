# Fluxogramas

[← voltar ao índice](./README.md)

Diagramas em [Mermaid](https://mermaid.js.org/) — renderizam automaticamente no GitHub. Editáveis como texto.

## Arquitetura (alto nível)

```mermaid
flowchart TB
    subgraph Cliente["📱 Cliente (browser / app Capacitor)"]
        SPA["index.html (SPA)<br/>+ config.js + sw.js"]
    end
    subgraph Vercel["▲ Vercel"]
        FN["Funções /api/*<br/>(service-role)"]
        CRON["Vercel Cron → /api/cron-*"]
    end
    subgraph Supabase["🟢 Supabase"]
        AUTH["Auth (JWT)"]
        DB[("Postgres + RLS")]
        STG[("Storage<br/>conteudos · audios-monica")]
    end
    STRIPE["💳 Stripe"]
    RESEND["✉️ Resend"]
    PUSH["🔔 Web Push"]

    SPA -->|"supabase-js (anon, RLS)"| AUTH
    SPA -->|"supabase-js (anon, RLS)"| DB
    SPA -->|"fetch Bearer JWT / x-admin-key"| FN
    FN --> DB
    FN --> STG
    FN --> STRIPE
    FN --> RESEND
    FN --> PUSH
    STRIPE -->|"webhook"| FN
    CRON --> FN
```

## Jornada do usuário (onboarding → uso)

```mermaid
flowchart TD
    A["s-welcome"] --> B{"Tem conta?"}
    B -->|"Não"| C["s-cadastro<br/>nome, nascimento, senha"]
    B -->|"Sim"| L["Login"]
    C --> D["auth.signUp + upsert users"]
    D --> E["s-reveal<br/>✨ revelação do anjo"]
    E --> F["s-acolhimento<br/>como você chega hoje?"]
    F --> G["s-primeira-pratica"]
    G --> H["🏠 s-home (Altar)"]
    L --> H
    H --> I["Início"]
    H --> J["Biblioteca"]
    H --> K["Pedidos / Círculo"]
    H --> M["Comunidade"]
    H -.-> N["Magia · Caminhos · Carta mensal<br/>Mapa · Loja · Gratidão · ..."]
```

## Autenticação (login)

```mermaid
flowchart TD
    A["s-login"] --> B{"Como entrar?"}
    B -->|"E-mail + senha"| C["auth.signInWithPassword"]
    B -->|"Código por e-mail"| D["auth.signInWithOtp<br/>(magic link)"]
    C --> E{"OK?"}
    E -->|"Sim"| Z["aoLogar(session)<br/>preenche window._userId/_anjo/_plano"]
    E -->|"invalid credentials"| F["⚠️ Pode ser conta SEM senha<br/>(criada por magic link)"]
    F --> G["Mensagem guia:<br/>usar código por e-mail OU<br/>'Esqueci minha senha'"]
    D --> H["E-mail com link"] --> I["clica → volta logado"] --> Z
    G -.->|"Esqueci a senha"| J["resetPasswordForEmail"] --> K["s-recovery<br/>updateUser({password})"] --> A
    Z --> M["🏠 s-home"]
```

## Ciclo de uma requisição privilegiada

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as /api/endpoint
    participant V as verifyUser / adminKeyValida
    participant S as Supabase (service-role)
    B->>F: fetch (Authorization: Bearer JWT  ou  x-admin-key)
    F->>V: autentica
    alt não autenticado
        V-->>B: 401 { ok:false }
    else autenticado
        V-->>F: userId / ok
        F->>F: valida entrada (regex/whitelist/limites)
        F->>S: query privilegiada (ignora RLS)
        S-->>F: dados
        F-->>B: { ok:true, ... }
    end
```

## Pagamento — assinatura premium

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as /api/create-checkout
    participant ST as Stripe
    participant WH as /api/stripe-webhook
    participant DB as Supabase
    B->>API: POST (plano mensal/anual)
    API->>ST: cria Checkout Session
    ST-->>B: redirect p/ checkout.stripe.com
    B->>ST: paga
    ST->>WH: checkout.session.completed
    WH->>DB: idempotência? (stripe_events)
    WH->>DB: upsert assinaturas + users.plano = trial/mensal/anual
    ST->>WH: customer.subscription.updated/deleted
    WH->>DB: atualiza status/plano
```

## Presente (gift) — pagamento único + resgate

```mermaid
sequenceDiagram
    participant C as Comprador (presente.html)
    participant API as /api/create-gift-checkout
    participant ST as Stripe
    participant WH as /api/stripe-webhook
    participant DB as Supabase
    participant R as Resend
    participant P as Presenteado (resgatar.html)
    C->>API: POST (de, para, mensagem, data_envio)
    API->>ST: Checkout (pagamento único)
    C->>ST: paga
    ST->>WH: checkout.session.completed (tipo=presente)
    WH->>DB: insert presentes (código PRES-XXXX)
    WH->>R: e-mail pro presenteado com o código
    P->>P: /resgatar?codigo=...
    P->>DB: resgatar-presente → cria/atualiza conta + plano anual cortesia
```

## Upload de áudio (admin, signed-URL)

```mermaid
sequenceDiagram
    participant A as admin.html
    participant API as /api/admin-upload-audio
    participant STG as Storage (audios-monica)
    participant DB as Supabase
    A->>API: POST {action:sign, tipo, refId, filename} (x-admin-key)
    API->>API: valida (anjo_n 1..72 / slug / dia 1..7 / extensão)
    API-->>A: { token, path, publicUrl }
    A->>STG: uploadToSignedUrl(path, token, file)  // upload DIRETO (sem passar na função)
    A->>API: POST {action:commit, tipo, refId, audio_url, duracao_seg}
    API->>DB: grava conteudos (72-anjos/monica) ou caminhos_dias (caminhos)
```

## Círculo de Velas (anônimo)

```mermaid
flowchart LR
    A["Usuário marca pedido como público"] --> B["pedidos.publico = true"]
    B --> C["RPC circulo_feed()<br/>(security definer, sem user_id)"]
    C --> D["Feed anônimo no app"]
    D --> E["acenderVelaPedido(id)"]
    E --> F["/api/acender-vela-pedido<br/>(valida público + não-próprio)"]
    F --> G["insert velas_pedidos"]
    G --> H["trigger → pedidos.velas_recebidas<br/>= nº de pessoas distintas"]
```

## Agentes (cron) — visão de quando rodam

```mermaid
flowchart LR
    subgraph Diário
        R1["09h ritual manhã"]
        R2["23h ritual noite"]
        SM["10h smoke-test"]
        PU["11h pulse"]
        PR["11h30 presentes agendados"]
    end
    subgraph Horário
        SE["a cada hora: Sentinela (monitor)"]
    end
    subgraph Semanal/Mensal
        NL["sáb: newsletter"]
        ND["sex: rascunho newsletter"]
        IG["seg/qua/sex: rascunho Instagram"]
        RE["ter/sex: reengajamento"]
        MI["dia 25: shortlist Milagre"]
    end
```
