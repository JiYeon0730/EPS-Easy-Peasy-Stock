import assert from "node:assert/strict";
import {test} from "node:test";
import {marketSession} from "../src/lib/market-session.ts";
test("Korean normal weekday session is a hint, not a holiday guarantee", () => {
  const session = marketSession("KR", new Date("2026-11-16T01:00:00Z"));
  assert.match(session.label, /시간대/);
  assert.match(session.description, /공휴일/);
});
test("US session applies New York daylight saving conversion", () => {
  const winter = marketSession("US", new Date("2026-11-16T15:00:00Z"));
  const summer = marketSession("US", new Date("2026-07-15T14:00:00Z"));
  assert.match(winter.label, /시간대/);
  assert.match(summer.label, /시간대/);
});
test("Weekend is not presented as open", () => {
  const session = marketSession("US", new Date("2026-11-14T17:00:00Z"));
  assert.match(session.label, /정규장 외/);
});
