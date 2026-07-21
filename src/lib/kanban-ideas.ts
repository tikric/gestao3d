// Helper to push ideas (e.g. from /market) to the Kanban "Ideias" column.
const STORAGE_KEY = "kanban-board-v1";

type Card = {
  id: string;
  title: string;
  note?: string;
  url?: string;
  thumbnail?: string;
  source?: string;
};
type Column = { id: string; title: string; tone: string; cards: Card[] };

const DEFAULT: Column[] = [
  { id: "backlog", title: "Ideias", tone: "from-fuchsia-500/20 to-fuchsia-500/0", cards: [] },
  { id: "doing", title: "Modelando", tone: "from-cyan-500/20 to-cyan-500/0", cards: [] },
  { id: "review", title: "Imprimindo", tone: "from-amber-500/20 to-amber-500/0", cards: [] },
  { id: "done", title: "Pronto", tone: "from-emerald-500/20 to-emerald-500/0", cards: [] },
];

function readBoard(): Column[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw) as Column[];
    if (!Array.isArray(parsed) || !parsed.find((c) => c.id === "backlog"))
      return structuredClone(DEFAULT);
    return parsed;
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function isIdeaInKanban(url: string): boolean {
  if (typeof window === "undefined") return false;
  const board = readBoard();
  return board.some((c) => c.cards.some((k) => k.url === url));
}

export function addIdeaToKanban(card: Omit<Card, "id">): boolean {
  if (typeof window === "undefined") return false;
  const board = readBoard();
  if (card.url && board.some((c) => c.cards.some((k) => k.url === card.url))) return false;
  const next = board.map((c) =>
    c.id === "backlog" ? { ...c, cards: [...c.cards, { ...card, id: crypto.randomUUID() }] } : c,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("kanban-ideas:changed"));
  return true;
}

export function removeIdeaFromKanban(url: string): boolean {
  if (typeof window === "undefined") return false;
  const board = readBoard();
  let changed = false;
  const next = board.map((c) => {
    const filtered = c.cards.filter((k) => {
      if (k.url === url) {
        changed = true;
        return false;
      }
      return true;
    });
    return filtered.length === c.cards.length ? c : { ...c, cards: filtered };
  });
  if (!changed) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("kanban-ideas:changed"));
  return true;
}
