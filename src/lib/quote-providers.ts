// Server-side module: imported only by src/app/api/quotes/route.ts.
import { type MarketQuote, type QuoteFailure, type QuoteFailureCode, type QuoteRequestItem, validPrice } from "./market-quotes";
import { parseFscDailyClose } from "./fsc-stock-quote";

const CACHE_MS = 60_000;
const NEGATIVE_CACHE_MS = 15_000;
const FSC_CACHE_MS = 6 * 60 * 60 * 1000; // Official data changes only once per business day.
const TIMEOUT_MS = 8_000;
const cached = new Map<string, { result: MarketQuote | QuoteFailure; expiresAt: number }>();
const pending = new Map<string, Promise<MarketQuote | QuoteFailure>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function asPrice(v: unknown): number | null {
  const n = typeof v === "string" && v.trim() ? Number(v) : v;
  return validPrice(n) ? n : null;
}
function asFinite(v: unknown): number | null {
  const n = typeof v === "string" && v.trim() ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}
function failure(request: QuoteRequestItem, code: QuoteFailureCode): QuoteFailure {
  return { ...request, code };
}
async function jsonResponse(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`API HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function getFinnhub(request: QuoteRequestItem): Promise<MarketQuote | QuoteFailure> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return failure(request, "NOT_CONFIGURED");
  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", request.ticker);
  try {
    const data = await jsonResponse(url.toString(), { headers: { "X-Finnhub-Token": token } });
    if (!isRecord(data)) return failure(request, "NO_DATA");
    const price = asPrice(data.c);
    if (price === null) return failure(request, "NO_DATA");
    const tradeTs = asFinite(data.t);
    const previousClose = asPrice(data.pc);
    const pct = asFinite(data.dp);
    return { market: "US", ticker: request.ticker, price, provider: "Finnhub", fetchedAt: new Date().toISOString(),
      tradedAt: tradeTs && tradeTs > 0 ? new Date(tradeTs * 1000).toISOString() : null,
      previousClose, changePercent: pct ?? (previousClose ? ((price - previousClose) / previousClose) * 100 : null) };
  } catch {
    return failure(request, "UPSTREAM_ERROR");
  }
}

/** Obtain the latest available *daily close*, not a real-time price. */
async function getFscDailyClose(request: QuoteRequestItem): Promise<MarketQuote | QuoteFailure> {
  const serviceKey = process.env.FSC_STOCK_API_KEY?.trim();
  if (!serviceKey) return failure(request, "NOT_CONFIGURED");
  const url = new URL("https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2");
  // The portal supplies both encoded and decoded keys. URLSearchParams handles encoding once.
  // Prefer the decoding key; normalize the encoded variant if it was pasted instead.
  let key = serviceKey;
  try { if (/%[0-9a-fA-F]{2}/.test(key)) key = decodeURIComponent(key); }
  catch { return failure(request, "UPSTREAM_ERROR"); }
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("resultType", "json");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("likeSrtnCd", request.ticker);
  // Use a date range rather than today's date because values arrive on T+1 business day.
  const dateParts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const datePart = (type: string) => dateParts.find((part) => part.type === type)?.value ?? "";
  const start = new Date(`${datePart("year")}-${datePart("month")}-${datePart("day")}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 45);
  url.searchParams.set("beginBasDt", start.toISOString().slice(0, 10).replaceAll("-", ""));
  try {
    const data = await jsonResponse(url.toString(), {});
    if (isRecord(data) && isRecord(data.response) && isRecord(data.response.header)
      && String(data.response.header.resultCode) !== "00") return failure(request, "UPSTREAM_ERROR");
    const parsed = parseFscDailyClose(data, request.ticker);
    if (!parsed) return failure(request, "NO_DATA");
    return {
      market: "KR", ticker: request.ticker, price: parsed.price, provider: "FSC",
      fetchedAt: new Date().toISOString(), tradedAt: null, quoteDate: parsed.quoteDate,
      previousClose: parsed.previousClose, changePercent: parsed.changePercent,
    };
  } catch {
    // Do not log request URLs because the service key is in the URL query.
    return failure(request, "UPSTREAM_ERROR");
  }
}

async function uncachedQuote(request: QuoteRequestItem): Promise<MarketQuote | QuoteFailure> {
  return request.market === "KR" ? getFscDailyClose(request) : getFinnhub(request);
}

export async function providerQuote(request: QuoteRequestItem): Promise<MarketQuote | QuoteFailure> {
  const id = `${request.market}:${request.ticker}`;
  const current = cached.get(id);
  if (current && current.expiresAt > Date.now()) return current.result;
  const inProgress = pending.get(id);
  if (inProgress) return inProgress;
  const promise = uncachedQuote(request).then((result) => {
    const ttl = "price" in result ? (request.market === "KR" ? FSC_CACHE_MS : CACHE_MS) : NEGATIVE_CACHE_MS;
    cached.set(id, { result, expiresAt: Date.now() + ttl });
    return result;
  }).finally(() => { pending.delete(id); });
  pending.set(id, promise);
  return promise;
}

export async function fetchQuoteBatch(items: QuoteRequestItem[]) {
  // Small sequential groups bound requests to the provider quota in a local development environment.
  const results: (MarketQuote | QuoteFailure)[] = [];
  for (let i = 0; i < items.length; i += 3) {
    const group = await Promise.all(items.slice(i, i + 3).map(providerQuote));
    results.push(...group);
  }
  return { quotes: results.filter((r): r is MarketQuote => "price" in r), failures: results.filter((r): r is QuoteFailure => "code" in r) };
}
