import type { Metadata } from "next";
import "./globals.css";
import { HoldingsProvider } from "@/context/holdings-context";
import { CurrencyProvider } from "@/context/currency-context";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "EPS | Easy Peasy Stock",
  description: "주식, 어렵지 않게. 내 투자 현황을 쉽고 명확하게 관리하는 공간.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><HoldingsProvider><CurrencyProvider><AppShell>{children}</AppShell></CurrencyProvider></HoldingsProvider></body></html>;
}
