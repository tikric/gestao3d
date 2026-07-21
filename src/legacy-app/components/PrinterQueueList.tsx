import React from 'react';
import { Printer, PrintOrder } from '../types';
import { Printer as PrinterIcon, Clock, ListOrdered } from 'lucide-react';

interface Props {
  printers: Printer[];
  orders: PrintOrder[];
}

const STATUS_LABEL: Record<PrintOrder['status'], string> = {
  WAITING: 'Aguardando',
  QUEUE: 'Na Fila',
  PRINTING: 'Imprimindo',
  POST_PROCESS: 'Pós-processo',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
};

const STATUS_COLOR: Record<PrintOrder['status'], string> = {
  WAITING: 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40',
  QUEUE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PRINTING: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  POST_PROCESS: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  READY: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  DELIVERED: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50',
};

const fmtHours = (h: number) => {
  if (!h || h <= 0) return '0h';
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return mins ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
};

export const PrinterQueueList: React.FC<Props> = ({ printers, orders }) => {
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'READY');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-1.5">
          <ListOrdered className="w-4 h-4 text-[#b7ff00]" />
          Fila de Impressão por Impressora
        </h3>
        <span className="text-[10px] text-zinc-500 font-mono">{activeOrders.length} pedidos ativos</span>
      </div>

      {printers.length === 0 ? (
        <div className="text-center py-6 text-xs text-zinc-400 font-bold">Nenhuma impressora cadastrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {printers.map(printer => {
            const queue = activeOrders.filter(o => o.assignedPrinterId === printer.id);
            const totalHours = queue.reduce((s, o) => s + (o.printTimeHours || 0) * (o.quantity || 1), 0);
            return (
              <div key={printer.id} className="bg-[#0C0E0D] border border-[#232B27] rounded-lg p-3">
                <div className="flex items-center justify-between border-b border-[#232B27] pb-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <PrinterIcon className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#F1F4EE] truncate">{printer.name}</div>
                      <div className="text-[9px] text-zinc-500 font-mono uppercase">{printer.model || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                      <Clock className="w-3 h-3" />
                      {fmtHours(totalHours)}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono">{queue.length} item(s)</div>
                  </div>
                </div>

                {queue.length === 0 ? (
                  <div className="text-[10px] text-zinc-500 italic py-2 text-center">Sem itens na fila.</div>
                ) : (
                  <ul className="space-y-1.5">
                    {queue.map(o => (
                      <li key={o.id} className="flex items-center justify-between gap-2 bg-[#151917] border border-[#232B27] rounded-md px-2 py-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-[#F1F4EE] truncate">
                            {o.itemName}
                            {o.quantity > 1 && <span className="text-zinc-500 font-mono"> ×{o.quantity}</span>}
                          </div>
                          <div className="text-[9px] text-zinc-500 font-mono truncate">{o.clientName}</div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded border ${STATUS_COLOR[o.status]}`}>
                            {STATUS_LABEL[o.status]}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {fmtHours((o.printTimeHours || 0) * (o.quantity || 1))}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PrinterQueueList;