import assert from "node:assert/strict";
import {test} from "node:test";
import {parseUsdKrwRate} from "../src/lib/fx-rates.ts";
const date="2026-11-16";
test("parses a Frankfurter v2 single rate response",()=>{
  const parsed=parseUsdKrwRate({date,base:"USD",quote:"KRW",rate:1380.6},"2026-11-17T00:00:00Z");
  assert.deepEqual(parsed,{date,base:"USD",quote:"KRW",rate:1380.6,source:"Frankfurter",fetchedAt:"2026-11-17T00:00:00Z"});
});
test("rejects other currency pairs, invalid and future values",()=>{
  assert.equal(parseUsdKrwRate({date,base:"EUR",quote:"KRW",rate:1500},"x"),null);
  assert.equal(parseUsdKrwRate({date,base:"USD",quote:"KRW",rate:0},"x"),null);
  assert.equal(parseUsdKrwRate({date:"invalid",base:"USD",quote:"KRW",rate:1500},"x"),null);
  assert.equal(parseUsdKrwRate({date:"2099-01-01",base:"USD",quote:"KRW",rate:1500},"x"),null);
});
