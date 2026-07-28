"use client";

import { useState, FormEvent } from "react";
import { X, Calendar } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

export function CreateOrderModal({ storeId, onClose }: { storeId: string; onClose: () => void }) {
  const { addInvoice, state } = useAppState();
  
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const parsedAmount = Number(amount);
    if (!itemName.trim()) {
      setError("Nama item/pesanan wajib diisi.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Masukkan jumlah nominal tagihan yang valid.");
      return;
    }
    if (!dueDate) {
      setError("Tanggal jatuh tempo wajib diisi.");
      return;
    }

    // Validasi: Jatuh tempo tidak boleh di masa lalu dari tanggal sistem aktif
    const currentSysDate = new Date(state.systemTime).toISOString().split("T")[0];
    if (dueDate < currentSysDate) {
      setError(`Tanggal jatuh tempo tidak boleh di masa lalu (sebelum ${currentSysDate}).`);
      return;
    }

    addInvoice({
      storeId,
      itemName: itemName.trim(),
      amount: parsedAmount,
      dueDate,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Buat Pesanan Baru</h3>
            <p className="text-xs text-slate-500">Tambah tagihan dan tentukan tanggal jatuh tempo.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Nama Pesanan / Item
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Contoh: Stok Barang Bulanan"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Jumlah Tagihan (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1250000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm font-mono focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Tanggal Jatuh Tempo (Due Date)
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-teal-700/20 hover:bg-teal-800 cursor-pointer"
            >
              Simpan & Generate Tagihan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}