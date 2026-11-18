"use client";

import {useEffect,useId,useMemo,useState,type KeyboardEvent} from "react";
import {Check,ChevronDown,Search,X,Loader2} from "lucide-react";
import {searchCatalog,type StockOption} from "@/lib/stock-catalog";
import type {Market} from "@/lib/stocks";

interface StockPickerProps {
  market: Market;
  value: StockOption | null;
  onSelect: (stock: StockOption | null) => void;
  onManual: () => void;
}
interface SearchResult {
  market:Market;
  q:string;
  stocks:StockOption[];
  source:"remote"|"fallback";
  provider:string;
  message:string|null;
  truncated:boolean;
}

export function StockPicker({market,value,onSelect,onManual}:StockPickerProps){
  const [query,setQuery]=useState("");
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState(0);
  const [remote,setRemote]=useState<SearchResult|null>(null);
  const listId=useId();
  const cleaned=query.trim();
  const local=useMemo(()=>searchCatalog(market,cleaned,20),[market,cleaned]);
  const fetching=cleaned.length>=1 && (!remote || remote.market!==market || remote.q!==cleaned);
  const remoteValid=cleaned.length>=1&&!fetching;
  // Local Korean aliases remain searchable even if the provider uses English names.
  const results=remoteValid?
    [...local,...remote!.stocks.filter(s=>!local.some(c=>c.market===s.market&&c.ticker===s.ticker))].slice(0,30):local;

  useEffect(()=>{
    if(cleaned.length<1 || value) return;
    const controller=new AbortController();
    const timer=window.setTimeout(async()=>{
      try{
        const url=`/api/stocks/search?market=${encodeURIComponent(market)}&q=${encodeURIComponent(cleaned)}`;
        const response=await fetch(url,{cache:"no-store",signal:controller.signal});
        if(!response.ok) throw new Error("조회 실패");
        const payload:unknown=await response.json();
        if(typeof payload!=="object" || payload===null || !("stocks" in payload) || !Array.isArray(payload.stocks)) throw new Error("응답 오류");
        const data=payload as {stocks:StockOption[];source:"remote"|"fallback";provider:string;message:string|null;truncated:boolean};
        if(!controller.signal.aborted)setRemote({...data,market,q:cleaned});
      }catch{
        if(!controller.signal.aborted)setRemote({market,q:cleaned,stocks:searchCatalog(market,cleaned,20),source:"fallback",provider:"local",truncated:false,message:"종목 목록 서버에 연결하지 못했어요. 추천 목록으로 검색하고 있어요."});
      }
    },400);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[cleaned,market,value]);

  function select(stock:StockOption){
    onSelect(stock);setOpen(false);setQuery("");setActive(0);
  }
  function keyboard(event:KeyboardEvent<HTMLInputElement>){
    if(event.key==="ArrowDown"){
      event.preventDefault();setOpen(true);setActive(x=>Math.min(x+1,Math.max(results.length-1,0)));
    } else if(event.key==="ArrowUp"){
      event.preventDefault();setOpen(true);setActive(x=>Math.max(0,x-1));
    } else if(event.key==="Enter"&&open&&results.length>0){
      event.preventDefault();select(results[Math.min(active,results.length-1)]);
    } else if(event.key==="Escape"&&open){event.preventDefault();event.stopPropagation();setOpen(false);}
  }
  const note = !cleaned
    ? "추천 종목 · 이름이나 코드를 입력하면 더 많은 종목을 검색해요"
    : fetching ? "상장 종목을 찾고 있어요"
    : remote?.source === "remote"
      ? remote.provider === "KRX" ? "한국거래소 상장종목정보 검색 결과"
        : remote.provider === "FSC" ? "금융위원회 최근 거래 주식 검색 결과"
        : "Finnhub 미국 종목 검색 결과"
      : "현재 추천 종목 검색 결과 · 전체 목록이 아니에요";
  return <div className="space-y-2.5">
    <label className="form-label" htmlFor={`${listId}-input`}>어떤 주식을 가지고 있나요? *</label>
    {value?<div className="flex items-center gap-3 rounded-[14px] border border-[#A5DCC5] bg-[#EFF9F3] px-4 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[#D8F2E5] text-[#138569]"><Check size={19}/></span>
      <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-extrabold text-[#244C40]">{value.name}</p><p className="mt-1 text-[11px] font-medium text-[#5E9985]">{market==="KR"?"국내":"미국"} · {value.ticker} · 코드 자동 입력</p></div>
      <button type="button" onClick={()=>{onSelect(null);setQuery("");setOpen(true);setActive(0);}} className="rounded-lg border border-[#CAE9DA] bg-white px-3 py-2 text-[11px] font-bold text-[#257C63] hover:bg-[#E6F4ED]">변경</button>
    </div>:<div className="relative" onBlur={(event)=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
      <Search size={18} className="pointer-events-none absolute left-3.5 top-[13px] text-[#8DA9A2]"/>
      <input id={`${listId}-input`} autoFocus className="input !pl-11 !pr-10" type="text" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${listId}-results`} aria-activedescendant={open&&results.length?`${listId}-result-${Math.min(active,results.length-1)}`:undefined} placeholder={market==="KR"?"예: 삼성전자, 카카오, 005930":"예: Apple, Palantir, AAPL"} value={query} onFocus={()=>setOpen(true)} onClick={()=>setOpen(true)} onChange={(e)=>{setQuery(e.target.value);setOpen(true);setActive(0);}} onKeyDown={keyboard} maxLength={60}/>
      {query&&<button type="button" aria-label="검색어 지우기" onClick={()=>{setQuery("");setOpen(true);}} className="absolute right-3 top-2.5 rounded-lg p-1 text-[#93A2A5] hover:bg-[#F1F5F3]"><X size={16}/></button>}
      {open&&<div className="absolute left-0 right-0 top-[calc(100%+7px)] z-20 overflow-hidden rounded-[15px] border border-[#DDEBE4] bg-white shadow-[0_14px_36px_rgba(21,58,49,.15)]">
        <div className="flex items-center justify-between gap-2 border-b border-[#EDF3F0] bg-[#F9FCFA] px-4 py-2.5 text-[11px] font-semibold text-[#83978F]">
          <span>{note}</span><span className="shrink-0">{fetching?<Loader2 size={14} className="animate-spin"/>:`${results.length}건 표시`}</span>
        </div>
        {remoteValid&&remote?.message&&<p role="status" className="border-b border-[#F2EAD8] bg-[#FFFAEF] px-4 py-2 text-[11px] leading-relaxed text-[#A17F3D]">{remote.message}</p>}
        <div id={`${listId}-results`} role="listbox" aria-label="종목 검색 결과" className="max-h-[290px] overflow-y-auto py-1">
          {results.length?results.map((stock,index)=><button type="button" role="option" aria-selected={index===active} id={`${listId}-result-${index}`} key={`${stock.market}:${stock.ticker}`} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(index)} onClick={()=>select(stock)} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${index===active?"bg-[#EFF9F3]":"hover:bg-[#F5F9F7]"}`}>
            <span className="min-w-0"><span className="block truncate text-[13px] font-bold text-[#31534C]">{stock.name}</span><span className="mt-0.5 block text-[11px] text-[#96A8A1]">{stock.ticker}</span></span><Check size={15} className={index===active?"text-[#188B6D]":"text-transparent"}/>
          </button>):<p className="px-4 py-5 text-center text-[12px] leading-[1.8] text-[#92A39B]">{fetching?"전체 종목 검색 중이에요.":"일치하는 종목이 없어요."}<br/>다른 이름·종목 코드로 검색하거나 직접 입력해 주세요.</p>}
        </div>
      </div>}
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-[11px] leading-relaxed text-[#94A7A0]">국내: 금융위원회 상장종목/주식시세정보 · 미국: Finnhub · 종목명/코드 검색 후 선택</p>
      <button type="button" onClick={onManual} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16866C] hover:underline">검색되지 않나요? 직접 입력 <ChevronDown size={13}/></button>
    </div>
  </div>;
}
