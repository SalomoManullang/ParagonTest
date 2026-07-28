"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, CalendarArrowDown, Download, CornerDownRight, Wallet } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { formatIDR, formatDateTime } from "@/utils/formatters";

type SortDirection = "asc" | "desc";

export function PaymentHistoryTable() {
  const { state } = useAppState();
  const [storeFilter, setStoreFilter] = useState<string>("ALL");
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const storeName = (storeId: string) =>
    state.stores.find((s) => s.id === storeId)?.name ?? storeId;

  const filtered = useMemo(() => {
    const q = invoiceQuery.trim().toLowerCase();
    return state.payments
      .filter((p) => storeFilter === "ALL" || p.storeId === storeFilter)
      .filter(
        (p) =>
          !q ||
          p.allocation.lines.some((l) =>
            l.vaNumber.toLowerCase().includes(q)
          ) ||
          p.id.toLowerCase().includes(q)
      )
      .slice()
      .sort((a, b) => {
        const diff =
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return sortDir === "asc" ? diff : -diff;
      });
  }, [state.payments, storeFilter, invoiceQuery, sortDir]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Toolbar History */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 p-5 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              placeholder="Cari VA / ID Transaksi..."
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
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <CalendarArrowDown size={15} />
            Urutan Waktu
            {sortDir === "asc" ? (
              <ChevronUp size={13} className="ml-1 text-teal-600" />
            ) : (
              <ChevronDown size={13} className="ml-1 text-teal-600" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={15} />
            <span className="hidden md:inline">Download Report</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Search size={24} />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada riwayat transaksi</p>
          <p className="text-xs text-slate-400 mt-1">Data transfer atau pembayaran akan muncul di sini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Waktu (Timestamp)</th>
                <th className="px-6 py-4">Toko (Buyer)</th>
                <th className="px-6 py-4">Nominal Masuk</th>
                <th className="px-6 py-4">Invoices Diselesaikan</th>
                <th className="px-6 py-4">Kredit Bertambah</th>
                <th className="px-6 py-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const isOpen = expandedId === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${
                        isOpen ? "bg-teal-50/30" : "hover:bg-slate-50/50"
                      }`}
                      onClick={() => setExpandedId(isOpen ? null : p.id)}
                    >
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {formatDateTime(p.timestamp)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {storeName(p.storeId)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-teal-700">
                        {formatIDR(p.amount)}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-semibold w-6 h-6 rounded-full text-xs">
                          {p.allocation.lines.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-medium text-slate-500">
                        {p.allocation.creditApplied > 0 ? (
                          <span className="text-blue-600 font-semibold">+{formatIDR(p.allocation.creditApplied)}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400">
                        <div className={`inline-flex p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-200'}`}>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </td>
                    </tr>
                    
                    {isOpen && (
                      <tr className="bg-slate-50/60 shadow-inner">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-2 ml-4 border-l-2 border-teal-200 pl-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rincian Alokasi Dana:</p>
                            {p.allocation.lines.map((line) => (
                              <div
                                key={line.invoiceId}
                                className="flex flex-wrap items-center justify-between rounded-xl bg-white border border-slate-100 px-4 py-3 text-sm shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <CornerDownRight size={14} className="text-slate-300" />
                                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md">
                                    {line.vaNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="text-right">
                                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Dialokasikan</span>
                                    <span className="font-mono text-slate-700">{formatIDR(line.amountApplied)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Sisa Tagihan</span>
                                    <span className="font-mono text-slate-700">{formatIDR(line.remainingBalance)}</span>
                                  </div>
                                  <div className="w-20 text-right">
                                    <span
                                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        line.resultingStatus === "PAID"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {line.resultingStatus}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {p.allocation.creditApplied > 0 && (
                              <div className="flex items-center justify-between rounded-xl bg-blue-50/50 border border-blue-100 px-4 py-3 text-sm mt-2">
                                <div className="flex items-center gap-2 text-blue-700">
                                  <Wallet size={15} />
                                  <span className="font-medium text-xs">Sisa dana dimasukkan ke Store Credit</span>
                                </div>
                                <span className="font-mono font-bold text-blue-700">
                                  {formatIDR(p.allocation.creditApplied)}
                                </span>
                              </div>
                            )}

                            {p.allocation.lines.length === 0 && p.allocation.creditApplied === 0 && (
                              <p className="text-xs text-slate-400 italic">
                                Tidak ada tagihan terbuka saat transfer dilakukan.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}