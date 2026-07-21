import React, { useMemo } from 'react';
import type { Client, PrintOrder } from '../../types';
import { Users, UserCheck, Boxes, Receipt, TrendingUp, ShoppingCart, Sparkles, ArrowRight } from 'lucide-react';
import { RobotMascot } from '../RobotMascot';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

const SOURCE_LABEL: Record<string, string> = {
  PROSPECCAO: 'Prospecção',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  VISITANDO: 'Visitando',
  INDICACAO: 'Indicação',
  OUTROS: 'Outros',
};

const SOURCE_COLORS = ['#b7ff00', '#E1306C', '#1877F2', '#F59E0B', '#22D3EE', '#94A3B8'];
const DEAL_COLORS = ['#b7ff00', '#F59E0B'];

function mapOrderStatus(o: PrintOrder): { label: string; cls: string } {
  const now = Date.now();
  if (o.status === 'DELIVERED') return { label: 'Entregue', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  if (o.deadline && o.deadline < now) return { label: 'Atrasado', cls: 'bg-red-500/15 text-red-300 border-red-500/30' };
  if (o.status === 'PRINTING' || o.status === 'POST_PROCESS' || o.status === 'READY')
    return { label: 'Produzindo', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
  return { label: 'Aguardando', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
}

interface Props {
  clients: Client[];
  orders: PrintOrder[];
}

export const ClientsDashboard: React.FC<Props> = ({ clients, orders }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const ordersThisMonth = orders.filter(o => o.createdAt >= monthStart);
    const revenueMonth = ordersThisMonth.reduce((s, o) => s + (o.priceCharged || 0), 0);
    const ticketMedio = ordersThisMonth.length ? revenueMonth / ordersThisMonth.length : 0;

    // Active clients: had an order in the last 60 days
    const cutoff = Date.now() - 60 * 24 * 3600 * 1000;
    const activeClientIds = new Set(
      orders.filter(o => o.createdAt >= cutoff && o.clientId != null).map(o => o.clientId as number)
    );

    const stockValueTotal = clients.reduce((s, c) => {
      const explicit = Number(c.stockValue) || 0;
      return s + explicit;
    }, 0);

    // Top clients by revenue (all-time)
    const revenueByClient = new Map<string, number>();
    for (const o of orders) {
      const key = o.clientName || 'Sem nome';
      revenueByClient.set(key, (revenueByClient.get(key) || 0) + (o.priceCharged || 0));
    }
    const topClients = [...revenueByClient.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Source pie
    const sourceCounts = new Map<string, number>();
    for (const c of clients) {
      const k = c.source || 'OUTROS';
      sourceCounts.set(k, (sourceCounts.get(k) || 0) + 1);
    }
    const sourceData = [...sourceCounts.entries()].map(([k, v]) => ({
      name: SOURCE_LABEL[k] || k, value: v,
    }));

    // Deal pie
    const consignados = clients.filter(c => c.dealType === 'CONSIGNADO').length;
    const compraram = clients.filter(c => (c.dealType ?? 'COMPROU') === 'COMPROU').length;
    const dealData = [
      { name: 'Compraram', value: compraram },
      { name: 'Consignados', value: consignados },
    ].filter(d => d.value > 0);

    const recentOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

    return {
      total: clients.length,
      active: activeClientIds.size,
      stockValueTotal,
      ordersMonth: ordersThisMonth.length,
      revenueMonth,
      ticketMedio,
      topClients,
      sourceData,
      dealData,
      recentOrders,
    };
  }, [clients, orders]);

  // Generate AI insight based on real data
  const aiTip = useMemo(() => {
    if (clients.length === 0) {
      return {
        title: 'Comece cadastrando seu primeiro cliente',
        body: 'Sem base cadastrada a IA não consegue prever recorrência. Importe ou cadastre ao menos 5 clientes para destravar previsões de LTV.',
        savings: 'R$ 0',
        action: 'Cadastrar cliente',
      };
    }
    if (stats.active < Math.max(1, Math.round(stats.total * 0.3))) {
      return {
        title: 'Reative clientes adormecidos',
        body: `Apenas ${stats.active} de ${stats.total} clientes compraram nos últimos 60 dias. Uma campanha de reativação pode trazer ${Math.round((stats.total - stats.active) * 0.15)} pedidos extras este mês.`,
        savings: `+ ${fmtBRL((stats.total - stats.active) * 0.15 * (stats.ticketMedio || 80))}`,
        action: 'Disparar campanha',
      };
    }
    return {
      title: 'Foque nos seus top 5 clientes',
      body: `Seus melhores compradores representam a maior parcela do faturamento. Ofereça consignado ou benefício recorrente para travar ticket médio acima de ${fmtBRL((stats.ticketMedio || 0) * 1.2)}.`,
      savings: `+ ${fmtBRL((stats.ticketMedio || 0) * 5)}`,
      action: 'Ver top clientes',
    };
  }, [clients.length, stats]);

  const KPI_THEMES: Record<string, { bar: string; glow: string }> = {
    gold:    { bar: 'bg-[#D4A017]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.18),_transparent_70%)]' },
    lime:    { bar: 'bg-[#b7ff00]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(183,255,0,0.18),_transparent_70%)]' },
    blue:    { bar: 'bg-blue-500',    glow: 'bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_70%)]' },
    purple:  { bar: 'bg-purple-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.18),_transparent_70%)]' },
    emerald: { bar: 'bg-emerald-500', glow: 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_70%)]' },
    orange:  { bar: 'bg-orange-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),_transparent_70%)]' },
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
    neutral: 'bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_70%)]',
  } as const;
  const Panel: React.FC<{ tone?: 'gold' | 'lime' | 'neutral'; title: string; children: React.ReactNode }> = ({ tone = 'neutral', title, children }) => {
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
    <div className="space-y-5 relative" id="clients-dashboard">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-10 left-1/4 w-96 h-96 bg-[#D4A017]/[0.04] rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-40 right-1/4 w-[500px] h-[500px] bg-[#b7ff00]/[0.04] rounded-full blur-[150px]" />

      {/* AI Recommendation Card */}
      <div className="group relative p-[1px] rounded-2xl bg-gradient-to-br from-[#D4A017]/40 via-white/10 to-[#b7ff00]/30">
        <div className="absolute -inset-6 rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.14),_rgba(183,255,0,0.06)_40%,_transparent_70%)] blur-3xl opacity-70 pointer-events-none" />
        <div className="relative bg-[#0a0c0a]/80 backdrop-blur-2xl rounded-[15px] p-5 border border-white/10 flex items-start gap-5">
          {/* Robot avatar */}
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
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Economia estimada</span>
            <span className="text-xl font-extrabold text-[#b7ff00] tabular-nums">{aiTip.savings}</span>
            <button className="mt-1 px-3 py-1.5 bg-[#b7ff00] text-black text-[10px] font-extrabold uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(183,255,0,0.3)] flex items-center gap-1.5">
              {aiTip.action} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Section title */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-white/10 relative">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#b7ff00]" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Dashboard — Clientes</h3>
        </div>
        <span className="text-[#b7ff00] text-[10px] font-bold uppercase flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#b7ff00] opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#b7ff00] shadow-[0_0_8px_#b7ff00]" />
          </span>
          Operacional
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        <Kpi icon={Users} label="Cadastrados" value={stats.total} tone="gold" />
        <Kpi icon={UserCheck} label="Ativos (60d)" value={stats.active} tone="lime" />
        <Kpi icon={Boxes} label="Valor em Estoque" value={fmtBRL(stats.stockValueTotal)} sub="nos clientes" tone="blue" />
        <Kpi icon={ShoppingCart} label="Pedidos / mês" value={stats.ordersMonth} tone="purple" />
        <Kpi icon={Receipt} label="Faturamento mês" value={fmtBRL(stats.revenueMonth)} tone="emerald" />
        <Kpi icon={TrendingUp} label="Ticket Médio" value={fmtBRL(stats.ticketMedio)} tone="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        {/* Top Clients */}
        <Panel tone="gold" title="Top Clientes (valor total)">
          {stats.topClients.length === 0 ? (
            <div className="flex items-center justify-center h-40 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem pedidos registrados</span>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {stats.topClients.map(([name, val], i) => (
                <li key={name} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-white/90 truncate flex items-center gap-2">
                    <span className="inline-flex w-5 h-5 items-center justify-center rounded-md bg-[#D4A017]/15 text-[#D4A017] font-bold text-[10px] border border-[#D4A017]/30">{i + 1}</span>
                    {name}
                  </span>
                  <span className="text-[#b7ff00] font-mono font-bold">{fmtBRL(val)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Source Pie */}
        <Panel tone="lime" title="Origem do Cliente">
          {stats.sourceData.length === 0 ? (
            <div className="flex items-center justify-center h-40 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Aguardando métricas</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <PieChart>
                  <Pie data={stats.sourceData} dataKey="value" nameKey="name" outerRadius={60} label={{ fontSize: 10 }} isAnimationActive={false}>
                    {stats.sourceData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Deal Type Pie */}
        <Panel title="Consignado vs Compra">
          {stats.dealData.length === 0 ? (
            <div className="flex items-center justify-center h-40 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Dados insuficientes</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <PieChart>
                  <Pie data={stats.dealData} dataKey="value" nameKey="name" outerRadius={60} label={{ fontSize: 10 }} isAnimationActive={false}>
                    {stats.dealData.map((_, i) => (
                      <Cell key={i} fill={DEAL_COLORS[i % DEAL_COLORS.length]} />
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
    </div>
  );
};