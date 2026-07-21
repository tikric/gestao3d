import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Globe, Sparkles, Pencil } from "lucide-react";

type Link = { id: string; name: string; url: string; category: string; desc?: string };

const PRESETS: Link[] = [
  // Modelos / Marketplaces
  { id: "p1", name: "MakerWorld", url: "https://makerworld.com", category: "Modelos", desc: "Comunidade Bambu Lab com prints prontos." },
  { id: "p2", name: "Printables", url: "https://www.printables.com", category: "Modelos", desc: "Plataforma da Prusa, muitos contests." },
  { id: "p3", name: "Thingiverse", url: "https://www.thingiverse.com", category: "Modelos", desc: "Maior biblioteca de modelos gratuitos." },
  { id: "p4", name: "Cults 3D", url: "https://cults3d.com", category: "Modelos", desc: "Marketplace de STLs premium." },
  { id: "p5", name: "MyMiniFactory", url: "https://www.myminifactory.com", category: "Modelos", desc: "Foco em miniaturas e tabletop." },
  { id: "p6", name: "Thangs", url: "https://thangs.com", category: "Modelos", desc: "Busca geométrica entre milhões de STLs." },
  { id: "p7", name: "Pinshape", url: "https://pinshape.com", category: "Modelos", desc: "Modelos clássicos da Formlabs." },

  // Modelagem (IA / Generativo)
  { id: "m1", name: "Hunyuan 3D", url: "https://3d.hunyuanglobal.com/login-email", category: "Modelagem", desc: "Geração de modelos 3D por IA da Tencent." },
  { id: "m2", name: "MakerLab (MakerWorld)", url: "https://makerworld.com/pt/makerlab", category: "Modelagem", desc: "Ferramentas de modelagem e personalização do MakerWorld." },
  { id: "m3", name: "Gridfinity Generator", url: "https://gridfinitygenerator.com/en/editor", category: "Modelagem", desc: "Editor online para criar peças do sistema Gridfinity." },
  { id: "m4", name: "Mesh Texture", url: "https://www.meshtexture.com/", category: "Modelagem", desc: "Aplicar texturas em malhas 3D direto no navegador." },
  { id: "m5", name: "Neural4D Studio", url: "https://www.neural4d.com/studio", category: "Modelagem", desc: "Geração de modelos 3D por IA." },


  // Fatiadores / Software
  { id: "s1", name: "Bambu Studio", url: "https://bambulab.com/en/download/studio", category: "Software", desc: "Slicer da Bambu Lab." },
  { id: "s2", name: "OrcaSlicer", url: "https://github.com/SoftFever/OrcaSlicer", category: "Software", desc: "Fork open-source com calibração avançada." },
  { id: "s3", name: "PrusaSlicer", url: "https://www.prusa3d.com/prusaslicer/", category: "Software", desc: "Fatiador clássico, muito estável." },
  { id: "s4", name: "Cura", url: "https://ultimaker.com/software/ultimaker-cura/", category: "Software", desc: "Slicer mais popular do mercado." },
  { id: "s5", name: "Meshmixer", url: "https://meshmixer.com", category: "Software", desc: "Reparo e edição de malhas." },
  { id: "s6", name: "TinkerCAD", url: "https://www.tinkercad.com", category: "Software", desc: "CAD online simples e gratuito." },
  { id: "s7", name: "Fusion 360", url: "https://www.autodesk.com/products/fusion-360", category: "Software", desc: "CAD paramétrico profissional." },

];

// Marketplaces appended below to keep diff small
PRESETS.push(
  { id: "mk1", name: "Mercado Livre", url: "https://www.mercadolivre.com.br", category: "Marketplace", desc: "Maior marketplace da América Latina." },
  { id: "mk2", name: "Shopee", url: "https://shopee.com.br", category: "Marketplace", desc: "Marketplace com forte tráfego em nichos 3D." },
  { id: "mk3", name: "Amazon", url: "https://www.amazon.com.br", category: "Marketplace", desc: "Marketplace global com FBA." },
  { id: "mk4", name: "Magalu", url: "https://www.magazineluiza.com.br", category: "Marketplace", desc: "Marketplace brasileiro com Magalu Ads." },
  { id: "mk5", name: "Americanas", url: "https://www.americanas.com.br", category: "Marketplace", desc: "Marketplace tradicional brasileiro." },
  { id: "mk6", name: "Etsy", url: "https://www.etsy.com", category: "Marketplace", desc: "Marketplace global para produtos autorais e 3D." },
  { id: "mk7", name: "Elo7", url: "https://www.elo7.com.br", category: "Marketplace", desc: "Marketplace brasileiro de produtos criativos." },
  { id: "mk8", name: "AliExpress", url: "https://pt.aliexpress.com", category: "Marketplace", desc: "Marketplace global para insumos e revenda." },
);

const STORAGE_KEY = "sites-directory-v1";

function SitesPage() {
  const [extra, setExtra] = useState<Link[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<Link>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [cat, setCat] = useState("Modelos");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const s = JSON.parse(raw); setExtra(s.extra || []); setHidden(s.hidden || []); setOverrides(s.overrides || {}); }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ extra, hidden, overrides }));
  }, [extra, hidden, overrides]);

  const all = useMemo(() => {
    const apply = (l: Link): Link => overrides[l.id] ? { ...l, ...overrides[l.id] } : l;
    return [
      ...PRESETS.filter((p) => !hidden.includes(p.id)).map(apply),
      ...extra.map(apply),
    ];
  }, [extra, hidden, overrides]);
  const filtered = all;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    const full = url.startsWith("http") ? url : `https://${url}`;
    if (editingId) {
      const isPreset = PRESETS.some((p) => p.id === editingId);
      const patch = { name: name.trim(), url: full, category: cat };
      if (isPreset) {
        setOverrides((o) => ({ ...o, [editingId]: { ...o[editingId], ...patch } }));
      } else {
        setExtra((x) => x.map((l) => l.id === editingId ? { ...l, ...patch } : l));
      }
      setEditingId(null);
    } else {
      setExtra((x) => [...x, { id: crypto.randomUUID(), name: name.trim(), url: full, category: cat }]);
    }
    setName(""); setUrl(""); setShowAdd(false);
  };

  const startEdit = (l: Link) => {
    setEditingId(l.id);
    setName(l.name);
    setUrl(l.url);
    setCat(l.category);
    setShowAdd(true);
  };

  const remove = (id: string) => {
    if (PRESETS.find((p) => p.id === id)) setHidden((h) => [...h, id]);
    else setExtra((x) => x.filter((l) => l.id !== id));
    setOverrides((o) => { const n = { ...o }; delete n[id]; return n; });
  };

  const favicon = (u: string) => `https://www.google.com/s2/favicons?domain=${new URL(u).hostname}&sz=128`;
  const hostname = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

  // Group filtered links by category for the sectioned logo grid
  const grouped = useMemo(() => {
    const map = new Map<string, Link[]>();
    for (const l of filtered) {
      if (!map.has(l.category)) map.set(l.category, []);
      map.get(l.category)!.push(l);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/3 h-[420px] w-[420px] rounded-full bg-[#b7ff00]/10 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-[360px] w-[360px] rounded-full bg-cyan-500/[0.06] blur-[140px]" />
      </div>
      <div className="w-full py-6">
        {/* Premium Header — Obsidian Glass */}
        <div
          className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 p-6 md:p-8 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(12,16,14,0.92) 0%, rgba(10,12,18,0.88) 100%)',
            backdropFilter: 'blur(24px) saturate(140%)',
            boxShadow: '0 24px 60px -24px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(700px circle at 0% 0%, rgba(183,255,0,0.10), transparent 55%)' }}
          />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, rgba(183,255,0,0.18), rgba(16,185,129,0.08))',
                  boxShadow: '0 8px 24px -8px rgba(183,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <Globe className="h-5 w-5 text-lime-200" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/40">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b7ff00] shadow-[0_0_8px_rgba(183,255,0,0.9)]" />
                  Diretório curado
                </div>
                <h1
                  className="mt-1.5 text-3xl font-bold leading-tight text-white md:text-4xl"
                  style={{ fontFamily: "'Sora', sans-serif", textShadow: '0 2px 16px rgba(183,255,0,0.18)' }}
                >
                  Sites & Ferramentas
                </h1>
                <p className="mt-1 max-w-xl text-sm text-white/55">
                  Coleção editorial de marketplaces, fatiadores e modeladores que alimentam o ateliê.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="rounded-2xl border border-white/10 px-4 py-2.5"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}
              >
                <div className="text-[9px] uppercase tracking-[0.24em] text-white/40">Total</div>
                <div className="font-mono text-xl text-white" style={{ textShadow: '0 0 12px rgba(183,255,0,0.35)' }}>{filtered.length}</div>
              </div>
              <div
                className="rounded-2xl border border-white/10 px-4 py-2.5"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}
              >
                <div className="text-[9px] uppercase tracking-[0.24em] text-white/40">Categorias</div>
                <div className="font-mono text-xl text-white" style={{ textShadow: '0 0 12px rgba(103,232,249,0.35)' }}>{grouped.length}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd((v) => !v)}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-black transition hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #b7ff00, #84cc16)',
                  boxShadow: '0 12px 30px -10px rgba(183,255,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                <Sparkles className="h-4 w-4" /> Adicionar site
              </button>
            </div>
          </div>
        </div>

        {showAdd && (
          <form
            onSubmit={add}
            className="relative mb-6 grid grid-cols-1 gap-2 overflow-hidden rounded-3xl border border-white/10 p-4 md:grid-cols-[1fr_1fr_160px_auto] animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(12,16,14,0.9), rgba(10,12,18,0.85))',
              backdropFilter: 'blur(20px) saturate(140%)',
              boxShadow: '0 16px 40px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do site" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition focus:-translate-y-px focus:border-[#b7ff00]/50 focus:bg-white/[0.07] focus:outline-none" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition focus:-translate-y-px focus:border-[#b7ff00]/50 focus:bg-white/[0.07] focus:outline-none" />
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:border-[#b7ff00]/50 focus:outline-none">
              {["Modelos","Modelagem","Software","Marketplace","Outros"].map((c) => <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>)}
            </select>
            <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#b7ff00] px-4 py-2 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95 shadow-[0_10px_24px_-8px_rgba(183,255,0,0.7)]">
              {editingId ? <><Pencil className="h-4 w-4" /> Atualizar</> : <><Plus className="h-4 w-4" /> Salvar</>}
            </button>
          </form>
        )}

        {/* Sections by category — logo-only tiles */}
        <div className="space-y-10">
          {grouped.map(([category, items], gIdx) => (
            <section key={category} className="animate-fade-in" style={{ animationDelay: `${gIdx * 80}ms` }}>
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="rounded-full border border-[#b7ff00]/25 bg-[#b7ff00]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#b7ff00]"
                  style={{ textShadow: '0 0 12px rgba(183,255,0,0.45)' }}
                >
                  {category}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#b7ff00]/30 via-white/10 to-transparent" />
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-white/50">{items.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                {items.map((l, i) => (
                  <div
                    key={l.id}
                    className="group relative animate-fade-in"
                    style={{ animationDelay: `${gIdx * 80 + i * 30}ms` }}
                  >
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      title={`${l.name} — ${hostname(l.url)}`}
                      className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 p-2 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[#b7ff00]/50 hover:shadow-[0_14px_32px_-14px_rgba(183,255,0,0.4)]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                      }}
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 p-1 transition-transform duration-300 group-hover:scale-110"
                        style={{ boxShadow: '0 6px 18px -6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.6)' }}
                      >
                        <img
                          src={favicon(l.url)}
                          alt={l.name}
                          loading="lazy"
                          className="h-full w-full object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
                        />
                      </div>
                      <span className="block w-full truncate text-center text-[9px] font-semibold tracking-wide text-white/80 transition group-hover:text-[#b7ff00]">
                        {l.name}
                      </span>
                    </a>
                    <button
                      onClick={() => remove(l.id)}
                      aria-label="Remover"
                      className="absolute top-1.5 right-1.5 z-10 rounded-full border border-white/10 bg-black/70 p-1 text-white/60 opacity-0 backdrop-blur transition hover:text-rose-400 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => startEdit(l)}
                      aria-label="Editar"
                      className="absolute top-1.5 left-1.5 z-10 rounded-full border border-white/10 bg-black/70 p-1 text-white/60 opacity-0 backdrop-blur transition hover:text-[#b7ff00] group-hover:opacity-100"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/40 backdrop-blur-xl">
            Nenhum site encontrado.
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          aria-label="Adicionar site"
          title="Adicionar site"
          className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-black transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #b7ff00, #84cc16)',
            boxShadow: '0 0 34px -6px rgba(183,255,0,0.95), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          <Plus className="h-7 w-7 stroke-[3px]" />
        </button>
      </div>
    </div>
  );
}

export default SitesPage;
