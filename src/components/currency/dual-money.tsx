"use client";

import { useCurrencyPreference } from "@/context/currency-context";
import { useFx } from "@/context/fx-context";
import {
  currencyForMarket,
  formatCurrency,
  translateCurrency,
  type CurrencyMode,
  type DisplayCurrency,
} from "@/lib/dual-currency";
import type { Market } from "@/lib/stocks";

const options: { value: CurrencyMode; label: string }[] = [
  { value: "AUTO", label: "기본 (국내 ₩ / 미국 $)" },
  { value: "KRW", label: "₩ 원화 우선" },
  { value: "USD", label: "$ 달러 우선" },
];

export function CurrencySwitcher() {
  const { preferred, setPreferred } = useCurrencyPreference();

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="금액 표시 통화 선택">
      <span className="text-[13px] font-semibold leading-5 text-[#6D8880]">
        금액 표시
      </span>
      <div
        className="flex flex-wrap gap-1 rounded-lg border border-[#DBE9E3] bg-[#F3F8F5] p-1"
        role="group"
        aria-label="금액 우선 표시 통화"
      >
        {options.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={preferred === value}
            onClick={() => setPreferred(value)}
            className={`rounded-md px-3 py-2 text-[13px] font-semibold leading-5 tracking-normal transition-colors ${
              preferred === value
                ? "bg-white text-[#137A61] shadow-sm"
                : "text-[#6D8880] hover:bg-white/70 hover:text-[#2D6856]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DualMoney({
  amount,
  market,
  signed = false,
  emphasis = false,
}: {
  amount: number | null;
  market: Market;
  signed?: boolean;
  emphasis?: boolean;
}) {
  const { preferred } = useCurrencyPreference();
  const { rate } = useFx();

  if (amount === null || !Number.isFinite(amount)) {
    return <span className="text-[#A4B2B3]">—</span>;
  }

  const native: DisplayCurrency = market === "KR" ? "KRW" : "USD";
  const selectedCurrency = currencyForMarket(preferred, market);
  const fxRate = rate?.rate ?? null;
  const selectedAmount = translateCurrency(amount, market, selectedCurrency, fxRate);
  const fxUnavailable = selectedAmount === null;

  // 환율 조회 실패 시에도 원래 통화의 가격은 계속 표시합니다.
  const primaryCurrency = fxUnavailable ? native : selectedCurrency;
  const primaryAmount = fxUnavailable ? amount : selectedAmount;
  const secondaryCurrency: DisplayCurrency = primaryCurrency === "KRW" ? "USD" : "KRW";
  const secondaryAmount = fxUnavailable
    ? null
    : translateCurrency(amount, market, secondaryCurrency, fxRate);
  const sign = signed && amount > 0 ? "+" : "";

  return (
    <span
      className="inline-flex min-w-[100px] flex-col gap-1"
      title={
        rate
          ? `USD/KRW ${rate.rate.toLocaleString("ko-KR")} · ${rate.date} 기준 환율`
          : `${native} 원래 통화 기준, 환율 미조회`
      }
    >
      <span className={`whitespace-nowrap ${emphasis ? "font-extrabold" : "font-semibold"}`}>
        {sign}{formatCurrency(primaryAmount, primaryCurrency)}
        {fxUnavailable && selectedCurrency !== native && (
          <span className="ml-1 text-[10px] font-normal text-[#8CA29C]">원통화</span>
        )}
      </span>
      <span className="whitespace-nowrap text-[11px] font-medium text-[#829A98]">
        {secondaryAmount === null
          ? "환율 조회 필요"
          : `${sign}${formatCurrency(secondaryAmount, secondaryCurrency)}`}
      </span>
    </span>
  );
}
