"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";
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
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Receipt size={16} className="text-teal-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            Payment history
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <input
            type="text"
            value={invoiceQuery}
            onChange={(e) => setInvoiceQuery(e.target.value)}
            placeholder="Filter by VA / payment ID"
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Date/time
            {sortDir === "asc" ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-400">
          No transactions{state.payments.length > 0 ? " match this filter" : " yet"}.
        </div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Store</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Invoices touched</th>
              <th className="px-4 py-3 font-medium">Credit added</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const isOpen = expandedId === p.id;
              return (
                <Fragment key={p.id}>
                  <tr
                    key={p.id}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    onClick={() => setExpandedId(isOpen ? null : p.id)}
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(p.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {storeName(p.storeId)}
                    </td>
                    <td className="px-4 py-3 font-mono-nums text-slate-800">
                      {formatIDR(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.allocation.lines.length}
                    </td>
                    <td className="px-4 py-3 font-mono-nums text-slate-500">
                      {p.allocation.creditApplied > 0
                        ? formatIDR(p.allocation.creditApplied)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {isOpen ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${p.id}-detail`} className="bg-slate-50/60">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="space-y-1.5">
                          {p.allocation.lines.map((line) => (
                            <div
                              key={line.invoiceId}
                              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs"
                            >
                              <span className="font-mono-nums text-teal-700">
                                {line.vaNumber}
                              </span>
                              <span className="text-slate-500">
                                applied {formatIDR(line.amountApplied)}
                              </span>
                              <span className="text-slate-500">
                                remaining {formatIDR(line.remainingBalance)}
                              </span>
                              <span
                                className={
                                  line.resultingStatus === "PAID"
                                    ? "font-medium text-emerald-700"
                                    : "font-medium text-amber-700"
                                }
                              >
                                {line.resultingStatus}
                              </span>
                            </div>
                          ))}
                          {p.allocation.creditApplied > 0 && (
                            <div className="rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
                              Excess routed to store credit:{" "}
                              <span className="font-mono-nums text-slate-700">
                                {formatIDR(p.allocation.creditApplied)}
                              </span>
                            </div>
                          )}
                          {p.allocation.lines.length === 0 &&
                            p.allocation.creditApplied === 0 && (
                              <p className="text-xs text-slate-400">
                                No open invoices at time of transfer.
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
      )}
    </div>
  );
}