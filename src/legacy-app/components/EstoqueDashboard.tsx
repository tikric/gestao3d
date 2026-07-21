import React, { useMemo } from 'react';
import { RobotMascot } from './RobotMascot';
import type { CatalogItem, FilamentStock, SupplyStock } from '../types';
import {
  Package, Layers, Disc, Box, AlertTriangle, DollarSign,
  Sparkles, ArrowRight, TrendingDown, Plus,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  catalogItems: CatalogItem[];
  filamentStocks: FilamentStock[];
  suppliesStocks: SupplyStock[];
  otherStocks?: any[];
}

export const EstoqueDashboard: React.FC<Props> = ({ catalogItems, filamentStocks, suppliesStocks, otherStocks = [] }) => {
  const stats = useMemo(() => {
    const lowProducts = catalogItems.filter(c => (c.stockCount || 0) < (c.minStockCount || 0));
    const lowFilaments = filamentStocks.filter(f => f.stockGrams < f.minStockGrams);
    const lowSupplies = suppliesStocks.filter(s => s.stockCount < s.minStockCount);
    const lowOther = otherStocks.filter(x => (x.quantidade_estoque || 0) < (x.minimo || 0));

    const totalProductsUnits = catalogItems.reduce((s, c) => s + (c.stockCount || 0), 0);
    const totalFilamentKg = filamentStocks.reduce((s, f) => s + (f.stockGrams || 0), 0) / 1000;
    const totalSuppliesUnits = suppliesStocks.reduce((s, x) => s + (x.stockCount || 0), 0);
    const totalOtherUnits = otherStocks.reduce((s, x) => s + (x.quantidade_estoque || 0), 0);

    const filamentValue = filamentStocks.reduce((s, f) => s + (f.stockGrams / 1000) * (f.priceRoll || 0), 0);
    const suppliesValue = suppliesStocks.reduce((s, x) => s + x.stockCount * (x.unitCost || 0), 0);
    const productsValue = catalogItems.reduce((s, c) => s + (c.stockCount || 0) * (c.defaultPrice || 0), 0);
    const otherValue = otherStocks.reduce((s, x) => s + (x.quantidade_estoque || 0) * (x.custo_unitario || 0), 0);
    const totalValue = filamentValue + suppliesValue + productsValue + otherValue;

    // Filament distribution by type (kg)
    const byType = new Map<string, number>();
    for (const f of filamentStocks) {
      byType.set(f.type, (byType.get(f.type) || 0) + f.stockGrams / 1000);
    }
    const filamentByType = [...byType.entries()].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

    // Top 6 itens críticos (combinado)
    const critical: { name: string; gap: number; type: string }[] = [];
    lowProducts.forEach(p => critical.push({ name: p.name, gap: (p.minStockCount || 0) - (p.stockCount || 0), type: 'Produto' }));
    lowFilaments.forEach(f => critical.push({ name: `${f.type} ${f.color}`, gap: Math.round(((f.minStockGrams - f.stockGrams) / 1000) * 100) / 100, type: 'Filamento (kg)' }));
    lowSupplies.forEach(s => critical.push({ name: s.name, gap: s.minStockCount - s.stockCount, type: 'Insumo' }));
    lowOther.forEach(x => critical.push({ name: x.nome, gap: Math.round(((x.minimo || 0) - (x.quantidade_estoque || 0)) * 100) / 100, type: x.tipo === 'resina' ? 'Resina' : 'Outros' }));
    critical.sort((a, b) => b.gap - a.gap);
    const topCritical = critical.slice(0, 6);

    return {
      productsCount: catalogItems.length,
      totalProductsUnits,
      filamentsCount: filamentStocks.length,
      totalFilamentKg: totalFilamentKg,
      suppliesCount: suppliesStocks.length,
      totalSuppliesUnits,
      otherCount: otherStocks.length,
      totalOtherUnits,
      lowProducts: lowProducts.length,
      lowFilaments: lowFilaments.length,
      lowSupplies: lowSupplies.length,
      lowOther: lowOther.length,
      totalValue,
      filamentValue,
      productsValue,
      suppliesValue,
      otherValue,
      filamentByType,
      topCritical,
    };
  }, [catalogItems, filamentStocks, suppliesStocks, otherStocks]);

  const totalLow = stats.lowProducts + stats.lowFilaments + stats.lowSupplies + stats.lowOther;

  const aiTip = useMemo(() => {
    const fire = (name: string, detail?: any) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {} };
    const scrollTo = (id: string) => { try { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {} };
    if (stats.productsCount === 0 && stats.filamentsCount === 0 && stats.suppliesCount === 0 && stats.otherCount === 0) {
      return {
        title: 'Cadastre seu estoque para começar',
        body: 'Sem produtos, filamentos ou insumos não há como medir cobertura nem disparar alertas de reposição. Comece pelo carretel de filamento.',
        savings: '—',
        action: 'Cadastrar',
        onAction: () => fire('request-new-product'),
      };
    }
    if (totalLow > 0) {
      return {
        title: `${totalLow} item${totalLow > 1 ? 'ns' : ''} abaixo do mínimo — repor agora`,
        body: `Você tem ${stats.lowFilaments} filamento(s), ${stats.lowProducts} produto(s), ${stats.lowSupplies} insumo(s) e ${stats.lowOther} outro(s) item(ns) em estoque crítico. Comprar antes da ruptura evita paradas.`,
        savings: `-${totalLow} ruptura${totalLow > 1 ? 's' : ''}`,
        action: 'Ver críticos',
        onAction: () => scrollTo('estoque-criticos'),
      };
    }
    return {
      title: 'Estoque saudável — cobertura confortável',
      body: `${stats.totalFilamentKg.toFixed(2)}kg de filamento, ${stats.totalSuppliesUnits} insumos, ${stats.totalOtherUnits} outros itens e ${stats.totalProductsUnits} unidades prontas. Valor imobilizado em ${fmtBRL(stats.totalValue)}.`,
      savings: `${stats.filamentsCount + stats.suppliesCount + stats.productsCount + stats.otherCount} SKUs`,
      action: 'Auditar',
      onAction: () => scrollTo('estoque-auditoria'),
    };
  }, [stats, totalLow]);

  const KPI_THEMES: Record<string, { bar: string; glow: string }> = {
    gold:    { bar: 'bg-[#D4A017]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(212,160,23,0.18),_transparent_70%)]' },
    lime:    { bar: 'bg-[#b7ff00]',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(183,255,0,0.18),_transparent_70%)]' },
    blue:    { bar: 'bg-blue-500',    glow: 'bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_70%)]' },
    purple:  { bar: 'bg-purple-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.18),_transparent_70%)]' },
    emerald: { bar: 'bg-emerald-500', glow: 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_70%)]' },
    orange:  { bar: 'bg-orange-500',  glow: 'bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),_transparent_70%)]' },
    red:     { bar: 'bg-red-500',     glow: 'bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.18),_transparent_70%)]' },
    amber:   { bar: 'bg-amber-400',   glow: 'bg-[radial-gradient(circle_at_center,_rgba(229,178,66,0.18),_transparent_70%)]' },
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
    amber: 'bg-[radial-gradient(circle_at_center,_rgba(229,178,66,0.12),_transparent_70%)]',
    red: 'bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.12),_transparent_70%)]',
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

  const PIE_COLORS = ['#b7ff00', '#10B981', '#3B82F6', '#A78BFA', '#E5B242', '#F97316', '#EC4899', '#94A3B8'];

  return (
    <div className="space-y-5 relative" id="estoque-dashboard">
      <div className="pointer-events-none absolute -top-10 left-1/4 w-96 h-96 bg-[#b7ff00]/[0.04] rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-40 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[150px]" />

      {/* AI Recommendation */}
      <div className="group relative p-[1px] rounded-2xl bg-gradient-to-br from-[#b7ff00]/40 via-white/10 to-emerald-500/30">
        <div className="absolute -inset-6 rounded-2xl bg-[radial-gradient(circle_at_center,_rgba(183,255,0,0.14),_rgba(16,185,129,0.06)_40%,_transparent_70%)] blur-3xl opacity-70 pointer-events-none" />
        <div className="relative bg-[#0a0c0a]/80 backdrop-blur-2xl rounded-[15px] p-5 border border-white/10 flex items-start gap-5">
          <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#b7ff00]/40 to-emerald-500/30 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 flex items-center justify-center">
              <RobotMascot className="relative drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#b7ff00]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#b7ff00]">Recomendação de Estoque</span>
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
          <Package className="h-4 w-4 text-[#b7ff00]" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Dashboard — Estoque</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('request-new-product'))}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#b7ff00]/30 bg-[#b7ff00]/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#b7ff00] transition hover:bg-[#b7ff00]/25 hover:border-[#b7ff00]/50"
            id="btn_novo_produto_dashboard"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Produto
          </button>
          <span className={`text-[10px] font-bold uppercase flex items-center gap-2 ${totalLow > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${totalLow > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${totalLow > 0 ? 'bg-red-400 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-400 shadow-[0_0_8px_#10B981]'}`} />
          </span>
          {totalLow > 0 ? `${totalLow} crítico${totalLow > 1 ? 's' : ''}` : 'tudo ok'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative">
        <Kpi icon={Layers} label="Produtos" value={stats.productsCount} sub={`${stats.totalProductsUnits} und.`} tone="lime" />
        <Kpi icon={Disc} label="Filamentos" value={stats.filamentsCount} sub={`${stats.totalFilamentKg.toFixed(2)} kg`} tone="emerald" />
        <Kpi icon={Box} label="Insumos" value={stats.suppliesCount} sub={`${stats.totalSuppliesUnits} und.`} tone="amber" />
        <Kpi icon={Package} label="Outros Itens" value={stats.otherCount} sub={`${stats.totalOtherUnits.toFixed(2)} un/kg`} tone="purple" />
        <Kpi icon={AlertTriangle} label="Itens críticos" value={totalLow} sub={totalLow > 0 ? 'repor agora' : 'cobertura ok'} tone={totalLow > 0 ? 'red' : 'purple'} />
        <Kpi icon={DollarSign} label="Valor estoque" value={fmtBRL(stats.totalValue)} sub="custo imobilizado" tone="gold" />
        <Kpi icon={TrendingDown} label="Cobertura" value={`${stats.filamentsCount + stats.productsCount + stats.suppliesCount + stats.otherCount} SKU`} sub={`${stats.lowFilaments}f · ${stats.lowProducts}p · ${stats.lowSupplies}i · ${stats.lowOther}o`} tone="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        <Panel tone="emerald" title="Filamento por Tipo (kg)">
          {stats.filamentByType.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Sem filamentos</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 180, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <PieChart>
                  <Pie data={stats.filamentByType} dataKey="value" nameKey="name" outerRadius={60} label={{ fontSize: 10 }} isAnimationActive={false}>
                    {stats.filamentByType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel tone="red" title="Top Itens Críticos">
          {stats.topCritical.length === 0 ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-white/10 rounded-xl bg-black/20">
              <span className="text-emerald-500/80 text-[10px] font-bold uppercase tracking-widest">Sem rupturas — saudável</span>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {stats.topCritical.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-white truncate">{c.name}</div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500">{c.type}</div>
                  </div>
                  <span className="text-[10px] font-extrabold tabular-nums text-red-400 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                    -{c.gap}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel tone="gold" title="Valor por Categoria">
          <div style={{ width: '100%', height: 180, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={80}>
              <BarChart
                data={[
                  { name: 'Produtos', valor: Math.round(stats.productsValue) },
                  { name: 'Filamentos', valor: Math.round(stats.filamentValue) },
                  { name: 'Insumos', valor: Math.round(stats.suppliesValue) },
                  { name: 'Outros', valor: Math.round(stats.otherValue) },
                ]}
                layout="vertical"
              >
                <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: 'rgba(10,12,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, backdropFilter: 'blur(8px)' }}
                  formatter={(v: any) => fmtBRL(Number(v))}
                />
                <Bar dataKey="valor" fill="#D4A017" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
};