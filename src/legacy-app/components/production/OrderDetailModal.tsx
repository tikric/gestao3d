// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import {
  getStatusColor,
  getStatusLabel,
  getDelayCategory,
  getProgressPercentage,
  getNextStatusValue,
  getNextStatusActionLabel,
} from './statusHelpers';

interface OrderDetailModalProps {
  order: any | null;
  printers: any[];
  onClose: () => void;
  onEdit: (order: any) => void;
  onDelete: (id: number) => void;
  onAdvance: (order: any, nextStatus: string) => void;
}

const pad = (n: number) => n.toString().padStart(2, '0');
const fmtDate = (ts: number) => {
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const InfoRow = ({ label, value, mono = false }: any) => (
  <div className="flex items-center justify-between gap-3 py-2 border-b border-[#1a221e] last:border-0">
    <span className="text-[10px] uppercase tracking-wider text-[#8BA58D]/70 font-semibold">{label}</span>
    <span className={`text-[12px] text-[#F1F4EE] text-right ${mono ? 'font-mono tabular-nums' : 'font-medium'}`}>{value}</span>
  </div>
);

function computeProgress(order: any, assignedPrinter: any | null): number {
  if (order.status !== 'PRINTING') return getProgressPercentage(order.status, order.printingProgress);
  const printerPct = assignedPrinter && typeof assignedPrinter.printProgress === 'number'
    ? assignedPrinter.printProgress : null;
  return Math.round(printerPct !== null ? printerPct : (order.printingProgress || 0) * 100);
}

function PrintingProgressBar({ pct, printerName }: { pct: number; printerName?: string }) {
  return (
    <div className="px-6 pt-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Imprimindo agora {printerName ? `· ${printerName}` : ''}
        </span>
        <span className="text-lg font-black tabular-nums text-emerald-300">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-[#b7ff00] transition-all duration-700 shadow-[0_0_12px_rgba(149,187,162,0.5)]"
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}

function OrderHeader({ order, color, onClose }: any) {
  return (
    <div className="flex items-start justify-between gap-4 p-6 border-b border-[#1a221e]">
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {order.imageUrl ? (
          <img src={order.imageUrl} alt={order.itemName}
            className="shrink-0 w-20 h-20 rounded-xl object-cover border border-[#232B27] bg-black/40 shadow-lg" />
        ) : (
          <div className="shrink-0 w-20 h-20 rounded-xl border border-dashed border-[#232B27] bg-black/30 flex items-center justify-center text-[11px] text-[#3a4640] font-black uppercase tracking-wider">
            3D
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color }}>{getStatusLabel(order.status)}</span>
            <span className="text-[10px] uppercase tracking-wider text-[#8BA58D]/60">· Pedido #{order.id}</span>
          </div>
          <h2 className="text-2xl font-black text-[#F1F4EE] tracking-tight truncate">{order.itemName}</h2>
          <p className="text-sm text-[#8BA58D] mt-1">Cliente: <span className="text-[#F1F4EE] font-semibold">{order.clientName}</span></p>
        </div>
      </div>
      <button onClick={onClose} className="shrink-0 text-[#8BA58D] hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function OrderDetailModal({
  order, printers, onClose, onEdit, onDelete, onAdvance,
}: OrderDetailModalProps) {
  return (
    <AnimatePresence>
      {order && (() => {
        const color = getStatusColor(order.status);
        const delayCat = getDelayCategory(order.createdAt, order.status);
        const assignedPrinter = order.assignedPrinterId
          ? printers.find((p) => p.id === order.assignedPrinterId) : null;
        const livePct = computeProgress(order, assignedPrinter);
        const elapsedMs = Date.now() - order.createdAt;
        const eh = Math.floor(elapsedMs / 3600000);
        const em = Math.floor((elapsedMs % 3600000) / 60000);
        const deadlineMs = order.deadline ? order.deadline - Date.now() : 0;
        const dh = Math.floor(Math.abs(deadlineMs) / 3600000);
        const nextStatus = getNextStatusValue(order.status);
        const nextLabel = getNextStatusActionLabel(order.status);

        return (
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative w-full max-w-3xl bg-gradient-to-br from-[#13181580] via-[#0F1310] to-[#0A0C0B] border border-[#232B27] rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <OrderHeader order={order} color={color} onClose={onClose} />

              {order.status === 'PRINTING' && (
                <PrintingProgressBar pct={livePct} printerName={assignedPrinter?.name} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#95BBA2] mb-2">Produção</h3>
                  <InfoRow label="Filamento" value={`${order.filamentType} · ${order.filamentColor}`} />
                  <InfoRow label="Peso" value={`${order.weightGrams} g`} mono />
                  <InfoRow label="Tempo Impressão" value={`${order.printTimeHours} h`} mono />
                  <InfoRow label="Quantidade" value={`${order.quantity || 1}`} mono />
                  <InfoRow label="Impressora" value={assignedPrinter ? assignedPrinter.name : order.printerName || '—'} />
                  <InfoRow label="Progresso" value={`${livePct}%`} mono />
                </div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#E5B242] mb-2">Comercial</h3>
                  <InfoRow label="Valor" value={`R$ ${order.priceCharged.toFixed(2)}`} mono />
                  <InfoRow label="Pagamento" value={`${order.paymentMethod || '—'} · ${order.paymentStatus || '—'}`} />
                  <InfoRow label="Plataforma" value={order.platformSource || '—'} />
                  <InfoRow label="Criado em" value={fmtDate(order.createdAt)} mono />
                  <InfoRow label="Há" value={eh > 0 ? `${eh}h ${em}m` : `${em}m`} mono />
                  {order.deadline && (
                    <InfoRow label="Prazo" value={deadlineMs < 0 ? `Atrasado ${dh}h` : `Em ${dh}h`} mono />
                  )}
                </div>
              </div>

              <div className={`mx-6 mb-6 rounded-xl px-4 py-3 border ${delayCat.border} ${delayCat.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-4 h-4 ${delayCat.textClass || 'text-emerald-400'}`} />
                  <span className={`text-xs font-bold ${delayCat.textClass || 'text-emerald-400'}`}>{delayCat.label}</span>
                </div>
                <span className="text-[10px] text-[#8BA58D] uppercase tracking-wider">SLA · Tempo na fila</span>
              </div>

              <div className="flex items-center justify-between gap-3 p-5 border-t border-[#1a221e] bg-black/30">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { onClose(); onEdit(order); }}
                    className="text-xs font-bold px-3 py-2 rounded-lg border border-[#232B27] text-[#8BA58D] hover:text-white hover:border-[#95BBA2] transition"
                  >Editar</button>
                  <button
                    onClick={() => { if (confirm('Excluir este pedido?')) { onDelete(order.id); onClose(); } }}
                    className="text-xs font-bold px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                  >Excluir</button>
                </div>
                {nextStatus && (
                  <button
                    onClick={() => { onAdvance(order, nextStatus); onClose(); }}
                    className="text-sm font-bold px-5 py-2.5 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-95"
                    style={{ borderColor: `${color}66`, color, background: `${color}1a`, boxShadow: `0 0 20px ${color}33` }}
                  >
                    {nextLabel} →
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}