import type {Holding, Market} from "./stocks";

export type AllocationScope = "ALL" | Market;
export interface PortfolioTotals {
  costKrw: number | null;
  valueKrw: number | null;
  gainKrw: number | null;
  returnPercent: number | null;
  missingPrices: number;
  requiresFx: boolean;
}
export interface AllocationItem {
  id: string;
  name: string;
  market: Market;
  amount: number;
  weight: number;
}
export interface AllocationResult {
  items: AllocationItem[];
  sum: number | null;
  currency: "KRW" | "USD";
  basis: "valuation" | "cost";
  requiresFx: boolean;
}
export interface PerformanceRow {
  id: string;
  name: string;
  market: Market;
  ticker: string;
  profit: number | null;
  returnPercent: number | null;
}

const cost = (h:Holding) => h.quantity*h.buyPrice;
const valuation = (h:Holding) => h.currentPrice===null?null:h.quantity*h.currentPrice;
const convertToKrw = (amount:number, market:Market, usdKrw:number) => market==="KR"?amount:amount*usdKrw;
const isValidFx = (rate:number|null):rate is number => rate!==null&&Number.isFinite(rate)&&rate>0;

/** Current reference FX is applied to both USD buy cost and USD value.
 * This is a currency-neutral estimate: historical purchase FX, fees and taxes are excluded.
 */
export function portfolioTotals(holdings:Holding[], usdKrw:number|null):PortfolioTotals {
  const requiresFx = holdings.some(h=>h.market==="US") && !isValidFx(usdKrw);
  const missingPrices = holdings.filter(h=>valuation(h)===null).length;
  if (!holdings.length || requiresFx) return {costKrw:null,valueKrw:null,gainKrw:null,returnPercent:null,missingPrices,requiresFx};
  const rate = usdKrw ?? 1; // Only reached if US holdings have a valid rate, or if all are KR.
  const costKrw = holdings.reduce((sum,h)=>sum+convertToKrw(cost(h),h.market,rate),0);
  if (missingPrices) return {costKrw,valueKrw:null,gainKrw:null,returnPercent:null,missingPrices,requiresFx:false};
  const valueKrw = holdings.reduce((sum,h)=>sum+convertToKrw(valuation(h)!,h.market,rate),0);
  const gainKrw = valueKrw-costKrw;
  return {costKrw,valueKrw,gainKrw,returnPercent:costKrw>0?gainKrw/costKrw*100:null,missingPrices:0,requiresFx:false};
}

/** Allocation always uses ONE common basis: valuations only if ALL selected holdings have a price.
 * Otherwise it falls back to buy costs, never a mixture of costs and valuations.
 */
export function portfolioAllocation(holdings:Holding[], scope:AllocationScope, usdKrw:number|null):AllocationResult {
  const selected = holdings.filter(h=>scope==="ALL"||h.market===scope);
  const currency = scope==="US"?"USD":"KRW";
  const requiresFx = scope==="ALL"&&selected.some(h=>h.market==="US")&&!isValidFx(usdKrw);
  const basis = selected.length&&selected.every(h=>valuation(h)!==null)?"valuation":"cost";
  if (!selected.length||requiresFx) return {items:[],sum:null,currency,basis,requiresFx};
  const rate = usdKrw ?? 1;
  const amounts = selected.map(h=>{
    const amount = basis==="valuation"?valuation(h)!:cost(h);
    return {h,amount:scope==="ALL"?convertToKrw(amount,h.market,rate):amount};
  });
  const sum = amounts.reduce((acc,x)=>acc+x.amount,0);
  if (!(sum>0)) return {items:[],sum:null,currency,basis,requiresFx:false};
  const items = amounts.map(({h,amount})=>({id:h.id,name:h.name,market:h.market,amount,weight:amount/sum*100})).sort((a,b)=>b.amount-a.amount);
  return {items,sum,currency,basis,requiresFx:false};
}

export function portfolioPerformance(holdings:Holding[]): PerformanceRow[] {
  return holdings.map((h)=>{
    const v = valuation(h);
    const profit = v===null?null:v-cost(h);
    return {id:h.id,name:h.name,market:h.market,ticker:h.ticker,profit,returnPercent:profit===null||cost(h)<=0?null:profit/cost(h)*100};
  }).sort((a,b)=> (b.returnPercent??-Infinity)-(a.returnPercent??-Infinity));
}
