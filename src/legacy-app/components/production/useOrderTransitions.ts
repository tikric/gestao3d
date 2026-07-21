// @ts-nocheck
import { useCallback } from 'react';
import { PrintOrder, Printer } from '../../types';

interface Params {
  printers: Printer[];
  onUpdateOrder: (id: number, updated: Partial<PrintOrder>) => void;
  onUpdatePrinter: (id: number, updated: Partial<Printer>) => void;
}

const FINAL_STATUSES = new Set(['POST_PROCESS', 'PACKING', 'READY', 'DELIVERED']);

export function useOrderTransitions({ printers, onUpdateOrder, onUpdatePrinter }: Params) {
  const advanceStatus = useCallback((order: PrintOrder, nextStatus: string) => {
    if (nextStatus === 'PRINTING') {
      const idlePrinters = printers.filter(p => p.status === 'IDLE');
      const availablePrinters = printers.filter(p => p.status !== 'MAINTENANCE');
      if (idlePrinters.length > 0) {
        const defaultPrinter = idlePrinters[0];
        onUpdateOrder(order.id, {
          status: 'PRINTING',
          assignedPrinterId: defaultPrinter.id,
          printerName: defaultPrinter.name,
          printingProgress: 0.05,
        });
        onUpdatePrinter(defaultPrinter.id, { status: 'PRINTING', printProgress: 5 });
      } else {
        const fallbackPrinter = availablePrinters[0];
        onUpdateOrder(order.id, {
          status: 'PRINTING',
          assignedPrinterId: fallbackPrinter ? fallbackPrinter.id : null,
          printerName: fallbackPrinter ? fallbackPrinter.name : '',
          printingProgress: 0.05,
        });
      }
      return;
    }
    onUpdateOrder(order.id, {
      status: nextStatus as any,
      printingProgress: FINAL_STATUSES.has(nextStatus) ? 1.0 : 0.0,
    });
  }, [printers, onUpdateOrder, onUpdatePrinter]);

  const assignPrinter = useCallback((order: PrintOrder, printerId: number) => {
    const printerObj = printers.find(p => p.id === printerId);
    onUpdateOrder(order.id, {
      status: 'PRINTING',
      assignedPrinterId: printerId,
      printerName: printerObj ? printerObj.name : 'Impressora',
      printingProgress: 0.05,
    });
  }, [printers, onUpdateOrder]);

  return { advanceStatus, assignPrinter };
}