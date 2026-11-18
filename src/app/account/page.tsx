"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CloudUpload, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useHoldings } from "@/context/holdings-context";
import { isHolding, type Holding } from "@/lib/stocks";
import { stockKey } from "@/lib/holdings-db";

const STORAGE_KEY = "eps.holdings.v1";

export default function AccountPage() {
  const router = useRouter();
  const { holdings, mode, ready, syncError, add, refreshCloud } = useHoldings();
  const [email, setEmail] = useState<string | null>(null);
  // No asynchronous auth check is needed when Supabase is not configured.
  const [checking, setChecking] = useState(
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Read the existing browser data only once. The account's list is not shown
  // until the async auth check completes, so SSR and hydration render the
  // same initial UI despite localStorage only existing in the browser.
  const [legacy] = useState<Holding[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed)
        ? parsed.filter(isHolding).filter((item: Holding) => item.source === "manual")
        : [];
    } catch {
      return [];
    }
  });
  const [chosen, setChosen] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    let alive = true;
    void client.auth.getUser().then(({ data, error: authError }) => {
      if (!alive) return;
      if (authError) setError(authError.message);
      setEmail(data.user?.email ?? null);
      setChecking(false);
    }).catch(() => { if (alive) { setError("로그인 상태를 확인할 수 없어요."); setChecking(false); } });
    return () => { alive = false; };
  }, []);

  const remoteKeys = useMemo(() => new Set(holdings.filter((h) => h.source === "manual").map((h) => stockKey(h.market, h.ticker))), [holdings]);
  const eligible = legacy.filter((holding) => !remoteKeys.has(stockKey(holding.market, holding.ticker)));
  const canImport = ready && mode === "cloud" && chosen.length > 0 && !importing;

  async function logout() {
    const client = createClient();
    if (!client) return;
    const { error: authError } = await client.auth.signOut();
    if (authError) { setError(authError.message); return; }
    router.push("/login"); router.refresh();
  }

  async function importSelected() {
    if (!canImport) return;
    setImporting(true);
    setError(""); setNotice("");
    const targets = eligible.filter((item) => chosen.includes(item.id));
    let completed = 0;
    const failed: string[] = [];
    for (const holding of targets) {
      try {
        await add({ ticker: holding.ticker, name: holding.name, market: holding.market,
          quantity: holding.quantity, buyPrice: holding.buyPrice, currentPrice: holding.currentPrice });
        completed++;
        // Remove only completed candidates from the selection; source local data stays unchanged.
        setChosen((previous) => previous.filter((id) => id !== holding.id));
      } catch (cause) {
        failed.push(`${holding.name}: ${cause instanceof Error ? cause.message : "저장 실패"}`);
      }
    }
    setImporting(false);
    if (completed > 0) setNotice(`${completed}개 종목을 Supabase에 저장했어요. 브라우저 원본은 삭제하지 않았어요.`);
    if (failed.length > 0) setError(`${failed.length}개 저장 실패 — ${failed.join(" / ")}`);
  }

  return <section className="mx-auto max-w-[740px] panel p-6 sm:p-9">
    <span className="text-[11px] font-bold tracking-[.14em] text-[#13826A]">MY ACCOUNT</span>
    <h1 className="mt-2 text-[28px] font-extrabold text-[#1C3835]">EPS 계정</h1>
    {checking ? <p className="mt-5 text-[13px] text-[#70857D]">로그인 상태 확인 중...</p> : email ? <>
      <div className="mt-6 rounded-xl border border-[#D8EBE0] bg-[#F4FBF7] p-5">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-[#138264]" size={20}/><div>
          <p className="text-[13px] font-semibold text-[#315E4D]">Supabase 계정으로 로그인됨</p>
          <p className="mt-2 break-all text-[13px] text-[#4B6F61]">{email}</p>
          <p className="mt-2 text-[12px] text-[#4B6F61]">{mode === "cloud" ? ready ? `클라우드 보유 종목 ${holdings.filter(h => h.source !== "sample").length}개` : "클라우드 종목 불러오는 중" : "로컬 보유 종목 모드"}</p>
        </div></div>
      </div>
      <div className="mt-6 rounded-xl border border-[#E4EDE9] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-bold">이전 브라우저 종목 가져오기</h2>
          <button type="button" onClick={() => void refreshCloud()} disabled={importing} className="secondary-btn"><RefreshCw size={15}/> 다시 조회</button>
        </div>
        <p className="mt-2 text-[12px] leading-6 text-[#67857B]">기존 브라우저에 직접 입력한 종목만 가져올 수 있어요. 샘플 데이터는 자동 저장하지 않으며, 이미 클라우드에 같은 코드가 있는 종목은 제외해요. 기존 데이터는 삭제하지 않아요.</p>
        {syncError && <p role="alert" className="mt-3 text-[12px] text-[#B25040]">{syncError}</p>}
        <div className="mt-4 space-y-2">
          {eligible.length === 0 ? <p className="rounded-xl bg-[#F5F8F6] px-4 py-3 text-[12px] text-[#70847C]">가져올 미등록 로컬 종목이 없어요.</p> : eligible.map((holding) => <label key={holding.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E3EEEA] px-3 py-3 text-[12px]">
            <input type="checkbox" checked={chosen.includes(holding.id)} onChange={(event) => setChosen((previous) => event.target.checked ? [...previous, holding.id] : previous.filter((id) => id !== holding.id))} disabled={!ready || importing} className="mt-1 accent-[#147B63]"/>
            <span><strong>{holding.name}</strong> ({holding.ticker}) · {holding.market === "KR" ? "한국" : "미국"} · {holding.quantity}주 · 평균 {holding.buyPrice.toLocaleString()} {holding.market === "KR" ? "원" : "달러"}</span>
          </label>)}
        </div>
        <button type="button" onClick={() => void importSelected()} disabled={!canImport} className="primary-btn mt-4"><CloudUpload size={16}/>{importing ? "클라우드 저장 중..." : `선택한 ${chosen.length}개 종목 가져오기`}</button>
        {notice && <p role="status" className="mt-3 text-[12px] text-[#147B63]">{notice}</p>}
      </div>
      <button type="button" onClick={() => void logout()} className="secondary-btn mt-6"><LogOut size={16}/> 로그아웃</button>
    </> : <><p className="mt-6 text-[13px] text-[#687F78]">로그인 후 이용할 수 있는 페이지예요.</p><Link href="/login" className="primary-btn mt-5">로그인하러 가기</Link></>}
    {error && <p role="alert" className="mt-5 rounded-lg bg-[#FFF0EC] px-3 py-3 text-[12px] text-[#B04A3A]">{error}</p>}
  </section>;
}
