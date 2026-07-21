// @ts-nocheck
import {
  initialClients,
  initialPrinters,
  initialOrders,
  initialFilamentStock,
  initialExpenses,
  initialShoppingItems,
} from '../utils/initialData';
import { usePersistedState } from './usePersistedState';
import type {
  Client,
  Printer,
  PrintOrder,
  FilamentStock,
  SupplyStock,
  Expense,
  ShoppingItem,
} from '../types';

/**
 * Aggregates all persisted business-data slices used by the App shell.
 * Each slice is `[value, setValue]` with localStorage persistence handled
 * by `usePersistedState` — replaces ~150 lines of repeated try/catch
 * useState + useEffect blocks in App.tsx.
 */
export function useAppState() {
  const [clients, setClients] = usePersistedState<Client[]>('bambuzau_clients', initialClients);
  const [printers, setPrinters] = usePersistedState<Printer[]>('bambuzau_printers', initialPrinters);
  const [orders, setOrders] = usePersistedState<PrintOrder[]>('bambuzau_orders', initialOrders);
  const [filamentStocks, setFilamentStocks] = usePersistedState<FilamentStock[]>(
    'bambuzau_filament',
    initialFilamentStock,
  );
  const [expenses, setExpenses] = usePersistedState<Expense[]>('bambuzau_expenses', initialExpenses);
  const [shoppingItems, setShoppingItems] = usePersistedState<ShoppingItem[]>(
    'bambuzau_shopping',
    initialShoppingItems,
  );
  const [importedExternalIds, setImportedExternalIds] = usePersistedState<string[]>(
    'bambuzau_imported_external_ids',
    [],
  );
  const [suppliesStocks, setSuppliesStocks] = usePersistedState<SupplyStock[]>(
    'bambuzau_supplies',
    [],
  );
  const [lastAuditDate, setLastAuditDate] = usePersistedState<number>(
    'bambuzau_last_audit_ts',
    // Default: 4 days ago to trigger audit warnings by default
    () => Date.now() - 4 * 24 * 60 * 60 * 1000,
  );

  return {
    clients, setClients,
    printers, setPrinters,
    orders, setOrders,
    filamentStocks, setFilamentStocks,
    expenses, setExpenses,
    shoppingItems, setShoppingItems,
    importedExternalIds, setImportedExternalIds,
    suppliesStocks, setSuppliesStocks,
    lastAuditDate, setLastAuditDate,
  };
}