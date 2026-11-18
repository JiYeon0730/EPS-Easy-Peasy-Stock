import assert from "node:assert/strict";
import { test } from "node:test";
import { applyQuotes, displayedPrice, quoteKey, uniqueSymbols, validPrice, validQuoteRequestItem } from "../src/lib/market-quotes.ts";

const holding = (market, ticker, currentPrice = 100) => ({ id: ticker, market, ticker, name: ticker, quantity: 2, buyPrice: 50, currentPrice, source: "manual", createdAt: "2026-01-01" });
test("Korean symbol stays six digits and US ticker validated", () => {
  assert.equal(validQuoteRequestItem({market:"KR",ticker:"005930"}), true);
  assert.equal(validQuoteRequestItem({market:"KR",ticker:"5930"}), false);
  assert.equal(validQuoteRequestItem({market:"US",ticker:"AAPL"}), true);
  assert.equal(validQuoteRequestItem({market:"US",ticker:"../../x"}), false);
});
test("zero or invalid price never becomes a real quote", () => {
  assert.equal(validPrice(0), false);
  assert.equal(validPrice(Number.NaN), false);
  assert.equal(validPrice(165.75), true);
});
test("unique symbols deduplicates regardless of lots", () => {
  const input = [holding("US","AAPL"), holding("US","AAPL"), holding("KR","005930")];
  assert.deepEqual(uniqueSymbols(input), [{market:"US",ticker:"AAPL"},{market:"KR",ticker:"005930"}]);
});
test("live quotes override display without modifying stored holding", () => {
  const input = holding("KR","005930",73500);
  const priceMap = { [quoteKey("KR","005930")]: {market:"KR",ticker:"005930",price:83000,provider:"FSC",fetchedAt:"2026-11-14T00:00:00Z",tradedAt:null,previousClose:null,changePercent:null} };
  assert.equal(displayedPrice(priceMap,input),83000);
  assert.equal(applyQuotes([input],priceMap)[0].currentPrice,83000);
  assert.equal(input.currentPrice,73500);
  assert.equal(displayedPrice({},input),73500);
});
