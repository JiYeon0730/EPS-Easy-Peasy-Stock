"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Filter, Plus, Search, Sparkles } from "lucide-react";
import { PageHeading, EmptyState } from "@/components/common/ui";
import { StockModal } from "@/components/portfolio/stock-modal";
import {CurrencySwitcher} from "@/components/currency/dual-money";
import {useFx} from "@/context/fx-context";
import { QuoteStatus } from "@/components/portfolio/quote-status";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { useHoldings } from "@/context/holdings-context";
import type { Holding, Market } from "@/lib/stocks";

function PortfolioContent() {
  const { holdings, ready, mode, syncError, refreshCloud, useSample, remove, sampleCount, clearSamples } = useHoldings();
  const params = useSearchParams();
  const {rate,loading:fxLoading,error:fxError} = useFx();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<"ALL" | Market>("ALL");
  const closeModal = useCallback(() => { setModalOpen(false); setEditing(null); }, []);
  // 주소에 ?add=1로 접근했을 때 종목 등록 모달을 여는 클라이언트 라우팅 연동입니다.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (params.get("add") === "1") setModalOpen(true); }, [params]);

  const filtered = useMemo(() => holdings.filter((h) => (market === "ALL" || h.market === market) && `${h.name} ${h.ticker}`.toLowerCase().includes(query.trim().toLowerCase())), [holdings, market, query]);
  function exportCsv() {
    const header = ["시장", "종목명", "종목코드", "수량", "평균매수가", "참고현재가", "유형"];
    const cells = [header, ...filtered.map((h) => [h.market, h.name, h.ticker, h.quantity, h.buyPrice, h.currentPrice ?? "", h.source])];
    const csv = "\uFEFF" + cells.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "eps-portfolio.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <PageHeading eyebrow="MY PORTFOLIO" title="내 주식" description="내가 가진 주식을 한곳에 기록하고, 매수 원금과 손익을 쉽게 확인해요." action={<button type="button" className="primary-btn" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={17}/> 종목 추가</button>}/>
    {mode === "cloud" && <p role="status" className="mb-4 rounded-xl border border-[#D9EDE2] bg-[#F2FAF6] px-4 py-3 text-[12px] text-[#32735D]">Supabase 클라우드 저장 모드 · 이 계정에 등록한 종목만 표시해요. 샘플은 클라우드에 저장되지 않아요.</p>}
    {syncError && <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-[#F0D5D0] bg-[#FFF5F3] px-4 py-3 text-[12px] text-[#AE5242]"><span>{syncError}</span><button type="button" className="secondary-btn" onClick={() => void refreshCloud()}>다시 조회</button></div>}
    <QuoteStatus/>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[15px] border border-[#E0EAE5] bg-white px-5 py-3"><CurrencySwitcher/><span className="text-[11px] text-[#80968D]">{rate?`환율: 1 USD ≈ ₩${rate.rate.toLocaleString("ko-KR")} (${rate.date} 기준)` : fxLoading?"환율 조회 중":fxError?"환율 조회 실패 · 원통화만 표시":"환율 확인 중"} · 실시간 환율 아님</span></div>
    <div className="panel mb-5 flex flex-wrap items-center gap-3 p-4 sm:p-5"><div className="relative min-w-[210px] flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4B3B8]" size={17}/><input aria-label="종목 검색" value={query} onChange={(e) => setQuery(e.target.value)} className="input" style={{paddingLeft:40}} placeholder="종목명 또는 종목코드 검색" /></div><div className="flex items-center gap-2 text-[#A0AAAF]"><Filter size={16}/><select aria-label="시장 필터" value={market} onChange={(e) => setMarket(e.target.value as "ALL" | Market)} className="input" style={{width:140}}><option value="ALL">전체 시장</option><option value="KR">국내 주식</option><option value="US">미국 주식</option></select></div><button type="button" className="secondary-btn" onClick={exportCsv} disabled={filtered.length === 0}><Download size={16}/> CSV 저장</button></div>
    <div className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFF2F3] px-5 py-5 sm:px-6"><div><h2 className="text-[16px] font-bold">보유 종목 <span className="ml-1 text-[#149171]">{ready ? filtered.length : "—"}</span></h2><p className="mt-1 text-[12px] text-[#97A5AB]">기본은 국내 주식은 원화, 미국 주식은 달러로 표시해요. 상단에서 표시 통화를 변경할 수 있어요.</p></div><div className="flex items-center gap-3">{sampleCount > 0 && <button type="button" className="rounded-md px-2 py-1 text-[13px] font-semibold leading-5 tracking-normal text-[#B28739] hover:bg-[#FFF7E8] hover:underline" onClick={clearSamples}>샘플 삭제</button>}<span className="rounded-full bg-[#F2F8F5] px-3 py-1 text-[11px] font-bold text-[#5A927B]">{mode === "cloud" ? "Supabase 저장" : "브라우저 저장"}</span></div></div>
      {!ready ? <div className="p-10 text-center text-[#98A5AE]">내 데이터를 불러오는 중...</div> : filtered.length ? <HoldingsTable holdings={filtered} onEdit={(h) => { setEditing(h); setModalOpen(true); }} onDelete={(h) => { if (window.confirm(`${h.name} 종목을 삭제할까요?`)) void remove(h.id).catch((cause) => window.alert(cause instanceof Error ? cause.message : "삭제에 실패했어요.")); }}/>: holdings.length === 0 ? <EmptyState title="아직 보유 종목이 없어요" description="처음 주식을 시작했다면 종목을 직접 입력하거나, 샘플 데이터로 서비스를 체험해 보세요." action={<div className="flex flex-wrap justify-center gap-2"><button type="button" className="primary-btn" onClick={() => setModalOpen(true)}><Plus size={16}/> 첫 종목 추가</button><button type="button" className="secondary-btn" onClick={useSample}><Sparkles size={16}/> 샘플 체험</button></div>}/> : <EmptyState icon={Search} title="검색 결과가 없어요" description="다른 종목명이나 시장 필터로 다시 검색해 보세요."/>}
    </div>
    <div className="mt-5 rounded-[16px] border border-[#E4ECEB] bg-[#F0F8F4] px-5 py-4 text-[12px] leading-[1.8] text-[#6B8F82]">ⓘ 종목과 매수가 등 보유 정보는 브라우저에만 저장돼요. 국내는 금융위원회 API의 일별 종가(기준일 다음 영업일 이후 갱신), 미국은 Finnhub 가격을 표시합니다. 미연결 종목은 참고가로 표시합니다. 금융위원회 데이터는 제3자 무단 제공·재배포가 제한되며 EPS의 이번 연결은 개인 로컬 테스트용입니다.</div>
    {modalOpen && <StockModal editing={editing} onClose={closeModal}/>}
  </>;
}

export default function PortfolioPage() {
  // Next.js App Router requires Suspense for client-side useSearchParams on prerender.
  return <Suspense fallback={<div className="panel p-10">보유 종목 화면을 준비하는 중...</div>}><PortfolioContent/></Suspense>;
}
