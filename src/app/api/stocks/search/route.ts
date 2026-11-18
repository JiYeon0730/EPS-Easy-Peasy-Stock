import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/lib/stock-catalog";
import { searchRemoteStocks } from "@/lib/stock-directory-provider";
import type { Market } from "@/lib/stocks";

export const runtime = "nodejs";

// Local-development throttle. Use persistent user-based limits after adding Auth.
const hits = new Map<string, { count: number; until: number }>();
const HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const market = params.get("market");
  const q = (params.get("q") ?? "").trim();
  if (market !== "KR" && market !== "US") {
    return NextResponse.json({ error: "지원하지 않는 시장입니다." }, { status: 400 });
  }
  if (q.length < 1 || q.length > 60 || /[<>\x00-\x1F]/.test(q)) {
    return NextResponse.json({ error: "검색어를 1~60자로 입력해 주세요." }, { status: 400 });
  }

  const id = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  if (hits.size > 400) for (const [ip, value] of hits) if (value.until < now) hits.delete(ip);
  const prev = hits.get(id);
  if (prev && prev.until > now && prev.count >= 40) {
    return NextResponse.json({ error: "검색 요청이 많아요. 잠시 후 다시 검색해 주세요." }, { status: 429, headers: HEADERS });
  }
  hits.set(id, prev && prev.until > now ? { ...prev, count: prev.count + 1 } : { count: 1, until: now + 60_000 });

  try {
    const result = await searchRemoteStocks(market, q);
    const messages = [
      result.provider === "FSC"
        ? "국내 주식시세정보의 최근 거래 종목에서 검색했어요. 거래정지·신규상장 종목은 검색되지 않을 수 있어요."
        : null,
      result.truncated ? "일부 결과만 표시했어요. 종목명이나 코드를 더 자세히 입력해 주세요." : null,
    ].filter(Boolean);
    return NextResponse.json({ ...result, source: "remote", message: messages.join(" ") || null }, { headers: HEADERS });
  } catch (error) {
    // Raw upstream errors may include URLs and API keys. Never return those details.
    const missing = error instanceof Error && error.message.startsWith("MISSING_");
    const message = market === "KR"
      ? missing
        ? "금융위원회 API 키가 없어 추천 목록에서만 검색 중이에요."
        : "국내 종목 검색 API에 연결하지 못했어요. 기존 주식시세정보 API 키와 활용신청을 확인해 주세요."
      : missing
        ? "Finnhub API 키가 없어 추천 목록에서만 검색 중이에요."
        : "Finnhub 종목 목록을 불러오지 못했어요. 잠시 후 다시 검색해 주세요.";
    return NextResponse.json({
      stocks: searchCatalog(market as Market, q, 30),
      provider: "local", source: "fallback", truncated: false,
      message: `${message} 검색에 없으면 직접 입력할 수 있어요.`,
    }, { headers: HEADERS });
  }
}
