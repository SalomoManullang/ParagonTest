"use client";

import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CreateOrderModal } from "./CreateOrderModal";
import { formatIDR, formatDate } from "@/utils/formatters";

export function BuyerDashboard({ storeId }: { storeId: string }) {
  const { invoicesForStore, activeStore } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);

  const invoices = invoicesForStore(storeId).slice().sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {activeStore.name}
          </h1>
          <p className="text-sm text-slate-500">
            Purchase orders &amp; invoices
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#155E63] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#0f4a4e]"
        >
          <Plus size={16} />
          Create order
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto text-slate-300" size={32} />
          <p className="mt-3 text-sm font-medium text-slate-600">
            No active orders yet
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Create your first purchase order to generate a Virtual Account.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Create order
          </button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Virtual account</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 text-slate-800">{inv.itemName}</td>
                  <td className="px-4 py-3 font-mono-nums text-teal-700">
                    {inv.vaNumber}
                  </td>
                  <td className="px-4 py-3 font-mono-nums text-slate-800">
                    {formatIDR(inv.amount)}
                  </td>
                  <td className="px-4 py-3 font-mono-nums text-slate-500">
                    {formatIDR(inv.amountPaid)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CreateOrderModal
          storeId={storeId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}