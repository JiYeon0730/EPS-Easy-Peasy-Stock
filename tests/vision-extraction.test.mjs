import test from "node:test";
import assert from "node:assert/strict";
import { hasAllowedImageSignature, visionResultSchema, validateReviewHolding } from "../src/lib/vision-extraction.ts";

const candidate = { ticker: "005930", stock_name: "삼성전자", market_type: "KR", quantity: 10, buy_price: 68000 };
test("extracts a valid Korean stock row", () => {
  const result = visionResultSchema.parse({ holdings: [candidate], warnings: [] });
  const reviewed = validateReviewHolding(result.holdings[0]);
  assert.equal(reviewed.ticker, "005930");
  assert.equal(reviewed.market, "KR");
  assert.equal(reviewed.currentPrice, null);
});

test("rejects malformed or unconfirmed numerical data", () => {
  assert.equal(validateReviewHolding({ ...candidate, quantity: 0 }), null);
  assert.equal(validateReviewHolding({ ...candidate, ticker: "NOT-KR" }), null);
  assert.equal(validateReviewHolding({ ...candidate, buy_price: 0 }), null);
  assert.equal(visionResultSchema.safeParse({ holdings: [{ ...candidate, quantity: "10" }], warnings: [] }).success, false);
});

test("normalizes a US ticker after review", () => {
  const result = validateReviewHolding({ ticker: "aapl", stock_name: "Apple", market_type: "US", quantity: 2, buy_price: 185.5 });
  assert.equal(result?.ticker, "AAPL");
  assert.equal(result?.market, "US");
});

test("rejects signature spoofing before Gemini call", () => {
  assert.equal(hasAllowedImageSignature(new Uint8Array([0xff,0xd8,0xff,0x01]), "image/jpeg"), true);
  assert.equal(hasAllowedImageSignature(new Uint8Array([1,2,3,4]), "image/jpeg"), false);
  assert.equal(hasAllowedImageSignature(new Uint8Array([137,80,78,71,13,10,26,10]), "image/png"), true);
  assert.equal(hasAllowedImageSignature(new Uint8Array([137,80,78,71,13,10,26,10]), "image/webp"), false);
});
