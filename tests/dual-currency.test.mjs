import assert from "node:assert/strict";
import {test} from "node:test";
import {translateCurrency,formatCurrency,currencyForMarket} from "../src/lib/dual-currency.ts";
test("KR stocks can be displayed in USD using daily USD/KRW reference",()=>assert.equal(translateCurrency(140000,"KR","USD",1400),100));
test("US stocks can be displayed in KRW using daily USD/KRW reference",()=>assert.equal(translateCurrency(100,"US","KRW",1400),140000));
test("original value is always available even when reference FX is missing",()=>{assert.equal(translateCurrency(100,"US","USD",null),100);assert.equal(translateCurrency(100,"US","KRW",null),null);assert.equal(translateCurrency(100,"KR","USD",0),null);});
test("formats money according to target currency",()=>{assert.match(formatCurrency(140000,"KRW"),/140,000/);assert.match(formatCurrency(100,"USD"),/100\.00/);});

test("AUTO defaults to KRW for KR and USD for US",()=>{
  assert.equal(currencyForMarket("AUTO","KR"),"KRW");
  assert.equal(currencyForMarket("AUTO","US"),"USD");
});
test("manual currency choice applies to both markets",()=>{
  assert.equal(currencyForMarket("USD","KR"),"USD");
  assert.equal(currencyForMarket("KRW","US"),"KRW");
});
