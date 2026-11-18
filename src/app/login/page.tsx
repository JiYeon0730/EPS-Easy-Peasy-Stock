"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const configured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("error") === "confirmation") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("인증 링크가 만료됐거나 올바르지 않아요. 새로 가입하거나 다시 로그인해 주세요.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    const client = createClient();
    if (!client) { setError(".env.local의 Supabase URL과 Publishable Key를 확인해 주세요."); return; }
    if (password.length < 8) { setError("비밀번호를 8자 이상 입력해 주세요."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await client.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        });
        if (authError) throw authError;
        if (data.session) {
          router.push("/account"); router.refresh();
        } else {
          setMessage("가입 요청을 접수했어요. 확인 메일이 도착하면 인증 링크를 눌러 주세요.");
        }
      } else {
        const { error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.push("/account"); router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "인증 중 문제가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-[490px] panel p-6 sm:p-9">
    <span className="text-[11px] font-bold tracking-[.14em] text-[#13826A]">EPS ACCOUNT</span>
    <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#1C3835]">{mode === "login" ? "다시 오신 걸 환영해요" : "EPS 계정 만들기"}</h1>
    <p className="mt-2 text-[13px] leading-6 text-[#82949B]">내 주식을 안전하게 관리하기 위한 계정을 만들어요.</p>
    <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#F1F6F4] p-1">
      <button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); setError(""); setMessage(""); }} className={`rounded-lg py-2.5 text-[13px] font-semibold ${mode === "login" ? "bg-white text-[#137A61] shadow-sm" : "text-[#70877F]"}`}>로그인</button>
      <button type="button" aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className={`rounded-lg py-2.5 text-[13px] font-semibold ${mode === "signup" ? "bg-white text-[#137A61] shadow-sm" : "text-[#70877F]"}`}>회원가입</button>
    </div>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div><label htmlFor="eps-email" className="form-label">이메일</label><div className="relative"><Mail size={17} className="absolute left-3 top-3.5 text-[#8DA49C]"/><input id="eps-email" required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="input pl-10" placeholder="name@example.com" /></div></div>
      <div><label htmlFor="eps-password" className="form-label">비밀번호 (8자 이상)</label><div className="relative"><LockKeyhole size={17} className="absolute left-3 top-3.5 text-[#8DA49C]"/><input id="eps-password" required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="input pl-10" placeholder="비밀번호를 입력하세요"/></div></div>
      {message && <p role="status" className="rounded-lg bg-[#E6F7EE] px-3 py-3 text-[12px] leading-5 text-[#14694F]">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-[#FDF0EC] px-3 py-3 text-[12px] leading-5 text-[#AE4B3F]">{error}</p>}
      <button type="submit" disabled={busy || !configured} className="primary-btn w-full">{busy ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}</button>
    </form>
    {!configured && <p className="mt-4 text-[12px] text-[#9A6D38]">Supabase 환경변수를 먼저 설정해 주세요.</p>}
    <p className="mt-6 rounded-xl bg-[#F3F8F6] p-3 text-[12px] leading-6 text-[#607F75]">현재 이 버전은 로그인 기능을 먼저 검증하는 단계예요. 기존 브라우저 보유 종목은 아직 Supabase로 전송하지 않으며 삭제되지 않아요.</p>
    <div className="mt-5 text-center"><Link href="/" className="text-[12px] font-semibold text-[#478A77] hover:underline">대시보드로 돌아가기</Link></div>
  </section>;
}
