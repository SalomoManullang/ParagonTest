"use client";

import { useState, FormEvent } from "react";
import { ArrowDownToLine } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { formatIDR } from "@/utils/formatters";

export function PaymentSimulator() {
  const { state, recordPayment } = useAppState();
  const buyers = state.stores.filter((s) => s.role === "buyer");

  const [storeId, setStoreId] = useState(buyers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [lastResultText, setLastResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLastResultText(null);

    const parsedAmount = Number(amount);
    if (!storeId) {
      setError("Select a store.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a transfer amount greater than zero.");
      return;
    }

    const payment = recordPayment({ storeId, amount: parsedAmount });
    const settledCount = payment.allocation.lines.filter(
      (l) => l.resultingStatus === "PAID"
    ).length;
    const partialCount = payment.allocation.lines.filter(
      (l) => l.resultingStatus === "PARTIAL"
    ).length;

    setLastResultText(
      `Cleared ${settledCount} invoice(s)` +
        (partialCount ? `, ${partialCount} partially applied` : "") +
        (payment.allocation.creditApplied > 0
          ? `, ${formatIDR(payment.allocation.creditApplied)} added to store credit`
          : "")
    );
    setAmount("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <ArrowDownToLine size={16} className="text-teal-700" />
        <h2 className="text-sm font-semibold text-slate-900">
          Payment simulator
        </h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Simulate an incoming bank transfer and trigger auto-clearing.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Store
          </label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            {buyers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Transfer amount (IDR)
          </label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 3333333"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-nums focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-[#155E63] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f4a4e]"
        >
          Simulate incoming bank transfer
        </button>

        {lastResultText && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {lastResultText}
          </p>
        )}
      </form>
    </div>
  );
}