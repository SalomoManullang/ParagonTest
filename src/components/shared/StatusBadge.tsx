import { InvoiceStatus } from "@/types";

const STYLES: Record<InvoiceStatus | "OVERDUE", string> = {
  UNPAID: "bg-slate-100 text-slate-600 border-slate-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
};

/**
 * Menghitung status efektif sebuah invoice secara dinamis berdasarkan systemTime aktif.
 * Aturan:
 * - Jika amountPaid >= amount -> PAID
 * - Jika tanggal sistem > dueDate:
 *   - Jika amountPaid > 0 -> Tetap dianggap PARTIAL (karena cicilan sudah dibayar sebelum/saat jatuh tempo, atau sisa cicilan masuk ke perhitungan). Atau jika ingin spesifik sisa kurangnya overdue, kita tandai OVERDUE tapi proporsional. 
 *   - Sesuai permintaanmu: "kalau dia partial, yang sudah terbayar, tagihan akan jadi overdue (sisa kekurangannya), dan yang sudah terbayar akan masuk ke store credit, tetapi kalau unpaid saja, langsung overdue".
 */
export function getEffectiveInvoiceStatus(
  // Tambahkan dukungan string agar tidak kena error TS saat menerima "OVERDUE"
  inv: { amount: number; amountPaid: number; dueDate: string; status: InvoiceStatus | string }, 
  systemTime: string
): InvoiceStatus | "OVERDUE" {
  if (inv.amountPaid >= inv.amount) return "PAID";
  
  // Jika di state sudah terkunci sebagai OVERDUE secara permanen, biarkan tetap OVERDUE
  if (inv.status === "OVERDUE") return "OVERDUE";

  const sysDate = new Date(systemTime).toISOString().split("T")[0];
  const due = new Date(inv.dueDate).toISOString().split("T")[0];

  if (sysDate > due) {
    return "OVERDUE";
  }

  return inv.status as InvoiceStatus;
}

export function StatusBadge({ status }: { status: InvoiceStatus | "OVERDUE" }) {
  const style = STYLES[status] || STYLES.UNPAID;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}