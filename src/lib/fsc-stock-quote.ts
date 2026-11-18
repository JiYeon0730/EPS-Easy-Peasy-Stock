/**
 * Parse the Financial Services Commission daily stock-price endpoint.
 * This API is delayed daily-close data, never a live market tick.
 */
export interface FscDailyClose {
  price: number;
  quoteDate: string;
  previousClose: number | null;
  changePercent: number | null;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const result = Number(value.replaceAll(",", ""));
  return Number.isFinite(result) ? result : null;
}
function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{8}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseFscDailyClose(data: unknown, ticker: string): FscDailyClose | null {
  if (!record(data) || !record(data.response)) return null;
  const { header, body } = data.response;
  if (!record(header) || String(header.resultCode) !== "00" || !record(body) || !record(body.items)) return null;
  const entries = body.items.item;
  const items = Array.isArray(entries) ? entries : [entries];
  const matching = items.filter((item): item is Record<string, unknown> =>
    record(item) && String(item.srtnCd) === ticker && validDate(item.basDt) && (numeric(item.clpr) ?? 0) > 0
  ).sort((a, b) => String(b.basDt).localeCompare(String(a.basDt)));
  const latest = matching[0];
  if (!latest) return null;
  const price = numeric(latest.clpr)!;
  const vs = numeric(latest.vs);
  const previousClose = vs !== null && price - vs > 0 ? price - vs : null;
  const fltRt = numeric(latest.fltRt);
  const date = String(latest.basDt);
  return {
    price,
    quoteDate: `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,
    previousClose,
    changePercent: fltRt ?? (previousClose ? (price - previousClose) / previousClose * 100 : null),
  };
}
