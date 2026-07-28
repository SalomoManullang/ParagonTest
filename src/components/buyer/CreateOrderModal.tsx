"use client";

import { useState, FormEvent } from "react";
import { X } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

interface CreateOrderModalProps {
  storeId: string;
  onClose: () => void;
}

export function CreateOrderModal({ storeId, onClose }: CreateOrderModalProps) {
  const { addInvoice } = useAppState();
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);

    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }

    addInvoice({
      storeId,
      itemName: itemName.trim(),
      amount: parsedAmount,
      dueDate: new Date(dueDate).toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Create purchase order
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Item / product name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. 50 sak semen"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Amount (IDR)
            </label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 3500000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-nums focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#155E63] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f4a4e]"
            >
              Create order &amp; generate VA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}