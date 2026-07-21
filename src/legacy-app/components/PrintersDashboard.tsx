import React, { useMemo } from 'react';
import { RobotMascot } from './RobotMascot';
import type { PrintOrder, Printer } from '../types';
import {
  Printer as PrinterIcon, Activity, Wrench, Wifi, Thermometer, Gauge,
  Sparkles, ArrowRight, AlertTriangle,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

interface Props {
  orders: PrintOrder[];
  printers: Printer[];
}

const STATUS_COLORS: Record<string, string> = {
  PRINTING: '#10B981',
  IDLE: '#94A3B8',
  MAINTENANCE: '#F59E0B',
};

const STATUS_LABEL: Record<string, string> = {
  PRINTING: 'Imprimindo',
  IDLE: 'Ociosa',
  MAINTENANCE: 'Manutenção',
};

const WEEK_MS = 7 * 24 * 3600 * 1000;
const MONTH_MS = 30 * 24 * 3600 * 1000;

export const PrintersDashboard: React.FC<Props> = ({ orders, printers }) => {
  const stats = useMemo(() => {
    const total = printers.length;
    const printing = printers.filter(p => p.status === 'PRINTING').length;
    const idle = printers.filter(p => p.status === 'IDLE').length;
    const maint = printers.filter(p => p.status === 'MAINTENANCE').length;
    const online = printers.filter(p => p.isOnline).length;
    const utilization = total ? Math.round((printing / total) * 100) : 0;

    const avgProgress = (() => {
      const arr = printers.filter(p => p.status === 'PRINTING').map(p => p.printProgress || 0);
      if (!arr.length) return 0;
      return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    })();

    const avgNozzle = (() => {
      const arr = printers.filter(p => p.status === 'PRINTING' && (p.nozzleTemp || 0) > 0).map(p => p.nozzleTemp || 0);
      if (!arr.length) return 0;
      return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    })();

    const now = Date.now();
    const maintDue = printers.filter(p => {
      const w = p.lastWeeklyMaintenance ? now - p.lastWeeklyMaintenance : Infinity;
      const m = p.lastMonthlyMaintenance ? now - p.lastMonthlyMaintenance : Infinity;
      return w >= WEEK_MS || m >= MONTH_MS;
    }).length;

    const statusData = [
      { key: 'PRINTING', name: STATUS_LABEL.PRINTING, value: printing },
      { key: 'IDLE', name: STATUS_LABEL.IDLE, value: idle },
      { key: 'MAINTENANCE', name: STATUS_LABEL.MAINTENANCE, value: maint },
    ].filter(d => d.value > 0);

    // Throughput por impressora (entregues no mês)
    const monthStart = now - MONTH_MS;
    const throughput = printers.map(p => {
      const delivered = orders.filter(o => o.assignedPrinterId === p.id && o.status === 'DELIVERED' && o.createdAt >= monthStart);
      const hours = delivered.reduce((s, o) => s + (o.printTimeHours || 0), 0);
      return {
        id: p.id,
        name: (p.name || `#${p.id}`).slice(0, 12),
        jobs: delivered.length,
        horas: Math.round(hours),
      };
    });

    // Top impressora (por jobs entregues)
    const top = [...throughput].sort((a, b) => b.jobs - a.jobs)[0];

    // Carga atual (ativos + fila)
    const loadByPrinter = printers.map(p => ({
      name: (p.name || `#${p.id}`).slice(0, 12),
      ativos: orders.filter(o => o.assignedPrinterId === p.id && o.status === 'PRINTING').length,
      fila: orders.filter(o => o.assignedPrinterId === p.id && (o.status === 'WAITING' || o.status === 'QUEUE')).length,
    }));

    return {
      total, printing, idle, maint, online, utilization,
      avgProgress, avgNozzle, maintDue,
      statusData, throughput, top, loadByPrinter,
    };
  }, [orders, printers]);

  const aiTip = useMemo(() => {
    const fire = (name: string, detail?: any) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {} };
    const goPrinters = () => fire('navigate-tab', 16);
    if (stats.total === 0) {
      return {
        title: 'Cadastre suas impressoras para começar',
        body: 'Sem impressoras cadastradas a IA não consegue calcular ocupação, manutenção nem throughput. Adicione ao menos 1 impressora.',
        savings: '—',
        action: 'Cadastrar',
        onAction: goPrinters,
      };
    }
    if (stats.maintDue > 0) {
      return {
        title: `${stats.maintDue} impressora${stats.maintDue > 1 ? 's' : ''} com manutenção em atraso`,
        body: 'Manutenção preventiva atrasada aumenta a chance de falhas e refugos. Pause a impressão e revise correia, bico e firmware.',
        savings: `-${stats.maintDue} risco${stats.maintDue > 1 ? 's' : ''}`,
        action: 'Ver manutenção',
        onAction: goPrinters,
      };
    }
    if (stats.utilization >= 80) {
      return {
        title: 'Frota próxima do limite — avalie expandir',
        body: `Utilização em ${stats.utilization}% com ${stats.printing}/${stats.total} máquinas ativas. Uma impressora adicional reduz fila e protege prazos.`,
        savings: `${stats.utilization}% uso`,
        action: 'Planejar +1',
        onAction: goPrinters,
      };
    }
    if (stats.utilization < 30 && stats.total > 1) {
      return {
        title: 'Capacidade ociosa significativa',
        body: `Apenas ${stats.utilization}% da frota está ativa. Aproveite para consolidar pedidos, rodar pré-produção de estoque ou agendar manutenção.`,
        savings: `${stats.idle} ociosas`,
        action: 'Otimizar',
        onAction: goPrinters,
      };
    }
    return {
      title: 'Frota operando com saúde',
      body: `Utilização em ${stats.utilization}%, ${stats.online}/${stats.total} online, progresso médio dos jobs ativos em ${stats.avgProgress}%.`,
      savings: `${stats.utilization}% uso`,
      action: 'Ver detalhes',
      onAction: goPrinters,
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
    amber:   { bar: 'bg-amber-500',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.18),_transparent_70%)]' },
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
    amber: 'bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.12),_transparent_70%)]',
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
    <div className="space-y-5 relative" id="printers-dashboard">
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
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">Saúde da frota</span>
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
          <PrinterIcon className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Dashboard — Impressoras</h3>
        </div>
        <span className="text-emerald-400 text-[10px] font-bold uppercase flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          </span>
          {stats.online}/{stats.total} online
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        <Kpi icon={Activity} label="Imprimindo" value={stats.printing} sub={`${stats.total} máquinas`} tone="emerald" />
        <Kpi icon={PrinterIcon} label="Ociosas" value={stats.idle} tone="white" />
        <Kpi icon={Wrench} label="Manutenção a fazer" value={stats.maintDue} sub={stats.maintDue === 0 ? 'tudo em dia' : `${stats.maintDue} pendente${stats.maintDue > 1 ? 's' : ''}`} tone={stats.maintDue === 0 ? 'emerald' : 'red'} />
        <Kpi icon={Gauge} label="Utilização" value={`${stats.utilization}%`} tone="lime" />
        <Kpi icon={Wifi} label="Online" value={`${stats.online}/${stats.total}`} tone="blue" />
        <Kpi icon={Thermometer} label="Progresso médio" value={`${stats.avgProgress}%`} sub={stats.avgNozzle ? `bico ${stats.avgNozzle}°C` : 'sem leituras'} tone="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        <Panel tone="emerald" title="Distribuição da frota">
          {stats.statusData.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem impressoras</span>
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

        <Panel tone="blue" title="Carga atual por impressora">
          {stats.loadByPrinter.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem dados</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <BarChart data={stats.loadByPrinter} layout="vertical" stackOffset="sign">
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="ativos" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="fila" stackId="a" fill="#3B82F6" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel tone="lime" title="Throughput — Últimos 30 dias">
          {stats.throughput.every(t => t.jobs === 0) ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem entregas no período</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <BarChart data={stats.throughput}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Bar dataKey="jobs" fill="#b7ff00" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {stats.top && stats.top.jobs > 0 && (
            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-400 border-t border-white/5 pt-2">
              <span>Top máquina</span>
              <span className="text-[#b7ff00] font-bold">{stats.top.name} · {stats.top.jobs} jobs · {stats.top.horas}h</span>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};