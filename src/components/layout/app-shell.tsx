"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity, ArrowUpRight, BookOpen, BrainCircuit, ChevronRight, CircleHelp,
  LayoutDashboard, Menu, Newspaper, ScanLine, Settings2, ShieldCheck,
  Sparkles, WalletCards, X,
} from "lucide-react";
import { useHoldings } from "@/context/holdings-context";
import { AuthStatus } from "@/components/auth/auth-status";

const NAV = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/portfolio", label: "내 주식", icon: WalletCards },
  { href: "/import", label: "캡처로 등록", icon: ScanLine },
  { href: "/news", label: "맞춤 뉴스", icon: Newspaper },
  { href: "/insights", label: "AI 인사이트", icon: BrainCircuit },
];

const titleFor = (path: string) => NAV.find((item) => item.href === path)?.label ?? (path === "/settings" ? "설정" : path === "/login" ? "로그인" : path === "/account" ? "내 계정" : "EPS");

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { sampleCount, clearSamples, mode } = useHoldings();

  const sidebar = <>
    <Link href="/" className="flex items-center gap-3 px-7 py-8" onClick={() => setMenuOpen(false)} aria-label="EPS 홈">
      <div className="flex size-11 items-center justify-center rounded-[15px] bg-[#126956] text-white shadow-[0_8px_20px_rgba(18,105,86,.22)]"><Activity size={24} strokeWidth={2.6} /></div>
      <div className="leading-tight"><div className="text-[24px] font-black tracking-[-.06em] text-[#142A2B]">eps<span className="text-[#20A17D]">.</span></div><div className="mt-0.5 text-[10px] font-semibold tracking-[.12em] text-[#89969B]">EASY PEASY STOCK</div></div>
    </Link>
    <div className="px-5 pt-5">
      <p className="px-4 pb-3 text-[11px] font-bold tracking-[.13em] text-[#9BA5AE]">WORKSPACE</p>
      <nav aria-label="주 메뉴" className="space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-[12px] px-4 py-[13px] text-[14px] font-semibold transition-colors ${active ? "bg-[#E7F6EF] text-[#10745D]" : "text-[#65737F] hover:bg-[#F6F8F9] hover:text-[#243A3A]"}`}>
            <Icon size={19} strokeWidth={active ? 2.4 : 1.85} />{label}{active && <span className="ml-auto size-[6px] rounded-full bg-[#21A27E]" />}
          </Link>;
        })}
      </nav>
    </div>
    <div className="mt-auto px-5 pb-6 pt-8">
      <div className="rounded-[20px] bg-[#113D38] p-[19px] text-white shadow-[0_10px_30px_rgba(17,61,56,.13)]">
        <div className="mb-3 flex size-9 items-center justify-center rounded-[11px] bg-white/10"><BookOpen size={19} /></div>
        <p className="text-[14px] font-bold leading-snug">처음 주식 시작해요?</p>
        <p className="mt-2 text-[12px] leading-[1.65] text-[#B6D5CB]">복잡한 숫자보다 중요한 것부터 차근차근.</p>
        <Link href="/portfolio" onClick={() => setMenuOpen(false)} className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#B5F4D9] hover:text-white">내 첫 종목 등록하기 <ArrowUpRight size={14}/></Link>
      </div>
      <Link href="/settings" onClick={() => setMenuOpen(false)} className={`mt-5 flex items-center gap-3 rounded-[12px] px-4 py-3 text-[14px] font-medium ${pathname === "/settings" ? "bg-[#E7F6EF] text-[#10745D]" : "text-[#7E8B93] hover:bg-[#F6F8F9]"}`}><Settings2 size={19}/> 설정</Link>
      <p className="mt-5 flex items-center gap-1.5 px-4 text-[10px] font-medium text-[#A6B0B6]"><ShieldCheck size={13}/> {mode === "cloud" ? "Supabase 계정별 저장" : "이 브라우저에만 임시 저장"}</p>
    </div>
  </>;

  return <div className="min-h-screen bg-[#F6F8FA] text-[#1D3032]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-[#E8EEF0] bg-white lg:flex">{sidebar}</aside>
    {menuOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" className="absolute inset-0 bg-[#0C2529]/40" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기"/><aside className="absolute inset-y-0 left-0 flex w-[265px] flex-col bg-white shadow-2xl">{sidebar}</aside><button type="button" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} className="absolute left-[274px] top-5 flex size-9 items-center justify-center rounded-lg bg-white text-[#243A3A]"><X size={20}/></button></div>}
    <div className="lg:pl-[250px]">
      <header className="sticky top-0 z-30 flex h-[78px] items-center justify-between border-b border-[#EDF0F2] bg-white/95 px-5 backdrop-blur-sm sm:px-8 lg:px-12">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-[#486360] lg:hidden" aria-label="메뉴 열기"><Menu size={23}/></button><div><div className="flex items-center gap-2 text-[12px] font-medium text-[#9BA6AE]"><span>Workspace</span><ChevronRight size={13}/><span className="text-[#347A69]">{titleFor(pathname)}</span></div><p className="mt-[3px] text-[15px] font-bold text-[#263A3B]">주식, 쉽고 편하게.</p></div></div>
        <div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 rounded-full border border-[#D9EBE1] bg-[#F2FAF5] px-3 py-1.5 text-[11px] font-bold text-[#2B8969] sm:flex"><span className="size-1.5 rounded-full bg-[#29B780]"/> EPS Preview v0.7.1</span><AuthStatus /><Link href="/settings" className="flex size-10 items-center justify-center rounded-full border border-[#E8EBED] bg-white text-[#56716F] hover:bg-[#F7FAF8]" aria-label="설정"><CircleHelp size={19}/></Link></div>
      </header>
      {sampleCount > 0 && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F6E4BA] bg-[#FFF8E7] px-5 py-2.5 text-[12px] text-[#8B611C] sm:px-8 lg:px-12"><span className="flex items-center gap-2"><Sparkles size={16}/><strong>체험용 샘플 데이터 {sampleCount}개</strong> · 보유 수량·매수가는 가상 정보이며, API 조회 시 현재가는 실제 제공사 값을 표시합니다.</span><button type="button" onClick={clearSamples} className="rounded-md px-2 py-1 text-[13px] font-semibold leading-5 tracking-normal underline underline-offset-2 hover:bg-[#FFEFCB] hover:text-[#5A3C10]">샘플 지우기</button></div>}
      <main className="mx-auto max-w-[1450px] px-5 pb-20 pt-9 sm:px-8 lg:px-12 lg:pt-11">{children}</main>
      <footer className="mx-auto flex max-w-[1450px] flex-col gap-2 px-5 pb-9 text-[11px] text-[#A0AAAF] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span>© 2026 EPS — Easy Peasy Stock</span><span>투자 판단을 대신하지 않는 개인 기록용 프리뷰입니다.</span></footer>
    </div>
  </div>;
}
