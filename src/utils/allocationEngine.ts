import { AllocationLine, AllocationResult, Invoice } from "@/types";

/**
 * Greedy Earliest-Due-First (EDF) payment allocation.
 *
 * Takes an incoming payment for a store and applies it against that store's
 * open invoices (UNPAID or PARTIAL), oldest due date first, fully clearing
 * each one before moving to the next. Any leftover after all open invoices
 * are cleared is returned as `creditApplied` (store credit / deposit).
 *
 * Pure function — does not mutate `openInvoices`. Returns both the
 * allocation breakdown and the updated invoice objects so the caller can
 * merge them back into state.
 */
export function allocatePayment(
  storeId: string,
  paymentAmount: number,
  openInvoices: Invoice[]
): { result: AllocationResult; updatedInvoices: Invoice[] } {
  if (paymentAmount <= 0) {
    return {
      result: { storeId, paymentAmount, lines: [], creditApplied: 0 },
      updatedInvoices: [],
    };
  }

  // Only unsettled invoices for this store are eligible, sorted oldest due date first.
  const eligible = openInvoices
    .filter(
      (inv) =>
        inv.storeId === storeId &&
        (inv.status === "UNPAID" || inv.status === "PARTIAL")
    )
    .slice()
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  let remaining = paymentAmount;
  const lines: AllocationLine[] = [];
  const updatedInvoices: Invoice[] = [];

  for (const invoice of eligible) {
    if (remaining <= 0) break;

    const outstanding = invoice.amount - invoice.amountPaid;
    if (outstanding <= 0) continue; // defensive: shouldn't happen given the filter above

    const amountApplied = Math.min(remaining, outstanding);
    const newAmountPaid = invoice.amountPaid + amountApplied;
    const newOutstanding = invoice.amount - newAmountPaid;
    const resultingStatus = newOutstanding <= 0 ? "PAID" : "PARTIAL";

    updatedInvoices.push({
      ...invoice,
      amountPaid: newAmountPaid,
      status: resultingStatus,
    });

    lines.push({
      invoiceId: invoice.id,
      vaNumber: invoice.vaNumber,
      amountApplied,
      resultingStatus,
      remainingBalance: Math.max(newOutstanding, 0),
    });

    remaining -= amountApplied;
  }

  // Anything left over after every open invoice is fully cleared becomes store credit.
  const creditApplied = Math.max(remaining, 0);

  return {
    result: { storeId, paymentAmount, lines, creditApplied },
    updatedInvoices,
  };
}