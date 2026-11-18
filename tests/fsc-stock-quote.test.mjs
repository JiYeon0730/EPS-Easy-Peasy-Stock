import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFscDailyClose } from "../src/lib/fsc-stock-quote.ts";

const data = { response: { header: { resultCode: "00" }, body: { items: { item: [
  { srtnCd: "005930", basDt: "20261113", clpr: "80,000", vs: "-500", fltRt: "-0.62" },
  { srtnCd: "000660", basDt: "20261114", clpr: "180000", vs: "1000", fltRt: "0.56" },
  { srtnCd: "005930", basDt: "20261112", clpr: "80500", vs: "500", fltRt: "0.63" }
] } } } };
test("parses latest matching official daily close, ignoring unrelated tickers", () => {
  assert.deepEqual(parseFscDailyClose(data, "005930"), {
    price: 80000, quoteDate: "2026-11-13", previousClose: 80500, changePercent: -0.62,
  });
});
test("returns null for API errors, absent data, or invalid prices", () => {
  assert.equal(parseFscDailyClose({ response: { header: {resultCode:"30"}, body:data.response.body } }, "005930"), null);
  assert.equal(parseFscDailyClose(data, "999999"), null);
  assert.equal(parseFscDailyClose({response:{header:{resultCode:"00"},body:{items:{item:{srtnCd:"005930",basDt:"20261113",clpr:"0"}}}}}, "005930"), null);
});
test("supports one-item response and derives change percentage", () => {
  const one = {response:{header:{resultCode:"00"},body:{items:{item:{srtnCd:"005930",basDt:"20261116",clpr:"84000",vs:"4000"}}}}};
  assert.deepEqual(parseFscDailyClose(one, "005930"), {price:84000,quoteDate:"2026-11-16",previousClose:80000,changePercent:5});
});
