import { parseUsdKrwRate, type UsdKrwRate } from "./fx-rates";

// One reference quote for all users; server-side caching avoids needless upstream traffic.
const TTL_MS = 6 * 60 * 60 * 1000;
let cached: { rate: UsdKrwRate; expires: number } | null = null;
let inFlight: Promise<UsdKrwRate> | null = null;

export async function fetchUsdKrwRate(): Promise<UsdKrwRate> {
  if (cached && cached.expires > Date.now()) return cached.rate;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const response = await fetch("https://api.frankfurter.dev/v2/rate/usd/krw", {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("FX upstream unavailable");
    const payload: unknown = await response.json();
    const result = parseUsdKrwRate(payload, new Date().toISOString());
    if (!result) throw new Error("FX upstream returned invalid rate");
    cached = {rate:result,expires:Date.now()+TTL_MS};
    return result;
  })();
  try { return await inFlight; }
  finally { inFlight = null; }
}
