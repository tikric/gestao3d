export type Printer = {
  id: string;
  name: string;
  type: "octoprint" | "moonraker";
  url: string;
  apiKey: string;
  createdAt: number;
};

export type SendHistoryItem = {
  id: string;
  modelId: string;
  modelName: string;
  printerId: string;
  printerName: string;
  status: "success" | "error";
  message?: string;
  startedPrint?: boolean;
  at: number;
};

const P_KEY = "catalog-printers-v1";
const H_KEY = "catalog-send-history-v1";

const isClient = () => typeof window !== "undefined";

export function listPrinters(): Printer[] {
  if (!isClient()) return [];
  try {
    return JSON.parse(localStorage.getItem(P_KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePrinters(p: Printer[]) {
  if (!isClient()) return;
  localStorage.setItem(P_KEY, JSON.stringify(p));
}

export function upsertPrinter(p: Printer) {
  const all = listPrinters();
  const i = all.findIndex((x) => x.id === p.id);
  if (i >= 0) all[i] = p;
  else all.push(p);
  savePrinters(all);
}

export function deletePrinter(id: string) {
  savePrinters(listPrinters().filter((p) => p.id !== id));
}

export function listHistory(): SendHistoryItem[] {
  if (!isClient()) return [];
  try {
    return JSON.parse(localStorage.getItem(H_KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushHistory(item: SendHistoryItem) {
  const all = listHistory();
  all.unshift(item);
  if (!isClient()) return;
  localStorage.setItem(H_KEY, JSON.stringify(all.slice(0, 200)));
}
