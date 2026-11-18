"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CurrencyMode } from "@/lib/dual-currency";

type CurrencyContextValue = {
  preferred: CurrencyMode;
  setPreferred: (value: CurrencyMode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // 초기 표시: 국내 주식은 KRW, 미국 주식은 USD.
  // 사용자가 버튼을 누른 뒤에만 전체 표시 통화가 바뀝니다.
  const [preferred, setState] = useState<CurrencyMode>("AUTO");

  const setPreferred = useCallback((next: CurrencyMode) => {
    setState(next);
  }, []);

  const value = useMemo(
    () => ({ preferred, setPreferred }),
    [preferred, setPreferred],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyPreference() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrencyPreference must be inside CurrencyProvider");
  }
  return context;
}
