import { useEffect, useRef, useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { KPI_TONES, LIME, ORDER_STATUS_PILL_CLASS } from "./constants";

/* ---------- Card (Obsidian Glass) ---------- */
export function Card({
  children,
  className = "",
  onClick,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: string;
}) {
  const tone = glow || LIME;
  return (
    <div
      className={`group relative p-[1px] rounded-2xl bg-white/10 transition-all duration-500 hover:scale-[1.005] ${className}`}
      onClick={onClick}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3 rounded-2xl blur-2xl opacity-50 group-hover:opacity-90 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at center, ${tone}33, transparent 70%)` }}
      />
      <div
        className="relative overflow-hidden rounded-[15px] p-5 backdrop-blur-xl border border-white/10 h-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%), #0a0d0c",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 60px -30px rgba(0,0,0,0.85)",
        }}
      >
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: tone }}
        />
        <div className="relative h-full">{children}</div>
      </div>
    </div>
  );
}

/* ---------- ScrollHint ---------- */
export function ScrollHint({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setHasMore(el.scrollHeight - el.clientHeight - el.scrollTop > 4);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, []);
  return (
    <div className={`relative flex-1 min-h-0 ${className}`}>
      <div ref={ref} className="h-full overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {children}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => ref.current?.scrollBy({ top: 120, behavior: "smooth" })}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 size-6 grid place-items-center rounded-full bg-white/[0.08] border border-white/15 text-white/75 hover:text-white hover:bg-white/[0.14] backdrop-blur transition"
          aria-label="Mostrar mais"
        >
          <ChevronDown className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/* ---------- StatusPill ---------- */
export function StatusPill({ s }: { s: string }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ORDER_STATUS_PILL_CLASS[s] || ""}`}
    >
      {s}
    </span>
  );
}

/* ---------- Kpi ---------- */
export function Kpi({
  label,
  value,
  delta,
  Icon,
  tone = 0,
}: {
  label: string;
  value: string;
  delta: string;
  Icon: any;
  tone?: number;
}) {
  const t = KPI_TONES[tone % KPI_TONES.length].c;
  return (
    <Card glow={t} className="overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 font-medium">
            {label}
          </div>
          <div
            className="mt-3 text-[28px] font-bold tracking-tight text-white tabular-nums"
            style={{ textShadow: `0 0 24px ${t}33` }}
          >
            {value}
          </div>
        </div>
        <div
          className="size-10 rounded-xl grid place-items-center border"
          style={{
            background: `radial-gradient(120% 120% at 0% 0%, ${t}30 0%, ${t}08 60%, transparent 100%)`,
            borderColor: `${t}33`,
            boxShadow: `0 8px 24px -10px ${t}55, inset 0 0 0 1px rgba(255,255,255,0.03)`,
          }}
        >
          <Icon className="size-[18px]" style={{ color: t }} />
        </div>
      </div>
      <div
        className="mt-4 pt-3 border-t border-white/[0.05] text-[11px] flex items-center gap-1.5"
        style={{ color: t }}
      >
        <TrendingUp className="size-3" />
        <span className="font-semibold">{delta}</span>
        <span className="text-white/40 font-normal">vs ontem</span>
      </div>
    </Card>
  );
}
