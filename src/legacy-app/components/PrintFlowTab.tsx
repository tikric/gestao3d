// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrintOrder, Printer, FilamentStock } from '../types';
import { 
  Plus, 
  Trash2, 
  Check, 
  RotateCw, 
  Clock, 
  AlertCircle, 
  Printer as PrinterIcon, 
  Tag, 
  X, 
  ChevronRight,
  ClipboardList,
  PlayCircle,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import { initialCatalogItems } from '../utils/initialData';

// Helper labels translation mapping
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'WAITING': return "Ag. Arquivo";
    case 'QUEUE': return "Aguardando Aceite";
    case 'PRINTING': return "Imprimindo";
    case 'POST_PROCESS': return "Acabamento";
    case 'READY': return "Pronto";
    case 'DELIVERED': return "Entregue";
    default: return status;
  }
};

const getNextStatusActionLabel = (status: string): string => {
  switch (status) {
    case 'WAITING': return "Estudo/Fila";
    case 'QUEUE': return "Iniciar Impressão";
    case 'PRINTING': return "Ir p/ Acabamento";
    case 'POST_PROCESS': return "Marcar Pronto";
    case 'READY': return "Marcar Entregue";
    default: return "";
  }
};

const getNextStatusValue = (status: string): string | null => {
  switch (status) {
    case 'WAITING': return "QUEUE";
    case 'QUEUE': return "PRINTING";
    case 'PRINTING': return "POST_PROCESS";
    case 'POST_PROCESS': return "READY";
    case 'READY': return "DELIVERED";
    default: return null;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'WAITING': return '#90A4AE';
    case 'QUEUE': return 'var(--brand-accent)';
    case 'PRINTING': return 'var(--brand-primary)';
    case 'POST_PROCESS': return 'var(--brand-accent)';
    case 'READY': return 'var(--brand-primary)';
    case 'DELIVERED': return 'var(--brand-primary)';
    default: return 'var(--brand-muted)';
  }
};

interface PrintFlowTabProps {
  orders: PrintOrder[];
  printers: Printer[];
  filamentStocks: FilamentStock[];
  clients: Array<{ id: number; name: string }>;
  onAddOrder: (order: Partial<PrintOrder>) => void;
  onUpdateOrder: (id: number, updated: Partial<PrintOrder>) => void;
  onDeleteOrder: (id: number) => void;
  onSimulateTick: () => void;
  onUpdateFilament?: (id: number, updated: Partial<FilamentStock>) => void;
}

export const PrintFlowTab: React.FC<PrintFlowTabProps> = ({
  orders,
  printers,
  filamentStocks,
  clients,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onSimulateTick,
  onUpdateFilament
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [catalogItems, setCatalogItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bambuzau_local_catalog_production');
      return saved ? JSON.parse(saved) : initialCatalogItems;
    } catch (e) {
      console.warn("Failed to parse catalog items inside PrintFlowTab, returning defaults", e);
      return initialCatalogItems;
    }
  });

  useEffect(() => {
    localStorage.setItem('bambuzau_local_catalog_production', JSON.stringify(catalogItems));
  }, [catalogItems]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PrintOrder | null>(null);
  const [quickPrintOrder, setQuickPrintOrder] = useState<PrintOrder | null>(null);

  // Form Fields State
  const [formClientId, setFormClientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [formItemName, setFormItemName] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formFilamentType, setFormFilamentType] = useState<string>('PLA');
  const [formFilamentColor, setFormFilamentColor] = useState<string>('');
  const [formWeightGrams, setFormWeightGrams] = useState<number>(100);
  const [formPrintTime, setFormPrintTime] = useState<number>(3);
  const [formPriceCharged, setFormPriceCharged] = useState<number>(50);
  const [formPlatform, setFormPlatform] = useState<string>('MANUAL');
  const [formStatus, setFormStatus] = useState<string>('QUEUE');
  const [formPrinterId, setFormPrinterId] = useState<string>('');
  const [deadlineDays, setDeadlineDays] = useState<number>(2);

  const availableColors = filamentStocks
    .filter(f => f.type === formFilamentType)
    .map(f => f.color);

  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(formFilamentColor)) {
      setFormFilamentColor(availableColors[0]);
    }
  }, [formFilamentType]);

  const handleOpenAddDialog = () => {
    setEditingOrder(null);
    setFormClientId(clients.length > 0 ? clients[0].id.toString() : '');
    setCustomClientName('');
    setFormItemName('');
    setFormQuantity(1);
    setFormFilamentType('PLA');
    const cols = filamentStocks.filter(f => f.type === 'PLA');
    setFormFilamentColor(cols.length > 0 ? cols[0].color : '');
    setFormWeightGrams(100);
    setFormPrintTime(3.0);
    setFormPriceCharged(50.0);
    setFormPlatform('MANUAL');
    setFormStatus('QUEUE');
    setFormPrinterId('');
    setDeadlineDays(2);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (order: PrintOrder) => {
    setEditingOrder(order);
    if (order.clientId) {
      setFormClientId(order.clientId.toString());
      setCustomClientName('');
    } else {
      setFormClientId('CUSTOM');
      setCustomClientName(order.clientName);
    }
    setFormItemName(order.itemName);
    setFormQuantity(order.quantity);
    setFormFilamentType(order.filamentType);
    setFormFilamentColor(order.filamentColor);
    setFormWeightGrams(order.weightGrams);
    setFormPrintTime(order.printTimeHours);
    setFormPriceCharged(order.priceCharged);
    setFormPlatform(order.platformSource);
    setFormStatus(order.status);
    setFormPrinterId(order.assignedPrinterId ? order.assignedPrinterId.toString() : '');
    const days = Math.max(1, Math.round((order.deadline - order.createdAt) / (24 * 3600 * 1000)));
    setDeadlineDays(days);
    setIsDialogOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    let clientNameFinal = '';
    let clientIdFinal: number | null = null;

    if (formClientId === 'CUSTOM') {
      clientNameFinal = customClientName.trim();
      if (!clientNameFinal) {
        alert('Por favor, informe o nome do novo cliente!');
        return;
      }
    } else {
      const selected = clients.find(c => c.id === parseInt(formClientId));
      if (selected) {
        clientNameFinal = selected.name;
        clientIdFinal = selected.id;
      } else {
        clientNameFinal = 'Mão Livre';
      }
    }

    if (!formItemName.trim()) {
      alert('Por favor, digite o nome do item 3D!');
      return;
    }

    const payload: Partial<PrintOrder> = {
      clientId: clientIdFinal,
      clientName: clientNameFinal,
      itemName: formItemName.trim(),
      quantity: formQuantity,
      filamentType: formFilamentType,
      filamentColor: formFilamentColor,
      weightGrams: formWeightGrams,
      printTimeHours: formPrintTime,
      priceCharged: formPriceCharged,
      platformSource: formPlatform as any,
      status: formStatus as any,
      assignedPrinterId: formStatus === 'PRINTING' && formPrinterId ? parseInt(formPrinterId) : null,
      printerName: formStatus === 'PRINTING' && formPrinterId ? printers.find(p => p.id === parseInt(formPrinterId))?.name : '',
      printingProgress: formStatus === 'PRINTING' ? (editingOrder?.printingProgress || 0.1) : (formStatus === 'WAITING' || formStatus === 'QUEUE' ? 0.0 : 1.0),
      deadline: Date.now() + deadlineDays * 24 * 3600 * 1000
    };

    if (editingOrder) {
      onUpdateOrder(editingOrder.id, payload);
    } else {
      onAddOrder({
        ...payload,
        createdAt: Date.now(),
        printingProgress: formStatus === 'PRINTING' ? 0.1 : 0.0
      });
    }
    setIsDialogOpen(false);
  };

  const handleFastStatusAdvance = (order: PrintOrder, nextStatus: string) => {
    if (nextStatus === 'PRINTING') {
      const idlePrinters = printers.filter(p => p.status === 'IDLE');
      if (idlePrinters.length > 0) {
        const defaultPrinter = idlePrinters[0];
        onUpdateOrder(order.id, {
          status: 'PRINTING',
          assignedPrinterId: defaultPrinter.id,
          printerName: defaultPrinter.name,
          printingProgress: 0.05
        });
      } else {
        setQuickPrintOrder(order);
      }
    } else {
      onUpdateOrder(order.id, {
        status: nextStatus as any,
        printingProgress: nextStatus === 'POST_PROCESS' || nextStatus === 'READY' || nextStatus === 'DELIVERED' ? 1.0 : 0.0
      });
    }
  };

  const handleSelectPrinterQuick = (printerId: number) => {
    if (!quickPrintOrder) return;
    const printerObj = printers.find(p => p.id === printerId);
    onUpdateOrder(quickPrintOrder.id, {
      status: 'PRINTING',
      assignedPrinterId: printerId,
      printerName: printerObj ? printerObj.name : 'Impressora',
      printingProgress: 0.05
    });
    setQuickPrintOrder(null);
  };

  const handleIncreaseFilament = (stockId: number, currentGrams: number) => {
    if (onUpdateFilament) {
      onUpdateFilament(stockId, { stockGrams: currentGrams + 1000 });
    }
  };

  const handleProduceDeficitItem = (item: any) => {
    onAddOrder({
      clientName: 'Estoque Interno',
      itemName: `${item.name} (Reposição)`,
      quantity: 1,
      filamentType: item.filamentType,
      filamentColor: 'Preto Carbono',
      weightGrams: item.weightGrams,
      printTimeHours: item.printTimeHours,
      priceCharged: item.defaultPrice,
      platformSource: 'MANUAL',
      status: 'QUEUE',
      printingProgress: 0.0,
      createdAt: Date.now(),
      deadline: Date.now() + 2 * 24 * 3600 * 1000
    });

    setCatalogItems((prev: any[]) => prev.map((c: any) => 
      c.id === item.id ? { ...c, stockCount: c.stockCount + 1 } : c
    ));
  };

  const totalOrdersCount = orders.length;
  const printingCount = orders.filter(o => o.status === 'PRINTING').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.priceCharged, 0);
  const readyAndDeliveredCount = orders.filter(o => o.status === 'READY' || o.status === 'DELIVERED').length;

  const lowFilaments = filamentStocks.filter(f => f.stockGrams < f.minStockGrams);
  const lowCatalogItems = catalogItems.filter((c: any) => c.stockCount < c.minStockCount);

  const filterOptions = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'WAITING', label: 'Aguard. Arq' },
    { key: 'QUEUE', label: 'NaFila' },
    { key: 'PRINTING', label: 'Imprimindo' },
    { key: 'POST_PROCESS', label: 'Pós-Proc' },
    { key: 'READY', label: 'Pronto' },
    { key: 'DELIVERED', label: 'Entregue' }
  ];

  const filteredOrders = orders.filter(order => {
    if (selectedFilter !== 'TODOS' && order.status !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return order.itemName.toLowerCase().includes(q) || 
             order.clientName.toLowerCase().includes(q) ||
             (order.printerName || '').toLowerCase().includes(q) ||
             order.filamentType.toLowerCase().includes(q) ||
             order.filamentColor.toLowerCase().includes(q);
    }
    return true;
  });

  const totalOrders = orders.length;

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };

  return (
    <div className="space-y-6" id="production-dashboard-container">
      
      {/* Simulation controller bar */}
      <div className="p-3 bg-[#151917] border border-[#232B27] rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#95BBA2] animate-pulse" />
          <span className="text-xs font-mono font-medium text-[#8BA58D]">Painel Operacional Ativo</span>
        </div>
        <button
          onClick={onSimulateTick}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#95BBA2]/10 hover:bg-[#95BBA2]/25 text-[#95BBA2] text-xs font-bold rounded-lg border border-[#95BBA2]/20 transition cursor-pointer"
          id="btn-simulate-tick"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Simular Batimento (Avançar Tempo)
        </button>
      </div>

      {/* Grid status rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#151917] p-5 rounded-xl border border-[#232B27] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8BA58D] uppercase font-bold tracking-wider">Total Pedidos</span>
            <ClipboardList className="w-5 h-5 text-[#95BBA2]" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-[#F1F4EE]">{totalOrdersCount}</span>
          </div>
          <span className="text-xs text-[#8BA58D] font-light">
            {printingCount} Ativamente Imprimindo
          </span>
        </div>

        <div className="bg-[#151917] p-5 rounded-xl border border-[#232B27] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8BA58D] uppercase font-bold tracking-wider">Faturamento</span>
            <Check className="w-5 h-5 text-[#5E8B61]" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-[#F1F4EE]">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-xs text-[#8BA58D] font-light">
            Prontos/Entregues: {readyAndDeliveredCount} Pedidos
          </span>
        </div>
      </div>

      {/* Alerts for critical stocks — premium card matching "Auditoria em dia" */}
      {(lowFilaments.length > 0 || lowCatalogItems.length > 0) && (
        <div className="group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/40 via-zinc-950/60 to-zinc-950/40 backdrop-blur-xl transition-all duration-500 shadow-[0_24px_60px_-30px_rgba(244,63,94,0.45)]">
          {/* ambient glow */}
          <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-40 bg-rose-500/20" />
          {/* accent rail */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-rose-400/70 to-transparent" />

          <div className="relative px-5 py-4 sm:px-6 sm:py-5 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset bg-rose-500/10 text-rose-300 ring-rose-400/20">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse"
                    style={{ boxShadow: '0 0 10px rgba(244,63,94,0.8)' }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/90">
                    Ação Necessária
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#F1F4EE]">
                  Compras recomendadas — estoque crítico
                </h3>
                <p className="text-[12px] leading-relaxed text-zinc-400 max-w-2xl">
                  Itens abaixo do mínimo de segurança. Reponha para evitar paradas na produção.
                </p>
              </div>
            </div>

            {/* Filaments */}
            {lowFilaments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-[0.16em] font-bold text-rose-200/80 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Filamentos abaixo do mínimo
                </h4>
                <ul className="rounded-xl border border-rose-400/10 bg-black/20 divide-y divide-rose-400/10 overflow-hidden">
                  {lowFilaments.map(fil => (
                    <li key={fil.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-rose-500/[0.04]">
                      <div className="min-w-0">
                        <span className="text-[12px] text-zinc-100 truncate">
                          <strong className="text-[#E5B242] font-bold">{fil.type}</strong> · {fil.color}
                        </span>
                        <div className="text-[10.5px] font-mono tabular-nums text-zinc-500 mt-0.5">
                          {Math.round(fil.stockGrams)}g <span className="text-zinc-600">/ min.</span> {Math.round(fil.minStockGrams)}g
                        </div>
                      </div>
                      <button
                        onClick={() => handleIncreaseFilament(fil.id, fil.stockGrams)}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] bg-emerald-500/10 text-emerald-100 border border-emerald-400/25 hover:bg-emerald-500/20 hover:border-emerald-400/40 hover:shadow-[0_8px_24px_-10px_rgba(52,211,153,0.45)] transition-all duration-300 active:scale-[0.97]"
                      >
                        +1 Rolo (1kg)
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Catalog items */}
            {lowCatalogItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-[0.16em] font-bold text-rose-200/80 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Peças do catálogo em falta
                </h4>
                <ul className="rounded-xl border border-rose-400/10 bg-black/20 divide-y divide-rose-400/10 overflow-hidden">
                  {lowCatalogItems.map((cat: any) => (
                    <li key={cat.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-rose-500/[0.04]">
                      <div className="min-w-0">
                        <span className="text-[12px] text-zinc-100 truncate">{cat.name}</span>
                        <div className="text-[10.5px] font-mono tabular-nums text-zinc-500 mt-0.5">
                          {cat.stockCount} <span className="text-zinc-600">de</span> {cat.minStockCount} itens
                        </div>
                      </div>
                      <button
                        onClick={() => handleProduceDeficitItem(cat)}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] bg-amber-500/10 text-amber-100 border border-amber-400/25 hover:bg-amber-500/20 hover:border-amber-400/40 hover:shadow-[0_8px_24px_-10px_rgba(245,158,11,0.45)] transition-all duration-300 active:scale-[0.97]"
                      >
                        +1 Produzir
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Funnel distribution panel progress bar */}
      <div className="bg-[#151917] rounded-xl border border-[#232B27] p-4 space-y-4 shadow-md">
        <h3 className="text-sm font-bold text-[#F1F4EE]">
          Acompanhamento da Produção e Funil das Ordens
        </h3>

        <div className="w-full h-5 bg-[#232B27] rounded-lg overflow-hidden flex">
          {totalOrders > 0 ? (
            ['WAITING', 'QUEUE', 'PRINTING', 'POST_PROCESS', 'READY', 'DELIVERED'].map((st) => {
              const count = orders.filter(o => o.status === st).length;
              if (count === 0) return null;
              const weight = (count / totalOrders) * 100;
              return (
                <div
                  key={st}
                  style={{ width: `${weight}%`, backgroundColor: getStatusColor(st) }}
                  className="h-full flex items-center justify-center transition-all duration-300 overflow-hidden text-[9px] font-black text-slate-950 px-1 truncate"
                  title={`${getStatusLabel(st)}: ${count}`}
                >
                  {count}
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#8BA58D] italic">
              Nenhum pedido cadastrado no sistema.
            </div>
          )}
        </div>

        <div className="overflow-x-auto scrollbar-thin flex gap-4 pb-1 text-[11px]">
          {['WAITING', 'QUEUE', 'PRINTING', 'POST_PROCESS', 'READY', 'DELIVERED'].map((st) => {
            const count = orders.filter(o => o.status === st).length;
            return (
              <div key={st} className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getStatusColor(st) }} />
                <span className="text-[#8BA58D] font-medium">
                  {getStatusLabel(st)}: <strong className="text-[#F1F4EE]">{count}</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and search row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-sm font-bold text-[#F1F4EE]">Filtrar Produção</h3>
          
          <input
            type="text"
            placeholder="Buscar por peça, cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1 bg-[#151917] border border-[#232B27] text-xs text-[#F1F4EE] placeholder-[#8BA58D]/60 rounded-lg focus:outline-none focus:border-[#95BBA2] transition-colors"
          />
        </div>

        <div className="overflow-x-auto scrollbar-none flex items-center gap-2 pb-2">
          {filterOptions.map((opt) => {
            const isSelected = selectedFilter === opt.key;
            const count = opt.key === 'TODOS' ? orders.length : orders.filter(o => o.status === opt.key).length;
            const color = getStatusColor(opt.key);
            
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedFilter(opt.key)}
                style={{
                  backgroundColor: isSelected ? `${color}20` : '#151917',
                  borderColor: isSelected ? color : '#232B27',
                  color: isSelected ? color : '#8BA58D'
                }}
                className="px-3 py-1.5 rounded-full border text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <span>{opt.label}</span>
                <span className="px-1 py-0.25 bg-black/25 text-[9px] rounded font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List matching the state */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#151917] border border-[#232B27] rounded-xl p-12 text-center text-[#8BA58D]">
            <AlertCircle className="w-12 h-12 text-[#8BA58D]/40 mx-auto mb-3" />
            <h4 className="text-sm font-bold">Sem pedidos nesta categoria.</h4>
            <p className="text-xs mt-1 text-[#8BA58D]/80">Cadastre um novo item ou ajuste filtros.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const borderC = getStatusColor(order.status);
              
              return (
                <motion.div
                  key={order.id}
                  layoutId={`order_card_${order.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#151917] border border-[#232B27]/90 rounded-2xl p-4.5 space-y-4 shadow transition hover:border-[#8BA58D]/40 unique-card"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {order.platformSource === 'MANUAL' ? (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border border-emerald-500/30 px-2 py-0.5 rounded text-[8.5px] font-black uppercase text-center text-emerald-400 shrink-0 select-none">
                          <span className="text-[10px]">🧑‍💼</span>
                          <span>FÍSICO</span>
                        </div>
                      ) : (
                        <div 
                          style={{
                            backgroundColor: order.platformSource === 'MERCADO_LIVRE' ? '#FFF159' : 
                                            order.platformSource === 'SHOPEE' ? '#EE4D2D' : 
                                            order.platformSource === 'AMAZON' ? '#FF9900' : '#00ADF0',
                            color: order.platformSource === 'MERCADO_LIVRE' ? '#000000' : '#FFFFFF'
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-black uppercase text-center shrink-0 select-none"
                        >
                          <span className="text-[10px]">
                            {order.platformSource === 'MERCADO_LIVRE' ? '🤝' : 
                             order.platformSource === 'SHOPEE' ? '🛍️' : 
                             order.platformSource === 'AMAZON' ? '📦' : '🌐'}
                          </span>
                          <span>{order.platformSource.replace('_', ' ')}</span>
                        </div>
                      )}
                      
                      <h4 className="text-[14px] font-black text-[#F1F4EE] leading-tight truncate">
                        {order.itemName}
                      </h4>
                    </div>

                    <span
                      style={{
                        backgroundColor: `${borderC}15`,
                        borderColor: `${borderC}60`,
                        color: borderC
                      }}
                      className="px-2.5 py-0.75 rounded-full border text-[10px] font-bold text-center shrink-0 tracking-wide"
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 text-xs border-b border-[#232B27]/40 pb-3">
                    <div className="space-y-1">
                      <p className="text-[#F1F4EE]/90">
                        Cliente: <span className="font-extrabold text-white">{order.clientName}</span>
                      </p>
                      <p className="text-[#8BA58D] text-[11px]">
                        Filamento: <span className="text-[#95BBA2] font-semibold">{order.filamentType} {order.filamentColor}</span> • {order.weightGrams}g
                      </p>
                      <p className="text-[#95BBA2] font-semibold text-[10px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Entrada: {formatDateTime(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-right flex sm:flex-col items-center justify-between sm:justify-start gap-4">
                      <span className="text-[#95BBA2] text-sm font-black tracking-wide shrink-0">
                        R$ {order.priceCharged.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[#8BA58D] text-[11px] font-bold">
                        Tempo: {order.printTimeHours}h
                      </span>
                    </div>
                  </div>

                  {order.status === 'PRINTING' && (
                    <div className="bg-black/25 p-3 rounded-xl border border-[#95BBA2]/15 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-[#95BBA2]">
                          <PlayCircle className="w-3.5 h-3.5 text-[#95BBA2] animate-spin-slow" />
                          <span>Imprimindo na: <strong className="font-black text-[#F1F4EE]">{order.printerName || 'Impressora'}</strong></span>
                        </div>
                        <span className="font-bold text-[#95BBA2]">
                          {Math.round(order.printingProgress * 100)}%
                        </span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-[#232B27] rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${order.printingProgress * 100}%` }}
                          className="h-full bg-[#95BBA2] transition-all duration-300 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-6 pt-1 text-xs">
                    <div className="flex items-center gap-4 text-[#8BA58D]">
                      <button 
                        onClick={() => handleOpenEditDialog(order)} 
                        className="hover:text-white font-black cursor-pointer"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Tem certeza de que deseja apagar o pedido de "${order.itemName}"?`)) {
                            onDeleteOrder(order.id);
                          }
                        }} 
                        className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>

                    <div>
                      {getNextStatusValue(order.status) ? (
                        <button
                          onClick={() => handleFastStatusAdvance(order, getNextStatusValue(order.status)!)}
                          style={{
                            backgroundColor: `${borderC}15`,
                            color: borderC,
                            borderColor: `${borderC}40`
                          }}
                          className="px-3 py-1 rounded-lg border text-[11px] font-black flex items-center gap-1 hover:brightness-125 transition cursor-pointer"
                        >
                          <span>{getNextStatusActionLabel(order.status)}</span>
                          <ChevronRight className="w-3" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[#5E8B61] font-bold text-[11px]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Produção Concluída</span>
                        </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual allocation modal dialogue popup */}
      <AnimatePresence>
        {quickPrintOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151917] border border-[#232B27] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-1.5 text-[#E5B242]">
                  <PrinterIcon className="w-4 h-4 text-[#E5B242]" />
                  Alocar Impressora
                </h4>
                <button onClick={() => setQuickPrintOrder(null)} className="text-[#8BA58D] hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#8BA58D]">
                Abaixo estão as máquinas disponíveis. Selecione qual impressora receberá o pedido de <strong>{quickPrintOrder.itemName}</strong>:
              </p>

              <div className="space-y-2">
                {printers.map(p => {
                  const isBusy = p.status === 'PRINTING';
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPrinterQuick(p.id)}
                      className={`w-full text-left p-3 rounded-lg border transition text-xs flex items-center justify-between ${
                        isBusy 
                          ? 'bg-black/10 border-[#EF5350]/20 text-[#8BA58D] cursor-not-allowed opacity-60' 
                          : 'bg-black/25 border-[#232B27] text-[#F1F4EE] hover:border-[#95BBA2] hover:bg-[#95BBA2]/5'
                      }`}
                      disabled={isBusy}
                    >
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] text-[#8BA58D]">{p.model}</div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${isBusy ? 'bg-[#EF5350]/15 text-[#EF5350]' : 'bg-[#5E8B61]/15 text-[#95BBA2]'}`}>
                        {isBusy ? 'Ocupada' : 'Livre'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  onUpdateOrder(quickPrintOrder.id, { status: 'PRINTING', printingProgress: 0.05 });
                  setQuickPrintOrder(null);
                }}
                className="w-full py-2 bg-transparent border border-dashed border-[#232B27] hover:border-[#8BA58D] text-[#8BA58D] hover:text-[#F1F4EE] text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Prosseguir sem Alocação Ativa
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floated single execution actions */}
      <button
        onClick={handleOpenAddDialog}
        className="fixed bottom-24 right-5 z-40 bg-[#E5B242] text-[#0C0E0D] p-4.5 rounded-full shadow-2xl hover:bg-[#F5C75A] transition flex items-center justify-center cursor-pointer"
        title="Cadastrar Novo Pedido"
        id="btn-add-order-fab"
      >
        <Plus className="w-6 h-6 stroke-[3px]" />
      </button>

      {/* Main Full Add/Edit form Dialog view screen */}
      <AnimatePresence>
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151917] border border-[#232B27] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-xs text-[#F1F4EE]"
            >
              <form onSubmit={handleSaveForm}>
                <div className="px-6 py-4 border-b border-[#232B27] flex items-center justify-between bg-[#0C0E0D]">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#E5B242]" />
                    <h3 className="text-base font-black">
                      {editingOrder ? 'Editar Pedido 3D' : 'Novo Pedido de Impressão'}
                    </h3>
                  </div>
                  <button type="button" onClick={() => setIsDialogOpen(false)} className="text-[#8BA58D] hover:text-white p-1 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto scrollbar-thin">
                  <div className="space-y-1">
                    <label className="block text-[#8BA58D] font-extrabold">Cliente Relacionado</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={formClientId}
                        onChange={(e) => setFormClientId(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white focus:border-[#95BBA2] focus:outline-none"
                      >
                        {clients.map(c => (
                          <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ))}
                        <option value="CUSTOM">+ Novo Comprador Manual</option>
                      </select>

                      {formClientId === 'CUSTOM' && (
                        <input
                          type="text"
                          placeholder="Nome do cliente"
                          value={customClientName}
                          onChange={(e) => setCustomClientName(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white placeholder-[#8BA58D]/40 focus:border-[#95BBA2]"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#8BA58D] font-extrabold flex items-center justify-between">
                      <span>Classe do Modelo / Descrição (Do Catálogo)</span>
                    </label>
                    <select
                      value={formItemName}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        setFormItemName(selectedVal);
                        const matchedItem = (catalogItems as any[]).find((c) => c.name === selectedVal);
                        if (matchedItem) {
                          setFormFilamentType(matchedItem.filamentType);
                          setFormFilamentColor(matchedItem.filamentColorsUsed || 'Preto');
                          setFormWeightGrams(matchedItem.weightGrams);
                          setFormPrintTime(matchedItem.printTimeHours);
                          setFormPriceCharged(matchedItem.defaultPrice);
                        }
                      }}
                      className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white focus:border-[#95BBA2] text-xs font-mono select-text focus:outline-none"
                      required
                    >
                      <option value="">-- Selecione do catálogo de produtos --</option>
                      {(catalogItems as any[]).map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name} ({item.productCode || 'PROD'})
                        </option>
                      ))}
                      {formItemName && !(catalogItems as any[]).some(item => item.name === formItemName) && (
                        <option value={formItemName}>{formItemName} (Do Banco de Dados)</option>
                      )}
                    </select>
                    {(catalogItems as any[]).length === 0 && (
                      <p className="text-[10px] text-amber-500 font-mono">
                        ⚠️ Nenhum produto no catálogo. Cadastre primeiro na aba "Banco de Dados & Catálogo"!
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Prazo (Dias p/ entrega)</label>
                      <input
                        type="number"
                        min="1"
                        value={deadlineDays}
                        onChange={(e) => setDeadlineDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Polímero (Material)</label>
                      <select
                        value={formFilamentType}
                        onChange={(e) => setFormFilamentType(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                      >
                        <option value="PLA">PLA</option>
                        <option value="PETG">PETG</option>
                        <option value="ABS">ABS</option>
                        <option value="TPU">TPU</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Cor Escolhida</label>
                      {availableColors.length > 0 ? (
                        <select
                          value={formFilamentColor}
                          onChange={(e) => setFormFilamentColor(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        >
                          {availableColors.map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Especificar cor"
                          value={formFilamentColor}
                          onChange={(e) => setFormFilamentColor(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Peso Peça (g)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={formWeightGrams}
                        onChange={(e) => setFormWeightGrams(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Tempo (h)</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formPrintTime}
                        onChange={(e) => setFormPrintTime(Math.max(0.1, parseFloat(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Preço (R$)</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formPriceCharged}
                        onChange={(e) => setFormPriceCharged(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Origem da Venda</label>
                      <select
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                      >
                        <option value="MANUAL">MANUAL (Balcão)</option>
                        <option value="MERCADO_LIVRE">MERCADO LIVRE</option>
                        <option value="SHOPEE">SHOPEE</option>
                        <option value="NUVEMSHOP">NUVEMSHOP</option>
                        <option value="AMAZON">AMAZON</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Status Atual</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-2 px-3 text-white"
                      >
                        <option value="WAITING">Ag. Arquivo</option>
                        <option value="QUEUE">NaFila / Pagar</option>
                        <option value="PRINTING">Imprimindo</option>
                        <option value="POST_PROCESS">Pós-Processo / Acabamento</option>
                        <option value="READY">Pronto p/ Entrega</option>
                        <option value="DELIVERED">Entregue / Concluído</option>
                      </select>
                    </div>
                  </div>

                  {formStatus === 'PRINTING' && (
                    <div className="bg-black/25 p-3 rounded-lg border border-[#232B27] space-y-1">
                      <label className="block text-[#8BA58D] font-extrabold">Alocar Impressora</label>
                      <select
                        value={formPrinterId}
                        onChange={(e) => setFormPrinterId(e.target.value)}
                        className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg py-1.5 px-3 text-white"
                        required
                      >
                        <option value="">-- Selecione uma Impressora --</option>
                        {printers.map(p => (
                          <option key={p.id} value={p.id.toString()}>{p.name} ({p.status === 'PRINTING' ? 'Ocupada' : 'Idle'})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-[#0C0E0D] border-t border-[#232B27] flex items-center justify-end gap-3 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-4 py-2 border border-[#232B27] hover:border-[#8BA58D] text-[#8BA58D] hover:text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#E5B242] text-[#0C0E0D] text-xs font-extrabold rounded-lg hover:bg-[#F5C75A] transition shadow-md cursor-pointer"
                  >
                    Salvar Pedido 💾
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};