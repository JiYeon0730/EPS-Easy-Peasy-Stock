"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Info, X } from "lucide-react";
import { DualMoney } from "@/components/currency/dual-money";
import { StockPicker } from "@/components/portfolio/stock-picker";
import { useHoldings } from "@/context/holdings-context";
import { findCatalogStock, type StockOption } from "@/lib/stock-catalog";
import type { Holding, HoldingInput, Market } from "@/lib/stocks";

export function StockModal({ onClose, editing = null }: { onClose: () => void; editing?: Holding | null }) {
  const { add, update } = useHoldings();
  const [market, setMarket] = useState<Market>(editing?.market ?? "KR");
  const matched = editing ? (findCatalogStock(editing.market, editing.ticker) ?? {market:editing.market, ticker:editing.ticker, name:editing.name}) : undefined;
  const [selected, setSelected] = useState<StockOption | null>(matched ?? null);
  // 기존 데이터가 오프라인 목록에 없는 경우, 편집 시에도 원래 값을 그대로 보여줍니다.
  const [manual, setManual] = useState(Boolean(editing && !matched));
  const [name, setName] = useState(editing?.name ?? "");
  const [ticker, setTicker] = useState(editing?.ticker ?? "");
  const [quantity, setQuantity] = useState(editing?.quantity?.toString() ?? "");
  const [buyPrice, setBuyPrice] = useState(editing?.buyPrice?.toString() ?? "");
  const [currentPrice, setCurrentPrice] = useState(editing?.currentPrice?.toString() ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [marketChanged, setMarketChanged] = useState(false);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", onEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onEscape); document.body.style.overflow = previousOverflow; };
  }, [onClose]);

  function changeMarket(next: Market) {
    if (next === market) return;
    setMarket(next);
    setSelected(null);
    setManual(false);
    setName("");
    setTicker("");
    // 통화가 바뀌므로 KRW 가격을 USD 가격으로 잘못 해석하지 않도록 비웁니다.
    setBuyPrice("");
    setCurrentPrice("");
    setMarketChanged(true);
    setError("");
  }

  function selectStock(stock: StockOption | null) {
    setSelected(stock);
    setManual(false);
    setError("");
  }

  function openManual() {
    setSelected(null);
    setManual(true);
    setName("");
    setTicker("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const stockName = manual ? name.trim() : selected?.name ?? "";
    const stockTicker = (manual ? ticker : selected?.ticker ?? "").trim().toUpperCase();
    const qty = Number(quantity);
    const buy = Number(buyPrice);
    const current = currentPrice.trim() === "" ? null : Number(currentPrice);

    if (!stockName || !stockTicker) {
      setError("목록에서 종목을 선택하거나, 직접 입력을 완료해 주세요.");
      return;
    }
    if (manual && market === "KR" && !/^\d{6}$/.test(stockTicker)) {
      setError("국내 주식 코드는 005930처럼 숫자 6자리로 입력해 주세요.");
      return;
    }
    if (manual && market === "US" && !/^[A-Z][A-Z0-9.\-^]{0,29}$/.test(stockTicker)) {
      setError("미국 주식 코드는 AAPL처럼 영문 티커로 입력해 주세요.");
      return;
    }
    if (!Number.isSafeInteger(qty) || qty <= 0 || !Number.isFinite(buy) || buy <= 0 || (current !== null && (!Number.isFinite(current) || current < 0))) {
      setError("수량은 1 이상의 정수, 매수가는 0보다 큰 숫자로 입력해 주세요.");
      return;
    }
    const data: HoldingInput = { name: stockName, ticker: stockTicker, market, quantity: qty, buyPrice: buy, currentPrice: current };
    setSaving(true);
    try {
      if (editing) await update(editing.id, data);
      else await add(data);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "종목 저장에 실패했어요.");
    } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#10262A]/50 px-4 py-8" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={editing ? "종목 수정" : "새 종목 등록"} className="max-h-full w-full max-w-[540px] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div><p className="mb-1.5 text-[11px] font-bold tracking-[.12em] text-[#188C70]">MY PORTFOLIO</p><h2 className="text-[23px] font-extrabold tracking-[-.05em] text-[#203738]">{editing ? "종목 정보 수정" : "새 종목 등록"}</h2><p className="mt-1.5 text-[12px] text-[#91A0A7]">한국·미국 종목을 이름 또는 코드로 검색하면 코드가 자동 입력돼요.</p></div>
        <button type="button" onClick={onClose} aria-label="닫기" className="rounded-xl p-2 text-[#99A6AA] hover:bg-[#F5F7F7]"><X size={20}/></button>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <span className="form-label">거래 시장</span>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F4F7F7] p-1.5">{(["KR", "US"] as const).map((next) => <button key={next} type="button" onClick={() => changeMarket(next)} aria-pressed={market === next} className={`rounded-[9px] px-3 py-2.5 text-[13px] font-bold transition ${market === next ? "bg-white text-[#168268] shadow-sm" : "text-[#92A0A5]"}`}>{next === "KR" ? "🇰🇷 한국 주식" : "🇺🇸 미국 주식"}</button>)}</div>
          {marketChanged && <p className="mt-2 text-[11px] text-[#A17852]">시장을 변경하여 매수가와 참고 현재가를 초기화했어요. 새 통화로 다시 입력해 주세요.</p>}
        </div>

        {manual ? <div className="rounded-[15px] border border-[#E2EAE4] bg-[#FAFCFB] p-4">
          <div className="mb-4 flex items-center justify-between gap-3"><p className="text-[13px] font-extrabold text-[#395A4D]">종목 직접 입력</p><button type="button" onClick={() => { setManual(false); setSelected(null); setError(""); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#177C63] hover:underline"><ArrowLeft size={13}/> 검색으로 돌아가기</button></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="form-label" htmlFor="stock-name">종목명 *</label><input className="input" id="stock-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={market === "KR" ? "예: 삼성전자" : "예: Apple"} maxLength={100}/></div>
            <div><label className="form-label" htmlFor="stock-code">종목 코드 *</label><input className="input" id="stock-code" value={ticker} onChange={(event) => setTicker(event.target.value)} placeholder={market === "KR" ? "예: 005930" : "예: AAPL"} maxLength={30}/></div>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-[1.7] text-[#91A4A0]"><Info size={14} className="mt-0.5 shrink-0"/> 직접 입력한 종목 코드가 실제 상장 종목인지 자동 검증하지는 않아요.</p>
        </div> : <StockPicker key={market} market={market} value={selected} onSelect={selectStock} onManual={openManual}/>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="form-label" htmlFor="stock-quantity">보유 수량 *</label><input className="input" id="stock-quantity" type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="예: 10"/></div>
          <div><label className="form-label" htmlFor="stock-buy">평균 매수가 ({market === "KR" ? "원" : "달러"}) *</label><input className="input" id="stock-buy" type="number" min="0.01" step="any" inputMode="decimal" value={buyPrice} onChange={(event) => setBuyPrice(event.target.value)} placeholder={market === "KR" ? "예: 68000" : "예: 185.50"}/></div>
        </div>
        {Number(buyPrice) > 0 && <p className="rounded-xl bg-[#F1F9F4] px-3 py-2 text-[11px] text-[#47796A]">매수가 환산 미리보기 (현재 기준 환율): <DualMoney amount={Number(buyPrice)} market={market}/></p>}
        <div><label className="form-label" htmlFor="stock-current">참고 현재가 ({market === "KR" ? "원" : "달러"}) <span className="font-normal text-[#A2AFB5]">선택</span></label><input className="input" id="stock-current" type="number" min="0" step="any" inputMode="decimal" value={currentPrice} onChange={(event) => setCurrentPrice(event.target.value)} placeholder="API 조회 실패 시 사용할 참고가 (선택)"/><p className="mt-2 text-[11px] leading-relaxed text-[#A0ACB2]">API 시세가 연결되면 해당 가격이 우선 적용돼요. 연결되지 않은 종목에만 직접 입력한 참고가를 사용하며, 입력하지 않으면 손익을 표시하지 않아요.</p></div>
        {currentPrice.trim() && Number(currentPrice) >= 0 && <p className="text-[11px] text-[#769589]">참고 현재가 환산: <DualMoney amount={Number(currentPrice)} market={market}/></p>}
        <p className="text-[11px] leading-relaxed text-[#94A5A2]">입력·저장 통화는 한국 주식 KRW, 미국 주식 USD로 고정돼요. 다른 통화 금액은 조회한 기준 환율로 화면에서만 환산합니다.</p>
        {error && <p role="alert" className="rounded-lg bg-[#FFF0EC] px-3 py-2 text-[12px] font-semibold text-[#D25F4A]">{error}</p>}
        <div className="flex items-center justify-end gap-2 border-t border-[#EDF1F2] pt-5"><button type="button" className="secondary-btn" onClick={onClose}>취소</button><button type="submit" disabled={saving} className="primary-btn">{saving ? "저장 중..." : editing ? "수정 완료" : "종목 저장하기"}</button></div>
      </form>
    </section>
  </div>;
}
