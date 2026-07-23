import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Send,
  Settings2,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  Truck,
  ShoppingCart,
  DollarSign,
  Hammer,
  CalendarClock,
  AlertTriangle,
  Clock,
  Sparkles,
  Wrench,
  CheckSquare,
  Info,
  RefreshCw,
  Zap,
  Filter,
  Search,
  Calendar as CalendarIcon,
  Edit3,
  UserCheck,
  Flame,
  Bell,
  ArrowRight,
  Check,
  X,
  Download,
  Upload
} from "lucide-react";

type SendState = "idle" | "sending" | "ok" | "err";

export type Event = {
  id: string;
  date: string;
  title: string;
  time?: string;
  category?: "DELIVERY_BATCH" | "NORMAL_ORDER" | "CUSTOM_ORDER" | "MAINTENANCE" | "SHOPPING" | "EVENT";
  notes?: string;
  orderId?: number;
  hermesSentAt?: number;
  hermesStatus?: SendState;
  hermesError?: string;
  opencodeSentAt?: number;
  opencodeStatus?: SendState;
  opencodeError?: string;
};

const STORAGE_KEY = "agenda-events-v1";
const HERMES_CFG_KEY = "agenda-hermes-cfg-v1";
const OPENCODE_CFG_KEY = "agenda-opencode-cfg-v1";

type HermesCfg = { url: string; secret: string; auto: boolean };
const DEFAULT_CFG: HermesCfg = { url: "", secret: "", auto: false };

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtTs(ts: number) {
  if (!ts) return "";
  const d = new Date(ts);
  return fmt(d);
}

function brl(n: number) {
  return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// SLA Rule Helpers
const KEYWORDS_PERSONALIZADO = [
  "personalizado",
  "custom",
  "nome",
  "foto",
  "exclusivo",
  "customizado",
  "projeto",
  "desenho",
  "sob medida",
  "troféu",
  "trofeu",
  "placa",
  "letreiro",
  "busto",
  "action figure",
  "logo",
  "logomarca",
  "chaveiro nome"
];

export function isPersonalizedOrder(o: any): boolean {
  if (o.isPersonalized === true || o.isCustom === true) return true;
  const name = String(o.itemName || "").toLowerCase();
  const client = String(o.clientName || "").toLowerCase();
  return KEYWORDS_PERSONALIZADO.some((kw) => name.includes(kw) || client.includes(kw));
}

export function getSlaDays(o: any): number {
  return isPersonalizedOrder(o) ? 5 : 1;
}

export function calculateSlaDeadline(createdAtMs: number, isCustom: boolean): number {
  const days = isCustom ? 5 : 1;
  return createdAtMs + days * 24 * 3600 * 1000;
}

type DerivedItem = {
  kind: "sale" | "delivery_normal" | "delivery_custom" | "delivery_batch" | "expense" | "pending_normal" | "pending_custom" | "shopping" | "produced" | "maintenance";
  id?: string | number;
  orderId?: number;
  title: string;
  meta?: string;
  amount?: number;
  clientName?: string;
  time?: string;
  status?: string;
  deadlineStr?: string;
  isOverdue?: boolean;
  overdueDays?: number;
  isCustom?: boolean;
  slaDays?: number;
};

// Hermes Webhook Dispatch
async function sendToHermes(cfg: HermesCfg, payload: any) {
  if (!cfg.url) throw new Error("Webhook do Hermes não configurado");
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cfg.secret ? { Authorization: `Bearer ${cfg.secret}` } : {}),
    },
    body: JSON.stringify({
      source: "hermes-agenda-gestao3d",
      timestamp: new Date().toISOString(),
      ...payload,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function AgendaPage() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [cursor, setCursor] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState<Event["category"]>("EVENT");
  const [notes, setNotes] = useState("");
  const [cfg, setCfg] = useState<HermesCfg>(DEFAULT_CFG);
  const [showCfg, setShowCfg] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "OVERDUE" | "NORMAL" | "CUSTOM" | "BATCH" | "MAINTENANCE" | "SHOPPING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // App Data
  const [orders, setOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [shopping, setShopping] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);

  // Selected Detail Modal State
  const [detailModal, setDetailModal] = useState<{
    type: "order" | "event" | "batch";
    data: any;
  } | null>(null);

  // Mount Init
  useEffect(() => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(fmt(d));
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
      const rawCfg = localStorage.getItem(HERMES_CFG_KEY) || localStorage.getItem(OPENCODE_CFG_KEY);
      if (rawCfg) setCfg({ ...DEFAULT_CFG, ...JSON.parse(rawCfg) });
    } catch {}

    const loadData = () => {
      try {
        setOrders(JSON.parse(localStorage.getItem("bambuzau_orders") || "[]"));
        setExpenses(JSON.parse(localStorage.getItem("bambuzau_expenses") || "[]"));
        setShopping(JSON.parse(localStorage.getItem("bambuzau_shopping") || "[]"));
        setCatalog(JSON.parse(localStorage.getItem("bambuzau_local_catalog_production") || "[]"));
        setMaintenances(JSON.parse(localStorage.getItem("bambuzau_manutencao") || "[]"));
      } catch {}
    };
    loadData();
    const onStorage = () => loadData();
    window.addEventListener("storage", onStorage);
    const t = window.setInterval(loadData, 3000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(HERMES_CFG_KEY, JSON.stringify(cfg));
      localStorage.setItem(OPENCODE_CFG_KEY, JSON.stringify(cfg));
    }
  }, [cfg, mounted]);

  // Calendar cells
  const cells = useMemo(() => {
    if (!cursor) return [];
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: { date: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, month, 1 - (startDow - i));
      arr.push({ date: fmt(d), day: d.getDate(), inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      arr.push({ date: fmt(d), day: i, inMonth: true });
    }
    let nextDay = 1;
    while (arr.length % 7 !== 0 || arr.length < 42) {
      const d = new Date(year, month + 1, nextDay++);
      arr.push({ date: fmt(d), day: d.getDate(), inMonth: false });
      if (arr.length >= 42) break;
    }
    return arr;
  }, [cursor]);

  const monthLabel = cursor
    ? cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "";
  const today = mounted ? fmt(new Date()) : "";
  const todayMs = mounted ? new Date(`${today}T00:00:00`).getTime() : 0;

  // Process and group all calendar data
  const derivedByDate = useMemo(() => {
    const map = new Map<string, DerivedItem[]>();
    const push = (date: string, item: DerivedItem) => {
      if (!date) return;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(item);
    };

    // Orders processed according to SLA rules (1D normal, 5D custom)
    for (const o of orders) {
      const created = o.createdAt ? fmtTs(o.createdAt) : "";
      const isCustom = isPersonalizedOrder(o);
      const slaDays = isCustom ? 5 : 1;

      // Ensure proper deadline calculated if missing
      const deadlineMs = o.deadline || calculateSlaDeadline(o.createdAt || Date.now(), isCustom);
      const due = fmtTs(deadlineMs);

      const label = `${o.itemName || "Peça 3D"} × ${o.quantity || 1}`;
      const meta = o.clientName ? `Cliente: ${o.clientName}` : undefined;
      const isDelivered = o.status === "DELIVERED";

      // Calculate Overdue status
      const dueMs = new Date(`${due}T00:00:00`).getTime();
      const isOverdue = !isDelivered && dueMs < todayMs;
      const overdueDays = isOverdue ? Math.max(1, Math.floor((todayMs - dueMs) / (24 * 3600 * 1000))) : 0;

      // Sale Creation Day
      if (created) {
        push(created, {
          kind: "sale",
          id: o.id,
          orderId: o.id,
          title: label,
          meta,
          amount: o.priceCharged,
          clientName: o.clientName,
          status: o.status,
          isCustom,
          slaDays,
        });
      }

      // Delivery SLA Due Day
      if (due) {
        if (isDelivered) {
          push(due, {
            kind: "delivery_batch",
            id: o.id,
            orderId: o.id,
            title: `[ENTREGUE] ${label}`,
            meta,
            amount: o.priceCharged,
            clientName: o.clientName,
            time: "09:00",
            status: o.status,
            isCustom,
            slaDays,
          });
        } else {
          push(due, {
            kind: isCustom ? "pending_custom" : "pending_normal",
            id: o.id,
            orderId: o.id,
            title: `${label}`,
            meta: `SLA ${slaDays}D · ${o.status || "FILA"}${meta ? " · " + meta : ""}`,
            amount: o.priceCharged,
            clientName: o.clientName,
            time: "09:00",
            status: o.status,
            deadlineStr: due,
            isOverdue,
            overdueDays,
            isCustom,
            slaDays,
          });
        }
      }
    }

    // Expenses / Purchases
    for (const e of expenses) {
      const d = e.date ? fmtTs(e.date) : "";
      if (!d) continue;
      push(d, {
        kind: "expense",
        id: e.id,
        title: `${e.description || "Insumo / Compra"}${e.qty > 1 ? ` × ${e.qty}` : ""}`,
        meta: e.category,
        amount: e.amount,
      });
    }

    // Maintenances
    for (const m of maintenances) {
      const dProgramada = m.dataProgramada ? m.dataProgramada : "";
      if (dProgramada) {
        push(dProgramada, {
          kind: "maintenance",
          id: m.id,
          title: `[MANUTENÇÃO] ${m.titulo || "Revisão Preventiva"}`,
          meta: `Status: ${m.status.toUpperCase()} · Tipo: ${m.tipo}`,
          status: m.status,
        });
      }
    }

    return map;
  }, [orders, expenses, maintenances, todayMs]);

  // Global Overdue List & Metrics
  const allOverdueOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === "DELIVERED" || o.status === "CANCELLED") return false;
      const isCustom = isPersonalizedOrder(o);
      const deadlineMs = o.deadline || calculateSlaDeadline(o.createdAt || Date.now(), isCustom);
      const dueStr = fmtTs(deadlineMs);
      const dueMs = new Date(`${dueStr}T00:00:00`).getTime();
      return dueMs < todayMs;
    }).map((o) => {
      const isCustom = isPersonalizedOrder(o);
      const deadlineMs = o.deadline || calculateSlaDeadline(o.createdAt || Date.now(), isCustom);
      const dueStr = fmtTs(deadlineMs);
      const dueMs = new Date(`${dueStr}T00:00:00`).getTime();
      const overdueDays = Math.max(1, Math.floor((todayMs - dueMs) / (24 * 3600 * 1000)));
      return { ...o, isCustom, slaDays: isCustom ? 5 : 1, dueStr, overdueDays };
    });
  }, [orders, todayMs]);

  // Recalculate and apply 1D / 5D SLA to all orders in localStorage
  const handleApplySlaToAllOrders = () => {
    const updated = orders.map((o) => {
      const isCustom = isPersonalizedOrder(o);
      const createdMs = o.createdAt || Date.now();
      const newDeadline = calculateSlaDeadline(createdMs, isCustom);
      return { ...o, deadline: newDeadline, isPersonalized: isCustom };
    });
    setOrders(updated);
    localStorage.setItem("bambuzau_orders", JSON.stringify(updated));
    alert("✅ Prazos SLA de 1 Dia (Normal) e 5 Dias (Personalizado) recalibrados para todos os pedidos!");
  };

  // Bulk dispatch batch 09:00h delivery
  const handleDispatchBatchAt09 = (dateStr: string) => {
    const itemsOnDate = derivedByDate.get(dateStr) || [];
    const pendingOrderIds = itemsOnDate
      .filter((i) => (i.kind === "pending_normal" || i.kind === "pending_custom") && i.orderId)
      .map((i) => i.orderId);

    if (pendingOrderIds.length === 0) {
      alert("Nenhum pedido pendente para expedir na data selecionada.");
      return;
    }

    if (!window.confirm(`Deseja marcar os ${pendingOrderIds.length} pedido(s) do lote de 09:00h como DELIVERED (Entregues)?`)) {
      return;
    }

    const updated = orders.map((o) => {
      if (pendingOrderIds.includes(o.id)) {
        return { ...o, status: "DELIVERED" };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("bambuzau_orders", JSON.stringify(updated));

    // Send Hermes notification if enabled
    if (cfg.url) {
      void sendToHermes(cfg, {
        action: "BATCH_DISPATCH_09AM",
        date: dateStr,
        time: "09:00",
        totalDispatched: pendingOrderIds.length,
        dispatchedOrderIds: pendingOrderIds,
      });
    }

    alert(`🚀 Lote de 09:00h despachado com sucesso! ${pendingOrderIds.length} pedido(s) marcados como Entregues.`);
  };

  // Hermes dispatch for single event or order
  const handleHermesDispatch = async (payload: any) => {
    try {
      await sendToHermes(cfg, payload);
      alert("⚡ Evento enviado com sucesso para a API do Hermes!");
    } catch (err: any) {
      alert(`Erro ao enviar ao Hermes: ${err?.message || "Falha de conexão"}`);
    }
  };

  const [syncingNotion, setSyncingNotion] = useState(false);

  const exportToJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      events,
      orders,
      expenses,
      shopping,
      catalog,
      derivedByDate: Object.fromEntries(derivedByDate),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gestao3d_agenda_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncToNotion = async () => {
    setSyncingNotion(true);
    try {
      const payload = {
        events: events.map((e) => ({
          nome: e.title,
          data_iso: e.date,
          hora: e.time || null,
          tipo: "👤 Pessoal",
          origem: "Gestão3D",
          descricao: e.notes || "",
        })),
        orders: orders.map((o) => ({
          nome: `${o.itemName || "Pedido"} x${o.quantity || 1}`,
          data_iso: o.deadline ? fmtTs(o.deadline) : "",
          tipo: o.status === "DELIVERED" ? "🚚 Entrega" : "📦 Pedido",
          origem: "Gestão3D",
          valor: o.priceCharged,
          descricao: o.clientName || "",
          link: typeof window !== "undefined" ? window.location.href : "",
        })),
        expenses: expenses.map((e) => ({
          nome: e.description || "Despesa",
          data_iso: e.date ? fmtTs(e.date) : "",
          tipo: "🛒 Comprar",
          origem: "Gestão3D",
          valor: e.amount,
        })),
      };
      const resp = await fetch("/api/notion-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const resData = await resp.json().catch(() => ({}));
        alert(`✓ Sincronizado com Notion! (${resData.created ?? 0} itens processados)`);
      } else {
        const err = await resp.text();
        alert(`✗ Erro na sincronização: ${err}`);
      }
    } catch (e: any) {
      alert(`✗ Erro de conexão: ${e?.message || e}`);
    } finally {
      setSyncingNotion(false);
    }
  };

  // Form submit for adding manual event
  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selected) return;
    const ev: Event = {
      id: crypto.randomUUID(),
      date: selected,
      title: title.trim(),
      time: time || "09:00",
      category,
      notes: notes.trim() || undefined,
    };
    setEvents((prev) => [...prev, ev]);
    setTitle("");
    setNotes("");

    if (cfg.auto && cfg.url) {
      void handleHermesDispatch({ event: ev });
    }
  };

  // Day specific items
  const dayDerived = derivedByDate.get(selected) || [];
  const daySales = dayDerived.filter((d) => d.kind === "sale");
  const dayDeliveriesBatch = dayDerived.filter((d) => d.kind === "delivery_batch");
  const dayPendingNormal = dayDerived.filter((d) => d.kind === "pending_normal");
  const dayPendingCustom = dayDerived.filter((d) => d.kind === "pending_custom");
  const dayExpenses = dayDerived.filter((d) => d.kind === "expense");
  const dayMaintenances = dayDerived.filter((d) => d.kind === "maintenance");

  const dayEvents = events
    .filter((e) => e.date === selected)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const isPast = selected && today ? selected < today : false;
  const isFuture = selected && today ? selected > today : false;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050507] text-white">
      {/* Background glow styling */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-1/4 h-[420px] w-[420px] rounded-full bg-[#b7ff00]/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1600px] px-4 py-8 md:px-8">
        {/* Top Header */}
        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#b7ff00]">
              <Sparkles className="w-4 h-4 text-[#b7ff00]" /> Hermes Smart Calendar Engine
            </div>
            <h1
              className="text-3xl font-light tracking-tight text-white md:text-4xl"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Agenda de Pedidos, Entregas & Prazos SLA
            </h1>
            <p className="mt-1 text-xs text-white/60">
              Controle automático de SLA de <span className="text-emerald-300 font-semibold">1 Dia (Normal)</span> e <span className="text-purple-300 font-semibold">5 Dias (Personalizado)</span> com lote diário das <span className="text-amber-300 font-semibold">09:00h</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleApplySlaToAllOrders}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#b7ff00]/30 bg-[#b7ff00]/10 px-3.5 py-2 text-xs font-semibold text-[#b7ff00] hover:bg-[#b7ff00]/20 transition"
              title="Aplica prazos de 1 dia para peças normais e 5 dias para itens personalizados"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Recalcular Prazos SLA (1D / 5D)
            </button>

            <button
              onClick={() => setShowCfg((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                cfg.url
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-[#b7ff00]" />
              {cfg.url ? "Hermes Conectado" : "Conectar Hermes Engine"}
            </button>

            <button
              onClick={exportToJSON}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white"
              title="Baixar backup da agenda em formato JSON"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              Export JSON
            </button>

            <button
              onClick={syncToNotion}
              disabled={syncingNotion}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
              title="Sincronizar eventos e pedidos com a Agenda Central do Notion"
            >
              <Upload className={`h-3.5 w-3.5 ${syncingNotion ? "animate-spin text-emerald-300" : "text-emerald-400"}`} />
              {syncingNotion ? "Sincronizando..." : "Sync Notion"}
            </button>
          </div>
        </header>

        {/* OVERDUE ALERT BANNER */}
        {allOverdueOrders.length > 0 && (
          <div className="mb-6 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/60 via-black to-black p-4 shadow-[0_0_30px_-10px_rgba(244,63,94,0.3)] animate-pulse">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      🚨 ALERTA CRÍTICO: {allOverdueOrders.length} PEDIDO(S) EM ATRASO DE SLA
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">
                    Existem pedidos cujo prazo estipulado expirou antes da conclusão. Verifique e priorize o envio.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allOverdueOrders.slice(0, 4).map((o) => (
                      <span key={o.id} className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30 font-mono">
                        #{o.id} {o.itemName} ({o.clientName}) · Atrasado {o.overdueDays}d
                      </span>
                    ))}
                    {allOverdueOrders.length > 4 && (
                      <span className="text-[11px] text-rose-400 self-center">+{allOverdueOrders.length - 4} mais...</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveFilter("OVERDUE")}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition shrink-0 flex items-center gap-1.5 shadow-lg"
              >
                <Flame className="w-4 h-4" /> Ver Pedidos em Atraso
              </button>
            </div>
          </div>
        )}

        {/* Hermes Config Panel */}
        {showCfg && (
          <div className="mb-6 rounded-2xl border border-[#b7ff00]/30 bg-black/80 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#b7ff00]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Integração Webhook do Hermes Engine
                </span>
              </div>
              <button onClick={() => setShowCfg(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-xs">
                <span className="text-white/60">URL do Webhook Hermes</span>
                <input
                  value={cfg.url}
                  onChange={(e) => setCfg((c) => ({ ...c, url: e.target.value }))}
                  placeholder="https://hermes.ai/api/webhooks/agenda-3d"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#b7ff00] focus:outline-none"
                />
              </label>
              <label className="block text-xs">
                <span className="text-white/60">Bearer Token / Secret (opcional)</span>
                <input
                  value={cfg.secret}
                  onChange={(e) => setCfg((c) => ({ ...c, secret: e.target.value }))}
                  type="password"
                  placeholder="Bearer token secret"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#b7ff00] focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={cfg.auto}
                  onChange={(e) => setCfg((c) => ({ ...c, auto: e.target.checked }))}
                  className="h-3.5 w-3.5 accent-[#b7ff00]"
                />
                Disparar eventos automaticamente ao criar compromissos
              </label>
              <button
                onClick={() => handleHermesDispatch({ ping: true, message: "Teste de conexão Hermes Engine" })}
                disabled={!cfg.url}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 disabled:opacity-40"
              >
                Testar Webhook Hermes
              </button>
            </div>
          </div>
        )}

        {/* Legend / Color Taxonomies */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02] border border-white/10 rounded-2xl p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-white/50 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#b7ff00]" /> Legenda de Prazos & Cores:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Pedido Normal (SLA 1D)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Personalizado (SLA 5D)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Entrega Diária (09:00h)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Em Atraso
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Compras / Insumos
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#b7ff00]/15 text-[#b7ff00] border border-[#b7ff00]/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#b7ff00]" /> Manutenção 3D
            </span>
          </div>
        </div>

        {/* Main Grid: Calendar Left, Details Right */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar Widget */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3
                className="text-base font-medium capitalize text-white"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {monthLabel || "\u00a0"}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCursor((c) => (c ? new Date(c.getFullYear(), c.getMonth() - 1, 1) : c))
                  }
                  className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 text-white/70 hover:bg-white/10 transition"
                  title="Mês anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                    setSelected(fmt(d));
                  }}
                  className="rounded-xl border border-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/10 transition"
                >
                  Hoje
                </button>
                <button
                  onClick={() =>
                    setCursor((c) => (c ? new Date(c.getFullYear(), c.getMonth() + 1, 1) : c))
                  }
                  className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 text-white/70 hover:bg-white/10 transition"
                  title="Próximo mês"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {!mounted
                ? Array.from({ length: 42 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl border border-white/5 bg-white/[0.01]" />
                  ))
                : cells.map((cell, idx) => {
                    const isToday = cell.date === today;
                    const isSel = cell.date === selected;

                    const dayItems = derivedByDate.get(cell.date) || [];
                    const hasOverdue = dayItems.some((i) => i.isOverdue);
                    const hasPendingNormal = dayItems.some((i) => i.kind === "pending_normal");
                    const hasPendingCustom = dayItems.some((i) => i.kind === "pending_custom");
                    const countTotal = dayItems.length;

                    return (
                      <button
                        key={`${cell.date}-${idx}`}
                        onClick={() => setSelected(cell.date)}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border text-xs transition-all ${
                          isSel
                            ? "border-[#b7ff00] bg-[#b7ff00]/15 shadow-[0_0_15px_-3px_rgba(183,255,0,0.4)]"
                            : isToday
                            ? "border-cyan-400 bg-cyan-500/10"
                            : hasOverdue
                            ? "border-rose-500/80 bg-rose-500/10 font-bold text-rose-300 shadow-[0_0_10px_-2px_rgba(244,63,94,0.3)]"
                            : cell.inMonth
                            ? "border-white/5 bg-white/[0.02] hover:border-white/20 text-white"
                            : "border-transparent text-white/20"
                        }`}
                      >
                        <span className={isToday ? "font-bold text-cyan-300" : isSel ? "font-bold text-[#b7ff00]" : ""}>
                          {cell.day}
                        </span>

                        {/* Indicators under cell date */}
                        {countTotal > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                            {hasPendingNormal && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            {hasPendingCustom && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                            {!hasOverdue && !hasPendingNormal && !hasPendingCustom && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
            </div>

            {/* Batch 09:00h Card for Selected Date */}
            <div className="pt-2 border-t border-white/10">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-black to-black border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Lote de Entrega Diária: 09:00h
                    </div>
                    <div className="text-[11px] text-white/60">
                      {(dayPendingNormal.length + dayPendingCustom.length)} pedido(s) previstos para entrega em {selected ? new Date(selected + "T00:00").toLocaleDateString("pt-BR") : "hoje"}.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDispatchBatchAt09(selected)}
                  disabled={dayPendingNormal.length + dayPendingCustom.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition disabled:opacity-40 shrink-0"
                >
                  Despachar 09h
                </button>
              </div>
            </div>
          </div>

          {/* Day View & Details Right */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#b7ff00]" />
                  {selected
                    ? new Date(selected + "T00:00").toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Selecione uma data"}
                </h3>
                <span className="text-xs text-white/40 font-mono">
                  {dayDerived.length + dayEvents.length} registro(s) no dia
                </span>
              </div>

              {/* Day Events and Pending Deliveries List */}
              <div className="space-y-4 mb-6">
                {/* 1. OVERDUE WARNING FOR SELECTED DAY IF ANY */}
                {dayDerived.some((i) => i.isOverdue) && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Atenção: Este dia possui entregas atrasadas que necessitam de atenção imediata!</span>
                  </div>
                )}

                {/* 2. BATCH DISPATCH SECTION AT 09:00H */}
                {(dayPendingNormal.length > 0 || dayPendingCustom.length > 0) && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                        <Truck className="w-4 h-4 text-amber-400" /> Lote de Expedição Diária das 09:00h
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-semibold border border-amber-500/30">
                        {dayPendingNormal.length + dayPendingCustom.length} Pacotes
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayPendingNormal.map((item, idx) => (
                        <div
                          key={`norm-${idx}`}
                          className="flex flex-wrap items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              SLA 1D
                            </span>
                            <span className="font-semibold text-white">{item.title}</span>
                            {item.clientName && <span className="text-white/50">({item.clientName})</span>}
                          </div>
                          <span className="text-emerald-300 font-semibold">{brl(item.amount || 0)}</span>
                        </div>
                      ))}

                      {dayPendingCustom.map((item, idx) => (
                        <div
                          key={`cust-${idx}`}
                          className="flex flex-wrap items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              SLA 5D PERSONALIZADO
                            </span>
                            <span className="font-semibold text-white">{item.title}</span>
                            {item.clientName && <span className="text-white/50">({item.clientName})</span>}
                          </div>
                          <span className="text-purple-300 font-semibold">{brl(item.amount || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. SALES CREATED ON THIS DAY */}
                {daySales.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Pedidos Recebidos no Dia ({daySales.length})
                    </div>
                    <div className="space-y-1.5">
                      {daySales.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-white/80 p-1.5 rounded hover:bg-white/5">
                          <span>• {s.title} {s.clientName && `· ${s.clientName}`}</span>
                          <span className="font-semibold text-emerald-300">{brl(s.amount || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. MAINTENANCES */}
                {dayMaintenances.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#b7ff00]/10 border border-[#b7ff00]/20">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#b7ff00] mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Manutenções de Impressoras ({dayMaintenances.length})
                    </div>
                    <div className="space-y-1.5">
                      {dayMaintenances.map((m, idx) => (
                        <div key={idx} className="text-xs text-white/90 p-1.5 rounded bg-white/5">
                          {m.title} <span className="text-white/50">({m.meta})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. PURCHASES & EXPENSES */}
                {dayExpenses.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-2 flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5" /> Compras & Insumos do Dia ({dayExpenses.length})
                    </div>
                    <div className="space-y-1.5">
                      {dayExpenses.map((e, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-white/80 p-1.5 rounded hover:bg-white/5">
                          <span>• {e.title} {e.meta && `(${e.meta})`}</span>
                          <span className="font-semibold text-blue-300">{brl(e.amount || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. MANUAL EVENTS LIST */}
                {dayEvents.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Compromissos Agendados ({dayEvents.length})
                    </div>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[#b7ff00] font-bold">{ev.time || "09:00"}</span>
                          <span className="font-medium text-white">{ev.title}</span>
                          {ev.notes && <span className="text-white/40">({ev.notes})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleHermesDispatch({ event: ev })}
                            className="p-1.5 rounded bg-white/10 text-white/70 hover:text-white"
                            title="Enviar ao Hermes"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEvents((prev) => prev.filter((x) => x.id !== ev.id))}
                            className="p-1.5 rounded text-white/40 hover:text-rose-400"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dayDerived.length === 0 && dayEvents.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <CalendarIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/50">Nenhum pedido ou compromisso agendado para este dia.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form to Add New Event / Schedule */}
            <form onSubmit={addEvent} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#b7ff00]" /> Agendar Novo Evento ou Lembrete no Dia ({selected})
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do compromisso..."
                  className="md:col-span-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-[#b7ff00] focus:outline-none"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-[#b7ff00] focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações adicionais..."
                  className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-[#b7ff00] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#b7ff00] text-black font-bold text-xs hover:bg-[#a3e600] transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* PRÓXIMOS 7 DIAS EM BLOCOS VISUAIS */}
        {mounted && (
          <div className="mt-8 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#b7ff00]" /> Visão Cronológica dos Próximos 7 Dias
            </div>

            <div className="grid gap-3">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                d.setDate(d.getDate() + i);
                const key = fmt(d);
                const derived = derivedByDate.get(key) || [];
                const evs = events.filter((e) => e.date === key);
                const sales = derived.filter((x) => x.kind === "sale");
                const pendingNorm = derived.filter((x) => x.kind === "pending_normal");
                const pendingCust = derived.filter((x) => x.kind === "pending_custom");
                const isToday = i === 0;

                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all flex items-stretch gap-4 ${
                      selected === key
                        ? "border-[#b7ff00] bg-[#b7ff00]/10 shadow-[0_0_20px_-8px_rgba(183,255,0,0.3)]"
                        : isToday
                        ? "border-cyan-400/50 bg-cyan-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="shrink-0 w-24 border-r border-white/10 pr-4">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-cyan-300" : "text-white/40"}`}>
                        {isToday ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short" })}
                      </p>
                      <p className="text-2xl font-bold leading-none mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                        {d.getDate()}
                      </p>
                      <p className="mt-1 text-[10px] text-white/40">
                        {d.toLocaleDateString("pt-BR", { month: "short" })}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-4 text-xs">
                      {pendingNorm.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{pendingNorm.length} Entrega(s) SLA 1D (Normal)</span>
                        </div>
                      )}

                      {pendingCust.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{pendingCust.length} Entrega(s) SLA 5D (Personalizado)</span>
                        </div>
                      )}

                      {sales.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{sales.length} Venda(s) Criada(s)</span>
                        </div>
                      )}

                      {evs.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#b7ff00]" />
                          <span>{evs.length} Compromisso(s)</span>
                        </div>
                      )}

                      {derived.length === 0 && evs.length === 0 && (
                        <span className="text-white/30 text-xs italic">Sem registros para esta data.</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgendaPage;
