import React, { useMemo } from 'react';
import { RobotMascot } from './RobotMascot';
import type { PrintOrder } from '../types';
import {
  Receipt, DollarSign, ShoppingBag, TrendingUp, Users, Clock,
  Sparkles, ArrowRight, Package, CreditCard, Download,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

const PLATFORM_LABEL: Record<string, string> = {
  MANUAL: 'Balcão', SHOPEE: 'Shopee', MERCADO_LIVRE: 'Mercado Livre',
  NUVEMSHOP: 'Nuvemshop', AMAZON: 'Amazon', TIKTOK_SHOP: 'TikTok Shop',
};
const PLATFORM_COLORS: Record<string, string> = {
  MANUAL: '#94A3B8', SHOPEE: '#EE4D2D', MERCADO_LIVRE: '#FFE600',
  NUVEMSHOP: '#00ADF0', AMAZON: '#FF9900', TIKTOK_SHOP: '#FE2C55',
};
const METHOD_COLORS: Record<string, string> = {
  'DINHEIRO': '#facc15', 'CARTÃO': '#3b82f6', 'CONSIGNADO': '#a78bfa', 'OUTROS': '#94A3B8',
};

interface Props { orders: PrintOrder[]; }

export const HistoricoDashboard: React.FC<Props> = ({ orders }) => {
  const stats = useMemo(() => {
    const sold = orders.filter(o => o.status === 'DELIVERED');
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const today = sold.filter(o => (o.deadline || o.createdAt) >= dayStart);
    const monthSold = sold.filter(o => (o.deadline || o.createdAt) >= monthStart);

    const totalRev = sold.reduce((s, o) => s + (o.priceCharged || 0), 0);
    const revMonth = monthSold.reduce((s, o) => s + (o.priceCharged || 0), 0);
    const revToday = today.reduce((s, o) => s + (o.priceCharged || 0), 0);
    const items = sold.reduce((s, o) => s + (o.quantity || 1), 0);
    const ticket = sold.length ? totalRev / sold.length : 0;
    const pending = sold.filter(o => (o.paymentStatus || 'PENDENTE') === 'PENDENTE').length;
    const pendingValue = sold.filter(o => (o.paymentStatus || 'PENDENTE') === 'PENDENTE')
      .reduce((s, o) => s + (o.priceCharged || 0), 0);
    const uniqueClients = new Set(sold.map(o => o.clientName)).size;

    const platform = new Map<string, { count: number; rev: number }>();
    for (const o of sold) {
      const k = o.platformSource || 'MANUAL';
      const cur = platform.get(k) || { count: 0, rev: 0 };
      cur.count += 1; cur.rev += o.priceCharged || 0;
      platform.set(k, cur);
    }
    const platformData = [...platform.entries()].map(([k, v]) => ({ name: PLATFORM_LABEL[k] || k, value: v.rev, key: k }));

    const method = new Map<string, number>();
    for (const o of sold) {
      const k = o.paymentMethod || 'DINHEIRO';
      method.set(k, (method.get(k) || 0) + (o.priceCharged || 0));
    }
    const methodData = [...method.entries()].map(([k, v]) => ({ name: k, value: v, key: k }));

    const itemRev = new Map<string, { qty: number; rev: number }>();
    for (const o of sold) {
      const k = o.itemName || 'Sem nome';
      const cur = itemRev.get(k) || { qty: 0, rev: 0 };
      cur.qty += o.quantity || 1; cur.rev += o.priceCharged || 0;
      itemRev.set(k, cur);
    }
    const topItems = [...itemRev.entries()].sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);

    const days: { label: string; rev: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = d.getTime(); const end = start + 86400000;
      const dayOrders = sold.filter(o => {
        const t = o.deadline || o.createdAt;
        return t >= start && t < end;
      });
      days.push({
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        rev: dayOrders.reduce((s, o) => s + (o.priceCharged || 0), 0),
        count: dayOrders.length,
      });
    }

    return {
      total: sold.length, today: today.length, items, ticket,
      totalRev, revMonth, revToday, pending, pendingValue, uniqueClients,
      platformData, methodData, topItems, days, monthCount: monthSold.length,
    };
  }, [orders]);

  const aiTip = useMemo(() => {
    const fire = (name: string, detail?: any) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {} };
    if (stats.total === 0) {
      return {
        title: 'Histórico vazio — marque pedidos como entregues',
        body: 'Conforme os pedidos forem entregues, este painel vai mostrar receita, ticket médio, canais mais rentáveis e produtos campeões.',
        savings: 'R$ 0', action: 'Ir para Produção',
        onAction: () => fire('navigate-tab', 1),
      };
    }
    if (stats.pending > 0) {
      return {
        title: `${stats.pending} venda(s) entregue(s) sem pagamento confirmado`,
        body: `Você tem ${fmtBRL(stats.pendingValue)} em recebíveis pendentes. Cobre os clientes consignados ou reconcilie pagamentos para destravar o caixa.`,
        savings: fmtBRL(stats.pendingValue), action: 'Conciliar',
        onAction: () => fire('navigate-tab', 6),
      };
    }
    return {
      title: 'Histórico saudável — foque em recompra',
      body: `Ticket médio em ${fmtBRL(stats.ticket)} com ${stats.uniqueClients} clientes únicos. Uma campanha de recompra com cupom pode trazer 20–30% deles de volta no mês.`,
      savings: `+ ${fmtBRL(stats.ticket * Math.round(stats.uniqueClients * 0.25))}`,
      action: 'Criar campanha',
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
    amber:   { bar: 'bg-amber-400',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.18),_transparent_70%)]' },
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
          <div className="text-lg font-bold text-white mt-1 tabular-nums">{value}</div>
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

  const Panel: React.FC<{ tone?: keyof typeof PANEL_GLOWS; title: string; children: React.ReactNode }> = ({ tone = 'neutral', title, children }) => (
    <div className="group relative p-[1px] rounded-2xl bg-white/5 transition-all duration-500 hover:scale-[1.005]">
      <div className={`absolute -inset-4 rounded-2xl ${PANEL_GLOWS[tone]} blur-2xl pointer-events-none opacity-50 group-hover:opacity-90 transition-opacity duration-700`} />
      <div className="relative bg-white/[0.02] backdrop-blur-2xl rounded-[15px] p-4 border border-white/10 shadow-2xl">
        <h4 className="text-[10px] uppercase font-bold text-white/80 tracking-[0.2em] mb-3">{title}</h4>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 relative" id="historico-dashboard">
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
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4A017]">Insight do histórico</span>
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
          <Receipt className="h-4 w-4 text-[#D4A017]" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Dashboard — Histórico de Vendas</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('export-sales-report'))}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#b7ff00] to-[#7eff5a] text-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition hover:shadow-[0_0_24px_-4px_rgba(183,255,0,0.55)]"
            id="btn_export_sales_dashboard"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar Relatório
          </button>
          <span className="text-[#b7ff00] text-[10px] font-bold uppercase flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#b7ff00] opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#b7ff00] shadow-[0_0_8px_#b7ff00]" />
          </span>
          Atualizado
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        <Kpi icon={DollarSign} label="Faturamento total" value={fmtBRL(stats.totalRev)} sub={`${stats.total} vendas`} tone="gold" />
        <Kpi icon={TrendingUp} label="Faturamento mês" value={fmtBRL(stats.revMonth)} sub={`${stats.monthCount} no mês`} tone="lime" />
        <Kpi icon={ShoppingBag} label="Vendidos hoje" value={stats.today} sub={fmtBRL(stats.revToday)} tone="emerald" />
        <Kpi icon={Receipt} label="Ticket médio" value={fmtBRL(stats.ticket)} tone="blue" />
        <Kpi icon={Users} label="Clientes únicos" value={stats.uniqueClients} tone="purple" />
        <Kpi icon={Clock} label="A receber" value={stats.pending} sub={fmtBRL(stats.pendingValue)} tone={stats.pending > 0 ? 'amber' : 'orange'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        <Panel tone="lime" title="Receita — Últimos 30 dias">
          {stats.days.every(d => d.rev === 0) ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem receita ainda</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 200, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <BarChart data={stats.days}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip formatter={(v: any) => fmtBRL(Number(v))}
                    contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Bar dataKey="rev" fill="#b7ff00" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel tone="gold" title="Receita por Canal">
          {stats.platformData.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem dados</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 200, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <PieChart>
                  <Pie data={stats.platformData} dataKey="value" nameKey="name" outerRadius={65} label={{ fontSize: 10 }} isAnimationActive={false}>
                    {stats.platformData.map((d, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[d.key] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtBRL(Number(v))}
                    contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel tone="emerald" title="Receita por Meio de Pagamento">
          {stats.methodData.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem dados</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 200, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <PieChart>
                  <Pie data={stats.methodData} dataKey="value" nameKey="name" outerRadius={65} label={{ fontSize: 10 }} isAnimationActive={false}>
                    {stats.methodData.map((d, i) => (
                      <Cell key={i} fill={METHOD_COLORS[d.key] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtBRL(Number(v))}
                    contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel tone="gold" title="Top Produtos Vendidos (faturamento)">
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
