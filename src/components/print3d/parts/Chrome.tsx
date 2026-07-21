import { Box, ChevronDown, Search, Bell, MessageSquare, HelpCircle } from "lucide-react";
import { LIME, LIME_DIM, NAV } from "./constants";

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col bg-[#0a0d0c] border-r border-white/[0.05] h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/[0.05]">
        <div
          className="size-9 rounded-lg grid place-items-center"
          style={{
            background: `linear-gradient(135deg, ${LIME}, ${LIME_DIM})`,
            boxShadow: `0 0 18px ${LIME}55`,
          }}
        >
          <Box className="size-5 text-black" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight text-white">PRINT3D</div>
          <div className="text-[9px] tracking-[0.18em] text-white/40 font-medium">
            MANUFATURA DIGITAL
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <div className="px-3 mb-2 text-[10px] tracking-[0.18em] font-semibold text-white/30">
                {group.section.toUpperCase()}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((it, i) => {
                const Icon = it.icon;
                return (
                  <li key={i}>
                    <button
                      className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        it.active
                          ? "text-black"
                          : "text-white/65 hover:text-white hover:bg-white/[0.04]"
                      }`}
                      style={
                        it.active
                          ? { background: LIME, boxShadow: `0 6px 20px -8px ${LIME}aa` }
                          : undefined
                      }
                    >
                      <Icon className="size-[17px]" strokeWidth={2} />
                      <span className="flex-1 text-left">{it.label}</span>
                      {it.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            it.active ? "bg-black/15 text-black" : "bg-[#ff7a45]/20 text-[#ff9466]"
                          }`}
                        >
                          {it.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06]">
        <div className="text-[11px] text-white/50 tracking-wide">Plano Profissional</div>
        <div className="text-[12px] text-white/80 mt-0.5 mb-3">Expira em 25 dias</div>
        <button
          className="w-full py-2 rounded-lg text-[12px] font-bold text-black transition hover:brightness-110"
          style={{ background: LIME, boxShadow: `0 6px 18px -6px ${LIME}aa` }}
        >
          Fazer Upgrade
        </button>
      </div>
    </aside>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0a0d0c]/80 border-b border-white/[0.05] px-6 py-3 flex items-center gap-4">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/35" />
        <input
          placeholder="Buscar pedidos, clientes, peças, orçamentos..."
          className="w-full pl-10 pr-4 py-2 text-[13px] rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-white/35 focus:outline-none focus:border-white/15"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        {[Bell, MessageSquare, HelpCircle].map((Ic, i) => (
          <button
            key={i}
            className="size-9 grid place-items-center rounded-lg hover:bg-white/[0.05] text-white/65 hover:text-white transition relative"
          >
            <Ic className="size-[17px]" />
            {i === 0 && (
              <span
                className="absolute top-2 right-2 size-1.5 rounded-full"
                style={{ background: LIME, boxShadow: `0 0 6px ${LIME}` }}
              />
            )}
          </button>
        ))}
        <div className="ml-2 flex items-center gap-2.5 pl-3 border-l border-white/[0.06]">
          <div
            className="size-9 rounded-full grid place-items-center text-[12px] font-bold text-black"
            style={{ background: `linear-gradient(135deg,${LIME},${LIME_DIM})` }}
          >
            A
          </div>
          <div className="leading-tight">
            <div className="text-[12.5px] font-semibold text-white">Olá, Inova Mundo!</div>
            <div className="text-[10.5px] text-white/45">Administrador</div>
          </div>
          <ChevronDown className="size-3.5 text-white/40" />
        </div>
      </div>
    </header>
  );
}
