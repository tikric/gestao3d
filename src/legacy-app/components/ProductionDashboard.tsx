import React, { useMemo } from 'react';
import { RobotMascot } from './RobotMascot';
import type { PrintOrder, Printer } from '../types';
import {
  Hammer, Clock, Printer as PrinterIcon, CheckCircle, Receipt, Activity,
  Sparkles, ArrowRight, AlertTriangle,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

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
  printers: Printer[];
}

export const ProductionDashboard: React.FC<Props> = ({ orders, printers }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const active = orders.filter(o => o.status !== 'DELIVERED');
    const printing = orders.filter(o => o.status === 'PRINTING');
    const waiting = orders.filter(o => o.status === 'WAITING' || o.status === 'QUEUE');
    const finishing = orders.filter(o => o.status === 'POST_PROCESS' || o.status === 'READY');
    const deliveredToday = orders.filter(o => o.status === 'DELIVERED' && o.createdAt >= dayStart);
    const deliveredMonth = orders.filter(o => o.status === 'DELIVERED' && o.createdAt >= monthStart);

    const late = active.filter(o => o.deadline && Date.now() > o.deadline).length;

    const hoursMonth = deliveredMonth.reduce((s, o) => s + (o.printTimeHours || 0), 0);
    const gramsMonth = deliveredMonth.reduce((s, o) => s + (o.weightGrams || 0) * (o.quantity || 1), 0);
    const revenueMonth = deliveredMonth.reduce((s, o) => s + (o.priceCharged || 0), 0);

    const printersTotal = printers.length;
    const printersBusy = printers.filter(p => p.status === 'PRINTING').length;
    const printersMaint = printers.filter(p => p.status === 'MAINTENANCE').length;
    const utilization = printersTotal ? Math.round((printersBusy / printersTotal) * 100) : 0;

    // Status pie (only active queue)
    const statusCounts = new Map<string, number>();
    for (const o of active) {
      statusCounts.set(o.status, (statusCounts.get(o.status) || 0) + 1);
    }
    const statusData = [...statusCounts.entries()].map(([k, v]) => ({
      name: STATUS_LABEL[k] || k, value: v, key: k,
    }));

    // Throughput last 7 days (entregues por dia)
    const days: { label: string; entregues: number; horas: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 3600 * 1000;
      const dayOrders = orders.filter(o => o.status === 'DELIVERED' && o.createdAt >= start && o.createdAt < end);
      days.push({
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        entregues: dayOrders.length,
        horas: Math.round(dayOrders.reduce((s, o) => s + (o.printTimeHours || 0), 0)),
      });
    }

    // Carga por impressora
    const loadByPrinter = printers.map(p => ({
      name: p.name?.slice(0, 10) || `#${p.id}`,
      jobs: orders.filter(o => o.assignedPrinterId === p.id && (o.status === 'PRINTING' || o.status === 'QUEUE')).length,
    }));

    return {
      activeCount: active.length,
      printing: printing.length,
      waiting: waiting.length,
      finishing: finishing.length,
      deliveredToday: deliveredToday.length,
      deliveredMonth: deliveredMonth.length,
      late,
      hoursMonth,
      gramsMonth,
      revenueMonth,
      printersTotal, printersBusy, printersMaint, utilization,
      statusData, days, loadByPrinter,
    };
  }, [orders, printers]);

  const aiTip = useMemo(() => {
    const fire = (name: string, detail?: any) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {} };
    if (stats.activeCount === 0 && stats.printersTotal === 0) {
      return {
        title: 'Cadastre impressoras e pedidos para iniciar',
        body: 'Sem fila e sem impressoras a IA não consegue calcular ocupação, gargalo nem previsão de entrega. Comece adicionando ao menos 1 impressora e 1 pedido.',
        savings: '—',
        action: 'Cadastrar',
        onAction: () => fire('request-new-order'),
      };
    }
    if (stats.late > 0) {
      return {
        title: `${stats.late} pedido${stats.late > 1 ? 's' : ''} atrasado${stats.late > 1 ? 's' : ''} — priorize agora`,
        body: `Reorganize a fila para zerar atraso e proteger reputação no marketplace. Cada dia adicional reduz a chance de avaliação 5 estrelas.`,
        savings: `-${stats.late} atraso${stats.late > 1 ? 's' : ''}`,
        action: 'Ver atrasados',
        onAction: () => fire('navigate-tab', 1),
      };
    }
    if (stats.utilization < 50 && stats.waiting > 0) {
      return {
        title: 'Capacidade ociosa com fila acumulando',
        body: `Utilização das impressoras está em ${stats.utilization}% e ${stats.waiting} pedidos aguardam. Aceite a fila para liberar produção e antecipar receita.`,
        savings: `+${stats.waiting} jobs`,
        action: 'Liberar fila',
        onAction: () => fire('navigate-tab', 1),
      };
    }
    return {
      title: 'Fluxo saudável — mantenha o ritmo',
      body: `Utilização em ${stats.utilization}%, ${stats.printing} jobs ativos e ${stats.deliveredToday} entregue${stats.deliveredToday === 1 ? '' : 's'} hoje. Avalie escalonar uma impressora extra se a fila crescer.`,
      savings: `${stats.utilization}% uso`,
      action: 'Ver impressoras',
      onAction: () => fire('navigate-tab', 16),
    };
  }, [stats]);

  const KPI_THEMES: Record<string, { bar: string; glow: string }> = {
    gold:    { bar: 'bg-[#D4A017]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.18),_transparent_70%)]' },
    lime:    { bar: 'bg-[#b7ff00]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(183,255,0,0.18),_transparent_70%)]' },
    blue:    { bar: 'bg-blue-500',    glow: 'bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_70%)]' },
    purple:  { bar: 'bg-purple-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.18),_transparent_70%)]' },
    emerald: { bar: 'bg-emerald-500', glow: 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_70%)]' },
    orange:  { bar: 'bg-orange-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),_transparent_70%)]' },
    red:     { bar: 'bg-red-500',     glow: 'bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.18),_transparent_70%)]' },
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
    blue: 'bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.12),_transparent_70%)]',
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
    <div className="space-y-5 relative" id="production-dashboard">
      <div className="pointer-events-none absolute -top-10 left-1/4 w-96 h-96 bg-emerald-500/[0.04] rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-40 right-1/4 w-[500px] h-[500px] bg-[#b7ff00]/[0.04] rounded-full blur-[150px]" />

      {/* AI Recommendation */}
      <div className="group relative p-[1px] rounded-2xl bg-gradient-to-br from-emerald-500/40 via-white/10 to-[#b7ff00]/30">
        <div className="absolute -inset-6 rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.14),_rgba(183,255,0,0.06)_40%,_transparent_70%)] blur-3xl opacity-70 pointer-events-none" />
        <div className="relative bg-[#0a0c0a]/80 backdrop-blur-2xl rounded-[15px] p-5 border border-white/10 flex items-start gap-5">
          <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-emerald-500/40 to-[#b7ff00]/30 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 flex items-center justify-center">
              <RobotMascot className="relative drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">Recomendação para hoje</span>
            </div>
            <h3 className="text-base lg:text-lg font-bold text-white tracking-tight mb-1">{aiTip.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">{aiTip.body}</p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 shrink-0 pl-4 border-l border-white/10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Sinal</span>
            <span className="text-xl font-extrabold text-[#b7ff00] tabular-nums">{aiTip.savings}</span>
            <button onClick={(aiTip as any).onAction} className="mt-1 px-3 py-1.5 bg-[#b7ff00] text-black text-[10px] font-extrabold uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(183,255,0,0.3)] flex items-center gap-1.5">
              {aiTip.action} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pb-2 border-b-2 border-white/10 relative">
        <div className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Dashboard — Produção</h3>
        </div>
        <span className="text-emerald-400 text-[10px] font-bold uppercase flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          </span>
          {stats.printersBusy}/{stats.printersTotal} ativas
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        <Kpi icon={Activity} label="Imprimindo agora" value={stats.printing} sub={`${stats.activeCount} ativos`} tone="emerald" />
        <Kpi icon={Clock} label="Aguardando" value={stats.waiting} tone="white" />
        <Kpi icon={CheckCircle} label="Entregues hoje" value={stats.deliveredToday} sub={`${stats.deliveredMonth} no mês`} tone="lime" />
        <Kpi icon={PrinterIcon} label="Utilização" value={`${stats.utilization}%`} sub={stats.printersMaint > 0 ? `${stats.printersMaint} em manut.` : `${stats.printersTotal} máquinas`} tone="blue" />
        <Kpi icon={AlertTriangle} label="Atrasados" value={stats.late} tone={stats.late > 0 ? 'red' : 'purple'} />
        <Kpi icon={Receipt} label="Faturado (mês)" value={fmtBRL(stats.revenueMonth)} sub={`${Math.round(stats.gramsMonth)}g · ${Math.round(stats.hoursMonth)}h`} tone="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        <Panel tone="emerald" title="Entregas — Últimos 7 dias">
          {stats.days.every(d => d.entregues === 0) ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem entregas ainda</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <BarChart data={stats.days}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Bar dataKey="entregues" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel tone="lime" title="Fila por Status">
          {stats.statusData.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Fila vazia</span>
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

        <Panel tone="blue" title="Carga por Impressora">
          {stats.loadByPrinter.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem impressoras</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <BarChart data={stats.loadByPrinter} layout="vertical">
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Bar dataKey="jobs" fill="#3B82F6" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};