/**
 * Generates a permanent-style Virtual Account number.
 * Format: BCA-88001-{storeCode}-{sequence}
 * `sequence` is per-store and monotonically increasing so numbers never collide.
 */
export function generateVaNumber(storeCode: string, sequence: number): string {
  const padded = String(sequence).padStart(3, "0");
  return `BCA-88001-${storeCode}-${padded}`;
}