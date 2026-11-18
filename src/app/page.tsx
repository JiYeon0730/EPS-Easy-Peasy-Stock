"use client";

import Link from "next/link";
import {useMemo} from "react";
import {
  ArrowRight, ArrowUpRight, ChartNoAxesCombined, CheckCircle2, ChevronRight,
  CircleDollarSign, Globe2, Plus, ScanLine, ShieldCheck, Sparkles, TrendingUp,
  WalletCards, RefreshCw,
} from "lucide-react";
import {DualMoney, CurrencySwitcher} from "@/components/currency/dual-money";
import {useHoldings} from "@/context/holdings-context";
import {useQuotes} from "@/context/quotes-context";
import {useFx} from "@/context/fx-context";
import {applyQuotes, getQuote} from "@/lib/market-quotes";
import {portfolioTotals} from "@/lib/portfolio-analytics";
import {QuoteStatus} from "@/components/portfolio/quote-status";
import {HoldingsTable} from "@/components/portfolio/holdings-table";
import {PortfolioAllocation} from "@/components/dashboard/portfolio-allocation";
import {PortfolioPerformance} from "@/components/dashboard/portfolio-performance";
import {IconTile, SectionHeading} from "@/components/common/ui";
import {formatMoney, formatPercent, type Holding} from "@/lib/stocks";

function FxStatus({hasHoldings}:{hasHoldings:boolean}) {
  const {rate,loading,error,refresh} = useFx();
  return <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#DFEBE6] bg-[#F4FAF6] px-4 py-3.5 sm:px-5" aria-live="polite">
    <div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E2F3EA] text-[#268D72]"><Globe2 size={18}/></span>
      <div><p className="text-[12px] font-bold text-[#3A6557]">USD/KRW 기준 환율 {hasHoldings?(rate?`· 1달러 ≈ ${formatMoney(rate.rate,"KR")}`:loading?"· 조회 중":"· 조회 필요"):"· 보유 종목 없음"}</p>
        <p className="mt-1 text-[11px] leading-[1.6] text-[#73948A]">{hasHoldings?(rate?`Frankfurter 제공 기준 환율 · ${rate.date} 기준 · 실시간 환율 아님` :error??"환율 데이터를 확인하는 중입니다."):"종목을 등록하면 모든 금액을 원화·달러로 함께 표시해요."}</p>
      </div>
    </div>
    {hasHoldings&&<button type="button" onClick={refresh} disabled={loading} className="secondary-btn text-[11px]"><RefreshCw size={14} className={loading?"animate-spin":""}/> 환율 다시 조회</button>}
  </div>;
}

function SummaryCards({holdings,ready,pricedViaApi,referenceCount,fxRate}:{holdings:Holding[];ready:boolean;pricedViaApi:number;referenceCount:number;fxRate:number|null}) {
  const totals = useMemo(()=>portfolioTotals(holdings,fxRate),[holdings,fxRate]);
  const totalCost = totals.costKrw;
  const totalValue = totals.valueKrw;
  const gain = totals.gainKrw;
  const gainRate = totals.returnPercent===null?"—":formatPercent(totals.returnPercent);
  const foot = totals.requiresFx?"환율 조회 후 원화 합산 가능":totals.missingPrices?`${totals.missingPrices}개 종목 가격 미조회`:"현재 기준 환율 환산 · 환차손익 미반영";
  const cards = [
    {title:"총 매수 원금",value:totalCost,sub:totals.requiresFx?"환율 필요":"한·미 보유 종목 원화 환산",icon:WalletCards,color:"mint" as const},
    {title:"총 평가금액",value:totalValue,sub:foot,icon:Globe2,color:"blue" as const},
    {title:"평가손익",value:gain,sub:foot,icon:ChartNoAxesCombined,color:"purple" as const},
    {title:"전체 수익률",value:gainRate,sub:`API 조회 ${pricedViaApi}개 · 참고가 ${referenceCount}개`,icon:CheckCircle2,color:"peach" as const},
  ];
  return <section className="mb-8 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4" aria-label="통합 포트폴리오 요약">{cards.map((card,index)=><div key={card.title} className="panel min-h-[150px] p-5"><div className="flex items-start justify-between gap-3"><p className="pt-1 text-[12px] font-semibold text-[#8999A0]">{card.title}</p><IconTile icon={card.icon} variant={card.color}/></div><p className={`mt-3 text-[21px] font-extrabold tracking-[-.055em] sm:text-[24px] ${index>1&&totals.gainKrw!==null?(totals.gainKrw>=0?"text-[#CF655B]":"text-[#4588C5]"):"text-[#213738]"}`}>{ready?(typeof card.value==="number"&&index<3?<DualMoney amount={card.value} market="KR" signed={index===2}/>:card.value??"—"):"—"}</p><p className="mt-1 text-[11px] leading-[1.6] text-[#9BABAE]">{ready?card.sub:"종목 데이터를 불러오는 중"}</p></div>)}</section>;
}

export default function HomePage() {
  const {holdings,ready,useSample,mode} = useHoldings();
  const {quotes} = useQuotes();
  const {rate} = useFx();
  const effectiveHoldings = useMemo(()=>applyQuotes(holdings,quotes),[holdings,quotes]);
  const apiCount = holdings.filter(h=>Boolean(getQuote(quotes,h))).length;
  const referenceCount = effectiveHoldings.filter((h,i)=>h.currentPrice!==null&&!getQuote(quotes,holdings[i])).length;
  const fxRate=rate?.rate??null;
  const totalCount=holdings.length;

  return <>
    <div className="mb-7 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-[12px] font-bold tracking-[.12em] text-[#168A70]">MY DASHBOARD</p><h1 className="text-[28px] font-extrabold tracking-[-.06em] text-[#203739] sm:text-[34px]">내 투자, 한눈에 보기 <span aria-hidden="true">👋</span></h1><p className="mt-2 text-[13px] text-[#8C9CA4]">숫자는 쉽게, 관리는 편하게. EPS와 함께 시작해요.</p></div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#DDEAE4] bg-white px-3 py-2 text-[11px] font-bold text-[#709184]"><ShieldCheck size={14}/> {mode === "cloud" ? "Supabase 계정 저장" : "로컬 저장 모드"}</span>
    </div>
    <section className="metric-glow relative mb-7 overflow-hidden rounded-[25px] px-7 py-8 text-white sm:px-9 sm:py-9 lg:px-10">
      <div className="pointer-events-none absolute -right-8 -top-28 size-[290px] rounded-full border-[38px] border-white/[.035]"/><div className="pointer-events-none absolute right-28 -bottom-56 size-[360px] rounded-full border-[46px] border-white/[.04]"/>
      <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[540px]"><span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/[.12] px-3 py-1.5 text-[11px] font-semibold text-[#C4F4DE]"><Sparkles size={13}/> EASY PEASY STOCK</span><h2 className="text-[25px] font-extrabold leading-[1.4] tracking-[-.05em] sm:text-[31px]">주식 투자, 어렵게<br/>생각하지 않아도 괜찮아요.</h2><p className="mt-3 max-w-[420px] text-[13px] leading-[1.9] text-[#BFD6D0]">내가 보유한 종목부터 차근차근. 복잡한 투자 정보를 누구나 이해하기 쉬운 언어로 정리해 드릴게요.</p><div className="mt-6 flex flex-wrap items-center gap-2.5"><Link href="/portfolio?add=1" className="inline-flex items-center gap-2 rounded-[11px] bg-[#B5F5DA] px-5 py-3 text-[12px] font-extrabold text-[#124E3E] hover:bg-white"><Plus size={17}/> 내 종목 등록하기 <ArrowUpRight size={15}/></Link>{totalCount===0&&<button type="button" onClick={useSample} className="rounded-[11px] border border-white/20 bg-white/10 px-5 py-3 text-[12px] font-bold text-white hover:bg-white/20">샘플로 둘러보기</button>}</div></div>
        <div className="hidden w-[270px] shrink-0 rounded-[20px] border border-white/20 bg-white/[.11] p-5 shadow-2xl backdrop-blur-lg lg:block"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[12px] font-semibold text-[#D1F1E6]"><span className="flex size-7 items-center justify-center rounded-lg bg-white/15"><TrendingUp size={16}/></span> 나의 투자 노트</div><span className="rounded-full bg-white/10 px-2 py-1 text-[10px]">EPS v0.5</span></div><div className="my-5 border-t border-white/15"/><p className="text-[11px] text-[#B3D5CB]">등록된 보유 종목</p><p className="mt-1 text-[33px] font-extrabold tracking-[-.07em]">{ready?String(totalCount).padStart(2,"0"):"--"}<span className="ml-1 text-[13px] font-medium text-[#BCD6CE]">종목</span></p><div className="mt-5 flex items-end gap-1.5">{[32,58,43,68,49,85,72,100,81,92].map((h,i)=><span key={i} className="flex-1 rounded-t-[4px] bg-[#8BD4B8]/[.55]" style={{height:`${h*.58}px`}} aria-hidden="true"/>)}</div><p className="mt-3 text-[10px] text-[#B5D5CA]">장식용 그래픽 · 시세 차트가 아닙니다</p></div>
      </div>
    </section>
    <QuoteStatus/>
    <FxStatus hasHoldings={holdings.length>0}/><div className="mb-4 flex justify-end"><CurrencySwitcher/></div>
    <SummaryCards holdings={effectiveHoldings} ready={ready} pricedViaApi={apiCount} referenceCount={referenceCount} fxRate={fxRate}/>
    <p className="mb-7 rounded-[13px] border border-[#E7EDED] bg-white px-4 py-3 text-[11px] leading-[1.8] text-[#829795]"><CircleDollarSign size={14} className="mr-1 inline align-[-3px]"/> 통합 평가금액·수익률은 보유 종목의 저장 가격 또는 제공사 조회가와 <strong>동일한 기준 USD/KRW 환율</strong>로 계산합니다. 실제 매수 시점 환율, 환차손익, 수수료, 세금은 포함되지 않습니다. 참고가가 포함되면 추정치이며 실시간 가격을 보장하지 않습니다.</p>
    <div className="mb-8 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><PortfolioAllocation holdings={effectiveHoldings} usdKrw={fxRate}/><PortfolioPerformance holdings={effectiveHoldings}/></div>
    <section className="mb-8"><SectionHeading title="내 보유 종목" caption="API 시세와 기준일을 함께 확인해요" more={{text:"전체 종목 보기",href:"/portfolio"}}/><div className="panel overflow-hidden"><HoldingsTable compact holdings={holdings.slice(0,5)}/>{holdings.length>5&&<Link href="/portfolio" className="flex items-center justify-center gap-1 border-t border-[#EDF1F2] py-4 text-[12px] font-bold text-[#177D66]">전체 {holdings.length}개 종목 보기 <ChevronRight size={15}/></Link>}</div></section>
    <section><SectionHeading title="EPS 시작하기" caption="세 단계면 내 투자 공간이 완성돼요"/><div className="grid gap-4 lg:grid-cols-3">{[
      {num:"01",icon:WalletCards,title:"내 주식 등록",desc:"보유 중인 주식과 매수가를 쉽게 기록해요.",href:"/portfolio",btn:"직접 등록하기"},
      {num:"02",icon:ScanLine,title:"캡처로 간편 등록",desc:"증권사 화면 인식 기능을 준비하고 있어요.",href:"/import",btn:"기능 살펴보기"},
      {num:"03",icon:ChartNoAxesCombined,title:"내 투자 한눈에",desc:"환율로 통합한 원화 금액과 비중을 확인해요.",href:"/",btn:"대시보드 보기"},
    ].map((item)=><Link key={item.num} href={item.href} className="panel group p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><IconTile icon={item.icon}/><span className="text-[12px] font-extrabold text-[#D2DED9]">{item.num}</span></div><h3 className="mt-5 text-[15px] font-bold text-[#2F4847]">{item.title}</h3><p className="mt-2 text-[12px] leading-[1.7] text-[#91A2A7]">{item.desc}</p><p className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#168A70] group-hover:underline">{item.btn}<ArrowRight size={14}/></p></Link>)}</div></section>
  </>;
}
