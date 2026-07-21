import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Lightbulb,
  Hammer,
  Printer,
  CheckCircle2,
  Flag,
  Calendar,
  X,
  Search,
  ExternalLink,
  Layers,
  GripVertical,
  ImagePlus,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AiRecommendation, SectionTitle, Kpi } from "@/legacy-app/components/DashboardShell";

type Priority = "low" | "med" | "high";

type Card = {
  id: string;
  title: string;
  note?: string;
  url?: string;
  thumbnail?: string;
  source?: string;
  priority?: Priority;
  due?: string;
  tags?: string[];
  createdAt?: number;
};

type Column = {
  id: string;
  title: string;
  accent: string;
  glow: string;
  ring: string;
  icon: any;
  cards: Card[];
};

const STORAGE_KEY = "kanban-board-v1";
const MAX_IMG = 8 * 1024 * 1024;

const DEFAULT: Column[] = [
  {
    id: "backlog",
    title: "Ideias",
    accent: "from-fuchsia-500 to-pink-500",
    glow: "shadow-[0_0_40px_-12px_rgba(217,70,239,0.5)]",
    ring: "ring-fuchsia-400/40",
    icon: Lightbulb,
    cards: [],
  },
  {
    id: "doing",
    title: "Modelando",
    accent: "from-cyan-400 to-blue-500",
    glow: "shadow-[0_0_40px_-12px_rgba(34,211,238,0.5)]",
    ring: "ring-cyan-400/40",
    icon: Hammer,
    cards: [],
  },
  {
    id: "review",
    title: "Imprimindo",
    accent: "from-amber-400 to-orange-500",
    glow: "shadow-[0_0_40px_-12px_rgba(251,191,36,0.5)]",
    ring: "ring-amber-400/40",
    icon: Printer,
    cards: [],
  },
  {
    id: "done",
    title: "Pronto",
    accent: "from-emerald-400 to-teal-500",
    glow: "shadow-[0_0_40px_-12px_rgba(52,211,153,0.5)]",
    ring: "ring-emerald-400/40",
    icon: CheckCircle2,
    cards: [],
  },
];

const PRIORITY_STYLES: Record<Priority, { dot: string; label: string; ring: string }> = {
  low: { dot: "bg-emerald-400", label: "Baixa", ring: "ring-emerald-400/40" },
  med: { dot: "bg-amber-400", label: "Média", ring: "ring-amber-400/40" },
  high: { dot: "bg-rose-500", label: "Alta", ring: "ring-rose-500/40" },
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function KanbanPage() {
  const [board, setBoard] = useState<Column[]>(DEFAULT);
  const [activeTab, setActiveTab] = useState<string>("backlog");
  const [drag, setDrag] = useState<{ colId: string; cardId: string } | null>(null);
  const [dragOver, setDragOver] = useState<{ col: string; cardId?: string } | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ colId: string; card: Card } | null>(null);

  // Per-column add form draft
  const [draftTitle, setDraftTitle] = useState<Record<string, string>>({});
  const [draftNote, setDraftNote] = useState<Record<string, string>>({});
  const [draftImg, setDraftImg] = useState<Record<string, string>>({});
  const [draftPrio, setDraftPrio] = useState<Record<string, Priority>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Array<{ id: string; cards: Card[] }>;
        if (!Array.isArray(parsed)) return;
        setBoard((prev) =>
          prev.map((col) => ({
            ...col,
            cards: parsed.find((p) => p.id === col.id)?.cards ?? col.cards,
          })),
        );
      } catch {}
    };
    load();
    window.addEventListener("kanban-ideas:changed", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("kanban-ideas:changed", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  useEffect(() => {
    const minimal = board.map((c) => ({ id: c.id, title: c.title, cards: c.cards }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
  }, [board]);

  const total = useMemo(() => board.reduce((s, c) => s + c.cards.length, 0), [board]);

  const filterCards = (cards: Card[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.note?.toLowerCase().includes(q) ||
        k.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  };

  const addCard = (colId: string) => {
    const title = (draftTitle[colId] || "").trim();
    if (!title) return;
    const card: Card = {
      id: crypto.randomUUID(),
      title,
      note: draftNote[colId]?.trim() || undefined,
      thumbnail: draftImg[colId] || undefined,
      priority: draftPrio[colId] ?? "med",
      createdAt: Date.now(),
    };
    setBoard((b) => b.map((c) => (c.id === colId ? { ...c, cards: [card, ...c.cards] } : c)));
    setDraftTitle((d) => ({ ...d, [colId]: "" }));
    setDraftNote((d) => ({ ...d, [colId]: "" }));
    setDraftImg((d) => ({ ...d, [colId]: "" }));
    setDraftPrio((d) => ({ ...d, [colId]: "med" }));
  };

  const onPickFile = async (colId: string, file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Selecione uma imagem.");
    if (file.size > MAX_IMG) return alert("Imagem muito grande (máx 8MB).");
    const url = await readFileAsDataURL(file);
    setDraftImg((d) => ({ ...d, [colId]: url }));
  };

  const removeCard = (colId: string, cardId: string) => {
    setBoard((b) =>
      b.map((c) => (c.id === colId ? { ...c, cards: c.cards.filter((x) => x.id !== cardId) } : c)),
    );
  };

  const updateCard = (colId: string, cardId: string, patch: Partial<Card>) => {
    setBoard((b) =>
      b.map((c) =>
        c.id === colId
          ? { ...c, cards: c.cards.map((k) => (k.id === cardId ? { ...k, ...patch } : k)) }
          : c,
      ),
    );
    setEditing((e) => (e && e.card.id === cardId ? { ...e, card: { ...e.card, ...patch } } : e));
  };

  const moveCard = (srcCol: string, srcCardId: string, dstCol: string, dstCardId?: string) => {
    setBoard((b) => {
      const card = b.find((c) => c.id === srcCol)?.cards.find((x) => x.id === srcCardId);
      if (!card) return b;
      const removed = b.map((c) =>
        c.id === srcCol ? { ...c, cards: c.cards.filter((x) => x.id !== srcCardId) } : c,
      );
      return removed.map((c) => {
        if (c.id !== dstCol) return c;
        if (!dstCardId) return { ...c, cards: [...c.cards, card] };
        const idx = c.cards.findIndex((x) => x.id === dstCardId);
        if (idx < 0) return { ...c, cards: [...c.cards, card] };
        const next = [...c.cards];
        next.splice(idx, 0, card);
        return { ...c, cards: next };
      });
    });
  };

  const activeCol = board.find((c) => c.id === activeTab) ?? board[0];
  const ActiveIcon = activeCol.icon;
  const visibleCards = filterCards(activeCol.cards);

  return (
    <AppShell>
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-[150px]" />
          <div className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[150px]" />
          <div className="absolute bottom-0 left-1/3 h-[440px] w-[440px] rounded-full bg-emerald-500/10 blur-[150px]" />
        </div>

        <div className="w-full py-6">
          {/* Premium dashboard header */}
          <div className="mb-6 space-y-5">
            <AiRecommendation
              title={(() => {
                const ideas = board.find(c => c.id === 'backlog')?.cards.length ?? 0;
                const printing = board.find(c => c.id === 'review')?.cards.length ?? 0;
                const done = board.find(c => c.id === 'done')?.cards.length ?? 0;
                if (total === 0) return 'Comece capturando ideias no Kanban';
                if (printing > 5) return `${printing} cards travados em Imprimindo — desbloqueie o fluxo`;
                if (ideas > done * 3 && done > 0) return 'Backlog inchado — priorize execução para destravar caixa';
                return `Pipeline saudável — ${total} cards em fluxo`;
              })()}
              body="O Kanban é o coração da execução criativa. Mova cards com drag-and-drop entre as fases e mantenha o WIP baixo para acelerar o time-to-market."
              savings={`${total} cards`}
              action="Novo Card"
              onAction={() => {
                const el = document.querySelector<HTMLInputElement>(`input[placeholder="Título do card"]`);
                el?.focus();
              }}
            />
            <SectionTitle icon={Layers} title="Dashboard — Kanban" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi icon={Lightbulb}    label="Ideias"      value={board.find(c=>c.id==='backlog')?.cards.length ?? 0} tone="fuchsia" />
              <Kpi icon={Hammer}       label="Modelando"   value={board.find(c=>c.id==='doing')?.cards.length ?? 0}   tone="cyan" />
              <Kpi icon={Printer}      label="Imprimindo"  value={board.find(c=>c.id==='review')?.cards.length ?? 0}  tone="orange" />
              <Kpi icon={CheckCircle2} label="Pronto"      value={board.find(c=>c.id==='done')?.cards.length ?? 0}    tone="emerald" />
            </div>
          </div>

          {/* Header */}
          <header className="mb-6 flex justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cards…"
                className="w-64 rounded-full border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 backdrop-blur-xl focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
          </header>

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl">
            {board.map((col) => {
              const Icon = col.icon;
              const active = col.id === activeTab;
              const count = filterCards(col.cards).length;
              return (
                <button
                  key={col.id}
                  onClick={() => setActiveTab(col.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver({ col: col.id });
                  }}
                  onDrop={() => {
                    if (drag) moveCard(drag.colId, drag.cardId, col.id);
                    setDrag(null);
                    setDragOver(null);
                  }}
                  className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-all ${
                    active
                      ? `bg-gradient-to-r ${col.accent} text-white shadow-lg ${col.glow}`
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  } ${dragOver?.col === col.id && drag && drag.colId !== col.id ? `ring-2 ${col.ring}` : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{col.title}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      active ? "bg-black/20 text-white" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active phase panel */}
          <section
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver({ col: activeCol.id });
            }}
            onDrop={() => {
              if (drag) moveCard(drag.colId, drag.cardId, activeCol.id, dragOver?.cardId);
              setDrag(null);
              setDragOver(null);
            }}
            className={`rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl md:p-7`}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${activeCol.accent} shadow-lg`}>
                <ActiveIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{activeCol.title}</h2>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  {visibleCards.length} {visibleCards.length === 1 ? "card" : "cards"}
                </p>
              </div>
            </div>

            {/* Create form */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-4">
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-white/40">
                Novo card em “{activeCol.title}”
              </p>
              <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                {/* Image dropzone */}
                <button
                  type="button"
                  onClick={() => fileRefs.current[activeCol.id]?.click()}
                  className={`group relative grid h-40 place-items-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-white/40 transition-all hover:border-cyan-400/40 hover:text-white ${
                    draftImg[activeCol.id] ? "border-solid border-white/20" : ""
                  }`}
                >
                  {draftImg[activeCol.id] ? (
                    <>
                      <img
                        src={draftImg[activeCol.id]}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setDraftImg((d) => ({ ...d, [activeCol.id]: "" }));
                        }}
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-black/60 text-white hover:bg-rose-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-xs">
                      <ImagePlus className="h-6 w-6" />
                      <span>Enviar foto</span>
                      <span className="text-[10px] text-white/30">PNG/JPG · até 8MB</span>
                    </div>
                  )}
                  <input
                    ref={(el) => {
                      fileRefs.current[activeCol.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void onPickFile(activeCol.id, e.target.files?.[0]);
                      e.currentTarget.value = "";
                    }}
                  />
                </button>

                <div className="flex flex-col gap-2">
                  <input
                    value={draftTitle[activeCol.id] || ""}
                    onChange={(e) => setDraftTitle((d) => ({ ...d, [activeCol.id]: e.target.value }))}
                    placeholder="Título do card"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
                  />
                  <textarea
                    value={draftNote[activeCol.id] || ""}
                    onChange={(e) => setDraftNote((d) => ({ ...d, [activeCol.id]: e.target.value }))}
                    placeholder="Notas, dimensões, material…"
                    rows={2}
                    className="resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      {(["low", "med", "high"] as Priority[]).map((p) => {
                        const s = PRIORITY_STYLES[p];
                        const active = (draftPrio[activeCol.id] ?? "med") === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setDraftPrio((d) => ({ ...d, [activeCol.id]: p }))}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition-all ${
                              active
                                ? `border-white/30 bg-white/10 text-white ring-2 ${s.ring}`
                                : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                            }`}
                          >
                            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${s.dot}`} />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => addCard(activeCol.id)}
                      disabled={!(draftTitle[activeCol.id] || "").trim()}
                      className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r ${activeCol.accent} px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <Upload className="h-4 w-4" /> Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards grid */}
            {visibleCards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-white/30">
                Nenhum card nesta fase ainda.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCards.map((card) => {
                  const isDragging = drag?.cardId === card.id;
                  const showInsertBar =
                    dragOver?.col === activeCol.id && dragOver?.cardId === card.id && !isDragging;
                  const p = card.priority ?? "med";
                  const ps = PRIORITY_STYLES[p];
                  return (
                    <li key={card.id}>
                      {showInsertBar && (
                        <div className="mb-2 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
                      )}
                      <article
                        draggable
                        onDragStart={() => setDrag({ colId: activeCol.id, cardId: card.id })}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver({ col: activeCol.id, cardId: card.id });
                        }}
                        onDragEnd={() => {
                          setDrag(null);
                          setDragOver(null);
                        }}
                        onClick={() => setEditing({ colId: activeCol.id, card })}
                        className={`group relative cursor-grab overflow-hidden rounded-2xl border bg-gradient-to-b from-white/[0.06] to-white/[0.02] transition-all active:cursor-grabbing ${
                          isDragging
                            ? "border-cyan-400/50 opacity-50"
                            : "border-white/10 hover:border-white/25 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-15px_rgba(34,211,238,0.4)]"
                        }`}
                      >
                        <div className={`absolute left-0 top-0 h-full w-[3px] ${ps.dot}`} />

                        {card.thumbnail && (
                          <img
                            src={card.thumbnail}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-36 w-full object-cover"
                          />
                        )}

                        <div className="p-3 pl-4">
                          <div className="flex items-start gap-2">
                            <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20" />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium leading-snug text-white">
                                {card.title}
                              </h4>
                              {card.note && (
                                <p className="mt-1 line-clamp-2 text-[11px] text-white/50">
                                  {card.note}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCard(activeCol.id, card.id);
                              }}
                              className="opacity-0 transition-opacity group-hover:opacity-100 text-white/30 hover:text-rose-400"
                              aria-label="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {(card.tags?.length || card.due || card.source || card.url) && (
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-5">
                              {card.source && (
                                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                                  {card.source}
                                </span>
                              )}
                              {card.tags?.map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                                >
                                  #{t}
                                </span>
                              ))}
                              {card.due && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {new Date(card.due).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </span>
                              )}
                              {card.url && (
                                <a
                                  href={card.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" /> link
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {editing && (
          <CardEditor
            card={editing.card}
            onClose={() => setEditing(null)}
            onChange={(patch) => updateCard(editing.colId, editing.card.id, patch)}
            onDelete={() => {
              removeCard(editing.colId, editing.card.id);
              setEditing(null);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

/* ───────── Editor modal ───────── */

function CardEditor({
  card,
  onClose,
  onChange,
  onDelete,
}: {
  card: Card;
  onClose: () => void;
  onChange: (patch: Partial<Card>) => void;
  onDelete: () => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onPick = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Selecione uma imagem.");
    if (file.size > MAX_IMG) return alert("Imagem muito grande (máx 8MB).");
    const url = await readFileAsDataURL(file);
    onChange({ thumbnail: url });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0a12] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <input
            value={card.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="flex-1 bg-transparent text-xl font-semibold text-white focus:outline-none"
          />
          <button onClick={onClose} className="ml-3 text-white/40 hover:text-white" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          {card.thumbnail ? (
            <div className="relative">
              <img
                src={card.thumbnail}
                alt=""
                referrerPolicy="no-referrer"
                className="h-44 w-full rounded-xl object-cover border border-white/10"
              />
              <div className="absolute right-2 top-2 flex gap-1.5">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white hover:bg-black/80"
                >
                  Trocar
                </button>
                <button
                  onClick={() => onChange({ thumbnail: undefined })}
                  className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-rose-300 hover:bg-rose-500/40 hover:text-white"
                >
                  Remover
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="grid h-32 w-full place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-xs text-white/40 hover:border-cyan-400/40 hover:text-white"
            >
              <span className="flex flex-col items-center gap-1.5">
                <ImagePlus className="h-5 w-5" />
                Enviar foto
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onPick(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </div>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">Notas</span>
          <textarea
            value={card.note ?? ""}
            onChange={(e) => onChange({ note: e.target.value })}
            rows={3}
            placeholder="Adicione detalhes, dimensões, material…"
            className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 inline-flex items-center gap-1">
              <Flag className="h-3 w-3" /> Prioridade
            </span>
            <div className="mt-1.5 flex gap-1.5">
              {(["low", "med", "high"] as Priority[]).map((p) => {
                const s = PRIORITY_STYLES[p];
                const active = (card.priority ?? "med") === p;
                return (
                  <button
                    key={p}
                    onClick={() => onChange({ priority: p })}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition-all ${
                      active
                        ? `border-white/30 bg-white/10 text-white ring-2 ${s.ring}`
                        : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                    }`}
                  >
                    <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Prazo
            </span>
            <input
              type="date"
              value={card.due ?? ""}
              onChange={(e) => onChange({ due: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-4">
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">Tags</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(card.tags ?? []).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70"
              >
                #{t}
                <button
                  onClick={() => onChange({ tags: (card.tags ?? []).filter((x) => x !== t) })}
                  className="text-white/30 hover:text-rose-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  e.preventDefault();
                  const t = tagInput.trim().replace(/^#/, "");
                  if (!(card.tags ?? []).includes(t)) {
                    onChange({ tags: [...(card.tags ?? []), t] });
                  }
                  setTagInput("");
                }
              }}
              placeholder="+ tag"
              className="rounded-full border border-dashed border-white/15 bg-transparent px-2.5 py-1 text-[11px] text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir card
          </button>
          {card.url && (
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir original
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default KanbanPage;
