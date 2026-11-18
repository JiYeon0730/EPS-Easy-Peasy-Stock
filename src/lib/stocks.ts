export type Market = "KR" | "US";
export type Currency = "KRW" | "USD";
export type Source = "manual" | "sample";

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  quantity: number;
  buyPrice: number;
  currentPrice: number | null;
  source: Source;
  createdAt: string;
}

export type HoldingInput = Pick<Holding, "ticker" | "name" | "market" | "quantity" | "buyPrice" | "currentPrice">;

export function currencyFor(market: Market): Currency {
  return market === "KR" ? "KRW" : "USD";
}

export function formatMoney(value: number, market: Market): string {
  return new Intl.NumberFormat(market === "KR" ? "ko-KR" : "en-US", {
    style: "currency",
    currency: currencyFor(market),
    maximumFractionDigits: market === "KR" ? 0 : 2,
    minimumFractionDigits: market === "KR" ? 0 : 2,
  }).format(value);
}

export function formatCount(num: number): string {
  return new Intl.NumberFormat("ko-KR").format(num);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function invested(holding: Holding): number {
  return holding.quantity * holding.buyPrice;
}

export function valued(holding: Holding): number | null {
  return holding.currentPrice === null ? null : holding.quantity * holding.currentPrice;
}

export function profit(holding: Holding): number | null {
  const current = valued(holding);
  return current === null ? null : current - invested(holding);
}

export function returnRate(holding: Holding): number | null {
  const p = profit(holding);
  const initial = invested(holding);
  return p === null || initial === 0 ? null : (p / initial) * 100;
}

export function summaryByMarket(holdings: Holding[], market: Market) {
  const items = holdings.filter((h) => h.market === market);
  const cost = items.reduce((sum, h) => sum + invested(h), 0);
  const fullyPriced = items.length > 0 && items.every((h) => h.currentPrice !== null);
  const value = fullyPriced ? items.reduce((sum, h) => sum + (valued(h) ?? 0), 0) : null;
  const gain = value === null ? null : value - cost;
  const rate = gain === null || cost === 0 ? null : (gain / cost) * 100;
  return { items, cost, value, gain, rate, fullyPriced };
}

// 가격과 기업 데이터는 모두 화면 작동을 보여주기 위한 예시이며 현재 시세가 아닙니다.
export const DEMO_HOLDINGS: Holding[] = [
  { id: "demo-1", ticker: "005930", name: "삼성전자", market: "KR", quantity: 10, buyPrice: 68000, currentPrice: 73500, source: "sample", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "demo-2", ticker: "035420", name: "NAVER", market: "KR", quantity: 4, buyPrice: 230000, currentPrice: 216000, source: "sample", createdAt: "2026-01-02T00:00:00.000Z" },
  { id: "demo-3", ticker: "AAPL", name: "Apple", market: "US", quantity: 5, buyPrice: 185, currentPrice: 203, source: "sample", createdAt: "2026-01-03T00:00:00.000Z" },
  { id: "demo-4", ticker: "MSFT", name: "Microsoft", market: "US", quantity: 2, buyPrice: 390, currentPrice: 412, source: "sample", createdAt: "2026-01-04T00:00:00.000Z" },
];

export function isHolding(value: unknown): value is Holding {
  if (!value || typeof value !== "object") return false;
  const h = value as Record<string, unknown>;
  return typeof h.id === "string" && typeof h.ticker === "string" && typeof h.name === "string" &&
    (h.market === "KR" || h.market === "US") &&
    typeof h.quantity === "number" && Number.isFinite(h.quantity) && h.quantity > 0 &&
    typeof h.buyPrice === "number" && Number.isFinite(h.buyPrice) && h.buyPrice > 0 &&
    (h.currentPrice === null || (typeof h.currentPrice === "number" && Number.isFinite(h.currentPrice) && h.currentPrice >= 0)) &&
    (h.source === "manual" || h.source === "sample") && typeof h.createdAt === "string";
}
