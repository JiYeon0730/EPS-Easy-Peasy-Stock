import type { Market } from "./stocks";

/** Trading-hours hint only: does not check exchange holidays or early closes. */
export function marketSession(market: Market, instant: Date = new Date()): { label: string; description: string } {
  const zone = market === "KR" ? "Asia/Seoul" : "America/New_York";
  const parts = new Intl.DateTimeFormat("en-US", {timeZone:zone, weekday:"short", hour:"2-digit", minute:"2-digit", hourCycle:"h23"}).formatToParts(instant);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = part("weekday");
  const time = Number(part("hour")) * 60 + Number(part("minute"));
  const label = market === "KR" ? "국내" : "미국";
  if (weekday === "Sat" || weekday === "Sun") return { label: `${label} 정규장 외`, description: "주말 · 현지 기준" };
  const open = market === "KR" ? 9 * 60 : 9 * 60 + 30;
  const close = market === "KR" ? 15 * 60 + 30 : 16 * 60;
  return time >= open && time < close
    ? {label: `${label} 정규장 시간대`, description: "공휴일·조기폐장 미반영"}
    : {label:`${label} 정규장 외`,description:"시간외·휴장일 데이터 별도 확인"};
}
