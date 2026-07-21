import { SellerReport } from "./types";

// Helper to generate realistic historical sales for Recharts line/area graphs
function getCategoryPlaceholderImage(categoryId: string, index: number): string {
  const images: Record<string, string[]> = {
    suportes_parede: [
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=500", // 3D printed mechanical setup
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=500", // 3D printing nozzle
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500", // Gaming setup / controller bracket
    ],
    organizadores_gavetas: [
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=500", // Modern organized desk
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=500", // Minimalist desk shelves
    ],
    decoracao_casa: [
      "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=500", // Curved design waves
      "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80&w=500", // 3D printed cyan figurines
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=500", // Elegant modern decor vase
    ],
    brinquedos_fidget: [
      "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&q=80&w=500", // Playful colorful layout
      "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=500", // Toy/Figures
    ],
  };

  const pool = images[categoryId] || [
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=500", // 3D Printer printing PLA
    "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80&w=500", // Blue model prints
    "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=500", // Engineering PLA Gear print
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=500", // Creative wave pattern
  ];

  return pool[index % pool.length];
}

function generateHistoryData(baseSales: number) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  return months.map((month, idx) => {
    const factor = 0.75 + idx * 0.05 + Math.sin(idx) * 0.1;
    return {
      month,
      sales: Math.round(baseSales * Math.min(1.2, Math.max(0.6, factor))),
    };
  });
}

// 10 base template products for each of the 30 categories
const SEED_TEMPLATES: Record<
  string,
  Array<{
    name: string;
    desc: string;
    grams: number;
    hours: number;
    price: number;
    sales: number;
    tags: string[];
  }>
> = {
  suportes_parede: [
    {
      name: "Suporte de Parede Organizador de Cabos HDMI/USB",
      desc: "Suporte sob medida para organizar fiações de TV, monitores e carregadores de forma discreta.",
      grams: 12,
      hours: 0.5,
      price: 15.9,
      sales: 165,
      tags: ["suporte de parede", "organizador cabos", "hdmi", "shopee"],
    },
    {
      name: "Suporte de Parede para Headset Gamer Reforçado",
      desc: "Gancho curvo que apoia fones sem amassar as espumas, ideal para fixação ao lado da mesa.",
      grams: 45,
      hours: 1.5,
      price: 24.9,
      sales: 130,
      tags: ["suporte headset", "headfone", "setup gamer", "gamer"],
    },
    {
      name: "Suporte de Parede para Controles Xbox e PS5",
      desc: "Base estável dupla de bocal curvado perfeito para descansar controles com segurança.",
      grams: 40,
      hours: 1.2,
      price: 22.9,
      sales: 115,
      tags: ["suporte controle", "xbox", "ps5", "gamer"],
    },
    {
      name: "Suporte de Parede Articulado para Óculos",
      desc: "Canaleta geométrica discreta para prender óculos de sol na parede ou closet.",
      grams: 20,
      hours: 0.8,
      price: 17.9,
      sales: 95,
      tags: ["porta oculos", "sunglasses", "closet", "suporte"],
    },
    {
      name: "Suporte de Parede para Carregador de Celular",
      desc: "Base de apoio para tomadas que ampara o celular de pé enquanto ele está recarregando.",
      grams: 25,
      hours: 0.9,
      price: 18.9,
      sales: 80,
      tags: ["suporte de tomada", "celular", "carregador"],
    },
    {
      name: "Suporte de Parede para Echo Dot Alexa 4 e 5",
      desc: "Suporte sem fios aparentes, com furos para tomada integrados de fixação direta.",
      grams: 35,
      hours: 1.3,
      price: 24.9,
      sales: 75,
      tags: ["alexa", "echo dot", "suporte alexa"],
    },
    {
      name: "Suporte de Parede Organizador de Vassouras e Rodos",
      desc: "Gancho anatômico de alta resistência à tração com garra de mola embutida.",
      grams: 32,
      hours: 1.1,
      price: 19.9,
      sales: 60,
      tags: ["suporte vassoura", "rodo", "lavanderia", "casa"],
    },
    {
      name: "Suporte de Parede Invisível para Livros Flutuantes",
      desc: "Mini garras em abs que sustentam livros criando efeito flutuante decorativo.",
      grams: 25,
      hours: 0.9,
      price: 19.9,
      sales: 50,
      tags: ["livro flutuante", "decoracao", "estante"],
    },
    {
      name: "Suporte de Parede para Carregador de Carro Elétrico Tipo 2",
      desc: "Base de alta densidade reforçada para bocal e fios tipo ev veicular de garagem.",
      grams: 140,
      hours: 5.5,
      price: 79.9,
      sales: 25,
      tags: ["suporte tipo 2", "carro eletrico", "ev charger"],
    },
    {
      name: "Suporte de Parede para Roteador Mesh Intelbras Twibi",
      desc: "Apoio clean projetado sob medida para o cubo mesh ficar suspenso de forma estável.",
      grams: 30,
      hours: 1.1,
      price: 24.9,
      sales: 20,
      tags: ["mesh", "roteador", "twibi", "wifi"],
    },
  ],
  organizadores_gavetas: [
    {
      name: "Organizador Porta Moedas Comercial de Gaveta",
      desc: "Pistão calibrado separador de moedas do real para caixas registradoras.",
      grams: 95,
      hours: 3.2,
      price: 39.9,
      sales: 45,
      tags: ["moedeiro", "porta moedas", "caixa comercial"],
    },
    {
      name: "Porta Pilhas AA e AAA Alimentador Vertical",
      desc: "Dispenser que acondiciona e auto-ejeta pilhas de forma super rápida e intuitiva.",
      grams: 55,
      hours: 1.8,
      price: 29.9,
      sales: 85,
      tags: ["porta pilha", "bateria", "organizador"],
    },
    {
      name: "Organizador Colmeia Sólida para Gavetas de Meias",
      desc: "Grades rígidas de encaixas que segmentam gavetas de roupas íntimas e gravatas.",
      grams: 90,
      hours: 3.0,
      price: 44.9,
      sales: 40,
      tags: ["colmeia", "gaveta", "organizador roupas"],
    },
    {
      name: "Organizador Separador de Óculos de Escada",
      desc: "Racks de apoio onde os óculos ficam inclinados ocupando mínimo espaço.",
      grams: 70,
      hours: 2.2,
      price: 34.9,
      sales: 30,
      tags: ["expositor oculos", "oculos", "closet"],
    },
    {
      name: "Porta Cápsulas de Café Nespresso Sob-Medida",
      desc: "Gaveta organizadora horizontal para abrigar cápsulas sob a própria cafeteira.",
      grams: 140,
      hours: 5.0,
      price: 59.9,
      sales: 25,
      tags: ["nespresso", "cantinho do cafe", "capsula"],
    },
    {
      name: "Separador Divisória de Talheres Modular de Gaveta",
      desc: "Bandeja tática seccionada ajustável a panelas e gavetas de cozinha do lar.",
      grams: 130,
      hours: 4.5,
      price: 49.9,
      sales: 50,
      tags: ["talheres", "divisor talher", "cozinha"],
    },
    {
      name: "Organizador de Maquiagem e Cosméticos com Divisórias",
      desc: "Pequena bandeja de nichos projetada para batons, pincéis e pós compactos.",
      grams: 80,
      hours: 2.6,
      price: 39.9,
      sales: 65,
      tags: ["maquiagem", "penteadeira", "cosmeticos"],
    },
    {
      name: "Porta Medicamentos Diário de Gaveta Semanal",
      desc: "Gaveteiro de sete seções com escritas táteis em alto relevo para pílulas diárias.",
      grams: 40,
      hours: 1.2,
      price: 22.9,
      sales: 35,
      tags: ["porta remedio", "medicina", "remedios"],
    },
    {
      name: "Gaveteiro Oculto SOB A MESA Adesivo Organizador",
      desc: "Bandeja tática que corre em trilhos adesivos escondidos na parte de baixo do tampo.",
      grams: 110,
      hours: 3.8,
      price: 42.9,
      sales: 75,
      tags: ["gaveta oculta", "gaveta sob mesa", "secreto"],
    },
    {
      name: "Estojo Multiuso Organizador de Parafusos e Pregos",
      desc: "Seções ajustáveis transparentes excelentes para miudezas de marcenaria ou pesca.",
      grams: 75,
      hours: 2.5,
      price: 29.9,
      sales: 28,
      tags: ["estojo parafusos", "pesca", "parafusadeira"],
    },
  ],
  decoracao_casa: [
    {
      name: "Vaso Geométrico Espiral Origami Decorativo",
      desc: "Vaso de linhas facetadas dinâmicas, excelente para flores desidratadas de trigo.",
      grams: 55,
      hours: 1.8,
      price: 29.9,
      sales: 110,
      tags: ["vaso origami", "vaso geometrico", "decoracao sala"],
    },
    {
      name: "Vasinho Boneco Robert Plant Pensador Sentado",
      desc: "Famoso bonequinho decorativo do pinterest ideal para plantas suculentas.",
      grams: 22,
      hours: 0.8,
      price: 19.9,
      sales: 195,
      tags: ["robert plant", "vaso boneco", "suculenta"],
    },
    {
      name: "Escultura Poliédrica Leão Deitado Clássico",
      desc: "Estatueta imponente com silhuetas de arte facetada que dão ar executivo à mesa.",
      grams: 110,
      hours: 3.8,
      price: 49.9,
      sales: 65,
      tags: ["leao geometrico", "escultura leao", "escritorio"],
    },
    {
      name: "Cachepot Preguiça Suspensa de Corda de Sisal",
      desc: "Cachepô em formato de preguiça feliz para prender vasos pendentes em varandas.",
      grams: 38,
      hours: 1.4,
      price: 27.9,
      sales: 90,
      tags: ["preguica suspensa", "cachepo suspenso", "varanda"],
    },
    {
      name: "Placa Letreiro Welcome Home Relevo Guirlanda",
      desc: "Acessório charmoso para fechaduras e portas de entrada em relevo decorado.",
      grams: 40,
      hours: 1.2,
      price: 24.9,
      sales: 55,
      tags: ["boas vindas", "welcome home", "porta de entrada"],
    },
    {
      name: "Luminária de Mesa Ondulada Abajur Projetor",
      desc: "Feixe de curvas que difunde a light emitindo padrões aconchegantes nas paredes.",
      grams: 130,
      hours: 4.8,
      price: 69.0,
      sales: 35,
      tags: ["luminaria led", "abajur ondulado", "quarto"],
    },
    {
      name: "Escultura Gato Minimalista Geométrico Facetado",
      desc: "Lindo gato decorativo elegante em silhuetas anguladas modernas.",
      grams: 35,
      hours: 1.2,
      price: 24.9,
      sales: 80,
      tags: ["gato geometrico", "escultura gato", "felino"],
    },
    {
      name: "Porta Copos estilo Discos de Vinil Retrô",
      desc: "Kit com 6 descansos de copos redondos imitando discos com porta-discos integrador.",
      grams: 55,
      hours: 1.8,
      price: 34.9,
      sales: 85,
      tags: ["discos vinil", "porta copos retro", "cerveja"],
    },
    {
      name: "Placa Letreiro Cantinho do Café Alto Relevo",
      desc: "Finos galhos com xícaras brilhantes em relevo para colar acima da cafeteira.",
      grams: 28,
      hours: 0.9,
      price: 22.9,
      sales: 115,
      tags: ["cantinho cafe", "letreiro cafe", "cozinha"],
    },
    {
      name: "Escultura de Parede Árvore da Vida Mandála",
      desc: "Mandala vazada de cabeceira de cama que evoca harmonia espiritual de madeira ou abs.",
      grams: 70,
      hours: 2.2,
      price: 39.9,
      sales: 48,
      tags: ["arvore da vida", "mandala", "cabeceira"],
    },
  ],
  porta_objetos_suporte_mesa: [
    {
      name: "Organizador Porta Trecos Modular de Mesa Slim",
      desc: "Organizador compacto com divisórias para canetas, clipes e post-its.",
      grams: 55,
      hours: 1.8,
      price: 29.9,
      sales: 75,
      tags: ["organizador mesa", "porta treco", "home office"],
    },
    {
      name: "Suporte de Mesa para Headset e Controle Universal",
      desc: "Suporte 2 em 1 para acomodar o fone e o controle de videogame juntos.",
      grams: 85,
      hours: 2.8,
      price: 39.9,
      sales: 60,
      tags: ["suporte controle", "suporte headset", "setup gamer"],
    },
    {
      name: "Organizador Espiral Porta Voltas de Canetas",
      desc: "Porta canetas com design espiral moderno geométrico para escritório.",
      grams: 45,
      hours: 1.5,
      price: 24.9,
      sales: 55,
      tags: ["porta caneta", "escritorio", "organizador"],
    },
    {
      name: "Suporte Tripé de Mesa para Celular e Tablet",
      desc: "Suporte ajustável ideal para chamadas de vídeo e ler receitas na cozinha.",
      grams: 22,
      hours: 0.8,
      price: 19.9,
      sales: 95,
      tags: ["suporte celular", "tripe", "tablet"],
    },
    {
      name: "Porta Cartões de Visita Executivo Facetado",
      desc: "Design poligonal premium que valoriza o balcão da sua recepção.",
      grams: 20,
      hours: 0.7,
      price: 19.9,
      sales: 40,
      tags: ["porta cartao", "escritorio", "recepcao"],
    },
    {
      name: "Suporte Ergonômico de Mesa para Notebook Elevado",
      desc: "Apara o notebook inclinando o teclado para melhor postura e ventilação.",
      grams: 110,
      hours: 3.5,
      price: 44.9,
      sales: 65,
      tags: ["suporte notebook", "ergonomia", "home office"],
    },
    {
      name: "Organizador de Maquiagem e Batons Giratório",
      desc: "Bandeja compacta com diversos separadores para rímel, pincel e batom.",
      grams: 70,
      hours: 2.2,
      price: 32.9,
      sales: 48,
      tags: ["organizador batom", "maquiagem", "quarto"],
    },
    {
      name: "Porta Chaves de Mesa Magnético com Bandeja",
      desc: "Bandeja porta objetos com íman embutido para prender chaveiros.",
      grams: 65,
      hours: 2.0,
      price: 29.9,
      sales: 42,
      tags: ["porta chaves", "chaveiro", "decoracao"],
    },
    {
      name: "Suporte de Mesa Dock Station Organizador",
      desc: "Espaço dedicado para celular, carteira, relógio e moedas de forma clean.",
      grams: 95,
      hours: 3.2,
      price: 49.9,
      sales: 32,
      tags: ["dock station", "organizador masculino", "quarto"],
    },
    {
      name: "Porta Copos Modular de Mesa Geek com Suporte",
      desc: "Suporte moderno de mesa com 4 descansos de copo temáticos hexagonais.",
      grams: 55,
      hours: 1.8,
      price: 29.9,
      sales: 45,
      tags: ["porta copos", "geek", "mesa", "cozinha"],
    },
  ],
  brinquedos_fidget: [
    {
      name: "Dragão Articulado de Cristal Impresso em 3D",
      desc: "Dragão articulado with movimentos fluídos, excelente peça de fidget ou decoração.",
      grams: 85,
      hours: 3.8,
      price: 49.9,
      sales: 250,
      tags: ["dragao articulado", "fidget toy", "dragao 3d", "articulado"],
    },
    {
      name: "Lagartixa Articulada de Parede e Mesa Realista",
      desc: "Mascote simpático totalmente articulado e maleável de alta precisão.",
      grams: 25,
      hours: 0.9,
      price: 22.9,
      sales: 170,
      tags: ["lagartixa", "articulado", "fidget", "brinquedo"],
    },
    {
      name: "Polvo do Humor Articulado Fidget Expressivo",
      desc: "Polvo maleável com tentáculos soltos que acalma e diverte crianças e adultos.",
      grams: 35,
      hours: 1.2,
      price: 24.9,
      sales: 185,
      tags: ["polvo articulado", "polvo humor", "fidget toy"],
    },
    {
      name: "Fidget Cube Spinner Mecânico de Engrenagens",
      desc: "Cubo com engrenagens giratórias interligadas que aliviam o estresse.",
      grams: 40,
      hours: 1.4,
      price: 29.9,
      sales: 160,
      tags: ["fidget cube", "engrenagens", "anti estresse"],
    },
    {
      name: "Brinquedo Slug Lagarta Articulada Fidget Colorida",
      desc: "Lagarta que emite um som tátil satisfatório ao mexer, mania nas redes.",
      grams: 30,
      hours: 1.0,
      price: 22.9,
      sales: 230,
      tags: ["slug", "lagarta articulada", "asmr", "fidget"],
    },
    {
      name: "Tubarão Articulado Flexível de Ataque",
      desc: "Brinquedo de tubarão flexível com dentes arredondados e cauda móvel.",
      grams: 45,
      hours: 1.5,
      price: 27.9,
      sales: 110,
      tags: ["tubarao", "articulado", "fidget toy", "marinho"],
    },
    {
      name: "Fidget Anti-Estresse Infinity Cube Infinito",
      desc: "Cubo mágico articulado que pode ser dobrado infinitamente sobre si mesmo.",
      grams: 25,
      hours: 0.8,
      price: 19.9,
      sales: 125,
      tags: ["infinity cube", "fidget", "anti estresse"],
    },
    {
      name: "Dinossauro Rex T-Rex Flexível com Mandíbula",
      desc: "T-rex articulado que abre a boca e move o rabo em movimentos realistas.",
      grams: 65,
      hours: 2.2,
      price: 39.9,
      sales: 100,
      tags: ["dinossauro", "t-rex", "articulado", "flexivel"],
    },
    {
      name: "Borboleta de Treino Balisong Articulada Segura",
      desc: "Butterfly de plástico não cortante excelente para treinar movimentos com segurança.",
      grams: 28,
      hours: 0.9,
      price: 24.9,
      sales: 80,
      tags: ["borboleta", "balisong", "treino", "fidget"],
    },
    {
      name: "Lagartixa de Cristal Flexível Brilhante",
      desc: "Peça articulada geométrica que reflete luz de forma incrível com PLA silk.",
      grams: 30,
      hours: 1.1,
      price: 24.9,
      sales: 65,
      tags: ["lagartixa cristal", "articulado", "fidget", "toys"],
    },
  ],
};

// Generates secondary categories based on procedural definitions when they aren't explicitly inside SEED_TEMPLATES
const COMPACT_NAMES: Record<string, string[]> = {
  acessorios_pets: [
    "Comedouro Lento Tigela Orgânica",
    "Suporte de Coleiras Osso de Parede",
    "Porta Saquinhos Higiênicos Petiscos",
    "Identificador de Coleira Nome e Telefone",
    "Brinquedo Dispenser Interativo de Ração",
    "Suporte Bebedouro de Garrafa Pet",
    "Pente Escova Tira-Pelos Macia",
    "Comedouro Elevado Ergonômico de Mesa",
    "Labirinto Interativo de Gatos",
    "Escada Pet Auxiliar de Sofá",
  ],
  acessorios_aquario: [
    "Alimentador Dosador Peixes de Férias",
    "Suporte Limpador Aquapaisagismo Vidro",
    "Gruta de Esconderijo Camarões e Peixes",
    "Suporte Lateral Guia Luminária LED",
    "Clipe Assento Tampa Vidro Aquário",
    "Fixador Porta Mangueiras TPA Balde",
    "Divisória Interna de Filtragem Sump",
    "Anel Flutuante Alimentador de Flocos",
    "Grelha Protetora de Alevinos Cano",
    "Decoração Naufrágio Articulado Submerso",
  ],
  jardim_plantas: [
    "Vaso Auto-Irrigável Inteligente",
    "Marcador de Planta Horta Lote 10un",
    "Suporte de Vaso Parede Colmeia",
    "Regador de Plantas Bico Longo FDM",
    "Prato Coletor Hidropônico Anti-Dengue",
    "Mini Estufa Germinação Brotadores",
    "Treliça Modular Planta Trepadeira",
    "Suporte Enrolador Mangueira Parede",
    "Prateleira Mini Suculentas Estrela",
    "Cachepot Vasinho Cabeça de Gatinho",
  ],
  organizacao_cozinha: [
    "Suporte de Parede Rolos Panos 3em1",
    "Organizador de Temperos Giratório Desk",
    "Porta Copos Canecas Suspenso Armário",
    "Organizador Vertical Tampas de Panela",
    "Filtro Peneira Pia Anti-Entupimento",
    "Porta Esponja Pia Escoamento Automático",
    "Suporte Filtro de Café Cônico V60",
    "Organizador Talheres Gaveta Compacto",
    "Clipes Presilhas Fecha Saco Lote 10un",
    "Suporte de Parede Magnético de Facas",
  ],
  games_geek: [
    "Suporte Controle Gamer Playstation Xbox",
    "Torre Porta Jogos CD DVD Organizador",
    "Porta Cartuchos Nintendo Switch Block",
    "Luminária LED Pixel Fantasma Retro",
    "Expositor Miniaturas Bonecos Escada",
    "Porta Canetas Darth Vader Star Wars",
    "Suporte de Parede Console Playstation 5",
    "Torre Headset Headphone Gamer Mesa",
    "Organizador Cubo Porta Copos Portal",
    "Estojo Compacto Cartões MicroSD e SD",
  ],
  chaveiros_personalizados: [
    "Chaveiro Abridor Garrafas Reforçado",
    "Chaveiro Letra Inicial Nome 3D",
    "Chaveiro Placa de Carro Customizado",
    "Chaveiro Mosquetão Tático de Cinto",
    "Chaveiro QR Code PIX Prático",
    "Chaveiro Silhueta Patinha Pet Cachorro",
    "Chaveiro Coração Lote Lembrancinhas",
    "Chaveiro Brinde Logotipo Empresa Lote",
    "Chaveiro Mini Ferramentas Articulado",
    "Chaveiro Porta Moeda Carrinho Supermercado",
  ],
  paineis_led_luminaria: [
    "Luminária LED Letreiro Nome Customizada",
    "Base Adaptadora Difusora Fita LED",
    "Luminária Parede Protetora de Sombras",
    "Abajur Abóbada Facetado Lux Quarto",
    "Luminária Geek Canhão Luz Temático",
    "Suporte Spot LED Adaptador Gesso",
    "Canopla Redonda Lustre Pendente Mesa",
    "Luminária de Mesa Ondas do Mar Moderno",
    "Mini Arandela Modular Dobradora",
    "Luminária Cubo Vazado Luz Conforto",
  ],
  moda_acessorios: [
    "Cabide Organizador de Cintos Gavetas",
    "Expositor Porta Brincos Geométrico",
    "Display Organizador de Anéis Dedos",
    "Presilha Garra de Cabelo Estilizada",
    "Fivela de Cinto Design Geométrico",
    "Gaveteiro Porta Joias com Divisórias",
    "Expositor Relógios e Pulseiras Mesa",
    "Suporte Óculos Escada Organizador Closet",
    "Gancho Cabideiro Solitário Casaco",
    "Fivela Decorativa de Sapato Custom",
  ],
  organizacao_escritorio: [
    "Porta Canetas Lápis Espiral Moderno",
    "Aparador Organizador de Livros Mesa",
    "Organizador Multifuncional Slim Desk",
    "Suporte Elevador Monitor Ergonômico",
    "Porta Cartão de Visitas Recepção Lux",
    "Canaleta Guarda Fios sob Escrivaninha",
    "Suporte Organizador Correspondências Cartas",
    "Organizador Gaveta Fitas e Clipes",
    "Apoio de Pulso Ergonômico Teclado",
    "Dock Station Organizadora Celular Relógio",
  ],
  acessorios_carro: [
    "Suporte Celular Saída Ar Automotivo",
    "Lixeira de Câmbio Carro Compacta",
    "Organizador Console Central de Cabine",
    "Gancho Encosto Cabeça Cabideiro Carro",
    "Clipe Porta Óculos de Sol Quebra-sol",
    "Suporte Carregador GPS Painel Carro",
    "Porta Copos Adaptador Console Central",
    "Presilha Fixadora de Tapete Automotivo",
    "Suporte Organizador Divisórias Porta-malas",
    "Capa Prática de Parafuso Sapata Roda",
  ],
  instrumentos_musica: [
    "Suporte de Parede Violão Guitarra Apoio",
    "Porta Palhetas Clave de Sol de Mesa",
    "Suporte Expositor Flauta Doce Sopros",
    "Suporte Partituras Presilha Pedestal",
    "Apoio Clamp Microfone de Instrumento",
    "Enrolador Rápido de Cordas Violão",
    "Presilha Organizadora Cabos Pedalboard",
    "Suporte Mesa Afinador e Capotraste",
    "Suporte Parede Violino Reforçado",
    "Apoio Ergonômico Braço de Violoncelo",
  ],
  miniaturas_rpg: [
    "Torre de Dados Castelo Medieval Dice",
    "Miniatura Paladino Guerreiro Humano 28mm",
    "Expositor Miniaturas Prateleira Vidro",
    "Miniatura Dragão Alado RPG Estatua 3D",
    "Organizador Counters Fichas RPG Box",
    "Miniatura Mago Arcano Clássico Feitiço",
    "Caixa Porta Dados Dice Box Magnética",
    "Grid Tabuleiro Encaixes Arena Dungeon",
    "Miniatura Goblin Arqueiro Selva Mini",
    "Kit Terrenos Masmorra Modular Placas",
  ],
  esportes_academia: [
    "Gancho de Parede Expositor de Skate",
    "Suporte Garrafa Caramanhola Bicicleta",
    "Suporte Expositor de Medalhas Corrida",
    "Presilha Barra de Pesos Olímpica Par",
    "Suporte Bola Basquete Futebol Parede",
    "Expositor Gancho Parede Patinete",
    "Porta Giz Magnético Crossfit Ginásio",
    "Suporte Parede Raquetes Beach Tennis",
    "Fivela Presilha Cadarço Performance",
    "Suporte Ciclocomputador Guidão Bicicleta",
  ],
  ferramentas_uso_geral: [
    "Gabarito Cavilha Ajustável Carpintaria",
    "Suporte Organizador Chaves Allen Cabeça",
    "Suporte Fixador de Furadeira de Mesa",
    "Guia Perfuração Angular de Precisão",
    "Organizador de Brocas Helicoidais Caixa",
    "Compasso de Risco Carpintaria Sólido",
    "Calibrador Diâmetro Brocas Parafusos",
    "Gabarito Curvas Francesas Desenho Tec",
    "Suporte Gancho de Alicates Pegboard",
    "Alça de Transporte Balde Sólido Garra",
  ],
  produtos_infantis: [
    "Protetor Quinas de Mesa Macio Lote",
    "Trava de Segurança de Gavetas Berço",
    "Cortador Biscoito Animais Animados",
    "Puxador Gaveta Quarto Nuvem Estrela",
    "Mini Chocalho Sensorial Didático Bebe",
    "Suporte Porta Mamadeira Berço Grade",
    "Organizador de Lápis Dino Sorridente",
    "Placa Porta Quarto Nome Infantil Lux",
    "Extensor de Torneira Bichinho Lavar Mão",
    "Jogo de Argolas Encaixe Educativo",
  ],
  flores_arte_decorativa: [
    "Vaso Colunar Espiral Geométrico Flores",
    "Quadro Vazado Silhueta Folha Parede",
    "Cachepot Poligonal Facetado Suculenta",
    "Suporte Prato Expositor Clássico Mesa",
    "Vaso Trançado Rattan Estilo Cesta",
    "Escultura de Parede Pássaros Voando",
    "Vaso Geométrico Bolhas de Mesa Redondo",
    "Quadro Escultura Árvore Bonsai 3D",
    "Vasinho de Parede Tipo Meia Lua",
    "Porta Guardanapo Design Flor de Lótus",
  ],
  cosplay_fantasia: [
    "Máscara Kitsune Raposa Kabuki Japão",
    "Elmo Protetor Realista Espartano",
    "Réplica Estrela Ninja Naruto Shuriken",
    "Suporte Expositor Espada Katana Apoio",
    "Máscara Cyborg Cyberpunk Futurista Tech",
    "Réplica Varinha Mágica Feiticeiro Film",
    "Coroa Tiara Geométrica Ajustável Rei",
    "Chifres de Malévola Tiara Arco Cabeça",
    "Fivela Cinto Steampunk Retro Engrenagem",
    "Tiara Elfa Medieval Trançada Silk",
  ],
  cases_eletronica: [
    "Case Caixa Protetora Raspberry Pi 4",
    "Suporte Adaptador HD SSD 2.5 p/ 3.5",
    "Organizador Case Bateria 18650 Caixa",
    "Case Tampa Placa Arduino Uno Pro",
    "Organizador Porta Cartão SD e MicroSD",
    "Suporte Organizador Cabo de Rede TI",
    "Protetor Guia Fio Carregador Laptop",
    "Suporte Parede Roteador Wi-Fi Mesh",
    "Suporte Trilho Organizador Rack TI",
    "Case Placa Ensaio Protoboard Tampa",
  ],
  presentes_personalizados: [
    "Luminária Foto Lithophane Coração Luz",
    "Porta Retrato Calendário Eterno Mesa",
    "Letreiro Nome Sob Medida Custom Lux",
    "Cubo Decisão Conselheiro Escritório",
    "Troféu Campeão Customizável Base",
    "Caixa Secreta Puzzle Box Mecânica",
    "Estatueta Casal Abraço Silhueta Amor",
    "Chaveiro Letra Nome Inicial 3D Custom",
    "Porta Canetas Container Retro Industrial",
    "Placa Música Spotify Capa Acrílico FDM",
  ],
  datas_comemorativas: [
    "Coelho Páscoa Porta Chocolate Ovo Mini",
    "Árvore de Natal Desmontável de Mesa",
    "Enfeite Coração Dia dos Namorados Luz",
    "Molde Cortador Caveira Halloween Dia",
    "Abóbora Halloween Porta Velas Vela Mini",
    "Presépio Natal Silhueta Sagrada Presépio",
    "Guirlanda Decorativa de Porta Feliz Natal",
    "Pote Doces Fantasma Halloween Lindo",
    "Placa Dia das Mães Coração Relevo Vovó",
    "Cartão Dia dos Pais Funcional Letreiro",
  ],
  copos_utilidades_mesa: [
    "Organizador Copos Descartáveis Tubo Parede",
    "Porta Copos Hexagonal Colmeia Lux Cozinha",
    "Bandeja Servir Café Alça Robusta Madeira",
    "Suporte Suspenso Canecas Prateleira Cozinha",
    "Espremedor Limão Manual Alta Alavanca",
    "Descanso Panela Espiral Silicone/PLA",
    "Marcador Copos Identificador Clipes Copas",
    "Porta Guardanapo Linha Ondas Dobras",
    "Anel Coletor Anti Gotas Garrafas Vinho",
    "Tigela Saladeira Geométrica Relevo Salda",
  ],
  suportes_oficina: [
    "Porta Chaves de Fenda Organizador Trilho",
    "Painel Organizador Pegboard Suportes Ganchos",
    "Suporte Gancho Alicates Garagem Parede",
    "Mini Organizador Gavetas Parafusos Brocas",
    "Suporte Calibrador Separador Brocas Drill",
    "Guia Perfuração e Alinhamento Régua Nivel",
    "Suporte Estilo Jacaré Soldagem Apoio Duplo",
    "Porta Rola Fita Crepe Dispenser Corta",
    "Suporte Soprador Térmico Sopradores Mesa",
    "Suporte Baterias Furadeira Lote 4un Wall",
  ],
  acessorios_celular: [
    "Suporte Celular Retro Estilo Monitor PC",
    "Suporte Tripé Articulado Dobrável Desk",
    "Mini Organizador Fone de Ouvido Case Caixa",
    "Protetor Guia Fio Cabo Carregador Sapato",
    "Suporte Celular Mesa Preguiça Pescoço Cama",
    "Amplificador Som Acústico Passivo Cornet",
    "Suporte Parede Celular Lado Tomada Encaix",
    "Suporte Dock Station Carregador Switch Joy",
    "Suporte Veicular Encaixe Grelha Ar Grade",
    "Anel Adesivo Traseiro Celulares Lote Mão",
  ],
  organizadores_cabos: [
    "Clipe Organizador Cabos de Mesa Lote 5un",
    "Canaleta Organizadora Fios sob Mesa Trilho",
    "Suporte Parede Carregadores Bocal Engatar",
    "Espiral Organizador Protetor de Fios Lote",
    "Guia Cabo Magnético Desk Slim Presilhas",
    "Organizador Fios Eletrodomésticos Cozinha",
    "Suporte Enrolador Cabo Cabo Elétrico Parede",
    "Suporte Tomada Apoio Adaptador Parede Tomi",
    "Clipe Organizador Coluna Mesa Trilhos Linha",
    "Abraçadeira Flexível Plástico Presilhas 10un",
  ],
  esculturas_colecionáveis: [
    "Estatueta Pantera Negra Facetada Arte",
    "Busto Clássico Escultura Grega David Lux",
    "Crânio Humano Realista Caveira Halloween",
    "Escultura Parede Águia Alada Voando Ar",
    "Réplica Estátua Pensador Polígono Arte",
    "Escultura Astronauta Lua Quarto Mini Estatu",
    "Estatueta Buda Feliz Meditando Zen Altar",
    "Escultura Gato da Sorte Sólido Maneki Neko",
    "Miniatura Dinossauro Esqueleto T-Rex Fóssil",
    "Escultura Casal Abraço Amor Infinito Toque",
  ],
};

interface CatSpec {
  minGrams: number;
  maxGrams: number;
  minHours: number;
  maxHours: number;
  minPrice: number;
  maxPrice: number;
  minSales: number;
  maxSales: number;
}

const CATEGORY_SPECS: Record<string, CatSpec> = {
  chaveiros_personalizados: {
    minGrams: 5,
    maxGrams: 12,
    minHours: 0.3,
    maxHours: 0.7,
    minPrice: 12.9,
    maxPrice: 24.9,
    minSales: 50,
    maxSales: 200,
  },
  organizadores_cabos: {
    minGrams: 8,
    maxGrams: 22,
    minHours: 0.4,
    maxHours: 1.1,
    minPrice: 14.9,
    maxPrice: 29.9,
    minSales: 40,
    maxSales: 160,
  },
  acessorios_celular: {
    minGrams: 12,
    maxGrams: 35,
    minHours: 0.6,
    maxHours: 1.8,
    minPrice: 16.9,
    maxPrice: 34.9,
    minSales: 35,
    maxSales: 140,
  },
  miniaturas_rpg: {
    minGrams: 6,
    maxGrams: 20,
    minHours: 0.5,
    maxHours: 2.0,
    minPrice: 15.9,
    maxPrice: 42.9,
    minSales: 25,
    maxSales: 100,
  },
  produtos_infantis: {
    minGrams: 10,
    maxGrams: 30,
    minHours: 0.5,
    maxHours: 1.5,
    minPrice: 14.9,
    maxPrice: 29.9,
    minSales: 30,
    maxSales: 120,
  },
  cases_eletronica: {
    minGrams: 20,
    maxGrams: 55,
    minHours: 1.0,
    maxHours: 3.2,
    minPrice: 19.9,
    maxPrice: 49.9,
    minSales: 20,
    maxSales: 70,
  },
  acessorios_carro: {
    minGrams: 15,
    maxGrams: 45,
    minHours: 0.8,
    maxHours: 2.5,
    minPrice: 18.9,
    maxPrice: 44.9,
    minSales: 20,
    maxSales: 80,
  },
  organizacao_cozinha: {
    minGrams: 25,
    maxGrams: 90,
    minHours: 1.2,
    maxHours: 4.5,
    minPrice: 19.9,
    maxPrice: 59.9,
    minSales: 20,
    maxSales: 75,
  },
  acessorios_pets: {
    minGrams: 15,
    maxGrams: 110,
    minHours: 0.8,
    maxHours: 5.5,
    minPrice: 19.9,
    maxPrice: 69.9,
    minSales: 15,
    maxSales: 85,
  },
  acessorios_aquario: {
    minGrams: 20,
    maxGrams: 75,
    minHours: 1.0,
    maxHours: 3.8,
    minPrice: 18.9,
    maxPrice: 49.9,
    minSales: 15,
    maxSales: 60,
  },
  jardim_plantas: {
    minGrams: 15,
    maxGrams: 95,
    minHours: 0.8,
    maxHours: 4.8,
    minPrice: 16.9,
    maxPrice: 54.9,
    minSales: 20,
    maxSales: 95,
  },
  games_geek: {
    minGrams: 40,
    maxGrams: 170,
    minHours: 2.0,
    maxHours: 7.5,
    minPrice: 24.9,
    maxPrice: 79.9,
    minSales: 20,
    maxSales: 85,
  },
  paineis_led_luminaria: {
    minGrams: 80,
    maxGrams: 250,
    minHours: 4.0,
    maxHours: 11.5,
    minPrice: 49.9,
    maxPrice: 119.9,
    minSales: 10,
    maxSales: 50,
  },
  moda_acessorios: {
    minGrams: 20,
    maxGrams: 85,
    minHours: 1.0,
    maxHours: 4.2,
    minPrice: 16.9,
    maxPrice: 49.9,
    minSales: 15,
    maxSales: 65,
  },
  organizacao_escritorio: {
    minGrams: 35,
    maxGrams: 140,
    minHours: 1.8,
    maxHours: 6.5,
    minPrice: 22.9,
    maxPrice: 69.9,
    minSales: 15,
    maxSales: 75,
  },
  instrumentos_musica: {
    minGrams: 18,
    maxGrams: 70,
    minHours: 1.0,
    maxHours: 3.5,
    minPrice: 16.9,
    maxPrice: 49.9,
    minSales: 15,
    maxSales: 55,
  },
  esportes_academia: {
    minGrams: 25,
    maxGrams: 85,
    minHours: 1.2,
    maxHours: 4.2,
    minPrice: 18.9,
    maxPrice: 54.9,
    minSales: 10,
    maxSales: 50,
  },
  ferramentas_uso_geral: {
    minGrams: 30,
    maxGrams: 110,
    minHours: 1.5,
    maxHours: 5.5,
    minPrice: 19.9,
    maxPrice: 59.9,
    minSales: 10,
    maxSales: 45,
  },
  flores_arte_decorativa: {
    minGrams: 30,
    maxGrams: 120,
    minHours: 1.5,
    maxHours: 5.8,
    minPrice: 19.9,
    maxPrice: 59.9,
    minSales: 15,
    maxSales: 65,
  },
  cosplay_fantasia: {
    minGrams: 40,
    maxGrams: 200,
    minHours: 2.2,
    maxHours: 8.5,
    minPrice: 29.9,
    maxPrice: 99.9,
    minSales: 10,
    maxSales: 40,
  },
  presentes_personalizados: {
    minGrams: 35,
    maxGrams: 150,
    minHours: 1.8,
    maxHours: 7.5,
    minPrice: 24.9,
    maxPrice: 99.9,
    minSales: 10,
    maxSales: 50,
  },
  datas_comemorativas: {
    minGrams: 20,
    maxGrams: 110,
    minHours: 1.2,
    maxHours: 5.5,
    minPrice: 16.9,
    maxPrice: 54.9,
    minSales: 15,
    maxSales: 110,
  },
  copos_utilidades_mesa: {
    minGrams: 12,
    maxGrams: 60,
    minHours: 0.8,
    maxHours: 3.2,
    minPrice: 14.9,
    maxPrice: 39.9,
    minSales: 15,
    maxSales: 75,
  },
  suportes_oficina: {
    minGrams: 35,
    maxGrams: 125,
    minHours: 1.8,
    maxHours: 5.8,
    minPrice: 22.95,
    maxPrice: 59.9,
    minSales: 10,
    maxSales: 50,
  },
  esculturas_colecionáveis: {
    minGrams: 45,
    maxGrams: 180,
    minHours: 2.5,
    maxHours: 8.5,
    minPrice: 29.9,
    maxPrice: 99.9,
    minSales: 12,
    maxSales: 55,
  },
};

function getTemplatesForCategory(categoryId: string) {
  if (SEED_TEMPLATES[categoryId]) {
    return SEED_TEMPLATES[categoryId];
  }

  // Clean translation name for logging
  const displayCategory = categoryId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Dynamic list of 10 items for the other categories
  const names = COMPACT_NAMES[categoryId] || [
    "Organizador Sólido de Mesa",
    "Suporte Reforçado de Peça",
    "Kit Inteligente de Utilidade",
    "Porta Objetos Clean",
    "Acessório Ergonômico de Mesa",
    "Miniatura Colecionável FDM",
    "Suporte Fixador Adesivo",
    "Expositor Moderno de Vitrine",
    "Organizador Compacto de Viagem",
    "Lembrança Especial Personalizada",
  ];

  const spec = CATEGORY_SPECS[categoryId] || {
    minGrams: 25,
    maxGrams: 150,
    minHours: 1.2,
    maxHours: 6.0,
    minPrice: 18.0,
    maxPrice: 65.0,
    minSales: 300,
    maxSales: 1500,
  };

  return names.map((name, idx) => {
    const wordKey = name.split(" ").pop() || "item";
    const t = idx / 9; // 0.0 to 1.0 linear step for 10 items

    const grams = Math.round(spec.minGrams + t * (spec.maxGrams - spec.minGrams));
    const hours = parseFloat((spec.minHours + t * (spec.maxHours - spec.minHours)).toFixed(1));
    const price = parseFloat((spec.minPrice + t * (spec.maxPrice - spec.minPrice)).toFixed(2));
    // Smaller/cheaper items should have significantly higher sales
    const sales = Math.round(spec.maxSales - t * (spec.maxSales - spec.minSales));

    return {
      name: name.includes("Modelo")
        ? name
        : `${name} Modelo ${String.fromCharCode(65 + idx)}0${idx + 1}`,
      desc: `Desenvolvido com polímeros premium para excelente acabamento e alta robustez da linha ${displayCategory}.`,
      grams,
      hours,
      price,
      sales,
      tags: [categoryId, "utilidade", "impressao3d", wordKey.toLowerCase()],
    };
  });
}

// Generates tailored product names & descriptions based on category and index to ensure extreme variety and solve different problems
function getTailoredProductVariant(
  base: {
    name: string;
    desc: string;
    grams: number;
    hours: number;
    price: number;
    sales: number;
    tags: string[];
  },
  variantIndex: number,
  categoryId: string,
  i: number,
) {
  const baseName = base.name;
  const lowBase = baseName.toLowerCase();

  let name = baseName;
  let desc = base.desc;
  let gramsMult = 1.0;
  let hoursMult = 1.0;
  let priceMult = 1.0;
  let salesMult = 1.0;
  let trend = "Crescendo";

  const trends = [
    "Crescendo",
    "Explodindo",
    "Crescendo",
    "Explodindo",
    "Estável",
    "Crescendo",
    "Explodindo",
    "Estável",
    "Crescendo",
    "Explodindo",
  ];
  trend = trends[variantIndex % trends.length];

  // Specific scales for multipliers based on variants types
  const multipliers = [
    { g: 1.0, h: 1.0, p: 1.0, s: 1.1 }, // 0: Principal
    { g: 1.35, h: 1.3, p: 1.35, s: 0.8 }, // 1: Reforçado / Extra forte
    { g: 0.7, h: 0.75, p: 0.8, s: 1.2 }, // 2: Slim / Portátil
    { g: 1.85, h: 1.75, p: 1.7, s: 1.35 }, // 3: Combo / Kit Econômico
    { g: 0.9, h: 0.9, p: 1.0, s: 1.05 }, // 4: Adesivo / Sem furos / Magnético
    { g: 1.2, h: 1.25, p: 1.2, s: 0.9 }, // 5: Modular / Encaixável
    { g: 1.1, h: 1.1, p: 1.15, s: 1.15 }, // 6: Stand / De Mesa (ou parede)
    { g: 0.65, h: 0.7, p: 0.75, s: 1.3 }, // 7: Compacto / Viagem
    { g: 1.15, h: 1.15, p: 1.25, s: 0.7 }, // 8: Especial / Temático / Luxo
    { g: 1.05, h: 1.05, p: 1.1, s: 1.1 }, // 9: Ajustável / Universal
  ];

  const m = multipliers[variantIndex % multipliers.length];
  gramsMult = m.g;
  hoursMult = m.h;
  priceMult = m.p;
  salesMult = m.s;

  // Let's implement beautiful customized names and descriptions for specific items!

  // SUPPORT DE PAREDE ORGANIZADOR DE CABOS HDMI/USB
  if (lowBase.includes("organizador de cabos hdmi/usb") || lowBase.includes("cabos hdmi")) {
    const titles = [
      "Suporte de Parede Organizador de Cabos HDMI/USB Standard",
      "Calha de Fiação de Mesa Reforçada para Réguas de Tomadas Pesadas",
      "Organizador de Cabos de Mesa Slim 5 Vias Compacto",
      "Kit Organizador de Cabos e Fios Invisível sob Mesa (4 unid)",
      "Presilha Adesiva Organizadora de Cabos de Monitor e Cabeceira",
      "Organizador de Cabos Modular Snap-on para Pés de Mesa e Cadeiras",
      "Organizador de Cabos de Rede e USB para Home Office e Smart TV",
      "Suporte Enrolador de Parede para Extensões e Fios de Alta Espessura",
      "Trilho Organizador de Cabos de Alimentação de Embutir",
      "Organizador de Cabos Estilo Geek Hollow de Parede Decorativo",
    ];
    const descs = [
      "Suporte sob medida para organizar fiações de TV, monitores e carregadores de forma discreta na parede.",
      "Estrutura rígida de engenharia para amparar filtros de linha, fontes e cabos pesados sob tampos de escritório.",
      "Presilhas estreitas de fácil encaixe para deixar cabos carregadores USB sempre ao seu alcance na cabeceira.",
      "Pacote de organizadores rápidos com encaixe sob trilho adesivo, liberando espaço de trabalho do desktop.",
      "Fixação ultra durável com fita dupla face inclusa para fixar fiações em molduras de monitores.",
      "Garras circulares de plástico flexível de alta resistência que prendem e acompanham estruturas de tubos.",
      "Organizador amplo indicado para fiações elétricas, cabos ethernet RJ45 e setups gamer avançados.",
      "Gancho robusto resistente para armazenar cabos pesados de oficinas, garagens e ferramentas elétricas.",
      "Trilho horizontal de encaixe de pressão perfeito para canalizar fios de eletrônicos em estantes e estúdios.",
      "Organizador decorativo estilizado de alta estética que resolve o problema visual de cabos na parede.",
    ];
    name = titles[variantIndex];
    desc = descs[variantIndex];
  }

  // SUPORTE DE PAREDE PARA HEADSET GAMER REFORÇO
  else if (
    lowBase.includes("suporte de parede para headset") ||
    lowBase.includes("headset gamer")
  ) {
    const titles = [
      "Suporte de Parede para Headset Gamer Reforçado Universal",
      "Haste Metalizada Reforçada para Fone sob a Mesa com Parafusos",
      "Suporte Slim Lateral de Monitor para Fone de Ouvido e Cabos",
      "Suporte Duplo de Parede para Dois Headsets Gamer",
      "Gancho Adesivo de Parede para Fone de Ouvido de Alta Resistência",
      "Suporte Modular de Fone de Ouvido para Painel Canaletado",
      "Suporte de Headphone de Mesa Estilo Torre de Comando Alta",
      "Gancho de Fone Portátil para Lateral de Mesa com Garra Ajustável",
      "Suporte Headset Linha Hexagonal Geek com Base Estilizada",
      "Suporte de Fone de Parede Articulado 180° com Trava",
    ];
    const descs = [
      "Gancho curvo que apoia fones e headsets sem amassar as espumas de isolamento tático.",
      "Fixação rígida e aparafusada sob tampos de madeira, projetado para durar de forma invisível.",
      "Clipe leve e maleável para prender fones de ouvido de forma direta no topo do seu monitor de PC.",
      "Apoio alongado de parede ideal para casais gamers que desejam arrumar dois controles/fones na mesma base.",
      "Suporte prático adesivo sem furos, utilizando fita adesiva original para fixar em paredes sem danificar o acabamento.",
      "Encaixe de alta precisão perfeito para expor e vender headphones em stands comerciais de madeira.",
      "Torre moderna de mesa estável que serve como peça de atração no setup, antiderrapante.",
      "Grampo de pressão portátil para apoiar fones em tampos móveis sem necessidade de furos ou colas.",
      "Design de luxo futurista facetado de alta decoração mecânica perfeito para home offices exigentes.",
      "A haste de descanso recolhe rente à parede quando o fone não está posicionado, economizando espaço.",
    ];
    name = titles[variantIndex];
    desc = descs[variantIndex];
  }

  // PORTA PILHAS AA E AAA ALIMENTADOR VERTICAL
  else if (lowBase.includes("porta pilhas") || lowBase.includes("pilhas aa e aaa")) {
    const titles = [
      "Dispenser de Pilhas AA por Gravidade Alimentador Vertical (15 un)",
      "Estojo Rígido de Oficina para Carregador de Baterias 18650",
      "Estojo Porta-Pilhas AA e AAA Slim de Bolso com Tampa Deslizante",
      "Dispenser de Pilhas AAA de Parede Adesivo Sem Furos (20 un)",
      "Organizador de Baterias de Moeda CR2032 e Baterias de Placa-Mãe",
      "Dispenser Misto Integrado de Pilhas AA, AAA e Baterias de 9V",
      "Bandeja Organizadora de Pilhas Domésticas AA e AAA de Gaveta",
      "Estojo Compacto Porta-Pilha Industrial Reforçado (ABS/PETG)",
      "Organizador de Pilhas Expansível Modular Tipo Trilho de Encaixe",
      "Porta-Pilhas Gamer Estilizado de Mesa com Recorte Temático",
    ];
    const descs = [
      "Abasteça as pilhas pelo topo e retire a de baixo de forma automatizada e super satisfatória.",
      "Suporte de alta durabilidade e compartimentação de baterias cilíndricas pesadas de alta performance.",
      "Case tático leve com tampa click para armazenar e proteger pilhas recarregáveis de câmeras em viagens.",
      "Organizador vertical suspenso de fixação prática e adesiva perfeito para controles de TV e ar-condicionado.",
      "Mini nicho compartimentado para armarinho de informática voltado para baterias tipo moeda.",
      "Dispenser unificado que acomoda todos os principais formatos de pilhas domésticas em uma única torre.",
      "Bandeja plana para organizar pilhas dentro da gaveta de utilitários da casa sem ficarem rolando soltas.",
      "Estrutura com resistência pesada contra ferramentas e impactos comuns, perfeita para bancadas duras.",
      "Garras laterais macho-fêmea deslizantes que conectam novas torres estáticas sequencialmente.",
      "Caixinha estilizada de mesa com arte e cortes inspirados em temas geek de video-game, decorativo.",
    ];
    name = titles[variantIndex];
    desc = descs[variantIndex];
  }

  // SUPORTE DE PAREDE PARA CONTROLES XBOX E PS5
  else if (
    lowBase.includes("suporte de parede para controles") ||
    lowBase.includes("controles xbox")
  ) {
    const titles = [
      "Suporte de Parede para Controles Xbox e PS5 Standard",
      "Suporte de Controle Gamer de Parede com Trava Antifurto Comercial",
      "Suporte sob Mesa de Joystick com Encaixe Invisível Adesivo",
      "Suporte de Controle Duplo de Parede Torre de Encaixe",
      "Suporte de Parede de Controle Inteligente com Gancho para Cabo USB",
      "Suporte de Controle sob Console PS5/Xbox para Carcaça",
      "Suporte de Joystick de Mesa Ergonômico Antiderrapante",
      "Suporte de Controle para Carrinho de Exposição Geek Showcase",
      "Suporte de Controle Temático Estilizado Low-Poly de Parede",
      "Suporte de Controle Universal Portátil de Cinto com Presilha",
    ];
    const descs = [
      "Base de apoio curva estável que ampara seu controle de videogame com encaixe suave e seguro.",
      "Projetado para balcões comerciais de shoppings ou stands coletivos, com haste de segurança regulada.",
      "Apoio que mantém seu controle guardado discretamente embaixo do tampo da escrivaninha.",
      "Dois andares independentes em uma só coluna de furação economizando muito espaço no quarto.",
      "Conta com fenda para passar o cabo carregador com segurança enquanto o controle repousa.",
      "O gancho se acopla nas grelhas pretas do PS5 ou aberturas do Xbox sem amassar o console.",
      "Suporte firme de bancada gamer para exibir seu controle especial favorito de forma elegante.",
      "Furos angulados ideais para montagens de painéis de vitrine e revendedores autorizados.",
      "Cortes poliédricos de forte assinatura geométrica que decoram o ambiente de games.",
      "Presilhas mecânicas seguras para engatar e travar o joystick em alças de calças e malas.",
    ];
    name = titles[variantIndex];
    desc = descs[variantIndex];
  }

  // VASINHO BONECO ROBERT PLANT PENSADOR SENTADO
  else if (lowBase.includes("robert plant") || lowBase.includes("pensador sentado")) {
    const titles = [
      "Vasinho Boneco Robert Plant Pensador Sentado Tradicional",
      "Vaso Boneco Robert Plant deitado de Bruços Soneca",
      "Vaso Boneco Robert Plant Sentado com Pernas Cruzadas Moderno",
      "Vaso Boneco Robert Plant de Joelhos Fazendo Alongamento",
      "Vaso Boneco Robert Plant em Pose de Yoga Meditando Zen",
      "Vaso Boneco Robert Plant Abraçando as Pernas Feliz",
      "Kit com 4 Mini Vasinhos Robert Plant em Poses Variadas",
      "Vasinho Boneco Robert Plant Escalando Parede Suspenso",
      "Vasinho Robert Plant Gigante Especial para Áreas de Lazer",
      "Vasinho Boneco Robert Plant de Mesa Lendo um Livrinho",
    ];
    const descs = [
      "Famoso bonequinho decorativo do pinterest perfeito para abrigar mudinhas de suculentas naturais.",
      "Visual relaxante com o boneco descansando na mesa de forma muito divertida.",
      "Pose geométrica sentada com as pernas dobradas de lado, trazendo sofisticação à estante.",
      "Foco esportivo divertido que diverte as crianças e enfeita varandas e hortas.",
      "Design que transmite calma e harmonia de cabeceira com o boneco sentado em lótus.",
      "Atitude meiga e tímida que encanta visitas e serve como excelente lembrança.",
      "Lote promocional muito procurado com as quatro poses mais vendidas do mercado em conjunto.",
      "Gancho oculto traseiro que simula o boneco subindo na sua parede de jardim vertical.",
      "Modelo expandido de alta parede reforçada para plantas pendentes maiores de sala.",
      "Nicho com miniatura de livro tátil esculpido na base, ideal para decoração de escritórios.",
    ];
    name = titles[variantIndex];
    desc = descs[variantIndex];
  }

  // ORGANIZADOR PORTA MOEDAS COMERCIAL DE GAVETA
  else if (lowBase.includes("organizador porta moedas") || lowBase.includes("porta moedas")) {
    const titles = [
      "Organizador Porta Moedas Comercial de Gaveta Standard",
      "Porta Moedas de Caixa Registradora Reforçado Industrial",
      "Mini Moedeiro Slim de Sacola de Feiras e Entregas",
      "Kit Porta Moedas Duplo para Caixa de Supermercado e PDV",
      "Moedeiro Organizador para Moedas do Real com Escrita Tátil",
      "Porta Moedas Organizador Portátil com Tampa Rosca para Carros",
      "Organizador de Moedas de Mesa com Separador por Cilindros",
      "Organizador Porta Moedas Compacto para Bolsa / Pochete",
      "Estojo Porta Moedas de Colecionador com Divisórias Deslize",
      "Moedeiro de Fixação Magnética sob Balcão Comercial Oculto",
    ];
    const descs = [
      "Pistão calibrado separador de moedas do real para caixas registradoras facilitando o troco.",
      "Material espesso e duto rígido de encaixe projetado para fluxo diário intenso sob pressão de caixistas.",
      "Design de bolso leve para motoristas de aplicativo e feirantes guardarem trocos com agilidade.",
      "Configuração de alta capacidade que permite organizar duas fileiras completas de moedas.",
      "Relevos com os valores das moedas em alto-relevo ajudando deficientes visuais e caixas rápidos.",
      "Perfeito para encaixar no console central do carro, liberando espaço e evitando moedas soltas.",
      "Ranhuras inclinadas que facilitam pegar moedas uma a uma de forma imediata na recepção.",
      "Estojo compacto de segurança com encaixe firme que impede as moedas de caírem na mala.",
      "Nicho especializado para moedas raras ou especiais com proteção contra arranhões de material silk.",
      "Ímãs fortes permitem prender o moedeiro escondido abaixo da bancada para segurança tática.",
    ];
    name = titles[variantIndex];
    desc = descs[variantIndex];
  }

  // DOCK STATION / PORTA TRECOS / ORGANIZADORES DE MESA
  else if (
    lowBase.includes("porta trecos") ||
    lowBase.includes("organizador porta trecos") ||
    lowBase.includes("porta copos modular")
  ) {
    const titles = [
      "Organizador Porta Trecos Modular de Mesa Slim Standard",
      "Organizador Porta Trecos com Alça Rústica para Ferramentas",
      "Porta Copos Modular de Mesa Geek com Suporte Hexagonal",
      "Organizador Porta Canetas Espiral Moderno Geometric",
      "Dock Station de Mesa Multifuncional com Chaveiro Magnético",
      "Suporte Ergonômico de Notebook Elevado com Porta Trecos",
      "Organizador de Canetas de Mesa Vertical Torre de Nichos",
      "Porta Copos estilo Discos de Vinil Retrô com Porta-Discos",
      "Porta Cartões de Visita Executivo Facetado Low-Poly",
      "Organizador de Batons e Cosméticos Giratório de Mesa",
    ];
    const descs = [
      "Organizador compacto modular com divisórias bem distribuídas para canetas, clipes e blocos.",
      "Alça reforçada que facilita transportar pincéis, chaves e colas de forma imediata pelo escritório.",
      "Suporte geométrico hexagonal que decora a mesa e protege superfícies de bebidas quentes/frias.",
      "Design espiral de linhas facetadas que valoriza a escrivaninha de forma moderna e refinada.",
      "Base de repouso para celulares que conta com íman oculto para reter molhos de chaves.",
      "Eleva a tela do laptop para melhor postura unindo um compartimento inferior de organização.",
      "Seções diagonais em cascata que aproveitam o espaço vertical e arrumam dezenas de canetas.",
      "Kit com descansos circulares imitando discos pretos de vinil retro com caixinha coletora.",
      "Silhueta de arte cubista poligonal de luxo excelente para balcões profissionais de recepção.",
      "Organizador estético giratório com nichos finos para óleos, pincéis e pós na penteadeira.",
    ];
    name = titles[variantIndex];
    desc = descs[variantIndex];
  }

  // DRAGÃO ARTICULADO / BRINQUEDOS / DRAGÕES
  else if (
    lowBase.includes("dragão articulado") ||
    lowBase.includes("lagartixa articulada") ||
    lowBase.includes("polvo do humor") ||
    lowBase.includes("tubarão articulado")
  ) {
    const titles = [
      "Dragão Articulado de Cristal Impresso em 3D Luxo",
      "Lagartixa Articulada de Mesa Realista Flexível",
      "Polvo do Humor Articulado Fidget Expressivo",
      "Tubarão Articulado Flexível de Ataque com Juntas",
      "Lagartixa de Cristal Flexível Brilhante Silk",
      "Dragão de Fogo Articulado Linha Lendária Imperial",
      "Brinquedo Slug Lagarta Articulada Fidget Colorida",
      "Fidget Cube Spinner Mecânico com Engrenagens Giro",
      "Fidget Anti-Estresse Infinity Cube Infinito Seguro",
      "Dinossauro Rex T-Rex Flexível com Mandíbula Móvel",
    ];
    const descs = [
      "Dragão articulado com movimentos fluídos, excelente peça colecionável de fidget e decoração gamer.",
      "Mascote maleável simpático de alta precisão de encaixes, parece uma lagartixa viva decorativa.",
      "Polvo simpático maleável que muda de pose, muito procurado para acalmar estresses escolares.",
      "Tubarão articulado com dentes angulados redondos e rabo móvel, mania nas redes sociais.",
      "Formato que reflete incríveis reflexos cintilantes sob a luz quando feito com PLA silk de brilho.",
      "Edição imponente de luxo com detalhes pontiagudos de garras e asas articuláveis refinadas.",
      "Emite um estalo plástico satisfatório (efeito asmr) ao chacoalhar, relaxante mecânico.",
      "Seis engrenagens interligadas em cubo que se movimentam juntas ao toque dos dedos nas laterais.",
      "Cubo modular dobrável que gira de forma contínua em qualquer direção sem limites mecânicos.",
      "Divertido predador t-rex que abre e fecha a boca de verdade ao mexer no rabo articulado.",
    ];
    name = titles[variantIndex];
    desc = descs[variantIndex];
  }

  // GENERAL CATEGORY DYNAMIC OVERRIDES IF NOT DETECTED ABOVE
  else {
    const suffixMap: Record<string, string[]> = {
      acessorios_pets: [
        " Ergonômico para Filhotes",
        " de Altura Regulada Grande Porte",
        " de Bolso Portátil para Viagem",
        " Suporte de Fixação de Parede Fita 3M",
        " com Caixa Porta Ração de Entrada Lenta",
        " Lateral de Caixa Organizadora",
        " de Encaixe em Coleiras de Identificação",
        " Especial para Gatos com Labirintos",
        " com Tampa Antivazamento Rígida",
        " de Encaixe com Garras para Sofás",
      ],
      acessorios_aquario: [
        " Standard Regulável de Vidro",
        " para Limpeza Lateral sem Arranhar",
        " de Esconderijo Cônico para Filhotes",
        " Suporte de Parede de Tomada Luminária",
        " Ajustável para Assento sob Trilho",
        " com Clipes Organizadores de Mangueiras",
        " Divisória de Encaixe com Grelha Protetora",
        " Manual de Fluxo Suave Aquascaping",
        " Antiaquecimento Reforçado de Bocal",
        " de Fixação Simples com Sucção Forte",
      ],
      jardim_plantas: [
        " Inteligente de Pavio Autoirrigável",
        " Identificador Placa Lote 10un",
        " de Parede Colmeia de Encaixe",
        " de Torneira Enrolador Sólido",
        " com Prato Seletor d'Água Anti-Dengue",
        " Mini Estufa Compacta Cubadora",
        " Treliça Flexível de Encaixe Parede",
        " Multiuso de Fixação em Baldes Gancho",
        " Decorativo em Formato de Gatinho",
        " Especial Alto com Dreno Escondido",
      ],
      games_geek: [
        " Universal de Mesa Gamer",
        " Torre Compacta CD e DVD Separador",
        " Estojo Porta Cartuchos de Encaixe Rapido",
        " de Parede de Console Sem Fios",
        " Especial Geek Luminária Detalhe Hollow",
        " de Mesa Portátil Dobrável Compacto",
        " Suporte Auxiliar de Fixação em Painéis",
        " Estilo Balcão Showcase Revendedores",
        " Linha Low-Poly Poligonal Premium",
        " de Bolso Organizador com Travas",
      ],
      chaveiros_personalizados: [
        " Letra Nome Inicial Personalizada 3D",
        " Placa Mercosul com Nome e UF",
        " QR Code PIX Comercial de Balcão",
        " Chaveiro Tático Multi-Mosquete de Cinto",
        " Silhueta Patinha Pet com Furo",
        " Lembrancinhas Lote Promocional 20un",
        " Brinde Logotipo Empresarial Sob Encomenda",
        " Porta Moedas Carrinho de Supermercado",
        " Mini Abridor de Garrafas Reforçado",
        " Chaveiro Coração Geométrico Lote",
      ],
      paineis_led_luminaria: [
        " Letreiro Custom de Mesa Luxo",
        " Base Adaptadora de Difusão de Trilhos",
        " Abajur Geométrico Facetado de Cabeceira",
        " Temática Espacial Canhão Projetor",
        " de Encaixe sob Gesso de Teto",
        " de Parede Arandela Sombra Artística",
        " Canopla de Mesa Circular Reguladora",
        " Ondulada Abajur Projetor Ondas do Mar",
        " Cubo Vazado Luz Confortável Quarto",
        " Mini Arandela Modular Dobrável",
      ],
      cases_eletronica: [
        " Case Protetor Ventilação Ativa",
        " Adaptador HD e SSD Trilho Interno",
        " Case Organizador de Bancada",
        " Protetor de Placa Trilho DIN",
        " Estojo de Bolso com Divisórias",
        " Organizador de Cabos de Rede TI",
        " Protetor de Bocal de Conector Fios",
        " de Parede Roteador Mesh Intelbras",
        " Suporte Organizador de Trilho Rack",
        " Caixa Estojo de Protoboard Caixa",
      ],
      acessorios_celular: [
        " de Mesa Estilo Retro Monitor Antigo",
        " Tripé Dobrável Articulado Ajuste 180°",
        " Organizador de Fone Case Bolso",
        " Guia Protetor de Cabo Sapato Gamer",
        " Apoio de Pescoço Preguiça Ajustável",
        " Amplificador de Som Acústico Passivo",
        " de Tomada Encaixe Suporte Tomi",
        " Suporte Dock Carregador Console Grande",
        " Veicular Presilha Antiderrapante",
        " Redutor Traseiro Estilo Anel Mão",
      ],
      organizadores_cabos: [
        " Clipe Adesivo Guia Lote 10un",
        " Canaleta Traseira sob Escrivaninha",
        " Suporte de Parede de Tomada Gancho",
        " Espiral Guia Protetor Rolo 2 metros",
        " Magnético Organizador de Pontas USB",
        " de Cabos de Eletrodomésticos Cozinha",
        " de Parede Enrolador Rápido de Fios",
        " Adaptador de Tomada Caixa Organizadora",
        " Clipe Encaixe Snap de Canto Mesa",
        " Abraçadeira Flexível de Fixação",
      ],
      suportes_oficina: [
        " Organizador Trilho Chaves Allen",
        " Pegboard Painel Suportes Encaixes",
        " Gancho de Parede Alicates Garagem",
        " Estojo Organizador Parafusos Miudezas",
        " Calibrador Separador Brocas Drill",
        " Guia Perfuração de Precisão Régua",
        " de Mesa Jacaré Soldagem Clipe Duplo",
        " Dispenser Suporte Fita Isolante Rolo",
        " de Parede Soprador Térmico Haste",
        " de Parede Baterias Furadeira Lote 4",
      ],
      copos_utilidades_mesa: [
        " Dispensador de Parede Copos Descarte",
        " Porta Copos Hexagonal Colmeia Lux",
        " Bandeja Organizadora Estilo Rústico",
        " sob Armário Suspenso Canecas Gancho",
        " espremedor de Limão Manual Alavanca",
        " Saladeira Inclinada de Estética Orgânica",
        " Identificador de Taças Clipes Coloridos",
        " Porta Guardanapo Linha Ondas Dobras",
        " Anel Coletor Antigotas para Garrafas",
        " Tigela Geométrica Relevo Salada",
      ],
      datas_comemorativas: [
        " Coelho Páscoa Porta Chocolate Ovo Mini",
        " Árvore de Natal Desmontável de Mesa",
        " Enfeite Coração Dia dos Namorados Luz",
        " Molde Cortador Caveira Halloween Dia",
        " Abóbora Halloween Porta Velas Vela Mini",
        " Presépio Natal Silhueta Sagrada Presépio",
        " Guirlanda Decorativa de Porta Feliz Natal",
        " Pote Doces Fantasma Halloween Lindo",
        " Placa Dia das Mães Coração Relevo Vovó",
        " Cartão Dia dos Pais Funcional Letreiro",
      ],
      presentes_personalizados: [
        " Letreiro Nome Personalizado Luxo Mesa",
        " Calendário Eterno de Mesa Poligonal",
        " Letreiro Spotify Capa Acrílica FDM",
        " Cubo Decisão Conselheiro Executivo",
        " Troféu Campeão Base Customizável",
        " Caixa Secreta Puzzle Box Mecânica",
        " Estatueta Casal Abraço Amor Eterno",
        " Chaveiro Letra Nome Inicial 3D Custom",
        " Porta Canetas Container Retro Industrial",
        " Luminária Foto Lithophane Coração Luz",
      ],
      flores_arte_decorativa: [
        " Vaso Colunar Espiral Geométrico Flores",
        " Quadro Vazado Silhueta Folha Parede",
        " Cachepot Poligonal Facetado Suculenta",
        " Suporte Prato Expositor Clássico Mesa",
        " Vaso Trançado Rattan Estilo Cesta",
        " Escultura de Parede Pássaros Voando",
        " Vaso Geométrico Bolhas de Mesa Redondo",
        " Quadro Escultura Árvore Bonsai 3D",
        " Vasinho de Parede Tipo Meia Lua",
        " Porta Guardanapo Design Flor de Lótus",
      ],
      cosplay_fantasia: [
        " Máscara Kitsune Raposa Kabuki Japão",
        " Elmo Protetor Realista Espartano",
        " Réplica Estrela Ninja Naruto Shuriken",
        " Suporte Expositor Espada Katana Apoio",
        " Máscara Cyborg Cyberpunk Futurista Tech",
        " Réplica Varinha Mágica Feiticeiro Film",
        " Coroa Tiara Geométrica Ajustável Rei",
        " Chifres de Malévola Tiara Arco Cabeça",
        " Fivela Cinto Steampunk Retro Engrenagem",
        " Tiara Elfa Medieval Trançada Silk",
      ],
      esportes_academia: [
        " Gancho de Parede Expositor de Skate",
        " Suporte Garrafa Caramanhola Bicicleta",
        " Suporte Expositor de Medalhas Corrida",
        " Presilha Barra de Pesos Olímpica Par",
        " Suporte Bola Basquete Futebol Parede",
        " Expositor Gancho Parede Patinete",
        " Porta Giz Magnético Crossfit Ginásio",
        " Suporte Parede Raquetes Beach Tennis",
        " Fivela Presilha Cadarço Performance",
        " Suporte Ciclocomputador Guidão Bicicleta",
      ],
      instrumentos_musica: [
        " Suporte de Parede Violão Guitarra Apoio",
        " Porta Palhetas Clave de Sol de Mesa",
        " Suporte Expositor Flauta Doce Sopros",
        " Suporte Partituras Presilha Pedestal",
        " Apoio Clamp Microfone de Instrumento",
        " Enrolador Rápido de Cordas Violão",
        " Presilha Organizadora Cabos Pedalboard",
        " Suporte Mesa Afinador e Capotraste",
        " Suporte Parede Violino Reforçado",
        " Apoio Ergonômico Braço de Violoncelo",
      ],
      miniaturas_rpg: [
        " Torre de Dados Castelo Medieval Dice",
        " Miniatura Paladino Guerreiro Humano 28mm",
        " Expositor Miniaturas Prateleira Vidro",
        " Miniatura Dragão Alado RPG Estatua 3D",
        " Organizador Counters Fichas RPG Box",
        " Miniatura Mago Arcano Clássico Feitiço",
        " Caixa Porta Dados Dice Box Magnética",
        " Grid Tabuleiro Encaixes Arena Dungeon",
        " Miniatura Goblin Arqueiro Selva Mini",
        " Kit Terrenos Masmorra Modular Placas",
      ],
      ferramentas_uso_geral: [
        " Gabarito Cavilha Ajustável Carpintaria",
        " Suporte Organizador Chaves Allen Cabeça",
        " Suporte Fixador de Furadeira de Mesa",
        " Guia Perfuração Angular de Precisão",
        " Organizador de Brocas Helicoidais Caixa",
        " Compasso de Risco Carpintaria Sólido",
        " Calibrador Diâmetro Brocas Parafusos",
        " Gabarito Curvas Francesas Desenho Tec",
        " Suporte Gancho de Alicates Pegboard",
        " Alça de Transporte Balde Sólido Garra",
      ],
      organizar_gavetas: [
        " Sólido Modular de Encaixes Rápidos",
        " Slim de Baixo Perfil para Gavetas Rasas",
        " Caixa de Bolso Estojo com Fecho Click Rígido",
        " de Mesa Vertical Multiuso Compacto",
        " com Divisórias Internas Móveis e Ajustáveis",
        " Giratório Estilo Carrossel Lazy Susan",
        " de Encaixe com Canaleta Frontal para Etiquetas",
        " Empilhável Triplo Kit Maximizador de Espaço",
        " com Tampa Magnética de Neodímio Oculta",
        " Industrial com Parede Reforçada para Oficina",
      ],
    };

    const list = suffixMap[categoryId];
    if (list && list[variantIndex % list.length]) {
      const suffix = list[variantIndex % list.length];
      name = `${baseName}${suffix}`;
      desc = `${base.desc} Solução adaptada ideal para resolver o problema de organização específico: ${suffix.toLowerCase().trim()}.`;
    } else {
      const fallbackSpecs = [
        {
          suffix: " de Encaixe Standard Prático",
          desc: "Design otimizado de encaixe universal de alta precisão para uso no dia a dia.",
        },
        {
          suffix: " Premium Reforçado de Parede",
          desc: "Possui espessura de parede tripla indicado para suportar maior esforço mecânico contínuo.",
        },
        {
          suffix: " Versão Slim Compacta de Mesa",
          desc: "Formato fino que economiza espaço sem perder rigidez, ideal para pequenos escritórios.",
        },
        {
          suffix: " Kit Econômico de Encaixe (3un)",
          desc: "Compre em lote modular com encaixes de conexão rápidos e economize no frete.",
        },
        {
          suffix: " Adesivo Prático Sem Furo 3M",
          desc: "Instalação fácil em qualquer superfície lisa usando fita dupla face inclusa.",
        },
        {
          suffix: " com Organizador e Compartimento Duplo",
          desc: "Adiciona nichos extras no corpo da peça para pequenos acessórios secundários.",
        },
        {
          suffix: " de Mesa Estilo Minimalista Dock",
          desc: "Design clean e moderno com pés estáveis antiderrapantes para tampos de mesas.",
        },
        {
          suffix: " Portátil para Viagem Dobrável",
          desc: "A haste se recolhe de forma compacta e articulada para caber em qualquer bolsa.",
        },
        {
          suffix: " Edição Especial Premium Colecionador",
          desc: "Impresso em alta resolução com filamento silk de brilho metálico para exposição.",
        },
        {
          suffix: " Universal Ajustável de Pressão",
          desc: "Garras flexíveis que se moldam e regulam à vasta maioria de marcas do mercado.",
        },
      ];
      const spec = fallbackSpecs[variantIndex % fallbackSpecs.length];
      name = `${baseName}${spec.suffix}`;
      desc = `${base.desc} ${spec.desc}`;
    }
  }

  return {
    title: name,
    description: desc,
    gramsMult,
    hoursMult,
    priceMult,
    salesMult,
    trend,
  };
}

// Generates exactly 100 unique premium products per category using index variants
export function getGeneratedProductsForCategory(categoryId: string): SellerReport[] {
  const baseTemplates = getTemplatesForCategory(categoryId);
  const results: SellerReport[] = [];

  // Generate exactly 100 products (10 base products * 10 variations)
  for (let i = 0; i < 100; i++) {
    const baseIndex = i % 10;
    const variantIndex = Math.floor(i / 10);

    const base = baseTemplates[baseIndex];
    const itemVariant = getTailoredProductVariant(base, variantIndex, categoryId, i);

    const title = itemVariant.title;
    const description = itemVariant.description;
    const grams = Math.round(base.grams * itemVariant.gramsMult);
    const printHours = parseFloat((base.hours * itemVariant.hoursMult).toFixed(1));
    const pricePromo = parseFloat((base.price * itemVariant.priceMult).toFixed(2));
    const monthlySales = Math.round(base.sales * itemVariant.salesMult);

    const id = `${categoryId}_p_${i + 1}`;
    const materialCost = parseFloat((grams * 0.1).toFixed(2));
    const priceRange = `R$ ${Math.round(pricePromo * 0.8)} - R$ ${Math.round(pricePromo * 1.4)}`;

    const commValue = Number((pricePromo * 0.18).toFixed(2));
    const rawMargin = Math.round(
      ((pricePromo - materialCost - commValue - 3.0) / pricePromo) * 100,
    );
    const estimatedMargin = Math.min(88, Math.max(35, rawMargin));

    const reviewsRating = parseFloat((4.5 + ((i + baseIndex) % 5) * 0.1).toFixed(1));
    const reviewsCount = Math.round(monthlySales * (1.1 + (baseIndex % 3) * 0.3));
    const competitorsCount = Math.round(15 + baseIndex * 4 + variantIndex);
    const dailySalesEst = Math.round(monthlySales / 30);

    // Fallback standard icons / images
    const imageUrl = getCategoryPlaceholderImage(categoryId, i);

    const filamentoMaterial =
      categoryId.includes("suporte") || title.toLowerCase().includes("parede")
        ? "PETG ou ABS Termorresistente de engenharia (suporta tração contínua)"
        : "PLA Premium Sedoso (melhor acabamento liso e livre de rebarbas)";

    const slicerTips = `• Material Recomendado: ${filamentoMaterial}\n• Altura de Camada: 0.16mm (Superfície Lisa, sem marcas) ou 0.20mm (Rápido)\n• Preenchimento: ${grams > 90 ? "25% Giroscópico (altíssima rigidez em botes)" : "15% Giroscópico (ideal e econômico)"}\n• Temperatura do Bico: 210°C (Mesa aquecida a 60°C)\n• Suportes: Não necessita suportes secundários, desenho otimizado para bico plano 0.4mm.`;

    const finishingTips = `• Pós-Processamento: Sopro curto com soprador térmico rápido (ou isqueiro maçarico) a 140°C para remover fios remanescentes microscópicos instantaneamente.\n• Acabamento: ${categoryId.includes("decoracao") ? "Lixamento d'água leve de gramatura 320 e pintura spray com primer acrílico para acabamento profissional." : "Remover saia ou rebarbas das quinas com rebarbador estilete manual."}\n• Embalagem: Envolva a peça em plástico bolha espesso e embale em caixa de papelão kraft reciclado com etiqueta personalizada e cupom de agradecimento para elevar a nota da loja.`;

    const cleanCategoryTags = categoryId.replace("_", "");
    const listingSEO = `Título Convertido de Alta Performance Shopee:\n'${title.toUpperCase()} IMPRESSÃO 3D SUPORTE'\n\nCopywriting do Anúncio:\nSua rotina muito mais organizada e moderna! Produzido com polímeros industriais de engenharia premium que não deformam. Alta tração de esforço, rigidez comprovada.\n\nTags Recomendadas: #impressao3d #shopeebrasil #organizador #${cleanCategoryTags} #decora3d #filamentos`;
    const shopeeLink = `https://shopee.com.br/search?keyword=${encodeURIComponent(title)}`;

    results.push({
      id,
      categoryId,
      rank: `#${i + 1} em ${categoryId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      title,
      description,
      priceRange,
      pricePromo,
      materialCost,
      monthlySales,
      estimatedMargin,
      reviewsRating,
      reviewsCount,
      competitorsCount,
      trend: itemVariant.trend,
      dailySalesEst,
      printHours,
      filamentGrams: grams,
      peakDemand: "Novembro (Black Friday) e Dezembro (Natal e Fim do Ano)",
      keywords: base.tags,
      competitorStores: [
        ["3DPrime_Oficial", "Maker3D_Brasil"],
        ["Maker3D_Brasil", "ArtStudio_3D"],
        ["ArtStudio_3D", "Ponto3D_Lab"],
        ["Ponto3D_Lab", "3DPrime_Oficial"],
      ][i % 4],
      historyData: generateHistoryData(monthlySales),
      shopeeLink,
      imageUrl,
      slicerTips,
      finishingTips,
      listingSEO,
    });
  }

  return results;
}
