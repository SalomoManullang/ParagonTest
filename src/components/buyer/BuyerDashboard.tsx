"use client";

import { useState, FormEvent, useMemo } from "react";
import { Plus, Wallet, ArrowDownToLine, CreditCard, ShieldCheck, CheckCircle2, Receipt } from "lucide-react";import { useAppState } from "@/context/AppStateContext";
import { StatusBadge, getEffectiveInvoiceStatus } from "@/components/shared/StatusBadge";
import { CreateOrderModal } from "./CreateOrderModal";
import { formatIDR, formatDate } from "@/utils/formatters";

export function BuyerDashboard({ storeId }: { storeId: string }) {
  // Pastikan 'state' ikut diekstrak di sini agar tidak error 'Cannot find name state'
  const { state, invoicesForStore, activeStore, recordPayment, storeCredits } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  
  const [transferAmount, setTransferAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const invoices = useMemo(() => {
    return invoicesForStore(storeId).slice().sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [invoicesForStore, storeId]);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "ALL") return invoices;
    return invoices.filter((inv) => {
      const effStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
      return effStatus === statusFilter;
    });
  }, [invoices, statusFilter, state.systemTime]);

  const totalAmountAll = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalPaidAll = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  // Hitung sisa tagihan khusus untuk yang statusnya BUKAN PAID dan BUKAN OVERDUE
  const totalUnpaidAll = invoices.reduce((acc, inv) => {
    const effStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
    if (effStatus !== "PAID" && effStatus !== "OVERDUE") {
      return acc + (inv.amount - inv.amountPaid);
    }
    return acc;
  }, 0);
  const currentStoreCredit = storeCredits[storeId] || 0;
  

  const hasActiveInvoices = invoices.length > 0;
  const hasUnpaidInvoices = invoices.some((inv) => {
    const effStatus = getEffectiveInvoiceStatus(inv, state.systemTime);
    return effStatus !== "PAID";
  });
  const canPay = hasActiveInvoices && hasUnpaidInvoices;

  const storeVaNumber = `BCA-88001-${storeId.replace('ST-', '')}`;

  function handleSimulateTransfer(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(transferAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Masukkan jumlah nominal transfer yang valid.");
      return;
    }

    const payment = recordPayment({ storeId, amount: parsedAmount });
    const settledCount = payment.allocation.lines.filter(
      (l) => l.resultingStatus === "PAID"
    ).length;
    const partialCount = payment.allocation.lines.filter(
      (l) => l.resultingStatus === "PARTIAL"
    ).length;

    let msg = `Berhasil! Melunasi ${settledCount} tagihan`;
    if (partialCount) msg += `, ${partialCount} partial`;
    if (payment.allocation.creditApplied > 0) {
      msg += ` (Sisa Rp ${formatIDR(payment.allocation.creditApplied)} masuk ke Store Credit)`;
    }

    setSimulateModalOpen(false);
    setTransferAmount("");
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }

  return (
    <div className="space-y-6 relative">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 text-white shadow-2xl animate-in slide-in-from-top-5 duration-300">
          <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
          <p className="text-xs font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Header Toko */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{activeStore.name}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 px-3 py-1 text-xs font-mono font-medium text-teal-300">
              <CreditCard size={13} />
              VA: {storeVaNumber}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sistem Virtual Account Permanent Open-Amount &amp; Auto-Clearing Otomatis
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (!canPay) return;
              setSimulateModalOpen(true);
            }}
            disabled={!canPay}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-lg transition-all ${
              canPay
                ? "bg-teal-600 text-white shadow-teal-600/30 hover:bg-teal-500 cursor-pointer"
                : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
            }`}
          >
            <ArrowDownToLine size={15} />
            {canPay ? "Simulasi Bayar / Transfer" : "Tidak ada tagihan"}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <Plus size={15} />
            Buat Pesanan
          </button>
        </div>
      </div>

      {/* Kartu Ringkasan */}
      {/* Kartu Ringkasan */}
      {/* Ubah grid-cols-3 menjadi lg:grid-cols-4 agar responsif */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Seluruh Tagihan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Seluruh Tagihan</p>
            <p className="text-lg font-bold font-mono text-slate-900 mt-1">{formatIDR(totalAmountAll)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Wallet size={20} />
          </div>
        </div>

        {/* Card 2: Sudah Terbayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sudah Terbayar</p>
            <p className="text-lg font-bold font-mono text-emerald-600 mt-1">{formatIDR(totalPaidAll)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck size={20} />
          </div>
        </div>

        {/* Card 3 (BARU): Belum Terbayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Belum Terbayar</p>
            <p className="text-lg font-bold font-mono text-rose-600 mt-1">{formatIDR(totalUnpaidAll)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
            <Receipt size={20} />
          </div>
        </div>

        {/* Card 4: Store Credit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Store Credit / Saldo Lebih</p>
            <p className="text-lg font-bold font-mono text-teal-700 mt-1">{formatIDR(currentStoreCredit)}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
            <CreditCard size={20} />
          </div>
        </div>
        
      </div>

      {/* Filter Bar & List Tagihan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Daftar Tagihan (Urut Berdasarkan Due Date Tercepat)</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="ALL">Semua Status</option>
              <option value="UNPAID">Belum Dibayar (Unpaid)</option>
              <option value="PARTIAL">Sebagian (Partial)</option>
              <option value="PAID">Lunas (Paid)</option>
              <option value="OVERDUE">Terlambat (Overdue)</option>
            </select>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Wallet size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700">Tidak ada tagihan</p>
            <p className="text-xs text-slate-400 mt-1">Belum ada pesanan aktif untuk toko ini. Silakan buat pesanan baru.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-medium text-white shadow hover:bg-teal-800 cursor-pointer"
            >
              <Plus size={14} /> Buat Pesanan Baru
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Tidak ada tagihan yang sesuai dengan filter status tersebut.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Nama Item / Invoice</th>
                  <th className="px-6 py-4">Nominal Total</th>
                  <th className="px-6 py-4">Progres Terbayar</th>
                  <th className="px-6 py-4">Jatuh Tempo</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const effectiveStatus = getEffectiveInvoiceStatus(inv, state.systemTime);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{inv.itemName}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">{formatIDR(inv.amount)}</td>
                      <td className="px-6 py-4 font-mono text-xs font-medium text-teal-700">
                        {formatIDR(inv.amountPaid)} / {formatIDR(inv.amount)}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={effectiveStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Simulasi Pembayaran / Transfer Bank */}
      {simulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Simulasi Transfer VA</h3>
                <p className="text-xs text-slate-500">Kirim dana ke Virtual Account tetap toko.</p>
              </div>
              <button 
                onClick={() => { setSimulateModalOpen(false); setTransferAmount(""); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-teal-50/70 border border-teal-100 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">Tujuan Virtual Account</p>
                <p className="text-sm font-mono font-bold text-teal-950 mt-0.5">{storeVaNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">Store Credit Aktif</p>
                <p className="text-xs font-mono font-bold text-teal-900 mt-0.5">{formatIDR(currentStoreCredit)}</p>
              </div>
            </div>

            <form onSubmit={handleSimulateTransfer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Jumlah Transfer (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={1}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Contoh: 3000000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm font-mono focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setSimulateModalOpen(false); setTransferAmount(""); }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-teal-700/20 hover:bg-teal-800 cursor-pointer"
                >
                  Konfirmasi Transfer
                </button>
              </div>
            </form>
          </div>
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