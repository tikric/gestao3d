// @ts-nocheck
import React from 'react';
import {
  Briefcase, CalendarDays, ArrowUpRight, MoreHorizontal, SlidersHorizontal,
  ChevronLeft, ChevronRight, Activity, GitPullRequest, Users as UsersIcon,
  Layers, ShoppingBag, Cpu, Package, CreditCard, Wallet, Banknote, Camera,
  TrendingUp, AlertTriangle, DollarSign, Percent, Clock as ClockIcon,
  MapPin, Truck, CheckCircle2,
} from 'lucide-react';

/**
 * Dashboard hero matching the uploaded reference.
 * - Compact inline KPIs next to the big "Dashboard" title
 * - Colorful module cards (Produção, Pedidos, Clientes, Gestão, Histórico, Ajustes)
 * - Mini calendar with the day's revenue inline
 * - Year-profit bars with neon-lime peak
 */

const fmtBRL = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
const fmtBRLk = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${Math.round(v)}`;

export const ReferenceDashboardHero: React.FC<any> = (props) => {
  const {
    monthRevenue = 0, deliveredCount = 0, openCount = 0,
    orders = [], allOrders = [], clients = [], printers = [],
    activePrinters = 0, alertFilaments = 0, filaments = [],
    monthExpense = 0, monthProfitMargin = 0, pendingRevenue = 0, readyToDeliver = 0,
    calendar, monthLabel, onSelectTab,
  } = props;

  // ===== 6 quick KPI pills (no filamentos, no máquinas) =====
  const kpis = [
    { icon: Briefcase,   big: fmtBRLk(monthRevenue),                badge: '+14%', sub: 'Faturamento',  tab: 4 },
    { icon: CalendarDays,big: `+${deliveredCount}`,                 badge: `+${openCount}`, sub: 'Pedidos', tab: 3 },
    { icon: DollarSign,  big: fmtBRLk(monthRevenue - monthExpense), badge: `${monthProfitMargin.toFixed(0)}%`, sub: 'Lucro', tab: 4 },
    { icon: Percent,     big: `${monthProfitMargin.toFixed(1)}%`,   badge: 'mês', sub: 'Margem',         tab: 4 },
    { icon: GitPullRequest, big: String(openCount),                 badge: `${readyToDeliver}✓`, sub: 'Em aberto', tab: 3 },
    { icon: UsersIcon,   big: String(clients.length),               badge: 'base', sub: 'Clientes',     tab: 2 },
  ];

  // ===== Payment methods breakdown =====
  const paymentBuckets = (() => {
    const map: Record<string, { count: number; sum: number }> = {
      'PIX': { count: 0, sum: 0 },
      'CARTÃO': { count: 0, sum: 0 },
      'DINHEIRO': { count: 0, sum: 0 },
      'CONSIGNADO': { count: 0, sum: 0 },
    };
    (orders || []).forEach((o: any) => {
      const key = o.paymentMethod === 'OUTROS' ? 'PIX' : (o.paymentMethod || 'PIX');
      if (!map[key]) map[key] = { count: 0, sum: 0 };
      map[key].count += 1;
      map[key].sum += o.priceCharged || 0;
    });
    return [
      { key: 'PIX',        icon: Wallet,    label: 'PIX',        ...map['PIX'] },
      { key: 'CARTÃO',     icon: CreditCard,label: 'Cartão',     ...map['CARTÃO'] },
      { key: 'DINHEIRO',   icon: Banknote,  label: 'Dinheiro',   ...map['DINHEIRO'] },
      { key: 'CONSIGNADO', icon: ClockIcon, label: 'Consignado', ...map['CONSIGNADO'] },
    ];
  })();

  // ===== In-progress production queue =====
  const queueOrders = (orders || [])
    .filter((o: any) => o.status === 'PRINTING' || o.status === 'QUEUE' || o.status === 'POST_PROCESS')
    .slice(0, 5);

  // ===== Recent orders (top 6) =====
  const recentOrders = [...(orders || [])]
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);
  const recentTotal = recentOrders.reduce((s: number, o: any) => s + (o.priceCharged || 0), 0);

  // ===== Upcoming deliveries =====
  const upcoming = [...(orders || [])]
    .filter((o: any) => o.deliveryDate || o.dueDate)
    .sort((a: any, b: any) => new Date(a.deliveryDate || a.dueDate).getTime() - new Date(b.deliveryDate || b.dueDate).getTime())
    .slice(0, 5);

  // ===== Critical stock =====
  const criticalStock = (filaments || [])
    .filter((f: any) => (f.currentWeight ?? 0) <= (f.alertThreshold ?? 200))
    .slice(0, 5);

  // ===== Year-profit bars =====
  const months = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (7 - i));
    return { key: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''), idx: d.getMonth(), year: d.getFullYear(), value: 0 };
  });
  (allOrders || []).forEach((o: any) => {
    const d = new Date(o.createdAt || Date.now());
    const slot = months.find(m => m.idx === d.getMonth() && m.year === d.getFullYear());
    if (slot) slot.value += o.priceCharged || 0;
  });
  const hasYearData = months.some(m => m.value > 0);
  const maxBar = Math.max(...months.map(m => m.value), 1);
  const peakIdx = months.reduce((mx, m, i, a) => (m.value > a[mx].value ? i : mx), 0);

  const statusMap: Record<string, { label: string; color: string }> = {
    PRINTING: { label: 'Imprimindo', color: '#A5D84B' },
    QUEUE: { label: 'Fila', color: '#5A8FE0' },
    POST_PROCESS: { label: 'Acabamento', color: '#E0C04B' },
    READY: { label: 'Pronto', color: '#A5D84B' },
    DELIVERED: { label: 'Entregue', color: '#7DE08F' },
    CANCELED: { label: 'Cancelado', color: '#E05A5A' },
  };
  const fmtDateTime = (d: any) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' · ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // ===== Calendar =====
  const _now = new Date();
  const _safeCalendar = calendar || {
    totalDays: new Date(_now.getFullYear(), _now.getMonth() + 1, 0).getDate(),
    firstDayIndex: new Date(_now.getFullYear(), _now.getMonth(), 1).getDay(),
    getDaySales: () => 0,
  };
  const { totalDays, firstDayIndex, getDaySales } = _safeCalendar;
  const cells: Array<{ day: number | null; sales: number }> = [];
  for (let i = 0; i < firstDayIndex; i++) cells.push({ day: null, sales: 0 });
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d, sales: getDaySales(d) });
  while (cells.length % 7 !== 0) cells.push({ day: null, sales: 0 });

  return (
    <section className="relative">
      {/* ===== TOP: title + 8 compact KPI pills (lime accent, moved UP) ===== */}
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <h1
          className="font-black tracking-tight text-white"
          style={{ fontSize: 'clamp(1.6rem, 1.2rem + 1.6vw, 2.4rem)', lineHeight: 0.95, letterSpacing: '-0.03em' }}
        >
          Dashboard
          <span className="ml-2 text-xs font-medium text-white/40">{`{${monthLabel}}`}</span>
        </h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mb-5">
        {kpis.map((k, i) => (
          <button key={i} onClick={() => onSelectTab(k.tab)} className="text-left">
            <CompactKpi icon={<k.icon className="h-4 w-4" />} big={k.big} badge={k.badge} sub={k.sub} />
          </button>
        ))}
      </div>

      {/* ===== ROW 1: Production Queue (left) + Yearly profit chart (right) ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 mb-5">
        <Panel>
          <PanelHead title="Projetos em Andamento" tag={`{${queueOrders.length}}`} onOpen={() => onSelectTab(1)} />
          {queueOrders.length === 0 ? (
            <div className="text-center text-white/40 text-xs py-8">Sem produção no momento</div>
          ) : (
            <div className="space-y-3">
              {queueOrders.map((o: any, i: number) => {
                const prog = Math.round((o.printingProgress || 0) * 100);
                const statusColor = o.status === 'PRINTING' ? '#A5D84B' : o.status === 'POST_PROCESS' ? '#E0C04B' : '#5A8FE0';
                return (
                  <div key={o.id} className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full grid place-items-center bg-white/5 border border-white/10 text-[10px] font-bold text-white/70 shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <div className="text-[13px] font-bold text-white truncate">{o.itemName}</div>
                        <div className="text-[10px] text-white/45 shrink-0 tabular">{o.clientName}</div>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-white/[0.04] border border-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(prog, 2)}%`,
                            background: `linear-gradient(90deg, ${statusColor} 0%, #C7F26B 100%)`,
                            boxShadow: `0 0 14px ${statusColor}55`,
                          }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="uppercase tracking-wider text-white/40">{o.status}</span>
                        <span className="font-black tabular text-[#A5D84B]">{prog}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Faturamento do ano</h2>
              <span className="text-xs text-white/40">{`{${monthProfitMargin.toFixed(0)}%}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconBtn><SlidersHorizontal className="h-4 w-4" /></IconBtn>
              <IconBtn><ArrowUpRight className="h-4 w-4" /></IconBtn>
            </div>
          </div>
          <div className="relative">
            {hasYearData ? (
              <div className="absolute -top-1 z-10 px-2 py-0.5 rounded-md bg-[#A5D84B] text-black text-[10px] font-bold" style={{ left: `${(peakIdx + 0.5) * (100 / months.length)}%`, transform: 'translateX(-50%)' }}>
                {fmtBRLk(months[peakIdx].value)}
              </div>
            ) : (
              <div className="absolute inset-0 z-10 grid place-items-center text-white/40 text-xs">
                Sem faturamento registrado no período
              </div>
            )}
            <div className="grid grid-cols-8 gap-2 h-[180px] items-end mt-4">
              {months.map((m, i) => {
                const isPeak = i === peakIdx;
                const h = Math.max(14, (m.value / maxBar) * 100);
                return (
                  <div key={i} className="relative h-full flex flex-col items-stretch justify-end">
                    <div
                      className="w-full rounded-[12px] transition-all"
                      style={{
                        height: `${h}%`,
                        background: isPeak
                          ? 'linear-gradient(180deg, #C7F26B 0%, #A5D84B 100%)'
                          : 'linear-gradient(180deg, rgba(165,216,75,0.12) 0%, rgba(165,216,75,0.04) 100%)',
                        border: isPeak ? '1px solid rgba(199,242,107,0.6)' : '1px solid rgba(165,216,75,0.10)',
                        boxShadow: isPeak
                          ? '0 0 40px -4px rgba(165,216,75,0.55), inset 0 1px 0 rgba(255,255,255,0.3)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                      }}
                    />
                    <div className="mt-1 text-center text-[9px] font-semibold text-white/45 uppercase">{m.key}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      {/* ===== ROW 2: Recent orders (with summary) + Upcoming deliveries ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 mb-5">
        <Panel>
          <PanelHead title="Pedidos Recentes" tag={`{${recentOrders.length}}`} onOpen={() => onSelectTab(3)} />
          {/* Summary header */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <SummaryStat label="Total" value={fmtBRLk(recentTotal)} accent />
            <SummaryStat label="Pedidos" value={String(recentOrders.length)} />
            <SummaryStat label="Em aberto" value={String(openCount)} />
            <SummaryStat label="Entregues" value={String(deliveredCount)} />
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center text-white/40 text-xs py-6">Sem pedidos recentes</div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              <li className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-1.5 text-[9px] uppercase tracking-wider text-white/40 font-bold">
                <span>Produto</span>
                <span className="text-center">Qtd</span>
                <span className="text-right">Hora</span>
                <span className="text-right">Status</span>
              </li>
              {recentOrders.map((o: any) => {
                const s = statusMap[o.status] || { label: o.status, color: '#888' };
                return (
                  <li key={o.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg grid place-items-center bg-white/[0.03] border border-white/[0.06] shrink-0">
                        <ShoppingBag className="h-3.5 w-3.5 text-[#A5D84B]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-white truncate">{o.itemName}</div>
                        <div className="text-[10px] text-white/45 truncate">{o.clientName}</div>
                      </div>
                    </div>
                    <div className="text-center text-[12px] font-bold tabular text-white shrink-0">×{o.quantity ?? 1}</div>
                    <div className="text-right text-[11px] tabular text-white/70 shrink-0">{fmtDateTime(o.createdAt)}</div>
                    <span className="text-right text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-full border shrink-0" style={{ color: s.color, borderColor: `${s.color}55`, background: `${s.color}15` }}>
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHead title="Próximas Entregas" tag={`{${upcoming.length}}`} onOpen={() => onSelectTab(3)} />
          {upcoming.length === 0 ? (
            <div className="text-center text-white/40 text-xs py-8">Nenhuma entrega agendada</div>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((o: any) => (
                <div key={o.id} className="flex gap-3 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="h-9 w-9 rounded-lg grid place-items-center bg-[#A5D84B]/10 border border-[#A5D84B]/25 shrink-0">
                    <Truck className="h-4 w-4 text-[#A5D84B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-white truncate">{o.clientName || o.itemName}</div>
                    <div className="flex items-center gap-1 text-[10px] text-white/55 mt-0.5">
                      <ClockIcon className="h-3 w-3" />
                      <span className="tabular">{fmtDateTime(o.deliveryDate || o.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/45 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{o.deliveryAddress || o.clientAddress || 'Retirada no local'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ===== ROW 3: Printer monitor + Critical stock + Calendar + Payments ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 mb-5">
        <Panel>
          <PanelHead title="Monitor das Máquinas" tag={`{${activePrinters}/${printers.length}}`} onOpen={() => onSelectTab(1)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(printers || []).slice(0, 4).map((p: any) => {
              const job = (orders || []).find((o: any) => o.assignedPrinterId === p.id && o.status === 'PRINTING');
              const prog = job ? Math.round((job.printingProgress || 0) * 100) : (p.printProgress || 0);
              const isPrinting = p.status === 'PRINTING';
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectTab(1)}
                  className="flex gap-3 p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-[#A5D84B]/30 hover:bg-white/[0.04] transition text-left"
                >
                  <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-black/40 border border-white/5 grid place-items-center relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <Camera className="h-6 w-6 text-white/25" />
                    )}
                    <span className={`absolute top-1 right-1 h-2 w-2 rounded-full ${isPrinting ? 'bg-[#A5D84B] animate-pulse shadow-[0_0_8px_#A5D84B]' : 'bg-white/30'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-sm font-bold text-white truncate">{p.name}</div>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 shrink-0">{p.model}</span>
                    </div>
                    <div className="text-[10px] text-white/45 truncate mb-2">
                      {isPrinting ? (job?.itemName || 'Imprimindo…') : p.status === 'MAINTENANCE' ? 'Manutenção' : 'Disponível'}
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, background: 'linear-gradient(90deg, #A5D84B 0%, #C7F26B 100%)', boxShadow: '0 0 12px rgba(165,216,75,0.45)' }} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-[#A5D84B] font-bold tabular">{prog}%</span>
                      {p.nozzleTemp ? <span className="text-white/45">N {p.nozzleTemp}° · M {p.bedTemp || 0}°</span> : <span className="text-white/30">—</span>}
                    </div>
                  </div>
                </button>
              );
            })}
            {printers.length === 0 && (
              <div className="col-span-full text-center text-white/40 text-xs py-6">Nenhuma máquina cadastrada</div>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Estoque Crítico" tag={`{${criticalStock.length}}`} onOpen={() => onSelectTab(4)} />
          {criticalStock.length === 0 ? (
            <div className="flex flex-col items-center text-white/40 text-xs py-6 gap-2">
              <CheckCircle2 className="h-6 w-6 text-[#A5D84B]/60" />
              Estoque saudável
            </div>
          ) : (
            <div className="space-y-2">
              {criticalStock.map((f: any) => {
                const pct = Math.min(100, Math.max(2, ((f.currentWeight ?? 0) / Math.max(1, f.totalWeight ?? 1000)) * 100));
                return (
                  <div key={f.id} className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: f.colorHex || '#A5D84B' }} />
                        <span className="text-[12px] font-bold text-white truncate">{f.material} {f.color}</span>
                      </div>
                      <AlertTriangle className="h-3.5 w-3.5 text-[#E0C04B] shrink-0" />
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct < 20 ? '#E05A5A' : '#E0C04B' }} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] tabular">
                      <span className="text-white/55">{f.currentWeight ?? 0}g restantes</span>
                      <span className="text-white/40">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* ===== ROW 4: Payments + Calendar ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <Panel>
          <PanelHead title="Meios de Pagamento" tag={`{${orders.length}}`} onOpen={() => onSelectTab(3)} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {paymentBuckets.map((p) => (
              <div key={p.key} className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-[#A5D84B]/25 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <p.icon className="h-4 w-4 text-[#A5D84B]" />
                  <span className="text-[9px] uppercase tracking-wider text-white/40">{p.label}</span>
                </div>
                <div className="text-[15px] font-black text-white tabular leading-none">{fmtBRLk(p.sum)}</div>
                <div className="text-[10px] text-white/45 mt-0.5">{p.count} pedidos</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Calendário" tag={`{${monthLabel}}`} />
          <div className="grid grid-cols-7 gap-1.5">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
              <div key={i} className="text-center text-[9px] font-bold text-white/30 uppercase pb-1">{d}</div>
            ))}
            {cells.map((c, i) => {
              const hot = c.sales > 0;
              return (
                <div key={i} className={`relative aspect-square rounded-lg p-1 flex flex-col justify-between text-[10px] ${c.day === null ? 'opacity-20' : ''}`} style={{ background: hot ? 'rgba(165,216,75,0.10)' : 'rgba(255,255,255,0.015)', border: hot ? '1px solid rgba(165,216,75,0.32)' : '1px solid rgba(255,255,255,0.04)' }}>
                  <span className={hot ? 'text-white font-bold' : 'text-white/55'}>{c.day ?? ''}</span>
                  {hot && <span className="text-[9px] font-bold leading-none text-[#C7F26B] tabular truncate">{c.sales >= 1000 ? `${(c.sales / 1000).toFixed(1)}k` : `${Math.round(c.sales)}`}</span>}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </section>
  );
};

function Panel({ children }: any) {
  return (
    <div
      className="relative rounded-[24px] p-5 border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      style={{ background: 'radial-gradient(120% 100% at 0% 0%, rgba(40,40,40,0.25) 0%, rgba(10,10,10,0.4) 55%, rgba(0,0,0,0.35) 100%)' }}
    >
      {children}
    </div>
  );
}

function PanelHead({ title, tag, onOpen }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-baseline gap-2 min-w-0">
        <h2 className="text-sm sm:text-base font-bold text-white truncate tracking-tight">{title}</h2>
        <span className="text-xs text-white/40">{tag}</span>
      </div>
      <div className="flex items-center gap-1 text-white/50 shrink-0">
        <IconBtn><MoreHorizontal className="h-4 w-4" /></IconBtn>
        <IconBtn><SlidersHorizontal className="h-4 w-4" /></IconBtn>
        {onOpen && <IconBtn onClick={onOpen}><ArrowUpRight className="h-4 w-4" /></IconBtn>}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick }: any) {
  return (
    <button onClick={onClick} className="h-7 w-7 grid place-items-center rounded-full text-white/50 hover:bg-white/5 hover:text-white transition">
      {children}
    </button>
  );
}

function CompactKpi({ icon, big, badge, sub }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07]">
      <div className="h-7 w-7 rounded-full grid place-items-center bg-white/[0.04] border border-white/[0.08] text-white">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-[14px] font-bold tabular">{big}</span>
          <span className="px-1.5 py-px rounded-full text-[9px] font-bold bg-[#A5D84B]/15 text-[#A5D84B] border border-[#A5D84B]/30">{badge}</span>
        </div>
        <div className="text-[9px] uppercase tracking-wider text-white/40">{sub}</div>
      </div>
    </div>
  );
}

function StatRow({ label, value, delta }: any) {
  return (
    <div className="mt-4">
      <div className="text-[11px] text-white/55 font-medium">{label}</div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <div className="text-[22px] font-bold tabular text-[#A5D84B]">{value}</div>
        <div className="text-[10px] text-white/40">{delta}</div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent }: any) {
  return (
    <div className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="text-[9px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`text-[15px] font-black tabular leading-tight ${accent ? 'text-[#A5D84B]' : 'text-white'}`}>{value}</div>
    </div>
  );
}

export default ReferenceDashboardHero;