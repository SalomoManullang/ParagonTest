"use client";

import { useState, useMemo } from "react";
import { useAppState } from "@/context/AppStateContext";
import { PaymentHistoryTable } from "./PaymentHistoryTable";
import { StatusBadge, getEffectiveInvoiceStatus } from "@/components/shared/StatusBadge";
import { formatIDR, formatDate } from "@/utils/formatters";
import { FileText, Search, Download, RefreshCw, LayoutDashboard, Wallet, AlertCircle, TrendingUp, Receipt } from "lucide-react";

export function SellerDashboard() {
  const { state } = useAppState();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"INVOICES" | "PAYMENTS">("INVOICES");

  // State untuk filter invoice global di sisi seller
  const [storeFilter, setStoreFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const storeName = (storeId: string) =>
    state.stores.find((s) => s.id === storeId)?.name ?? storeId;

  // Global Stats Calculations
  const { totalOutstanding, totalCollected, totalOverdue } = useMemo(() => {
    let out = 0;
    let col = 0;
    let over = 0;

    state.invoices.forEach((inv) => {
      const effStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
      col += inv.amountPaid;
      
      if (effStatus === "OVERDUE") {
        over += (inv.amount - inv.amountPaid);
      } else if (effStatus !== "PAID") {
        out += (inv.amount - inv.amountPaid);
      }
    });
    return { totalOutstanding: out, totalCollected: col, totalOverdue: over };
  }, [state.invoices, state.systemTime]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.invoices
      .filter((inv) => storeFilter === "ALL" || inv.storeId === storeFilter)
      .filter((inv) => {
        if (statusFilter === "ALL") return true;
        const effStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
        return effStatus === statusFilter;
      })
      .filter(
        (inv) =>
          !q ||
          inv.itemName.toLowerCase().includes(q) ||
          inv.vaNumber.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q)
      )
      .slice()
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [state.invoices, storeFilter, statusFilter, searchQuery, state.systemTime]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-teal-600 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Platform Finance
            </h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">
            Global payment monitoring, invoice tracking, and audit ledger.
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 shadow-inner">
          <button
            onClick={() => setActiveTab("INVOICES")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "INVOICES"
                ? "bg-white text-teal-700 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <FileText size={16} />
            Daftar Tagihan
          </button>
          <button
            onClick={() => setActiveTab("PAYMENTS")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "PAYMENTS"
                ? "bg-white text-teal-700 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Receipt size={16} />
            Riwayat Transfer
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-teal-200 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dana Masuk</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{formatIDR(totalCollected)}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Piutang Berjalan</p>
            <p className="text-2xl font-bold font-mono text-blue-600 mt-1">{formatIDR(totalOutstanding)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Overdue</p>
            <p className="text-2xl font-bold font-mono text-rose-600 mt-1">{formatIDR(totalOverdue)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 text-rose-600 group-hover:scale-110 transition-transform">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Dynamic Content Area */}
      {activeTab === "PAYMENTS" ? (
        <PaymentHistoryTable />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          {/* Toolbar Invoices */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 p-5 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari item / VA..."
                  className="w-full md:w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="ALL">Semua Toko</option>
                {state.stores
                  .filter((s) => s.role === "buyer")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="ALL">Semua Status</option>
                <option value="UNPAID">Unpaid (Belum Bayar)</option>
                <option value="PARTIAL">Partial (Sebagian)</option>
                <option value="PAID">Paid (Lunas)</option>
                <option value="OVERDUE">Overdue (Terlambat)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCw size={15} />
                <span className="hidden md:inline">Refresh</span>
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-colors">
                <Download size={15} />
                <span className="hidden md:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Invoices */}
          {filteredInvoices.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileText size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tidak ada tagihan ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian atau status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Toko (Buyer)</th>
                    <th className="px-6 py-4">Nama Item</th>
                    <th className="px-6 py-4">Virtual Account</th>
                    <th className="px-6 py-4">Nominal</th>
                    <th className="px-6 py-4">Progres Terbayar</th>
                    <th className="px-6 py-4">Jatuh Tempo</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const effStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {storeName(inv.storeId)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{inv.itemName}</td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-teal-700 bg-teal-50/30 rounded-lg">
                          {inv.vaNumber}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                          {formatIDR(inv.amount)}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-medium text-slate-500">
                          {formatIDR(inv.amountPaid)}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={effStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}