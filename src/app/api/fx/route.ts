import { NextResponse } from "next/server";
import { fetchUsdKrwRate } from "@/lib/fx-provider";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rate = await fetchUsdKrwRate();
    return NextResponse.json(rate, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Never fall back to an invented exchange rate or expose upstream internals.
    return NextResponse.json({error:"기준 환율을 조회하지 못했습니다."}, {status:502,headers:{"Cache-Control":"no-store"}});
  }
}
