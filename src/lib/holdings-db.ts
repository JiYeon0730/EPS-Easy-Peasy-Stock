import type { Holding, HoldingInput } from "@/lib/stocks";

/** Database rows are never reused as market quotes: reference_price is user-entered only. */
export type HoldingRow = {
  id: string;
  ticker: string;
  name: string;
  market: "KR" | "US";
  quantity: number | string;
  buy_price: number | string;
  reference_price: number | string | null;
  source: "manual" | "sample";
  created_at: string;
};

export function toHolding(row: HoldingRow): Holding {
  const holding: Holding = {
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    market: row.market,
    quantity: Number(row.quantity),
    buyPrice: Number(row.buy_price),
    currentPrice: row.reference_price === null ? null : Number(row.reference_price),
    source: row.source,
    createdAt: row.created_at,
  };
  if (!holding.id || !holding.ticker || !holding.name ||
      !["KR", "US"].includes(holding.market) ||
      !["manual", "sample"].includes(holding.source) ||
      !Number.isFinite(holding.quantity) || holding.quantity <= 0 ||
      !Number.isFinite(holding.buyPrice) || holding.buyPrice <= 0 ||
      (holding.currentPrice !== null && (!Number.isFinite(holding.currentPrice) || holding.currentPrice < 0))) {
    throw new Error("DB에서 잘못된 종목 정보가 반환됐어요.");
  }
  return holding;
}

export function toHoldingInsert(userId: string, input: HoldingInput) {
  if (!userId) throw new Error("로그인이 필요해요.");
  const ticker = input.ticker.trim().toUpperCase();
  const name = input.name.trim();
  if (!ticker || !name || !["KR", "US"].includes(input.market) ||
      !Number.isFinite(input.quantity) || input.quantity <= 0 ||
      !Number.isFinite(input.buyPrice) || input.buyPrice <= 0 ||
      (input.currentPrice !== null && (!Number.isFinite(input.currentPrice) || input.currentPrice < 0))) {
    throw new Error("종목명, 코드, 수량, 매수가를 확인해 주세요.");
  }
  return {
    user_id: userId,
    ticker,
    name,
    market: input.market,
    quantity: input.quantity,
    buy_price: input.buyPrice,
    reference_price: input.currentPrice,
    source: "manual" as const,
  };
}

export function toHoldingUpdate(input: HoldingInput) {
  const { user_id, ...fields } = toHoldingInsert("validated", input);
  void user_id;
  return fields;
}

export function stockKey(market: string, ticker: string) {
  return `${market}:${ticker.trim().toUpperCase()}`;
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && error.code === "23505") {
    return "이미 등록된 종목이에요. 기존 종목을 수정해 주세요.";
  }
  if (error && typeof error === "object" && "code" in error && error.code === "42501") {
    return "데이터 접근 권한이 없어요. 로그인 상태와 Supabase RLS 설정을 확인해 주세요.";
  }
  return error instanceof Error ? error.message : "종목 저장에 실패했어요.";
}
