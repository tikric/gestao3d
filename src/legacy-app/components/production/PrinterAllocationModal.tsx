// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer as PrinterIcon, X } from 'lucide-react';
import { PrintOrder, Printer } from '../../types';

interface Props {
  order: PrintOrder | null;
  printers: Printer[];
  onClose: () => void;
  onSelectPrinter: (printerId: number) => void;
  onProceedWithoutAllocation: (order: PrintOrder) => void;
}

export const PrinterAllocationModal: React.FC<Props> = ({ order, printers, onClose, onSelectPrinter, onProceedWithoutAllocation }) => {
  return (
    <AnimatePresence>
      {order && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#151917] border border-[#232B27] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-1.5 text-[#E5B242]">
                <PrinterIcon className="w-4 h-4 text-[#E5B242]" />
                Alocar Impressora
              </h4>
              <button onClick={onClose} className="text-[#8BA58D] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8BA58D]">
              Abaixo estão as máquinas disponíveis. Selecione qual impressora receberá o pedido de <strong>{order.itemName}</strong>:
            </p>

            <div className="space-y-2">
              {printers.map(p => {
                const isBusy = p.status === 'PRINTING';
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPrinter(p.id)}
                    className={`w-full text-left p-3 rounded-lg border transition text-xs flex items-center justify-between ${
                      isBusy
                        ? 'bg-black/10 border-[#EF5350]/20 text-[#8BA58D] cursor-not-allowed opacity-60'
                        : 'bg-black/25 border-[#232B27] text-[#F1F4EE] hover:border-[#95BBA2] hover:bg-[#95BBA2]/5'
                    }`}
                    disabled={isBusy}
                  >
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-[#8BA58D]">{p.model}</div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${isBusy ? 'bg-[#EF5350]/15 text-[#EF5350]' : 'bg-[#5E8B61]/15 text-[#95BBA2]'}`}>
                      {isBusy ? 'Ocupada' : 'Livre'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onProceedWithoutAllocation(order)}
              className="w-full py-2 bg-transparent border border-dashed border-[#232B27] hover:border-[#8BA58D] text-[#8BA58D] hover:text-[#F1F4EE] text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Prosseguir sem Alocação Ativa
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};