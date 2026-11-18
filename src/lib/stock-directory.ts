/** Normalization and de-duplication for exchange-wide instrument discovery. */
export interface DirectoryStock {
  market: "KR" | "US";
  ticker: string;
  name: string;
  asOf?: string;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  return input !== null && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : null;
}
function asString(input: unknown): string { return typeof input === "string" ? input.trim() : ""; }
export function normalizeDirectoryText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[\s.()\-_/]/g, "");
}

export function parseKrxStockItems(payload: unknown): {stocks: DirectoryStock[]; totalCount: number; rows: number} {
  const response = asRecord(asRecord(payload)?.response);
  const header = asRecord(response?.header);
  if (!response || !header || String(header.resultCode) !== "00") throw new Error("Invalid KRX listing response");
  const body = asRecord(response.body);
  const items = asRecord(body?.items)?.item;
  const rows = Array.isArray(items) ? items : items ? [items] : [];
  const latest = new Map<string, {date:string; stock: DirectoryStock}>();
  for (const item of rows) {
    const data = asRecord(item);
    if (!data) continue;
    const ticker = asString(data.srtnCd);
    const name = asString(data.itmsNm);
    const date = asString(data.basDt);
    if (!/^\d{6}$/.test(ticker) || !name || !/^\d{8}$/.test(date)) continue;
    const previous = latest.get(ticker);
    if (!previous || previous.date < date) latest.set(ticker, { date, stock: {market:"KR",ticker,name,asOf:date} });
  }
  const rawTotal = Number(body?.totalCount);
  return {
    stocks: [...latest.values()].map(v=>v.stock),
    totalCount: Number.isFinite(rawTotal) ? rawTotal : rows.length,
    rows: rows.length,
  };
}

/** The approved FSC daily-close API also exposes name/code fields for active shares.
 * It is used for search when the separate KRX master API has not been approved.
 */
export function parseFscStockItems(payload: unknown): {stocks: DirectoryStock[]; totalCount: number; rows: number} {
  const response = asRecord(asRecord(payload)?.response);
  const header = asRecord(response?.header);
  if (!response || !header || String(header.resultCode) !== "00") throw new Error("Invalid FSC stock-price response");
  const body = asRecord(response.body);
  const items = asRecord(body?.items)?.item;
  const rows = Array.isArray(items) ? items : items ? [items] : [];
  const latest = new Map<string, DirectoryStock>();
  for (const item of rows) {
    const data = asRecord(item);
    if (!data) continue;
    const ticker = asString(data.srtnCd);
    const name = asString(data.itmsNm);
    const asOf = asString(data.basDt);
    if (!/^\d{6}$/.test(ticker) || !name || !/^\d{8}$/.test(asOf)) continue;
    const earlier = latest.get(ticker);
    if (!earlier || (earlier.asOf ?? "") < asOf) latest.set(ticker, { market: "KR", ticker, name, asOf });
  }
  const rawTotal = Number(body?.totalCount);
  return {
    stocks: [...latest.values()],
    totalCount: Number.isFinite(rawTotal) ? rawTotal : rows.length,
    rows: rows.length,
  };
}

export function parseFinnhubSymbols(payload: unknown): DirectoryStock[] {
  if (!Array.isArray(payload)) throw new Error("Invalid Finnhub directory response");
  const unique = new Map<string, DirectoryStock>();
  for (const entry of payload) {
    const item = asRecord(entry);
    if (!item) continue;
    const ticker = asString(item.symbol).toUpperCase();
    const name = asString(item.description) || asString(item.displaySymbol);
    const type = asString(item.type).toLowerCase();
    const currency = asString(item.currency).toUpperCase();
    if (!/^[A-Z][A-Z0-9.\-^]{0,29}$/.test(ticker) || !name) continue;
    if (currency && currency !== "USD") continue;
    if (/etf|etn|fund|warrant|option|right|unit|index|bond|note/.test(type)) continue;
    // Exchange security master includes some inactive or OTC instruments; coverage is provider-dependent.
    if (!unique.has(ticker)) unique.set(ticker, {market:"US",ticker,name});
  }
  return [...unique.values()];
}

export function searchDirectory(stocks: DirectoryStock[], query: string, limit = 25): DirectoryStock[] {
  const q = normalizeDirectoryText(query);
  if (!q) return stocks.slice(0, limit);
  return stocks.map((stock) => {
    const ticker = normalizeDirectoryText(stock.ticker);
    const name = normalizeDirectoryText(stock.name);
    const score = ticker === q || name === q ? 0
      : ticker.startsWith(q) ? 1 : name.startsWith(q) ? 2
      : ticker.includes(q) ? 3 : name.includes(q) ? 4 : Infinity;
    return {stock,score};
  }).filter(x=>Number.isFinite(x.score))
    .sort((a,b)=>a.score-b.score || a.stock.name.localeCompare(b.stock.name,"ko"))
    .slice(0,limit).map(x=>x.stock);
}
