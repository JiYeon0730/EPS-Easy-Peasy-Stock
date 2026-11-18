"use client";

import {useMemo} from "react";
import {BarChart3} from "lucide-react";
import {portfolioPerformance} from "@/lib/portfolio-analytics";
import {formatMoney,formatPercent,type Holding} from "@/lib/stocks";

export function PortfolioPerformance({holdings}:{holdings:Holding[]}) {
  const rows = useMemo(()=>portfolioPerformance(holdings),[holdings]);
  const maxAbs = Math.max(10,...rows.map(r=>Math.abs(r.returnPercent??0)));
  return <section className="panel p-6 sm:p-7" aria-labelledby="eps-performance-title">
    <div className="mb-5"><h2 id="eps-performance-title" className="text-[17px] font-bold tracking-[-.035em]">종목별 수익률 비교</h2><p className="mt-1 text-[12px] text-[#98A6AD]">매수가 대비 수익률 · 양수는 빨강, 음수는 파랑</p></div>
    {!rows.length?<div className="flex min-h-[230px] flex-col items-center justify-center gap-3 text-[#95AAA5]"><BarChart3 size={30}/><span className="text-[12px]">등록된 종목이 없어요.</span></div>
    :<div className="max-h-[350px] space-y-4 overflow-y-auto pr-1">{rows.map(row=><div key={row.id} className="grid grid-cols-[minmax(80px,110px)_minmax(0,1fr)_72px] items-center gap-3">
      <div className="min-w-0"><p className="truncate text-[12px] font-bold text-[#435C58]" title={row.name}>{row.name}</p><p className="mt-0.5 text-[10px] text-[#9BABAA]">{row.ticker}</p></div>
      <div className="relative h-[17px] overflow-hidden rounded bg-[#F2F6F6]" title={row.returnPercent===null?"가격 미조회":`${row.name} 수익률 ${formatPercent(row.returnPercent)}`}>
        <span className="absolute inset-y-0 left-1/2 w-px bg-[#BCCFC8]"/>
        {row.returnPercent!==null&&<span className={`absolute top-[3px] h-[11px] rounded-[3px] ${row.returnPercent>=0?"bg-[#E17B70]":"bg-[#6C9FCF]"}`} style={row.returnPercent>=0?{left:"50%",width:`${Math.abs(row.returnPercent)/maxAbs*48}%`}:{right:"50%",width:`${Math.abs(row.returnPercent)/maxAbs*48}%`}}/>}
      </div>
      <div className="text-right">{row.returnPercent===null?<span className="text-[11px] text-[#A6B2B1]">미조회</span>:<><p className={`text-[11px] font-extrabold ${row.returnPercent>=0?"text-[#CD665C]":"text-[#5685BC]"}`}>{formatPercent(row.returnPercent)}</p><p className="mt-0.5 text-[10px] text-[#94A4A0]">{row.profit!==null?formatMoney(row.profit,row.market):"—"}</p></>}</div>
    </div>)}</div>}
    <p className="mt-5 border-t border-[#EFF3F1] pt-3 text-[11px] leading-[1.7] text-[#9BAAA6]">막대 길이는 표시된 종목 중 최대 수익률 절댓값을 기준으로 조정돼요. API 미조회 종목은 저장된 참고가를 사용합니다.</p>
  </section>;
}
