"use client";

import { useState, useMemo } from "react";
import { useAppState } from "@/context/AppStateContext";
import { PaymentHistoryTable } from "./PaymentHistoryTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatIDR, formatDate } from "@/utils/formatters";
import { FileText, Search } from "lucide-react";

export function SellerDashboard() {
  const { state } = useAppState();
  
  // State untuk filter invoice global di sisi seller
  const [storeFilter, setStoreFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const storeName = (storeId: string) =>
    state.stores.find((s) => s.id === storeId)?.name ?? storeId;

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.invoices
      .filter((inv) => storeFilter === "ALL" || inv.storeId === storeFilter)
      .filter((inv) => statusFilter === "ALL" || inv.status === statusFilter)
      .filter(
        (inv) =>
          !q ||
          inv.itemName.toLowerCase().includes(q) ||
          inv.vaNumber.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q)
      )
      .slice()
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [state.invoices, storeFilter, statusFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Platform Finance / Seller Portal
        </h1>
        <p className="text-sm text-slate-500">
          Global payment monitoring, invoice tracking, and auto-clearing audit ledger.
        </p>
      </div>

      {/* Bagian 1: Payment History Ledger */}
      <PaymentHistoryTable />

      {/* Bagian 2: Global Invoices Management & Filtering */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-teal-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              All store invoices (Global view)
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter berdasarkan Toko */}
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="ALL">All stores</option>
              {state.stores
                .filter((s) => s.role === "buyer")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>

            {/* Filter berdasarkan Status (Paid, Unpaid, Partial, Overdue) */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="ALL">All statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            {/* Input Pencarian */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item / VA"
                className="rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No invoices found matching the selected filters.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Virtual account</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {storeName(inv.storeId)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.itemName}</td>
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
        )}
      </div>
    </div>
  );
}