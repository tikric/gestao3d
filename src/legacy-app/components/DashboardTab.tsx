// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { Client, Printer, PrintOrder, FilamentStock, Expense, ShoppingItem } from '../types';
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  ShoppingBag, 
  Plus, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  Camera, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  MessageSquare,
  HelpCircle,
  Share2,
  Bell,
  ArrowRight
} from 'lucide-react';
import { PrinterCameraModal } from './PrinterCameraModal';
import { Print3DPanel } from '@/components/print3d/Print3DDashboard';

interface DashboardTabProps {
  orders: PrintOrder[];
  printers: Printer[];
  filamentStocks: FilamentStock[];
  expenses: Expense[];
  shoppingItems?: ShoppingItem[];
  clients?: Client[];
  tuyaDevices?: any[];
  onSelectTab: (tab: number) => void;
  onUpdatePrinter: (id: number, updated: Partial<Printer>) => void;
  onUpdateOrder?: (id: number, updated: Partial<PrintOrder>) => void;
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

const readLowestFilamentQuote = () => {
  const fallback = { type: 'PETG', price: 72.9, limit: 80 };
  if (typeof window === 'undefined') return fallback;

  const limits: Record<string, number> = {
    PLA: Number(localStorage.getItem('bambuzau_alert_price_pla') || 85),
    PETG: Number(localStorage.getItem('bambuzau_alert_price_petg') || 80),
    TPU: Number(localStorage.getItem('bambuzau_alert_price_tpu') || 115),
  };

  try {
    const cached = JSON.parse(localStorage.getItem('bambuzau_cached_quotes') || '[]');
    const quotes = Array.isArray(cached)
      ? cached.flatMap((group: any) =>
          Array.isArray(group?.offers)
            ? group.offers
                .map((offer: any) => ({ type: String(group.type || '').toUpperCase(), price: Number(offer.price), limit: limits[String(group.type || '').toUpperCase()] }))
                .filter((offer: any) => offer.type && Number.isFinite(offer.price) && offer.price > 0)
            : [],
        )
      : [];
    return quotes.sort((a: any, b: any) => a.price - b.price)[0] || fallback;
  } catch {
    return fallback;
  }
};

function PremiumInsightTicker({
  orders,
  printers,
  filamentStocks,
  expenses,
  shoppingItems,
  onSelectTab,
}: {
  orders: PrintOrder[];
  printers: Printer[];
  filamentStocks: FilamentStock[];
  expenses: Expense[];
  shoppingItems: ShoppingItem[];
  onSelectTab: (tab: number) => void;
}) {
  const [active, setActive] = useState(0);

  const insights = useMemo(() => {
    const lowStock = filamentStocks.filter(f => f.stockGrams < f.minStockGrams);
    const activePrints = printers.filter(p => p.status === 'PRINTING');
    const waitingOrders = orders.filter(o => o.status === 'WAITING' || o.status === 'QUEUE');
    const readyOrders = orders.filter(o => o.status === 'READY');
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const monthRevenue = orders
      .filter(o => (o.createdAt || 0) >= monthStart && o.status !== 'WAITING')
      .reduce((sum, o) => sum + (o.priceCharged || 0), 0);
    const monthExpense = expenses
      .filter(e => (e.date || 0) >= monthStart)
      .reduce((sum, e) => sum + ((e.amount || 0) * (e.qty || 1)), 0) +
      shoppingItems.filter(i => !i.isChecked).reduce((sum, i) => sum + (i.price || 0), 0);
    const margin = monthRevenue > 0 ? ((monthRevenue - monthExpense) / monthRevenue) * 100 : 0;
    const bestQuote = readLowestFilamentQuote();
    const lastAuditTs = Number(
      typeof window !== 'undefined' ? localStorage.getItem('bambuzau_last_audit_ts') || 0 : 0,
    );
    const daysSinceAudit = lastAuditTs > 0
      ? Math.floor((Date.now() - lastAuditTs) / (1000 * 60 * 60 * 24))
      : 999;
    const auditOverdue = daysSinceAudit >= 3;

    const list = [
      {
        tone: 'ok',
        problem: false,
        eyebrow: 'Oportunidade de compra',
        title: `${bestQuote.type} encontrado por ${formatBRL(bestQuote.price)}`,
        detail: bestQuote.price < bestQuote.limit
          ? `Abaixo do limite configurado de ${formatBRL(bestQuote.limit)}.`
          : 'Preço monitorado para reposição inteligente.',
        metric: bestQuote.price < bestQuote.limit ? 'Comprar agora' : 'Monitorar',
        icon: Bell,
        action: () => {
          localStorage.setItem('bambuzau_costs_subtab_override', 'QUOTE');
          onSelectTab(4);
        },
      },
      {
        tone: lowStock.length > 0 ? 'problem' : 'ok',
        problem: lowStock.length > 0,
        eyebrow: 'Estoque crítico',
        title: lowStock.length > 0 ? `${lowStock.length} bobina${lowStock.length > 1 ? 's' : ''} abaixo do mínimo` : 'Estoque dentro do planejado',
        detail: lowStock[0]?.type ? `${lowStock[0].type} precisa de atenção primeiro.` : 'Sem ruptura prevista neste momento.',
        metric: lowStock.length > 0 ? 'Repor estoque' : 'Saudável',
        icon: AlertTriangle,
        action: () => {
          localStorage.setItem('bambuzau_costs_subtab_override', 'STOCK');
          onSelectTab(4);
        },
      },
      {
        tone: margin < 25 && monthRevenue > 0 ? 'problem' : 'ok',
        problem: margin < 25 && monthRevenue > 0,
        eyebrow: 'Saúde financeira',
        title: `Margem do mês em ${margin.toFixed(1)}%`,
        detail: `${formatBRL(monthRevenue)} faturados com ${formatBRL(monthExpense)} em custos e compras abertas.`,
        metric: margin >= 25 ? 'Boa margem' : 'Revisar preço',
        icon: TrendingUp,
        action: () => onSelectTab(6),
      },
      {
        tone: 'ok',
        problem: false,
        eyebrow: 'Produção ao vivo',
        title: `${activePrints.length}/${printers.length || 0} impressoras trabalhando`,
        detail: waitingOrders.length > 0 ? `${waitingOrders.length} pedidos aguardando aceite ou fila.` : 'Fila sem gargalo de aceite agora.',
        metric: readyOrders.length > 0 ? `${readyOrders.length} prontos` : 'Fluxo limpo',
        icon: Cpu,
        action: () => onSelectTab(1),
      },
      {
        tone: auditOverdue ? 'problem' : 'ok',
        problem: auditOverdue,
        eyebrow: 'Auditoria de estoque',
        title: auditOverdue
          ? 'Recontagem de estoques pendente'
          : 'Auditoria física em dia',
        detail: auditOverdue
          ? `Última recontagem há ${daysSinceAudit === 999 ? '—' : daysSinceAudit} dias. Confira fisicamente e confirme.`
          : `Estoque físico auditado há ${daysSinceAudit} dias. Dados reais sincronizados.`,
        metric: auditOverdue ? 'Confirmar auditoria' : 'Tudo certo',
        icon: CheckCircle2,
        action: () => onSelectTab(4),
      },
    ];

    return list;
  }, [orders, printers, filamentStocks, expenses, shoppingItems, onSelectTab]);

  useEffect(() => {
    const timer = window.setInterval(() => setActive(index => (index + 1) % insights.length), 5200);
    return () => window.clearInterval(timer);
  }, [insights.length]);

  const current = insights[active] || insights[0];
  const Icon = current.icon;
  const isProblem = !!current.problem;
  const toneClass = isProblem
    ? 'from-[#5b0f1a]/20 via-[#b91c1c]/20 to-[#2a0608]/20 text-white shadow-rose-500/20'
    : 'from-[#063d33]/20 via-[#0f8a6a]/20 to-[#03201b]/20 text-white shadow-emerald-500/20';

  return (
    <section
      id="dashboard-premium-rotating-notification"
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-r ${toneClass} shadow-[0_24px_70px_-34px] backdrop-blur-xl animate-premium-fade`}
      aria-live="polite"
    >
      <div className={`pointer-events-none absolute inset-0 ${isProblem ? 'bg-rose-500/10' : 'bg-emerald-500/10'} backdrop-blur-md`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-28 w-52 -translate-y-1/2 rounded-full bg-white/10 blur-3xl transition-opacity duration-700 group-hover:opacity-80" />

      <div className="relative grid gap-3 px-4 py-1.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5 sm:py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-transform duration-500 group-hover:scale-105">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[8px] font-black uppercase tracking-[0.24em] text-white/65">{current.eyebrow}</div>
            <div key={current.title} className="truncate text-[12px] font-black tracking-tight text-white sm:text-[13px] animate-premium-fade">
              {current.title}
            </div>
          </div>
        </div>

        <p className="min-w-0 truncate text-[11px] font-medium leading-snug text-white/70 sm:border-l sm:border-white/12 sm:pl-4">
          {current.detail}
        </p>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="rounded-md border border-white/12 bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            {current.metric}
          </div>
          <button
            type="button"
            onClick={current.action}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(255,255,255,0.75)] active:scale-95"
          >
            Abrir
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

    </section>
  );
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  printers,
  filamentStocks,
  expenses,
  shoppingItems = [],
  clients = [],
  tuyaDevices = [],
  onSelectTab,
  onUpdatePrinter,
  onUpdateOrder
}) => {
  const [recentFeedback, setRecentFeedback] = useState<string | null>(null);
  const [selectedCameraPrinter, setSelectedCameraPrinter] = useState<Printer | null>(null);
  
  const handleRecalculate = () => {
    setRecentFeedback('Métricas sincronizadas em tempo real com o Ateliê!');
    setTimeout(() => setRecentFeedback(null), 3000);
  };

  // Month selector states
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey); // Default to current month!

  // Helpers to parse Year-Month
  const getYearMonth = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatMonthLabel = (monthKey: string) => {
    if (monthKey === 'ALL') return 'Geral (Total)';
    const [year, month] = monthKey.split('-');
    const monthNames: Record<string, string> = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };
    return `${monthNames[month] || month}/${year}`;
  };

  // Calculations
  const safeOrders = orders || [];
  const safeExpenses = expenses || [];
  const safeShoppingItems = shoppingItems || [];
  const safePrinters = printers || [];
  const safeFilaments = filamentStocks || [];

  // Extract all available months having data to provide clicks on past months
  const availableMonths = Array.from(new Set([
    currentMonthKey,
    ...safeOrders.map(o => getYearMonth(o.createdAt || Date.now())),
    ...safeExpenses.map(e => getYearMonth(e.date || Date.now()))
  ])).sort().reverse();

  // Filter datasets based on selected month
  const filteredOrders = selectedMonth === 'ALL' 
    ? safeOrders 
    : safeOrders.filter(o => getYearMonth(o.createdAt) === selectedMonth);

  const filteredExpenses = selectedMonth === 'ALL'
    ? safeExpenses
    : safeExpenses.filter(e => getYearMonth(e.date) === selectedMonth);

  // Faturamento (Revenue) based on filtered orders
  const monthRevenue = filteredOrders
    .filter(o => o.status !== 'WAITING')
    .reduce((sum, o) => sum + o.priceCharged, 0);

  // Despesas (Expenses) based on filtered expenses
  const shoppingExpense = safeShoppingItems.reduce((sum, s) => sum + s.price, 0);
  const monthExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount * e.qty), 0) + 
    (selectedMonth === currentMonthKey || selectedMonth === 'ALL' ? shoppingExpense : 0);

  const pendingRevenue = filteredOrders
    .filter(o => o.status === 'QUEUE' || o.status === 'PRINTING' || o.status === 'POST_PROCESS' || o.status === 'READY')
    .reduce((sum, o) => sum + o.priceCharged, 0);

  // ROI (Return on Investment) calculation
  const monthRoi = monthExpense > 0 ? ((monthRevenue - monthExpense) / monthExpense) * 100 : 0;

  // Valor a Comprar (Unchecked Shopping List items value)
  const valorAComprar = safeShoppingItems
    .filter(s => !s.isChecked)
    .reduce((sum, s) => sum + s.price, 0);

  // Order count metrics
  const parsedOpenOrdersCount = safeOrders.filter(o => o.status !== 'DELIVERED').length;
  const parsedDeliveredOrdersCount = filteredOrders.filter(o => o.status === 'DELIVERED').length;
  const parsedReadyToDeliverCount = safeOrders.filter(o => o.status === 'READY').length;

  // Profit Margin
  const monthProfitMargin = monthRevenue > 0 ? ((monthRevenue - monthExpense) / monthRevenue) * 100 : 0;

  // Active prints
  const activePrinters = safePrinters.filter(p => p.status === 'PRINTING');
  const alertFilaments = safeFilaments.filter(f => f.stockGrams < f.minStockGrams);

  // Sparkline data calculation
  const orderValues = filteredOrders.slice(-6).map(o => o.priceCharged);
  const maxOrderVal = Math.max(...orderValues, 100);

  // Monthly Calendar logic:
  const calendarActiveMonth = selectedMonth === 'ALL' ? currentMonthKey : selectedMonth;
  const [calYearStr, calMonthStr] = calendarActiveMonth.split('-');
  const calYear = parseInt(calYearStr);
  const calMonth = parseInt(calMonthStr) - 1; // 0-indexed month

  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // Day of week (0-6)

  const getDaySales = (day: number) => {
    const startOfDay = new Date(calYear, calMonth, day, 0, 0, 0).getTime();
    const endOfDay = new Date(calYear, calMonth, day, 23, 59, 59).getTime();
    
    return safeOrders
      .filter(o => o.createdAt >= startOfDay && o.createdAt <= endOfDay)
      .reduce((sum, o) => sum + o.priceCharged, 0);
  };

  return (
    <div className="space-y-2" id="dashboard_tab_container">
      {/* ===== PRINT3D PANEL (real data) ===== */}
      <Print3DPanel
        orders={orders}
        printers={printers}
        filamentStocks={filamentStocks}
        expenses={expenses}
        clients={clients}
        shoppingItems={shoppingItems}
        tuyaDevices={tuyaDevices}
        onSelectTab={onSelectTab}
        topNotification={(
          <PremiumInsightTicker
            orders={orders}
            printers={printers}
            filamentStocks={filamentStocks}
            expenses={expenses}
            shoppingItems={shoppingItems}
            onSelectTab={onSelectTab}
          />
        )}
      />

    </div>
  );
};