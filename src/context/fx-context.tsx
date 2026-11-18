"use client";

import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from "react";
import type {UsdKrwRate} from "@/lib/fx-rates";

interface FxContextValue {
  rate: UsdKrwRate | null;
  loading: boolean;
  error: string | null;
  lastCheckedAt: string | null;
  refresh: () => void;
}
const FxContext = createContext<FxContextValue | null>(null);

export function FxProvider({children, enabled}: {children:ReactNode;enabled:boolean}) {
  const [rate,setRate] = useState<UsdKrwRate | null>(null);
  const [error,setError] = useState<string | null>(null);
  const [loading,setLoading] = useState(false);
  const [lastCheckedAt,setLastCheckedAt] = useState<string | null>(null);
  const [nonce,setNonce] = useState(0);
  const refresh = useCallback(()=>setNonce((n)=>n+1),[]);

  useEffect(()=>{
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    async function fetchRate() {
      setLoading(true);
      try {
        const response = await fetch("/api/fx",{cache:"no-store",signal:controller.signal});
        if (!response.ok) throw new Error("환율 데이터를 불러올 수 없어요.");
        const data: UsdKrwRate = await response.json();
        if (data.base!=="USD" || data.quote!=="KRW" || !Number.isFinite(data.rate) || data.rate<=0) throw new Error("환율 데이터가 올바르지 않아요.");
        if (!active) return;
        setRate(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setRate(null); // Never present an expired reference rate as the latest one.
        setError(err instanceof Error?err.message:"환율 조회에 실패했어요.");
      } finally {
        if (active) {setLoading(false);setLastCheckedAt(new Date().toISOString());}
      }
    }
    void fetchRate();
    return ()=>{active=false;controller.abort();};
  },[enabled,nonce]);

  useEffect(()=>{
    if (!enabled) return;
    const interval = window.setInterval(()=>{if(document.visibilityState==="visible")refresh();},60*60*1000);
    return ()=>window.clearInterval(interval);
  },[enabled,refresh]);
  const value = useMemo(()=>({rate:enabled?rate:null,loading:enabled&&loading,error:enabled?error:null,lastCheckedAt:enabled?lastCheckedAt:null,refresh}),[enabled,rate,loading,error,lastCheckedAt,refresh]);
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}

export function useFx(): FxContextValue {
  const context = useContext(FxContext);
  if (!context) throw new Error("useFx must be inside FxProvider");
  return context;
}
