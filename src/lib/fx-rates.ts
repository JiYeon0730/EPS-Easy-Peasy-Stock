/** Daily reference FX quote. Not an executable market quote or intraday spot rate. */
export interface UsdKrwRate {
  base: "USD";
  quote: "KRW";
  rate: number;
  date: string;
  source: "Frankfurter";
  fetchedAt: string;
}

/** Avoid accepting an invalid or a misleading currency pair from the upstream API. */
export function parseUsdKrwRate(input: unknown, fetchedAt: string): UsdKrwRate | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  if (String(row.base).toUpperCase() !== "USD" || String(row.quote).toUpperCase() !== "KRW") return null;
  if (typeof row.rate !== "number" || !Number.isFinite(row.rate) || row.rate <= 0) return null;
  if (typeof row.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(Date.parse(`${row.date}T00:00:00Z`))) return null;
  if (Date.parse(`${row.date}T00:00:00Z`) > Date.now() + 86_400_000) return null;
  return {base:"USD",quote:"KRW",rate:row.rate,date:row.date,source:"Frankfurter",fetchedAt};
}
