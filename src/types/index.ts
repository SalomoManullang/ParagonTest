export type Role = "buyer" | "seller";

export interface Store {
  id: string; // e.g. "ST-001"
  code: string; // used inside VA numbers, e.g. "001"
  name: string; // e.g. "Toko Berkah Jaya"
  role: Role;
}

export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";

export interface Invoice {
  id: string;
  storeId: string;
  vaNumber: string;
  itemName: string;
  amount: number; // total amount owed, IDR
  amountPaid: number; // cumulative amount paid so far
  dueDate: string; // ISO date string
  status: InvoiceStatus; // payment-progress status (time-derived OVERDUE is computed, not stored)
  createdAt: string; // ISO date string
}

export interface AllocationLine {
  invoiceId: string;
  vaNumber: string;
  amountApplied: number;
  resultingStatus: InvoiceStatus;
  remainingBalance: number;
}

export interface AllocationResult {
  storeId: string;
  paymentAmount: number;
  lines: AllocationLine[];
  creditApplied: number; // excess routed to store credit, if any
}

export interface Payment {
  id: string;
  storeId: string;
  amount: number;
  timestamp: string; // ISO date string, may be backdated/future-dated by the simulator
  allocation: AllocationResult;
  createdAt: string; // ISO date string, actual creation time (not the simulated timestamp)
}

export interface AppState {
  stores: Store[];
  invoices: Invoice[];
  payments: Payment[];
  storeCredits: Record<string, number>; // storeId -> credit balance
  activeStoreId: string;
  systemTime: string; // ISO date string, the simulated "current" time
  vaSequence: Record<string, number>; // storeId -> next VA sequence number
}