"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    let alive = true;
    // AuthStatus is only a display element; the database remains protected by RLS.
    void client.auth.getUser().then(({ data }) => {
      if (alive) {
        setEmail(data.user?.email ?? null);
        setLoading(false);
      }
    }).catch(() => {
      if (alive) setLoading(false);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (alive) {
        setEmail(session?.user.email ?? null);
        setLoading(false);
      }
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  if (!configured) {
    return <Link href="/login" className="text-[12px] font-semibold text-[#B28739]">Supabase 설정 필요</Link>;
  }
  if (loading) {
    return <span className="text-[12px] text-[#89969B]">계정 확인 중</span>;
  }
  return <Link href={email ? "/account" : "/login"} title={email ?? "로그인"} className="inline-flex items-center gap-2 rounded-full border border-[#D9EBE1] bg-[#F2FAF5] px-3 py-2 text-[13px] font-semibold text-[#26765E] hover:bg-[#E2F4EA]">
    {email ? <UserRound size={15} /> : <LogIn size={15} />}
    <span>{email ? "내 계정" : "로그인"}</span>
  </Link>;
}
