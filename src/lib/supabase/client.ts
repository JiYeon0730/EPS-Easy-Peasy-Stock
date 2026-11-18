"use client";

import { createBrowserClient } from "@supabase/ssr";

/** 공개 URL/Publishable Key만 사용합니다. Secret/service_role 키를 넣지 마세요. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
