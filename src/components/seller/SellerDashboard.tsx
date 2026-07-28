"use client";

import { useAppState } from "@/context/AppStateContext";
import { PaymentSimulator } from "./PaymentSimulator";
import { PaymentHistoryTable } from "./PaymentHistoryTable";

export function SellerDashboard() {
  const { activeStore } = useAppState();

  return (
    <div>
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {activeStore.name}
        </h1>
        <p className="text-sm text-slate-500">
          Incoming transfers, auto-clearing &amp; ledger
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <PaymentSimulator />
        <PaymentHistoryTable />
      </div>
    </div>
  );
}