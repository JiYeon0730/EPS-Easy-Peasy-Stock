import type { Market } from "./stocks";
export type DisplayCurrency = "KRW" | "USD";
export type CurrencyMode = DisplayCurrency | "AUTO";

/** Selects each market's native currency until the user chooses an override. */
export function currencyForMarket(mode: CurrencyMode, market: Market): DisplayCurrency {
  return mode === "AUTO" ? (market === "KR" ? "KRW" : "USD") : mode;
}
export function translateCurrency(amount:number,market:Market,target:DisplayCurrency,usdKrw:number|null):number|null {
  if(!Number.isFinite(amount)) return null;
  const original=market==="KR"?"KRW":"USD";
  if(original===target) return amount;
  if(usdKrw===null || !Number.isFinite(usdKrw) || usdKrw<=0) return null;
  return original==="KRW"?amount/usdKrw:amount*usdKrw;
}
export function formatCurrency(value:number,currency:DisplayCurrency):string {
  return new Intl.NumberFormat(currency==="KRW"?"ko-KR":"en-US",{
    style:"currency",currency,
    minimumFractionDigits:currency==="KRW"?0:2,
    maximumFractionDigits:currency==="KRW"?0:2,
  }).format(value);
}
