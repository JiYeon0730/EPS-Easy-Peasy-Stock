import assert from "node:assert/strict";
import {test} from "node:test";
import {portfolioTotals,portfolioAllocation,portfolioPerformance} from "../src/lib/portfolio-analytics.ts";
const kr = (price=100)=>({id:"1",name:"한국",ticker:"005930",market:"KR",quantity:10,buyPrice:50,currentPrice:price,source:"manual",createdAt:"2026-01-01"});
const us = (price=20)=>({id:"2",name:"미국",ticker:"AAPL",market:"US",quantity:2,buyPrice:10,currentPrice:price,source:"manual",createdAt:"2026-01-01"});

test("converts cost and valuation at same reference FX and computes weighted return",()=>{
  const result = portfolioTotals([kr(),us()],1000);
  assert.equal(result.costKrw,20500);
  assert.equal(result.valueKrw,41000);
  assert.equal(result.gainKrw,20500);
  assert.equal(result.returnPercent,100);
});
test("blocks mixed-currency totals without valid FX, not using imaginary rates",()=>{
  for (const rate of [null,0,NaN,-1]) {
    assert.equal(portfolioTotals([kr(),us()],rate).costKrw,null);
    assert.equal(portfolioAllocation([kr(),us()],"ALL",rate).items.length,0);
  }
});
test("KR-only portfolio can total without FX",()=>{
  const result=portfolioTotals([kr()],null);
  assert.equal(result.valueKrw,1000);
  assert.equal(result.costKrw,500);
});
test("unpriced holding blocks combined valuation but not total purchase cost",()=>{
  const result=portfolioTotals([kr(null),us(20)],1000);
  assert.equal(result.costKrw,20500);
  assert.equal(result.valueKrw,null);
  assert.equal(result.missingPrices,1);
  const chart=portfolioAllocation([kr(null),us(20)],"ALL",1000);
  assert.equal(chart.basis,"cost");
  assert.equal(chart.sum,20500);
});
test("allocation valuations use converted value and sum to 100%",()=>{
  const result=portfolioAllocation([kr(),us()],"ALL",1000);
  assert.equal(result.basis,"valuation");
  assert.equal(result.currency,"KRW");
  assert.ok(Math.abs(result.items.reduce((a,i)=>a+i.weight,0)-100)<0.0001);
});
test("separate US chart works without FX, and performance handles negative return",()=>{
  const chart=portfolioAllocation([us()],"US",null);
  assert.equal(chart.currency,"USD");
  assert.equal(chart.sum,40);
  const loss=portfolioPerformance([kr(20)])[0];
  assert.equal(loss.returnPercent,-60);
  assert.equal(loss.profit,-300);
});
test("empty portfolio never shows zero as an actual invested portfolio",()=>{
  assert.equal(portfolioTotals([],null).costKrw,null);
  assert.equal(portfolioAllocation([],"ALL",null).sum,null);
});
