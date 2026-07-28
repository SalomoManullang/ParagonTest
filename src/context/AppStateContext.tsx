"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { AppState, Invoice, InvoiceStatus, Payment, Store } from "@/types";
import { loadState, saveState } from "@/utils/storage";
import { generateVaNumber } from "@/utils/vaGenerator";
import { allocatePayment } from "@/utils/allocationEngine";

const STORES: Store[] = [
  { id: "ST-001", code: "001", name: "Toko Berkah Jaya", role: "buyer" },
  { id: "ST-002", code: "002", name: "Sumber Rejeki", role: "buyer" },
  { id: "PLATFORM", code: "PF", name: "Platform Finance", role: "seller" },
];

const DEFAULT_SYSTEM_TIME = "2026-08-01T09:00:00.000Z";

function defaultState(): AppState {
  return {
    stores: STORES,
    invoices: [],
    payments: [],
    storeCredits: {},
    activeStoreId: STORES[0].id,
    systemTime: DEFAULT_SYSTEM_TIME,
    vaSequence: {},
  };
}

interface NewOrderInput {
  storeId: string;
  itemName: string;
  amount: number;
  dueDate: string; // ISO date string
}

interface NewPaymentInput {
  storeId: string;
  amount: number;
  timestamp?: string; // ISO date string; defaults to now (overridable in Step 5)
}

interface AppStateContextValue {
  state: AppState;
  activeStore: Store;
  setActiveStoreId: (storeId: string) => void;
  setSystemTime: (iso: string) => void;
  addInvoice: (input: NewOrderInput) => Invoice;
  recordPayment: (input: NewPaymentInput) => Payment;
  invoicesForStore: (storeId: string) => Invoice[];
  storeCredits: Record<string, number>;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined
);

/**
 * Fungsi helper global untuk mengevaluasi status invoice secara dinamis
 * berdasarkan tanggal sistem (systemTime) yang sedang berjalan.
 */
export function getEffectiveInvoiceStatus(
  inv: { amount: number; amountPaid: number; dueDate: string; status: InvoiceStatus },
  systemTime: string
): InvoiceStatus | "OVERDUE" {
  if (inv.amountPaid >= inv.amount) return "PAID";

  const sysDate = new Date(systemTime).toISOString().split("T")[0];
  const due = new Date(inv.dueDate).toISOString().split("T")[0];

  // Jika tanggal sistem sudah melewati tanggal jatuh tempo (due date)
  if (sysDate > due) {
    return "OVERDUE";
  }

  return inv.status;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState<AppState | null>(null);
    if (loaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ ...loaded, stores: STORES });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const setActiveStoreId = useCallback((storeId: string) => {
    setState((prev) => ({ ...prev, activeStoreId: storeId }));
  }, []);

  const setSystemTime = useCallback((iso: string) => {
    setState((prev) => {
      const sysDate = new Date(iso).toISOString().split("T")[0];
      
      // Kunci status menjadi OVERDUE secara permanen di state jika sudah lewat waktu
      const updatedInvoices = prev.invoices.map((inv) => {
        // Abaikan jika sudah dibayar atau jika memang sudah permanen OVERDUE
        if (inv.status === "PAID" || inv.status === ("OVERDUE" as any)) return inv;
        
        const due = new Date(inv.dueDate).toISOString().split("T")[0];
        if (sysDate > due) {
          // Mutate state menjadi OVERDUE 
          return { ...inv, status: "OVERDUE" as any };
        }
        return inv;
      });

      return { 
        ...prev, 
        systemTime: iso,
        invoices: updatedInvoices 
      };
    });
  }, []);

  const addInvoice = useCallback(
    (input: NewOrderInput): Invoice => {
      const store = state.stores.find((s) => s.id === input.storeId);
      const nextSeq = (state.vaSequence[input.storeId] ?? 0) + 1;
      const vaNumber = generateVaNumber(store?.code ?? "000", nextSeq);

      let currentCredit = state.storeCredits[input.storeId] ?? 0;
      let amountPaid = 0;
      let status: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
      let creditDeducted = 0;

      if (currentCredit > 0) {
        if (currentCredit >= input.amount) {
          amountPaid = input.amount;
          status = "PAID";
          creditDeducted = input.amount;
        } else {
          amountPaid = currentCredit;
          status = "PARTIAL";
          creditDeducted = currentCredit;
        }
      }

      const created: Invoice = {
        id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        storeId: input.storeId,
        vaNumber,
        itemName: input.itemName,
        amount: input.amount,
        amountPaid,
        dueDate: input.dueDate,
        status,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        invoices: [...prev.invoices, created],
        vaSequence: { ...prev.vaSequence, [input.storeId]: nextSeq },
        storeCredits: {
          ...prev.storeCredits,
          [input.storeId]: (prev.storeCredits[input.storeId] ?? 0) - creditDeducted,
        },
      }));
      return created;
    },
    [state.stores, state.vaSequence, state.storeCredits]
  );

  const recordPayment = useCallback(
    (input: NewPaymentInput): Payment => {
      const activeInvoices = state.invoices.filter(
        (i) => i.storeId === input.storeId && i.status !== "PAID"
      );

      // Jika tidak ada tagihan sama sekali, masukkan seluruhnya ke store credit
      if (activeInvoices.length === 0) {
        const dummyAllocation = {
          lines: [],
          creditApplied: input.amount,
        };

        const payment: Payment = {
          id: `PMT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          storeId: input.storeId,
          amount: input.amount,
          timestamp: input.timestamp ?? state.systemTime ?? new Date().toISOString(),
          allocation: dummyAllocation as any,
          createdAt: new Date().toISOString(),
        };

        setState((prev) => {
          const prevCredit = prev.storeCredits[input.storeId] ?? 0;
          return {
            ...prev,
            payments: [...prev.payments, payment],
            storeCredits: {
              ...prev.storeCredits,
              [input.storeId]: prevCredit + input.amount,
            },
          };
        });

        return payment;
      }

      const { result, updatedInvoices } = allocatePayment(
        input.storeId,
        input.amount,
        state.invoices,
        state.systemTime
      );

      const payment: Payment = {
        id: `PMT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        storeId: input.storeId,
        amount: input.amount,
        timestamp: input.timestamp ?? state.systemTime ?? new Date().toISOString(),
        allocation: result,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => {
        const updatedById = new Map(updatedInvoices.map((i) => [i.id, i]));
        const mergedInvoices = prev.invoices.map(
          (inv) => updatedById.get(inv.id) ?? inv
        );
        const prevCredit = prev.storeCredits[input.storeId] ?? 0;
        return {
          ...prev,
          invoices: mergedInvoices,
          payments: [...prev.payments, payment],
          storeCredits: {
            ...prev.storeCredits,
            [input.storeId]: prevCredit + result.creditApplied,
          },
        };
      });

      return payment;
    },
    [state.invoices, state.systemTime]
  );

  const invoicesForStore = useCallback(
    (storeId: string) => state.invoices.filter((i) => i.storeId === storeId),
    [state.invoices]
  );

  const activeStore = useMemo(
    () =>
      state.stores.find((s) => s.id === state.activeStoreId) ?? state.stores[0],
    [state.stores, state.activeStoreId]
  );

  const storeCredits = useMemo(() => state.storeCredits, [state.storeCredits]);

  const value: AppStateContextValue = {
    state,
    activeStore,
    setActiveStoreId,
    setSystemTime,
    addInvoice,
    recordPayment,
    invoicesForStore,
    storeCredits,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}