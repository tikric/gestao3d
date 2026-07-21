// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import {
  Receipt, FileText, Calendar, DollarSign, Wallet, FileBarChart2,
  Plus, Trash2, CheckCircle2, AlertTriangle, Download, Upload, Search, ArrowRight,
  Building2, Banknote, ExternalLink, Landmark, ScrollText, Globe,
  BarChart3, TrendingUp, ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Kpi, SectionTitle } from './DashboardShell';

/* ---------- storage helpers ---------- */
const KEY = 'contabilidade_mei_v1';
type Activity = 'comercio' | 'servico' | 'misto';
const DAS_2026: Record<Activity, number> = { comercio: 76.9, servico: 80.9, misto: 81.9 };
const ANNUAL_LIMIT = 81000;

type Nota = {
  id: string; type: 'emitida' | 'recebida'; number: string; issue_date: string;
  party: string; description: string; value: number; access_key?: string; file_url?: string;
  is_service?: boolean; municipio_prestador?: string;
};
type Receita = { year: number; month: number; total_sem_nota: number };
type DasPag = {
  id: string; reference: string /* YYYY-MM */; due_date: string;
  value: number; status: 'pendente' | 'pago'; payment_date?: string; comprovante?: string;
};
type Despesa = {
  id: string; date: string; category: string; description: string;
  value: number; comprovante?: string;
};
type State = {
  config: { activity: Activity; das_value: number };
  notas: Nota[];
  receitas: Receita[];
  das: DasPag[];
  despesas: Despesa[];
  empresa?: Empresa;
};

export type Empresa = {
  cnpj: string; nome_fantasia: string; razao_social: string;
  atividade_principal: string; endereco: string; cidade: string; uf: string;
  cep: string; telefone: string; email: string; data_abertura: string;
  updated_at?: string;
};
const defaultEmpresa = (): Empresa => ({
  cnpj: '', nome_fantasia: '', razao_social: '', atividade_principal: '',
  endereco: '', cidade: 'Sorocaba', uf: 'SP', cep: '', telefone: '', email: '', data_abertura: '',
});

const LINKS_GOVERNO: { descricao: string; url: string; icone: React.ComponentType<{ className?: string }> }[] = [
  { descricao: 'Portal do Empreendedor MEI', url: 'https://www.gov.br/mei/pt-br', icone: Building2 },
  { descricao: 'PGMEI (Declaração Anual)', url: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/declaracao-anual-do-mei', icone: FileText },
  { descricao: 'Pagar DAS (Simples Nacional)', url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/', icone: Banknote },
  { descricao: 'Emitir NFS-e (Nota Sorocaba)', url: 'https://nfse.sorocaba.sp.gov.br/', icone: Receipt },
  { descricao: 'Prefeitura de Sorocaba – MEI', url: 'https://www.sorocaba.sp.gov.br/', icone: Landmark },
  { descricao: 'SEFAZ SP – Consulta CNPJ', url: 'https://www.sefaz.sp.gov.br/', icone: ScrollText },
  { descricao: 'Receita Federal – e-CAC', url: 'https://cav.receita.fazenda.gov.br/', icone: Globe },
  { descricao: 'INSS – Consulta Débitos', url: 'https://www.gov.br/inss/pt-br', icone: Landmark },
];

const defaultState = (): State => ({
  config: { activity: 'comercio', das_value: DAS_2026.comercio },
  notas: [], receitas: [], das: [], despesas: [],
});

const loadState = (): State => {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch { return defaultState(); }
};
const saveState = (s: State) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
};

const uid = () => Math.random().toString(36).slice(2, 10);
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });

/* ---------- shared UI ---------- */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 ${className}`}>{children}</div>
);
const Btn: React.FC<any> = ({ children, className = '', tone = 'lime', ...p }) => {
  const tones: any = {
    lime: 'bg-[#b7ff00] text-black hover:scale-[1.03]',
    ghost: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
    danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30',
    gold: 'bg-[#D4A017] text-black hover:scale-[1.03]',
  };
  return (
    <button {...p} className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition ${tones[tone]} ${className}`}>
      {children}
    </button>
  );
};
const Input: React.FC<any> = (p) => (
  <input {...p} className={`w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#b7ff00]/50 ${p.className||''}`} />
);
const Select: React.FC<any> = ({ children, ...p }) => (
  <select {...p} className={`w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b7ff00]/50 ${p.className||''}`}>{children}</select>
);
const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0a0c0a] border border-white/10 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ---------- main ---------- */
const SUBS = [
  { id: 'dash',      label: 'Dashboard',            icon: BarChart3 },
  { id: 'relgestao', label: 'Relatório de Gestão',   icon: ScrollText },
  { id: 'notas',     label: 'Notas Fiscais',        icon: FileText },
  { id: 'rec',       label: 'Receitas',             icon: TrendingUp },
  { id: 'das',       label: 'DAS',                  icon: Banknote },
  { id: 'desp',      label: 'Despesas',             icon: Receipt },
  { id: 'dasn',      label: 'Declaração',           icon: ClipboardCheck },
  { id: 'empresa',   label: 'Empresa',              icon: Building2 },
] as const;

export const ContabilidadeTab: React.FC = () => {
  const [state, setState] = useState<State>(() => loadState());
  const [sub, setSub] = useState<typeof SUBS[number]['id']>('dash');
  useEffect(() => { saveState(state); }, [state]);

  const update = (fn: (s: State) => State) => setState(s => fn(structuredClone(s)));

  return (
    <div className="w-full space-y-6">
      <SectionTitle icon={FileBarChart2} title="Contabilidade MEI" status="Local" />

      {/* sub-nav */}
      <div className="flex flex-wrap gap-2">
        {SUBS.map(s => {
          const Icon = s.icon;
          const active = sub === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSub(s.id)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition ${
                active
                  ? 'bg-[#b7ff00] text-black shadow-[0_0_20px_rgba(183,255,0,0.3)]'
                  : 'bg-white/[0.04] text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{s.label}
            </button>
          );
        })}
      </div>

      {sub === 'dash' && <DashboardSub state={state} setSub={setSub} />}
      {sub === 'relgestao' && <RelGestaoSub state={state} />}
      {sub === 'empresa' && <EmpresaSub state={state} update={update} />}
      {sub === 'notas' && <NotasSub state={state} update={update} />}
      {sub === 'rec' && <ReceitasSub state={state} update={update} />}
      {sub === 'das' && <DasSub state={state} update={update} />}
      {sub === 'desp' && <DespesasSub state={state} update={update} />}
       {sub === 'dasn' && <DasnSub state={state} update={update} />}
    </div>
  );
};

/* ---------- RelGestaoSub (Relatório de Gestão) ---------- */
const RelGestaoSub: React.FC<{ state: State }> = ({ state }) => {
  const currentYearVal = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYearVal);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  const years = useMemo(() => {
    const yearsSet = new Set<number>([currentYearVal - 1, currentYearVal]);
    state.notas.forEach(n => {
      if (n.issue_date) {
        const y = new Date(n.issue_date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    state.receitas.forEach(r => {
      yearsSet.add(r.year);
    });
    state.despesas.forEach(d => {
      if (d.date) {
        const y = new Date(d.date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [state, currentYearVal]);

  const stats = useMemo(() => {
    let totalNotasEmitidas = 0;
    let totalSemNota = 0;

    state.notas.forEach(n => {
      if (n.type === 'emitida' && n.issue_date) {
        const d = new Date(n.issue_date);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        if (y === selectedYear && (selectedMonth === 'all' || m === selectedMonth)) {
          totalNotasEmitidas += Number(n.value || 0);
        }
      }
    });

    state.receitas.forEach(r => {
      if (r.year === selectedYear && (selectedMonth === 'all' || r.month === selectedMonth)) {
        totalSemNota += Number(r.total_sem_nota || 0);
      }
    });

    const faturamentoTotal = totalNotasEmitidas + totalSemNota;

    let totalNotasRecebidas = 0;
    let totalOutrasDespesas = 0;
    let categoryMap: Record<string, number> = {};

    state.notas.forEach(n => {
      if (n.type === 'recebida' && n.issue_date) {
        const d = new Date(n.issue_date);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        if (y === selectedYear && (selectedMonth === 'all' || m === selectedMonth)) {
          totalNotasRecebidas += Number(n.value || 0);
          const cat = n.is_service ? 'Serviços Terceiros' : 'Insumos com NF';
          categoryMap[cat] = (categoryMap[cat] || 0) + Number(n.value || 0);
        }
      }
    });

    state.despesas.forEach(dep => {
      if (dep.date) {
        const d = new Date(dep.date);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        if (y === selectedYear && (selectedMonth === 'all' || m === selectedMonth)) {
          totalOutrasDespesas += Number(dep.value || 0);
          const cat = dep.category || 'Outros';
          categoryMap[cat] = (categoryMap[cat] || 0) + Number(dep.value || 0);
        }
      }
    });

    let dasTotal = 0;
    state.das.forEach(d => {
      if (d.status === 'pago') {
        const referenceParts = d.reference.split('-');
        if (referenceParts.length === 2) {
          const y = parseInt(referenceParts[0]);
          const m = parseInt(referenceParts[1]);
          if (y === selectedYear && (selectedMonth === 'all' || m === selectedMonth)) {
            dasTotal += Number(d.value || 0);
          }
        }
      }
    });
    if (dasTotal > 0) {
      categoryMap['Guia DAS (MEI)'] = (categoryMap['Guia DAS (MEI)'] || 0) + dasTotal;
    }

    const totalDespesas = totalNotasRecebidas + totalOutrasDespesas + dasTotal;
    const lucroLiquido = faturamentoTotal - totalDespesas;
    const margemLiquida = faturamentoTotal > 0 ? (lucroLiquido / faturamentoTotal) * 100 : 0;

    const monthlyData = Array.from({ length: 12 }, (_, mIdx) => {
      const month = mIdx + 1;
      let fatNf = 0;
      state.notas.forEach(n => {
        if (n.type === 'emitida' && n.issue_date) {
          const d = new Date(n.issue_date);
          if (d.getFullYear() === selectedYear && d.getMonth() + 1 === month) {
            fatNf += Number(n.value || 0);
          }
        }
      });
      const semNf = state.receitas.find(r => r.year === selectedYear && r.month === month)?.total_sem_nota || 0;
      const totalFat = fatNf + semNf;

      let expNf = 0;
      state.notas.forEach(n => {
        if (n.type === 'recebida' && n.issue_date) {
          const d = new Date(n.issue_date);
          if (d.getFullYear() === selectedYear && d.getMonth() + 1 === month) {
            expNf += Number(n.value || 0);
          }
        }
      });
      let expOutras = 0;
      state.despesas.forEach(dep => {
        if (dep.date) {
          const d = new Date(dep.date);
          if (d.getFullYear() === selectedYear && d.getMonth() + 1 === month) {
            expOutras += Number(dep.value || 0);
          }
        }
      });
      let expDas = 0;
      state.das.forEach(d => {
        if (d.status === 'pago') {
          const parts = d.reference.split('-');
          if (parts.length === 2 && parseInt(parts[0]) === selectedYear && parseInt(parts[1]) === month) {
            expDas += Number(d.value || 0);
          }
        }
      });

      const totalExp = expNf + expOutras + expDas;
      const net = totalFat - totalExp;
      const margin = totalFat > 0 ? (net / totalFat) * 100 : 0;

      return {
        month,
        faturamento: totalFat,
        despesas: totalExp,
        lucro: net,
        margem: margin
      };
    });

    return {
      faturamentoTotal,
      totalNotasEmitidas,
      totalSemNota,
      totalDespesas,
      dasTotal,
      lucroLiquido,
      margemLiquida,
      categoryMap,
      monthlyData
    };
  }, [state, selectedYear, selectedMonth]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="management-report-view">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#b7ff00]">Ateliê 3D Inteliente</span>
            <h2 className="text-lg font-bold text-white">Relatório da Gestão Financeira</h2>
            <p className="text-xs text-zinc-400">Análise de rentabilidade, DRE gerencial e consolidação tributária do MEI</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] text-zinc-500 block">Ano de Exercício</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] text-zinc-500 block">Período</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="all">Ano Completo</option>
                {monthNames.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="mt-4 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-white"
              title="Imprimir relatório usando as regras do navegador"
            >
              Imprimir
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl border border-[#232B27] bg-[#0C0E0D] relative overflow-hidden">
            <div className="absolute right-3 top-3 h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Faturamento Bruto</span>
            <div className="text-xl font-black text-white mt-1">R$ {stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-[9px] text-zinc-500 mt-1">
              {selectedMonth === 'all' ? 'Consolidado anual' : `Exercício de ${monthNames[selectedMonth - 1]}`}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#232B27] bg-[#0C0E0D] relative overflow-hidden">
            <div className="absolute right-3 top-3 h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Custos & Despesas</span>
            <div className="text-xl font-black text-white mt-1">R$ {stats.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-[9px] text-zinc-500 mt-1">
              Inclui guias DAS tributárias pagas
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#232B27] bg-[#0C0E0D] relative overflow-hidden">
            <div className="absolute right-3 top-3 h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Lucro Líquido</span>
            <div className={`text-xl font-black mt-1 ${stats.lucroLiquido >= 0 ? 'text-[#b7ff00]' : 'text-red-400'}`}>
              R$ {stats.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[9px] text-zinc-500 mt-1">
              Resultado final do período
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#232B27] bg-[#0C0E0D] relative overflow-hidden">
            <div className="absolute right-3 top-3 h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Award className="h-4 w-4" />
            </div>
            <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Margem Líquida</span>
            <div className="text-xl font-black text-purple-300 mt-1">{stats.margemLiquida.toFixed(2)}%</div>
            <div className="text-[9px] text-zinc-500 mt-1">
              Eficiência operacional líquida
            </div>
          </div>
        </div>
      </Card>

      {/* DRE e Gráfico de Despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xs font-bold text-[#b7ff00] uppercase tracking-wider mb-3">Demonstração do Resultado (DRE Gerencial)</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-white/5 py-1.5">
              <span className="text-zinc-400 font-sans font-bold text-sm">(=) RECEITA BRUTA OPERACIONAL</span>
              <span className="text-white font-bold text-sm">R$ {stats.faturamentoTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded">
              <span className="text-zinc-500 font-sans">Receitas de Vendas com Nota Fiscal (NF-e)</span>
              <span className="text-white">R$ {stats.totalNotasEmitidas.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded">
              <span className="text-zinc-500 font-sans">Receitas de Vendas sem Nota Fiscal</span>
              <span className="text-white">R$ {stats.totalSemNota.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 py-1.5 pt-3">
              <span className="text-zinc-400 font-sans font-bold">(-) CUSTOS E DESPESAS OPERACIONAIS</span>
              <span className="text-red-400 font-bold">R$ {stats.totalDespesas.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded">
              <span className="text-zinc-500 font-sans">Insumos e Matérias-Primas com NF recebidas</span>
              <span className="text-zinc-300">R$ {state.notas.filter(n => n.type === 'recebida' && !n.is_service).reduce((sum, n) => sum + Number(n.value || 0), 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded">
              <span className="text-zinc-500 font-sans">Serviços de Terceiros e Fretes</span>
              <span className="text-zinc-300">R$ {state.notas.filter(n => n.type === 'recebida' && n.is_service).reduce((sum, n) => sum + Number(n.value || 0), 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded">
              <span className="text-zinc-500 font-sans">Guia Tributária DAS MEI Paga</span>
              <span className="text-zinc-300">R$ {stats.dasTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded">
              <span className="text-zinc-500 font-sans">Outras Despesas Operacionais (Ateliê)</span>
              <span className="text-zinc-300">R$ {state.despesas.reduce((sum, d) => sum + Number(d.value || 0), 0).toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between border-t border-b border-[#b7ff00]/30 py-2.5 mt-4 bg-[#b7ff00]/5 px-2 rounded-lg">
              <span className="text-[#b7ff00] font-sans font-black">(=) RESULTADO LÍQUIDO DO EXERCÍCIO</span>
              <span className="text-[#b7ff00] font-bold text-sm">R$ {stats.lucroLiquido.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4">Composição de Gastos por Categoria</h3>
          <div className="space-y-3">
            {Object.keys(stats.categoryMap).length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs">
                Nenhuma despesa ou custo registrado no período selecionado.
              </div>
            ) : (
              Object.entries(stats.categoryMap)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, val]) => {
                  const pct = stats.totalDespesas > 0 ? (val / stats.totalDespesas) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white font-bold">{cat}</span>
                        <span className="font-mono text-zinc-400">
                          R$ {val.toFixed(2)} <span className="text-[10px] text-zinc-500">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </Card>
      </div>

      {/* Histórico Mensal */}
      <Card>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Fluxo de Caixa e Resultado Mensal</h3>
        <p className="text-[11px] text-zinc-500 mb-4">Análise mensal contínua das receitas brutas e rentabilidade para manter o limite de enquadramento do MEI sob controle</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 font-sans uppercase tracking-wider text-[10px] text-zinc-400">
                <th className="py-2.5 px-3">Mês</th>
                <th className="py-2.5 px-3 text-right">Faturamento Bruto</th>
                <th className="py-2.5 px-3 text-right">Despesas Operacionais</th>
                <th className="py-2.5 px-3 text-right">Resultado Líquido</th>
                <th className="py-2.5 px-3 text-right">Margem</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {stats.monthlyData.map(m => {
                const color = m.lucro > 0 ? 'text-[#b7ff00]' : m.lucro < 0 ? 'text-red-400' : 'text-zinc-500';
                return (
                  <tr key={m.month} className="hover:bg-white/[0.02] transition">
                    <td className="py-2 px-3 font-sans font-bold text-white">{monthNames[m.month - 1]}</td>
                    <td className="py-2 px-3 text-right text-zinc-300">R$ {m.faturamento.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-zinc-400">R$ {m.despesas.toFixed(2)}</td>
                    <td className={`py-2 px-3 text-right font-bold ${color}`}>R$ {m.lucro.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-zinc-500">{m.margem.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-center">
                      {m.faturamento === 0 ? (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-600" title="Sem atividade" />
                      ) : m.lucro > 0 ? (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#b7ff00]" title="Lucrativo" />
                      ) : (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" title="Déficit" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ContabilidadeTab;

/* ---------- helpers for revenue ---------- */
function monthTotals(state: State, year: number) {
  return Array.from({ length: 12 }, (_, m) => {
    const month = m + 1;
    const notas = state.notas
      .filter(n => n.type === 'emitida' && new Date(n.issue_date).getFullYear() === year && new Date(n.issue_date).getMonth() + 1 === month)
      .reduce((s, n) => s + Number(n.value || 0), 0);
    const rec = state.receitas.find(r => r.year === year && r.month === month);
    const sem = rec?.total_sem_nota || 0;
    return { month, notas, sem, total: notas + sem };
  });
}

/* ---------- DASHBOARD ---------- */
const DashboardSub: React.FC<{ state: State; setSub: (s: any) => void }> = ({ state, setSub }) => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const totals = monthTotals(state, year);
  const accum = totals.slice(0, month).reduce((s, t) => s + t.total, 0);
  const pct = Math.min(100, (accum / ANNUAL_LIMIT) * 100);
  const nextDas = state.das.filter(d => d.status === 'pendente').sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const despMes = state.despesas
    .filter(d => new Date(d.date).getFullYear() === year && new Date(d.date).getMonth() + 1 === month)
    .reduce((s, d) => s + Number(d.value || 0), 0);

  const max = Math.max(1, ...totals.map(t => t.total));

  const notasMes = state.notas.filter(n => n.type === 'emitida' && new Date(n.issue_date).getFullYear() === year && new Date(n.issue_date).getMonth() + 1 === month);
  const notasMesValor = notasMes.reduce((s, n) => s + Number(n.value || 0), 0);

  const empresa = state.empresa;
  const empresaIncompleta = !empresa || !empresa.cnpj || empresa.cnpj.replace(/\D/g, '').length !== 14 || !empresa.razao_social;
  const nomeFantasia = empresa?.nome_fantasia?.trim() || empresa?.razao_social?.trim() || 'Empresa MEI';

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f1a10] via-[#0a0c0a] to-[#0a0c0a] p-5">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#b7ff00]/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#b7ff00] font-bold">Bem-vindo</span>
            <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight mt-1">{nomeFantasia}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Painel contábil · {MESES[month - 1]} / {year}</p>
          </div>
          {empresa?.cnpj && (
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">CNPJ</span>
              <div className="text-sm text-white font-bold tabular-nums">{empresa.cnpj}</div>
            </div>
          )}
        </div>
      </div>

      {empresaIncompleta && (
        <button
          onClick={() => setSub('empresa')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/15 transition text-left"
        >
          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-bold text-orange-200">Complete os dados da empresa</div>
            <div className="text-[11px] text-orange-200/70">CNPJ e razão social são necessários para emitir notas e gerar a DASN.</div>
          </div>
          <ArrowRight className="w-4 h-4 text-orange-300" />
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={DollarSign} label="DAS Mensal" value={brl(state.config.das_value)} sub={state.config.activity.toUpperCase()} tone="gold" />
        <Kpi icon={Calendar} label="Próximo DAS" value={nextDas ? nextDas.reference : '—'} sub={nextDas ? `Venc. ${new Date(nextDas.due_date).toLocaleDateString('pt-BR')}` : 'Sem pendência'} tone="orange" />
        <Kpi icon={FileBarChart2} label="Faturamento Ano" value={brl(accum)} sub={`${pct.toFixed(1)}% do limite`} tone={pct > 80 ? 'orange' : 'lime'} />
        <Kpi icon={Receipt} label="Notas no Mês" value={`${notasMes.length}`} sub={brl(notasMesValor)} tone="emerald" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Limite anual MEI</span>
          <span className="text-[11px] text-white font-bold tabular-nums">{brl(accum)} / {brl(ANNUAL_LIMIT)}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct > 80 ? '#f97316' : '#b7ff00' }}
          />
        </div>
        {pct > 80 && (
          <div className="mt-3 flex items-center gap-2 text-orange-300 text-xs">
            <AlertTriangle className="w-4 h-4" /> Atenção: você está acima de 80% do limite anual de R$ 81.000.
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Faturamento {year}</h4>
          <div className="flex items-end gap-1.5 h-32">
            {totals.map(t => (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gradient-to-t from-[#b7ff00] to-[#D4A017] rounded-t" style={{ height: `${(t.total / max) * 100}%`, minHeight: t.total ? '4px' : '0' }} />
                <span className="text-[9px] text-zinc-500 font-bold">{MESES[t.month - 1]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Ações rápidas</h4>
          <div className="flex flex-col gap-2">
            <Btn onClick={() => setSub('notas')}><Plus className="inline w-3 h-3 mr-1" /> Nota Fiscal</Btn>
            <Btn tone="ghost" onClick={() => setSub('rec')}><Plus className="inline w-3 h-3 mr-1" /> Lançar Receita</Btn>
            <Btn tone="gold" onClick={() => setSub('das')}><DollarSign className="inline w-3 h-3 mr-1" /> Pagar DAS</Btn>
            <Btn tone="ghost" onClick={() => setSub('dasn')}><FileText className="inline w-3 h-3 mr-1" /> Declaração</Btn>
          </div>
        </Card>
      </div>

      {/* Links úteis */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#D4A017]" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Links Úteis</h4>
          </div>
          <button onClick={() => setSub('empresa')} className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-[#b7ff00] flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {LINKS_GOVERNO.slice(0, 4).map((l, i) => {
            const Icon = l.icone;
            return (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.04] border border-white/10 hover:border-[#b7ff00]/40 transition"
              >
                <Icon className="w-4 h-4 text-[#D4A017] shrink-0" />
                <span className="text-[11px] font-bold text-white truncate flex-1">{l.descricao}</span>
                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-[#b7ff00] transition" />
              </a>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

/* ---------- NOTAS ---------- */
const NotasSub: React.FC<{ state: State; update: (fn: (s: State) => State) => void }> = ({ state, update }) => {
  const [type, setType] = useState<'emitida' | 'recebida'>('emitida');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const defaultForm = () => ({
    number: '', issue_date: new Date().toISOString().slice(0, 10),
    party: '', description: '', value: '', access_key: '',
    is_service: false, municipio_prestador: state.empresa?.cidade || 'Sorocaba',
  });
  const [form, setForm] = useState<any>(defaultForm);

  const list = state.notas.filter(n => n.type === type && (q === '' || n.party.toLowerCase().includes(q.toLowerCase()) || n.number.includes(q)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.party.trim()) { toast.error('Informe o cliente/fornecedor'); return; }
    const val = Number(form.value);
    if (!val || val <= 0) { toast.error('Valor inválido'); return; }
    const fileInput = (e.target as HTMLFormElement).elements.namedItem('file') as HTMLInputElement;
    let file_url: string | undefined;
    if (fileInput?.files?.[0]) file_url = await fileToDataUrl(fileInput.files[0]);
    const nota: Nota = { id: uid(), type, ...form, value: val, file_url };
    update(s => ({ ...s, notas: [nota, ...s.notas] }));
    setOpen(false);
    setForm(defaultForm());
    toast.success(`Nota ${type === 'emitida' ? 'emitida' : 'recebida'} salva`);
  };

  const remove = (id: string) => {
    if (!confirm('Excluir esta nota fiscal?')) return;
    update(s => ({ ...s, notas: s.notas.filter(n => n.id !== id) }));
    toast.success('Nota excluída — receita do mês recalculada');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['emitida', 'recebida'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest ${type === t ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-white/60 border border-white/10'}`}>
              {t === 'emitida' ? 'Emitidas' : 'Recebidas'} ({state.notas.filter(n => n.type === t).length})
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
            <Input placeholder="Buscar..." value={q} onChange={(e: any) => setQ(e.target.value)} className="pl-8 w-56" />
          </div>
          <Btn onClick={() => setOpen(true)}><Plus className="inline w-3 h-3 mr-1" /> Nova Nota {type === 'emitida' ? 'Emitida' : 'Recebida'}</Btn>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhuma nota {type === 'emitida' ? 'emitida' : 'recebida'}. Cadastre a primeira!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-zinc-400">
              <tr>
                <th className="text-left p-3">Número</th>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">{type === 'emitida' ? 'Cliente' : 'Fornecedor'}</th>
                <th className="text-right p-3">Valor</th>
                <th className="text-left p-3">Chave</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {list.map(n => (
                <tr key={n.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-mono text-xs">{n.number || '—'}</td>
                  <td className="p-3 text-zinc-300">{new Date(n.issue_date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3 text-zinc-200">{n.party}</td>
                  <td className="p-3 text-right text-[#b7ff00] font-bold tabular-nums">{brl(n.value)}</td>
                  <td className="p-3 text-zinc-500 font-mono text-[10px]">{n.access_key ? n.access_key.slice(0, 12) + '…' : '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {n.file_url && <a href={n.file_url} download className="p-1.5 text-zinc-400 hover:text-white"><Download className="w-3.5 h-3.5" /></a>}
                      <button onClick={() => remove(n.id)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`Nova Nota ${type === 'emitida' ? 'Emitida' : 'Recebida'}`}>
        <form onSubmit={save} className="space-y-3">
          {type === 'emitida' && (
            <div className="rounded-lg border border-[#D4A017]/30 bg-[#D4A017]/10 p-3 text-[11px] text-[#f3d77a] leading-relaxed">
              <div className="flex items-start gap-2">
                <Receipt className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <strong className="text-white">Serviços (ISS):</strong> emita a NFS-e no portal da Prefeitura de Sorocaba e cole a chave aqui.
                </div>
              </div>
              <a
                href="https://nfse.sorocaba.sp.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#D4A017] text-black text-[10px] font-bold uppercase tracking-widest hover:scale-[1.03] transition"
              >
                <ExternalLink className="w-3 h-3" /> Emitir NFS-e Sorocaba
              </a>
            </div>
          )}
          {type === 'emitida' && (
            <label className="flex items-center gap-2 text-[11px] text-zinc-300">
              <input
                type="checkbox"
                checked={!!form.is_service}
                onChange={(e) => setForm({ ...form, is_service: e.target.checked })}
                className="accent-[#b7ff00]"
              />
              Nota de <strong className="text-white">serviço</strong> (NFS-e) — não de produto
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            {type === 'emitida' && <Input placeholder="Número" value={form.number} onChange={(e: any) => setForm({ ...form, number: e.target.value })} />}
            <Input type="date" value={form.issue_date} onChange={(e: any) => setForm({ ...form, issue_date: e.target.value })} className={type === 'recebida' ? 'col-span-2' : ''} />
          </div>
          <Input placeholder={type === 'emitida' ? 'Cliente' : 'Fornecedor'} required value={form.party} onChange={(e: any) => setForm({ ...form, party: e.target.value })} />
          <Input placeholder="Descrição" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <Input type="number" step="0.01" placeholder="Valor (R$)" required value={form.value} onChange={(e: any) => setForm({ ...form, value: e.target.value })} />
          {type === 'emitida' && <Input placeholder="Chave de acesso (opcional)" value={form.access_key} onChange={(e: any) => setForm({ ...form, access_key: e.target.value })} />}
          {type === 'emitida' && form.is_service && (
            <Input
              placeholder="Município prestador"
              value={form.municipio_prestador}
              onChange={(e: any) => setForm({ ...form, municipio_prestador: e.target.value })}
            />
          )}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1 mb-1"><Upload className="w-3 h-3" /> Arquivo PDF/XML</label>
            <input name="file" type="file" accept=".pdf,.xml,image/*" className="text-xs text-zinc-300 w-full" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn tone="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn type="submit">Salvar</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* ---------- RECEITAS ---------- */
const ReceitasSub: React.FC<{ state: State; update: (fn: (s: State) => State) => void }> = ({ state, update }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const totals = monthTotals(state, year);
  const totalAno = totals.reduce((s, t) => s + t.total, 0);
  const monthlyLimit = 6750;
  const [reportMonth, setReportMonth] = useState<number | null>(null);
  const annualPct = Math.min(100, (totalAno / ANNUAL_LIMIT) * 100);

  const setSem = (month: number, val: number) => {
    update(s => {
      const i = s.receitas.findIndex(r => r.year === year && r.month === month);
      if (i >= 0) s.receitas[i].total_sem_nota = val;
      else s.receitas.push({ year, month, total_sem_nota: val });
      return s;
    });
    toast.success(`${MESES[month - 1]}/${year} atualizado`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={year} onChange={(e: any) => setYear(Number(e.target.value))} className="w-32">
          {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <div className="text-sm text-white">
          Total {year}: <span className="font-bold text-[#b7ff00] tabular-nums">{brl(totalAno)}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400">Receita Bruta Anual</div>
          <div className="text-2xl font-extrabold text-[#b7ff00] tabular-nums mt-1">{brl(totalAno)}</div>
          <div className="h-1.5 mt-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-[#b7ff00]" style={{ width: `${annualPct}%` }} />
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">{annualPct.toFixed(1)}% do limite MEI ({brl(ANNUAL_LIMIT)})</div>
        </Card>
        <Card>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400">Meses Saudáveis</div>
          <div className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-1">
            {totals.filter(t => t.total > 0 && t.total <= monthlyLimit).length}<span className="text-sm text-zinc-500">/12</span>
          </div>
        </Card>
        <Card>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400">Meses Acima do Limite</div>
          <div className="text-2xl font-extrabold text-amber-300 tabular-nums mt-1">
            {totals.filter(t => t.total > monthlyLimit).length}
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-zinc-400">
            <tr>
              <th className="text-left p-3">Mês</th>
              <th className="text-right p-3">Notas Emitidas</th>
              <th className="text-right p-3">Vendas s/ Nota</th>
              <th className="text-right p-3">Receita Bruta</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {totals.map(t => {
              const over = t.total > monthlyLimit;
              const healthy = t.total > 0 && !over;
              return (
                <tr key={t.month} className={`border-t border-white/5 transition-colors ${over ? 'bg-amber-500/10' : healthy ? 'bg-emerald-500/[0.04]' : ''}`}>
                  <td className="p-3 text-white font-bold flex items-center gap-2">
                    {over && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    {MESES[t.month - 1]}
                  </td>
                  <td className="p-3 text-right text-zinc-300 tabular-nums">{brl(t.notas)}</td>
                  <td className="p-3 text-right">
                    <input
                      type="number" step="0.01" defaultValue={t.sem || ''}
                      onBlur={(e) => setSem(t.month, Number(e.target.value) || 0)}
                      className="w-28 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-right text-white tabular-nums"
                    />
                  </td>
                  <td className={`p-3 text-right font-bold tabular-nums ${over ? 'text-amber-300' : healthy ? 'text-emerald-300' : 'text-zinc-500'}`}>{brl(t.total)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setReportMonth(t.month)}
                      className="text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200"
                    >
                      Relatório
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="text-[10px] text-zinc-500">Linhas em amarelo: mês acima de R$ 6.750 (limite proporcional MEI).</p>

      {reportMonth !== null && (
        <RelatorioMensalModal
          year={year}
          month={reportMonth}
          totals={totals.find(t => t.month === reportMonth)!}
          empresa={state.empresa}
          notas={state.notas.filter(n => n.type === 'emitida' && new Date(n.issue_date).getFullYear() === year && new Date(n.issue_date).getMonth() + 1 === reportMonth)}
          onClose={() => setReportMonth(null)}
        />
      )}
    </div>
  );
};

/* ---------- Monthly Report Modal ---------- */
const RelatorioMensalModal: React.FC<{
  year: number; month: number;
  totals: { notas: number; sem: number; total: number };
  empresa?: Empresa;
  notas: Nota[];
  onClose: () => void;
}> = ({ year, month, totals, empresa, notas, onClose }) => {
  const monthName = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][month - 1];
  const print = () => window.print();
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:bg-white print:p-0" onClick={onClose}>
      <div
        className="bg-zinc-950 print:bg-white border border-white/10 print:border-0 rounded-2xl print:rounded-none max-w-2xl w-full max-h-[90vh] overflow-auto p-8 print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h3 className="text-lg font-bold text-white">Relatório Mensal</h3>
          <div className="flex gap-2">
            <button onClick={print} className="text-xs px-3 py-1.5 rounded bg-[#b7ff00] text-black font-bold">Imprimir</button>
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-white/10 text-white border border-white/10">Fechar</button>
          </div>
        </div>

        <div className="space-y-4 text-sm print:text-black text-zinc-200">
          <div className="text-center border-b border-white/10 print:border-zinc-300 pb-4">
            <h1 className="text-xl font-extrabold print:text-black text-white">DECLARAÇÃO DE RECEITA BRUTA – MEI</h1>
            <p className="text-xs text-zinc-400 print:text-zinc-700 mt-1">{monthName} / {year}</p>
          </div>

          <div>
            <h4 className="font-bold uppercase text-[10px] tracking-widest text-zinc-400 print:text-zinc-600 mb-1">Empresa</h4>
            <p><strong>Razão Social:</strong> {empresa?.razao_social || '—'}</p>
            <p><strong>Nome Fantasia:</strong> {empresa?.nome_fantasia || '—'}</p>
            <p><strong>CNPJ:</strong> {empresa?.cnpj || '—'}</p>
            <p><strong>Endereço:</strong> {empresa?.endereco || '—'} – {empresa?.cidade || ''}/{empresa?.uf || ''}</p>
          </div>

          <div>
            <h4 className="font-bold uppercase text-[10px] tracking-widest text-zinc-400 print:text-zinc-600 mb-1">Receitas do Mês</h4>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-white/10 print:border-zinc-300"><td className="py-1">Receita com Notas Fiscais</td><td className="py-1 text-right tabular-nums">{brl(totals.notas)}</td></tr>
                <tr className="border-b border-white/10 print:border-zinc-300"><td className="py-1">Receita sem Nota Fiscal</td><td className="py-1 text-right tabular-nums">{brl(totals.sem)}</td></tr>
                <tr className="font-bold"><td className="py-2">Receita Bruta Total</td><td className="py-2 text-right tabular-nums text-[#b7ff00] print:text-black">{brl(totals.total)}</td></tr>
              </tbody>
            </table>
          </div>

          {notas.length > 0 && (
            <div>
              <h4 className="font-bold uppercase text-[10px] tracking-widest text-zinc-400 print:text-zinc-600 mb-1">Notas Emitidas ({notas.length})</h4>
              <ul className="text-xs space-y-1">
                {notas.map(n => (
                  <li key={n.id} className="flex justify-between border-b border-white/5 print:border-zinc-200 py-1">
                    <span>Nº {n.number} – {n.party}</span>
                    <span className="tabular-nums">{brl(n.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-white/10 print:border-zinc-300 pt-4 text-xs leading-relaxed">
            Declaro, para os devidos fins, que a receita bruta apurada no mês de <strong>{monthName} de {year}</strong> totaliza <strong>{brl(totals.total)}</strong>, conforme registros do Microempreendedor Individual, em cumprimento ao Art. 1° da Resolução CGSN nº 140/2018.
          </div>

          <div className="pt-8 text-center text-xs">
            <div className="border-t border-zinc-500 inline-block px-12 pt-1">{empresa?.razao_social || 'Titular MEI'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- DAS ---------- */
const DasSub: React.FC<{ state: State; update: (fn: (s: State) => State) => void }> = ({ state, update }) => {
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ payment_date: new Date().toISOString().slice(0, 10) });

  const setActivity = (act: Activity) => update(s => ({ ...s, config: { ...s.config, activity: act, das_value: DAS_2026[act] } }));
  const setValue = (v: number) => update(s => ({ ...s, config: { ...s.config, das_value: v } }));

  const addNext = () => {
    update(s => {
      const last = [...s.das].sort((a, b) => b.reference.localeCompare(a.reference))[0];
      const base = last ? new Date(last.reference + '-01') : new Date();
      base.setMonth(base.getMonth() + (last ? 1 : 0));
      const ref = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
      if (s.das.find(d => d.reference === ref)) return s;
      const due = new Date(base.getFullYear(), base.getMonth() + 1, 20);
      s.das.push({ id: uid(), reference: ref, due_date: due.toISOString().slice(0, 10), value: s.config.das_value, status: 'pendente' });
      return s;
    });
  };

  const markPaid = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    const fi = (e.target as HTMLFormElement).elements.namedItem('comprovante') as HTMLInputElement;
    let comprovante: string | undefined;
    if (fi?.files?.[0]) comprovante = await fileToDataUrl(fi.files[0]);
    update(s => {
      const d = s.das.find(x => x.id === id);
      if (d) { d.status = 'pago'; d.payment_date = payForm.payment_date; if (comprovante) d.comprovante = comprovante; }
      // auto-create next
      const base = new Date(d!.reference + '-01');
      base.setMonth(base.getMonth() + 1);
      const ref = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
      if (!s.das.find(x => x.reference === ref)) {
        const due = new Date(base.getFullYear(), base.getMonth() + 1, 20);
        s.das.push({ id: uid(), reference: ref, due_date: due.toISOString().slice(0, 10), value: s.config.das_value, status: 'pendente' });
      }
      return s;
    });
    setPayOpen(null);
  };

  const remove = (id: string) => {
    if (!confirm('Excluir este DAS?')) return;
    update(s => ({ ...s, das: s.das.filter(d => d.id !== id) }));
  };

  const sorted = [...state.das].sort((a, b) => b.reference.localeCompare(a.reference));

  return (
    <div className="space-y-4">
      <Card>
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Configuração MEI</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Atividade</label>
            <Select value={state.config.activity} onChange={(e: any) => setActivity(e.target.value)}>
              <option value="comercio">Comércio/Indústria</option>
              <option value="servico">Serviços</option>
              <option value="misto">Misto</option>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">DAS Mensal (R$)</label>
            <Input type="number" step="0.01" value={state.config.das_value} onChange={(e: any) => setValue(Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <Btn onClick={addNext}><Plus className="inline w-3 h-3 mr-1" /> Gerar Próximo DAS</Btn>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            Nenhum DAS gerado. Clique em "Gerar Próximo DAS" acima.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-zinc-400">
              <tr>
                <th className="text-left p-3">Referência</th>
                <th className="text-left p-3">Vencimento</th>
                <th className="text-right p-3">Valor</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Pagamento</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(d => {
                const days = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
                const urgent = d.status === 'pendente' && days <= 5;
                return (
                  <tr key={d.id} className="border-t border-white/5">
                    <td className="p-3 text-white font-bold">{d.reference}</td>
                    <td className="p-3 text-zinc-300">{new Date(d.due_date).toLocaleDateString('pt-BR')} {urgent && <span className="ml-2 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[9px] font-bold uppercase">Urgente</span>}</td>
                    <td className="p-3 text-right text-[#b7ff00] font-bold tabular-nums">{brl(d.value)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.status === 'pago' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-orange-500/20 text-orange-300'}`}>{d.status}</span>
                    </td>
                    <td className="p-3 text-zinc-400 text-xs">
                      {d.payment_date ? new Date(d.payment_date).toLocaleDateString('pt-BR') : '—'}
                      {d.comprovante && <a href={d.comprovante} download className="ml-2 text-zinc-300"><Download className="w-3 h-3 inline" /></a>}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.status === 'pendente' && <Btn className="!py-1 !px-2" onClick={() => setPayOpen(d.id)}><CheckCircle2 className="w-3 h-3 inline mr-1" />Pagar</Btn>}
                        <button onClick={() => remove(d.id)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title="Registrar Pagamento DAS">
        {payOpen && (
          <form onSubmit={(e) => markPaid(payOpen, e)} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Data do pagamento</label>
              <Input type="date" value={payForm.payment_date} onChange={(e: any) => setPayForm({ payment_date: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1 mb-1"><Upload className="w-3 h-3" /> Comprovante</label>
              <input name="comprovante" type="file" accept=".pdf,image/*" className="text-xs text-zinc-300 w-full" />
            </div>
            <div className="flex justify-end gap-2">
              <Btn tone="ghost" type="button" onClick={() => setPayOpen(null)}>Cancelar</Btn>
              <Btn type="submit">Confirmar Pagamento</Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

/* ---------- DESPESAS ---------- */
const CATEGORIAS = ['Material', 'Aluguel', 'Serviços', 'Filamento', 'Energia', 'Marketing', 'Outros'];
const DespesasSub: React.FC<{ state: State; update: (fn: (s: State) => State) => void }> = ({ state, update }) => {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('');
  const [form, setForm] = useState<any>({ date: new Date().toISOString().slice(0, 10), category: 'Material', description: '', value: '' });

  const list = state.despesas.filter(d => cat === '' || d.category === cat);
  const total = list.reduce((s, d) => s + Number(d.value || 0), 0);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const fi = (e.target as HTMLFormElement).elements.namedItem('comp') as HTMLInputElement;
    let comprovante: string | undefined;
    if (fi?.files?.[0]) comprovante = await fileToDataUrl(fi.files[0]);
    const d: Despesa = { id: uid(), ...form, value: Number(form.value) || 0, comprovante };
    update(s => ({ ...s, despesas: [d, ...s.despesas] }));
    setOpen(false);
    setForm({ date: new Date().toISOString().slice(0, 10), category: 'Material', description: '', value: '' });
  };
  const remove = (id: string) => { if (confirm('Excluir despesa?')) update(s => ({ ...s, despesas: s.despesas.filter(x => x.id !== id) })); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={cat} onChange={(e: any) => setCat(e.target.value)} className="w-48">
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white">Total: <span className="font-bold text-[#b7ff00] tabular-nums">{brl(total)}</span></span>
          <Btn onClick={() => setOpen(true)}><Plus className="inline w-3 h-3 mr-1" /> Nova Despesa</Btn>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">Nenhuma despesa registrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-zinc-400">
              <tr>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Categoria</th>
                <th className="text-left p-3">Descrição</th>
                <th className="text-right p-3">Valor</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {list.map(d => (
                <tr key={d.id} className="border-t border-white/5">
                  <td className="p-3 text-zinc-300">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-white/5 text-[10px] uppercase tracking-wider text-zinc-300">{d.category}</span></td>
                  <td className="p-3 text-white">{d.description}</td>
                  <td className="p-3 text-right text-orange-300 font-bold tabular-nums">{brl(d.value)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {d.comprovante && <a href={d.comprovante} download className="p-1.5 text-zinc-400 hover:text-white"><Download className="w-3.5 h-3.5" /></a>}
                      <button onClick={() => remove(d.id)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Despesa">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.date} onChange={(e: any) => setForm({ ...form, date: e.target.value })} required />
            <Select value={form.category} onChange={(e: any) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <Input placeholder="Descrição" required value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} />
          <Input type="number" step="0.01" placeholder="Valor (R$)" required value={form.value} onChange={(e: any) => setForm({ ...form, value: e.target.value })} />
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1 mb-1"><Upload className="w-3 h-3" /> Comprovante</label>
            <input name="comp" type="file" accept=".pdf,image/*" className="text-xs text-zinc-300 w-full" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn tone="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn type="submit">Salvar</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* ---------- DASN ---------- */
const DasnSub: React.FC<{ state: State; update: (fn: (s: State) => State) => void }> = ({ state, update }) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear - 1);
  const [showReport, setShowReport] = useState(false);
  const totals = monthTotals(state, year);
  const total = totals.reduce((s, t) => s + t.total, 0);
  const over = total > ANNUAL_LIMIT;
  const pct = Math.min(100, (total / ANNUAL_LIMIT) * 100);
  const empresa = state.empresa;

  const setSem = (month: number, val: number) => {
    update(s => {
      const i = s.receitas.findIndex(r => r.year === year && r.month === month);
      if (i >= 0) s.receitas[i].total_sem_nota = val;
      else s.receitas.push({ year, month, total_sem_nota: val });
      return s;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={year} onChange={(e: any) => setYear(Number(e.target.value))} className="w-32">
          {[currentYear - 2, currentYear - 1, currentYear].map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <div className="flex gap-2 flex-wrap">
          <a
            href="https://www.gov.br/mei/pt-br/servicos/declaracao-anual"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10"
          >
            <ExternalLink className="w-3 h-3" /> Portal DASN-SIMEI
          </a>
          <Btn tone="gold" onClick={() => setShowReport(true)}>
            <Download className="inline w-3 h-3 mr-1" /> Exportar Resumo DASN
          </Btn>
        </div>
      </div>

      {/* Deadline banner */}
      <Card className="border-[#b7ff00]/30 bg-[#b7ff00]/[0.04]">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-[#b7ff00] mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white">Prazo da Declaração Anual (DASN-SIMEI)</h4>
            <p className="text-xs text-zinc-400 mt-1">
              A entrega vai de <strong className="text-zinc-200">1º de janeiro até 31 de maio</strong> do ano seguinte ao exercício declarado.
              Declare a receita bruta de <strong className="text-zinc-200">{year}</strong> até <strong className="text-zinc-200">31/05/{year + 1}</strong>.
            </p>
          </div>
        </div>
      </Card>

      {/* Over-limit warning */}
      {over && (
        <Card className="border-orange-500/40 bg-orange-500/[0.05]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-orange-300">Atenção: Faturamento excedeu o limite do MEI</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Total de {brl(total)} ultrapassa o limite anual de {brl(ANNUAL_LIMIT)}. Você pode precisar migrar para ME (Microempresa).
              </p>
              <a
                href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/posso-ser-mei"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-300 hover:underline mt-2"
              >
                Saiba mais sobre a migração <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Limit progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400">Uso do Limite Anual MEI</span>
          <span className="text-xs font-bold text-white tabular-nums">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full ${over ? 'bg-orange-400' : 'bg-[#b7ff00]'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1 tabular-nums">
          <span>{brl(total)}</span>
          <span>{brl(ANNUAL_LIMIT)}</span>
        </div>
      </Card>

      {/* Monthly table with inline edit */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-zinc-400">
            <tr>
              <th className="text-left p-3">Mês</th>
              <th className="text-right p-3">Notas Emitidas</th>
              <th className="text-right p-3">Vendas s/ Nota</th>
              <th className="text-right p-3">Receita Bruta</th>
            </tr>
          </thead>
          <tbody>
            {totals.map(t => (
              <tr key={t.month} className="border-t border-white/5">
                <td className="p-3 text-white">{MESES[t.month - 1]}</td>
                <td className="p-3 text-right text-zinc-300 tabular-nums">{brl(t.notas)}</td>
                <td className="p-3 text-right">
                  <input
                    type="number" step="0.01" defaultValue={t.sem || ''}
                    placeholder="0,00"
                    onBlur={(e) => setSem(t.month, Number(e.target.value) || 0)}
                    className="w-28 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-right text-white tabular-nums"
                  />
                </td>
                <td className={`p-3 text-right font-bold tabular-nums ${t.total > 0 ? 'text-[#b7ff00]' : 'text-zinc-600'}`}>{brl(t.total)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-white/20 bg-white/[0.03]">
              <td className="p-3 text-white font-bold uppercase tracking-widest text-xs" colSpan={3}>Total Anual</td>
              <td className={`p-3 text-right font-extrabold text-lg tabular-nums ${over ? 'text-orange-300' : 'text-[#b7ff00]'}`}>{brl(total)}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <p className="text-[10px] text-zinc-500">
        Meses sem registro aparecem como R$ 0,00 — preencha o valor diretamente na coluna "Vendas s/ Nota".
      </p>

      {showReport && (
        <DasnReportModal
          year={year}
          totals={totals}
          total={total}
          empresa={empresa}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

/* ---------- DASN Printable Report ---------- */
const DasnReportModal: React.FC<{
  year: number;
  totals: { month: number; notas: number; sem: number; total: number }[];
  total: number;
  empresa?: Empresa;
  onClose: () => void;
}> = ({ year, totals, total, empresa, onClose }) => {
  const print = () => window.print();
  const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:bg-white print:p-0 print:static" onClick={onClose}>
      <style>{`@media print { body * { visibility: hidden; } .dasn-print, .dasn-print * { visibility: visible; } .dasn-print { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
      <div
        className="dasn-print bg-zinc-950 print:bg-white border border-white/10 print:border-0 rounded-2xl print:rounded-none max-w-3xl w-full max-h-[90vh] overflow-auto p-8 print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h3 className="text-lg font-bold text-white">Resumo DASN-SIMEI {year}</h3>
          <div className="flex gap-2">
            <button onClick={print} className="text-xs px-3 py-1.5 rounded bg-[#b7ff00] text-black font-bold">Imprimir / Salvar PDF</button>
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-white/10 text-white border border-white/10">Fechar</button>
          </div>
        </div>

        <div className="space-y-5 text-sm text-zinc-200 print:text-black">
          <div className="text-center border-b border-white/10 print:border-zinc-300 pb-4">
            <h1 className="text-xl font-extrabold text-white print:text-black">DECLARAÇÃO ANUAL DO SIMPLES NACIONAL – MEI</h1>
            <p className="text-xs text-zinc-400 print:text-zinc-700 mt-1">Exercício {year} · DASN-SIMEI</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><strong>Razão Social:</strong> {empresa?.razao_social || '—'}</div>
            <div><strong>Nome Fantasia:</strong> {empresa?.nome_fantasia || '—'}</div>
            <div><strong>CNPJ:</strong> {empresa?.cnpj || '—'}</div>
            <div><strong>Atividade:</strong> {empresa?.atividade_principal || '—'}</div>
            <div className="col-span-2"><strong>Endereço:</strong> {empresa?.endereco || '—'} – {empresa?.cidade || ''}/{empresa?.uf || ''} {empresa?.cep ? `· CEP ${empresa.cep}` : ''}</div>
          </div>

          <table className="w-full text-sm border-t border-white/10 print:border-zinc-300">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-zinc-400 print:text-zinc-700">
                <th className="text-left py-2">Mês</th>
                <th className="text-right py-2">Notas Emitidas</th>
                <th className="text-right py-2">Sem Nota</th>
                <th className="text-right py-2">Receita Bruta</th>
              </tr>
            </thead>
            <tbody>
              {totals.map(t => (
                <tr key={t.month} className="border-t border-white/5 print:border-zinc-200">
                  <td className="py-1.5">{MESES_FULL[t.month - 1]}</td>
                  <td className="py-1.5 text-right tabular-nums">{brl(t.notas)}</td>
                  <td className="py-1.5 text-right tabular-nums">{brl(t.sem)}</td>
                  <td className="py-1.5 text-right tabular-nums font-bold">{brl(t.total)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-white/30 print:border-zinc-500 font-extrabold">
                <td className="py-2" colSpan={3}>TOTAL ANUAL</td>
                <td className="py-2 text-right tabular-nums text-[#b7ff00] print:text-black">{brl(total)}</td>
              </tr>
            </tbody>
          </table>

          <div className="text-xs leading-relaxed border-t border-white/10 print:border-zinc-300 pt-4">
            Declaro, sob as penas da lei, que as informações acima refletem a receita bruta apurada no exercício de <strong>{year}</strong>,
            no valor total de <strong>{brl(total)}</strong>, em conformidade com a Resolução CGSN nº 140/2018, para fins de entrega da Declaração Anual do Simples Nacional para o Microempreendedor Individual (DASN-SIMEI).
          </div>

          <div className="grid grid-cols-2 gap-8 pt-10 text-xs">
            <div className="text-center">
              <div className="border-t border-zinc-500 pt-1">Local e Data</div>
            </div>
            <div className="text-center">
              <div className="border-t border-zinc-500 pt-1">{empresa?.razao_social || 'Assinatura do Titular MEI'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- EMPRESA ---------- */
const maskCnpj = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};
const maskCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

const EmpresaSub: React.FC<{ state: State; update: (fn: (s: State) => State) => void }> = ({ state, update }) => {
  const [form, setForm] = useState<Empresa>(() => state.empresa ?? defaultEmpresa());
  const [saved, setSaved] = useState(false);
  const set = (k: keyof Empresa, v: string) => setForm(f => ({ ...f, [k]: v }));

  const cnpjDigits = form.cnpj.replace(/\D/g, '').length;
  const cnpjOk = cnpjDigits === 14;
  const emailOk = !form.email || /^\S+@\S+\.\S+$/.test(form.email);
  const canSave = cnpjOk && emailOk && form.razao_social.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    update(s => ({ ...s, empresa: { ...form, updated_at: new Date().toISOString() } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string; full?: boolean }> = ({ label, children, hint, full }) => (
    <label className={`block space-y-1 ${full ? 'md:col-span-2' : ''}`}>
      <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-red-400">{hint}</span>}
    </label>
  );

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#b7ff00]" />
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Dados da Empresa</h3>
          </div>
          {state.empresa?.updated_at && (
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              Atualizado {new Date(state.empresa.updated_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="CNPJ *" hint={form.cnpj && !cnpjOk ? 'CNPJ deve ter 14 dígitos' : undefined}>
            <Input value={form.cnpj} onChange={(e: any) => set('cnpj', maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Data de Abertura">
            <Input type="date" value={form.data_abertura} onChange={(e: any) => set('data_abertura', e.target.value)} />
          </Field>
          <Field label="Razão Social *">
            <Input value={form.razao_social} onChange={(e: any) => set('razao_social', e.target.value)} placeholder="Nome registrado" />
          </Field>
          <Field label="Nome Fantasia">
            <Input value={form.nome_fantasia} onChange={(e: any) => set('nome_fantasia', e.target.value)} placeholder="Nome comercial" />
          </Field>
          <Field label="Atividade Principal (CNAE/MEI)" full>
            <Input value={form.atividade_principal} onChange={(e: any) => set('atividade_principal', e.target.value)} placeholder="Ex: Serviços de impressão 3D" />
          </Field>
          <Field label="Endereço" full>
            <Input value={form.endereco} onChange={(e: any) => set('endereco', e.target.value)} placeholder="Rua, número, bairro" />
          </Field>
          <Field label="Cidade">
            <Input value={form.cidade} onChange={(e: any) => set('cidade', e.target.value)} />
          </Field>
          <Field label="UF">
            <Input value={form.uf} onChange={(e: any) => set('uf', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
          </Field>
          <Field label="CEP">
            <Input value={form.cep} onChange={(e: any) => set('cep', maskCep(e.target.value))} placeholder="00000-000" />
          </Field>
          <Field label="Telefone">
            <Input value={form.telefone} onChange={(e: any) => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="E-mail" hint={!emailOk ? 'E-mail inválido' : undefined} full>
            <Input type="email" value={form.email} onChange={(e: any) => set('email', e.target.value)} placeholder="contato@empresa.com" />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          {saved && (
            <span className="text-[11px] text-[#b7ff00] font-bold uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Salvo
            </span>
          )}
          <Btn tone="lime" disabled={!canSave} onClick={save} className={!canSave ? 'opacity-50 cursor-not-allowed' : ''}>
            Salvar Dados
          </Btn>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-[#D4A017]" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Links do Governo</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LINKS_GOVERNO.map((l, i) => {
            const Icon = l.icone;
            return (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#b7ff00]/40 hover:bg-white/[0.07] transition"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-[#D4A017]/15 border border-[#D4A017]/30 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#D4A017]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{l.descricao}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{l.url.replace(/^https?:\/\//, '')}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-[#b7ff00] transition" />
              </a>
            );
          })}
        </div>
      </Card>
    </div>
  );
};