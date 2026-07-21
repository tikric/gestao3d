// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { PrintOrder } from '../types';
import { 
  Search, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Calendar, 
  Download, 
  User, 
  Clock, 
  LayoutList, 
  Plus, 
  CheckCircle,
  FileText,
  Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { HistoricoDashboard } from './HistoricoDashboard';

interface SoldTabProps {
  orders: PrintOrder[];
  clients: Array<{ id: number; name: string }>;
  onDeleteOrder?: (id: number) => void;
}

export const SoldTab: React.FC<SoldTabProps> = ({ orders, clients, onDeleteOrder }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'MANUAL' | 'SHOPEE' | 'MERCADO_LIVRE' | 'NUVEMSHOP' | 'AMAZON' | 'TIKTOK_SHOP'>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'DINHEIRO' | 'CARTÃO' | 'CONSIGNADO' | 'OUTROS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAGO' | 'PENDENTE'>('ALL');

  // Filter only DELIVERED orders
  const safeOrders = orders || [];
  const soldOrders = safeOrders.filter(o => o.status === 'DELIVERED');

  const filteredSold = soldOrders.filter(o => {
    const matchesPlatform = platformFilter === 'ALL' || o.platformSource === platformFilter;
    const matchesMethod = methodFilter === 'ALL' || (o.paymentMethod || 'DINHEIRO') === methodFilter;
    const matchesStatus = statusFilter === 'ALL' || (o.paymentStatus || 'PENDENTE') === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      o.itemName.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q) ||
      o.filamentType.toLowerCase().includes(q) ||
      o.filamentColor.toLowerCase().includes(q) ||
      (o.platformOrderId || '').toLowerCase().includes(q);

    return matchesPlatform && matchesMethod && matchesStatus && matchesSearch;
  });

  // Financial Metrics
  const totalSales = soldOrders.reduce((sum, o) => sum + o.priceCharged, 0);
  const totalItems = soldOrders.reduce((sum, o) => sum + o.quantity, 0);
  const averageTicket = soldOrders.length > 0 ? totalSales / soldOrders.length : 0;
  const totalWeightDelivered = soldOrders.reduce((sum, o) => sum + (o.weightGrams * o.quantity), 0);
  const totalHoursPrinted = soldOrders.reduce((sum, o) => sum + (o.printTimeHours * o.quantity), 0);

  // Platform Metrics
  const platformCounts = soldOrders.reduce((acc, o) => {
    acc[o.platformSource] = (acc[o.platformSource] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExportPDFReport = () => {
    const doc = new jsPDF();
    const primaryColor = '#5E8B61'; // Forest green or theme default

    // Header Backing
    doc.setFillColor(15, 18, 16);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('GESTÃO 3D - RELATORIO DE VENDAS', 15, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 33);

    // Summary Cards
    doc.setFillColor(241, 244, 238);
    doc.rect(15, 48, 180, 28, 'F');
    
    doc.setTextColor(12, 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Faturamento Total:', 20, 56);
    doc.text(`R$ ${totalSales.toFixed(2)}`, 20, 64);

    doc.text('Total Entregue:', 85, 56);
    doc.text(`${totalItems} itens`, 85, 64);

    doc.text('Tamanho Médio Pedido:', 140, 56);
    doc.text(`R$ ${averageTicket.toFixed(2)}`, 140, 64);

    // Table Header
    doc.setFillColor(35, 43, 39);
    doc.rect(15, 84, 180, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Item / Pecas', 18, 89.5);
    doc.text('Cliente', 85, 89.5);
    doc.text('Canal', 135, 89.5);
    doc.text('Preco Cobrado', 168, 89.5);

    // List of Sold items
    let y = 97;
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');

    filteredSold.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Zebra formatting
      if (index % 2 === 0) {
        doc.setFillColor(245, 247, 243);
        doc.rect(15, y - 5, 180, 8, 'F');
      }

      doc.text(item.itemName.substring(0, 32), 18, y);
      doc.text(item.clientName.substring(0, 24), 85, y);
      doc.text(item.platformSource, 135, y);
      doc.text(`R$ ${item.priceCharged.toFixed(2)}`, 168, y);

      y += 8;
    });

    doc.save(`relatorio_vendas_gestao3d.pdf`);
  };

  useEffect(() => {
    const handler = () => handleExportPDFReport();
    window.addEventListener('export-sales-report', handler);
    return () => window.removeEventListener('export-sales-report', handler);
  });

  const handleExportReceipt = (item: PrintOrder) => {
    const doc = new jsPDF();
    
    // Aesthetic Styling
    doc.setFillColor(12, 14, 13);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('GESTÃO 3D - RECIBO DE COMPRA', 15, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Identificador da Venda: #VND-${item.id}`, 15, 35);
    
    // Client section
    doc.setTextColor(12, 14, 13);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', 15, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${item.clientName}`, 15, 68);
    doc.text(`Canal da Venda: ${item.platformSource}`, 15, 75);
    if (item.platformOrderId) {
      doc.text(`ID Canal: ${item.platformOrderId}`, 15, 82);
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 90, 195, 90);

    // Item Details
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHE DO PRODUTO IMPRESSO', 15, 102);

    doc.setFont('helvetica', 'normal');
    doc.text(`Pecas / Item: ${item.itemName}`, 15, 110);
    doc.text(`Quantidade: ${item.quantity} unidade(s)`, 15, 117);
    doc.text(`Especificacao: ${item.filamentType} (${item.filamentColor})`, 15, 124);
    doc.text(`Tempo de Manufatura: ${item.printTimeHours} horas`, 15, 131);
    doc.text(`Peso Líquido Estimado: ${item.weightGrams}g`, 15, 138);

    doc.setFillColor(241, 244, 238);
    doc.rect(15, 148, 180, 20, 'F');

    doc.setTextColor(12, 14, 13);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`VALOR TOTAL PAGO:`, 22, 160);
    doc.text(`R$ ${item.priceCharged.toFixed(2)}`, 140, 160);

    doc.save(`recibo_venda_${item.id}.pdf`);
  };

  return (
    <div className="space-y-6" id="sold-orders-tab-container">
      <HistoricoDashboard orders={safeOrders} />

      {/* Filter Options Row */}
      <div className="glow-card p-4 rounded-2xl space-y-4 shadow-sm" id="sold-filters">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--brand-muted)]" />
            <input
              type="text"
              placeholder="Pesquise por item vendido, cliente ou canal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--brand-text)] placeholder-[var(--brand-muted)]/60 focus:outline-none focus:border-[#b7ff00]/60"
            />
          </div>

          {/* Channels Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {[
              { key: 'ALL', label: 'Todos os Canais' },
              { key: 'MANUAL', label: 'Manual' },
              { key: 'SHOPEE', label: 'Shopee' },
              { key: 'MERCADO_LIVRE', label: 'Mercado Livre' },
              { key: 'TIKTOK_SHOP', label: 'TikTok Shop' },
              { key: 'NUVEMSHOP', label: 'Nuvemshop' },
              { key: 'AMAZON', label: 'Amazon' }
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPlatformFilter(p.key as any)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  platformFilter === p.key 
                    ? 'bg-gradient-lime text-black font-extrabold shadow-[0_0_16px_-4px_rgba(183,255,0,0.5)]' 
                    : 'bg-[var(--brand-bg)] border border-[var(--brand-border)] text-[var(--brand-muted)] hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment & Financial Filters Sub-row (v3.3.0.0) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t border-[var(--brand-border)]/40 pt-3.5 mt-2">
          {/* Method filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black text-[var(--brand-muted)] whitespace-nowrap">💳 Meio Pgto:</span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: 'Todos' },
                { key: 'DINHEIRO', label: '📂 Dinheiro' },
                { key: 'CARTÃO', label: '💳 Cartão' },
                { key: 'CONSIGNADO', label: '🤝 Consignado' },
                { key: 'OUTROS', label: '🌐 Outros' }
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethodFilter(m.key as any)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                    methodFilter === m.key 
                      ? 'bg-amber-400 text-black font-extrabold shadow-sm' 
                      : 'bg-[var(--brand-bg)] border border-[var(--brand-border)] text-[var(--brand-muted)] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:inline-block h-4 w-px bg-[var(--brand-border)]/30" />

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black text-[var(--brand-muted)] whitespace-nowrap">💵 Situação:</span>
            <div className="flex items-center gap-1">
              {[
                { key: 'ALL', label: 'Todos' },
                { key: 'PAGO', label: '✅ Pago' },
                { key: 'PENDENTE', label: '⏳ Pendente' }
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatusFilter(s.key as any)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                    statusFilter === s.key 
                      ? 'bg-emerald-400 text-black font-extrabold shadow-sm' 
                      : 'bg-[var(--brand-bg)] border border-[var(--brand-border)] text-[var(--brand-muted)] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sold list rendering */}
        {filteredSold.length === 0 ? (
          <div className="border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)]/30 rounded-xl p-12 text-center" id="empty-state-sold">
            <CheckCircle className="h-10 w-10 text-[var(--brand-muted)]/40 mx-auto mb-2" />
            <span className="text-xs font-bold text-[var(--brand-muted)] block">Nenhum pedido vendido encontrado</span>
            <span className="text-[10px] text-[var(--brand-muted)]/70">As ordens concluídas aparecerão nesta aba após serem marcadas como "Entregues".</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="sold-items-grid">
            {filteredSold.map((item) => (
              <div 
                key={item.id} 
                className="bg-[var(--brand-bg)] border border-[var(--brand-border)]/80 p-4 rounded-xl flex flex-col justify-between gap-4 hover:border-[#b7ff00]/40 transition shadow-sm relative overflow-hidden"
              >
                {/* Platform Badge Overlay */}
                <div className="absolute top-0 right-0">
                  {item.platformSource === 'MANUAL' ? (
                    <span 
                      className="px-2.5 py-1 text-[8.5px] font-extrabold uppercase rounded-bl-lg tracking-wider inline-flex items-center gap-1 bg-[#1c2420] border-[#2F3D35] text-emerald-400 shadow-sm"
                    >
                      <span className="text-[10px]">🧑‍💼</span>
                      <span>FÍSICO</span>
                    </span>
                  ) : (
                     <span 
                      style={{
                        backgroundColor: item.platformSource === 'MERCADO_LIVRE' ? '#FFF159' : 
                                        item.platformSource === 'SHOPEE' ? '#EE4D2D' : 
                                        item.platformSource === 'TIKTOK_SHOP' ? '#010101' :
                                        item.platformSource === 'AMAZON' ? '#FF9900' : '#00ADF0',
                        color: item.platformSource === 'MERCADO_LIVRE' ? '#000000' : '#FFFFFF',
                        border: item.platformSource === 'TIKTOK_SHOP' ? '1px solid #FE2C55' : 'none'
                      }}
                      className="px-2.5 py-1 text-[8.5px] font-extrabold uppercase rounded-bl-lg tracking-wider inline-flex items-center gap-1 shadow-sm"
                    >
                      <span className="text-[9px]">
                        {item.platformSource === 'MERCADO_LIVRE' ? '🤝' : 
                         item.platformSource === 'SHOPEE' ? '🛍️' : 
                         item.platformSource === 'TIKTOK_SHOP' ? '🎵' :
                         item.platformSource === 'AMAZON' ? '📦' : '🌐'}
                      </span>
                      <span>{item.platformSource.replace('_', ' ')}</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-[var(--brand-text)] font-mono text-[var(--brand-primary)] uppercase tracking-wider">#VND-{item.id}</h4>
                  
                  <div className="flex items-start gap-2.5">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.itemName}
                        loading="lazy"
                        className="shrink-0 w-12 h-12 rounded-lg object-cover border border-[var(--brand-border)]/60 bg-black/40"
                      />
                    ) : (
                      <div className="shrink-0 w-12 h-12 rounded-lg border border-dashed border-[var(--brand-border)]/60 bg-black/30 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                        3D
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-white leading-snug pr-14 truncate" title={item.itemName}>{item.itemName}</h3>
                      <p className="text-[10.5px] text-[var(--brand-muted)] mt-0.5 flex items-center gap-1">
                        <User className="h-2.5 w-2.5 shrink-0 text-zinc-500" />
                        <span className="truncate">Para: <strong className="text-zinc-200 font-semibold">{item.clientName}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/15 border border-[var(--brand-border)]/40 p-2 rounded-lg space-y-0.5 text-[10.2px] text-[var(--brand-muted)] leading-relaxed">
                    <p>
                      Insumo: <span className="font-semibold text-zinc-300">{item.filamentType} {item.filamentColor}</span>
                    </p>
                    <p>
                      Peso: <span className="font-semibold text-zinc-300">{item.weightGrams}g</span> • Tempo: <span className="font-semibold text-zinc-300">{item.printTimeHours}h</span>
                    </p>
                    <p className="text-[9px] text-[var(--brand-muted)]/70 mt-1 border-t border-[var(--brand-border)]/20 pt-1 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      Entregue: {new Date(item.deadline || item.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {/* Financial & Payment details (v3.3.0.0) */}
                  <div className="flex items-center justify-between gap-1.5 p-1.5 bg-black/15 border border-[var(--brand-border)]/20 rounded-lg">
                    <span className={`px-1.5 py-0.5 rounded text-[8.2px] font-bold uppercase border leading-none shrink-0 ${
                      item.paymentMethod === 'CONSIGNADO'
                        ? 'bg-purple-950/40 border-purple-500/20 text-purple-400'
                        : item.paymentMethod === 'CARTÃO'
                        ? 'bg-blue-950/40 border-blue-500/20 text-blue-400'
                        : item.paymentMethod === 'DINHEIRO'
                        ? 'bg-yellow-950/40 border-yellow-500/15 text-yellow-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                    }`}>
                      🤝 {item.paymentMethod || 'DINHEIRO'}
                    </span>

                    <span className={`px-1.5 py-0.5 rounded text-[8.2px] font-black uppercase border leading-none shrink-0 ${
                      item.paymentStatus === 'PAGO'
                        ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-950/50 border-amber-500/30 text-amber-400 animate-pulse'
                    }`}>
                      {item.paymentStatus === 'PAGO' ? '✅ PAGO' : '⏳ PENDENTE'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--brand-border)]/30 pt-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] uppercase font-bold text-[var(--brand-muted)] block leading-none">Preço Cobrado</span>
                    <span className="text-[12.5px] font-bold text-white font-mono">
                      R$ {item.priceCharged.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleExportReceipt(item)}
                    className="px-2.5 py-1.2 bg-[#232B27]/40 hover:bg-[#b7ff00]/15 border border-[var(--brand-border)] hover:border-[#b7ff00] text-[var(--brand-text)] rounded-lg transition text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="h-3 w-3" />
                    Recibo
                  </button>
                  {onDeleteOrder && (
                    <button
                      onClick={() => {
                        if (confirm(`Apagar a venda "${item.itemName}" do histórico?`)) {
                          onDeleteOrder(item.id);
                        }
                      }}
                      title="Excluir venda do histórico"
                      className="px-2 py-1.2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};