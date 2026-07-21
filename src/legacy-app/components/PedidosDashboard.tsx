import React, { useMemo } from 'react';
import { RobotMascot } from './RobotMascot';
import type { PrintOrder } from '../types';
import {
  ShoppingBag, Clock, Hammer, CheckCircle, Receipt, TrendingUp,
  Sparkles, ArrowRight, Package, Plus,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

const PLATFORM_LABEL: Record<string, string> = {
  MANUAL: 'Balcão',
  SHOPEE: 'Shopee',
  MERCADO_LIVRE: 'Mercado Livre',
  NUVEMSHOP: 'Nuvemshop',
  AMAZON: 'Amazon',
  TIKTOK_SHOP: 'TikTok Shop',
};

const PLATFORM_COLORS: Record<string, string> = {
  MANUAL: '#94A3B8',
  SHOPEE: '#EE4D2D',
  MERCADO_LIVRE: '#FFE600',
  NUVEMSHOP: '#00ADF0',
  AMAZON: '#FF9900',
  TIKTOK_SHOP: '#FE2C55',
};

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Aguardando',
  QUEUE: 'Na Fila',
  PRINTING: 'Imprimindo',
  POST_PROCESS: 'Pós-Proc.',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
};

const STATUS_COLORS: Record<string, string> = {
  WAITING: '#FFFFFF',
  QUEUE: '#94A3B8',
  PRINTING: '#10B981',
  POST_PROCESS: '#A78BFA',
  READY: '#E2B144',
  DELIVERED: '#b7ff00',
};

interface Props {
  orders: PrintOrder[];
}

export const PedidosDashboard: React.FC<Props> = ({ orders }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const ordersToday = orders.filter(o => o.createdAt >= dayStart);
    const ordersMonth = orders.filter(o => o.createdAt >= monthStart);
    const revenueMonth = ordersMonth.reduce((s, o) => s + (o.priceCharged || 0), 0);
    const ticketMedio = ordersMonth.length ? revenueMonth / ordersMonth.length : 0;

    const pending = orders.filter(o => o.status === 'WAITING' || o.status === 'QUEUE').length;
    const inProd = orders.filter(o => o.status === 'PRINTING' || o.status === 'POST_PROCESS').length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;

    // Platform pie
    const platformCounts = new Map<string, number>();
    for (const o of orders) {
      const k = o.platformSource || 'MANUAL';
      platformCounts.set(k, (platformCounts.get(k) || 0) + 1);
    }
    const platformData = [...platformCounts.entries()].map(([k, v]) => ({
      name: PLATFORM_LABEL[k] || k, value: v, key: k,
    }));

    // Status pie
    const statusCounts = new Map<string, number>();
    for (const o of orders) {
      const k = o.status;
      statusCounts.set(k, (statusCounts.get(k) || 0) + 1);
    }
    const statusData = [...statusCounts.entries()].map(([k, v]) => ({
      name: STATUS_LABEL[k] || k, value: v, key: k,
    }));

    // Top items
    const itemRevenue = new Map<string, { qty: number; rev: number }>();
    for (const o of orders) {
      const k = o.itemName || 'Sem nome';
      const cur = itemRevenue.get(k) || { qty: 0, rev: 0 };
      cur.qty += o.quantity || 1;
      cur.rev += o.priceCharged || 0;
      itemRevenue.set(k, cur);
    }
    const topItems = [...itemRevenue.entries()]
      .sort((a, b) => b[1].rev - a[1].rev)
      .slice(0, 5);

    // Last 7 days revenue bars
    const days: { label: string; rev: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 3600 * 1000;
      const dayOrders = orders.filter(o => o.createdAt >= start && o.createdAt < end);
      days.push({
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        rev: dayOrders.reduce((s, o) => s + (o.priceCharged || 0), 0),
        count: dayOrders.length,
      });
    }

    return {
      total: orders.length,
      today: ordersToday.length,
      pending, inProd, delivered,
      revenueMonth, ticketMedio,
      ordersMonth: ordersMonth.length,
      platformData, statusData, topItems, days,
    };
  }, [orders]);

  const aiTip = useMemo(() => {
    const fire = (name: string, detail?: any) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {} };
    if (stats.total === 0) {
      return {
        title: 'Sem pedidos ainda — importe seu primeiro!',
        body: 'Conecte um canal de vendas ou cadastre um pedido manual para começar a ver previsões de receita, gargalos e tendências em tempo real.',
        savings: 'R$ 0',
        action: 'Conectar canal',
        onAction: () => fire('navigate-tab', 5),
      };
    }
    if (stats.pending > stats.inProd * 2 && stats.pending > 3) {
      return {
        title: 'Gargalo na entrada — fila de aguardando alta',
        body: `Você tem ${stats.pending} pedidos aguardando aceite contra apenas ${stats.inProd} em produção. Acelere o aceite para não perder prazo nem reputação nos marketplaces.`,
        savings: `${stats.pending} pedidos`,
        action: 'Ver fila',
        onAction: () => fire('navigate-tab', 1),
      };
    }
    return {
      title: 'Maximize o ticket médio do mês',
      body: `Ticket médio atual: ${fmtBRL(stats.ticketMedio)}. Empacotar itens em combos pode elevar essa média em 15–25% e aumentar margem por entrega.`,
      savings: `+ ${fmtBRL(stats.ticketMedio * 0.2 * stats.ordersMonth)}`,
      action: 'Sugerir combos',
      onAction: () => fire('navigate-tab', 9),
    };
  }, [stats]);

  const KPI_THEMES: Record<string, { bar: string; glow: string }> = {
    gold:    { bar: 'bg-[#D4A017]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.18),_transparent_70%)]' },
    lime:    { bar: 'bg-[#b7ff00]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(183,255,0,0.18),_transparent_70%)]' },
    blue:    { bar: 'bg-blue-500',    glow: 'bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_70%)]' },
    purple:  { bar: 'bg-purple-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.18),_transparent_70%)]' },
    emerald: { bar: 'bg-emerald-500', glow: 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_70%)]' },
    orange:  { bar: 'bg-orange-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),_transparent_70%)]' },
    white:   { bar: 'bg-white',       glow: 'bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.14),_transparent_70%)]' },
  };

  const Kpi = ({ icon: Icon, label, value, sub, tone = 'lime' }: any) => {
    const t = KPI_THEMES[tone] ?? KPI_THEMES.lime;
    return (
      <div className="group relative p-[1px] rounded-xl bg-white/10 transition-all duration-300 hover:scale-[1.03] hover:z-10">
        <div className={`absolute inset-0 rounded-xl ${t.glow} blur-xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />
        <div className="relative bg-white/[0.03] backdrop-blur-xl p-3 rounded-[11px] overflow-hidden h-full border border-white/10">
          <div className={`absolute top-0 left-0 w-[3px] h-full ${t.bar}`} />
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">{label}</span>
            <Icon className="h-3.5 w-3.5 text-white/70" />
          </div>
          <div className="text-lg font-bold text-white mt-1">{value}</div>
          {sub && <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">{sub}</div>}
        </div>
      </div>
    );
  };

  const PANEL_GLOWS = {
    gold: 'bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.12),_transparent_70%)]',
    lime: 'bg-[radial-gradient(circle_at_center,_rgba(183,255,0,0.12),_transparent_70%)]',
    emerald: 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12),_transparent_70%)]',
    neutral: 'bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_70%)]',
  } as const;

  const Panel: React.FC<{ tone?: keyof typeof PANEL_GLOWS; title: string; children: React.ReactNode }> = ({ tone = 'neutral', title, children }) => {
    const glow = PANEL_GLOWS[tone];
    return (
      <div className="group relative p-[1px] rounded-2xl bg-white/5 transition-all duration-500 hover:scale-[1.005]">
        <div className={`absolute -inset-4 rounded-2xl ${glow} blur-2xl pointer-events-none opacity-50 group-hover:opacity-90 transition-opacity duration-700`} />
        <div className="relative bg-white/[0.02] backdrop-blur-2xl rounded-[15px] p-4 border border-white/10 shadow-2xl">
          <h4 className="text-[10px] uppercase font-bold text-white/80 tracking-[0.2em] mb-3">{title}</h4>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 relative" id="pedidos-dashboard">
      <div className="pointer-events-none absolute -top-10 left-1/4 w-96 h-96 bg-[#D4A017]/[0.04] rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-40 right-1/4 w-[500px] h-[500px] bg-[#b7ff00]/[0.04] rounded-full blur-[150px]" />

      {/* AI Recommendation */}
      <div className="group relative p-[1px] rounded-2xl bg-gradient-to-br from-[#D4A017]/40 via-white/10 to-[#b7ff00]/30">
        <div className="absolute -inset-6 rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.14),_rgba(183,255,0,0.06)_40%,_transparent_70%)] blur-3xl opacity-70 pointer-events-none" />
        <div className="relative bg-[#0a0c0a]/80 backdrop-blur-2xl rounded-[15px] p-5 border border-white/10 flex items-start gap-5">
          <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#D4A017]/40 to-[#b7ff00]/30 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 flex items-center justify-center">
              <RobotMascot className="relative drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4A017]">Recomendação para hoje</span>
            </div>
            <h3 className="text-base lg:text-lg font-bold text-white tracking-tight mb-1">{aiTip.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">{aiTip.body}</p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 shrink-0 pl-4 border-l border-white/10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Oportunidade</span>
            <span className="text-xl font-extrabold text-[#b7ff00] tabular-nums">{aiTip.savings}</span>
            <button onClick={(aiTip as any).onAction} className="mt-1 px-3 py-1.5 bg-[#b7ff00] text-black text-[10px] font-extrabold uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(183,255,0,0.3)] flex items-center gap-1.5">
              {aiTip.action} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pb-2 border-b-2 border-white/10 relative">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-[#b7ff00]" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Dashboard — Pedidos</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('request-new-order'))}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#b7ff00]/30 bg-[#b7ff00]/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#b7ff00] transition hover:bg-[#b7ff00]/25 hover:border-[#b7ff00]/50"
            id="btn_cadastrar_pedido_dashboard"
          >
            <Plus className="h-3.5 w-3.5" />
            Cadastrar Pedido
          </button>
          <span className="text-[#b7ff00] text-[10px] font-bold uppercase flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#b7ff00] opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#b7ff00] shadow-[0_0_8px_#b7ff00]" />
          </span>
          Tempo real
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        <Kpi icon={ShoppingBag} label="Pedidos hoje" value={stats.today} sub={`${stats.total} no total`} tone="lime" />
        <Kpi icon={Clock} label="Aguardando" value={stats.pending} tone="white" />
        <Kpi icon={Hammer} label="Em produção" value={stats.inProd} tone="emerald" />
        <Kpi icon={CheckCircle} label="Entregues" value={stats.delivered} tone="purple" />
        <Kpi icon={Receipt} label="Faturamento mês" value={fmtBRL(stats.revenueMonth)} tone="gold" />
        <Kpi icon={TrendingUp} label="Ticket médio" value={fmtBRL(stats.ticketMedio)} tone="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        <Panel tone="lime" title="Receita — Últimos 7 dias">
          {stats.days.every(d => d.rev === 0) ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem receita ainda</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <BarChart data={stats.days}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    formatter={(v: any) => fmtBRL(Number(v))}
                    contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }}
                  />
                  <Bar dataKey="rev" fill="#b7ff00" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel tone="gold" title="Pedidos por Plataforma">
          {stats.platformData.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Aguardando pedidos</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <PieChart>
                  <Pie data={stats.platformData} dataKey="value" nameKey="name" outerRadius={60} label={{ fontSize: 10 }} isAnimationActive={false}>
                    {stats.platformData.map((d, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[d.key] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel tone="emerald" title="Distribuição por Status">
          {stats.statusData.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem status</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <PieChart>
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" outerRadius={60} label={{ fontSize: 10 }} isAnimationActive={false}>
                    {stats.statusData.map((d, i) => (
                      <Cell key={i} fill={STATUS_COLORS[d.key] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel tone="gold" title="Top Produtos (faturamento)">
        {stats.topItems.length === 0 ? (
          <div className="flex items-center justify-center h-24 border border-dashed border-white/10 rounded-xl bg-black/20">
            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem produtos vendidos</span>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {stats.topItems.map(([name, info], i) => (
              <li key={name} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-white/90 truncate flex items-center gap-2 min-w-0">
                  <span className="inline-flex w-5 h-5 items-center justify-center rounded-md bg-[#D4A017]/15 text-[#D4A017] font-bold text-[10px] border border-[#D4A017]/30 shrink-0">{i + 1}</span>
                  <Package className="w-3 h-3 text-white/40 shrink-0" />
                  <span className="truncate">{name}</span>
                  <span className="text-white/40 text-[10px] shrink-0">×{info.qty}</span>
                </span>
                <span className="text-[#b7ff00] font-mono font-bold tabular-nums">{fmtBRL(info.rev)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};