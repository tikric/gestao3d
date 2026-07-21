import React, { useEffect, useMemo, useState } from 'react';
import { Printer } from '../types';
import { Wrench, Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle, X, Calendar, Package, FileText, Copy } from 'lucide-react';

type TipoManutencao = 'preventiva' | 'corretiva' | 'upgrade';
type StatusManutencao = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';

interface ChecklistItem { id: string; descricao: string; concluido: boolean; }
interface PecaItem { id: string; nome: string; quantidade: number; custoUnitario: number; fornecedor?: string; observacao?: string; }

export interface Manutencao {
  id: string;
  impressoraId: number;
  tipo: TipoManutencao;
  titulo: string;
  descricao: string;
  dataProgramada?: string; // YYYY-MM-DD
  dataRealizada?: string;  // ISO
  status: StatusManutencao;
  observacoes?: string;
  checklist: ChecklistItem[];
  pecas: PecaItem[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'bambuzau_manutencoes';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const tipoLabel: Record<TipoManutencao, string> = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
  upgrade: 'Upgrade',
};

const statusMeta: Record<StatusManutencao, { label: string; color: string; bg: string; border: string }> = {
  agendada:     { label: 'Agendada',     color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.35)' },
  em_andamento: { label: 'Em andamento', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.35)' },
  concluida:    { label: 'Concluída',    color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.35)' },
  cancelada:    { label: 'Cancelada',    color: '#9ca3af', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.30)' },
};

const tipoColor: Record<TipoManutencao, string> = {
  preventiva: '#60a5fa',
  corretiva: '#f87171',
  upgrade: '#c084fc',
};

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function loadAll(): Manutencao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveAll(list: Manutencao[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

const emptyForm = (impressoraId?: number): Manutencao => ({
  id: uid(),
  impressoraId: impressoraId ?? 0,
  tipo: 'preventiva',
  titulo: '',
  descricao: '',
  dataProgramada: '',
  dataRealizada: '',
  status: 'agendada',
  observacoes: '',
  checklist: [],
  pecas: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const todayStr = () => new Date().toISOString().slice(0, 10);

interface Props {
  printers: Printer[];
  onUpdatePrinter?: (p: Printer) => void;
}

export const ManutencaoTab: React.FC<Props> = ({ printers, onUpdatePrinter }) => {
  const [items, setItems] = useState<Manutencao[]>(() => loadAll());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Manutencao | null>(null);
  const [detail, setDetail] = useState<Manutencao | null>(null);
  const [filterPrinter, setFilterPrinter] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StatusManutencao | 'all'>('all');
  const [filterTipo, setFilterTipo] = useState<TipoManutencao | 'all'>('all');

  useEffect(() => { saveAll(items); }, [items]);

  const printerName = (id: number) => printers.find(p => p.id === id)?.name || '—';

  const filtered = useMemo(() => {
    return items
      .filter(m => filterPrinter === 'all' || m.impressoraId === filterPrinter)
      .filter(m => filterStatus === 'all' || m.status === filterStatus)
      .filter(m => filterTipo === 'all' || m.tipo === filterTipo)
      .sort((a, b) => (b.dataProgramada || b.createdAt).localeCompare(a.dataProgramada || a.createdAt));
  }, [items, filterPrinter, filterStatus, filterTipo]);

  const kpis = useMemo(() => {
    const today = todayStr();
    const agendadas = items.filter(m => m.status === 'agendada').length;
    const emAndamento = items.filter(m => m.status === 'em_andamento').length;
    const concluidas = items.filter(m => m.status === 'concluida').length;
    const atrasadas = items.filter(m => m.status !== 'concluida' && m.status !== 'cancelada' && m.dataProgramada && m.dataProgramada < today).length;
    const custoTotal = items
      .filter(m => m.status === 'concluida')
      .reduce((s, m) => s + m.pecas.reduce((ss, p) => ss + (Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0), 0), 0);
    return { agendadas, emAndamento, concluidas, atrasadas, custoTotal };
  }, [items]);

  const openNew = () => { setEditing(emptyForm(printers[0]?.id)); setShowForm(true); };
  const openEdit = (m: Manutencao) => { setEditing({ ...m }); setShowForm(true); };
  const duplicate = (m: Manutencao) => {
    const copy: Manutencao = {
      ...m,
      id: uid(),
      status: 'agendada',
      dataRealizada: '',
      dataProgramada: '',
      checklist: m.checklist.map(c => ({ ...c, id: uid(), concluido: false })),
      pecas: m.pecas.map(p => ({ ...p, id: uid() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditing(copy); setShowForm(true); setDetail(null);
  };

  const save = (m: Manutencao) => {
    const next: Manutencao = {
      ...m,
      updatedAt: new Date().toISOString(),
      status: m.dataRealizada ? 'concluida' : m.status,
    };
    setItems(prev => {
      const exists = prev.some(x => x.id === next.id);
      return exists ? prev.map(x => (x.id === next.id ? next : x)) : [next, ...prev];
    });
    setShowForm(false); setEditing(null);
  };

  const remove = (id: string) => {
    if (!window.confirm('Excluir esta manutenção? Esta ação não pode ser desfeita.')) return;
    setItems(prev => prev.filter(x => x.id !== id));
    setDetail(null);
  };

  const changeStatus = (m: Manutencao, status: StatusManutencao) => {
    const next: Manutencao = {
      ...m,
      status,
      dataRealizada: status === 'concluida' ? new Date().toISOString() : (status === 'agendada' ? '' : m.dataRealizada),
      updatedAt: new Date().toISOString(),
    };
    setItems(prev => prev.map(x => (x.id === m.id ? next : x)));
    setDetail(next);
    // sincroniza com a impressora
    if (onUpdatePrinter) {
      const p = printers.find(pp => pp.id === m.impressoraId);
      if (p) {
        if (status === 'em_andamento' && p.status !== 'MAINTENANCE') {
          onUpdatePrinter({ ...p, status: 'MAINTENANCE' });
        } else if (status === 'concluida' && p.status === 'MAINTENANCE') {
          onUpdatePrinter({ ...p, status: 'IDLE', lastWeeklyMaintenance: Date.now() });
        }
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#b7ff00]/80">
            <Wrench className="w-3.5 h-3.5" /> Manutenção de Impressoras
          </div>
          <h2 className="text-2xl font-light text-white mt-1">Gestão de manutenções preventivas e corretivas</h2>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b7ff00] text-black text-sm font-semibold hover:bg-[#a3e600] transition"
        >
          <Plus className="w-4 h-4" /> Nova Manutenção
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Agendadas', value: kpis.agendadas, color: '#60a5fa', icon: Calendar },
          { label: 'Em andamento', value: kpis.emAndamento, color: '#fbbf24', icon: Clock },
          { label: 'Concluídas', value: kpis.concluidas, color: '#34d399', icon: CheckCircle2 },
          { label: 'Atrasadas', value: kpis.atrasadas, color: '#f87171', icon: AlertTriangle },
          { label: 'Custo total (concl.)', value: fmt(kpis.custoTotal), color: '#c084fc', icon: Package },
        ].map((k, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl p-4 bg-white/[0.03] border border-white/10">
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ background: k.color }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">{k.label}</span>
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <div className="mt-2 text-xl font-light text-white tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center bg-white/[0.02] border border-white/10 rounded-2xl p-3">
        <select
          value={filterPrinter === 'all' ? 'all' : String(filterPrinter)}
          onChange={(e) => setFilterPrinter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5"
        >
          <option value="all">Todas as impressoras</option>
          {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5"
        >
          <option value="all">Todos os status</option>
          <option value="agendada">Agendada</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value as any)}
          className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5"
        >
          <option value="all">Todos os tipos</option>
          <option value="preventiva">Preventiva</option>
          <option value="corretiva">Corretiva</option>
          <option value="upgrade">Upgrade</option>
        </select>
        <span className="text-xs text-white/40 ml-auto">{filtered.length} registro(s)</span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <Wrench className="w-8 h-8 mx-auto text-white/30" />
          <p className="mt-3 text-white/60 text-sm">Nenhuma manutenção registrada. Comece agendando uma preventiva!</p>
          <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#b7ff00] text-black text-sm font-semibold">
            <Plus className="w-4 h-4" /> Criar primeira
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-white/50 text-[10px] uppercase tracking-[0.18em]">
              <tr>
                <th className="px-4 py-3 text-left">Impressora</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Programada</th>
                <th className="px-4 py-3 text-left">Realizada</th>
                <th className="px-4 py-3 text-right">Custo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const total = m.pecas.reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0), 0);
                const st = statusMeta[m.status];
                const overdue = m.status !== 'concluida' && m.status !== 'cancelada' && m.dataProgramada && m.dataProgramada < todayStr();
                return (
                  <tr
                    key={m.id}
                    onClick={() => setDetail(m)}
                    className="border-t border-white/5 hover:bg-white/[0.04] cursor-pointer transition"
                  >
                    <td className="px-4 py-3 text-white/90">{printerName(m.impressoraId)}</td>
                    <td className="px-4 py-3 text-white font-medium">{m.titulo || <span className="text-white/40 italic">sem título</span>}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold" style={{ color: tipoColor[m.tipo] }}>{tipoLabel[m.tipo]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-md border"
                        style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {m.dataProgramada ? (
                        <span className={overdue ? 'text-red-400 font-semibold' : ''}>
                          {new Date(m.dataProgramada + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {overdue && ' • atrasada'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {m.dataRealizada ? new Date(m.dataRealizada).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-white/90 tabular-nums">{fmt(total)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(m.id); }}
                        className="p-1.5 rounded-md text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && editing && (
        <MaintenanceForm
          initial={editing}
          printers={printers}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={save}
        />
      )}

      {/* Detail modal */}
      {detail && (
        <DetailModal
          item={detail}
          printerName={printerName(detail.impressoraId)}
          onClose={() => setDetail(null)}
          onEdit={() => { openEdit(detail); setDetail(null); }}
          onDuplicate={() => duplicate(detail)}
          onDelete={() => remove(detail.id)}
          onStatus={(s) => changeStatus(detail, s)}
        />
      )}
    </div>
  );
};

// ---------- Form ----------
const MaintenanceForm: React.FC<{
  initial: Manutencao;
  printers: Printer[];
  onCancel: () => void;
  onSave: (m: Manutencao) => void;
}> = ({ initial, printers, onCancel, onSave }) => {
  const [m, setM] = useState<Manutencao>(initial);
  const set = <K extends keyof Manutencao>(k: K, v: Manutencao[K]) => setM(prev => ({ ...prev, [k]: v }));

  const total = m.pecas.reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0b0d0a] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#b7ff00]" />
            <h3 className="text-lg font-light text-white">Manutenção</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-white/10 text-white/60"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Impressora *">
            <select
              value={m.impressoraId}
              onChange={(e) => set('impressoraId', Number(e.target.value))}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value={0} disabled>Selecione…</option>
              {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Tipo *">
            <select
              value={m.tipo}
              onChange={(e) => set('tipo', e.target.value as TipoManutencao)}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
              <option value="upgrade">Upgrade</option>
            </select>
          </Field>
          <Field label="Título *">
            <input
              value={m.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              placeholder="Ex: Troca de bico 0.4mm"
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            />
          </Field>
          <Field label="Status">
            <select
              value={m.status}
              onChange={(e) => set('status', e.target.value as StatusManutencao)}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </Field>
          <Field label="Data programada">
            <input
              type="date"
              value={m.dataProgramada || ''}
              onChange={(e) => set('dataProgramada', e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            />
          </Field>
          <Field label="Data realizada">
            <input
              type="date"
              value={m.dataRealizada ? m.dataRealizada.slice(0, 10) : ''}
              onChange={(e) => set('dataRealizada', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
            />
          </Field>
        </div>

        <Field label="Descrição / procedimento" className="mt-4">
          <textarea
            value={m.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            rows={4}
            placeholder="Passo a passo, observações técnicas…"
            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
          />
        </Field>

        {/* Checklist */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/50">Checklist</span>
            <button
              onClick={() => set('checklist', [...m.checklist, { id: uid(), descricao: '', concluido: false }])}
              className="text-xs flex items-center gap-1 text-[#b7ff00] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar item
            </button>
          </div>
          <div className="space-y-1.5">
            {m.checklist.length === 0 && <p className="text-xs text-white/40 italic">Sem itens.</p>}
            {m.checklist.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={c.concluido}
                  onChange={(e) => {
                    const next = [...m.checklist];
                    next[i] = { ...c, concluido: e.target.checked };
                    set('checklist', next);
                  }}
                  className="accent-[#b7ff00]"
                />
                <input
                  value={c.descricao}
                  onChange={(e) => {
                    const next = [...m.checklist];
                    next[i] = { ...c, descricao: e.target.value };
                    set('checklist', next);
                  }}
                  placeholder="Ex: Verificar tensão das correias"
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                />
                <button
                  onClick={() => set('checklist', m.checklist.filter(x => x.id !== c.id))}
                  className="p-1 text-white/40 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Peças */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/50">Peças utilizadas</span>
            <button
              onClick={() => set('pecas', [...m.pecas, { id: uid(), nome: '', quantidade: 1, custoUnitario: 0 }])}
              className="text-xs flex items-center gap-1 text-[#b7ff00] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar peça
            </button>
          </div>
          {m.pecas.length === 0 ? (
            <p className="text-xs text-white/40 italic">Sem peças cadastradas.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.04] text-white/50">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Nome</th>
                    <th className="px-2 py-1.5 text-right w-20">Qtd</th>
                    <th className="px-2 py-1.5 text-right w-28">Custo unit.</th>
                    <th className="px-2 py-1.5 text-left">Fornecedor</th>
                    <th className="px-2 py-1.5 text-right w-24">Subtotal</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {m.pecas.map((p, i) => (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-2 py-1">
                        <input
                          value={p.nome}
                          onChange={(e) => { const n = [...m.pecas]; n[i] = { ...p, nome: e.target.value }; set('pecas', n); }}
                          placeholder="Ex: Bico 0.4mm"
                          className="w-full bg-transparent text-white text-sm outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number" step="0.01" value={p.quantidade}
                          onChange={(e) => { const n = [...m.pecas]; n[i] = { ...p, quantidade: Number(e.target.value) }; set('pecas', n); }}
                          className="w-full bg-black/30 border border-white/10 rounded px-1.5 py-1 text-white text-sm text-right"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number" step="0.01" value={p.custoUnitario}
                          onChange={(e) => { const n = [...m.pecas]; n[i] = { ...p, custoUnitario: Number(e.target.value) }; set('pecas', n); }}
                          className="w-full bg-black/30 border border-white/10 rounded px-1.5 py-1 text-white text-sm text-right"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={p.fornecedor || ''}
                          onChange={(e) => { const n = [...m.pecas]; n[i] = { ...p, fornecedor: e.target.value }; set('pecas', n); }}
                          placeholder="—"
                          className="w-full bg-transparent text-white text-sm outline-none"
                        />
                      </td>
                      <td className="px-2 py-1 text-right text-white tabular-nums">
                        {fmt((Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0))}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button onClick={() => set('pecas', m.pecas.filter(x => x.id !== p.id))} className="text-white/40 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/10 bg-white/[0.03]">
                    <td colSpan={4} className="px-2 py-1.5 text-right text-white/60 uppercase tracking-wider text-[10px]">Custo total</td>
                    <td className="px-2 py-1.5 text-right text-white font-semibold tabular-nums">{fmt(total)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Field label="Observações" className="mt-4">
          <textarea
            value={m.observacoes || ''}
            onChange={(e) => set('observacoes', e.target.value)}
            rows={2}
            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
          />
        </Field>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5">Cancelar</button>
          <button
            onClick={() => {
              if (!m.impressoraId) { alert('Selecione uma impressora.'); return; }
              if (!m.titulo.trim()) { alert('Informe o título.'); return; }
              onSave(m);
            }}
            className="px-4 py-2 rounded-lg bg-[#b7ff00] text-black text-sm font-semibold hover:bg-[#a3e600]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="block text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1">{label}</span>
    {children}
  </label>
);

// ---------- Detail ----------
const DetailModal: React.FC<{
  item: Manutencao;
  printerName: string;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStatus: (s: StatusManutencao) => void;
}> = ({ item, printerName, onClose, onEdit, onDuplicate, onDelete, onStatus }) => {
  const total = item.pecas.reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0), 0);
  const st = statusMeta[item.status];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0b0d0a] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Wrench className="w-3.5 h-3.5" /> {printerName} · {tipoLabel[item.tipo]}
            </div>
            <h3 className="text-xl font-light text-white mt-1">{item.titulo}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10 text-white/60"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold px-2 py-1 rounded-md border"
            style={{ color: st.color, background: st.bg, borderColor: st.border }}>
            {st.label}
          </span>
          {item.dataProgramada && (
            <span className="text-xs text-white/60">Programada: {new Date(item.dataProgramada + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
          )}
          {item.dataRealizada && (
            <span className="text-xs text-white/60">Realizada: {new Date(item.dataRealizada).toLocaleDateString('pt-BR')}</span>
          )}
        </div>

        {item.descricao && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Descrição</div>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{item.descricao}</p>
          </div>
        )}

        {item.checklist.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mb-2">Checklist</div>
            <div className="space-y-1">
              {item.checklist.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  {c.concluido
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <Circle className="w-4 h-4 text-white/30" />}
                  <span className={c.concluido ? 'text-white/60 line-through' : 'text-white/90'}>{c.descricao}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.pecas.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mb-2">Peças ({fmt(total)})</div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.04] text-white/50">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Nome</th>
                    <th className="px-2 py-1.5 text-right">Qtd</th>
                    <th className="px-2 py-1.5 text-right">Custo unit.</th>
                    <th className="px-2 py-1.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {item.pecas.map(p => (
                    <tr key={p.id} className="border-t border-white/5 text-white/90">
                      <td className="px-2 py-1.5">{p.nome}{p.fornecedor && <span className="text-white/40 ml-1">· {p.fornecedor}</span>}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{p.quantidade}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt(p.custoUnitario)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt((Number(p.quantidade) || 0) * (Number(p.custoUnitario) || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {item.observacoes && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1">Observações</div>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{item.observacoes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
          {item.status === 'agendada' && (
            <button onClick={() => onStatus('em_andamento')} className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25">
              <Clock className="w-3.5 h-3.5 inline mr-1" /> Iniciar
            </button>
          )}
          {item.status !== 'concluida' && item.status !== 'cancelada' && (
            <button onClick={() => onStatus('concluida')} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Concluir
            </button>
          )}
          <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10">Editar</button>
          <button onClick={onDuplicate} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10">
            <Copy className="w-3.5 h-3.5 inline mr-1" /> Duplicar
          </button>
          <button onClick={onDelete} className="ml-auto px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/20">
            <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManutencaoTab;