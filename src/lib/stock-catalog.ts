import type { Market } from "@/lib/stocks";

/**
 * EPS v0.2 오프라인 검색용 주요 종목 목록.
 * 공식 거래소의 전체 상장 목록이나 실시간 시세 제공 API가 아닙니다.
 * 실제 종목 DB 연동 시 이 파일의 검색 함수를 API 검색으로 교체할 수 있습니다.
 */
export interface StockOption {
  market: Market;
  ticker: string;
  name: string;
  aliases?: readonly string[];
}

export const STOCK_CATALOG: readonly StockOption[] = [
  // 국내 주요 종목: 입력 편의용 예시 목록 (가격 데이터 없음)
  { market: "KR", ticker: "005930", name: "삼성전자", aliases: ["Samsung Electronics", "삼전"] },
  { market: "KR", ticker: "000660", name: "SK하이닉스", aliases: ["SK Hynix", "하이닉스"] },
  { market: "KR", ticker: "035420", name: "NAVER", aliases: ["네이버"] },
  { market: "KR", ticker: "035720", name: "카카오", aliases: ["Kakao"] },
  { market: "KR", ticker: "005380", name: "현대차", aliases: ["현대자동차", "Hyundai Motor"] },
  { market: "KR", ticker: "000270", name: "기아", aliases: ["Kia"] },
  { market: "KR", ticker: "373220", name: "LG에너지솔루션", aliases: ["LG엔솔", "LG Energy Solution"] },
  { market: "KR", ticker: "051910", name: "LG화학", aliases: ["LG Chem"] },
  { market: "KR", ticker: "006400", name: "삼성SDI", aliases: ["Samsung SDI"] },
  { market: "KR", ticker: "005490", name: "POSCO홀딩스", aliases: ["포스코홀딩스", "POSCO Holdings"] },
  { market: "KR", ticker: "068270", name: "셀트리온", aliases: ["Celltrion"] },
  { market: "KR", ticker: "207940", name: "삼성바이오로직스", aliases: ["Samsung Biologics"] },
  { market: "KR", ticker: "105560", name: "KB금융", aliases: ["KB Financial"] },
  { market: "KR", ticker: "055550", name: "신한지주", aliases: ["신한금융", "Shinhan Financial"] },
  { market: "KR", ticker: "086790", name: "하나금융지주", aliases: ["하나금융"] },
  { market: "KR", ticker: "316140", name: "우리금융지주", aliases: ["우리금융"] },
  { market: "KR", ticker: "030200", name: "KT", aliases: ["케이티"] },
  { market: "KR", ticker: "017670", name: "SK텔레콤", aliases: ["SK Telecom"] },
  { market: "KR", ticker: "066570", name: "LG전자", aliases: ["LG Electronics"] },
  { market: "KR", ticker: "012330", name: "현대모비스", aliases: ["Hyundai Mobis"] },
  { market: "KR", ticker: "034020", name: "두산에너빌리티", aliases: ["Doosan Enerbility"] },
  { market: "KR", ticker: "012450", name: "한화에어로스페이스", aliases: ["Hanwha Aerospace"] },
  { market: "KR", ticker: "042660", name: "한화오션", aliases: ["Hanwha Ocean"] },
  { market: "KR", ticker: "329180", name: "HD현대중공업", aliases: ["현대중공업"] },
  { market: "KR", ticker: "009150", name: "삼성전기", aliases: ["Samsung Electro-Mechanics"] },
  { market: "KR", ticker: "032830", name: "삼성생명" },
  { market: "KR", ticker: "000810", name: "삼성화재" },
  { market: "KR", ticker: "016360", name: "삼성증권" },
  { market: "KR", ticker: "036570", name: "엔씨소프트", aliases: ["NCSoft"] },
  { market: "KR", ticker: "259960", name: "크래프톤", aliases: ["Krafton"] },
  { market: "KR", ticker: "251270", name: "넷마블", aliases: ["Netmarble"] },
  { market: "KR", ticker: "090430", name: "아모레퍼시픽", aliases: ["Amorepacific"] },
  { market: "KR", ticker: "010130", name: "고려아연", aliases: ["Korea Zinc"] },
  // 미국 주요 종목: 한국어 별칭으로도 검색 가능
  { market: "US", ticker: "AAPL", name: "Apple", aliases: ["애플"] },
  { market: "US", ticker: "NVDA", name: "NVIDIA", aliases: ["엔비디아", "엔비디아 코퍼레이션"] },
  { market: "US", ticker: "MSFT", name: "Microsoft", aliases: ["마이크로소프트"] },
  { market: "US", ticker: "TSLA", name: "Tesla", aliases: ["테슬라"] },
  { market: "US", ticker: "AMZN", name: "Amazon", aliases: ["아마존"] },
  { market: "US", ticker: "GOOGL", name: "Alphabet Class A", aliases: ["구글", "알파벳", "Google"] },
  { market: "US", ticker: "GOOG", name: "Alphabet Class C", aliases: ["구글 C", "알파벳 C"] },
  { market: "US", ticker: "META", name: "Meta Platforms", aliases: ["메타", "페이스북"] },
  { market: "US", ticker: "AMD", name: "Advanced Micro Devices", aliases: ["AMD", "에이엠디"] },
  { market: "US", ticker: "AVGO", name: "Broadcom", aliases: ["브로드컴"] },
  { market: "US", ticker: "NFLX", name: "Netflix", aliases: ["넷플릭스"] },
  { market: "US", ticker: "INTC", name: "Intel", aliases: ["인텔"] },
  { market: "US", ticker: "PLTR", name: "Palantir Technologies", aliases: ["팔란티어"] },
  { market: "US", ticker: "COIN", name: "Coinbase", aliases: ["코인베이스"] },
  { market: "US", ticker: "ORCL", name: "Oracle", aliases: ["오라클"] },
  { market: "US", ticker: "CRM", name: "Salesforce", aliases: ["세일즈포스"] },
  { market: "US", ticker: "UBER", name: "Uber Technologies", aliases: ["우버"] },
  { market: "US", ticker: "DIS", name: "Walt Disney", aliases: ["디즈니"] },
  { market: "US", ticker: "JPM", name: "JPMorgan Chase", aliases: ["JP모건", "제이피모건"] },
  { market: "US", ticker: "V", name: "Visa", aliases: ["비자"] },
  { market: "US", ticker: "MA", name: "Mastercard", aliases: ["마스터카드"] },
  { market: "US", ticker: "WMT", name: "Walmart", aliases: ["월마트"] },
  { market: "US", ticker: "COST", name: "Costco Wholesale", aliases: ["코스트코"] },
  { market: "US", ticker: "KO", name: "Coca-Cola", aliases: ["코카콜라"] },
  { market: "US", ticker: "MCD", name: "McDonald's", aliases: ["맥도날드"] },
  { market: "US", ticker: "NKE", name: "Nike", aliases: ["나이키"] },
  { market: "US", ticker: "BA", name: "Boeing", aliases: ["보잉"] },
  { market: "US", ticker: "PFE", name: "Pfizer", aliases: ["화이자"] },
  { market: "US", ticker: "QCOM", name: "Qualcomm", aliases: ["퀄컴"] },
  { market: "US", ticker: "MU", name: "Micron Technology", aliases: ["마이크론"] },
  { market: "US", ticker: "TSM", name: "Taiwan Semiconductor ADR", aliases: ["TSMC", "대만반도체"] },
  { market: "US", ticker: "ASML", name: "ASML Holding", aliases: ["ASML"] },
  { market: "US", ticker: "ARM", name: "Arm Holdings", aliases: ["ARM", "암"] },
];

/** 대소문자/공백/구분기호 차이를 무시해 검색합니다. */
export function normalizeStockSearch(input: string): string {
  return input.normalize("NFKC").toLocaleLowerCase().replace(/[\s.()\-_/]/g, "");
}

export function findCatalogStock(market: Market, ticker: string): StockOption | undefined {
  const normalized = normalizeStockSearch(ticker);
  return STOCK_CATALOG.find((stock) => stock.market === market && normalizeStockSearch(stock.ticker) === normalized);
}

export function searchCatalog(market: Market, query: string, limit = 8): StockOption[] {
  const normalized = normalizeStockSearch(query);
  const candidates = STOCK_CATALOG.filter((stock) => stock.market === market);
  if (!normalized) return candidates.slice(0, limit);

  return candidates.map((stock, index) => {
    const ticker = normalizeStockSearch(stock.ticker);
    const names = [stock.name, ...(stock.aliases ?? [])].map(normalizeStockSearch);
    let score = Number.POSITIVE_INFINITY;
    if (ticker === normalized || names.some((name) => name === normalized)) score = 0;
    else if (ticker.startsWith(normalized)) score = 1;
    else if (names.some((name) => name.startsWith(normalized))) score = 2;
    else if (names.some((name) => name.includes(normalized)) || ticker.includes(normalized)) score = 3;
    return { stock, index, score };
  }).filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.stock);
}
