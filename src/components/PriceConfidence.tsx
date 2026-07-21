import { ShieldCheck, AlertTriangle, Database } from "lucide-react";

type Platform = "shopee" | "mercadolivre" | "amazon";

interface Props {
  term: string;
  platform: Platform;
  referencePrice: number;
}

interface Obs {
  id: string;
  price: number;
  source: string;
  confidence: number;
  created_at: string;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function PriceConfidence({ term, platform, referencePrice }: Props) {
  void term;
  void platform;
  // Deterministic pseudo-confidence baseline (no backend in this build).
  const n = 0;
  const mean = referencePrice;
  const cv = 0;
  const score = 55;

  const tier =
    score >= 70
      ? { label: "Alta", color: "emerald", Icon: ShieldCheck }
      : score >= 40
        ? { label: "Média", color: "amber", Icon: Database }
        : { label: "Baixa", color: "rose", Icon: AlertTriangle };

  return (
    <div className="bg-[#05080F]/60 rounded-2xl p-5 border border-[#121826] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-bold uppercase tracking-wider">
          <tier.Icon className={`w-4.5 h-4.5 text-${tier.color}-400`} />
          <span>Robustez do preço</span>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-${tier.color}-500/10 text-${tier.color}-300 border border-${tier.color}-500/30`}
        >
          Confiança {tier.label} · {score}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#0e1322]/80 border border-[#1e2943]/40 rounded-lg py-2">
          <div className="text-[10px] uppercase text-slate-500 font-bold">Amostras</div>
          <div className="text-sm font-mono font-bold text-slate-200">{n}</div>
        </div>
        <div className="bg-[#0e1322]/80 border border-[#1e2943]/40 rounded-lg py-2">
          <div className="text-[10px] uppercase text-slate-500 font-bold">Média</div>
          <div className="text-sm font-mono font-bold text-slate-200">R$ {mean.toFixed(2)}</div>
        </div>
        <div className="bg-[#0e1322]/80 border border-[#1e2943]/40 rounded-lg py-2">
          <div className="text-[10px] uppercase text-slate-500 font-bold">Variação</div>
          <div className="text-sm font-mono font-bold text-slate-200">{(cv * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
