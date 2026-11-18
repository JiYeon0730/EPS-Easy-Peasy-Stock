"use client";

import { useMemo } from "react";
import { Activity, ArrowRight, AudioLines, BrainCircuit, CircleAlert, GitBranch, Layers3, MessageCircleMore, ScanSearch, Sparkles, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { EmptyState, IconTile, PageHeading, SectionHeading } from "@/components/common/ui";
import { useHoldings } from "@/context/holdings-context";
import { invested } from "@/lib/stocks";

const FEATURES = [
  {icon:Target, title:"포트폴리오 리스크", description:"시장별 비중과 가격 변동을 바탕으로 주요 위험 요소를 정리해요.",color:"mint" as const},
  {icon:TrendingUp, title:"급등락 원인 분석", description:"큰 폭의 가격 변동이 있을 때 관련 소식과 공시를 연결해요.",color:"blue" as const},
  {icon:GitBranch, title:"연쇄 파급효과", description:"협력사와 경쟁사까지 이어지는 산업의 흐름을 살펴봐요.",color:"peach" as const},
  {icon:AudioLines, title:"1분 오디오 브리핑", description:"내 종목의 주요 뉴스를 짧게 들을 수 있게 준비 중이에요.",color:"purple" as const},
  {icon:MessageCircleMore, title:"AI 투자 정보 챗봇", description:"내 보유 종목과 확인된 자료에 근거해 질문에 답해요.",color:"mint" as const},
  {icon:ScanSearch, title:"공시 팩트체크", description:"DART와 SEC 공시를 참고해 뉴스 내용을 확인해요.",color:"blue" as const},
];

export default function InsightsPage() {
  const {holdings} = useHoldings();
  const checks = useMemo(() => ["KR", "US"].flatMap((m) => {
    const items = holdings.filter((h) => h.market === m); const total = items.reduce((s,h)=>s+invested(h),0);
    if (!items.length || total <= 0) return [];
    const largest = [...items].sort((a,b)=>invested(b)-invested(a))[0];
    return [{market:m, count:items.length, largest, share:invested(largest)/total*100, missing:items.filter((h)=>h.currentPrice === null).length}];
  }), [holdings]);
  return <>
    <PageHeading eyebrow="AI INSIGHTS" title="더 쉬운 투자 인사이트" description="복잡한 시장의 변화를 나에게 필요한 정보부터 이해하도록 돕는 공간이에요."/>
    <div className="mb-6 overflow-hidden rounded-[22px] bg-[#183E3A] px-6 py-7 text-white sm:px-8"><div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div><span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#B5EBD4]"><Sparkles size={14}/> NEXT STEP</span><h2 className="text-[22px] font-extrabold tracking-[-.045em]">나만의 AI 투자 도우미를 준비 중이에요.</h2><p className="mt-2 max-w-xl text-[12px] leading-[1.9] text-[#B5D1CA]">실제 AI 분석이 연결되기 전에는 위험 점수나 투자 전망을 임의로 만들지 않습니다. 아래에서는 입력 데이터로 계산 가능한 기본 점검만 제공합니다.</p></div><div className="flex size-17 shrink-0 items-center justify-center rounded-[22px] bg-white/10"><BrainCircuit size={33} className="text-[#B9F4DB]"/></div></div></div>
    <div className="mb-8 grid gap-5 xl:grid-cols-[1fr_1fr]"><div className="panel p-6 sm:p-7"><SectionHeading title="내 포트폴리오 기본 점검" caption="AI 판단이 아닌 단순한 수치 계산이에요"/>{checks.length ? <div className="space-y-3">{checks.map((c)=><div key={c.market} className="rounded-[14px] border border-[#E7EEEB] bg-[#FBFDFC] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[12px] font-bold text-[#376054]">{c.market === "KR" ? "🇰🇷 국내 주식" : "🇺🇸 미국 주식"} · {c.count}개 종목</span><span className="text-[11px] font-semibold text-[#A4B3B5]">매수 원금 기준</span></div><div className="flex items-center justify-between gap-3"><p className="text-[12px] text-[#7F9295]">가장 비중이 큰 종목: <strong className="text-[#2D5049]">{c.largest.name}</strong></p><strong className="text-[15px] text-[#18816A]">{c.share.toFixed(1)}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDF3F0]"><div className="h-full rounded-full bg-[#3CA98C]" style={{width:`${Math.min(100,c.share)}%`}}/></div><p className="mt-3 text-[11px] text-[#91A4A4]">{c.missing ? `참고 현재가 미입력 종목: ${c.missing}개` : "모든 종목에 참고 현재가가 입력되어 있어요."}</p></div>)}</div> : <EmptyState icon={Layers3} title="분석할 종목이 아직 없어요" description="내 주식을 등록하면 시장별 매수 원금 비중을 계산해 드려요." action={<Link href="/portfolio?add=1" className="soft-btn">종목 등록하기 <ArrowRight size={15}/></Link>}/>}</div>
      <div className="panel p-6 sm:p-7"><SectionHeading title="AI 위험 신호" caption="실시간 금융 데이터 연결 후 활성화됩니다"/><EmptyState icon={CircleAlert} title="위험 점수는 아직 제공하지 않아요" description="실제 시세·검증된 뉴스·공시 데이터를 연결한 후 근거 있는 위험 요인을 보여줄 예정이에요."/></div></div>
    <SectionHeading title="EPS가 준비 중인 AI 기능" caption="어려운 용어보다 쉬운 설명을 우선합니다"/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{FEATURES.map(({icon,title,description,color})=><div key={title} className="panel p-6"><div className="flex items-start justify-between"><IconTile icon={icon} variant={color}/><span className="rounded-full bg-[#F6F6F2] px-2.5 py-1 text-[10px] font-bold text-[#A1A69F]">준비 중</span></div><h3 className="mt-5 text-[15px] font-bold text-[#334E49]">{title}</h3><p className="mt-2 text-[12px] leading-[1.8] text-[#97A7A8]">{description}</p></div>)}</div>
    <p className="mt-6 flex items-center gap-2 text-[11px] text-[#9EACAE]"><Activity size={15}/> EPS는 특정 종목의 매수·매도를 추천하지 않으며 투자 결정을 대신하지 않습니다.</p>
  </>;
}
