import { NextResponse, type NextRequest } from "next/server";
import { fetchQuoteBatch } from "@/lib/quote-providers";
import { type QuoteRequestItem, validQuoteRequestItem } from "@/lib/market-quotes";

export const runtime = "nodejs";
const MAX_SYMBOLS = 15;
const requestsByClient = new Map<string, { count: number; until: number }>();

export async function POST(request: NextRequest) {
  const jsonHeaders = { "Cache-Control": "no-store" };
  // Development-only coarse throttle. Replace with a durable authenticated limiter before public deployment.
  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  if (requestsByClient.size > 500) {
    for (const [key, item] of requestsByClient) if (item.until < now) requestsByClient.delete(key);
  }
  const current = requestsByClient.get(clientId);
  if (current && current.until > now && current.count >= 20) {
    return NextResponse.json({ error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요." }, { status: 429, headers: { ...jsonHeaders, "Retry-After": "60" } });
  }
  requestsByClient.set(clientId, current && current.until > now ? { ...current, count: current.count + 1 } : { count: 1, until: now + 60_000 });

  let data: unknown;
  try { data = await request.json(); }
  catch { return NextResponse.json({ error: "잘못된 JSON 요청입니다." }, {status: 400, headers: jsonHeaders}); }
  if (!data || typeof data !== "object" || !Array.isArray((data as {symbols?:unknown}).symbols)) {
    return NextResponse.json({ error: "symbols 배열이 필요합니다." }, {status: 400, headers: jsonHeaders});
  }
  const submitted = (data as {symbols: unknown[]}).symbols;
  if (submitted.length > MAX_SYMBOLS || submitted.some((item) => !validQuoteRequestItem(item))) {
    return NextResponse.json({ error: "한 번에 유효한 종목 최대 15개만 조회할 수 있습니다." }, {status: 400, headers: jsonHeaders});
  }
  const unique = [...new Map(submitted.map((s) => { const r = s as QuoteRequestItem; return [`${r.market}:${r.ticker}`, r]; })).values()];
  try {
    const result = await fetchQuoteBatch(unique);
    return NextResponse.json({ ...result, fetchedAt: new Date().toISOString(), refreshSeconds: 60 }, { headers: jsonHeaders });
  } catch {
    return NextResponse.json({ error: "시세 제공업체 연결을 처리할 수 없습니다." }, {status: 502, headers: jsonHeaders});
  }
}
