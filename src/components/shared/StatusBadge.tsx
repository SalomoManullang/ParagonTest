import { InvoiceStatus } from "@/types";

const STYLES: Record<InvoiceStatus, string> = {
  UNPAID: "bg-slate-100 text-slate-600 border-slate-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ status }: { status: InvoiceStatus | "OVERDUE" }) {
  const style =
    status === "OVERDUE"
      ? "bg-red-50 text-red-700 border-red-200"
      : STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}