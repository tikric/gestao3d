// Pure data + helpers extracted from ClientsTab.tsx — no React, no state.

export interface ProspectLead {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: string;
  pitch: string;
  status: 'PROSPECT' | 'CONTACTED' | 'VISITED' | 'INTERESTED' | 'WON';
  note?: string;
  timelineChecklist?: Record<string, boolean>;
}

// B2B CRM Lead Sourcing Helper Data structures
export const LEAD_CATEGORIES = [
  'Jornaleiros',
  'Brinquedos',
  'Decoração',
  'Cafeteria',
  'Geek',
  'Escolas',
  'Pet Shops',
  'Presentes',
  'Beleza',
  'Academias',
  'Celulares',
  'Confeitarias',
  'Dentistas'
];

export const guessDDD = (region: string): string => {
  const r = region.toLowerCase();
  
  // Custom precise city-to-DDD maps:
  const dddMap: Record<string, string> = {
    'sorocaba': '15', 'votorantim': '15', 'itu': '15', 'itapetininga': '15', 'tatuí': '15', 'tatui': '15', 'itapeva': '15', 'porto feliz': '15', 'boituva': '15', 'piedade': '15',
    'campinas': '19', 'piracicaba': '19', 'americana': '19', 'sumaré': '19', 'sumare': '19', 'limeira': '19', 'indaiatuba': '19',
    'ribeirão': '16', 'ribeirao': '16', 'franca': '16', 'são carlos': '16', 'sao carlos': '16', 'araraquara': '16',
    'são josé do rio preto': '17', 'sao jose do rio preto': '17', 'barretos': '17', 'catanduva': '17',
    'araçatuba': '18', 'aracatuba': '18', 'marília': '18', 'marilia': '18', 'presidente prudente': '18',
    'santos': '13', 'guarujá': '13', 'guaruja': '13', 'são vicente': '13', 'sao vicente': '13', 'praia grande': '13', 'registro': '13',
    'são josé dos campos': '12', 'sao jose dos campos': '12', 'taubaté': '12', 'taubate': '12', 'jacareí': '12', 'jacarei': '12', 'guaratinguetá': '12', 'caraguatatuba': '12',
    'são paulo': '11', 'sao paulo': '11', 'guarulhos': '11', 'são bernardo': '11', 'sao bernardo': '11', 'santo andré': '11', 'santo andre': '11', 'osasco': '11', 'mogi': '11', 'jundiaí': '11', 'jundiai': '11', 'barueri': '11', 'alphaville': '11', 'cotia': '11',
    'rio de janeiro': '21', 'copacabana': '21', 'niterói': '21', 'niteroi': '21', 'barra da tijuca': '21', 'duque de caxias': '21', 'são gonçalo': '21', 'sao goncalo': '21',
    'cabo frio': '22', 'macaé': '22', 'macae': '22', 'campos dos goytacazes': '22',
    'petrópolis': '24', 'petropolis': '24', 'volta redonda': '24', 'angra': '24',
    'belo horizonte': '31', 'bh': '31', 'contagem': '31', 'betim': '31', 'ipatinga': '31',
    'uberlândia': '34', 'uberlandia': '34', 'uberaba': '34',
    'juiz de fora': '32',
    'divinópolis': '37', 'divinopolis': '37',
    'poços de caldas': '35', 'pocos de caldas': '35', 'pouso alegre': '35',
    'vitória': '27', 'vitoria': '27', 'vila velha': '27', 'serra': '27',
    'curitiba': '41', 'são josé dos pinhais': '41', 'sao jose dos pinhais': '41', 'paranaguá': '41',
    'londrina': '43', 'apucarana': '43', 'arapongas': '43',
    'maringá': '44', 'maringa': '44', 'cianorte': '44',
    'cascavel': '45', 'foz do iguaçu': '45', 'foz do iguacu': '45',
    'ponta grossa': '42', 'guarapuava': '42',
    'florianópolis': '48', 'florianopolis': '48', 'criciúma': '48', 'criciuma': '48', 'tubarão': '48',
    'joinville': '47', 'blumenau': '47', 'balneário': '47', 'balneario': '47', 'itajai': '47', 'itajaí': '47',
    'porto alegre': '51', 'canoas': '51', 'gravataí': '51', 'gravatai': '51', 'viamão': '51', 'viamao': '51', 'novo hamburgo': '51',
    'caxias': '54', 'bento gonçalves': '54', 'bento goncalves': '54', 'gramado': '54', 'canela': '54',
    'pelotas': '53', 'rio grande': '53',
    'santa maria': '55',
    'salvador': '71', 'lauro de freitas': '71',
    'feira de santana': '75',
    'fortaleza': '85', 'caucaia': '85',
    'recife': '81', 'olinda': '81', 'jaboatão': '81', 'jaboatao': '81', 'caruaru': '81',
    'cariri': '88', 'juazeiro do norte': '88', 'sobral': '88',
    'brasília': '61', 'brasilia': '61',
    'goiânia': '62', 'goiania': '62', 'aparecida de goiânia': '62',
    'campo grande': '67',
    'cuiabá': '65', 'cuiaba': '65', 'várzea grande': '65',
    'manaus': '92',
    'belém': '91', 'belem': '91', 'ananindeua': '91',
    'são luís': '98', 'sao luis': '98',
    'teresina': '86',
    'natal': '84',
    'joão pessoa': '83', 'joao pessoa': '83',
    'maceió': '82', 'maceio': '82',
    'aracaju': '79'
  };

  for (const [city, ddd] of Object.entries(dddMap)) {
    if (r.includes(city)) {
      return ddd;
    }
  }

  // Also check states
  if (r.includes('sp') || r.includes('sao paulo') || r.includes('são paulo')) return '11';
  if (r.includes('rj') || r.includes('rio de janeiro')) return '21';
  if (r.includes('mg') || r.includes('minas geraes') || r.includes('minas gerais')) return '31';
  if (r.includes('pr') || r.includes('paraná') || r.includes('parana')) return '41';
  if (r.includes('rs') || r.includes('rio grande do sul')) return '51';
  if (r.includes('sc') || r.includes('santa catarina')) return '47';
  if (r.includes('ba') || r.includes('bahia')) return '71';
  if (r.includes('pe') || r.includes('pernambuco')) return '81';
  if (r.includes('ce') || r.includes('ceará') || r.includes('ceara')) return '85';
  if (r.includes('df') || r.includes('distrito federal')) return '61';
  if (r.includes('go') || r.includes('goiás') || r.includes('goias')) return '62';
  
  // Guess numbers from input:
  const digitMatch = r.match(/\b(11|12|13|14|15|16|17|18|19|21|22|24|27|28|31|32|33|34|35|37|38|41|42|43|44|45|46|47|48|49|51|53|54|55|61|62|63|64|65|66|67|68|69|71|73|74|75|77|79|81|82|83|84|85|86|87|88|89|91|92|93|94|95|96|97|98|99)\b/);
  if (digitMatch) return digitMatch[1];

  return '11';
};

export const getCityNeighborhoods = (city: string): string[] => {
  const c = city.toLowerCase();
  if (c.includes('sorocaba')) {
    return ['Campolim', 'Wanel Ville', 'Centro', 'Além Ponte', 'Éden', 'Santa Rosália', 'Trujilo', 'Jardim Gonçalves', 'Vergueiro', 'Cerrado'];
  }
  if (c.includes('são paulo') || c.includes('sao paulo') || c.includes('sp')) {
    return ['Vila Mariana', 'Pinheiros', 'Moema', 'Tatuapé', 'Santana', 'Itaim Bibi', 'Bela Vista', 'Perdizes', 'Mooca', 'Butantã'];
  }
  if (c.includes('rio') || c.includes('rj')) {
    return ['Copacabana', 'Barra da Tijuca', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Tijuca', 'Centro', 'Lapa'];
  }
  if (c.includes('campinas')) {
    return ['Cambuí', 'Barão Geraldo', 'Taquaral', 'Guanabara', 'Vila Itapura', 'Nova Campinas', 'Parque Prado'];
  }
  if (c.includes('belo horizonte') || c.includes('bh')) {
    return ['Savassi', 'Lourdes', 'Sion', 'Anchieta', 'Buritis', 'Pampulha', 'Ouro Preto', 'Centro'];
  }
  if (c.includes('curitiba')) {
    return ['Batel', 'Água Verde', 'Centro', 'Portão', 'Cabral', 'Jardim Social', 'Champagnat', 'Mercês'];
  }
  return ['Centro', 'Bairro Alto', 'Jardim América', 'Vila Nova', 'Industrial', 'Primavera', 'Santo Antônio', 'Vila Bela', 'São João', 'Aeroporto'];
};

export const getCityStreets = (city: string): string[] => {
  const c = city.toLowerCase();
  if (c.includes('sorocaba')) {
    return [
      'Avenida Antônio Carlos Comandante', 'Rua Barão de Tatuí', 'Avenida Izoraida Marques Peres', 
      'Rua Santa Clara', 'Avenida General Carneiro', 'Avenida São Paulo', 'Rua Penha', 
      'Avenida Dom Aguirre', 'Avenida Itavuvu', 'Rua Sete de Setembro', 'Rua Moreira César', 
      'Rua de Novembro', 'Avenida Pereira da Silva', 'Rua Arthur Martins', 'Avenida Washington Luiz'
    ];
  }
  if (c.includes('são paulo') || c.includes('sao paulo')) {
    return [
      'Avenida Paulista', 'Rua Oscar Freire', 'Rua Augusta', 'Avenida Brigadeiro Luís Antônio',
      'Rua Vergueiro', 'Avenida Rebouças', 'Rua dos Pinheiros', 'Rua Pamplona', 'Rua da Consolação'
    ];
  }
  return [
    'Avenida Brasil', 'Rua Getúlio Vargas', 'Avenida Afonso Pena', 'Rua Sete de Setembro', 
    'Rua Quinze de Novembro', 'Avenida Marechal Deodoro', 'Avenida Santos Dumont', 
    'Rua Castro Alves', 'Avenida Getúlio Vargas', 'Rua Tiradentes', 'Rua das Flores',
    'Avenida Central', 'Rua Marechal Floriano', 'Rua General Osório', 'Rua Rui Barbosa',
    'Avenida Amazonas', 'Rua Bahia'
  ];
};

const STORE_NAME_PREFIXES: Record<string, string[]> = {
    'Jornaleiros': [
      'Banca e Revistaria', 'Banca da Praça', 'Kiosk de Jornais', 'Ponto da Leitura', 'Espaço Cultural',
      'Revistaria Real', 'Banca do Globo', 'Ponto da Revista', 'Banca e Papelaria Imperial', 'Bancão de Descontos',
      'Parada Escrita', 'Leitura Activa', 'Revistaria Boulevard', 'Cantinho do Jornal', 'Quiosque Express'
    ],
    'Brinquedos': [
      'Mundo Mágico Toys', 'Império dos Brinquedos', 'Kids & Cia', 'Giramundo Diversões', 'Cantinho do Brinquedo',
      'Shopping dos Brinquedos', 'Planeta Kids', 'Estação Toy', 'Brinquedos da Vila', 'Playground Variedades',
      'Vila Fantasia', 'Lojas KidMais', 'Pequenos & Travessos', 'Alpha Brinquedos', 'Fábrica de Brincar'
    ],
    'Decoração': [
      'Ateliê Botânico Decor', 'Arte & Vasos', 'Jardim de PLA', 'Design Minimalista', 'Vaso & Cia',
      'Estilo Living', 'Decor&Vida', 'Casinha Bonita', 'Espaço Harmonia', 'Boutique do Vaso',
      'Vaso Moderno', 'Geometric Decor', 'Marmorize Design', 'Espaço Escandinavo', 'Ateliê do Lar'
    ],
    'Cafeteria': [
      'Café Grão Divino', 'Aroma de Café', 'Expresso Bistrô', 'Estação do Café', 'Pão de Queijo & Cia',
      'Café Gourmet', 'Bistrô e Delícias', 'Grão de Bronze', 'Café Imperial', 'Parada do Expresso',
      'Café da Esquina', 'Ponto Gourmet Cafe', 'Papo & Café', 'Mundo do Café', 'Bistrô das Américas'
    ],
    'Geek': [
      'Nerd Core Geek', 'Portal Jogos', 'Universo Gamer', 'Tabulândia', 'Bora Jogar Boardgames',
      'Arena Nerd 3D', 'Multiverso Colecionáveis', 'Gamer Zone', 'Pixel Art e RPG', 'Clube do Tabuleiro',
      'Planeta Geek', 'Mundo Otaku', 'Estação Gamer', 'Play Colecionáveis', 'Império Nerd'
    ],
    'Escolas': [
      'Papelaria Aquarela', 'Papelaria Arco-Íris', 'Espaço Escolar', 'Ateliê do Estudante', 'Central de Cópias',
      'Papelaria do Estudioso', 'Nacional Papéis', 'Aquarela Escolar', 'Estação Arte e Papel', 'Lápis & Cor',
      'Clube do Estudo', 'Papelaria Prime', 'Mega Bazar Escolar', 'Escritório & Cia', 'Grafite Papelaria'
    ],
    'Pet Shops': [
      'Pet Shop AuAu Miau', 'Reino Animal', 'Bicho Mimado', 'Clínica & Pet Amigo', 'Pet Shop Patinhas',
      'Sorocaba Pet Shop', 'Patas & Pelos', 'Cão Gostoso', 'Vila dos Bichos', 'Bichinho Feliz',
      'Mundo Animal Select', 'Estação Canina', 'Amigo Fiel Pet', 'Espaço Pet Vip', 'Super Pet'
    ],
    'Presentes': [
      'Lojas Mil Ideias', 'Encanto Presentes', 'Variedades & Praticidade', 'Estilo & Arte', 'Bazar Ideal',
      'Bazar Central', 'Presentes & Mimos', 'Estação Criativa', 'Gifty Variedades', 'Mimos do Bem',
      'Tudo de Bom Presentes', 'Bazar da Esquina', 'Bella Arte Presentes', 'Império dos Mimos', 'Mega Bazar'
    ],
    'Beleza': [
      'Espaço Beleza Pura', 'Império da Estética', 'Studio Vip', 'Nails & Make Art', 'Corte & Luxo',
      'Salão de Beleza Charmosa', 'Studio Formas', 'Diva Hair Design', 'Estética Corpo & Rosto', 'Beleza Rápida',
      'Sobrancelhas & Cia', 'Studio Glitzy', 'Madame Coiffure', 'Esmalteria Express', 'Boutique da Beleza'
    ],
    'Academias': [
      'Centro Fitness Iron', 'Academia Ritmo', 'Corpore Sano', 'CrossFit Box', 'Estúdio Atividade',
      'Force Fit', 'Espaço Atleta', 'Foco & Movimento', 'Academia do Bairro', 'Power Training',
      'Geração Saúde', 'Arena Fit', 'Mega Gym', 'Espaço Movimento', 'Vila Fitness'
    ],
    'Celulares': [
      'Central Cell', 'Mega Capas', 'Connect Cell', 'Smart Fix', 'Império dos Acessórios',
      'Sorocaba Capas e Películas', 'Doutor do Celular', 'Tech & Cia', 'Giga Cell', 'Estrela do Celular',
      'Universo Mobile', 'Smart Mania', 'Ponto do Acessório', 'Central dos Consertos', 'Gamer Cell'
    ],
    'Confeitarias': [
      'Doce Sabor', 'Ateliê dos Doces', 'Delícias da Vovó', 'ChocoLove', 'Fábrica de Bolos',
      'Candy Shop', 'Ponto do Brigadeiro', 'Sweet Studio', 'Bolos & Delícias', 'Cacau Imperial',
      'Ateliê do Açúcar', 'Doçaria do Lago', 'Sabor das Nuvens', 'Confeitaria Premium', 'Doce Encanto'
    ],
    'Dentistas': [
      'Odonto Sorriso', 'Sorria Mais', 'Consultório Integra', 'Clínica Ortho', 'Odonto Prime',
      'Dentes Perfeitos', 'Dr. Sorriso', 'Odonto Excellence', 'Clínica Sorrir', 'Arte da Boca',
      'Odonto Kid', 'Sorriso de Ouro', 'Orto Sorocaba', 'Odonto Clin', 'Consultório BellaBoca'
    ]
};

const STORE_NAME_SUFFIXES = [
    'Central', 'do Bairro', 'Imperial', 'Premium', 'Prime', 'Popular', 'Express', '& Variedades',
    'Fino', '24h', 'União', 'Real', 'Concept', 'Outlet', 'Atacado', 'Co.', 'Select', 'Studio',
    'Estilo', 'Ateliê', 'Boulevard', 'Shopping', 'Nacional', 'VIP', 'Master', 'Top', 'Líder', 'Mais'
];

const STORE_NAME_OWNERS = [
    'do Carlos', 'da Helena', 'do Bruno', 'da Patrícia', 'do Renato', 'da Sandra', 'do Tiago',
    'da Valéria', 'do Lucas', 'da Júlia', 'do Felipe', 'da Amanda', 'do Roberto', 'da Mariana',
    'do Gabriel', 'da Fernanda', 'do Marcelo', 'da Camila', 'do Ricardo', 'da Letícia'
];

export const generateStoreName = (category: string, index: number): string => {
  const prefList = STORE_NAME_PREFIXES[category] || ['Comércio Geral', 'Super Bazar', 'Lojas Unidas'];
  
  // Seed offsets using Math.random() combined with index for endless variety on clicks!
  const randomOffset1 = Math.floor(Math.random() * 500);
  const randomOffset2 = Math.floor(Math.random() * 500);
  const randomOffset3 = Math.floor(Math.random() * 500);

  const prefIdx = (index + randomOffset1) % prefList.length;
  const suffIdx = (index * 3 + randomOffset2) % STORE_NAME_SUFFIXES.length;
  const ownIdx = (index * 7 + randomOffset3) % STORE_NAME_OWNERS.length;

  const pref = prefList[prefIdx];
  const suff = STORE_NAME_SUFFIXES[suffIdx];
  const owner = STORE_NAME_OWNERS[ownIdx];

  const formatDecision = (index + randomOffset1) % 4;
  if (formatDecision === 0) {
    return `${pref} ${suff}`;
  } else if (formatDecision === 1) {
    return `${pref} ${owner}`;
  } else if (formatDecision === 2) {
    return `${pref} ${suff} - ${owner}`;
  } else {
    return `${pref} - ${suff}`;
  }
};

export const getCategoryPitch = (category: string): string => {
  const pitches: Record<string, string> = {
    'Jornaleiros': 'Canetas decoradas bicolores, chaveiros articulados rápidos de heróis/animais para venda rápida de impulso e porta-moedas práticos para fixar no balcão de atendimento.',
    'Brinquedos': 'Dragão articulado em cores cintilantes Silk, polvos do humor coloridos e fidget toys sensoriais educativos, garantindo altíssimo interesse de crianças.',
    'Decoração': 'Vasos elegantes com design geométrico espiral, cachepôs para suculentas em filamento premium estilo mármore, cobre e madeira para arranjos sofisticados.',
    'Cafeteria': 'Displays organizadores porta-guardanapos/adoçantes bicolores para mesas, stencils customizados de barismo com a logomarca do café e cortadores de biscoito temáticos exclusivos.',
    'Geek': 'Suportes modernos de headsets, torres de dados medievais (Dice Towers) ricas em detalhes, bustos colecionáveis pintáveis e organizadores de consoles de videogame.',
    'Escolas': 'Maquetes interativas, quebra-cabeças geométricos de encaixe, kits organizadores de caneta com divisórias escalonadas e chaveirinhos de formatura em massa.',
    'Pet Shops': 'Porta-coleiras decorativos de parede em formato de osso ou gatinho com ganchos, comedouros elevados ergonômicos e pingentes de identificação leves e bicolores em PLA.',
    'Presentes': 'Organizadores geométricos com travas funcionais, mini luminárias vazadas decorativas bicolores, porta-retratos dinâmicos de encaixe rápido e mimos personalizados.',
    'Beleza': 'Organizadores de maquiagem cilíndricos com divisória espiral para pincéis/batons, expositores de esmaltes de mesa e plaquinhas elegantes de balcão com QR Code de Pix/Siga-nos.',
    'Academias': 'Chaveiros mini de anilhas e halteres pesados com logomarca, suportes de copos para ganchos de esteira, organizadores internos bicolores de gavetas de armário.',
    'Celulares': 'Suportes reguláveis de mesa para celulares e tablets bicolores, amplificadores passivos acústicos de som para reprodução ambiente e docks com calha organizadora de cabos.',
    'Confeitarias': 'Cortadores de massas temáticos de datas festivas (Páscoa, Natal, Dia das Mães) e carimbos personalizados para brigadeiro com a logo do cliente para carimbar o doce.',
    'Dentistas': 'Vasinhos de dente super simpáticos sorrindo para o balcão da recepcionista, organizadores de mesa bicolores e pequenos chaveiros de dente de brinde infantil.'
  };
  return pitches[category] || 'Oferecer chaveiros personalizados sob medida, mimos de balcão de alta margem de rentabilidade e suportes práticos, com margem de venda acima de 120%.';
};
