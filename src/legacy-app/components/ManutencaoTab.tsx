import React, { useEffect, useMemo, useState } from 'react';
import { Printer } from '../types';
import { Wrench, Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle, X, Calendar, Package, FileText, Copy, BookOpen, Sparkles, CheckSquare, Info, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

type TipoManutencao = 'preventiva' | 'corretiva' | 'upgrade';
type StatusManutencao = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';

export interface GuiaManutencaoItem {
  id: string;
  titulo: string;
  periodicidade: 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'anual';
  periodicidadeRotulo: string;
  categoria: 'Mesa & Adesão' | 'Extrusora & Hotend' | 'Eixos & Lubrificação' | 'Estrutura & Correias' | 'Elétrica & Firmware';
  ferramentas: string[];
  instrucoes: string;
  checklistItems: string[];
}

export const GUIA_MANUTENCAO_MESTRE: GuiaManutencaoItem[] = [
  {
    id: 'diaria-mesa',
    titulo: 'Limpeza da Mesa de Impressão (PEI / Vidro)',
    periodicidade: 'diaria',
    periodicidadeRotulo: 'Diária (a cada impressão / ~10h)',
    categoria: 'Mesa & Adesão',
    ferramentas: ['Álcool Isopropílico (IPA 99%)', 'Pano de Microfibra limpo', 'Detergente neutro e água morna'],
    instrucoes: '1. Aguarde a mesa esfriar até temperatura ambiente (<40°C).\n2. Borrife Álcool Isopropílico (IPA 99%) sobre a superfície da chapa PEI flexível ou vidro.\n3. Passe o pano de microfibra em movimentos circulares para remover óleos da pele e resíduos.\n4. Caso persista perda de adesão, retire a chapa PEI e lave na pia com água morna e detergente neutro usando o lado macio da esponja.',
    checklistItems: [
      'Aguardar resfriamento da mesa (<40°C)',
      'Borrifar Álcool IPA 99% na chapa',
      'Passar pano de microfibra limpo sem fiapos',
      'Verificar ausência de marcas de gordura de dedos'
    ]
  },
  {
    id: 'diaria-bico',
    titulo: 'Inspeção do Bico (Nozzle) e Purga de Plástico',
    periodicidade: 'diaria',
    periodicidadeRotulo: 'Diária (a cada início de produção)',
    categoria: 'Extrusora & Hotend',
    ferramentas: ['Escova de latão (cobre)', 'Pinça de precisão', 'Luva de proteção térmica'],
    instrucoes: '1. Aqueça o bico entre 200°C e 220°C via painel.\n2. Utilize a escova de latão para raspar delicadamente os restos de filamento carbonizado do exterior do bico. (NUNCA use escova de aço nos fios do termistor!)\n3. Remova fios de purga presos com a pinça.\n4. Verifique se o fluxo do filamento purgado sai reto e uniforme.',
    checklistItems: [
      'Aquecer bico a 200°C - 220°C',
      'Limpar exterior do bico com escova de latão',
      'Remover resíduos e fiapos com pinça',
      'Verificar fluxo reto da purga'
    ]
  },
  {
    id: 'diaria-ptfe',
    titulo: 'Checagem do Tubo PTFE e Secagem de Filamento',
    periodicidade: 'diaria',
    periodicidadeRotulo: 'Diária (Uso contínuo)',
    categoria: 'Extrusora & Hotend',
    ferramentas: ['Caixa seca / Drybox com Sílica Gel', 'Cortador de tubo PTFE'],
    instrucoes: '1. Verifique se o tubo PTFE não possui dobras agudas ou atrito excessivo com o chassi.\n2. Inspecione se o filamento não está quebradiço por umidade.\n3. Certifique-se de que o dessecante (sílica gel) no AMS / Drybox está dentro do padrão de cor seco (azul ou laranja).',
    checklistItems: [
      'Conferir livre deslizamento do tubo PTFE',
      'Testar flexibilidade e ressecamento do filamento',
      'Verificar estado da sílica gel na drybox'
    ]
  },
  {
    id: 'semanal-eixo-z',
    titulo: 'Limpeza e Lubrificação dos Eixos Z (Fuso Trapezoidal)',
    periodicidade: 'semanal',
    periodicidadeRotulo: 'Semanal (A cada ~50h de impressão)',
    categoria: 'Eixos & Lubrificação',
    ferramentas: ['Graxa Sintética com PTFE (Super Lube / Graxa Branca Lítio)', 'Papel toalha', 'Pincel macio'],
    instrucoes: '1. Eleve o eixo Z até o ponto mais alto.\n2. Limpe a graxa contaminada e poeira do fuso com papel toalha limpo.\n3. Aplique uma camada fina e homogênea de graxa PTFE no fuso Z com o pincel.\n4. Mova o eixo Z do topo à base 2x para espalhar a graxa nas roscas e castanha.',
    checklistItems: [
      'Elevar eixo Z para o topo',
      'Remover graxa velha e sujeira do fuso com papel toalha',
      'Pincelar camada fina de graxa sintética com PTFE',
      'Movimentar eixo Z min/max para distribuição homogênea'
    ]
  },
  {
    id: 'semanal-correias',
    titulo: 'Ajuste e Tensão das Correias dos Eixos X e Y',
    periodicidade: 'semanal',
    periodicidadeRotulo: 'Semanal (A cada ~50h de impressão)',
    categoria: 'Estrutura & Correias',
    ferramentas: ['Chaves Allen (2.0mm / 2.5mm / 3.0mm)', 'App Frequência de Som (Gates Carbon Drive ~110Hz)'],
    instrucoes: '1. Desligue os motores de passo.\n2. Movimente os carros X e Y manualmente sentindo se há folgas ou fricção.\n3. Toque a correia como corda de instrumento: deve emitir tom grave firme (~110Hz a 120Hz).\n4. Solte os parafusos do tensionador, ajustando a pressão sem esmagar os rolamentos.',
    checklistItems: [
      'Desativar motores e mover eixos X/Y manualmente',
      'Verificar tensão da correia X (~110Hz)',
      'Verificar tensão da correia Y (~110Hz)',
      'Apertar parafusos dos tensionadores de correia'
    ]
  },
  {
    id: 'semanal-trilhos',
    titulo: 'Limpeza e Óleo Fino nos Trilhos / Guias Lineares X e Y',
    periodicidade: 'semanal',
    periodicidadeRotulo: 'Semanal (A cada ~50h de impressão)',
    categoria: 'Eixos & Lubrificação',
    ferramentas: ['Óleo Lubrificante Mineral leve (ISO VG 32 / Singer)', 'Pano de microfibra sem fiapos'],
    instrucoes: '1. Passe o pano de microfibra limpo nas hastes de aço inoxidável para retirar poeira.\n2. Pingue 2 a 3 gotas de óleo ISO VG 32 ao longo da guia ou no bloco de esferas.\n3. Movimente o carro de ponta a ponta 5 vezes.\n4. Seque qualquer excesso acumulado nos batentes.',
    checklistItems: [
      'Limpar trilhos de aço inoxidável com pano seco',
      'Gotejar óleo lubrificante fino ISO VG 32',
      'Deslizar o carro manualmente para cobrir os rolamentos',
      'Retirar excessos de óleo nas pontas'
    ]
  },
  {
    id: 'mensal-extrusora',
    titulo: 'Limpeza e Escovação das Engrenagens da Extrusora',
    periodicidade: 'mensal',
    periodicidadeRotulo: 'Mensal (A cada ~200h de impressão)',
    categoria: 'Extrusora & Hotend',
    ferramentas: ['Escova pequena de latão / nylon', 'Lata de ar comprimido', 'Chaves Allen'],
    instrucoes: '1. Abra a trava da extrusora ou remova a tampa frontal de inspeção.\n2. Escove o acúmulo de pó e cavacos de plástico dos dentes tracionadores (Dual Drive).\n3. Sopre ar comprimido no canal do sensor de filamento.\n4. Verifique a tensão da mola de pressão do braço da extrusora.',
    checklistItems: [
      'Abrir compartimento das engrenagens da extrusora',
      'Escovar cavacos e pó de plástico acumulados nos dentes',
      'Soprar ar comprimido nos sensores e dutos',
      'Verificar mola e engrenagem acionadora do motor'
    ]
  },
  {
    id: 'mensal-ventoinhas',
    titulo: 'Limpeza do Radiador do Hotend e Ventoinhas de Resfriamento',
    periodicidade: 'mensal',
    periodicidadeRotulo: 'Mensal (A cada ~200h de impressão)',
    categoria: 'Elétrica & Firmware',
    ferramentas: ['Pincel macio', 'Lata de ar comprimido', 'Pinça'],
    instrucoes: '1. Com a impressora desligada, inspecione a ventoinha do hotend e do resfriamento de peça.\n2. Remova fios de plástico embolados (teias) nas pás das ventoinhas usando a pinça.\n3. Limpe as aletas do radiador de alumínio do hotend com pincel e ar comprimido para evitar Heat Creep (entupimento por calor ascendente).',
    checklistItems: [
      'Remover fiapos de filamento das pás das ventoinhas',
      'Pincelar poeira entre as aletas do radiador do hotend',
      'Soprar ar comprimido nas entradas de ar',
      'Testar rotação suave sem ruídos metálicos'
    ]
  },
  {
    id: 'mensal-nivelamento',
    titulo: 'Nivelamento Físico da Mesa (Tramming) e Z-Offset',
    periodicidade: 'mensal',
    periodicidadeRotulo: 'Mensal (A cada ~200h de impressão)',
    categoria: 'Mesa & Adesão',
    ferramentas: ['Folha de papel A4 (0.10mm)', 'Sonda ABL (BLTouch/CR-Touch/Indutiva)'],
    instrucoes: '1. Aqueça a mesa a 60°C e o bico a 150°C para dilatação térmica realista.\n2. Ajuste o nivelamento nos 4 cantos manuais com folha A4 sentindo leve atrito.\n3. Execute a rotina de Auto Bed Leveling (ABL) para criar nova malha de Compensação 3D.\n4. Faça o teste de primeira camada e ajuste o Z-Offset fino em tempo real.',
    checklistItems: [
      'Aquecer mesa a 60°C e bico a 150°C',
      'Nivelar 4 cantos manuais com papel A4 (0.1mm)',
      'Gerar malha automática de nível ABL',
      'Ajustar Z-Offset imprimindo camada de teste de 0.2mm'
    ]
  },
  {
    id: 'mensal-vslot',
    titulo: 'Inspeção de Roldanas V-Slot e Porcas Excêntricas',
    periodicidade: 'mensal',
    periodicidadeRotulo: 'Mensal (A cada ~200h de impressão)',
    categoria: 'Estrutura & Correias',
    ferramentas: ['Chave de boca 8mm/10mm', 'Pano de limpeza'],
    instrucoes: '1. Examine as roldanas de policarbonato/delrin nos perfis metálicos V-Slot.\n2. Cheque se a mesa ou cabeçote possuem folga oscilante.\n3. Gire a porca excêntrica até eliminar folgas sem esmagar as roldanas (devem girar manualmente com firmeza moderada).\n4. Limpe o acúmulo de pó nos perfis.',
    checklistItems: [
      'Verificar se há jogo lateral na mesa ou no carrinho X',
      'Ajustar porca excêntrica até firmeza perfeita',
      'Limpar acúmulo de resíduo sintético nos perfis metálicos'
    ]
  },
  {
    id: 'trimestral-aperto-bico',
    titulo: 'Re-aperto do Bico a Quente (Hot Tightening a ~240°C)',
    periodicidade: 'trimestral',
    periodicidadeRotulo: 'Trimestral (A cada ~500h de impressão)',
    categoria: 'Extrusora & Hotend',
    ferramentas: ['Chave soquete / boca 6mm/7mm', 'Alicate de pressão / Chave inglesa', 'Luva térmica'],
    instrucoes: '1. Aqueça o bico até 240°C-250°C.\n2. Segure o bloco aquecedor firmemente com alicate/chave inglesa sem prensar os fios do termistor.\n3. Aplique torque firme no bico (aprox 2.0 Nm) garantindo selagem perfeita contra o tubo heatbreak.\n4. Previne vazamentos no topo da rosca do bloco.',
    checklistItems: [
      'Aquecer hotend a 240°C - 250°C',
      'Segurar bloco com alicate sem danificar fiação do termistor',
      'Re-apertar bico a quente com chave soquete',
      'Verificar ausência de vazamento de plástico na rosca'
    ]
  },
  {
    id: 'trimestral-ptfe-capricorn',
    titulo: 'Inspeção e Corte de Ponta do Tubo PTFE Capricórnio',
    periodicidade: 'trimestral',
    periodicidadeRotulo: 'Trimestral (A cada ~500h de impressão)',
    categoria: 'Extrusora & Hotend',
    ferramentas: ['Cortador de tubo PTFE de 90°', 'Tubo PTFE Capricorn XS'],
    instrucoes: '1. Desconecte o tubo PTFE do hotend pressionando a trava pneumática.\n2. Examine se a ponta interna está carbonizada, deformada ou afunilada pelo calor.\n3. Se danificada, utilize o cortador reto de 90° para retirar 5mm da ponta queimada.\n4. Reinsira o tubo PTFE até o batente final do bico.',
    checklistItems: [
      'Desconectar trava do acoplamento pneumático',
      'Inspecionar queima ou deformação na extremidade do tubo PTFE',
      'Cortar 5mm perfeitamente a 90° com lâmina amolada',
      'Re-inserir tubo PTFE até o encosto cego do bico'
    ]
  },
  {
    id: 'trimestral-eletrica',
    titulo: 'Inspeção Elétrica e Re-aperto dos Bornes de Alimentação',
    periodicidade: 'trimestral',
    periodicidadeRotulo: 'Trimestral (A cada ~500h de impressão)',
    categoria: 'Elétrica & Firmware',
    ferramentas: ['Chave de fenda de precisão / Phillips', 'Lanterna de inspeção'],
    instrucoes: '1. DESLIGUE A IMPRESSORA DA TOMADA E AGUARDE 10 MINUTOS.\n2. Abra a caixa da placa eletrônica mãe e da fonte de alimentação.\n3. Inspecione se os bornes da mesa (Bed) e entrada 24V possuem marcas de amarelamento ou calor.\n4. Aperte com firmeza os parafusos dos bornes para eliminar resistência de contato.',
    checklistItems: [
      'Desconectar cabo de força da tomada elétrica',
      'Abrir compartimento da placa mãe e fonte',
      'Verificar integridade térmica dos fios e conectores',
      'Apertar parafusos de todos os bornes de alta corrente'
    ]
  },
  {
    id: 'anual-pid',
    titulo: 'Calibração de PID do Hotend e da Mesa (Autotune M303)',
    periodicidade: 'anual',
    periodicidadeRotulo: 'Semestral / Anual (~1000h uso)',
    categoria: 'Elétrica & Firmware',
    ferramentas: ['Terminal de Comandos (Pronterface / OctoPrint / Klipper)'],
    instrucoes: '1. Execute a rotina Autotune PID do hotend para 210°C (M303 E0 S210 C8).\n2. Execute Autotune PID da mesa para 60°C (M303 E-1 S60 C8).\n3. Salve os coeficientes Kp, Ki, Kd atualizados na EEPROM (M500 / save_config).\n4. Garante estabilidade térmica evitando falhas de Thermal Runaway.',
    checklistItems: [
      'Executar Autotune PID Hotend a 210°C (8 ciclos)',
      'Executar Autotune PID Mesa a 60°C (8 ciclos)',
      'Gravar novos valores Kp, Ki, Kd na EEPROM (M500)',
      'Verificar curva de temperatura sem flutuações'
    ]
  },
  {
    id: 'anual-bico-novo',
    titulo: 'Troca Preventiva do Bico de Impressão e Pasta Térmica',
    periodicidade: 'anual',
    periodicidadeRotulo: 'Anual (~1000h uso)',
    categoria: 'Extrusora & Hotend',
    ferramentas: ['Bico novo de latão ou aço temperado 0.4mm', 'Pasta Térmica Nitreto de Boro'],
    instrucoes: '1. Remova o bico antigo desgastado a quente.\n2. Limpe a rosca interna do bloco aquecedor.\n3. Aplique uma gota de pasta de nitreto de boro na rosca do bico novo e garganta do termistor.\n4. Instale o bico novo, apertando a quente a 240°C.',
    checklistItems: [
      'Remover bico antigo a quente',
      'Limpar rosca interna do bloco aquecedor',
      'Aplicar pasta térmica de Nitreto de Boro no gargalo e sensores',
      'Instalar bico novo 0.4mm e re-calibrar Z-Offset'
    ]
  },
  {
    id: 'anual-firmware',
    titulo: 'Atualização do Firmware e Backup de Parâmetros',
    periodicidade: 'anual',
    periodicidadeRotulo: 'Anual (~1000h uso)',
    categoria: 'Elétrica & Firmware',
    ferramentas: ['Cartão MicroSD FAT32', 'Firmware oficial mais recente (Marlin/Klipper/Bambu)'],
    instrucoes: '1. Faça backup dos passos de e-steps, Z-Offset e PID atuais.\n2. Baixe o firmware oficial estável atualizado pelo fabricante.\n3. Faça o upload via cartão MicroSD ou Wi-Fi.\n4. Execute o autodiagnóstico completo de sistemas.',
    checklistItems: [
      'Anotar e exportar backup das configurações atuais',
      'Carregar arquivo de firmware atualizado',
      'Concluir processo de atualização de placa e display',
      'Executar bateria de testes de movimentação'
    ]
  }
];

interface ChecklistItem { id: string; descricao: string; concluido: boolean; }
interface PecaItem { id: string; nome: string; quantidade: number; custoUnitario: number; fornecedor?: string; observacao?: string; }

export interface Manutencao {
  id: string;
  impressoraId: number;
  tipo: TipoManutencao;
  titulo: string;
  descricao: string;
  dataProgramada?: string; // YYYY-MM-DD
  dataRealizada?: string;  // ISO
  status: StatusManutencao;
  observacoes?: string;
  checklist: ChecklistItem[];
  pecas: PecaItem[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'bambuzau_manutencoes';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const tipoLabel: Record<TipoManutencao, string> = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
  upgrade: 'Upgrade',
};

const statusMeta: Record<StatusManutencao, { label: string; color: string; bg: string; border: string }> = {
  agendada:     { label: 'Agendada',     color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.35)' },
  em_andamento: { label: 'Em andamento', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.35)' },
  concluida:    { label: 'Concluída',    color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.35)' },
  cancelada:    { label: 'Cancelada',    color: '#9ca3af', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.30)' },
};

const tipoColor: Record<TipoManutencao, string> = {
  preventiva: '#60a5fa',
  corretiva: '#f87171',
  upgrade: '#c084fc',
};

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function loadAll(): Manutencao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveAll(list: Manutencao[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

const emptyForm = (impressoraId?: number): Manutencao => ({
  id: uid(),
  impressoraId: impressoraId ?? 0,
  tipo: 'preventiva',
  titulo: '',
  descricao: '',
  dataProgramada: '',
  dataRealizada: '',
  status: 'agendada',
  observacoes: '',
  checklist: [],
  pecas: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const todayStr = () => new Date().toISOString().slice(0, 10);

interface Props {
  printers: Printer[];
  onUpdatePrinter?: (p: Printer) => void;
}

export const ManutencaoTab: React.FC<Props> = ({ printers, onUpdatePrinter }) => {
  const [items, setItems] = useState<Manutencao[]>(() => loadAll());
  const [activeTab, setActiveTab] = useState<'ordens' | 'guia'>('ordens');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Manutencao | null>(null);
  const [detail, setDetail] = useState<Manutencao | null>(null);
  const [filterPrinter, setFilterPrinter] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StatusManutencao | 'all'>('all');
  const [filterTipo, setFilterTipo] = useState<TipoManutencao | 'all'>('all');

  useEffect(() => { saveAll(items); }, [items]);

  const printerName = (id: number) => printers.find(p => p.id === id)?.name || '—';

  const filtered = useMemo(() => {
    return items
      .filter(m => filterPrinter === 'all' || m.impressoraId === filterPrinter)
      .filter(m => filterStatus === 'all' || m.status === filterStatus)
      .filter(m => filterTipo === 'all' || m.tipo === filterTipo)
      .sort((a, b) => (b.dataProgramada || b.createdAt).localeCompare(a.dataProgramada || a.createdAt));
  }, [items, filterPrinter, filterStatus, filterTipo]);

  const kpis = useMemo(() => {
    const today = todayStr();
    const agendadas = items.filter(m => m.status === 'agendada').length;
    const emAndamento = items.filter(m => m.status === 'em_andamento').length;
    const concluidas = items.filter(m => m.status === 'concluida').length;
    const atrasadas = items.filter(m => m.status !== 'concluida' && m.status !== 'cancelada' && m.dataProgramada && m.dataProgramada < today).length;
    const custoTotal = items
      .filter(m => m.status === 'concluida')
      .reduce((s, m) => s + m.pecas.reduce((ss, p) => ss + (Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0), 0), 0);
    return { agendadas, emAndamento, concluidas, atrasadas, custoTotal };
  }, [items]);

  const openNew = () => { setEditing(emptyForm(printers[0]?.id)); setShowForm(true); };
  const openEdit = (m: Manutencao) => { setEditing({ ...m }); setShowForm(true); };
  const duplicate = (m: Manutencao) => {
    const copy: Manutencao = {
      ...m,
      id: uid(),
      status: 'agendada',
      dataRealizada: '',
      dataProgramada: '',
      checklist: m.checklist.map(c => ({ ...c, id: uid(), concluido: false })),
      pecas: m.pecas.map(p => ({ ...p, id: uid() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditing(copy); setShowForm(true); setDetail(null);
  };

  const createFromGuiaItem = (guia: GuiaManutencaoItem, printerId?: number) => {
    const selectedPrinter = printerId ?? printers[0]?.id ?? 0;
    const newForm: Manutencao = {
      ...emptyForm(selectedPrinter),
      tipo: 'preventiva',
      titulo: `[${guia.periodicidadeRotulo.split(' ')[0]}] ${guia.titulo}`,
      descricao: `CATEGORIA: ${guia.categoria}\nPERIODICIDADE: ${guia.periodicidadeRotulo}\n\nFERRAMENTAS NECESSÁRIAS:\n• ${guia.ferramentas.join('\n• ')}\n\nINSTRUÇÕES DETALHADAS:\n${guia.instrucoes}`,
      checklist: guia.checklistItems.map(c => ({ id: uid(), descricao: c, concluido: false })),
    };
    setEditing(newForm);
    setShowForm(true);
    setActiveTab('ordens');
  };

  const createProtocoloCompleto = (pKey: 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'anual', printerId?: number) => {
    const itemsGuia = GUIA_MANUTENCAO_MESTRE.filter(g => g.periodicidade === pKey);
    if (itemsGuia.length === 0) return;
    const selectedPrinter = printerId ?? printers[0]?.id ?? 0;
    const rotuloMap = {
      diaria: 'Diário (~10h)',
      semanal: 'Semanal (~50h)',
      mensal: 'Mensal (~200h)',
      trimestral: 'Trimestral (~500h)',
      anual: 'Anual (~1000h)'
    };
    const newForm: Manutencao = {
      ...emptyForm(selectedPrinter),
      tipo: 'preventiva',
      titulo: `Protocolo de Manutenção Preventiva ${rotuloMap[pKey]}`,
      descricao: `PROTOCOLO COMPLETO DE PREVENÇÃO - ${rotuloMap[pKey].toUpperCase()}\n\nEste checklist consolida todas as rotinas oficiais recomendadas para a periodicidade ${rotuloMap[pKey]}.\n\nTAREFAS E PROCEDIMENTOS INCLUÍDOS:\n` + itemsGuia.map(i => `• ${i.titulo} (${i.categoria})`).join('\n'),
      checklist: itemsGuia.flatMap(i => i.checklistItems.map(c => ({ id: uid(), descricao: `[${i.categoria}] ${c}`, concluido: false }))),
    };
    setEditing(newForm);
    setShowForm(true);
    setActiveTab('ordens');
  };

  const save = (m: Manutencao) => {
    const next: Manutencao = {
      ...m,
      updatedAt: new Date().toISOString(),
      status: m.dataRealizada ? 'concluida' : m.status,
    };
    setItems(prev => {
      const exists = prev.some(x => x.id === next.id);
      return exists ? prev.map(x => (x.id === next.id ? next : x)) : [next, ...prev];
    });
    setShowForm(false); setEditing(null);
  };

  const toggleChecklistInDetail = (itemId: string, checkId: string) => {
    setItems(prev => prev.map(m => {
      if (m.id !== itemId) return m;
      const nextCheck = m.checklist.map(c => c.id === checkId ? { ...c, concluido: !c.concluido } : c);
      const updated = { ...m, checklist: nextCheck, updatedAt: new Date().toISOString() };
      if (detail && detail.id === itemId) {
        setDetail(updated);
      }
      return updated;
    }));
  };

  const remove = (id: string) => {
    if (!window.confirm('Excluir esta manutenção? Esta ação não pode ser desfeita.')) return;
    setItems(prev => prev.filter(x => x.id !== id));
    setDetail(null);
  };

  const changeStatus = (m: Manutencao, status: StatusManutencao) => {
    const next: Manutencao = {
      ...m,
      status,
      dataRealizada: status === 'concluida' ? new Date().toISOString() : (status === 'agendada' ? '' : m.dataRealizada),
      updatedAt: new Date().toISOString(),
    };
    setItems(prev => prev.map(x => (x.id === m.id ? next : x)));
    setDetail(next);
    // sincroniza com a impressora
    if (onUpdatePrinter) {
      const p = printers.find(pp => pp.id === m.impressoraId);
      if (p) {
        if (status === 'em_andamento' && p.status !== 'MAINTENANCE') {
          onUpdatePrinter({ ...p, status: 'MAINTENANCE' });
        } else if (status === 'concluida' && p.status === 'MAINTENANCE') {
          onUpdatePrinter({ ...p, status: 'IDLE', lastWeeklyMaintenance: Date.now() });
        }
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#b7ff00]/80">
            <Wrench className="w-3.5 h-3.5" /> Manutenção de Impressoras 3D
          </div>
          <h2 className="text-2xl font-light text-white mt-1">Gestão de manutenções, checklists e procedimentos</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('ordens')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'ordens' ? 'bg-[#b7ff00] text-black' : 'text-white/70 hover:text-white'}`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Ordens & Histórico
            </button>
            <button
              onClick={() => setActiveTab('guia')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'guia' ? 'bg-[#b7ff00] text-black' : 'text-white/70 hover:text-white'}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Guia Mestre & Checklists
            </button>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b7ff00] text-black text-sm font-semibold hover:bg-[#a3e600] transition"
          >
            <Plus className="w-4 h-4" /> Nova Manutenção
          </button>
        </div>
      </div>

      {activeTab === 'guia' ? (
        <GuiaCompletoView
          printers={printers}
          onCreateItem={createFromGuiaItem}
          onCreateProtocolo={createProtocoloCompleto}
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Agendadas', value: kpis.agendadas, color: '#60a5fa', icon: Calendar },
              { label: 'Em andamento', value: kpis.emAndamento, color: '#fbbf24', icon: Clock },
              { label: 'Concluídas', value: kpis.concluidas, color: '#34d399', icon: CheckCircle2 },
              { label: 'Atrasadas', value: kpis.atrasadas, color: '#f87171', icon: AlertTriangle },
              { label: 'Custo total (concl.)', value: fmt(kpis.custoTotal), color: '#c084fc', icon: Package },
            ].map((k, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl p-4 bg-white/[0.03] border border-white/10">
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
                  style={{ background: k.color }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">{k.label}</span>
                  <k.icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
                <div className="mt-2 text-xl font-light text-white tabular-nums">{k.value}</div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center bg-white/[0.02] border border-white/10 rounded-2xl p-3">
            <select
              value={filterPrinter === 'all' ? 'all' : String(filterPrinter)}
              onChange={(e) => setFilterPrinter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5"
            >
              <option value="all">Todas as impressoras</option>
              {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5"
            >
              <option value="all">Todos os status</option>
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5"
            >
              <option value="all">Todos os tipos</option>
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
              <option value="upgrade">Upgrade</option>
            </select>
            <span className="text-xs text-white/40 ml-auto">{filtered.length} registro(s)</span>
          </div>

          {/* Lista */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
              <Wrench className="w-8 h-8 mx-auto text-white/30" />
              <p className="mt-3 text-white/60 text-sm">Nenhuma manutenção registrada. Comece agendando uma preventiva!</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button onClick={openNew} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#b7ff00] text-black text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Criar personalizada
                </button>
                <button onClick={() => setActiveTab('guia')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20">
                  <BookOpen className="w-4 h-4 text-[#b7ff00]" /> Ver Guia & Checklists
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-white/50 text-[10px] uppercase tracking-[0.18em]">
                  <tr>
                    <th className="px-4 py-3 text-left">Impressora</th>
                    <th className="px-4 py-3 text-left">Título</th>
                    <th className="px-4 py-3 text-left">Checklist</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Programada</th>
                    <th className="px-4 py-3 text-left">Realizada</th>
                    <th className="px-4 py-3 text-right">Custo</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const total = m.pecas.reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0), 0);
                    const st = statusMeta[m.status];
                    const overdue = m.status !== 'concluida' && m.status !== 'cancelada' && m.dataProgramada && m.dataProgramada < todayStr();
                    const checkDone = m.checklist.filter(c => c.concluido).length;
                    const checkTotal = m.checklist.length;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setDetail(m)}
                        className="border-t border-white/5 hover:bg-white/[0.04] cursor-pointer transition"
                      >
                        <td className="px-4 py-3 text-white/90 font-medium">{printerName(m.impressoraId)}</td>
                        <td className="px-4 py-3 text-white font-medium">{m.titulo || <span className="text-white/40 italic">sem título</span>}</td>
                        <td className="px-4 py-3">
                          {checkTotal > 0 ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${checkDone === checkTotal ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-white/70'}`}>
                              {checkDone}/{checkTotal} ({Math.round((checkDone / checkTotal) * 100)}%)
                            </span>
                          ) : (
                            <span className="text-xs text-white/30 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold" style={{ color: tipoColor[m.tipo] }}>{tipoLabel[m.tipo]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-md border"
                            style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          {m.dataProgramada ? (
                            <span className={overdue ? 'text-red-400 font-semibold' : ''}>
                              {new Date(m.dataProgramada + 'T00:00:00').toLocaleDateString('pt-BR')}
                              {overdue && ' • atrasada'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          {m.dataRealizada ? new Date(m.dataRealizada).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-white/90 tabular-nums">{fmt(total)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); remove(m.id); }}
                            className="p-1.5 rounded-md text-white/50 hover:text-red-400 hover:bg-red-500/10"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Form modal */}
      {showForm && editing && (
        <MaintenanceForm
          initial={editing}
          printers={printers}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={save}
        />
      )}

      {/* Detail modal */}
      {detail && (
        <DetailModal
          item={detail}
          printerName={printerName(detail.impressoraId)}
          onClose={() => setDetail(null)}
          onEdit={() => { openEdit(detail); setDetail(null); }}
          onDuplicate={() => duplicate(detail)}
          onDelete={() => remove(detail.id)}
          onStatus={(s) => changeStatus(detail, s)}
          onToggleCheck={(checkId) => toggleChecklistInDetail(detail.id, checkId)}
        />
      )}
    </div>
  );
};

// ---------- Guia Completo e Checklist Mestre View ----------
const GuiaCompletoView: React.FC<{
  printers: Printer[];
  onCreateItem: (guia: GuiaManutencaoItem, printerId?: number) => void;
  onCreateProtocolo: (pKey: 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'anual', printerId?: number) => void;
}> = ({ printers, onCreateItem, onCreateProtocolo }) => {
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('diaria-mesa');
  const [selectedPrinterId, setSelectedPrinterId] = useState<number>(printers[0]?.id || 0);

  const filteredGuia = useMemo(() => {
    return GUIA_MANUTENCAO_MESTRE.filter(g => {
      const matchP = filterPeriod === 'all' || g.periodicidade === filterPeriod;
      const matchC = filterCat === 'all' || g.categoria === filterCat;
      return matchP && matchC;
    });
  }, [filterPeriod, filterCat]);

  return (
    <div className="space-y-6">
      {/* Banner / Selector de Impressora Alvo */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black to-black border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#b7ff00]">
            <Sparkles className="w-4 h-4" /> Protocolos Técnicos Preventivos
          </div>
          <h3 className="text-lg font-light text-white mt-1">Guia completo de manutenções periódicas para impressoras 3D</h3>
          <p className="text-xs text-white/60 mt-0.5">Procedimentos explicados passo a passo com ferramentas necessárias e periodicidade recomendada.</p>
        </div>
        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-2">
          <span className="text-xs text-white/60">Impressora alvo:</span>
          <select
            value={selectedPrinterId}
            onChange={(e) => setSelectedPrinterId(Number(e.target.value))}
            className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
          >
            {printers.map(p => <option key={p.id} value={p.id} className="bg-[#0b0d0a] text-white">{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Protocolos rápidos / Pre-sets */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3 flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#b7ff00]" /> Agendar Protocolo de Manutenção Preventiva Completo
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'diaria', label: 'Diário (~10h)', sub: 'Mesa, Bico e Tubo PTFE', color: '#60a5fa' },
            { key: 'semanal', label: 'Semanal (~50h)', sub: 'Eixos Z, Correias e Trilhos', color: '#34d399' },
            { key: 'mensal', label: 'Mensal (~200h)', sub: 'Extrusora, Ventoinhas e Mesa', color: '#fbbf24' },
            { key: 'trimestral', label: 'Trimestral (~500h)', sub: 'Bico a Quente, PTFE e Eletrônica', color: '#c084fc' },
            { key: 'anual', label: 'Anual (~1000h)', sub: 'Autotune PID, Bico e Firmware', color: '#f87171' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => onCreateProtocolo(p.key as any, selectedPrinterId)}
              className="text-left p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#b7ff00]/50 hover:bg-white/[0.06] transition group"
            >
              <div className="text-xs font-semibold text-white group-hover:text-[#b7ff00] transition">{p.label}</div>
              <div className="text-[11px] text-white/50 mt-1">{p.sub}</div>
              <div className="mt-2 text-[10px] text-[#b7ff00] flex items-center gap-1 font-medium">
                <Plus className="w-3 h-3" /> Gerar Checklist
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros do Guia */}
      <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <BookOpen className="w-3.5 h-3.5" /> Filtrar Procedimentos:
        </div>
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none"
        >
          <option value="all">Todas as Periodicidades</option>
          <option value="diaria">Diária (~10h)</option>
          <option value="semanal">Semanal (~50h)</option>
          <option value="mensal">Mensal (~200h)</option>
          <option value="trimestral">Trimestral (~500h)</option>
          <option value="anual">Anual (~1000h)</option>
        </select>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none"
        >
          <option value="all">Todas as Categorias</option>
          <option value="Mesa & Adesão">Mesa & Adesão</option>
          <option value="Extrusora & Hotend">Extrusora & Hotend</option>
          <option value="Eixos & Lubrificação">Eixos & Lubrificação</option>
          <option value="Estrutura & Correias">Estrutura & Correias</option>
          <option value="Elétrica & Firmware">Elétrica & Firmware</option>
        </select>
        <span className="text-xs text-white/40 ml-auto">{filteredGuia.length} procedimento(s) encontrado(s)</span>
      </div>

      {/* Accordion de Procedimentos de Manutenção */}
      <div className="space-y-3">
        {filteredGuia.map((g) => {
          const isExpanded = expandedId === g.id;
          return (
            <div key={g.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden transition">
              <div
                onClick={() => setExpandedId(isExpanded ? null : g.id)}
                className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.03] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#b7ff00]">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-medium text-white">{g.titulo}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {g.periodicidadeRotulo}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {g.categoria}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 mt-1 flex items-center gap-2">
                      <span>Ferramentas: {g.ferramentas.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateItem(g, selectedPrinterId);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#b7ff00] text-black text-xs font-semibold hover:bg-[#a3e600] transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar Ordem
                  </button>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 border-t border-white/10 bg-black/40 space-y-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-[#b7ff00]" /> Ferramentas e Materiais Necessários:
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {g.ferramentas.map((f, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/80">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-blue-400" /> Passo a Passo e Instruções de Execução:
                    </div>
                    <div className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5 font-mono">
                      {g.instrucoes}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3 text-emerald-400" /> Checklist Mestre Padrão ({g.checklistItems.length} itens):
                    </div>
                    <div className="space-y-1 mt-1">
                      {g.checklistItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-white/80 bg-white/[0.02] px-2.5 py-1.5 rounded-md border border-white/5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Form ----------
const MaintenanceForm: React.FC<{
  initial: Manutencao;
  printers: Printer[];
  onCancel: () => void;
  onSave: (m: Manutencao) => void;
}> = ({ initial, printers, onCancel, onSave }) => {
  const [m, setM] = useState<Manutencao>(initial);
  const set = <K extends keyof Manutencao>(k: K, v: Manutencao[K]) => setM(prev => ({ ...prev, [k]: v }));

  const total = m.pecas.reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0), 0);

  const aplicarPreset = (presetKey: string) => {
    if (!presetKey) return;
    if (presetKey.startsWith('p-')) {
      const pKey = presetKey.replace('p-', '') as 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'anual';
      const itemsGuia = GUIA_MANUTENCAO_MESTRE.filter(g => g.periodicidade === pKey);
      const rotuloMap = { diaria: 'Diário (~10h)', semanal: 'Semanal (~50h)', mensal: 'Mensal (~200h)', trimestral: 'Trimestral (~500h)', anual: 'Anual (~1000h)' };
      setM(prev => ({
        ...prev,
        tipo: 'preventiva',
        titulo: `Protocolo de Manutenção Preventiva ${rotuloMap[pKey]}`,
        descricao: `PROTOCOLO INTEGRAL DE PREVENÇÃO - ${rotuloMap[pKey].toUpperCase()}\n\nControle de qualidade e calibração de rotina.\n\nTAREFAS INCLUÍDAS:\n` + itemsGuia.map(i => `• ${i.titulo}`).join('\n'),
        checklist: itemsGuia.flatMap(i => i.checklistItems.map(c => ({ id: uid(), descricao: `[${i.categoria}] ${c}`, concluido: false })))
      }));
    } else if (presetKey.startsWith('g-')) {
      const gId = presetKey.replace('g-', '');
      const guia = GUIA_MANUTENCAO_MESTRE.find(g => g.id === gId);
      if (guia) {
        setM(prev => ({
          ...prev,
          tipo: 'preventiva',
          titulo: `[${guia.periodicidadeRotulo.split(' ')[0]}] ${guia.titulo}`,
          descricao: `CATEGORIA: ${guia.categoria}\nPERIODICIDADE: ${guia.periodicidadeRotulo}\n\nFERRAMENTAS NECESSÁRIAS:\n• ${guia.ferramentas.join('\n• ')}\n\nINSTRUÇÕES DETALHADAS:\n${guia.instrucoes}`,
          checklist: guia.checklistItems.map(c => ({ id: uid(), descricao: c, concluido: false }))
        }));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0b0d0a] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#b7ff00]" />
            <h3 className="text-lg font-light text-white">Ordem de Manutenção</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-white/10 text-white/60"><X className="w-5 h-5" /></button>
        </div>

        {/* Preset Selector */}
        <div className="mb-4 p-3 rounded-xl bg-[#b7ff00]/10 border border-[#b7ff00]/30">
          <label className="block text-xs font-semibold text-[#b7ff00] mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Carregar Protocolo ou Checklist Predefinido:
          </label>
          <select
            onChange={(e) => aplicarPreset(e.target.value)}
            defaultValue=""
            className="w-full bg-black/60 border border-white/15 text-white text-xs rounded-lg px-3 py-2 outline-none cursor-pointer"
          >
            <option value="" disabled>-- Selecione para preencher automaticamente --</option>
            <optgroup label="Protocolos Completos por Periodicidade">
              <option value="p-diaria">Protocolo Completo Diário (~10h)</option>
              <option value="p-semanal">Protocolo Completo Semanal (~50h)</option>
              <option value="p-mensal">Protocolo Completo Mensal (~200h)</option>
              <option value="p-trimestral">Protocolo Completo Trimestral (~500h)</option>
              <option value="p-anual">Protocolo Completo Anual (~1000h)</option>
            </optgroup>
            <optgroup label="Procedimentos Individuais">
              {GUIA_MANUTENCAO_MESTRE.map(g => (
                <option key={g.id} value={`g-${g.id}`}>
                  [{g.periodicidadeRotulo.split(' ')[0]}] {g.titulo}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Impressora *">
            <select
              value={m.impressoraId}
              onChange={(e) => set('impressoraId', Number(e.target.value))}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value={0} disabled>Selecione…</option>
              {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Tipo *">
            <select
              value={m.tipo}
              onChange={(e) => set('tipo', e.target.value as TipoManutencao)}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
              <option value="upgrade">Upgrade</option>
            </select>
          </Field>
          <Field label="Título *">
            <input
              value={m.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              placeholder="Ex: Troca de bico 0.4mm"
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            />
          </Field>
          <Field label="Status">
            <select
              value={m.status}
              onChange={(e) => set('status', e.target.value as StatusManutencao)}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </Field>
          <Field label="Data programada">
            <input
              type="date"
              value={m.dataProgramada || ''}
              onChange={(e) => set('dataProgramada', e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            />
          </Field>
          <Field label="Data realizada">
            <input
              type="date"
              value={m.dataRealizada ? m.dataRealizada.slice(0, 10) : ''}
              onChange={(e) => set('dataRealizada', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            />
          </Field>
        </div>

        <Field label="Descrição / procedimento" className="mt-4">
          <textarea
            value={m.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            rows={4}
            placeholder="Passo a passo, observações técnicas…"
            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
          />
        </Field>

        {/* Checklist */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/50">Checklist</span>
            <button
              onClick={() => set('checklist', [...m.checklist, { id: uid(), descricao: '', concluido: false }])}
              className="text-xs flex items-center gap-1 text-[#b7ff00] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar item
            </button>
          </div>
          <div className="space-y-1.5">
            {m.checklist.length === 0 && <p className="text-xs text-white/40 italic">Sem itens.</p>}
            {m.checklist.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={c.concluido}
                  onChange={(e) => {
                    const next = [...m.checklist];
                    next[i] = { ...c, concluido: e.target.checked };
                    set('checklist', next);
                  }}
                  className="accent-[#b7ff00]"
                />
                <input
                  value={c.descricao}
                  onChange={(e) => {
                    const next = [...m.checklist];
                    next[i] = { ...c, descricao: e.target.value };
                    set('checklist', next);
                  }}
                  placeholder="Ex: Verificar tensão das correias"
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                />
                <button
                  onClick={() => set('checklist', m.checklist.filter(x => x.id !== c.id))}
                  className="p-1 text-white/40 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Peças */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/50">Peças utilizadas</span>
            <button
              onClick={() => set('pecas', [...m.pecas, { id: uid(), nome: '', quantidade: 1, custoUnitario: 0 }])}
              className="text-xs flex items-center gap-1 text-[#b7ff00] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar peça
            </button>
          </div>
          {m.pecas.length === 0 ? (
            <p className="text-xs text-white/40 italic">Sem peças cadastradas.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.04] text-white/50">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Nome</th>
                    <th className="px-2 py-1.5 text-right w-20">Qtd</th>
                    <th className="px-2 py-1.5 text-right w-28">Custo unit.</th>
                    <th className="px-2 py-1.5 text-left">Fornecedor</th>
                    <th className="px-2 py-1.5 text-right w-24">Subtotal</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {m.pecas.map((p, i) => (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-2 py-1">
                        <input
                          value={p.nome}
                          onChange={(e) => { const n = [...m.pecas]; n[i] = { ...p, nome: e.target.value }; set('pecas', n); }}
                          placeholder="Ex: Bico 0.4mm"
                          className="w-full bg-transparent text-white text-sm outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number" step="0.01" value={p.quantidade}
                          onChange={(e) => { const n = [...m.pecas]; n[i] = { ...p, quantidade: Number(e.target.value) }; set('pecas', n); }}
                          className="w-full bg-black/30 border border-white/10 rounded px-1.5 py-1 text-white text-sm text-right"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number" step="0.01" value={p.custoUnitario}
                          onChange={(e) => { const n = [...m.pecas]; n[i] = { ...p, custoUnitario: Number(e.target.value) }; set('pecas', n); }}
                          className="w-full bg-black/30 border border-white/10 rounded px-1.5 py-1 text-white text-sm text-right"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={p.fornecedor || ''}
                          onChange={(e) => { const n = [...m.pecas]; n[i] = { ...p, fornecedor: e.target.value }; set('pecas', n); }}
                          placeholder="—"
                          className="w-full bg-transparent text-white text-sm outline-none"
                        />
                      </td>
                      <td className="px-2 py-1 text-right text-white tabular-nums">
                        {fmt((Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0))}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button onClick={() => set('pecas', m.pecas.filter(x => x.id !== p.id))} className="text-white/40 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/10 bg-white/[0.03]">
                    <td colSpan={4} className="px-2 py-1.5 text-right text-white/60 uppercase tracking-wider text-[10px]">Custo total</td>
                    <td className="px-2 py-1.5 text-right text-white font-semibold tabular-nums">{fmt(total)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Field label="Observações" className="mt-4">
          <textarea
            value={m.observacoes || ''}
            onChange={(e) => set('observacoes', e.target.value)}
            rows={2}
            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
          />
        </Field>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5">Cancelar</button>
          <button
            onClick={() => {
              if (!m.impressoraId) { alert('Selecione uma impressora.'); return; }
              if (!m.titulo.trim()) { alert('Informe o título.'); return; }
              onSave(m);
            }}
            className="px-4 py-2 rounded-lg bg-[#b7ff00] text-black text-sm font-semibold hover:bg-[#a3e600]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="block text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1">{label}</span>
    {children}
  </label>
);

// ---------- Detail ----------
const DetailModal: React.FC<{
  item: Manutencao;
  printerName: string;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStatus: (s: StatusManutencao) => void;
  onToggleCheck?: (checkId: string) => void;
}> = ({ item, printerName, onClose, onEdit, onDuplicate, onDelete, onStatus, onToggleCheck }) => {
  const total = item.pecas.reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0), 0);
  const st = statusMeta[item.status];
  const doneCount = item.checklist.filter(c => c.concluido).length;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0b0d0a] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Wrench className="w-3.5 h-3.5" /> {printerName} · {tipoLabel[item.tipo]}
            </div>
            <h3 className="text-xl font-light text-white mt-1">{item.titulo}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10 text-white/60"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold px-2 py-1 rounded-md border"
            style={{ color: st.color, background: st.bg, borderColor: st.border }}>
            {st.label}
          </span>
          {item.dataProgramada && (
            <span className="text-xs text-white/60">Programada: {new Date(item.dataProgramada + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
          )}
          {item.dataRealizada && (
            <span className="text-xs text-white/60">Realizada: {new Date(item.dataRealizada).toLocaleDateString('pt-BR')}</span>
          )}
        </div>

        {item.descricao && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Descrição</div>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{item.descricao}</p>
          </div>
        )}

        {item.checklist.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mb-2 flex items-center justify-between">
              <span>Checklist ({doneCount}/{item.checklist.length} concluídos)</span>
              <span className="text-[10px] text-[#b7ff00]/80">Clique no item para marcar como concluído</span>
            </div>
            <div className="space-y-1">
              {item.checklist.map(c => (
                <button
                  key={c.id}
                  onClick={() => onToggleCheck && onToggleCheck(c.id)}
                  className="w-full text-left flex items-center gap-2.5 text-sm p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition cursor-pointer"
                >
                  {c.concluido
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <Circle className="w-4 h-4 text-white/30 shrink-0" />}
                  <span className={c.concluido ? 'text-white/50 line-through' : 'text-white/90 font-medium'}>{c.descricao}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {item.pecas.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mb-2">Peças ({fmt(total)})</div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.04] text-white/50">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Nome</th>
                    <th className="px-2 py-1.5 text-right">Qtd</th>
                    <th className="px-2 py-1.5 text-right">Custo unit.</th>
                    <th className="px-2 py-1.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {item.pecas.map(p => (
                    <tr key={p.id} className="border-t border-white/5 text-white/90">
                      <td className="px-2 py-1.5">{p.nome}{p.fornecedor && <span className="text-white/40 ml-1">· {p.fornecedor}</span>}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{p.quantidade}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(p.custoUnitario)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt((Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {item.observacoes && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1">Observações</div>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{item.observacoes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
          {item.status === 'agendada' && (
            <button onClick={() => onStatus('em_andamento')} className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25">
              <Clock className="w-3.5 h-3.5 inline mr-1" /> Iniciar
            </button>
          )}
          {item.status !== 'concluida' && item.status !== 'cancelada' && (
            <button onClick={() => onStatus('concluida')} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Concluir
            </button>
          )}
          <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10">Editar</button>
          <button onClick={onDuplicate} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10">
            <Copy className="w-3.5 h-3.5 inline mr-1" /> Duplicar
          </button>
          <button onClick={onDelete} className="ml-auto px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/20">
            <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManutencaoTab;