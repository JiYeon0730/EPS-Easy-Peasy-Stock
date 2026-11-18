import assert from "node:assert/strict";
import {test} from "node:test";
import {parseFinnhubSymbols,parseFscStockItems,parseKrxStockItems,searchDirectory} from "../src/lib/stock-directory.ts";
test("KRX daily records yield only latest record for each six-digit equity code",()=>{
  const data={response:{header:{resultCode:"00"},body:{totalCount:3,items:{item:[
    {srtnCd:"005930",itmsNm:"삼성전자",basDt:"20261113"},
    {srtnCd:"005930",itmsNm:"삼성전자",basDt:"20261116"},
    {srtnCd:"000660",itmsNm:"SK하이닉스",basDt:"20261116"},
    {srtnCd:"bad",itmsNm:"가짜",basDt:"20261116"},
  ]}}}};
  assert.deepEqual(parseKrxStockItems(data).stocks.map(s=>s.ticker).sort(),["000660","005930"]);
});
test("rejects failed KRX API response",()=>{
  assert.throws(()=>parseKrxStockItems({response:{header:{resultCode:"03"}}}));
});
test("Finnhub list filters non-equity symbols and invalid tickers",()=>{
  const stocks=parseFinnhubSymbols([{symbol:"AAPL",description:"Apple Inc",currency:"USD",type:"Common Stock"},{symbol:"SPY",description:"SPDR",type:"ETF"},{symbol:"../../",description:"bad",type:"Common Stock"},{symbol:"MSFT",description:"Microsoft",type:"Common Stock"}]);
  assert.deepEqual(stocks.map(s=>s.ticker),["AAPL","MSFT"]);
});
test("US stock lookup matches exact symbols before partial names",()=>{
  const stocks=[{ticker:"AAPL",name:"Apple",market:"US"},{ticker:"APLS",name:"Apellis",market:"US"}];
  assert.equal(searchDirectory(stocks,"aapl")[0].ticker,"AAPL");
  assert.equal(searchDirectory(stocks,"apple")[0].ticker,"AAPL");
});

test("FSC daily stock prices can double as a searchable KR equity directory", () => {
  const payload = {response:{header:{resultCode:"00"},body:{totalCount:4,items:{item:[
    {srtnCd:"005930",itmsNm:"삼성전자",basDt:"20261113",clpr:"192000"},
    {srtnCd:"005930",itmsNm:"삼성전자",basDt:"20261116",clpr:"196800"},
    {srtnCd:"000270",itmsNm:"기아",basDt:"20261116",clpr:"70000"},
    {srtnCd:"BAD",itmsNm:"데이터 오류",basDt:"20261116"},
  ]}}}};
  const result = parseFscStockItems(payload);
  assert.equal(result.rows,4);
  assert.equal(result.totalCount,4);
  assert.deepEqual(result.stocks.map(s=>s.ticker).sort(),["000270","005930"]);
  assert.equal(result.stocks.find(s=>s.ticker==="005930")?.asOf,"20261116");
});
test("FSC invalid API response is rejected, not disguised as an empty successful directory", () => {
  assert.throws(()=>parseFscStockItems({response:{header:{resultCode:"20"}}}));
});
test("a single Korean syllable can match multiple stocks", () => {
  const stocks=[{market:"KR",ticker:"005930",name:"삼성전자"},{market:"KR",ticker:"000270",name:"기아"}];
  assert.deepEqual(searchDirectory(stocks,"삼").map(s=>s.ticker),["005930"]);
});
