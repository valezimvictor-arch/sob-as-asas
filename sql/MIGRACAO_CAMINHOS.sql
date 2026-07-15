-- Migração: Caminhos da Monica — jornadas guiadas de 7 dias
--
-- Estratégia Hallow: ao invés de 72 áudios soltos, agrupamos práticas em
-- "Caminhos" temáticos de 7 dias. O usuário escolhe um Caminho que faz
-- sentido com o momento dele (perda, ansiedade, prosperidade, etc) e
-- recebe uma prática por dia, durante 7 dias.
--
-- Conteúdo: Monica grava 7 áudios por Caminho (~5-8 min cada). Enquanto
-- não está gravado, o app exibe só o texto + um "em breve, na voz da
-- Monica" no audio_url.

create table if not exists public.caminhos (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,                -- 'acolher-perda', 'atravessar-ansiedade'
  titulo        text not null,
  subtitulo     text,                                -- "7 dias para..." ou frase poética
  descricao     text,                                -- texto longo de apresentação
  cover_emoji   text default '🪽',                   -- placeholder até ter cover image
  cover_url     text,
  total_dias    int not null default 7,
  ordem         int not null default 0,              -- pra ordenar no feed
  publicado     boolean not null default false,
  premium       boolean not null default true,       -- a maioria é Plano dos Anjos
  criado_em     timestamptz default now()
);
create index if not exists idx_caminhos_publicados on public.caminhos(ordem) where publicado = true;

create table if not exists public.caminhos_dias (
  id            uuid primary key default gen_random_uuid(),
  caminho_id    uuid not null references public.caminhos(id) on delete cascade,
  dia           int not null,                        -- 1..7
  titulo        text not null,
  texto         text not null,                       -- meditação/oração escrita
  audio_url     text,                                -- pode ser null até Monica gravar
  duracao_seg   int,
  unique (caminho_id, dia)
);
create index if not exists idx_caminhos_dias_caminho on public.caminhos_dias(caminho_id, dia);

-- Progresso individual do user num Caminho
create table if not exists public.caminhos_progresso (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  caminho_id         uuid not null references public.caminhos(id) on delete cascade,
  dia_atual          int not null default 1,         -- próximo dia a completar
  ultimo_dia_feito   int,                            -- útil pra UI "você está no dia X"
  iniciado_em        timestamptz not null default now(),
  ultimo_acesso_em   timestamptz default now(),
  concluido_em       timestamptz,                    -- timestamp quando terminou o 7º
  unique (user_id, caminho_id)
);
create index if not exists idx_caminhos_prog_user on public.caminhos_progresso(user_id);

-- RLS
alter table public.caminhos enable row level security;
alter table public.caminhos_dias enable row level security;
alter table public.caminhos_progresso enable row level security;

drop policy if exists "caminhos publicos legiveis" on public.caminhos;
create policy "caminhos publicos legiveis" on public.caminhos
  for select using (publicado = true);

drop policy if exists "caminhos dias legiveis" on public.caminhos_dias;
create policy "caminhos dias legiveis" on public.caminhos_dias
  for select using (exists (select 1 from public.caminhos c where c.id = caminhos_dias.caminho_id and c.publicado = true));

drop policy if exists "progresso self" on public.caminhos_progresso;
create policy "progresso self" on public.caminhos_progresso
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- SEED — 3 Caminhos iniciais
-- ════════════════════════════════════════════════════════════════════

-- Caminho 1: Para Acolher a Perda
insert into public.caminhos (slug, titulo, subtitulo, descricao, cover_emoji, ordem, publicado, premium) values
('acolher-perda',
 'Para Acolher a Perda',
 '7 dias sob a chama do consolo',
 'Toda perda — de um amor, de um trabalho, de uma fase, de quem amava — tem direito ao seu tempo. Este Caminho não apaga o vazio: faz companhia a ele. Monica conduz, dia após dia, com o anjo que ampara em silêncio.',
 '🤍', 1, true, true)
on conflict (slug) do nothing;

with c as (select id from public.caminhos where slug = 'acolher-perda')
insert into public.caminhos_dias (caminho_id, dia, titulo, texto) values
((select id from c), 1, 'Dia 1 · O direito ao silêncio',
 'Hoje você não precisa explicar. Não precisa estar bem. Não precisa achar palavras. O silêncio é uma forma de oração. Ficamos juntos nele.'),
((select id from c), 2, 'Dia 2 · O que dói tem nome',
 'Nomear a dor não a aumenta — só a coloca no colo. Se puder, escreva no Livro de Pedidos o que perdeu. Não precisa entregar a ninguém. Basta nomear.'),
((select id from c), 3, 'Dia 3 · A memória é um altar',
 'O que se perdeu deixa traço de luz onde existiu. Lembrar não é prender — é honrar. Acenda uma vela pela memória. Ela continua acompanhando.'),
((select id from c), 4, 'Dia 4 · Permita a ausência',
 'A ausência não vai embora porque você sorri. Mas ela cabe junto com o sorriso. Hoje, deixe os dois existirem ao mesmo tempo.'),
((select id from c), 5, 'Dia 5 · Quem fica é maior',
 'Você também fica. Olhe pra si com a mesma ternura que tem por quem partiu. Você é parte da memória — sua continuidade é uma forma de cuidado.'),
((select id from c), 6, 'Dia 6 · Um passo, sem pressa',
 'Hoje, faça uma coisa pequena que era difícil ontem. Pode ser comer devagar, abrir uma janela, telefonar pra alguém. Pequenos passos são oração em movimento.'),
((select id from c), 7, 'Dia 7 · A travessia continua',
 'Você atravessou 7 dias sob a chama. Não significa que acabou — significa que você se fez companhia. Sempre que precisar, este Caminho fica acesso. Volte quando o tempo pedir.')
on conflict (caminho_id, dia) do nothing;

-- Caminho 2: Para Atravessar a Ansiedade
insert into public.caminhos (slug, titulo, subtitulo, descricao, cover_emoji, ordem, publicado, premium) values
('atravessar-ansiedade',
 'Para Atravessar a Ansiedade',
 '7 dias sob a chama da quietude',
 'A ansiedade não some no estalar dos dedos — mas pode ser conduzida. Este Caminho ensina a respirar com ela, sem brigar. Em 7 dias, você aprende a chamar a quietude antes da tempestade.',
 '🌬️', 2, true, true)
on conflict (slug) do nothing;

with c as (select id from public.caminhos where slug = 'atravessar-ansiedade')
insert into public.caminhos_dias (caminho_id, dia, titulo, texto) values
((select id from c), 1, 'Dia 1 · O que ela está dizendo',
 'A ansiedade não é inimiga: é mensageira apressada. Hoje, escute o que ela traz. Não obedeça — escute. Anote uma frase: "Ela me avisa sobre…"'),
((select id from c), 2, 'Dia 2 · Respiração 4-7-8',
 'Inspire em 4 tempos. Segure em 7. Solte em 8. Três ciclos. Faça agora. Esta é a única tarefa de hoje.'),
((select id from c), 3, 'Dia 3 · O corpo vem antes',
 'A mente acelera porque o corpo a desafia. Hoje: 5 minutos de pés no chão, sentindo o peso. A ansiedade afrouxa quando o corpo ancora.'),
((select id from c), 4, 'Dia 4 · O que é meu, o que é do mundo',
 'Faça duas listas: o que está sob meu cuidado · o que está fora. Devolva o segundo grupo aos anjos. Eles cuidam do que não te cabe.'),
((select id from c), 5, 'Dia 5 · A previsão não é o presente',
 'A ansiedade vive no que ainda não veio. Traga sua atenção pra agora — para a temperatura da pele, o som ao fundo, o cheiro do quarto. Agora é seguro.'),
((select id from c), 6, 'Dia 6 · O pequeno é suficiente',
 'Hoje, faça uma única coisa por vez. Sem checar telefone entre tarefas. A ansiedade adora a fragmentação. A quietude mora na inteireza.'),
((select id from c), 7, 'Dia 7 · O ritmo é seu',
 'Você atravessou. Sabe agora: a ansiedade não te define. Ela vem e vai. Você continua. Quando voltar, este Caminho repete — e cada repetição te ensina mais.')
on conflict (caminho_id, dia) do nothing;

-- Caminho 3: Para Receber Prosperidade
insert into public.caminhos (slug, titulo, subtitulo, descricao, cover_emoji, ordem, publicado, premium) values
('receber-prosperidade',
 'Para Receber Prosperidade',
 '7 dias sob a chama da abundância',
 'Prosperidade não é só dinheiro — é o fluxo aberto. Este Caminho destrava o que segura, identifica os ruídos internos sobre merecimento, e ensina o gesto de receber. Em 7 dias, você reorganiza sua relação com o que vem.',
 '💫', 3, true, true)
on conflict (slug) do nothing;

with c as (select id from public.caminhos where slug = 'receber-prosperidade')
insert into public.caminhos_dias (caminho_id, dia, titulo, texto) values
((select id from c), 1, 'Dia 1 · O que prosperidade significa pra você',
 'Antes de pedir, defina. Não use a palavra dos outros. Escreva: "Para mim, prosperidade é…". Seja específico. O céu responde melhor ao desenho do que ao genérico.'),
((select id from c), 2, 'Dia 2 · A voz que diz "não mereço"',
 'Identifique a frase exata que aparece quando algo bom vem. Anote sem julgar. Hoje, só identifique. Amanhã trabalhamos.'),
((select id from c), 3, 'Dia 3 · A gratidão antes da chegada',
 'Faça 3 agradecimentos pelo que ainda não veio — como se já tivesse vindo. "Obrigado pelo trabalho que se abre". "Obrigado pela paz no dinheiro". Repita à noite.'),
((select id from c), 4, 'Dia 4 · O dízimo simbólico',
 'Hoje, dê algo — qualquer coisa, com intenção. Pode ser tempo, atenção, R$ 5 numa esmola, um livro emprestado. Fluxo se cria abrindo a mão.'),
((select id from c), 5, 'Dia 5 · O que pesa no seu armário',
 'Escolha 3 coisas que você não usa e doe ou descarte. Espaço atrai. Acúmulo trava. Hoje, abra espaço físico — o espiritual segue.'),
((select id from c), 6, 'Dia 6 · A ação alinhada',
 'Pergunte: "que passo, hoje, se alinha com a prosperidade que pedi?" Pode ser uma mensagem, um currículo, uma planilha. Faça um passo — não dez. Um.'),
((select id from c), 7, 'Dia 7 · O fluxo é constante',
 'Você atravessou. A prosperidade não chega num dia — ela se aproxima quando você se aproxima dela. Este Caminho fica disponível. Refaça nos meses em que sentir o fluxo travar.')
on conflict (caminho_id, dia) do nothing;
