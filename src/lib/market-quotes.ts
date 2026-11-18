import type { Holding, Market } from "./stocks";

export type QuoteProvider = "Finnhub" | "FSC";
export type QuoteFailureCode = "NOT_CONFIGURED" | "NO_DATA" | "UPSTREAM_ERROR";
export interface QuoteRequestItem { market: Market; ticker: string }
export interface MarketQuote {
  market: Market;
  ticker: string;
  price: number;
  provider: QuoteProvider;
  /** When EPS fetched the API response, not necessarily the trade time. */
  fetchedAt: string;
  /** Provider-reported last trade time, if available. */
  tradedAt: string | null;
  /** Official daily-close date (YYYY-MM-DD), when provided. */
  quoteDate?: string;
  previousClose: number | null;
  changePercent: number | null;
}
export interface QuoteFailure extends QuoteRequestItem { code: QuoteFailureCode }
export interface QuoteBatchResult {
  quotes: MarketQuote[];
  failures: QuoteFailure[];
  fetchedAt: string;
  refreshSeconds: number;
}
export type QuoteMap = Record<string, MarketQuote>;
export const quoteKey = (market: Market, ticker: string) => `${market}:${ticker.trim().toUpperCase()}`;
export function getQuote(quoteMap: QuoteMap, holding: Holding): MarketQuote | undefined {
  return quoteMap[quoteKey(holding.market, holding.ticker)];
}
export function displayedPrice(quoteMap: QuoteMap, holding: Holding): number | null {
  return getQuote(quoteMap, holding)?.price ?? holding.currentPrice;
}
/** Do not mutate localStorage portfolio records; API prices live only in memory. */
export function applyQuotes(holdings: Holding[], quoteMap: QuoteMap): Holding[] {
  return holdings.map((h) => ({ ...h, currentPrice: displayedPrice(quoteMap, h) }));
}
export function uniqueSymbols(holdings: Holding[]): QuoteRequestItem[] {
  const seen = new Set<string>();
  return holdings.flatMap((h) => {
    const key = quoteKey(h.market, h.ticker);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{market: h.market, ticker: h.ticker.trim().toUpperCase()}];
  });
}
export function validQuoteRequestItem(value: unknown): value is QuoteRequestItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.market === "KR") return typeof v.ticker === "string" && /^\d{6}$/.test(v.ticker);
  if (v.market === "US") return typeof v.ticker === "string" && /^[A-Z][A-Z0-9.\-^]{0,29}$/.test(v.ticker);
  return false;
}
export function validPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
