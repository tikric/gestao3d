import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  Package,
  Printer as PrinterIcon,
  ListOrdered,
  Radio,
  Box,
  Layers,
  Wrench,
  Truck,
  Wallet,
  Receipt,
  BarChart3,
  TrendingDown,
  Settings,
} from "lucide-react";

export const LIME = "#a3e635";
export const LIME_DIM = "#84cc16";

export const COLOR_HEX: Record<string, string> = {
  preto: "#111",
  black: "#111",
  branco: "#f5f5f5",
  white: "#f5f5f5",
  cinza: "#9ca3af",
  gray: "#9ca3af",
  vermelho: "#ef4444",
  red: "#ef4444",
  laranja: "#f97316",
  orange: "#f97316",
  amarelo: "#facc15",
  yellow: "#facc15",
  verde: "#22c55e",
  green: "#22c55e",
  azul: "#3b82f6",
  blue: "#3b82f6",
  roxo: "#a855f7",
  purple: "#a855f7",
  rosa: "#ec4899",
  pink: "#ec4899",
  marrom: "#92400e",
  brown: "#92400e",
  dourado: "#d4a017",
  gold: "#d4a017",
  prata: "#c0c0c0",
  silver: "#c0c0c0",
  transparente: "rgba(255,255,255,0.25)",
  transparent: "rgba(255,255,255,0.25)",
};

export const KPI_TONES = [
  { c: "#a3e635", name: "lime" },
  { c: "#f0c674", name: "gold" },
  { c: "#60a5fa", name: "blue" },
  { c: "#a78bfa", name: "purple" },
  { c: "#34d399", name: "emerald" },
  { c: "#fb923c", name: "orange" },
];

export const STATUS_LABEL: Record<string, string> = {
  PRINTING: "Imprimindo",
  IDLE: "Ociosa",
  MAINTENANCE: "Manutenção",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  WAITING: "Ag. Arquivo",
  QUEUE: "Aguardando Aceite",
  PRINTING: "Imprimindo",
  POST_PROCESS: "Acabamento",
  PACKING: "Pronto para Entrega",
  READY: "Pronto",
  DELIVERED: "Entregue",
};

export const ORDER_STATUS_PILL_CLASS: Record<string, string> = {
  "Ag. Arquivo": "bg-amber-400/10 text-amber-300 border-amber-400/20",
  "Aguardando Aceite": "bg-white/[0.05] text-white/65 border-white/10",
  Imprimindo: "bg-violet-400/10 text-violet-300 border-violet-400/20",
  Acabamento: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  "Pronto para Entrega": "bg-fuchsia-400/10 text-fuchsia-300 border-fuchsia-400/20",
  Pronto: "bg-blue-400/10 text-blue-300 border-blue-400/20",
  Entregue: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
};

export const GEOCODE_CACHE_KEY = "print3d_geocode_cache_v3";
export const LOCAL_CATALOG_KEY = "bambuzau_local_catalog_production";

export const NAV: Array<{
  section?: string;
  items: Array<{ icon: any; label: string; badge?: string; active?: boolean }>;
}> = [
  { items: [{ icon: LayoutDashboard, label: "Dashboard", active: true }] },
  {
    section: "Principal",
    items: [
      { icon: ShoppingCart, label: "Pedidos", badge: "24" },
      { icon: FileText, label: "Orçamentos" },
      { icon: Users, label: "Clientes" },
      { icon: Package, label: "Produtos" },
    ],
  },
  {
    section: "Produção",
    items: [
      { icon: PrinterIcon, label: "Impressoras", badge: "6/7" },
      { icon: ListOrdered, label: "Fila de Impressão" },
      { icon: Radio, label: "Impressão ao Vivo" },
      { icon: Box, label: "Modelos 3D" },
    ],
  },
  {
    section: "Estoque",
    items: [
      { icon: Layers, label: "Filamentos", badge: "12" },
      { icon: Wrench, label: "Peças" },
      { icon: Truck, label: "Fornecedores" },
    ],
  },
  {
    section: "Financeiro",
    items: [
      { icon: Wallet, label: "Financeiro" },
      { icon: Receipt, label: "Faturamento" },
      { icon: BarChart3, label: "Relatórios" },
      { icon: TrendingDown, label: "Gastos" },
    ],
  },
  { section: "Configurações", items: [{ icon: Settings, label: "Configurações" }] },
];
