// @ts-nocheck
import React, { useMemo, useRef, useState } from 'react';
import {
  FileEdit, Plus, Send, Check, X as XIcon, Printer as PrinterIcon,
  Trash2, Paperclip, Eye, RefreshCw,
} from 'lucide-react';
import type { Client, PrintOrder } from '../types';

type Status = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'convertido';

interface Anexo { name: string; type: string; dataUrl: string; }

export interface Orcamento {
  id: string;
  clienteId: number | null;
  nomeClienteTemp: string;
  contatoTemp?: string;
  descricao: string;
  valor: number;
  status: Status;
  dataValidade: string; // YYYY-MM-DD
  anexos: Anexo[];
  observacoes: string;
  createdAt: number;
  updatedAt: number;
  convertedOrderId?: number;
}

const STORAGE_KEY = 'bambuzau_orcamentos';

const loadAll = (): Orcamento[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveAll = (list: Orcamento[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  rascunho:   { label: 'Rascunho',   color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  enviado:    { label: 'Enviado',    color: '#3b82f6', bg: 'rgba(59,130,246,0.14)' },
  aprovado:   { label: 'Aprovado',   color: '#22c55e', bg: 'rgba(34,197,94,0.14)' },
  recusado:   { label: 'Recusado',   color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
  convertido: { label: 'Convertido', color: '#b7ff00', bg: 'rgba(183,255,0,0.14)' },
};

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (s: string) => {
  if (!s) return '—';
  try {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  } catch { return s; }
};

const shortId = (id: string) => id.slice(-6).toUpperCase();

interface Props {
  clients: Client[];
  orders: PrintOrder[];
  setOrders: React.Dispatch<React.SetStateAction<PrintOrder[]>>;
}

export function OrcamentosTab({ clients, orders, setOrders }: Props) {
  const [list, setList] = useState<Orcamento[]>(() => loadAll());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Orcamento | null>(null);
  const [previewing, setPreviewing] = useState<Orcamento | null>(null);
  const [converting, setConverting] = useState<Orcamento | null>(null);

  const persist = (next: Orcamento[]) => { setList(next); saveAll(next); };

  const stats = useMemo(() => {
    const total = list.length;
    const pendentes = list.filter(o => o.status === 'enviado' || o.status === 'rascunho').length;
    const aprovados = list.filter(o => o.status === 'aprovado').length;
    const valorAberto = list
      .filter(o => o.status !== 'recusado' && o.status !== 'convertido')
      .reduce((s, o) => s + (Number(o.valor) || 0), 0);
    return { total, pendentes, aprovados, valorAberto };
  }, [list]);

  const onSave = (o: Orcamento) => {
    const exists = list.some(x => x.id === o.id);
    const next = exists
      ? list.map(x => (x.id === o.id ? { ...o, updatedAt: Date.now() } : x))
      : [{ ...o, createdAt: Date.now(), updatedAt: Date.now() }, ...list];
    persist(next);
    setShowForm(false); setEditing(null);
  };

  const setStatus = (id: string, status: Status) => {
    persist(list.map(o => (o.id === id ? { ...o, status, updatedAt: Date.now() } : o)));
  };

  const remove = (id: string) => {
    if (!confirm('Excluir este orçamento?')) return;
    persist(list.filter(o => o.id !== id));
  };

  const convertToSale = (o: Orcamento, payment: 'PAGO' | 'PENDENTE') => {
    const newId = Math.max(0, ...orders.map(x => x.id || 0)) + 1;
    const clientName = o.clienteId
      ? (clients.find(c => c.id === o.clienteId)?.name || o.nomeClienteTemp || 'Cliente')
      : (o.nomeClienteTemp || 'Cliente');
    const newOrder: PrintOrder = {
      id: newId,
      clientId: o.clienteId ?? null,
      clientName,
      itemName: o.descricao.slice(0, 80) || `Orçamento ${shortId(o.id)}`,
      quantity: 1,
      filamentType: 'PLA',
      filamentColor: '—',
      weightGrams: 0,
      printTimeHours: 0,
      priceCharged: Number(o.valor) || 0,
      platformSource: 'MANUAL',
      status: 'WAITING',
      printingProgress: 0,
      assignedPrinterId: null,
      createdAt: Date.now(),
      deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
      paymentMethod: 'OUTROS',
      paymentStatus: payment,
      imageUrl: o.anexos.find(a => a.type.startsWith('image/'))?.dataUrl,
    };
    setOrders(prev => [newOrder, ...prev]);
    persist(list.map(x => x.id === o.id
      ? { ...x, status: 'convertido', convertedOrderId: newId, updatedAt: Date.now() }
      : x));
    setConverting(null);
  };

  const printQuote = (o: Orcamento) => {
    const cliente = o.clienteId
      ? clients.find(c => c.id === o.clienteId)?.name
      : o.nomeClienteTemp;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Orçamento ${shortId(o.id)}</title>
      <style>
        *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        body{margin:0;padding:48px;color:#111;background:#fff}
        h1{margin:0 0 8px;font-size:28px}
        .muted{color:#666;font-size:13px}
        hr{border:0;border-top:1px solid #eee;margin:24px 0}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0}
        .box{border:1px solid #eee;border-radius:8px;padding:16px}
        .total{font-size:32px;font-weight:800;color:#111;text-align:right}
        .desc{white-space:pre-wrap;line-height:1.6}
        img{max-width:160px;max-height:160px;border-radius:6px;border:1px solid #eee;margin:4px}
      </style></head><body>
      <h1>Orçamento ${shortId(o.id)}</h1>
      <div class="muted">Emitido em ${new Date().toLocaleDateString('pt-BR')} · Validade ${fmtDate(o.dataValidade)}</div>
      <div class="grid">
        <div class="box"><div class="muted">Cliente</div><div style="font-size:18px;font-weight:700">${cliente || '—'}</div>${o.contatoTemp ? `<div class="muted">${o.contatoTemp}</div>` : ''}</div>
        <div class="box"><div class="muted">Status</div><div style="font-size:18px;font-weight:700">${STATUS_META[o.status].label}</div></div>
      </div>
      <div class="box"><div class="muted">Descrição</div><div class="desc">${(o.descricao || '').replace(/</g,'&lt;')}</div></div>
      ${o.observacoes ? `<div class="box" style="margin-top:16px"><div class="muted">Observações</div><div class="desc">${o.observacoes.replace(/</g,'&lt;')}</div></div>` : ''}
      ${o.anexos.filter(a=>a.type.startsWith('image/')).length ? `<div style="margin-top:16px">${o.anexos.filter(a=>a.type.startsWith('image/')).map(a=>`<img src="${a.dataUrl}" />`).join('')}</div>` : ''}
      <hr/><div class="total">${fmtBRL(Number(o.valor)||0)}</div>
      <script>window.onload=()=>window.print()</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">
            <FileEdit className="h-3.5 w-3.5" /> Orçamentos
          </div>
          <h1 className="text-3xl font-bold text-white mt-1">Orçamentos personalizados</h1>
          <p className="text-white/50 text-sm mt-1">Gere, envie e converta orçamentos em vendas — separado do fluxo de pedidos comuns.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#b7ff00] text-black hover:brightness-110 shadow-[0_8px_24px_-8px_rgba(183,255,0,0.5)]"
        >
          <Plus className="h-4 w-4" /> Novo Orçamento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total" value={String(stats.total)} accent="#94a3b8" />
        <Kpi label="Pendentes" value={String(stats.pendentes)} accent="#3b82f6" />
        <Kpi label="Aprovados" value={String(stats.aprovados)} accent="#22c55e" />
        <Kpi label="Valor em aberto" value={fmtBRL(stats.valorAberto)} accent="#b7ff00" />
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.15em] text-white/40 border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 font-semibold">ID</th>
                <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold">Descrição</th>
                <th className="text-right px-4 py-3 font-semibold">Valor</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Validade</th>
                <th className="text-right px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-white/40 text-sm">
                    Nenhum orçamento ainda. Clique em <span className="text-white/70">Novo Orçamento</span>.
                  </td>
                </tr>
              )}
              {list.map(o => {
                const cliente = o.clienteId
                  ? clients.find(c => c.id === o.clienteId)?.name
                  : o.nomeClienteTemp;
                const meta = STATUS_META[o.status];
                return (
                  <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">#{shortId(o.id)}</td>
                    <td className="px-4 py-3 text-white">{cliente || '—'}</td>
                    <td className="px-4 py-3 text-white/80 max-w-[320px] truncate">{o.descricao}</td>
                    <td className="px-4 py-3 text-right text-white font-semibold">{fmtBRL(Number(o.valor)||0)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: meta.color, background: meta.bg }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">{fmtDate(o.dataValidade)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Visualizar" onClick={() => setPreviewing(o)}><Eye className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn title="Imprimir" onClick={() => printQuote(o)}><PrinterIcon className="h-3.5 w-3.5" /></IconBtn>
                        {o.status === 'rascunho' && (
                          <IconBtn title="Enviar" onClick={() => setStatus(o.id, 'enviado')} color="#3b82f6"><Send className="h-3.5 w-3.5" /></IconBtn>
                        )}
                        {(o.status === 'enviado' || o.status === 'rascunho') && (
                          <>
                            <IconBtn title="Aprovar" onClick={() => setConverting(o)} color="#22c55e"><Check className="h-3.5 w-3.5" /></IconBtn>
                            <IconBtn title="Recusar" onClick={() => setStatus(o.id, 'recusado')} color="#ef4444"><XIcon className="h-3.5 w-3.5" /></IconBtn>
                          </>
                        )}
                        {o.status === 'recusado' && (
                          <IconBtn title="Reabrir" onClick={() => setStatus(o.id, 'enviado')}><RefreshCw className="h-3.5 w-3.5" /></IconBtn>
                        )}
                        <IconBtn title="Editar" onClick={() => { setEditing(o); setShowForm(true); }}><FileEdit className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn title="Excluir" onClick={() => remove(o.id)} color="#ef4444"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <OrcamentoForm
          clients={clients}
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={onSave}
        />
      )}
      {previewing && (
        <PreviewModal
          orc={previewing}
          clients={clients}
          onClose={() => setPreviewing(null)}
          onPrint={() => printQuote(previewing)}
        />
      )}
      {converting && (
        <ConvertModal
          orc={converting}
          clients={clients}
          onClose={() => setConverting(null)}
          onConvert={(pay) => convertToSale(converting, pay)}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-4 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: accent }} />
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">{label}</div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
    </div>
  );
}

function IconBtn({ children, onClick, title, color }: any) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white transition"
      style={color ? { color } : undefined}
    >
      {children}
    </button>
  );
}

// ---------------- FORM ----------------
function OrcamentoForm({ clients, initial, onClose, onSave }: any) {
  const [clienteId, setClienteId] = useState<number | null>(initial?.clienteId ?? null);
  const [nomeTemp, setNomeTemp] = useState(initial?.nomeClienteTemp || '');
  const [contatoTemp, setContatoTemp] = useState(initial?.contatoTemp || '');
  const [descricao, setDescricao] = useState(initial?.descricao || '');
  const [valor, setValor] = useState<number>(initial?.valor || 0);
  const [status, setStatus] = useState<Status>(initial?.status || 'rascunho');
  const [dataValidade, setDataValidade] = useState(
    initial?.dataValidade ||
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [anexos, setAnexos] = useState<Anexo[]>(initial?.anexos || []);
  const [observacoes, setObservacoes] = useState(initial?.observacoes || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => {
      const reader = new FileReader();
      reader.onload = () => {
        setAnexos(prev => [...prev, { name: f.name, type: f.type || 'application/octet-stream', dataUrl: String(reader.result) }]);
      };
      reader.readAsDataURL(f);
    });
  };

  const removeAnexo = (i: number) => setAnexos(prev => prev.filter((_, idx) => idx !== i));

  const submit = () => {
    if (!clienteId && !nomeTemp.trim()) { alert('Selecione um cliente ou informe um nome.'); return; }
    if (!descricao.trim()) { alert('Descreva o item do orçamento.'); return; }
    onSave({
      id: initial?.id || `orc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clienteId,
      nomeClienteTemp: clienteId ? '' : nomeTemp.trim(),
      contatoTemp: clienteId ? '' : contatoTemp.trim(),
      descricao: descricao.trim(),
      valor: Number(valor) || 0,
      status,
      dataValidade,
      anexos,
      observacoes: observacoes.trim(),
      createdAt: initial?.createdAt || Date.now(),
      updatedAt: Date.now(),
      convertedOrderId: initial?.convertedOrderId,
    } as Orcamento);
  };

  return (
    <ModalShell onClose={onClose} title={initial ? 'Editar orçamento' : 'Novo orçamento'}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Cliente cadastrado">
            <select
              value={clienteId ?? ''}
              onChange={e => setClienteId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm"
            >
              <option value="">— Cliente novo / avulso —</option>
              {clients.map((c: Client) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Validade">
            <input type="date" value={dataValidade} onChange={e => setDataValidade(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm" />
          </Field>
        </div>
        {!clienteId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nome do cliente (avulso)">
              <input value={nomeTemp} onChange={e => setNomeTemp(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm" />
            </Field>
            <Field label="Contato (telefone/email)">
              <input value={contatoTemp} onChange={e => setContatoTemp(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm" />
            </Field>
          </div>
        )}
        <Field label="Descrição da peça personalizada">
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <input type="number" step="0.01" value={valor}
              onChange={e => setValor(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm" />
          </Field>
          <Field label="Status">
            <select value={status} onChange={e => setStatus(e.target.value as Status)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm">
              {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Anexos (imagens, STL)">
          <div>
            <input ref={fileRef} type="file" multiple hidden
              accept="image/*,.stl,.3mf,.obj,.gcode,.pdf"
              onChange={e => handleFiles(e.target.files)} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/80 text-xs hover:bg-white/[0.06]">
              <Paperclip className="h-3.5 w-3.5" /> Adicionar arquivos
            </button>
            {anexos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {anexos.map((a, i) => (
                  <div key={i} className="relative rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden group">
                    {a.type.startsWith('image/') ? (
                      <img src={a.dataUrl} alt={a.name} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="h-20 flex items-center justify-center text-[10px] text-white/60 px-2 text-center">{a.name}</div>
                    )}
                    <button onClick={() => removeAnexo(i)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white/80 inline-flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>
        <Field label="Observações">
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm" />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/80 text-sm hover:bg-white/[0.06]">Cancelar</button>
        <button onClick={submit} className="px-4 py-2 rounded-lg bg-[#b7ff00] text-black font-bold text-sm hover:brightness-110">Salvar</button>
      </div>
    </ModalShell>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function ModalShell({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0a0d0c] shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="text-lg font-bold text-white">{title}</div>
          <button onClick={onClose} className="h-8 w-8 rounded-md inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06]">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function PreviewModal({ orc, clients, onClose, onPrint }: any) {
  const cliente = orc.clienteId
    ? clients.find((c: Client) => c.id === orc.clienteId)?.name
    : orc.nomeClienteTemp;
  const meta = STATUS_META[orc.status as Status];
  return (
    <ModalShell title={`Orçamento #${shortId(orc.id)}`} onClose={onClose}>
      <div className="space-y-4 text-sm text-white/80">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">Cliente</div>
            <div className="text-white text-base font-semibold">{cliente || '—'}</div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
            style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-1">Descrição</div>
          <div className="whitespace-pre-wrap text-white/85">{orc.descricao}</div>
        </div>
        {orc.observacoes && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-1">Observações</div>
            <div className="whitespace-pre-wrap text-white/70">{orc.observacoes}</div>
          </div>
        )}
        {orc.anexos?.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-2">Anexos</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {orc.anexos.map((a: Anexo, i: number) => (
                <a key={i} href={a.dataUrl} download={a.name}
                  className="block rounded-lg border border-white/[0.08] overflow-hidden hover:border-white/[0.2]">
                  {a.type.startsWith('image/')
                    ? <img src={a.dataUrl} className="w-full h-24 object-cover" />
                    : <div className="h-24 flex items-center justify-center text-[10px] text-white/60 px-2 text-center">{a.name}</div>}
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
          <div className="text-xs text-white/50">Validade: {fmtDate(orc.dataValidade)}</div>
          <div className="text-2xl font-bold text-[#b7ff00]">{fmtBRL(Number(orc.valor)||0)}</div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/80 text-sm">Fechar</button>
        <button onClick={onPrint} className="px-4 py-2 rounded-lg bg-[#b7ff00] text-black font-bold text-sm">
          <PrinterIcon className="h-4 w-4 inline mr-1" /> Imprimir / PDF
        </button>
      </div>
    </ModalShell>
  );
}

function ConvertModal({ orc, clients, onClose, onConvert }: any) {
  const cliente = orc.clienteId
    ? clients.find((c: Client) => c.id === orc.clienteId)?.name
    : orc.nomeClienteTemp;
  const [pay, setPay] = useState<'PAGO' | 'PENDENTE'>('PENDENTE');
  return (
    <ModalShell title="Aprovar e converter em pedido" onClose={onClose}>
      <div className="space-y-4 text-sm text-white/80">
        <p>Será criado um novo pedido em Produção para <span className="text-white font-semibold">{cliente || '—'}</span> no valor de <span className="text-[#b7ff00] font-bold">{fmtBRL(Number(orc.valor)||0)}</span>.</p>
        <Field label="Pagamento">
          <select value={pay} onChange={e => setPay(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm">
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Já pago</option>
          </select>
        </Field>
        <p className="text-xs text-white/50">O orçamento será marcado como <strong className="text-white/80">Convertido</strong> e ficará vinculado ao pedido criado.</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white/80 text-sm">Cancelar</button>
        <button onClick={() => onConvert(pay)} className="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-bold text-sm">
          <Check className="h-4 w-4 inline mr-1" /> Confirmar conversão
        </button>
      </div>
    </ModalShell>
  );
}

export default OrcamentosTab;