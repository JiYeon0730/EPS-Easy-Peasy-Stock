"use client";

/* eslint-disable react-hooks/set-state-in-effect -- External localStorage/auth data must hydrate React state on mount and account changes. */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { QuotesProvider } from "@/context/quotes-context";
import { FxProvider } from "@/context/fx-context";
import { createClient } from "@/lib/supabase/client";
import { DEMO_HOLDINGS, isHolding, type Holding, type HoldingInput } from "@/lib/stocks";
import { errorMessage, stockKey, toHolding, toHoldingInsert, toHoldingUpdate, type HoldingRow } from "@/lib/holdings-db";

const STORAGE_KEY = "eps.holdings.v1";
type StorageMode = "checking" | "local" | "cloud";

interface HoldingsContextValue {
  holdings: Holding[];
  ready: boolean;
  mode: StorageMode;
  syncError: string | null;
  userId: string | null;
  sampleCount: number;
  add: (input: HoldingInput) => Promise<void>;
  update: (id: string, input: HoldingInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  useSample: () => void;
  clearSamples: () => void;
  clearAll: () => Promise<void>;
  refreshCloud: () => Promise<void>;
}

const HoldingsContext = createContext<HoldingsContextValue | null>(null);

export function HoldingsProvider({ children }: { children: ReactNode }) {
  const [localHoldings, setLocalHoldings] = useState<Holding[]>([]);
  const [localReady, setLocalReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined);
  const [cloudForUser, setCloudForUser] = useState<string | null>(null);
  const [cloudHoldings, setCloudHoldings] = useState<Holding[]>([]);
  const [cloudSamples, setCloudSamples] = useState<Holding[]>([]);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const mode: StorageMode = sessionUserId === undefined ? "checking" : sessionUserId ? "cloud" : "local";
  const ready = localReady && mode !== "checking" && (mode === "local" || (cloudReady && cloudForUser === sessionUserId));
  const holdings = mode === "cloud" ? (cloudForUser === sessionUserId ? [...cloudSamples, ...cloudHoldings] : []) : mode === "local" ? localHoldings : [];

  // Preserve the pre-Supabase data: do not overwrite it with an account's holdings.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setLocalHoldings(parsed.filter(isHolding));
    } catch { /* Damaged local cache: users can still log in. */ }
    setLocalReady(true);
  }, []);

  useEffect(() => {
    if (!localReady) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localHoldings)); }
    catch { /* Browser storage unavailable. */ }
  }, [localHoldings, localReady]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setSessionUserId(null); return; }
    let active = true;
    let newerAuthEvent = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Keep the callback synchronous; API calls inside an auth listener can deadlock.
      if (event !== "INITIAL_SESSION" && active) {
        newerAuthEvent = true;
        setSessionUserId(session?.user?.id ?? null);
      }
    });
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active || newerAuthEvent) return;
      if (error) setSyncError("로그인 상태를 확인하지 못했어요. 다시 로그인해 주세요.");
      setSessionUserId(data.user?.id ?? null);
    }).catch(() => {
      if (active) { setSyncError("인증 서버에 연결할 수 없어요."); setSessionUserId(null); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      setCloudForUser(null);
      setCloudHoldings([]);
      setCloudSamples([]);
      setCloudReady(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    let active = true;
    // Clear the previously authenticated account immediately on an account change.
    setCloudForUser(null);
    setCloudHoldings([]);
    setCloudSamples([]);
    setCloudReady(false);
    setSyncError(null);
    void (async () => {
      try {
        // Pagination avoids silently losing rows if the portfolio exceeds the API default 1,000-row limit.
        const rows: HoldingRow[] = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await supabase.from("holdings")
            .select("id,ticker,name,market,quantity,buy_price,reference_price,source,created_at")
            .eq("user_id", sessionUserId).order("created_at", { ascending: false })
            .range(offset, offset + 499);
          if (error) throw error;
          const page = (data ?? []) as HoldingRow[];
          rows.push(...page);
          if (page.length < 500) break;
        }
        if (!active) return;
        setCloudHoldings(rows.map(toHolding));
        setCloudForUser(sessionUserId);
        setCloudReady(true);
      } catch (cause) {
        if (!active) return;
        setCloudHoldings([]);
        setCloudForUser(null);
        setCloudReady(false);
        setSyncError(`Supabase 종목 조회 실패: ${errorMessage(cause)}`);
      }
    })();
    return () => { active = false; };
  }, [sessionUserId, revision]);

  const refreshCloud = useCallback(async () => { setRevision((value) => value + 1); }, []);

  const requireCloud = () => {
    const supabase = createClient();
    if (!supabase || !sessionUserId || !ready || cloudForUser !== sessionUserId) {
      throw new Error("로그인 후 클라우드 종목 조회가 끝나면 다시 시도해 주세요.");
    }
    return { supabase, userId: sessionUserId };
  };

  async function add(input: HoldingInput) {
    const record = toHoldingInsert("validated", input);
    if (mode === "local" && ready) {
      setLocalHoldings((previous) => [{
        ...input, ticker: record.ticker, name: record.name, id: crypto.randomUUID(),
        source: "manual", createdAt: new Date().toISOString(),
      }, ...previous]);
      return;
    }
    const { supabase, userId } = requireCloud();
    const { data, error } = await supabase.from("holdings")
      .insert({ ...record, user_id: userId })
      .select("id,ticker,name,market,quantity,buy_price,reference_price,source,created_at").single();
    if (error) throw new Error(errorMessage(error));
    setCloudHoldings((previous) => [toHolding(data as HoldingRow), ...previous]);
    setSyncError(null);
  }

  async function update(id: string, input: HoldingInput) {
    const fields = toHoldingUpdate(input);
    if (mode === "local" && ready) {
      setLocalHoldings((previous) => previous.map((holding) => holding.id === id
        ? { ...holding, ...input, ...{ticker:fields.ticker, name:fields.name}, source: "manual" } : holding));
      return;
    }
    if (id.startsWith("demo-")) throw new Error("체험용 샘플은 수정할 수 없어요. 샘플을 삭제한 뒤 직접 등록해 주세요.");
    const { supabase, userId } = requireCloud();
    const { data, error } = await supabase.from("holdings")
      .update(fields).eq("id", id).eq("user_id", userId)
      .select("id,ticker,name,market,quantity,buy_price,reference_price,source,created_at").single();
    if (error) throw new Error(errorMessage(error));
    setCloudHoldings((previous) => previous.map((holding) => holding.id === id ? toHolding(data as HoldingRow) : holding));
    setSyncError(null);
  }

  async function remove(id: string) {
    if (mode === "local" && ready) { setLocalHoldings((previous) => previous.filter((holding) => holding.id !== id)); return; }
    if (id.startsWith("demo-")) { setCloudSamples((previous) => previous.filter((holding) => holding.id !== id)); return; }
    const { supabase, userId } = requireCloud();
    const { data, error } = await supabase.from("holdings")
      .delete().eq("id", id).eq("user_id", userId).select("id");
    if (error) throw new Error(errorMessage(error));
    if (!data?.length) throw new Error("삭제할 종목을 찾지 못했어요. 새로고침 후 다시 시도해 주세요.");
    setCloudHoldings((previous) => previous.filter((holding) => holding.id !== id));
    setSyncError(null);
  }

  function useSample() {
    if (mode === "cloud") {
      if (ready) setCloudSamples(DEMO_HOLDINGS.filter((demo) => !cloudHoldings.some((real) => stockKey(real.market,real.ticker) === stockKey(demo.market,demo.ticker))));
    } else if (mode === "local") {
      setLocalHoldings((previous) => [...DEMO_HOLDINGS, ...previous.filter((holding) => holding.source !== "sample")]);
    }
  }
  function clearSamples() {
    if (mode === "cloud") setCloudSamples([]);
    else if (mode === "local") setLocalHoldings((previous) => previous.filter((holding) => holding.source !== "sample"));
  }
  async function clearAll() {
    if (mode === "local" && ready) { setLocalHoldings([]); return; }
    const { supabase, userId } = requireCloud();
    const { error } = await supabase.from("holdings").delete().eq("user_id", userId);
    if (error) throw new Error(errorMessage(error));
    setCloudHoldings([]); setCloudSamples([]); setSyncError(null);
  }

  const value: HoldingsContextValue = {
    holdings, ready, mode, syncError, userId: sessionUserId ?? null,
    sampleCount: holdings.filter((holding) => holding.source === "sample").length,
    add, update, remove, useSample, clearSamples, clearAll, refreshCloud,
  };

  return <HoldingsContext.Provider value={value}>
    <FxProvider enabled={ready}><QuotesProvider holdings={holdings} ready={ready}>{children}</QuotesProvider></FxProvider>
  </HoldingsContext.Provider>;
}

export function useHoldings() {
  const context = useContext(HoldingsContext);
  if (!context) throw new Error("useHoldings must be inside HoldingsProvider");
  return context;
}
