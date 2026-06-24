// POST /api/admin-triagem-email
// Body: { emailRecebido: string }
// Recebe o texto bruto de um email que chegou em contato@sobasasas.com.br,
// classifica em 4 categorias e rascunha uma resposta no tom da marca.
//
// Não é "AI completa" — é template-based com regex + decisão baseada em
// palavras-chave. Suficiente pra acelerar 80% dos casos. Quando o volume
// justificar, pluga LLM (Claude API) pra refinamento.

import { adminKeyValida } from './_lib/adminAuth.js';

// Categorias e suas palavras-chave (em PT-BR + variações)
const CATEGORIAS = {
  espiritual: {
    palavras: ['anjo', 'salmo', 'oração', 'oracao', 'reza', 'deus', 'fé', 'fe', 'espirit', 'milagre', 'cura', 'amparo', 'luz', 'proteção', 'protecao', 'guarda'],
    rotulo: 'Pergunta espiritual',
    rascunhoTemplate: (corpo, nome) =>
      `Querida ${nome || 'irmã'},\n\nObrigada por escrever — recebi sua mensagem com cuidado. ${gerarCorpoEspiritual(corpo)}\n\nMonica está cuidando dos textos dos próximos meses e vai responder pessoalmente as cartas que mais a tocam. A sua já está na fila.\n\nEnquanto isso, recomendo abrir o app no horário do seu anjo (você vê em "Anjo deste momento" no home) e respirar com ele por 1 minuto. Sob as asas dele, você não está sozinha.\n\nUm abraço,\nEquipe Sob as Asas\nem nome da Monica Buonfiglio`,
  },
  suporte_tecnico: {
    palavras: ['não consigo', 'nao consigo', 'erro', 'bug', 'travou', 'não funciona', 'nao funciona', 'login', 'senha', 'código', 'codigo', 'email não chegou', 'celular', 'app', 'pagar', 'pagamento', 'cartão', 'cartao', 'cobrança', 'cobranca', 'cancelar', 'reembolso'],
    rotulo: 'Suporte técnico',
    rascunhoTemplate: (corpo, nome) =>
      `Olá ${nome || ''},\n\nObrigada por avisar — vou resolver agora mesmo.\n\n${gerarCorpoTecnico(corpo)}\n\nQualquer coisa, me escreve de volta nesse mesmo email. Estou aqui.\n\nVinicius (equipe Sob as Asas)\ncontato@sobasasas.com.br`,
  },
  comercial: {
    palavras: ['parceria', 'colab', 'imprensa', 'pauta', 'entrevista', 'palestra', 'evento', 'congresso', 'curso', 'workshop', 'patrocínio', 'patrocinio', 'b2b', 'corporativo'],
    rotulo: 'Oportunidade comercial',
    rascunhoTemplate: (corpo, nome) =>
      `Olá ${nome || ''},\n\nObrigada pelo contato. Recebi sua proposta e vou direcionar pra Monica avaliar pessoalmente. Como ela atende essas demandas com cuidado, o retorno pode levar de 5 a 10 dias úteis.\n\nSe for urgente ou tiver alguma data limite, me avisa que priorizo.\n\nVinicius Valezim\nLVSV Ventures — Sob as Asas\ncontato@sobasasas.com.br`,
  },
  spam: {
    palavras: ['vagra', 'cassino', 'investimento garantido', 'crypto', 'bitcoin', 'forex', 'clique aqui', 'oferta exclusiva', 'parabéns você ganhou', 'parabens voce ganhou'],
    rotulo: 'Spam — arquivar',
    rascunhoTemplate: () => null,  // sem resposta
  },
};

function gerarCorpoEspiritual(corpo) {
  // Detecta sentimentos primários e retorna fragmento de resposta acolhedor
  const c = corpo.toLowerCase();
  if (c.includes('perdi') || c.includes('luto') || c.includes('faleceu') || c.includes('morr')) {
    return 'O luto que você descreve não tem prazo. Os anjos seguram quem fica até a dor encontrar lugar de descanso. A Monica costuma indicar Sealiah (anjo da motivação e vida) pra esse momento — não pra esquecer, mas pra voltar a respirar.';
  }
  if (c.includes('depressão') || c.includes('depressao') || c.includes('triste') || c.includes('sem vontade')) {
    return 'O que você sente é real, e eu te peço com carinho: além do app, procure um terapeuta humano. Os anjos cuidam da alma, mas o corpo precisa de companhia profissional. Lelahel (anjo da luz, cura e talento) é um bom ponto de apoio espiritual nesse caminho.';
  }
  if (c.includes('namorad') || c.includes('marido') || c.includes('esposa') || c.includes('casament') || c.includes('separ') || c.includes('relacion')) {
    return 'Sobre relacionamentos, Jeliel (segundo anjo) é o regente. A oração dele, repetida com calma uma vez por dia, costuma trazer clareza sobre o que precisa ficar e o que precisa partir.';
  }
  return 'Sua dúvida é cuidada com atenção aqui.';
}

function gerarCorpoTecnico(corpo) {
  const c = corpo.toLowerCase();
  if (c.includes('código') || c.includes('codigo') || c.includes('email não chegou') || c.includes('email nao chegou')) {
    return 'Se o código de login não chegou: 1) Cheque a caixa de spam/promoções. 2) Aguarde 1-2 minutos — pode haver atraso do provedor de email. 3) Se ainda assim não chegar, me responda esse email com o endereço que você está usando, e eu confirmo aqui se está registrado.';
  }
  if (c.includes('cobrança') || c.includes('cobranca') || c.includes('cancelar') || c.includes('reembolso')) {
    return 'Pra cancelar a assinatura: dentro do app, vá em Ajustes → Sua conta → Cancelar. Você continua com acesso até o fim do período já pago. Se quiser reembolso, me responde com o motivo e a data da cobrança que eu cuido aqui — sem fricção.';
  }
  if (c.includes('paywall') || c.includes('não consegui pagar') || c.includes('nao consegui pagar') || c.includes('erro no pagamento')) {
    return 'Sobre o pagamento: o checkout do Sob as Asas é processado pelo Stripe. Se travou ali, normalmente é um aviso do banco emissor do cartão. Tente: 1) Cartão Pix se aparecer a opção. 2) Outro cartão. 3) Se persistir, me manda print do erro que eu vejo aqui.';
  }
  if (c.includes('login') || c.includes('entrar') || c.includes('senha')) {
    return 'O Sob as Asas não usa senha — só código por email. Se você não está conseguindo entrar: 1) Confirme se o email é o mesmo do cadastro. 2) Peça um novo código na tela de login. 3) Cheque spam. Se nada funcionar, eu posso resetar sua sessão manualmente — me confirma o email aqui.';
  }
  return 'Vou olhar isso agora e te respondo em até algumas horas com a solução.';
}

function detectarNome(corpo) {
  // Procura por "Sou X" ou "Me chamo X" ou "Atenciosamente, X" no fim
  const m = corpo.match(/(?:^|\n)\s*(?:atenciosamente|abraços|abraco|abraço|obrigada|obrigado|att|atc)[\s,]+([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç]+)/i);
  if (m) return m[1].split(/\s+/)[0];
  const m2 = corpo.match(/(?:sou|me chamo|meu nome é|meu nome e)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç]+)/i);
  if (m2) return m2[1];
  return '';
}

function classificar(corpo) {
  const c = (corpo || '').toLowerCase();
  const pontuacao = {};
  for (const [cat, def] of Object.entries(CATEGORIAS)) {
    pontuacao[cat] = def.palavras.filter(p => c.includes(p)).length;
  }
  const max = Math.max(...Object.values(pontuacao));
  if (max === 0) return 'espiritual';  // fallback: tom espiritual
  return Object.keys(pontuacao).find(k => pontuacao[k] === max);
}

export default async function handler(req, res) {
  if (!adminKeyValida(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' });
  if (req.method !== 'POST') return res.status(405).end();

  const { emailRecebido } = req.body || {};
  if (!emailRecebido || typeof emailRecebido !== 'string' || emailRecebido.length < 10) {
    return res.status(400).json({ ok: false, error: 'Cole o texto do email recebido (mínimo 10 caracteres).' });
  }
  if (emailRecebido.length > 8000) {
    return res.status(413).json({ ok: false, error: 'Email muito longo (>8000 chars).' });
  }

  const categoria = classificar(emailRecebido);
  const def = CATEGORIAS[categoria];
  const nome = detectarNome(emailRecebido);
  const rascunho = def.rascunhoTemplate(emailRecebido, nome);

  return res.status(200).json({
    ok: true,
    categoria,
    rotulo: def.rotulo,
    nome_detectado: nome || null,
    rascunho_resposta: rascunho,
    instrucao: rascunho ? 'Copie, ajuste se necessário, e cole no seu cliente de email (Zoho).' : 'Spam — arquive sem responder.',
  });
}
