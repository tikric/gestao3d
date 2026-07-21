import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { RobotMascot } from './RobotMascot';

export type KpiTone = 'gold' | 'lime' | 'blue' | 'purple' | 'emerald' | 'orange' | 'fuchsia' | 'cyan';

const KPI_THEMES: Record<KpiTone, { bar: string; glow: string }> = {
  gold:    { bar: 'bg-[#D4A017]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.18),_transparent_70%)]' },
  lime:    { bar: 'bg-[#b7ff00]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(183,255,0,0.18),_transparent_70%)]' },
  blue:    { bar: 'bg-blue-500',    glow: 'bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_70%)]' },
  purple:  { bar: 'bg-purple-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.18),_transparent_70%)]' },
  emerald: { bar: 'bg-emerald-500', glow: 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_70%)]' },
  orange:  { bar: 'bg-orange-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),_transparent_70%)]' },
  fuchsia: { bar: 'bg-fuchsia-500', glow: 'bg-[radial-gradient(circle_at_center,_rgba(232,121,249,0.18),_transparent_70%)]' },
  cyan:    { bar: 'bg-cyan-400',    glow: 'bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.18),_transparent_70%)]' },
};

export const Kpi: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: KpiTone;
}> = ({ icon: Icon, label, value, sub, tone = 'lime' }) => {
  const t = KPI_THEMES[tone];
  return (
    <div className="group relative p-[1px] rounded-xl bg-white/10 transition-all duration-300 hover:scale-[1.03] hover:z-10 h-full flex">
      <div className={`absolute inset-0 rounded-xl ${t.glow} blur-xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className="relative bg-white/[0.03] backdrop-blur-xl p-3 rounded-[11px] overflow-hidden h-full w-full border border-white/10 grid grid-rows-[auto_1fr_auto] gap-1">
        <div className={`absolute top-0 left-0 w-[3px] h-full ${t.bar}`} />
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">{label}</span>
          <Icon className="h-3.5 w-3.5 text-white/70" />
        </div>
        <div className="text-lg font-bold text-white truncate leading-none flex items-end h-7">{value}</div>
        <div className="text-[9px] text-zinc-500 uppercase tracking-wider leading-none h-3">{sub || '\u00A0'}</div>
      </div>
    </div>
  );
};

export const AiRecommendation: React.FC<{
  title: string;
  body: string;
  savings?: string;
  action?: string;
  onAction?: () => void;
}> = ({ title, body, savings = 'R$ 0', action, onAction }) => (
  <div className="group relative p-[1px] rounded-2xl bg-gradient-to-br from-[#D4A017]/40 via-white/10 to-[#b7ff00]/30">
    <div className="absolute -inset-6 rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.14),_rgba(183,255,0,0.06)_40%,_transparent_70%)] blur-3xl opacity-70 pointer-events-none" />
    <div className="relative bg-[#0a0c0a]/80 backdrop-blur-2xl rounded-[15px] p-5 border border-white/10 flex items-start gap-5">
      <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#D4A017]/25 to-[#b7ff00]/15 blur-xl animate-pulse" />
        <RobotMascot className="relative drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4A017]">Recomendação para hoje</span>
        </div>
        <h3 className="text-base lg:text-lg font-bold text-white tracking-tight mb-1">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">{body}</p>
      </div>
      {action && (
        <div className="hidden md:flex flex-col items-end gap-2 shrink-0 pl-4 border-l border-white/10">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Economia estimada</span>
          <span className="text-xl font-extrabold text-[#b7ff00] tabular-nums">{savings}</span>
          <button onClick={onAction} className="mt-1 px-3 py-1.5 bg-[#b7ff00] text-black text-[10px] font-extrabold uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(183,255,0,0.3)] flex items-center gap-1.5">
            {action} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  </div>
);

export const SectionTitle: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; status?: string }> = ({ icon: Icon, title, status = 'Operacional' }) => (
  <div className="flex items-center justify-between pb-2 border-b-2 border-white/10 relative">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#b7ff00]" />
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">{title}</h3>
    </div>
    <span className="text-[#b7ff00] text-[10px] font-bold uppercase flex items-center gap-2">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#b7ff00] opacity-60 animate-ping" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#b7ff00] shadow-[0_0_8px_#b7ff00]" />
      </span>
      {status}
    </span>
  </div>
);