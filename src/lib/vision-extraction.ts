import { z } from "zod";
import type { HoldingInput } from "@/lib/stocks";

// The AI response is untrusted. Validate every field before returning it to the browser.
export const extractedHoldingSchema = z.object({
  ticker: z.string().trim().max(30),
  stock_name: z.string().trim().min(1).max(100),
  market_type: z.enum(["KR", "US"]),
  quantity: z.number().finite().int().min(0).max(100_000_000),
  buy_price: z.number().finite().min(0).max(1_000_000_000_000),
});

export const visionResultSchema = z.object({
  holdings: z.array(extractedHoldingSchema).max(30),
  warnings: z.array(z.string().trim().max(250)).max(8).default([]),
});

export type ExtractedHolding = z.infer<typeof extractedHoldingSchema>;
export type VisionResult = z.infer<typeof visionResultSchema>;

// A schema is also supplied to Gemini, but the Zod validation above remains mandatory.
export const geminiVisionResponseSchema = {
  type: "OBJECT",
  properties: {
    holdings: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          ticker: { type: "STRING" },
          stock_name: { type: "STRING" },
          market_type: { type: "STRING", enum: ["KR", "US"] },
          quantity: { type: "INTEGER" },
          buy_price: { type: "NUMBER" },
        },
        required: ["ticker", "stock_name", "market_type", "quantity", "buy_price"],
        propertyOrdering: ["ticker", "stock_name", "market_type", "quantity", "buy_price"],
      },
    },
    warnings: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["holdings", "warnings"],
  propertyOrdering: ["holdings", "warnings"],
} as const;

export function validateReviewHolding(value: ExtractedHolding): HoldingInput | null {
  const clean = extractedHoldingSchema.safeParse(value);
  if (!clean.success) return null;
  const { ticker, stock_name, market_type, quantity, buy_price } = clean.data;
  const normalizedTicker = ticker.toUpperCase();
  if (market_type === "KR" && !/^\d{6}$/.test(normalizedTicker)) return null;
  if (market_type === "US" && !/^[A-Z][A-Z0-9.\-^]{0,29}$/.test(normalizedTicker)) return null;
  if (quantity <= 0 || buy_price <= 0) return null;
  return {
    ticker: normalizedTicker,
    name: stock_name,
    market: market_type,
    quantity,
    buyPrice: buy_price,
    currentPrice: null,
  };
}

export function hasAllowedImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  if (mime === "image/webp") {
    return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}
