import React, { useMemo } from 'react';
import { RobotMascot } from './RobotMascot';
import type { CatalogItem } from '../types';
import { BookOpen, Package, DollarSign, Boxes, TrendingUp, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

interface Props { catalogItems: CatalogItem[]; }

export const CatalogoDashboard: React.FC<Props> = ({ catalogItems }) => {
  const stats = useMemo(() => {
    const total = catalogItems.length;
    const totalUnits = catalogItems.reduce((s, c) => s + (c.stockCount || 0), 0);
    const inventoryValue = catalogItems.reduce((s, c) => s + (c.stockCount || 0) * (c.defaultPrice || 0), 0);
    const avgPrice = total ? catalogItems.reduce((s, c) => s + (c.defaultPrice || 0), 0) / total : 0;
    const noStock = catalogItems.filter(c => (c.stockCount || 0) === 0).length;
    const withImage = catalogItems.filter(c => !!c.imageUrl).length;

    const byType = new Map<string, number>();
    for (const c of catalogItems) {
      const k = c.filamentType || 'OUTROS';
      byType.set(k, (byType.get(k) || 0) + 1);
    }
    const typeDist = [...byType.entries()].map(([name, value]) => ({ name, value }));

    const topPriced = [...catalogItems]
      .sort((a, b) => (b.defaultPrice || 0) - (a.defaultPrice || 0))
      .slice(0, 6)
      .map(c => ({ name: c.name.length > 18 ? c.name.slice(0, 16) + '…' : c.name, price: c.defaultPrice || 0 }));

    return { total, totalUnits, inventoryValue, avgPrice, noStock, withImage, typeDist, topPriced };
  }, [catalogItems]);

  const PIE = ['#b7ff00', '#D4A017', '#22D3EE', '#A78BFA', '#34D399', '#F472B6'];

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

  const aiTip = useMemo(() => {
    const fire = (name: string, detail?: any) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {} };
    if (stats.total === 0) {
      return {
        title: 'Comece cadastrando seu primeiro produto',
        body: 'Sem catálogo a IA não consegue prever giro, ticket nem composição. Cadastre ao menos 5 produtos para destravar previsões.',
        savings: 'R$ 0',
        action: 'Cadastrar Produto',
        onAction: () => fire('request-new-product'),
      };
    }
    if (stats.noStock > 0) {
      return {
        title: `${stats.noStock} produto(s) sem estoque — risco de ruptura`,
        body: 'Produtos zerados perdem venda imediata. Priorize a fila de produção dos itens de maior ticket para repor antes do fim de semana.',
        savings: fmtBRL(stats.noStock * stats.avgPrice),
        action: 'Repor Estoque',
        onAction: () => fire('navigate-costs-subtab', 'STOCK'),
      };
    }
    if (stats.withImage / Math.max(1, stats.total) < 0.7) {
      return {
        title: 'Catálogo subaproveitado — faltam fotos reais',
        body: 'Itens sem foto convertem até 60% menos. Adicione imagens reais para subir o ticket médio e o CTR no WhatsApp.',
        savings: fmtBRL(stats.avgPrice * 3),
        action: 'Adicionar Fotos',
        onAction: () => fire('navigate-costs-subtab', 'CATALOG'),
      };
    }
    return {
      title: 'Catálogo saudável — hora de divulgar',
      body: `Você tem ${stats.total} produtos com ticket médio de ${fmtBRL(stats.avgPrice)}. Exporte o PDF e dispare no WhatsApp para acelerar o giro.`,
      savings: fmtBRL(stats.inventoryValue * 0.1),
      action: 'Exportar Catálogo',
      onAction: () => fire('navigate-tab', 9),
    };
  }, [stats]);

  return (
    <div className="space-y-5 relative" id="catalog-dashboard">
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
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Economia estimada</span>
            <span className="text-xl font-extrabold text-[#b7ff00] tabular-nums">{aiTip.savings}</span>
            <button onClick={(aiTip as any).onAction} className="mt-1 px-3 py-1.5 bg-[#b7ff00] text-black text-[10px] font-extrabold uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(183,255,0,0.3)] flex items-center gap-1.5">
              {aiTip.action} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Section title */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-white/10 relative">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#b7ff00]" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Dashboard — Catálogo</h3>
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
        <Kpi icon={BookOpen}      label="Produtos"          value={stats.total}                          tone="gold" />
        <Kpi icon={Boxes}         label="Unidades"          value={stats.totalUnits}                     tone="lime" />
        <Kpi icon={DollarSign}    label="Valor em Estoque"  value={fmtBRL(stats.inventoryValue)}         tone="blue"    sub="no catálogo" />
        <Kpi icon={TrendingUp}    label="Ticket Médio"      value={fmtBRL(stats.avgPrice)}               tone="emerald" />
        <Kpi icon={Package}       label="Com Imagem"        value={`${stats.withImage}/${stats.total}`}  tone="purple" />
        <Kpi icon={AlertTriangle} label="Sem Estoque"       value={stats.noStock}                        tone={stats.noStock > 0 ? 'orange' : 'emerald'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        <Panel tone="gold" title="Top Preços do Catálogo">
          {stats.topPriced.length === 0 ? (
            <div className="flex items-center justify-center h-40 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem produtos cadastrados</span>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {stats.topPriced.map((p, i) => (
                <li key={p.name + i} className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-white/90 truncate flex items-center gap-2">
                    <span className="inline-flex w-5 h-5 items-center justify-center rounded-md bg-[#D4A017]/15 text-[#D4A017] font-bold text-[10px] border border-[#D4A017]/30">{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-[#b7ff00] font-mono font-bold">{fmtBRL(p.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel tone="lime" title="Composição por Material">
          {stats.typeDist.length === 0 ? (
            <div className="flex items-center justify-center h-40 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Aguardando métricas</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <PieChart>
                  <Pie data={stats.typeDist} dataKey="value" nameKey="name" outerRadius={60} label={{ fontSize: 10 }} isAnimationActive={false}>
                    {stats.typeDist.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Preço por Produto">
          {stats.topPriced.length === 0 ? (
            <div className="flex items-center justify-center h-40 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Dados insuficientes</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <BarChart data={stats.topPriced} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 9 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} formatter={(v: any) => fmtBRL(Number(v))} />
                  <Bar dataKey="price" fill="#b7ff00" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default CatalogoDashboard;