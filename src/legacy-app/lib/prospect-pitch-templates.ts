import type { ProspectLead } from './prospect-helpers';

export function buildOriginalText(lead: ProspectLead): string {
  if (lead.category === 'Jornaleiros') {
    return `*Olá pessoal da ${lead.name}!* 👋 Tudo bem com vocês?\n\nPassando aqui pois vi que vocês vendem revistas e canetas na ${lead.address.split(',')[0]} com excelente fluxo!\n\nNós da *Gestão 3D* imprimimos *chaveiros articulados super fofos, dinossauros e mimos rápidos decorativos em impressora 3D*. O custo de revenda é baixíssimo e o sucesso com crianças e colecionadores é imediato no balcão!\n\nPodemos deixar 5 ou 10 chaveiros em consignação por 10 dias? Vocês só pagam o que vender! O que acham? Sem risco nenhum.`;
  }
  if (lead.category === 'Brinquedos') {
    return `*Olá, gerente da ${lead.name}!* 👋\n\nNós da *Gestão 3D* fabricamos *brinquedos articulados e sensoriais (Fidget Toys / Dragões Articulados Premium)* de alta fidelidade que fazem um sucesso gigantesco nas redes sociais.\n\nComo vocês são referência em presentes infantis na região, gostaríamos de oferecer nossos pacotes de atacado ou deixar peças selecionadas para demonstração. O lucro da sua loja ultrapassa 100% por peça!\n\nPodemos fazer um contato rápido esta semana no telefone *${lead.phone}*?`;
  }
  if (lead.category === 'Decoração') {
    return `*Olá, Equipe ${lead.name}!* 👋\n\nTrabalhamos com *vasos e suportes de design geométrico escandinavo impressos em 3D de alta altíssima resolução* utilizando polímeros orgânicos biodegradáveis (PLA).\n\nNossos cachepôs em cores Mármore, Granito, Cobre e Madeira da *Gestão 3D* casam perfeitamente com sua vitrine. Gostaríamos de propor uma parceria de revenda de peças premium decorativas bicolores.\n\nPodemos enviar o nosso catálogo em PDF no WhatsApp?`;
  }
  return `*Olá!* 👋 Conhecemos a *${lead.name}* e acreditamos que nossos itens colecionáveis em alta definição 3D da *Gestão 3D* (suportes gamer, bustos decorativos, e gadgets articulados) seriam um atrativo de alta margem de lucro para seus clientes na ${lead.address.split(',')[0]}.\n\nPodemos agendar uma demonstração rápida de 5 minutos?\n\nAtenciosamente, Gestão 3D`;
}

export function buildPersuasivoText(lead: ProspectLead): string {
  return `*Atenção Equipe da ${lead.name}!* 🚀\n\nVocês sabiam que produtos colecionáveis premium impressos em 3D são os maiores campeões de venda por impulso do ano, viralizando diariamente nas redes sociais? 😱\n\nNós da *Gestão 3D* desenvolvemos uma linha exclusiva e bicolores perfeitos para o balcão da sua loja. Clientes entram, veem os chaveiros articulados vibrantes, e compram sem hesitar!\n\nQueremos colocar a ${lead.name} como ponto de revenda parceiro exclusivo do seu bairro na ${lead.address.split(',')[0]}.\n\nPosso enviar fotos dos nossos modelos campeões de venda no WhatsApp? O lucro é garantido, acima de 120%! 📈⚡\n\nAtenciosamente, Gestão 3D`;
}

export function buildCurtoText(lead: ProspectLead): string {
  return `*Olá! Tudo bem?* 👋\n\nSou da *Gestão 3D* e fabricamos chaveiros articulados, brinquedos sensoriais e itens de utilidade/decoração premium em impressora 3D (PLA bicolores).\n\nIdentificamos a *${lead.name}* e acreditamos que seus clientes adorariam nossos produtos de balcão de venda rápida, gerando para vocês mais de 100% de margem líquida.\n\nPodemos mandar fotos rápidas do catálogo de revenda pelo WhatsApp? Obrigado!`;
}

export function buildConsignadoText(lead: ProspectLead): string {
  return `*Olá, pessoal da ${lead.name}!* 🤝\n\nGostaríamos de propor uma parceria de *RISCO ZERO* para vocês faturarem com impressão 3D premium da *Gestão 3D*!\n\nNós deixamos um expositor compacto com um mostruário das nossas peças mais desejadas (dragões articulados e fidget toys sensoriais) por 15 dias em consignação na sua loja na ${lead.address.split(',')[0]}.\n\nSem investir nenhum centavo: o que vocês venderem, repassam nossa comissão, e o que não for vendido nós recolhemos. Sem complicação ou risco!\n\nPodemos agendar para levar o kit teste essa semana?`;
}

export function buildRefinedText(lead: ProspectLead, customInstruction: string): string {
  const promptLower = customInstruction.toLowerCase();
  if (promptLower.includes('desconto') || promptLower.includes('barato') || promptLower.includes('promo')) {
    return `*Oportunidade Promocional: Gestão 3D & ${lead.name}!* 🎁⚡\n\nOlá equipe! Preparamos um cupom especial de *20% de DESCONTO* para o primeiro lote de atacado de chaveiros articulados e brinquedos em 3D bicolores para sua loja na ${lead.address.split(',')[0]}!\n\nAlém de ser o produto sensação do TikTok, você garante peças premium da *Gestão 3D* com margem de lucro de até 150%. Frete grátis incluso para este pedido piloto.\n\nPodemos fechar esse kit promocional no WhatsApp?`;
  }
  if (promptLower.includes('brinquedo') || promptLower.includes('criança') || promptLower.includes('infantil')) {
    return `*Olá gerente da ${lead.name}!* 🧸✨\n\nNossos brinquedos sensoriais articulados bicolores e Dragões Premium fabricados pela *Gestão 3D* são imbatíveis no público infantil e nerd.\n\nOferecemos um expositor de mesa atraente sem custo para otimizar suas vendas de impulso no caixa. Suas vendas vão disparar!\n\nPodemos fazer um contato rápido ou enviar um PDF de demonstração?`;
  }
  if (promptLower.includes('divertido') || promptLower.includes('brinc') || promptLower.includes('emoji')) {
    return `*Epaaa, pessoal da ${lead.name}!* 🤪💥 Tudo beleza por aí?\n\nSabia que as prateleiras de vocês estão precisando daquele toque mágico que as crianças piram? ✨🐉\n\nNós da *Gestão 3D* fazemos os dragões de cores mágicas mais irados da internet por impressão 3D! É colocar no balcão de vocês na ${lead.address.split(',')[0]} e ver acontecer o milagre do "quero um desse agora!" 😂\n\nBora fechar um testezinho sem complicação? Chama a gente no WhatsApp!`;
  }
  return `*Abordagem Direcionada | Gestão 3D para ${lead.name}* 🚀\n\nOlá! Focando na sua solicitação de: _"${customInstruction}"_.\n\nNós da *Gestão 3D* fabricamos colecionáveis premium bicolores, chaveiros criativos de alta demanda de revenda e organizadores úteis. Preparamos uma condição exclusiva sob medida para a sua loja na ${lead.address.split(',')[0]}.\n\nPodemos conversar 2 minutos no WhatsApp para demonstrar os modelos físicos do catálogo? Atenciosamente, Gestão 3D`;
}