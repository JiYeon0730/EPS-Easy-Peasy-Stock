"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useQuotes } from "@/context/quotes-context";
import { marketSession } from "@/lib/market-session";
import { useHoldings } from "@/context/holdings-context";

export function QuoteStatus() {
  const { holdings } = useHoldings();
  const { quotes, failures, loading, error, lastCheckedAt, refresh } = useQuotes();
  if (holdings.length === 0) return null;
  const unavailable = failures.filter((f) => f.code === "NOT_CONFIGURED");
  const otherFailures = failures.filter((f) => f.code !== "NOT_CONFIGURED");
  const fetchedCount = Object.keys(quotes).length;
  const time = lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString("ko-KR", {hour:"2-digit",minute:"2-digit"}) : null;
  const krSession = marketSession("KR");
  const usSession = marketSession("US");
  const message = error ? error : unavailable.length
    ? `API 키 미설정: ${unavailable.some((f) => f.market === "KR") ? "국내(금융위 일별 종가) " : ""}${unavailable.some((f) => f.market === "US") ? "미국(Finnhub)" : ""}. 미연결 종목은 샘플/직접 입력 참고가로 표시됩니다.`
    : otherFailures.length ? `${otherFailures.length}개 종목의 시세를 가져오지 못했어요. 해당 종목은 참고가로 표시됩니다.`
    : fetchedCount ? "국내는 금융위원회에서 제공하는 기준일 종가(T+1 영업일 이후), 미국은 Finnhub 조회 가격입니다. 실시간 시세를 보장하지 않습니다." : "시세 조회를 준비하고 있어요.";
  return <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[15px] border border-[#DBE9E2] bg-[#F1F8F4] px-4 py-3 text-[12px] text-[#457969]" aria-live="polite">
    <div className="flex min-w-0 flex-1 items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0"/>
      <div className="min-w-0"><strong className="font-bold">외부 시세 연결 {loading ? "확인 중" : `${fetchedCount}개 성공`}</strong>
        <p className="mt-0.5 leading-[1.6]">{message}</p>
        <p className="mt-1 text-[11px] opacity-75">{krSession.label} · {usSession.label} (시간대 참고용 · 휴장일 미반영)</p>
        {time && <p className="mt-1 text-[11px] opacity-75">마지막 시세 조회 요청: {time} · 자동 갱신 60초 (화면 활성 시)</p>}
      </div>
    </div>
    <button type="button" onClick={refresh} disabled={loading} className="secondary-btn shrink-0"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> {loading ? "조회 중" : "새로고침"}</button>
  </div>;
}
