"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Bell, ExternalLink, Globe2, Newspaper, Search, Sparkles } from "lucide-react";
import { useHoldings } from "@/context/holdings-context";
import { EmptyState, PageHeading, SectionHeading } from "@/components/common/ui";

export default function NewsPage() {
  const { holdings } = useHoldings();
  const [query, setQuery] = useState("");
  const unique = useMemo(() => [...new Map(holdings.map((h) => [`${h.market}-${h.ticker}`, h])).values()], [holdings]);
  const filtered = unique.filter((h) => `${h.name} ${h.ticker}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeading eyebrow="PERSONALIZED NEWS" title="내 종목 뉴스" description="내가 보유한 종목을 중심으로, 알아두면 좋을 소식을 모아볼 공간이에요."/>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <div className="space-y-5"><div className="panel overflow-hidden"><div className="p-6 sm:p-7"><SectionHeading title="관심 종목 뉴스 찾기" caption="내 보유 종목으로 뉴스 검색 페이지를 열 수 있어요"/><div className="relative mb-5"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABB7BC]"/><input className="input" style={{paddingLeft:40}} placeholder="종목명을 검색해 보세요" aria-label="뉴스 종목 검색" value={query} onChange={(e)=>setQuery(e.target.value)}/></div><div className="space-y-3">{filtered.length ? filtered.map((h)=><a key={`${h.market}-${h.ticker}`} target="_blank" rel="noopener noreferrer" href={`https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(h.name + " 주식")}`} className="flex items-center gap-3 rounded-[14px] border border-[#EDF1F1] px-4 py-3.5 transition hover:bg-[#F8FBF9]"><div className="flex size-10 items-center justify-center rounded-[12px] bg-[#EEF7F2] text-[13px] font-extrabold text-[#27886E]">{h.name.charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-bold text-[#34504B]">{h.name}</p><p className="mt-1 text-[11px] text-[#9CAAAF]">{h.ticker} · {h.market === "KR" ? "국내" : "미국"} · 네이버 뉴스 검색</p></div><ExternalLink size={16} className="text-[#86A198]"/></a>) : <EmptyState icon={Newspaper} title="검색할 종목이 없어요" description="보유 종목을 먼저 등록하거나 검색어를 바꿔 보세요."/>}</div></div></div>
      <div className="panel p-6 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="text-[17px] font-bold">AI 뉴스 브리핑</h2><p className="mt-1 text-[12px] text-[#9BAAAE]">뉴스 API 연결 예정</p></div><span className="rounded-full bg-[#FFF4E2] px-3 py-1 text-[10px] font-bold text-[#B18638]">COMING SOON</span></div><EmptyState icon={Sparkles} title="기사 분석을 준비하고 있어요" description="기사의 핵심을 3줄로 요약하고 공시와 확인하는 기능을 다음 버전에서 연결합니다."/></div></div>
      <aside className="space-y-5"><div className="panel p-6"><div className="mb-4 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-[12px] bg-[#E9F4EC] text-[#27886E]"><Bell size={20}/></div><h3 className="text-[15px] font-bold">앞으로 이런 정보가 보여요</h3></div><div className="space-y-4">{[{title:"내 종목 맞춤 뉴스",desc:"보유 종목 관련 기사 자동 수집"},{title:"AI 3줄 요약",desc:"복잡한 뉴스 핵심만 쉽게"},{title:"공시 사실 확인",desc:"DART·SEC 공식 자료 연결"},{title:"기사 신뢰도 구분",desc:"확인된 사실과 추측 구별"}].map((x,i)=><div key={x.title} className="flex items-start gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ECF7F0] text-[10px] font-bold text-[#28876D]">{i+1}</span><div><p className="text-[12px] font-bold text-[#42615B]">{x.title}</p><p className="mt-1 text-[11px] leading-[1.6] text-[#98A7AD]">{x.desc}</p></div></div>)}</div></div>
      <div className="rounded-[20px] border border-[#DCECE6] bg-[#F1F8F4] p-6"><Globe2 size={22} className="mb-3 text-[#31846C]"/><p className="text-[14px] font-bold text-[#2E5E50]">뉴스를 더 쉽게 읽는 방법</p><p className="mt-2 text-[12px] leading-[1.9] text-[#7E9C8F]">제목만으로 투자 판단을 내리기보다는 원문, 작성 시각, 공시 여부를 함께 확인해 보세요.</p><span className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#4B8D73]">EPS가 지향하는 투자 습관 <ArrowUpRight size={14}/></span></div></aside>
    </div>
  </>;
}
