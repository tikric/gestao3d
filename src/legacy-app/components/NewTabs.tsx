// @ts-nocheck
import { useState } from 'react';
import {
  Search, Box, Megaphone, Columns3, FileBox, ClipboardCheck,
  Calendar, Globe, Wrench, Plus, ExternalLink, Check, Trash2, ShoppingBag, Star, TrendingDown, Loader2,
  Sparkles, Flame, Headphones, Smartphone, Briefcase, Package
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { safeStorage } from '../utils/storage';
import { dedupeOffers } from '../utils/offerDedupe';

const panel = "rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-4";
const sectionTitle = "text-[13px] font-bold text-[var(--cat-lime,#A5D84B)] uppercase tracking-wider mb-3";
const inputCls = "w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--cat-lime,#A5D84B)]";
const btnPrimary = "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--cat-lime,#A5D84B)] text-black text-[11px] font-bold hover:brightness-110";
const chip = "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold";

const isBlockedGoogleUrl = (value?: string) => {
  if (!value || !value.trim()) return true;
  try {
    new URL(value);
    return false;
  } catch {
    return true;
  }
};

const getSafeOfferUrl = (offer: any, fallbackQuery: string) => {
  if (!isBlockedGoogleUrl(offer?.buyUrl)) return offer.buyUrl;
  const productName = String(offer?.productName || fallbackQuery || 'produto');
  const query = encodeURIComponent(productName);
  return `https://www.buscape.com.br/search?q=${query}`;
};

/* =================== PESQUISA DE PREÇOS =================== */
export function PriceResearchTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');
  const [offers, setOffers] = useState<any[]>([]);

  const runSearch = async (term = query) => {
    const q = String(term || '').trim();
    if (!q) {
      setError('Digite o nome de um produto para pesquisar.');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(q);

    try {
      const customSerpKey = safeStorage.getItem('bambuzau_custom_serp_key', '');
      const params = new URLSearchParams({ q, type: 'Produtos' });
      if (customSerpKey) params.set('api_key', customSerpKey.trim());

      const res = await fetch(getApiUrl(`/api/quotations?${params.toString()}`), {
        headers: { 'X-Custom-Serpapi-Key': customSerpKey.trim() },
      });
      const data = await res.json().catch(() => []);
      const group = Array.isArray(data) ? data[0] : data;
      const list = Array.isArray(group?.offers) ? group.offers : Array.isArray(data?.offers) ? data.offers : [];

      const cleanList = dedupeOffers(list);
      setOffers(cleanList.slice(0, 15));
      if (!list.length) setError('Nenhum preço encontrado para este produto.');
    } catch (err: any) {
      setError(err?.message || 'Falha ao pesquisar preços.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const examples: { label: string; icon: any; tone: string }[] = [
    { label: 'garrafa térmica stanley', icon: Flame, tone: 'from-orange-400/20 to-rose-400/10 text-orange-200 border-orange-300/20' },
    { label: 'fone bluetooth', icon: Headphones, tone: 'from-sky-400/20 to-indigo-400/10 text-sky-200 border-sky-300/20' },
    { label: 'suporte celular carro', icon: Smartphone, tone: 'from-violet-400/20 to-fuchsia-400/10 text-violet-200 border-violet-300/20' },
    { label: 'mochila executiva', icon: Briefcase, tone: 'from-emerald-400/20 to-teal-400/10 text-emerald-200 border-emerald-300/20' },
  ];
  const lowest = offers.length ? offers.reduce((best, item) => Number(item.price) < Number(best.price) ? item : best, offers[0]) : null;

  return (
    <div className="space-y-5">
      {/* Premium header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/40 backdrop-blur-xl p-6 shadow-[0_30px_80px_-40px_rgba(165,216,75,0.35)]">
        <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[var(--cat-lime,#A5D84B)]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--cat-lime,#A5D84B)]/30 to-emerald-500/10 border border-[var(--cat-lime,#A5D84B)]/30 shadow-[0_8px_24px_-8px_rgba(165,216,75,0.55)]">
                <Search className="h-5 w-5 text-[var(--cat-lime,#A5D84B)]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--cat-lime,#A5D84B)]">Pesquisa de Preços</h3>
                <p className="text-[12px] text-zinc-300/90 font-medium">Compare as melhores ofertas em tempo real.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--cat-lime,#A5D84B)]/60 focus:ring-2 focus:ring-[var(--cat-lime,#A5D84B)]/20 transition"
                placeholder="Ex.: garrafa térmica, fone bluetooth, suporte celular..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
              />
              <button onClick={() => runSearch()} disabled={loading} className="group inline-flex items-center justify-center gap-2 px-5 py-3 min-w-[140px] rounded-xl bg-gradient-to-r from-[var(--cat-lime,#A5D84B)] to-emerald-400 text-black text-[12px] font-black uppercase tracking-wider shadow-[0_10px_30px_-10px_rgba(165,216,75,0.7)] hover:shadow-[0_14px_40px_-10px_rgba(165,216,75,0.9)] hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:opacity-60 disabled:translate-y-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                {loading ? 'Buscando' : 'Pesquisar'}
              </button>
            </div>
          </div>
          {lowest && (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/15 to-emerald-500/5 px-5 py-3 min-w-[200px] shadow-[0_12px_32px_-12px_rgba(16,185,129,0.5)]">
              <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl" />
              <div className="relative">
                <div className="text-[9px] text-emerald-300 uppercase font-black tracking-[0.18em] flex items-center gap-1"><TrendingDown className="h-3 w-3" />Menor preço</div>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5">R$ {Number(lowest.price || 0).toFixed(2)}</div>
                <div className="text-[10px] text-zinc-300/80 truncate">{lowest.storeName}</div>
              </div>
            </div>
          )}
        </div>
        <div className="relative mt-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="h-3 w-3 text-[var(--cat-lime,#A5D84B)]" />
            <span className="text-[9px] uppercase tracking-[0.22em] font-black text-zinc-400">Sugestões em alta</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex, idx) => {
              const Icon = ex.icon;
              return (
                <button
                  key={ex.label}
                  onClick={() => { setQuery(ex.label); runSearch(ex.label); }}
                  style={{ animationDelay: `${idx * 70}ms` }}
                  className={`group relative inline-flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full border bg-gradient-to-r ${ex.tone} backdrop-blur-md text-[11px] font-semibold capitalize transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(255,255,255,0.2)] hover:border-white/30`}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-black/30 border border-white/10 group-hover:scale-110 transition-transform">
                    <Icon className="h-3 w-3" />
                  </span>
                  <span>{ex.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {error && <div className="relative mt-3 text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 backdrop-blur-sm">{error}</div>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {offers.map((offer, i) => (
          <div key={`${offer.productName}-${i}`} className={panel + " flex gap-3 items-start"}>
            <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {offer.thumbnail ? <img src={offer.thumbnail} alt={offer.productName} className="h-full w-full object-cover" /> : <ShoppingBag className="h-6 w-6 text-[var(--cat-lime,#A5D84B)]" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`${chip} bg-white/10 text-zinc-300`}>{offer.storeName || 'Loja'}</span>
                {i === 0 && <span className={`${chip} bg-emerald-400/15 text-emerald-300`}>Melhor preço</span>}
              </div>
              <div className="text-[12px] font-bold text-white leading-snug line-clamp-2">{offer.productName}</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-[var(--cat-lime,#A5D84B)]">R$ {Number(offer.price || 0).toFixed(2)}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400" />{Number(offer.rating || 4.5).toFixed(1)}</div>
                </div>
                <a href={getSafeOfferUrl(offer, searched || query)} target="_blank" rel="noreferrer" className={btnPrimary + " bg-white/10 text-white hover:bg-white/15"}>
                    Abrir <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        ))}

        {!offers.length && !loading && (
          <div className={panel + " xl:col-span-2 text-center py-12"}>
            <Search className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
            <div className="text-sm font-bold text-white">Pesquise um produto acima</div>
            <div className="text-[11px] text-zinc-500 mt-1">Os resultados aparecem aqui em ordem de menor preço.</div>
          </div>
        )}
      </div>

      {searched && offers.length > 0 && (
        <div className="text-[10px] text-zinc-500 text-right">
          Resultado para: <strong className="text-zinc-300">{searched}</strong>
        </div>
      )}
    </div>
  );
}

/* =================== CATÁLOGO 3D =================== */
export function Catalog3DTab() {
  const [items] = useState([
    { name: 'Vaso Geométrico', mat: 'PLA', time: '4h12m', price: 'R$ 45,00' },
    { name: 'Suporte Headset', mat: 'PETG', time: '6h30m', price: 'R$ 80,00' },
    { name: 'Miniatura Dragão', mat: 'Resina', time: '2h00m', price: 'R$ 65,00' },
  ]);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[12px] text-zinc-400">{items.length} modelos no catálogo</div>
        <button className={btnPrimary}><Plus className="h-3.5 w-3.5" />Adicionar modelo</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((m, i) => (
          <div key={i} className={panel}>
            <div className="aspect-square rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center mb-3">
              <Box className="h-14 w-14 text-[var(--cat-lime,#A5D84B)] opacity-60" />
            </div>
            <div className="text-[13px] font-bold text-white">{m.name}</div>
            <div className="flex justify-between mt-2 text-[11px]">
              <span className={`${chip} bg-white/10 text-zinc-300`}>{m.mat}</span>
              <span className="text-zinc-400">{m.time}</span>
              <span className="text-[var(--cat-lime,#A5D84B)] font-bold">{m.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =================== MARKETING =================== */
export function MarketingTab() {
  const campaigns = [
    { name: 'Black Friday', status: 'Ativa', reach: '12.4k', color: 'text-emerald-400' },
    { name: 'Lançamento Coleção', status: 'Agendada', reach: '—', color: 'text-amber-400' },
    { name: 'Promo Natal', status: 'Rascunho', reach: '—', color: 'text-zinc-400' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {campaigns.map((c, i) => (
          <div key={i} className={panel}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[13px] font-bold text-white">{c.name}</div>
                <div className={`text-[11px] font-bold ${c.color}`}>{c.status}</div>
              </div>
              <Megaphone className="h-5 w-5 text-[var(--cat-lime,#A5D84B)]" />
            </div>
            <div className="mt-3 text-[11px] text-zinc-400">Alcance: <span className="text-white font-bold">{c.reach}</span></div>
          </div>
        ))}
      </div>
      <div className={panel}>
        <h3 className={sectionTitle}>Gerador de Post</h3>
        <textarea className={inputCls + " h-24"} placeholder="Descreva o produto e gere uma legenda..." />
        <div className="mt-2 flex justify-end"><button className={btnPrimary}>Gerar legenda</button></div>
      </div>
    </div>
  );
}

/* =================== KANBAN =================== */
export function KanbanTab() {
  const cols = [
    { title: 'A Fazer', items: ['Pedido #1042 — Vaso', 'Pedido #1043 — Chaveiro x5'] },
    { title: 'Em Produção', items: ['Pedido #1039 — Miniatura'] },
    { title: 'Pós-processo', items: ['Pedido #1037 — Suporte'] },
    { title: 'Entregue', items: ['Pedido #1031 — Vaso', 'Pedido #1030 — Caixa'] },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {cols.map((c, i) => (
        <div key={i} className={panel}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[12px] font-bold text-[var(--cat-lime,#A5D84B)] uppercase">{c.title}</h3>
            <span className={`${chip} bg-white/10 text-zinc-300`}>{c.items.length}</span>
          </div>
          <div className="space-y-2">
            {c.items.map((t, j) => (
              <div key={j} className="rounded-lg bg-black/40 border border-white/10 p-2 text-[12px] text-white cursor-grab hover:border-[var(--cat-lime,#A5D84B)]/40">{t}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =================== MODELOS =================== */
export function ModelsTab() {
  const files = [
    { name: 'vaso_v3.stl', cat: 'Decoração', size: '4.2 MB' },
    { name: 'suporte_headset.3mf', cat: 'Utilitário', size: '8.1 MB' },
    { name: 'dragao_miniatura.stl', cat: 'Miniatura', size: '15.7 MB' },
    { name: 'organizador_bancada.3mf', cat: 'Utilitário', size: '6.3 MB' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <input className={inputCls + " max-w-sm"} placeholder="Buscar modelo..." />
        <button className={btnPrimary}><Plus className="h-3.5 w-3.5" />Importar STL/3MF</button>
      </div>
      <div className={panel}>
        <table className="w-full text-[12px]">
          <thead><tr className="text-zinc-400 text-left">
            <th className="py-2">Arquivo</th><th>Categoria</th><th>Tamanho</th><th></th>
          </tr></thead>
          <tbody>
            {files.map((f, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2 text-white flex items-center gap-2"><FileBox className="h-4 w-4 text-[var(--cat-lime,#A5D84B)]" />{f.name}</td>
                <td className="text-zinc-300">{f.cat}</td>
                <td className="text-zinc-400">{f.size}</td>
                <td className="text-right"><button className="text-zinc-400 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =================== PRÉ-CHECK =================== */
export function PreCheckTab() {
  const [checks, setChecks] = useState([
    { label: 'Cama nivelada', done: true },
    { label: 'Filamento seco (umidade < 15%)', done: true },
    { label: 'Nozzle limpo', done: false },
    { label: 'Slicer configurado para o material', done: false },
    { label: 'Adesão da primeira camada testada', done: false },
    { label: 'Resfriamento adequado configurado', done: false },
    { label: 'Arquivo G-code revisado', done: false },
  ]);
  const toggle = (i: number) => setChecks(c => c.map((x, idx) => idx === i ? { ...x, done: !x.done } : x));
  const done = checks.filter(c => c.done).length;
  return (
    <div className="space-y-4">
      <div className={panel}>
        <div className="flex justify-between items-center mb-3">
          <h3 className={sectionTitle + " mb-0"}>Checklist antes de imprimir</h3>
          <span className="text-[12px] text-white font-bold">{done}/{checks.length}</span>
        </div>
        <div className="space-y-2">
          {checks.map((c, i) => (
            <button key={i} onClick={() => toggle(i)} className="w-full flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-white/10 hover:border-[var(--cat-lime,#A5D84B)]/40">
              <div className={`h-5 w-5 rounded-md flex items-center justify-center ${c.done ? 'bg-[var(--cat-lime,#A5D84B)]' : 'border border-white/20'}`}>
                {c.done && <Check className="h-3.5 w-3.5 text-black" />}
              </div>
              <span className={`text-[12px] ${c.done ? 'text-zinc-400 line-through' : 'text-white'}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =================== AGENDA =================== */
export function AgendaTab() {
  const events = [
    { day: 'Hoje', time: '14:00', title: 'Entrega Pedido #1039', color: 'text-emerald-400' },
    { day: 'Hoje', time: '17:30', title: 'Manutenção Bambu X1', color: 'text-amber-400' },
    { day: 'Amanhã', time: '09:00', title: 'Início lote Black Friday', color: 'text-sky-400' },
    { day: 'Sex', time: '15:00', title: 'Reunião fornecedor filamento', color: 'text-pink-400' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="text-[12px] text-zinc-400">Próximos compromissos</div>
        <button className={btnPrimary}><Plus className="h-3.5 w-3.5" />Novo evento</button>
      </div>
      <div className={panel}>
        <div className="space-y-2">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-white/10">
              <Calendar className={`h-5 w-5 ${e.color}`} />
              <div className="flex-1">
                <div className="text-[12px] text-white font-bold">{e.title}</div>
                <div className="text-[10px] text-zinc-400">{e.day} • {e.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =================== SITES =================== */
export function SitesTab() {
  const sites = [
    { name: 'Loja Shopify', url: 'minhaloja.myshopify.com', status: 'Online', color: 'text-emerald-400' },
    { name: 'Mercado Livre', url: 'mercadolivre.com.br/...', status: 'Online', color: 'text-emerald-400' },
    { name: 'Shopee', url: 'shopee.com.br/...', status: 'Atenção', color: 'text-amber-400' },
    { name: 'Site Institucional', url: 'gestao3d.com.br', status: 'Online', color: 'text-emerald-400' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="text-[12px] text-zinc-400">{sites.length} sites/lojas conectados</div>
        <button className={btnPrimary}><Plus className="h-3.5 w-3.5" />Conectar site</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sites.map((s, i) => (
          <div key={i} className={panel}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[var(--cat-lime,#A5D84B)]" />
                <div>
                  <div className="text-[13px] font-bold text-white">{s.name}</div>
                  <div className="text-[10px] text-zinc-400">{s.url}</div>
                </div>
              </div>
              <span className={`text-[11px] font-bold ${s.color}`}>{s.status}</span>
            </div>
            <button className="mt-3 text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />Abrir</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =================== FERRAMENTAS =================== */
export function ToolsTab() {
  const tools = [
    { name: 'Calculadora de Filamento', desc: 'Calcule gramas e custo por peça' },
    { name: 'Conversor de Unidades', desc: 'mm ↔ pol, g ↔ oz, °C ↔ °F' },
    { name: 'Tempo → Custo', desc: 'Estimativa de custo por hora de impressão' },
    { name: 'Calibração de Fluxo', desc: 'Passo-a-passo para calibrar extrusão' },
    { name: 'Temperatura por Material', desc: 'Tabela rápida PLA/PETG/ABS/TPU' },
    { name: 'Verificador de STL', desc: 'Análise de manifold e furos' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {tools.map((t, i) => (
        <button key={i} className={panel + " text-left hover:border-[var(--cat-lime,#A5D84B)]/40 transition"}>
          <Wrench className="h-5 w-5 text-[var(--cat-lime,#A5D84B)] mb-2" />
          <div className="text-[13px] font-bold text-white">{t.name}</div>
          <div className="text-[11px] text-zinc-400 mt-1">{t.desc}</div>
        </button>
      ))}
    </div>
  );
}