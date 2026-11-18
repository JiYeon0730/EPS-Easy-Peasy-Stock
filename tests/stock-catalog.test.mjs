import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(join(root, "src/lib/stock-catalog.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { searchCatalog, findCatalogStock, normalizeStockSearch, STOCK_CATALOG } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("국내 이름·별칭·종목코드 검색", () => {
  assert.equal(searchCatalog("KR", "삼성전자")[0]?.ticker, "005930");
  assert.equal(searchCatalog("KR", "네이버")[0]?.ticker, "035420");
  assert.equal(searchCatalog("KR", "005930")[0]?.name, "삼성전자");
});

test("미국 종목 한글·영문·티커 검색", () => {
  assert.equal(searchCatalog("US", "애플")[0]?.ticker, "AAPL");
  assert.equal(searchCatalog("US", "nVdA")[0]?.name, "NVIDIA");
  assert.equal(searchCatalog("US", "Microsoft")[0]?.ticker, "MSFT");
});

test("거래 시장 필터와 검색 제한", () => {
  assert.equal(searchCatalog("US", "삼성전자").length, 0);
  assert.equal(searchCatalog("KR", "애플").length, 0);
  assert.equal(searchCatalog("KR", "").length, 8);
  assert.equal(searchCatalog("US", "a", 3).length <= 3, true);
});

test("정규화, 정확한 티커 조회와 목록 중복 없음", () => {
  assert.equal(normalizeStockSearch(" A A P L "), "aapl");
  assert.equal(findCatalogStock("US", " aapl ")?.name, "Apple");
  assert.equal(findCatalogStock("KR", "005930")?.name, "삼성전자");
  assert.equal(new Set(STOCK_CATALOG.map((s) => `${s.market}:${s.ticker}`)).size, STOCK_CATALOG.length);
  assert.ok(STOCK_CATALOG.filter((s) => s.market === "KR").every((s) => /^\d{6}$/.test(s.ticker)));
});
