"use client";

import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, Plus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Market } from "@/lib/stocks";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><p className="mb-2 text-[12px] font-bold tracking-[.11em] text-[#168A70]">{eyebrow}</p><h1 className="text-[27px] font-extrabold tracking-[-.055em] text-[#1D3032] sm:text-[32px]">{title}</h1><p className="mt-2 text-[13px] leading-[1.75] text-[#8A98A1] sm:text-[14px]">{description}</p></div>{action}
  </div>;
}

export function SectionHeading({ title, caption, more }: { title: string; caption?: string; more?: { text: string; href: string } }) {
  return <div className="mb-5 flex items-center justify-between gap-2"><div><h2 className="text-[17px] font-bold tracking-[-.035em] text-[#263C3D]">{title}</h2>{caption && <p className="mt-1 text-[12px] text-[#98A6AD]">{caption}</p>}</div>{more && <Link href={more.href} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#17846A] hover:underline">{more.text}<ArrowRight size={14}/></Link>}</div>;
}

export function IconTile({ icon: Icon, variant = "mint" }: { icon: LucideIcon; variant?: "mint" | "blue" | "peach" | "purple" }) {
  const color = { mint: "bg-[#E5F5EE] text-[#17846A]", blue: "bg-[#E9F0FF] text-[#5C7FEA]", peach: "bg-[#FFF1E7] text-[#D58B4C]", purple: "bg-[#F2EAFE] text-[#9270D8]" }[variant];
  return <div className={`flex size-11 shrink-0 items-center justify-center rounded-[13px] ${color}`}><Icon size={21} strokeWidth={1.9}/></div>;
}

export function MarketBadge({ market }: { market: Market }) {
  return <span className={`inline-flex items-center rounded-[6px] px-2 py-1 text-[10px] font-bold ${market === "KR" ? "bg-[#F0F2F5] text-[#6C7885]" : "bg-[#EAF0FF] text-[#5272D2]"}`}>{market === "KR" ? "KR · 국내" : "US · 미국"}</span>;
}

export function EmptyState({ icon: Icon = ChartNoAxesCombined, title, description, action }: { icon?: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-[225px] flex-col items-center justify-center px-5 py-10 text-center"><div className="mb-4 flex size-14 items-center justify-center rounded-[19px] bg-[#EEF7F2] text-[#68AC93]"><Icon size={26}/></div><h3 className="text-[15px] font-bold text-[#2E4544]">{title}</h3><p className="mt-2 max-w-[340px] text-[12px] leading-[1.8] text-[#98A5AE]">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function AddStockLink() {
  return <Link href="/portfolio?add=1" className="primary-btn"><Plus size={17}/> 종목 등록하기</Link>;
}
