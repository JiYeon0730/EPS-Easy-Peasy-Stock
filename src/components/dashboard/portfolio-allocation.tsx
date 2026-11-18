"use client";

import {DualMoney} from "@/components/currency/dual-money";
import {useMemo, useState} from "react";
import {PieChart} from "lucide-react";
import {portfolioAllocation, type AllocationScope} from "@/lib/portfolio-analytics";
import {type Holding} from "@/lib/stocks";

const COLORS = ["#167D65", "#31A98C", "#70C5A8", "#9BDDC3", "#6C9AAB", "#8090C5", "#D0B58B", "#A6BAC1"];

export function PortfolioAllocation({holdings,usdKrw}: {holdings:Holding[];usdKrw:number|null}) {
  const [scope,setScope] = useState<AllocationScope>("ALL");
  const allocation = useMemo(()=>portfolioAllocation(holdings,scope,usdKrw),[holdings,scope,usdKrw]);
  const {items,sum,basis,requiresFx} = allocation;
  const summarized = items.length>7
    ? [...items.slice(0,7),{id:"other",name:`기타 ${items.length-7}개`,market:"KR" as const,amount:items.slice(7).reduce((a,i)=>a+i.amount,0),weight:items.slice(7).reduce((a,i)=>a+i.weight,0)}]
    : items;
  const stops = summarized.map((item,i)=>{
    const start=summarized.slice(0,i).reduce((sum,previous)=>sum+previous.weight,0);
    const end=start+item.weight;
    return `${COLORS[i%COLORS.length]} ${start.toFixed(4)}% ${end.toFixed(4)}%`;
  });
  const displayMoney = (n:number)=><DualMoney amount={n} market={scope==="US"?"US":"KR"}/>;
  return <section className="panel p-6 sm:p-7" aria-labelledby="eps-allocation-title">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="eps-allocation-title" className="text-[17px] font-bold tracking-[-.035em]">내 주식 비중</h2><p className="mt-1 text-[12px] text-[#98A6AD]">{basis==="valuation"?"평가금액":"매수 원금"} 기준 · 전체 보기는 원화 환산</p></div>
      <div className="flex rounded-xl bg-[#F2F6F4] p-1" role="group" aria-label="비중 차트 시장 선택">
        {([{id:"ALL",label:"전체"},{id:"KR",label:"한국"},{id:"US",label:"미국"}] as const).map(({id,label})=><button type="button" key={id} aria-pressed={scope===id} onClick={()=>setScope(id)} className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${scope===id?"bg-white text-[#157D65] shadow-sm":"text-[#8A9C9C] hover:text-[#415A55]"}`}>{label}</button>)}
      </div>
    </div>
    {requiresFx?<div className="flex min-h-[235px] flex-col items-center justify-center gap-3 text-center"><PieChart className="text-[#A4BFB5]" size={32}/><p className="text-[13px] font-bold text-[#415F55]">원화 환율 확인이 필요해요</p><p className="max-w-[290px] text-[12px] leading-relaxed text-[#91A3A0]">전체 주식 비중은 환율이 조회되어야 계산할 수 있어요. 한국·미국 탭은 개별로 볼 수 있어요.</p></div>
    :items.length===0?<div className="flex min-h-[235px] flex-col items-center justify-center gap-3 text-center"><PieChart className="text-[#A4BFB5]" size={32}/><p className="text-[12px] leading-relaxed text-[#91A3A0]">종목을 등록하면 투자 비중이 여기에 표시돼요.</p></div>
    :<div className="flex flex-col items-center justify-around gap-7 lg:flex-row">
      <div className="relative flex size-[205px] shrink-0 items-center justify-center rounded-full" role="img" aria-label={`${scope==="ALL"?"전체":scope==="KR"?"한국":"미국"} 종목 비중: ${summarized.map(i=>`${i.name} ${i.weight.toFixed(1)}퍼센트`).join(", ")}`} style={{background:`conic-gradient(${stops.join(",")})`}}>
        <div className="flex size-[146px] flex-col items-center justify-center rounded-full bg-white px-2 text-center"><span className="text-[11px] font-semibold text-[#96A7A4]">{basis==="valuation"?"현재 평가금액":"총 매수 원금"}</span><strong className="mt-1 text-[18px] font-extrabold tracking-[-.055em] text-[#274841]">{sum!==null?displayMoney(sum):"—"}</strong><span className="mt-1 text-[10px] text-[#91A7A0]">{items.length}개 종목</span></div>
      </div>
      <div className="w-full max-w-[320px] space-y-3.5">{summarized.map((i,index)=><div key={i.id} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><span className="size-2.5 shrink-0 rounded-full" style={{background:COLORS[index%COLORS.length]}}/><div className="min-w-0"><span className="block truncate text-[12px] font-semibold text-[#526966]">{i.name}</span><span className="text-[10px] text-[#9EAFA9]">{displayMoney(i.amount)}</span></div></div><span className="text-[12px] font-bold text-[#294E45]">{i.weight.toFixed(1)}%</span></div>)}</div>
    </div>}
    <p className="mt-6 border-t border-[#EFF3F1] pt-3 text-[11px] leading-[1.65] text-[#9BAAA6]">{basis==="cost"?"일부 종목 가격이 없어 전체 비중을 매수 원금으로 계산했어요.":"조회가 또는 참고가를 이용한 평가 비중이에요."}{scope==="ALL"?" 미국 종목은 USD/KRW 기준 환율로 환산했어요.":""}</p>
  </section>;
}
