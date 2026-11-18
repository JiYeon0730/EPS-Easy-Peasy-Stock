"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { quoteKey, uniqueSymbols, type MarketQuote, type QuoteBatchResult, type QuoteFailure, type QuoteMap } from "@/lib/market-quotes";
import type { Holding } from "@/lib/stocks";

interface QuotesContextValue {
  quotes: QuoteMap;
  failures: QuoteFailure[];
  loading: boolean;
  lastCheckedAt: string | null;
  error: string | null;
  refresh: () => void;
}
const QuotesContext = createContext<QuotesContextValue | null>(null);

export function QuotesProvider({ children, holdings, ready }: {children: ReactNode; holdings: Holding[]; ready: boolean}) {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [failures, setFailures] = useState<QuoteFailure[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const symbols = useMemo(() => uniqueSymbols(holdings), [holdings]);
  const key = JSON.stringify(symbols);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!ready) return;
    const requestItems = JSON.parse(key) as typeof symbols;
    if (requestItems.length === 0) return;
    let active = true;
    const controller = new AbortController();
    async function getAll() {
      setLoading(true);
      setError(null);
      try {
        const quoteMap: QuoteMap = {};
        const quoteFailures: QuoteFailure[] = [];
        // The API has a 15-symbol limit per request, split for bigger portfolios.
        for (let i = 0; i < requestItems.length; i += 15) {
          const response = await fetch("/api/quotes", {method:"POST", headers:{"content-type":"application/json"},
            body: JSON.stringify({symbols:requestItems.slice(i,i+15)}), signal:controller.signal, cache:"no-store"});
          if (!response.ok) throw new Error(response.status === 429 ? "조회 요청이 많아요. 잠시 후 다시 시도해 주세요." : "시세 조회에 실패했습니다.");
          const result = await response.json() as QuoteBatchResult;
          for (const quote of result.quotes) quoteMap[quoteKey(quote.market, quote.ticker)] = quote;
          quoteFailures.push(...result.failures);
        }
        if (!active) return;
        setQuotes(quoteMap);
        setFailures(quoteFailures);
        setLastCheckedAt(new Date().toISOString());
      } catch (e) {
        if (!active) return;
        // Never silently present old quotes as current after a failed refresh.
        setQuotes({});
        setFailures([]);
        setError(e instanceof Error ? e.message : "시세 조회에 실패했습니다.");
        setLastCheckedAt(new Date().toISOString());
      } finally { if (active) setLoading(false); }
    }
    void getAll();
    return () => { active = false; controller.abort(); };
  // key is the canonical list of symbols; refresh on demand or every 60 seconds.
  }, [ready, key, nonce]);

  useEffect(() => {
    if (!ready || symbols.length === 0) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible" && !loading) refresh(); }, 60_000);
    // After a background tab becomes active, request a new quote only if the prior check is old.
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !loading && (!lastCheckedAt || Date.now() - Date.parse(lastCheckedAt) > 60_000)) refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility);};
  }, [ready, symbols.length, refresh, loading, lastCheckedAt]);

  const value = useMemo(() => ({quotes, failures, loading, lastCheckedAt, error, refresh}), [quotes, failures, loading, lastCheckedAt, error, refresh]);
  return <QuotesContext.Provider value={value}>{children}</QuotesContext.Provider>;
}
export function useQuotes(): QuotesContextValue {
  const value = useContext(QuotesContext);
  if (!value) throw new Error("useQuotes must be within QuotesProvider");
  return value;
}
export function quoteDisplayStatus(quote: MarketQuote | undefined, holding: Holding) {
  if (quote) return quote.provider === "FSC" ? `금융위 일별 종가 (${quote.quoteDate ?? "기준일 미상"})` : `${quote.provider} API 조회`;
  if (holding.currentPrice === null) return "시세 미조회";
  return holding.source === "sample" ? "샘플 참고가" : "직접 입력 참고가";
}
