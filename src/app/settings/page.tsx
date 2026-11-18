"use client";

import { useState } from "react";
import { Database, Info, LockKeyhole, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/common/ui";
import { useHoldings } from "@/context/holdings-context";

export default function SettingsPage() {
  const { holdings, mode, ready, syncError, sampleCount, clearSamples, clearAll, useSample } = useHoldings();
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);
  const cloud = mode === "cloud";

  async function eraseAll() {
    if (!ready || clearing) return;
    const confirmText = cloud
      ? "Supabase 계정에 저장된 모든 보유 종목을 삭제할까요? 다른 기기에서도 삭제되며 복구할 수 없어요. 브라우저 이전 데이터는 유지됩니다."
      : "현재 브라우저에 저장된 모든 보유 종목을 삭제할까요? 복구할 수 없습니다.";
    if (!window.confirm(confirmText)) return;
    setClearing(true); setError("");
    try { await clearAll(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "삭제에 실패했어요."); }
    finally { setClearing(false); }
  }

  return <>
    <PageHeading eyebrow="PREFERENCES" title="설정" description="EPS의 데이터 저장 방식과 체험 환경을 확인할 수 있어요."/>
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-5">
        <div className="panel p-6 sm:p-7">
          <div className="mb-6 flex items-start gap-3"><div className="flex size-11 items-center justify-center rounded-[13px] bg-[#E6F4ED] text-[#21826B]"><Database size={22}/></div><div><h2 className="text-[17px] font-bold">내 데이터 관리</h2><p className="mt-1 text-[12px] text-[#97A7AA]">{cloud ? "로그인한 계정의 보유 종목을 관리해요." : "브라우저에 저장된 보유 종목을 관리해요."}</p></div></div>
          <div className="rounded-[14px] border border-[#EDF1EF] bg-[#FBFCFC] px-5 py-4">
            <div className="flex justify-between text-[13px]"><span className="text-[#758D89]">등록된 종목</span><strong>{ready ? holdings.length : "확인 중"}</strong></div>
            <div className="mt-3 flex justify-between text-[13px]"><span className="text-[#758D89]">샘플 데이터</span><strong>{sampleCount}개</strong></div>
            <div className="mt-3 flex justify-between text-[13px]"><span className="text-[#758D89]">저장 위치</span><strong>{cloud ? "Supabase 클라우드" : "현재 브라우저"}</strong></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="secondary-btn" disabled={!ready} onClick={useSample}><RotateCcw size={16}/> 샘플 불러오기</button>
            <button type="button" className="secondary-btn" disabled={sampleCount===0} onClick={clearSamples}><Trash2 size={16}/> 샘플만 삭제</button>
            <button type="button" disabled={!ready || clearing || holdings.length===0} className="secondary-btn !border-[#F4D9D4] !text-[#C56B61]" onClick={() => void eraseAll()}><Trash2 size={16}/> {clearing ? "삭제 중..." : "전체 데이터 삭제"}</button>
          </div>
          {(error || syncError) && <p role="alert" className="mt-4 rounded-xl bg-[#FFF3EE] px-3 py-3 text-[12px] text-[#B04A3A]">{error || syncError}</p>}
          {cloud && <p className="mt-4 text-[12px] leading-6 text-[#668A7C]">체험용 샘플은 화면에만 표시되며 Supabase에는 저장되지 않아요. 브라우저에 남은 과거 종목은 ‘내 계정’에서 선택하여 가져올 수 있어요.</p>}
        </div>
        <div className="panel p-6 sm:p-7"><h2 className="mb-4 text-[16px] font-bold">서비스 정보</h2><div className="space-y-4 text-[13px]">{[["서비스명", "EPS — Easy Peasy Stock"],["현재 버전", "0.7.1 · Supabase 보유 종목 연동"],["개발 기반", "Next.js 16 · React · TypeScript"],["연결된 서버", "Next.js API Routes + Supabase"],["외부 금융 API", "Finnhub(미국) / 금융위원회(국내) · 키 설정 필요"]].map(([label,value])=><div key={label} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F3F3] pb-4 last:border-0 last:pb-0"><span className="text-[#92A3A7]">{label}</span><span className="font-semibold text-[#3C5650]">{value}</span></div>)}</div></div>
      </div>
      <div className="space-y-5">
        <div className="rounded-[21px] border border-[#DAEDE3] bg-[#EFF8F3] p-6 sm:p-7"><ShieldCheck size={24} className="text-[#27906E]"/><h2 className="mt-4 text-[17px] font-bold text-[#295D4A]">내 보유 정보를 안전하게</h2><p className="mt-3 text-[12px] leading-[1.95] text-[#678E7D]">로그인 시 보유 종목은 Supabase에 저장되고 사용자별 RLS 정책으로 접근을 제한해요. 로그아웃 후 브라우저의 기존 로컬 기록은 남아 있을 수 있으니 공용 컴퓨터에서는 브라우저 데이터도 관리해 주세요.</p><p className="mt-3 text-[12px] leading-[1.9] text-[#678E7D]">MTS 원본 이미지는 보유 종목 DB에 저장하지 않아요. 개인정보를 가린 테스트용 이미지를 사용해 주세요.</p></div>
        <div className="panel p-6"><h3 className="flex items-center gap-2 text-[14px] font-bold"><LockKeyhole size={18} className="text-[#288C74]"/> 보안 주의</h3><p className="mt-3 text-[12px] leading-[1.95] text-[#94A6A5]">Supabase Publishable Key만 공개 설정에 사용하고, Secret/service_role 키는 클라이언트에 포함하지 마세요. 사용자별 RLS 정책과 접근 차단 테스트도 필요해요.</p></div>
        <div className="flex items-start gap-2 px-2 text-[12px] leading-[1.8] text-[#97A6AA]"><Info size={16} className="mt-0.5 shrink-0"/> EPS는 교육용 웹사이트입니다. API 시세는 제공사 조건과 시장 시간에 따라 지연될 수 있습니다.</div>
      </div>
    </div>
  </>;
}
