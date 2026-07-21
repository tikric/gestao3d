/**
 * Pure, framework-agnostic helpers for production order status.
 * Extracted from ProductionTab.tsx — single responsibility, no side effects.
 */

export type OrderStatus =
  | "WAITING" | "QUEUE" | "PRINTING" | "POST_PROCESS"
  | "PACKING" | "READY" | "DELIVERED";

const STATUS_LABEL: Record<string, string> = {
  WAITING: "Ag. Arquivo",
  QUEUE: "Aguardando Aceite",
  PRINTING: "Imprimindo",
  POST_PROCESS: "Acabamento",
  PACKING: "Pronto para Entrega",
  READY: "Pronto",
  DELIVERED: "Entregue",
};

const NEXT_ACTION_LABEL: Record<string, string> = {
  WAITING: "Estudo/Fila",
  QUEUE: "Iniciar Impressão",
  PRINTING: "Ir p/ Acabamento",
  POST_PROCESS: "Ir p/ Embalando",
  PACKING: "Marcar Pronto",
  READY: "Marcar Entregue",
};

const NEXT_STATUS: Record<string, string> = {
  WAITING: "QUEUE",
  QUEUE: "PRINTING",
  PRINTING: "POST_PROCESS",
  POST_PROCESS: "PACKING",
  PACKING: "READY",
  READY: "DELIVERED",
};

const STATUS_COLOR: Record<string, string> = {
  WAITING: "#90A4AE",
  QUEUE: "var(--brand-accent)",
  PRINTING: "var(--brand-primary)",
  POST_PROCESS: "var(--brand-accent)",
  PACKING: "#a855f7",
  READY: "#3b82f6",
  DELIVERED: "#10b981",
};

const STATUS_PROGRESS_BASE: Record<string, number> = {
  WAITING: 15, QUEUE: 35, POST_PROCESS: 85, PACKING: 93, READY: 100,
};

export const getStatusLabel = (status: string): string =>
  STATUS_LABEL[status] ?? status;

export const getNextStatusActionLabel = (status: string): string =>
  NEXT_ACTION_LABEL[status] ?? "";

export const getNextStatusValue = (status: string): string | null =>
  NEXT_STATUS[status] ?? null;

export const getStatusColor = (status: string): string =>
  STATUS_COLOR[status] ?? "var(--brand-muted)";

export interface DelayCategory {
  level: "GREEN" | "YELLOW" | "ORANGE" | "CRITICAL";
  color: string;
  bg: string;
  border: string;
  textClass?: string;
  label: string;
}

const DELAY_TIERS: Array<{ minHrs: number; cat: DelayCategory }> = [
  { minHrs: 24, cat: { level: "CRITICAL", color: "#ef4444", bg: "bg-red-500/10",    border: "border-red-500",    textClass: "text-red-400",     label: "CRÍTICO (+24h) 🚨" } },
  { minHrs: 15, cat: { level: "ORANGE",   color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500", textClass: "text-orange-400",  label: "ATENÇÃO (15h) ⚠️" } },
  { minHrs:  8, cat: { level: "YELLOW",   color: "#eab308", bg: "bg-yellow-500/10", border: "border-yellow-500", textClass: "text-yellow-400",  label: "ATENÇÃO (8h) ⏳" } },
];

const DELAY_GREEN: DelayCategory = {
  level: "GREEN", color: "#10b981",
  bg: "bg-emerald-500/10", border: "border-emerald-500/20",
  textClass: "text-emerald-400", label: "Verde (Normal)",
};

const DELAY_DONE: DelayCategory = {
  level: "GREEN", color: "#10b981",
  bg: "bg-emerald-500/10", border: "border-emerald-500/30",
  label: "No Prazo",
};

export const getDelayCategory = (createdAt: number, status: string): DelayCategory => {
  if (status === "DELIVERED" || status === "READY") return DELAY_DONE;
  const elapsedHrs = (Date.now() - createdAt) / (1000 * 3600);
  const tier = DELAY_TIERS.find((t) => elapsedHrs >= t.minHrs);
  return tier ? tier.cat : DELAY_GREEN;
};

/**
 * Progress percentage for a production order.
 * PRINTING blends the live printer progress (0..1) into the 40..80 band.
 */
export const getProgressPercentage = (
  status: string,
  printingProgress = 0,
): number => {
  if (status === "PRINTING") {
    const clamped = Math.max(0, Math.min(1, printingProgress));
    return Math.min(80, Math.max(40, 40 + Math.round(clamped * 40)));
  }
  return STATUS_PROGRESS_BASE[status] ?? 0;
};