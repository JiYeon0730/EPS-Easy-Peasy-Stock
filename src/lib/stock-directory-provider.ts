/** Server-only stock discovery. Credentials never leave Next.js Route Handlers. */
import {
  parseFinnhubSymbols,
  parseFscStockItems,
  parseKrxStockItems,
  searchDirectory,
  type DirectoryStock,
} from "./stock-directory";

const US_CACHE_MS = 12 * 60 * 60 * 1000;
const KR_CACHE_MS = 60 * 60 * 1000;
const MAX_QUERY_CACHE = 250;
const PAGE_SIZE = 300;
const MAX_PAGES = 5;

export interface DirectoryResponse {
  stocks: DirectoryStock[];
  truncated: boolean;
  provider: "KRX" | "FSC" | "Finnhub";
}

const krCache = new Map<string, { until: number; data: DirectoryResponse }>();
const krPending = new Map<string, Promise<DirectoryResponse>>();
let usCache: { until: number; stocks: DirectoryStock[] } | null = null;
let usPending: Promise<DirectoryStock[]> | null = null;

function serviceKey(raw: string): string {
  // URLSearchParams encodes once; decode keys copied from the portal's Encoding tab.
  try { return /%[a-fA-F0-9]{2}/.test(raw) ? decodeURIComponent(raw) : raw; }
  catch { throw new Error("BAD_SERVICE_KEY"); }
}

function seoulDateMinusDays(days: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(x => x.type === type)?.value ?? "";
  const date = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

async function requestJson(url: URL, headers?: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, {
    headers, cache: "no-store", signal: AbortSignal.timeout(12_000),
  });
  // Never log or expose the URL: the public-data URL contains serviceKey.
  if (!response.ok) throw new Error(`UPSTREAM_HTTP_${response.status}`);
  return response.json() as Promise<unknown>;
}

type KoreanProvider = "KRX" | "FSC";

async function searchKoreanProvider(
  provider: KoreanProvider, query: string, key: string,
): Promise<DirectoryResponse> {
  const address = provider === "KRX"
    ? "https://apis.data.go.kr/1160100/GetKrxListedInfoService_V2/getItemInfo_V2"
    : "https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2";

  const all: DirectoryStock[] = [];
  let truncated = false;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(address);
    url.searchParams.set("serviceKey", serviceKey(key));
    url.searchParams.set("resultType", "json");
    url.searchParams.set("pageNo", String(page));
    url.searchParams.set("numOfRows", String(PAGE_SIZE));
    // Both feeds contain historical daily rows. Use recent sessions, not a single
    // calendar date, to cover weekends and exchange holidays.
    url.searchParams.set("beginBasDt", seoulDateMinusDays(21));
    url.searchParams.set(/^\d/.test(query) ? "likeSrtnCd" : "likeItmsNm", query);

    const raw = await requestJson(url);
    const parsed = provider === "KRX" ? parseKrxStockItems(raw) : parseFscStockItems(raw);
    all.push(...parsed.stocks);
    if (page * PAGE_SIZE >= parsed.totalCount || parsed.rows === 0) break;
    if (page === MAX_PAGES) truncated = true;
  }

  const newest = new Map<string, DirectoryStock>();
  for (const stock of all) {
    const older = newest.get(stock.ticker);
    if (!older || (older.asOf ?? "") < (stock.asOf ?? "")) newest.set(stock.ticker, stock);
  }
  // The query is forwarded to the provider, but rank the actual returned symbols
  // locally as well (the provider also returns historical name variants).
  const result = searchDirectory([...newest.values()], query, 30);
  return { stocks: result, truncated: truncated || newest.size > 30, provider };
}

async function fetchKr(query: string): Promise<DirectoryResponse> {
  const listingKey = process.env.FSC_LIST_API_KEY?.trim();
  const quoteKey = process.env.FSC_STOCK_API_KEY?.trim();
  if (!listingKey && !quoteKey) throw new Error("MISSING_KR_KEY");

  const cacheKey = query.normalize("NFKC").toLocaleLowerCase();
  const cached = krCache.get(cacheKey);
  if (cached && cached.until > Date.now()) return cached.data;

  // Prefer KRX's security master when separately approved. It can include shares
  // with no recent close. Otherwise reuse the stock-price key already set by EPS.
  // The quote feed can omit newly listed, halted or non-trading shares.
  let result: DirectoryResponse;
  if (listingKey) {
    try {
      result = await searchKoreanProvider("KRX", query, listingKey);
    } catch (error) {
      if (!quoteKey) throw error;
      result = await searchKoreanProvider("FSC", query, quoteKey);
    }
  } else {
    result = await searchKoreanProvider("FSC", query, quoteKey!);
  }
  if (krCache.size >= MAX_QUERY_CACHE) krCache.delete(krCache.keys().next().value!);
  krCache.set(cacheKey, { data: result, until: Date.now() + KR_CACHE_MS });
  return result;
}

async function getUsSymbols(): Promise<DirectoryStock[]> {
  if (usCache && usCache.until > Date.now()) return usCache.stocks;
  if (usPending) return usPending;
  const token = process.env.FINNHUB_API_KEY?.trim();
  if (!token) throw new Error("MISSING_US_KEY");

  usPending = (async () => {
    const url = new URL("https://finnhub.io/api/v1/stock/symbol");
    url.searchParams.set("exchange", "US");
    const stocks = parseFinnhubSymbols(await requestJson(url, { "X-Finnhub-Token": token }));
    usCache = { stocks, until: Date.now() + US_CACHE_MS };
    return stocks;
  })();
  try { return await usPending; }
  finally { usPending = null; }
}

export async function searchRemoteStocks(
  market: "KR" | "US", query: string,
): Promise<DirectoryResponse> {
  if (market === "US") {
    const stocks = searchDirectory(await getUsSymbols(), query, 30);
    return { stocks, truncated: false, provider: "Finnhub" };
  }
  const id = query.normalize("NFKC").toLocaleLowerCase();
  const pending = krPending.get(id);
  if (pending) return pending;
  const promise = fetchKr(query).finally(() => krPending.delete(id));
  krPending.set(id, promise);
  return promise;
}
