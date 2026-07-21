import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ExternalLink, Download, Heart, ImageOff, Lightbulb, Check, Search, X, Sparkles, FileBox, TrendingUp } from "lucide-react";
import { AiRecommendation, SectionTitle, Kpi } from "@/legacy-app/components/DashboardShell";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  findByHash,
  hashFile,
  saveModel,
  type ModelRecord,
} from "@/lib/catalog-db";
import { loadAsStl } from "@/lib/threemf";
import { renderStlThumbnail } from "@/lib/stl-thumbnail";
import { addIdeaToKanban, isIdeaInKanban, removeIdeaFromKanban } from "@/lib/kanban-ideas";

type TrendItem = {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  source: string;
  url: string;
  download_url?: string;
  stats?: { likes?: number; downloads?: number };
};

type ApiPayload = {
  items: TrendItem[];
  errors: { source: string; message: string }[];
  updated_at: number;
};

const SOURCE_COLORS: Record<string, string> = {
  MakerWorld: "bg-amber-500/20 text-amber-200 border-amber-400/30",
};

function formatAgo(ts: number) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return `há ${h}h`;
}

function MarketPage() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [ideaUrls, setIdeaUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem("kanban-board-v1");
        if (!raw) return setIdeaUrls(new Set());
        const board = JSON.parse(raw) as Array<{ cards: Array<{ url?: string }> }>;
        const urls = new Set<string>();
        board.forEach((c) => c.cards.forEach((k) => k.url && urls.add(k.url)));
        setIdeaUrls(urls);
      } catch {}
    };
    sync();
    window.addEventListener("kanban-ideas:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("kanban-ideas:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleIdea = (item: TrendItem) => {
    if (ideaUrls.has(item.url)) {
      removeIdeaFromKanban(item.url);
      toast.info("Removido das Ideias do Kanban");
    } else {
      addIdeaToKanban({
        title: item.title,
        url: item.url,
        thumbnail: item.thumbnail,
        source: item.source,
        note: item.author ? `Autor: ${item.author}` : undefined,
      });
      toast.success("Enviado para Ideias no Kanban", { description: item.title });
    }
  };

  const [category, setCategory] = useState<string>("trending");
  const [search, setSearch] = useState<string>("");
  const [submittedQuery, setSubmittedQuery] = useState<{ q?: string; cat?: string }>({ cat: "trending" });

  const load = async (force = false, q?: { q?: string; cat?: string }) => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (force) params.set("refresh", "1");
      const target = q ?? submittedQuery;
      if (target.q) params.set("q", target.q);
      else if (target.cat) params.set("cat", target.cat);
      const r = await fetch(`/api/3d-trends?${params.toString()}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j: ApiPayload = await r.json();
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(false, submittedQuery); }, [submittedQuery]);

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = search.trim();
    if (!v) { setSubmittedQuery({ cat: category }); return; }
    setSubmittedQuery({ q: v });
  };

  const pickCategory = (c: string) => {
    setCategory(c);
    setSearch("");
    setSubmittedQuery({ cat: c });
  };

  const clearSearch = () => {
    setSearch("");
    setSubmittedQuery({ cat: category });
  };

  const filtered = useMemo(() => data?.items ?? [], [data]);

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    const totalLikes = items.reduce((a, b) => a + (b.stats?.likes ?? 0), 0);
    const totalDl = items.reduce((a, b) => a + (b.stats?.downloads ?? 0), 0);
    return { count: items.length, likes: totalLikes, downloads: totalDl };
  }, [data]);

  const importItem = async (item: TrendItem) => {
    if (!item.download_url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      toast.info("Abrindo página original", {
        description: "Esta plataforma não fornece download direto.",
      });
      return;
    }
    setImporting(item.id);
    try {
      const resp = await fetch(item.download_url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const fileName = item.download_url.split("/").pop()?.split("?")[0] || `${item.title}.stl`;
      const file = new File([blob], fileName, { type: blob.type });
      const hash = await hashFile(file);
      const dup = await findByHash(hash);
      if (dup) {
        toast.warning("Já existe no catálogo", { description: dup.name });
        return;
      }
      const type: "stl" | "3mf" = fileName.toLowerCase().endsWith(".3mf") ? "3mf" : "stl";
      let thumbnail: string | undefined;
      try {
        const stl = await loadAsStl(file, type);
        thumbnail = (await renderStlThumbnail(stl)).dataUrl;
      } catch {
        thumbnail = item.thumbnail || undefined;
      }
      const now = Date.now();
      const rec: ModelRecord = {
        id: crypto.randomUUID(),
        name: item.title,
        fileName,
        fileType: type,
        size: file.size,
        hash,
        category: "Decoração",
        tags: ["importado", item.source.toLowerCase()],
        notes: item.author ? `Autor: ${item.author}` : "",
        unit: "mm",
        scale: 1,
        thumbnail,
        source: { name: item.source, url: item.url },
        createdAt: now,
        updatedAt: now,
      };
      await saveModel(rec, file);
      toast.success("Adicionado ao catálogo", { description: item.title });
    } catch (e: any) {
      toast.error("Falha ao importar", { description: e?.message });
    } finally {
      setImporting(null);
    }
  };

  return (
    <AppShell>
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-48 left-1/4 h-[620px] w-[620px] rounded-full bg-fuchsia-500/10 blur-[160px]" />
          <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[150px]" />
          <div className="absolute -bottom-32 left-0 h-[420px] w-[420px] rounded-full bg-amber-500/[0.07] blur-[150px]" />
        </div>

        <div className="w-full py-6 space-y-8">
          {/* AI Recommendation + KPI strip (padrão Clientes) */}
          <AiRecommendation
            title={
              loading
                ? 'Buscando tendências em tempo real…'
                : stats.count === 0
                  ? 'Nenhum modelo encontrado para esta categoria'
                  : `${stats.count} modelos prontos para curar`
            }
            body={
              stats.count === 0
                ? 'Tente outra categoria ou faça uma busca por palavra-chave. O MakerWorld atualiza tendências a cada hora.'
                : `Os top resultados somam ${stats.likes.toLocaleString('pt-BR')} curtidas e ${stats.downloads.toLocaleString('pt-BR')} downloads. Selecione os mais relevantes para o seu nicho e envie ao Kanban antes que viralizem.`
            }
            savings={stats.downloads.toLocaleString('pt-BR')}
            action="Atualizar agora"
            onAction={() => load(true)}
          />

          <SectionTitle icon={FileBox} title="Dashboard — Modelos / Curadoria 3D" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi icon={FileBox} label="Resultados" value={stats.count} tone="gold" />
            <Kpi icon={Heart} label="Curtidas" value={stats.likes.toLocaleString('pt-BR')} tone="fuchsia" />
            <Kpi icon={TrendingUp} label="Downloads" value={stats.downloads.toLocaleString('pt-BR')} tone="emerald" />
            <Kpi
              icon={Sparkles}
              label={submittedQuery.q ? 'Busca' : 'Categoria'}
              value={submittedQuery.q || submittedQuery.cat || '—'}
              tone="lime"
            />
            <Kpi
              icon={Lightbulb}
              label="No Kanban"
              value={ideaUrls.size}
              tone="purple"
            />
            <Kpi
              icon={RefreshCw}
              label="Atualizado"
              value={data?.updated_at ? formatAgo(data.updated_at) : '—'}
              tone="blue"
            />
          </div>

          {/* Search bar */}
          <form onSubmit={submitSearch} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 backdrop-blur-xl transition-all duration-300 focus-within:border-fuchsia-400/40 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_40px_-12px_rgba(232,121,249,0.35)]">
            <Search className="h-4 w-4 text-fuchsia-300/80" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por palavra, link makerworld.com/… ou ID numérico"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            {search && (
              <button type="button" onClick={clearSearch} className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white" aria-label="Limpar">
                <X className="h-4 w-4" />
              </button>
            )}
            <button type="submit" className="rounded-full border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/25 to-cyan-500/20 px-5 py-1.5 text-xs font-medium tracking-wide text-white shadow-[0_0_20px_-6px_rgba(232,121,249,0.6)] transition-all hover:from-fuchsia-500/35 hover:to-cyan-500/30">
              Buscar
            </button>
          </form>

          {/* Categories */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-white/15 pb-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/50">Categorias</p>
              <button
                onClick={() => load(true)}
                disabled={loading}
                title="Atualizar"
                aria-label="Atualizar"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition-all hover:scale-105 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 hover:text-fuchsia-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["trending","hobby","art","tools","toy","game","education","fashion","home decor","gadget","miniature","cosplay","sports","vehicle","organizer","articulated","functional print"].map((c) => {
                const active = !submittedQuery.q && submittedQuery.cat === c;
                return (
                  <button
                    key={c}
                    onClick={() => pickCategory(c)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-300 hover:-translate-y-0.5 ${
                      active
                        ? "border-fuchsia-400/50 bg-gradient-to-br from-fuchsia-500/25 to-cyan-500/20 text-white shadow-[0_0_28px_-8px_rgba(232,121,249,0.55)]"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

        {/* Errors */}
        {data?.errors && data.errors.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            Algumas buscas falharam: {data.errors.length}
          </div>
        )}

        {/* Error state */}
        {err && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-200">{err}</p>
            <button
              onClick={() => load(true)}
              className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && !data && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="aspect-square rounded-xl bg-white/5" />
                <div className="mt-3 h-4 w-3/4 rounded bg-white/10" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {/* MakerWorld grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item, idx) => (
              <article
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-fuchsia-400/30 hover:shadow-[0_20px_60px_-20px_rgba(232,121,249,0.35)] animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${Math.min(idx * 40, 600)}ms`, animationFillMode: "both" }}
              >
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-2xl" />
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-square overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01]"
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                      className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/30">
                      <ImageOff className="h-10 w-10" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span
                    className={`absolute left-2.5 top-2.5 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide backdrop-blur-md ${
                      SOURCE_COLORS[item.source] ||
                      "bg-white/10 text-white border-white/20"
                    }`}
                  >
                    {item.source}
                  </span>
                </a>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug tracking-tight text-white">
                    {item.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                    <span className="truncate font-medium">{item.author || "—"}</span>
                    {item.stats && (item.stats.likes || item.stats.downloads) ? (
                      <span className="flex items-center gap-2 tabular-nums">
                        {item.stats.likes ? (
                          <span className="inline-flex items-center gap-1 text-fuchsia-200/70">
                            <Heart className="h-3 w-3 fill-current" /> {item.stats.likes}
                          </span>
                        ) : null}
                        {item.stats.downloads ? (
                          <span className="inline-flex items-center gap-1 text-cyan-200/70">
                            <Download className="h-3 w-3" /> {item.stats.downloads}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => importItem(item)}
                      disabled={importing === item.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-cyan-600/5 py-2 text-xs font-medium text-cyan-100 transition-all duration-300 hover:border-cyan-300/50 hover:from-cyan-500/25 hover:to-cyan-600/10 hover:shadow-[0_0_20px_-8px_rgba(34,211,238,0.6)] disabled:opacity-50"
                    >
                      {importing === item.id ? (
                        <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Importando…</>
                      ) : item.download_url ? (
                        <><Download className="h-3.5 w-3.5" /> Catálogo</>
                      ) : (
                        <><ExternalLink className="h-3.5 w-3.5" /> Abrir</>
                      )}
                    </button>
                    <button
                      onClick={() => toggleIdea(item)}
                      title={ideaUrls.has(item.url) ? "Remover das Ideias" : "Enviar para Ideias (Kanban)"}
                      className={`inline-flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-300 ${
                        ideaUrls.has(item.url)
                          ? "border-fuchsia-400/50 bg-gradient-to-br from-fuchsia-500/25 to-fuchsia-600/10 text-fuchsia-100 shadow-[0_0_20px_-8px_rgba(232,121,249,0.6)] hover:from-fuchsia-500/35"
                          : "border-white/15 bg-white/5 text-white/70 hover:border-fuchsia-400/30 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"
                      }`}
                    >
                      {ideaUrls.has(item.url) ? <Check className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
                      Ideia
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && data && filtered.length === 0 && !err && (
          <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center text-white/60">
            Nenhum modelo encontrado.
          </div>
        )}
        </div>
      </div>
    </AppShell>
  );
}

export default MarketPage;
