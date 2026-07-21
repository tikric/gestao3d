// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrintOrder, Printer, FilamentStock } from '../types';
import { ProductionDashboard } from './ProductionDashboard';
import { PrintersDashboard } from './PrintersDashboard';
import { 
  Plus, 
  Trash2, 
  Check, 
  RotateCw, 
  Clock, 
  AlertCircle, 
  Printer as PrinterIcon, 
  ChevronRight,
  ClipboardList,
  PlayCircle,
  Camera,
  Video,
  Wrench
} from 'lucide-react';
import { initialCatalogItems } from '../utils/initialData';
import { PrinterCameraModal } from './PrinterCameraModal';
import {
  getStatusLabel,
  getNextStatusActionLabel,
  getNextStatusValue,
  getStatusColor,
  getDelayCategory,
  getProgressPercentage,
} from './production/statusHelpers';
import { OrderDetailModal } from './production/OrderDetailModal';
import { OrderFormModal } from './production/OrderFormModal';
import { PrinterAllocationModal } from './production/PrinterAllocationModal';
import { useOrderTransitions } from './production/useOrderTransitions';

interface ProductionTabProps {
  orders: PrintOrder[];
  printers: Printer[];
  filamentStocks: FilamentStock[];
  clients: Array<{ id: number; name: string }>;
  onAddOrder: (order: Partial<PrintOrder>) => void;
  onAddClient?: (client: any) => void;
  onUpdateOrder: (id: number, updated: Partial<PrintOrder>) => void;
  onDeleteOrder: (id: number) => void;
  onSimulateTick: () => void;
  onUpdateFilament?: (id: number, updated: Partial<FilamentStock>) => void;
  onUpdatePrinter: (id: number, updated: Partial<Printer>) => void;
  viewMode?: 'full' | 'monitor' | 'orders';
}

export const ProductionTab: React.FC<ProductionTabProps> = ({
  orders,
  printers,
  filamentStocks,
  clients,
  onAddOrder,
  onAddClient,
  onUpdateOrder,
  onDeleteOrder,
  onSimulateTick,
  onUpdateFilament,
  onUpdatePrinter,
  viewMode = 'full'
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCameraPrinter, setSelectedCameraPrinter] = useState<Printer | null>(null);
  
  const getPrinterImage = (model: string = '', customUrl?: string) => {
    if (customUrl && customUrl.trim()) return customUrl.trim();
    const m = model.toLowerCase();
    if (m.includes('bambu') || m.includes('p1') || m.includes('x1') || m.includes('a1')) {
      return 'https://images.unsplash.com/photo-1701073837941-f76a5bf98505?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('k1') || m.includes('creality') || m.includes('ender') || m.includes('v3') || m.includes('sermoon')) {
      return 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('prusa') || m.includes('mk3') || m.includes('mk4') || m.includes('mini')) {
      return 'https://images.unsplash.com/photo-1544993130-9df2492f2549?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('resina') || m.includes('resin') || m.includes('sla') || m.includes('elegoo') || m.includes('photon') || m.includes('halot')) {
      return 'https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('artillery') || m.includes('genius') || m.includes('sidewinder')) {
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=400&q=80';
  };

  const [catalogItems, setCatalogItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bambuzau_local_catalog_production');
      return saved ? JSON.parse(saved) : initialCatalogItems;
    } catch (e) {
      console.warn("Failed to parse local catalog items, using default", e);
      return initialCatalogItems;
    }
  });

  useEffect(() => {
    localStorage.setItem('bambuzau_local_catalog_production', JSON.stringify(catalogItems));
  }, [catalogItems]);

  // Check for delayed orders
  const [notifiedDelayedIds, setNotifiedDelayedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_notified_delayed_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bambuzau_notified_delayed_ids', JSON.stringify(notifiedDelayedIds));
  }, [notifiedDelayedIds]);

  useEffect(() => {
    // Request notification permission if not yet requested
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const activeDelayed = orders.filter(o => {
      if (o.status === 'DELIVERED' || o.status === 'READY') return false;
      const fourHoursMs = 4 * 60 * 60 * 1000;
      return (Date.now() - o.createdAt) > fourHoursMs;
    });

    let updated = false;
    const newIds = [...notifiedDelayedIds];

    activeDelayed.forEach(order => {
      if (!newIds.includes(order.id)) {
        newIds.push(order.id);
        updated = true;

        // 1. Web Browser Native Push Notification
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("🚨 Gestão 3D: Pedido Atrasado!", {
              body: `O pedido "${order.itemName}" (Cliente: ${order.clientName}) ultrapassou o tempo limite de 4 horas!`,
              tag: `delayed-order-${order.id}`
            });
          } catch (e) {
            console.warn("Could not fire standard Notification", e);
          }
        }

        // 2. Play audible warning tone using Web Audio API Synthesizer
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
            osc.start();

            // Distinct siren alarm beep sound
            let toggles = 0;
            const interval = setInterval(() => {
              if (toggles >= 4) {
                clearInterval(interval);
                osc.stop();
                ctx.close();
              } else {
                osc.frequency.setValueAtTime(toggles % 2 === 0 ? 880 : 550, ctx.currentTime);
                toggles++;
              }
            }, 180);
          }
        } catch (audioErr) {
          console.warn("Audible alarm blocked or unsupported", audioErr);
        }
      }
    });

    if (updated) {
      setNotifiedDelayedIds(newIds);
    }
  }, [orders, notifiedDelayedIds]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PrintOrder | null>(null);
  const [quickPrintOrder, setQuickPrintOrder] = useState<PrintOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<PrintOrder | null>(null);

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
  const [formCreatedAt, setFormCreatedAt] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'CONSIGNADO' | 'CARTÃO' | 'DINHEIRO' | 'OUTROS'>('DINHEIRO');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'PAGO' | 'PENDENTE'>('PENDENTE');
  const [formImageUrl, setFormImageUrl] = useState<string>('');

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
    setFormClientId(clients.length > 0 ? clients[0].id.toString() : 'CUSTOM');
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
    setFormPaymentMethod('DINHEIRO');
    setFormPaymentStatus('PENDENTE');
    setFormImageUrl('');
    
    // Set current local time for input datetime-local
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setFormCreatedAt(localISOTime);
    
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const handler = () => handleOpenAddDialog();
    window.addEventListener('open-new-order', handler);
    if ((window as any).__pendingOpenNewOrder) {
      (window as any).__pendingOpenNewOrder = false;
      handler();
    }
    return () => window.removeEventListener('open-new-order', handler);
  }, [clients, filamentStocks]);

  const handleOpenEditDialog = (order: PrintOrder) => {
    setEditingOrder(order);
    setFormClientId(order.clientId ? order.clientId.toString() : 'CUSTOM');
    setCustomClientName(order.clientId ? '' : order.clientName);
    setFormItemName(order.itemName);
    setFormQuantity(order.quantity || 1);
    setFormFilamentType(order.filamentType);
    setFormFilamentColor(order.filamentColor);
    setFormWeightGrams(order.weightGrams);
    setFormPrintTime(order.printTimeHours);
    setFormPriceCharged(order.priceCharged);
    setFormPlatform(order.platformSource);
    setFormStatus(order.status);
    setFormPrinterId(order.assignedPrinterId ? order.assignedPrinterId.toString() : '');
    const daysLeft = Math.max(1, Math.round((order.deadline - Date.now()) / (24 * 3600 * 1000)));
    setDeadlineDays(daysLeft);
    setFormPaymentMethod(order.paymentMethod || 'DINHEIRO');
    setFormPaymentStatus(order.paymentStatus || 'PENDENTE');
    setFormImageUrl((order as any).imageUrl || '');
    
    // Set creation time for input datetime-local
    const tzoffset = (new Date(order.createdAt)).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(order.createdAt - tzoffset)).toISOString().slice(0, 16);
    setFormCreatedAt(localISOTime);

    setIsDialogOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    let clientIdFinal: number | null = null;
    let clientNameFinal = customClientName;

    if (formClientId !== 'CUSTOM') {
      const selectedClient = clients.find(c => c.id === parseInt(formClientId));
      if (selectedClient) {
        clientIdFinal = selectedClient.id;
        clientNameFinal = selectedClient.name;
      }
    }

    if (!clientNameFinal.trim()) {
      alert('Por favor especifique o nome do cliente.');
      return;
    }

    // Auto-register manual buyer as a new client with generated code
    if (formClientId === 'CUSTOM' && onAddClient) {
      const nextNumeric = (clients.length > 0 ? Math.max(...clients.map((c: any) => c.id)) : 0) + 1;
      const generatedCode = `CLI-${String(nextNumeric).padStart(4, '0')}`;
      onAddClient({
        name: clientNameFinal.trim(),
        phone: '',
        email: '',
        address: '',
        code: generatedCode,
        note: `Cadastrado automaticamente via Pedido (${generatedCode})`,
        lastContactDate: Date.now(),
      });
    }

    const customCreatedAt = formCreatedAt ? new Date(formCreatedAt).getTime() : Date.now();

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
      deadline: customCreatedAt + deadlineDays * 24 * 3600 * 1000,
      paymentMethod: formPaymentMethod,
      paymentStatus: formPaymentStatus
    };
    (payload as any).imageUrl = formImageUrl || undefined;

    if (editingOrder) {
      onUpdateOrder(editingOrder.id, {
        ...payload,
        createdAt: customCreatedAt
      });
    } else {
      onAddOrder({
        ...payload,
        createdAt: customCreatedAt,
        printingProgress: formStatus === 'PRINTING' ? 0.1 : 0.0
      });
    }
    setIsDialogOpen(false);
  };

  const { advanceStatus, assignPrinter } = useOrderTransitions({ printers, onUpdateOrder, onUpdatePrinter });

  const handleFastStatusAdvance = (order: PrintOrder, nextStatus: string) => {
    advanceStatus(order, nextStatus);
  };

  const handleSelectPrinterQuick = (printerId: number) => {
    if (!quickPrintOrder) return;
    assignPrinter(quickPrintOrder, printerId);
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

  const totalOrdersCount = orders.filter(o => o.status !== 'DELIVERED').length;
  const printingCount = orders.filter(o => o.status === 'PRINTING').length;
  const totalRevenue = orders.filter(o => o.status !== 'DELIVERED').reduce((sum, o) => sum + o.priceCharged, 0);
  const readyAndDeliveredCount = orders.filter(o => o.status === 'READY').length;

  const lowFilaments = filamentStocks.filter(f => f.stockGrams < f.minStockGrams);
  const lowCatalogItems = catalogItems.filter((c: any) => c.stockCount < c.minStockCount);

  const filterOptions = [
    { key: 'TODOS', label: 'Todos Ativos' },
    { key: 'WAITING', label: 'Aguard. Arq' },
    { key: 'QUEUE', label: 'NaFila' },
    { key: 'PRINTING', label: 'Imprimindo' },
    { key: 'POST_PROCESS', label: 'Acabamento' },
    { key: 'PACKING', label: 'Embalando' },
    { key: 'READY', label: 'Pronto' }
  ];

  const filteredOrders = orders.filter(order => {
    // Excluir os entregues da aba de fura de produção, pois agora vão para a aba de vendidos
    if (order.status === 'DELIVERED') return false;

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
  }).sort((a, b) => {
    // Sempre ordenar por tempo de atraso (mais antigo / maior tempo de atraso primeiro)
    return a.createdAt - b.createdAt;
  });

  const totalOrders = orders.filter(o => o.status !== 'DELIVERED').length;

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };

  return (
    <div className="space-y-6" id="production-dashboard-container">
      {/* ONLINE PRINTER CONNECTIONS */}
      {viewMode !== 'orders' && (
      <div className="space-y-3" id="online-printers-tracker">
        <PrintersDashboard orders={orders} printers={printers} />
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0c100e] via-[#0a0d0b] to-[#080a09] backdrop-blur-xl px-4 py-3 animate-fade-in"
          id="active-printers-header"
        >
          <div
            className="pointer-events-none absolute -top-16 -left-10 w-72 h-72 rounded-full blur-3xl opacity-70"
            style={{ background: 'radial-gradient(circle, rgba(183,255,0,0.10) 0%, rgba(16,185,129,0.05) 45%, transparent 75%)' }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#b7ff00]/25 bg-gradient-to-br from-[#b7ff00]/15 to-emerald-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(183,255,0,0.15)]"
              >
                <PrinterIcon className="w-4 h-4 text-[#b7ff00]" style={{ filter: 'drop-shadow(0 0 6px rgba(183,255,0,0.55))' }} />
              </div>
              <div className="flex flex-col">
                <h3
                  className="text-[15px] font-bold text-[#F1F4EE] tracking-tight leading-none"
                  style={{ textShadow: '0 1px 12px rgba(183,255,0,0.18)' }}
                  id="active-printers-heading"
                >
                  Impressoras Ativas
                </h3>
                <span className="mt-1 text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#8BA58D]/80">
                  Monitoramento em tempo real
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#b7ff00] opacity-70 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b7ff00] shadow-[0_0_8px_rgba(183,255,0,0.8)]" />
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider border border-[#b7ff00]/25 bg-[#b7ff00]/10 text-[#b7ff00]">
                {printers.filter(p => p.status === 'PRINTING').length} em uso
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold text-zinc-300 border border-white/10 bg-white/[0.03]">
                {printers.length} total
              </span>
            </div>
          </div>
        </div>

        {printers.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-sm">
            <p className="text-xs text-zinc-300 font-bold">Nenhuma impressora 3D cadastrada ainda.</p>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono tracking-wide">Cadastre suas impressoras e IPs na aba "Clientes & Impressoras" para sincronização.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {printers.map((printer) => {
              const expressesActivity = printer.status === 'PRINTING' || (printer.isOnline && (printer.printProgress || 0) > 0);
              const imageUrl = getPrinterImage(printer.model, printer.customUrl);
              const progressPercentage = printer.printProgress || (printer.status === 'PRINTING' ? 68 : 0);
              const activeLabel = printer.currentJob || "Ativo";

               return (
                <div 
                  key={printer.id} 
                  onClick={() => setSelectedCameraPrinter(printer)}
                  className={`group relative aspect-square rounded-xl overflow-hidden select-none transition-all duration-300 border-2 cursor-pointer ${
                    printer.status === 'MAINTENANCE'
                      ? 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] hover:border-amber-300'
                      : expressesActivity
                      ? 'border-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.7)] hover:border-amber-400'
                      : 'border-red-600 hover:border-amber-400'
                  }`}
                  id={`production_printer_card_${printer.id}`}
                  title="Clique para acessar a câmera ao vivo"
                >
                  <img 
                    src={imageUrl} 
                    alt={printer.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  {/* Botão Manutenção — bloqueia/libera a impressora para receber pedidos */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const goingToMaintenance = printer.status !== 'MAINTENANCE';
                      onUpdatePrinter(printer.id, {
                        status: goingToMaintenance ? 'MAINTENANCE' : 'IDLE',
                        printProgress: 0,
                      });
                    }}
                    title={printer.status === 'MAINTENANCE' ? 'Encerrar manutenção' : 'Marcar em manutenção'}
                    className={`absolute top-1.5 left-1.5 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                      printer.status === 'MAINTENANCE'
                        ? 'bg-amber-500/90 border-amber-300 text-black animate-pulse'
                        : 'bg-black/70 border-white/10 text-amber-300 hover:bg-amber-500/90 hover:text-black hover:border-amber-300'
                    }`}
                  >
                    <Wrench className="w-2.5 h-2.5" />
                    {printer.status === 'MAINTENANCE' ? 'EM MANUT.' : 'MANUT.'}
                  </button>
                  
                  {/* Subtle pulsing camera link hover circle overlay */}
                  <div className="absolute inset-x-0 top-0 pt-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <span className="flex items-center gap-1.5 bg-black/85 text-[8px] font-bold text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 shadow-lg">
                      <Camera className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
                      VER CÂMERA
                    </span>
                  </div>

                  {/* Compact overlay showing current monitoring status */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-2">
                    <span className="text-[8px] sm:text-[9.5px] font-black text-[#F1F4EE] truncate leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {printer.name}
                    </span>
                    
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`w-1 h-1 rounded-full ${printer.status === 'MAINTENANCE' ? 'bg-amber-400 animate-pulse' : expressesActivity ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                        <span className="text-[7.5px] sm:text-[8.5px] font-mono text-zinc-300 truncate font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {printer.status === 'MAINTENANCE' ? 'Manutenção' : expressesActivity ? activeLabel : 'Inativo'}
                        </span>
                      </div>
                      {expressesActivity && (
                        <span className="text-[7.5px] sm:text-[9px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-1 rounded border border-emerald-500/25 shrink-0">
                          {progressPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating live feed camera overlay */}
        {selectedCameraPrinter && (
          <PrinterCameraModal
            printer={selectedCameraPrinter}
            onClose={() => setSelectedCameraPrinter(null)}
            onUpdatePrinter={(id, updated) => {
              onUpdatePrinter(id, updated);
              // Keeps local modal visual state in sync
              setSelectedCameraPrinter(prev => prev && prev.id === id ? { ...prev, ...updated } : prev);
            }}
          />
        )}
      </div>
      )}

      {viewMode !== 'monitor' && (<>
      {/* Alerta de compras recomendadas foi movido para a aba Estoque */}

      {/* Dashboard premium — mesma linguagem visual de Clientes/Pedidos */}
      <ProductionDashboard orders={orders} printers={printers} />

      {/* Search row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5">
        <input
          type="text"
          placeholder="Buscar por peça, cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 px-3 py-1 bg-[#151917] border border-[#232B27] text-xs text-[#F1F4EE] placeholder-[#8BA58D]/60 rounded-lg focus:outline-none focus:border-[#95BBA2] transition-colors"
        />
      </div>

      {/* Sequential production queues: Impressão -> Acabamento -> Embalando -> Pronto */}
      {(() => {
        const renderOrderCard = (order: PrintOrder) => {
              const borderC = getStatusColor(order.status);
              const isDeadlinePassed = order.deadline && Date.now() > order.deadline;
              const delayCat = getDelayCategory(order.createdAt, order.status);
              const isLate = (order.status !== 'DELIVERED' && order.status !== 'READY') && (
                delayCat.level === 'CRITICAL' || isDeadlinePassed
              );
              
              // Define border animation state based on client requirements (Critical > 24h is Red Pulse, Orange >= 15h, Yellow >= 8h)
              const borderClass = (order.status === 'DELIVERED' || order.status === 'READY')
                ? 'border-[#232B27]/90 hover:border-[#8BA58D]/40'
                : isLate
                ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50 animate-[pulse_1.5s_infinite]'
                : delayCat.level === 'ORANGE'
                ? 'border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                : delayCat.level === 'YELLOW'
                ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                : 'border-[#232B27]/90 hover:border-emerald-500/30';
              
              return (
                <motion.div
                  key={order.id}
                  layoutId={`order_card_${order.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[#151917] border rounded-2xl p-3.5 md:p-5 space-y-3 md:space-y-4 shadow transition unique-card ${borderClass}`}
                >
                  {/* Glowing Indicator Bar (Flashes status color or warning highlights) */}
                  <div className="w-full h-1.5 rounded-full overflow-hidden" id={`order-bar-indicator-${order.id}`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isLate 
                          ? 'bg-red-500 animate-[pulse_0.8s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.8)]' 
                          : delayCat.level === 'ORANGE'
                          ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]'
                          : delayCat.level === 'YELLOW'
                          ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                          : ''
                      }`}
                      style={{ backgroundColor: (delayCat.level === 'GREEN' || isDeadlinePassed) ? borderC : undefined }}
                    />
                  </div>

                  {(delayCat.level !== 'GREEN' || isDeadlinePassed) && (() => {
                    const delayTimeMs = isDeadlinePassed
                      ? (Date.now() - order.deadline)
                      : (Date.now() - order.createdAt);
                    const delayHrs = Math.floor(delayTimeMs / (1000 * 3600));
                    const delayMins = Math.floor((delayTimeMs % (1000 * 3600)) / (1000 * 60));
                    const delayStr = delayHrs > 0 ? `${delayHrs}h ${delayMins}min` : `${delayMins}min`;

                    let bgAlert = 'bg-red-500/10 border-red-500/35 text-red-400';
                    let labelText = `🚨 CRÍTICO: PEDIDO ATRASADO EM ${delayStr} 🚨`;

                    if (!isDeadlinePassed) {
                      if (delayCat.level === 'ORANGE') {
                        bgAlert = 'bg-orange-500/10 border-orange-500/35 text-orange-450 text-orange-400';
                        labelText = `⚠️ ATENÇÃO: PEDIDO HÁ ${delayStr} NA FILA ⚠️`;
                      } else if (delayCat.level === 'YELLOW') {
                        bgAlert = 'bg-yellow-500/10 border-yellow-500/35 text-yellow-450 text-yellow-500';
                        labelText = `⏳ ATENÇÃO: PEDIDO HÁ ${delayStr} NA FILA ⏳`;
                      }
                    }

                    return (
                      <div className={`${bgAlert} border px-2.5 py-1.5 rounded-xl text-center select-none ${isLate ? 'animate-[pulse_1s_infinite]' : ''}`}>
                        <p className="text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                          {labelText}
                        </p>
                      </div>
                    );
                  })()}
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0 max-w-[65%]">
                      {order.imageUrl ? (
                        <img
                          src={order.imageUrl}
                          alt={order.itemName}
                          className="shrink-0 w-9 h-9 rounded-md object-cover border border-[#232B27] bg-black/40"
                          loading="lazy"
                        />
                      ) : (
                        <div className="shrink-0 w-9 h-9 rounded-md border border-dashed border-[#232B27] bg-black/30 flex items-center justify-center text-[8px] text-[#3a4640] font-bold uppercase">
                          3D
                        </div>
                      )}
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
                      
                      <h4 className="text-xs md:text-sm font-bold text-[#F1F4EE] leading-tight truncate">
                        {order.itemName}
                      </h4>
                    </div>

                    <span
                      style={{
                        backgroundColor: `${borderC}15`,
                        borderColor: `${borderC}60`,
                        color: borderC
                      }}
                      className="px-2 py-0.5 rounded-full border text-[9px] md:text-[10px] font-bold text-center shrink-0 tracking-wide"
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Financial & Payment badging section */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0C0E0D]/50 border border-[#232B27]/40 rounded-xl relative">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider leading-none border uppercase ${
                      order.paymentMethod === 'CONSIGNADO'
                        ? 'bg-purple-950/40 border-purple-500/30 text-purple-400'
                        : order.paymentMethod === 'CARTÃO'
                        ? 'bg-blue-950/40 border-blue-500/30 text-blue-400'
                        : order.paymentMethod === 'DINHEIRO'
                        ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                    }`}>
                      🤝 {order.paymentMethod || 'DINHEIRO'}
                    </span>

                    <button
                      onClick={() => {
                        const nextStatus = order.paymentStatus === 'PAGO' ? 'PENDENTE' : 'PAGO';
                        onUpdateOrder(order.id, { paymentStatus: nextStatus as any });
                      }}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider leading-none border transition-all cursor-pointer flex items-center gap-1 ${
                        order.paymentStatus === 'PAGO'
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40'
                          : 'bg-amber-950/60 border-amber-500/40 text-amber-400 hover:bg-amber-900/40 animate-[pulse_2s_infinite]'
                      }`}
                      title="Clique para alternar PAGO / PENDENTE"
                    >
                      <span>{order.paymentStatus === 'PAGO' ? '✅ PAGO' : '⏳ PENDENTE'}</span>
                    </button>

                    {order.paymentStatus !== 'PAGO' && (
                      <button
                        onClick={() => {
                          const valor = order.priceCharged.toFixed(2);
                          const peca = order.itemName;
                          const textReminder = `*Olá, ${order.clientName}!* 👋\n\nPassando para enviar o lembrete de pagamento referente à peça *${peca}* no valor de *R$ ${valor}*.\n\nGostaria de fechar o pagamento por PIX, Dinheiro ou Cartão? Ficamos no aguardo de sua confirmação para prosseguir de imediato. Muito obrigado! 🤝\n\n_Ateliê Gestão 3D_`;
                          let clientPhoneClean = '';
                          if (order.clientId) {
                            const c = clients.find(cl => cl.id === order.clientId);
                            if (c && c.phone) {
                              clientPhoneClean = c.phone.replace(/\D/g, '');
                            }
                          }
                          const waUrl = clientPhoneClean 
                            ? `https://api.whatsapp.com/send?phone=${clientPhoneClean}&text=${encodeURIComponent(textReminder)}`
                            : `https://api.whatsapp.com/send?text=${encodeURIComponent(textReminder)}`;
                          
                          window.open(waUrl, '_blank');
                        }}
                        className="px-2 py-0.5 bg-red-950/45 hover:bg-red-900/60 border border-red-500/30 hover:border-red-500 text-red-400 rounded text-[8.5px] font-sans font-black flex items-center gap-1 transition cursor-pointer"
                        title="Cobrar este cliente no WhatsApp"
                      >
                        📲 COBRAR
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2.5 text-[11px] md:text-xs border-b border-[#232B27]/40 pb-2.5">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-[#F1F4EE]/90 truncate">
                        Cliente: <span className="font-extrabold text-white">{order.clientName}</span>
                      </p>
                      <p className="text-[#8BA58D] text-[10.5px]">
                        Fio: <span className="text-[#95BBA2] font-semibold">{order.filamentType} {order.filamentColor}</span> • {order.weightGrams}g
                      </p>
                      <div className="flex flex-col gap-1.5 pt-1.5 w-full">
                        {(() => {
                          const elapsedMs = Date.now() - order.createdAt;
                          const elapsedMinsTotal = Math.floor(elapsedMs / (60 * 1000));
                          const elapsedHrs = Math.floor(elapsedMinsTotal / 60);
                          const elapsedMins = elapsedMinsTotal % 60;
                          const elapsedStr = elapsedHrs > 0 ? `Há ${elapsedHrs}h e ${elapsedMins}m` : `Há ${elapsedMins}m`;

                          const isDeadlinePassedObj = order.deadline && Date.now() > order.deadline;
                          const elapsedHrsVal = (Date.now() - order.createdAt) / (1000 * 3600);
                          const isWarningOrCritical = (order.status !== 'DELIVERED' && order.status !== 'READY') && (
                            elapsedHrsVal >= 8 || isDeadlinePassedObj
                          );

                          let delayStr = "";
                          if (isWarningOrCritical) {
                            const delayTimeMs = isDeadlinePassedObj
                              ? (Date.now() - order.deadline)
                              : (Date.now() - order.createdAt);
                            const delayHrsVal = Math.floor(delayTimeMs / (1000 * 3600));
                            const delayMinsVal = Math.floor((delayTimeMs % (1000 * 3600)) / (1000 * 60));
                            delayStr = delayHrsVal > 0 ? `${delayHrsVal}h ${delayMinsVal}min` : `${delayMinsVal}min`;
                          }

                          // Barra de Tempo do Ateliê: progress limits set dynamically (24 hours standard limit, or custom selected deadline)
                          const createdTime = order.createdAt;
                          const limitTime = order.deadline || (createdTime + 24 * 60 * 60 * 1000);
                          const totalDuration = limitTime - createdTime;
                          const currentElapsed = Date.now() - createdTime;
                          const progressPercent = Math.min(100, Math.max(0, (currentElapsed / totalDuration) * 100));

                          let trackerLabel = '⏱️ Verde (Normal)';
                          let trackerColorClass = 'text-emerald-450 text-emerald-450 text-emerald-450 text-emerald-400';
                          let progressColorStyle = 'bg-gradient-to-r from-emerald-500 to-[#95BBA2]';
                          let progressBorderClass = 'border-[#232B27]';

                          if (order.status !== 'DELIVERED' && order.status !== 'READY') {
                            if (isDeadlinePassedObj || elapsedHrsVal >= 24) {
                              trackerLabel = '🚨 CRÍTICO / ATRASADO (>24h)';
                              trackerColorClass = 'text-red-400 font-extrabold animate-pulse';
                              progressColorStyle = 'bg-gradient-to-r from-red-600 to-red-500 animate-[pulse_0.4s_infinite]';
                              progressBorderClass = 'border-red-500 animate-[pulse_0.8s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.5)]';
                            } else if (elapsedHrsVal >= 15) {
                              trackerLabel = '⚠️ ATENÇÃO (>=15h)';
                              trackerColorClass = 'text-orange-400 font-bold';
                              progressColorStyle = 'bg-gradient-to-r from-orange-500 to-amber-500';
                              progressBorderClass = 'border-orange-500/80 shadow-[0_0_8px_rgba(249,115,22,0.3)]';
                            } else if (elapsedHrsVal >= 8) {
                              trackerLabel = '⏳ ATENÇÃO (>=8h)';
                              trackerColorClass = 'text-yellow-400 font-bold';
                              progressColorStyle = 'bg-gradient-to-r from-yellow-400 to-amber-400';
                              progressBorderClass = 'border-yellow-500/80 shadow-[0_0_6px_rgba(234,179,8,0.2)]';
                            }
                          }

                          return (
                            <div className="text-[10px] uppercase flex flex-col gap-2 bg-black/45 p-3 rounded-xl border border-[#232B27] shadow-inner font-mono w-full">
                              <span className="flex items-center gap-1.5 shrink-0 text-white font-bold">
                                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                Hora do Pedido: <strong className="text-amber-300 font-extrabold">{new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong> ({new Date(order.createdAt).toLocaleDateString('pt-BR')})
                              </span>

                              {/* Barra de Tempo do Ateliê */}
                              <div className="space-y-1 mt-0.5">
                                <div className="flex justify-between items-center text-[8.5px] font-sans font-bold text-zinc-400 leading-none">
                                  <span className={trackerColorClass}>
                                    {trackerLabel}
                                  </span>
                                  <span className="text-zinc-350">{Math.round(progressPercent)}%</span>
                                </div>
                                <div className={`w-full h-2.5 bg-[#141916] rounded-full overflow-hidden border p-0.5 transition-all duration-300 ${progressBorderClass}`}>
                                  <div 
                                    style={{ width: `${progressPercent}%` }}
                                    className={`h-full rounded-full transition-all duration-300 ${progressColorStyle}`}
                                  />
                                </div>
                              </div>

                              <span className="text-zinc-400 font-semibold text-[9.5px]">
                                Tempo na Fila: {elapsedStr}
                              </span>
                              {isWarningOrCritical && (
                                <span className={`${trackerColorClass} font-black flex items-center gap-1 text-[9.5px] uppercase`}>
                                  ⚠️ Tempo Transcorrido: <strong className="font-extrabold font-mono">{delayStr}</strong>
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        {order.status === 'QUEUE' && (
                          <span className="text-[8.5px] font-black uppercase text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded animate-pulse text-center w-full block">
                            ⚠️ Prioridade na Fila
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 border-[#232B27]/20 pt-1.5 sm:pt-0">
                      <span className="text-[#95BBA2] text-xs md:text-sm font-black tracking-wide">
                        R$ {order.priceCharged.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[#8BA58D] text-[10.5px] font-semibold">
                        {order.printTimeHours}h de impr.
                      </span>
                    </div>
                  </div>

                  {/* Unified Progress Bar showing progress in % as requested */}
                  {(() => {
                    const pct = getProgressPercentage(order.status, order.printingProgress);
                    return (
                      <div className="bg-[#0C0E0D]/40 p-2.5 rounded-xl border border-[#232B27]/60 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8BA58D] font-black uppercase tracking-wider text-[8.5px] flex items-center gap-1 flex-row">
                            <span 
                              className={`w-1.5 h-1.5 rounded-full inline-block ${
                                order.status === 'PRINTING' ? 'bg-emerald-400 animate-ping' : ''
                              }`} 
                              style={{ backgroundColor: order.status !== 'PRINTING' ? borderC : undefined }}
                            />
                            Etapa: {getStatusLabel(order.status)}
                          </span>
                          <span 
                            style={{ color: order.status === 'READY' ? '#60a5fa' : borderC }} 
                            className="font-mono font-black text-[10.5px]"
                          >
                            {pct}%
                          </span>
                        </div>
                        
                        <div className="w-full h-2 bg-[#1C211E]/85 rounded-full overflow-hidden p-0.5 border border-[#232B27]">
                          <div 
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: borderC 
                            }}
                            className={`h-full transition-all duration-300 rounded-full ${
                              order.status === 'PRINTING' ? 'animate-pulse bg-gradient-to-r from-[#95BBA2] to-[#bbf7d0]' : ''
                            }`}
                          />
                        </div>

                        {order.status === 'PRINTING' && order.printerName && (
                          <div className="text-[9.5px] text-[#8BA58D] flex items-center justify-between font-mono pt-0.5 leading-none">
                            <span>Máquina: <strong className="text-white">{order.printerName}</strong></span>
                            <span>Fatiando: {Math.round(order.printingProgress * 100)}%</span>
                          </div>
                        )}
                        {order.status === 'READY' && (
                          <p className="text-[9.5px] text-blue-300 font-extrabold tracking-tight animate-pulse flex items-center gap-1 pt-0.5 leading-none">
                            📦 Empacotado &amp; Pronto p/ Entrega
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between gap-4 pt-1.5 text-xs">
                    <div className="flex items-center gap-3.5 text-[#8BA58D] text-[11px]">
                      <button 
                        onClick={() => handleOpenEditDialog(order)} 
                        className="hover:text-white font-bold cursor-pointer transition animate-none"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Tem certeza de que deseja apagar o pedido de "${order.itemName}"?`)) {
                            onDeleteOrder(order.id);
                          }
                        }} 
                        className="text-red-400 hover:text-red-300 font-bold cursor-pointer transition"
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
                          className="px-2.5 py-1 rounded-lg border text-[10.5px] font-black flex items-center gap-1 hover:brightness-110 active:scale-95 transition cursor-pointer"
                        >
                          <span>{getNextStatusActionLabel(order.status)}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[#5E8B61] font-bold text-[10.5px]">
                          <Check className="w-3.5 h-3.5 text-[#5D8168] dark:text-emerald-400" />
                          <span className="text-[#8BA58D]">Fila Concluída</span>
                        </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              );
        };

        const renderCompactRow = (order: PrintOrder) => {
          const color = getStatusColor(order.status);
          const delayCat = getDelayCategory(order.createdAt, order.status);
          const isDeadlinePassed = order.deadline && Date.now() > order.deadline;
          const isLate = (order.status !== 'DELIVERED' && order.status !== 'READY') && (delayCat.level === 'CRITICAL' || isDeadlinePassed);
          const isPrinting = order.status === 'PRINTING';
          const assignedPrinter = order.assignedPrinterId ? printers.find(p => p.id === order.assignedPrinterId) : null;
          const printerPct = assignedPrinter && typeof assignedPrinter.printProgress === 'number' ? assignedPrinter.printProgress : null;
          const progressPct = isPrinting
            ? Math.round((printerPct !== null ? printerPct : (order.printingProgress || 0) * 100))
            : 0;
          const elapsedMs = Date.now() - order.createdAt;
          const elapsedH = Math.floor(elapsedMs / 3600000);
          const elapsedM = Math.floor((elapsedMs % 3600000) / 60000);
          const elapsedStr = elapsedH > 0 ? `${elapsedH}h${elapsedM}m` : `${elapsedM}m`;
          const overdueMs = order.deadline ? Date.now() - order.deadline : 0;
          const overdueH = Math.floor(overdueMs / 3600000);
          const overdueM = Math.floor((overdueMs % 3600000) / 60000);
          const overdueStr = overdueH > 0 ? `${overdueH}h${overdueM}m` : `${overdueM}m`;
          const isOverdue = !!order.deadline && overdueMs > 0 && order.status !== 'DELIVERED' && order.status !== 'READY';
          const nextStatus = getNextStatusValue(order.status);
          const nextLabel = getNextStatusActionLabel(order.status);
          return (
            <motion.div
              key={order.id}
              layoutId={`order_card_${order.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -1 }}
              onClick={() => setDetailOrder(order)}
              className={`group relative flex flex-col gap-2 rounded-xl bg-gradient-to-br from-[#13181500] via-[#13181580] to-[#0F1310] border ${isLate ? 'border-red-500/60 shadow-[0_0_14px_rgba(239,68,68,0.18)]' : 'border-[#232B27] hover:border-[#3a4a40]'} px-3 py-2.5 transition-all duration-300 backdrop-blur-sm cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]`}
            >
              <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}80` }} />
              <div className="flex items-stretch gap-3">
              {order.imageUrl ? (
                <img
                  src={order.imageUrl}
                  alt={order.itemName}
                  className="shrink-0 w-12 h-12 rounded-lg object-cover border border-[#232B27] bg-black/40"
                  loading="lazy"
                />
              ) : (
                <div className="shrink-0 w-12 h-12 rounded-lg border border-dashed border-[#232B27] bg-black/30 flex items-center justify-center text-[9px] text-[#3a4640] font-bold uppercase tracking-wider">
                  3D
                </div>
              )}
              <div className="flex-1 min-w-0 pl-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-[13px] font-semibold text-[#F1F4EE] tracking-tight">{order.itemName}</span>
                  {order.quantity > 1 && (
                    <span className="shrink-0 text-[9px] font-mono text-[#8BA58D] bg-black/40 px-1.5 py-0.5 rounded">×{order.quantity}</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-[#8BA58D] min-w-0">
                  <span className="truncate">{order.clientName}</span>
                  <span className="text-[#3a4640]">·</span>
                  <span className="truncate">{order.filamentType} {order.filamentColor}</span>
                  <span className="text-[#3a4640]">·</span>
                  <span className="shrink-0">{order.weightGrams}g</span>
                  {isPrinting && assignedPrinter && (
                    <>
                      <span className="text-[#3a4640]">·</span>
                      <span className="shrink-0 text-emerald-400/80">{assignedPrinter.name}</span>
                    </>
                  )}
                </div>
                {isPrinting && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#b7ff00] transition-all duration-700" style={{ width: `${Math.max(2, progressPct)}%` }} />
                    </div>
                    <span className="text-[9px] font-mono font-bold tabular-nums text-emerald-300">{progressPct}%</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end justify-between shrink-0 gap-1">
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`text-[9.5px] font-mono tabular-nums flex items-center gap-1 ${isLate ? 'text-red-400' : 'text-[#8BA58D]'}`}>
                    <Clock className="w-2.5 h-2.5" />{elapsedStr}
                  </span>
                  {isOverdue && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/40 text-red-400 ${isLate ? 'animate-[pulse_1s_infinite]' : ''}`}>
                      Atraso {overdueStr}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#F1F4EE] tabular-nums">R$ {order.priceCharged.toFixed(0)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Apagar o pedido "${order.itemName}"?`)) {
                        onDeleteOrder(order.id);
                      }
                    }}
                    title="Excluir pedido"
                    className="text-[10px] font-bold p-1 rounded-md border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 hover:scale-[1.05] active:scale-95"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              </div>
              {nextStatus && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleFastStatusAdvance(order, nextStatus); }}
                  className="w-full text-[11px] font-bold px-2 py-2 rounded-md border transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                  style={{ borderColor: `${color}55`, color, background: `${color}12` }}
                >
                  {nextLabel} →
                </button>
              )}
            </motion.div>
          );
        };

        const queues = [
          { key: 'WAITING',  title: 'Fila Aguardando Aceite', color: '#F1F4EE', subtitle: 'Pendentes de aprovação, arquivo ou pagamento', list: filteredOrders.filter(o => o.status === 'WAITING' || o.status === 'QUEUE') },
          { key: 'PRINT',    title: 'Fila Imprimindo',        color: '#22c55e', subtitle: 'Pedidos em impressão (% ao vivo da impressora)', list: filteredOrders.filter(o => o.status === 'PRINTING') },
          { key: 'FINISH',   title: 'Fila de Acabamento',     color: '#f59e0b', subtitle: 'Pós-processamento e finalização',           list: filteredOrders.filter(o => o.status === 'POST_PROCESS') },
          { key: 'PACKING',  title: 'Fila de Embalando',      color: '#a855f7', subtitle: 'Embalagem antes da entrega',                list: filteredOrders.filter(o => o.status === 'PACKING') },
          { key: 'READY',    title: 'Prontos para Entrega',   color: '#3b82f6', subtitle: 'Aguardando retirada / envio',               list: filteredOrders.filter(o => o.status === 'READY') },
        ];

        return (
          <div className="space-y-8">
            {queues.map((q, qi) => (
              <motion.section
                key={q.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <div
                  className="relative overflow-hidden rounded-xl border border-white/[0.06] px-4 py-3 backdrop-blur-xl"
                  style={{
                    background: `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%), #0c100e`,
                    boxShadow: `0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 50px -28px rgba(0,0,0,0.85)`,
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(120% 100% at 0% 0%, ${q.color}22 0%, transparent 55%)` }}
                  />
                  <div className="relative flex items-end justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: q.color, boxShadow: `0 0 14px ${q.color}, 0 0 4px ${q.color}` }}
                      />
                      <div className="leading-tight">
                        <h3
                          className="text-[13px] font-bold tracking-[0.02em]"
                          style={{ color: q.color, textShadow: `0 0 20px ${q.color}55` }}
                        >
                          {q.title}
                        </h3>
                        <p className="text-[10.5px] text-white/45 mt-0.5">{q.subtitle}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold tabular-nums px-2.5 py-1 rounded-md border"
                      style={{
                        color: q.color,
                        background: `${q.color}10`,
                        borderColor: `${q.color}33`,
                      }}
                    >
                      {q.list.length} {q.list.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>
                {q.list.length === 0 ? (
                  <div className="text-center text-[11px] text-white/35 py-6 border border-dashed border-white/[0.06] rounded-xl bg-white/[0.01]">
                    Fila vazia
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
                    {q.list.map(renderCompactRow)}
                  </div>
                )}
              </motion.section>
            ))}
          </div>
        );
      })()}

      <PrinterAllocationModal
        order={quickPrintOrder}
        printers={printers}
        onClose={() => setQuickPrintOrder(null)}
        onSelectPrinter={(id) => handleSelectPrinterQuick(id)}
        onProceedWithoutAllocation={(o) => {
          onUpdateOrder(o.id, { status: 'PRINTING', printingProgress: 0.05 });
          setQuickPrintOrder(null);
        }}
      />

      {/* Order Detail Modal — extracted to production/OrderDetailModal.tsx */}
      <OrderDetailModal
        order={detailOrder}
        printers={printers}
        onClose={() => setDetailOrder(null)}
        onEdit={(o) => handleOpenEditDialog(o)}
        onDelete={(id) => onDeleteOrder(id)}
        onAdvance={(o, next) => handleFastStatusAdvance(o, next)}
      />

      {/* Floated single execution actions — hidden in Produção (full) */}
      {viewMode !== 'full' && (
        <button
          onClick={handleOpenAddDialog}
          className="fixed bottom-24 right-5 z-40 bg-[#E5B242] text-[#0C0E0D] p-4.5 rounded-full shadow-2xl hover:bg-[#F5C75A] transition flex items-center justify-center cursor-pointer"
          title="Cadastrar Novo Pedido"
          id="btn-add-order-fab"
        >
          <Plus className="w-6 h-6 stroke-[3px]" />
        </button>
      )}

      {/* Main Full Add/Edit form Dialog view screen */}
      <OrderFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSaveForm}
        editingOrder={editingOrder}
        clients={clients as any}
        printers={printers}
        catalogItems={catalogItems as any[]}
        availableColors={availableColors}
        formClientId={formClientId} setFormClientId={setFormClientId}
        customClientName={customClientName} setCustomClientName={setCustomClientName}
        formItemName={formItemName} setFormItemName={setFormItemName}
        formQuantity={formQuantity} setFormQuantity={setFormQuantity}
        formFilamentType={formFilamentType} setFormFilamentType={setFormFilamentType}
        formFilamentColor={formFilamentColor} setFormFilamentColor={setFormFilamentColor}
        formWeightGrams={formWeightGrams} setFormWeightGrams={setFormWeightGrams}
        formPrintTime={formPrintTime} setFormPrintTime={setFormPrintTime}
        formPriceCharged={formPriceCharged} setFormPriceCharged={setFormPriceCharged}
        formPlatform={formPlatform} setFormPlatform={setFormPlatform}
        formStatus={formStatus} setFormStatus={setFormStatus}
        formPrinterId={formPrinterId} setFormPrinterId={setFormPrinterId}
        deadlineDays={deadlineDays} setDeadlineDays={setDeadlineDays}
        formCreatedAt={formCreatedAt} setFormCreatedAt={setFormCreatedAt}
        formPaymentMethod={formPaymentMethod} setFormPaymentMethod={setFormPaymentMethod}
        formPaymentStatus={formPaymentStatus} setFormPaymentStatus={setFormPaymentStatus}
        formImageUrl={formImageUrl} setFormImageUrl={setFormImageUrl}
      />
      </>)}
    </div>
  );
};