"use client";

import Link from "next/link";
import {
  useCallback, useEffect, useRef, useState,
  type ChangeEvent, type DragEvent, type PointerEvent,
} from "react";
import {
  ArrowRight, CheckCircle2, ImagePlus, Info, LockKeyhole, ScanLine,
  ShieldCheck, Trash2, Undo2, UploadCloud, WandSparkles, X,
} from "lucide-react";
import { IconTile, PageHeading } from "@/components/common/ui";
import { useHoldings } from "@/context/holdings-context";
import {
  type ExtractedHolding, validateReviewHolding,
  visionResultSchema,
} from "@/lib/vision-extraction";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

type Redaction = { x: number; y: number; w: number; h: number };
type ReviewRow = ExtractedHolding & { rowId: string; selected: boolean };

export default function ImportPage() {
  const { add, holdings, mode, ready } = useHoldings();
  const picker = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const source = useRef<ImageBitmap | null>(null);
  const revision = useRef(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageName, setImageName] = useState("");
  const [redactions, setRedactions] = useState<Redaction[]>([]);
  const [draft, setDraft] = useState<Redaction | null>(null);
  const [dragging, setDragging] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [savingSelected, setSavingSelected] = useState(false);

  const releaseImage = useCallback(() => {
    revision.current += 1;
    source.current?.close();
    source.current = null;
    const output = canvas.current;
    if (output) { output.width = 0; output.height = 0; }
    setImageReady(false);
    setImageName("");
    setRedactions([]);
    setDraft(null);
    setAgreed(false);
  }, []);

  // Free browser-side ImageBitmap memory when leaving the page.
  useEffect(() => () => { source.current?.close(); source.current = null; }, []);

  const paint = useCallback((rects: Redaction[], active: Redaction | null = null) => {
    const target = canvas.current;
    const image = source.current;
    if (!target || !image || !target.width || !target.height) return;
    const ctx = target.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, target.width, target.height);
    ctx.drawImage(image, 0, 0, target.width, target.height);
    ctx.fillStyle = "#000";
    for (const r of [...rects, ...(active ? [active] : [])]) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }, []);

  useEffect(() => { paint(redactions, draft); }, [redactions, draft, imageReady, paint]);

  async function choose(next?: File) {
    setError("");
    setNotice("");
    setWarnings([]);
    setRows([]);
    if (!next) return;
    if (!ALLOWED.has(next.type)) { setError("PNG, JPG, WEBP 이미지만 지원해요."); return; }
    if (next.size === 0 || next.size > MAX_BYTES) { setError("8MB 이하 이미지를 선택해 주세요."); return; }

    releaseImage();
    const token = revision.current;
    try {
      const bitmap = await createImageBitmap(next);
      if (revision.current !== token) { bitmap.close(); return; }
      const target = canvas.current;
      if (!target) { bitmap.close(); return; }
      source.current = bitmap;
      const ratio = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
      target.width = Math.max(1, Math.round(bitmap.width * ratio));
      target.height = Math.max(1, Math.round(bitmap.height * ratio));
      setImageName(next.name);
      setImageReady(true);
      paint([]);
    } catch {
      releaseImage();
      setError("이미지를 열 수 없어요. 다른 스크린샷을 선택해 주세요.");
    }
  }

  function changed(event: ChangeEvent<HTMLInputElement>) {
    void choose(event.target.files?.[0]);
    event.target.value = "";
  }
  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void choose(event.dataTransfer.files[0]);
  }
  function toPoint(event: PointerEvent<HTMLCanvasElement>) {
    const el = event.currentTarget;
    const bounds = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(el.width, (event.clientX - bounds.left) * el.width / bounds.width)),
      y: Math.max(0, Math.min(el.height, (event.clientY - bounds.top) * el.height / bounds.height)),
    };
  }
  const begin = useRef<{ x: number; y: number } | null>(null);
  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (loading || !imageReady) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = toPoint(event);
    begin.current = point;
    setDraft({ ...point, w: 0, h: 0 });
  }
  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!begin.current || !imageReady) return;
    const p = toPoint(event);
    const s = begin.current;
    setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  }
  function pointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (!begin.current || !imageReady) return;
    const p = toPoint(event);
    const s = begin.current;
    const next = { x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) };
    if (next.w >= 6 && next.h >= 6) setRedactions((prev) => [...prev, next]);
    begin.current = null;
    setDraft(null);
  }

  async function extract() {
    const target = canvas.current;
    if (!target || !source.current || !agreed || loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      // Force completed black rectangles into the exported bitmap.
      paint(redactions);
      const jpeg = await new Promise<Blob | null>((resolve) => target.toBlob(resolve, "image/jpeg", 0.94));
      if (!jpeg || !jpeg.size || jpeg.size > MAX_BYTES) throw new Error("가린 이미지 크기가 8MB를 넘었어요. 이미지를 줄여 다시 선택해 주세요.");
      const form = new FormData();
      form.set("image", jpeg, "redacted-portfolio.jpg");
      const response = await fetch("/api/vision/extract", { method: "POST", body: form, cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error : "AI 분석에 실패했어요.";
        throw new Error(message);
      }
      const result = visionResultSchema.safeParse(body);
      if (!result.success) throw new Error("분석 결과를 검증할 수 없어요.");
      setRows(result.data.holdings.map((holding) => ({ ...holding, rowId: crypto.randomUUID(), selected: true })));
      setWarnings(result.data.warnings);
      if (!result.data.holdings.length) setNotice("읽어낸 보유 종목이 없어요. 더 선명한 이미지로 다시 시도하거나 직접 등록해 주세요.");
      // The original image and local bitmap are discarded after extraction.
      releaseImage();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI 분석에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  function editRow(id: string, key: keyof ExtractedHolding, value: string) {
    setRows((prev) => prev.map((row) => row.rowId !== id ? row : {
      ...row,
      [key]: key === "quantity" || key === "buy_price" ? Number(value) : value,
    }));
  }

  async function saveSelected() {
    if (savingSelected) return;
    const selected = rows.filter((row) => row.selected);
    if (!selected.length) { setError("저장할 종목을 선택해 주세요."); return; }
    const normalized = selected.map(validateReviewHolding);
    if (normalized.some((value) => value === null)) {
      setError("선택한 종목의 코드·이름·수량·평균 매수가를 확인해 주세요. 비어 있거나 잘못된 항목이 있어요.");
      return;
    }
    const repeated = normalized.find((value) => value && holdings.some((h) => h.market === value.market && h.ticker === value.ticker));
    if (repeated) {
      setError(`${repeated.name} (${repeated.ticker})은 이미 보유 종목에 등록돼 있어요. 중복 등록을 피하려면 해당 행을 선택 해제해 주세요.`);
      return;
    }
    const keys = new Set<string>();
    for (const value of normalized) {
      if (!value) continue;
      const key = `${value.market}:${value.ticker}`;
      if (keys.has(key)) { setError("같은 종목이 여러 번 선택되어 있어요. 중복 행을 해제해 주세요."); return; }
      keys.add(key);
    }
    const succeeded: string[] = [];
    setSavingSelected(true);
    try {
      for (let index = 0; index < selected.length; index++) {
        const value = normalized[index];
        if (value) {
          await add(value);
          succeeded.push(selected[index].rowId);
        }
      }
      setRows([]);
      setWarnings([]);
      setError("");
      setNotice(`${selected.length}개 종목을 내 주식에 등록했어요. 가격은 기존 시세 API에서 별도로 조회합니다.`);
    } catch (cause) {
      setRows((previous) => previous.filter((row) => !succeeded.includes(row.rowId)));
      setError(`${succeeded.length}개 저장 후 오류가 발생했어요. ${cause instanceof Error ? cause.message : "저장 실패"} 남은 종목만 다시 시도해 주세요.`);
    } finally { setSavingSelected(false); }
  }

  return <>
    <PageHeading eyebrow="AI STOCK IMPORT" title="캡처로 주식 등록" description="증권사 보유 종목 이미지를 가리고, AI로 읽은 뒤 직접 확인해 등록하세요." />
    <div className="mb-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
      <div className="panel p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
          <div><h2 className="text-[17px] font-bold">1. 이미지 선택 및 개인정보 가리기</h2><p className="mt-1 text-[12px] text-[#7D9391]">이미지 위를 드래그하면 검은색 마스킹 박스가 생겨요.</p></div>
          <span className="rounded-full bg-[#E8F7EF] px-3 py-1.5 text-[12px] font-semibold text-[#198369]">로컬 마스킹</span>
        </div>
        <input ref={picker} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={changed} aria-label="증권사 이미지 선택" />
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={(e) => { e.preventDefault(); setDragging(false); }} onDrop={drop} className={`rounded-[18px] border-2 border-dashed p-4 sm:p-5 ${dragging ? "border-[#43A58A] bg-[#E8F8F0]" : "border-[#D5E6DF] bg-[#F9FCFA]"}`}>
          {/* Keep canvas mounted even before file selection so createImageBitmap can draw into it. */}
          <canvas ref={canvas} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { begin.current = null; setDraft(null); }} aria-label="개인정보를 가릴 이미지. 마우스로 드래그해 검은 박스를 그려주세요" className={`${imageReady ? "block" : "hidden"} mx-auto max-h-[550px] w-auto max-w-full cursor-crosshair rounded-lg border border-[#D7E4DF] bg-white shadow-sm`} style={{ touchAction: "none" }} />
          {imageReady ? <div className="flex flex-col items-center gap-3">
            <p className="text-center text-[12px] font-medium text-[#5B786E]">실명 · 계좌번호 · 잔고 · 주문번호는 검은 박스로 가려주세요.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" disabled={!redactions.length || loading} className="secondary-btn" onClick={() => setRedactions((r) => r.slice(0, -1))}><Undo2 size={15}/> 마지막 가림 취소</button>
              <button type="button" disabled={loading} className="secondary-btn" onClick={() => picker.current?.click()}><ImagePlus size={15}/> 다른 이미지</button>
              <button type="button" disabled={loading} className="secondary-btn text-[#B35750]" onClick={releaseImage}><Trash2 size={15}/> 이미지 제거</button>
            </div>
          </div> : <div className="flex min-h-[270px] flex-col items-center justify-center px-4 py-5 text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-[20px] bg-[#E6F5EE] text-[#249575]"><UploadCloud size={28}/></div>
            <h3 className="text-[16px] font-bold text-[#35504A]">보유 주식 화면을 선택해 주세요</h3>
            <p className="mt-2 text-[12px] leading-[1.8] text-[#819894]">PNG, JPG, WEBP · 최대 8MB<br/>실제 계좌 대신 테스트용 캡처 사용을 권장해요.</p>
            <button type="button" className="primary-btn mt-5" onClick={() => picker.current?.click()}><ImagePlus size={16}/> 이미지 선택하기</button>
          </div>}
        </div>
        {imageName && <p className="mt-3 truncate text-[12px] text-[#7B9690]"><CheckCircle2 size={14} className="mr-1 inline"/>{imageName} · 마스킹 {redactions.length}개</p>}
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[14px] border border-[#D7E9E1] bg-[#F1FAF5] px-4 py-3 text-[#466C5F]">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-4 accent-[#137D64]" />
          <span className="text-[12px] leading-[1.8]">개인정보가 보이지 않도록 가린 것을 확인했고, 가려진 이미지가 <strong>외부 Google Gemini API로 전송</strong>되는 데 동의합니다.</span>
        </label>
        <button type="button" className="primary-btn mt-4 w-full" disabled={!imageReady || !agreed || loading} onClick={() => void extract()}>
          <WandSparkles size={17}/>{loading ? "AI가 종목을 읽는 중…" : "가린 이미지로 AI 분석 시작"}
        </button>
        <p className="mt-3 text-[11px] leading-[1.8] text-[#82938E]">원본 파일은 서버에 전송되지 않으며, 마스킹된 캔버스 이미지만 전송해요. 서버·DB에 이미지를 저장하지 않지만 Google 측 처리 및 보관 정책은 별도로 적용됩니다.</p>
      </div>

      <div className="space-y-5">
        <div className="panel p-6"><h2 className="text-[16px] font-bold">이렇게 진행돼요</h2><div className="mt-6 space-y-5">{[
          { icon: ImagePlus, title: "01. 캡처 선택", desc: "보유 종목이 잘 보이는 이미지를 골라요." },
          { icon: ShieldCheck, title: "02. 개인정보 가리기", desc: "계좌번호와 이름을 로컬에서 검게 가려요." },
          { icon: ScanLine, title: "03. AI 종목 추출", desc: "종목 코드, 수량, 평균 매수가를 읽어요." },
          { icon: CheckCircle2, title: "04. 수정 후 등록", desc: "AI 결과를 사람이 확인한 뒤에만 저장해요." },
        ].map((item) => <div key={item.title} className="flex gap-3"><IconTile icon={item.icon}/><div><p className="mt-1 text-[13px] font-bold text-[#3E5755]">{item.title}</p><p className="mt-1 text-[12px] leading-[1.7] text-[#9AA8AE]">{item.desc}</p></div></div>)}</div><div className="mt-6 border-t border-[#EBF0EE] pt-5"><Link href="/portfolio?add=1" className="secondary-btn w-full">직접 등록하기 <ArrowRight size={16}/></Link></div></div>
        <div className="rounded-[20px] border border-[#F3E2C1] bg-[#FFF9EC] p-5"><div className="mb-2 flex items-center gap-2 font-semibold text-[#936B35]"><LockKeyhole size={18}/> 민감정보 주의</div><p className="text-[12px] leading-[1.8] text-[#8C784F]">자동 개인정보 탐지는 아직 없어요. <strong>무료 Gemini API는 입력 데이터를 제품 개선에 사용할 수 있으므로</strong> 개인정보가 남아 있는 실제 계좌 캡처를 전송하지 마세요. 검은 가림 처리 후에도 신중히 확인해야 해요.</p><a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[12px] font-semibold text-[#87622F] underline">Google API 데이터 약관 보기</a></div>
      </div>
    </div>

    {(error || notice) && <div role="status" className={`mb-5 flex items-start gap-2 rounded-[13px] px-4 py-3 text-[13px] ${error ? "bg-[#FFF0EC] text-[#B85147]" : "bg-[#E9F8EE] text-[#26735A]"}`}>
      {error ? <X size={18} className="shrink-0"/> : <Info size={18} className="shrink-0"/>}{error || notice}
    </div>}

    {(rows.length > 0 || warnings.length > 0) && <section className="panel mb-8 p-5 sm:p-7" aria-label="AI 추출 결과 검토">
      <div className="mb-4"><h2 className="text-[18px] font-bold">2. AI 추출 결과 확인</h2><p className="mt-1 text-[12px] text-[#789088]">모든 항목을 확인하고 수정한 뒤 체크한 종목만 저장하세요. OCR 결과가 틀릴 수 있어요.</p></div>
      {warnings.length > 0 && <div className="mb-5 rounded-[12px] bg-[#FFF8E9] p-4 text-[12px] text-[#8C723D]">{warnings.map((w, i) => <p key={i} className="mb-1 last:mb-0">• {w}</p>)}</div>}
      {rows.length > 0 && <div className="table-wrap"><table className="eps-table min-w-[800px]"><thead><tr><th>선택</th><th>시장</th><th>종목명</th><th>종목 코드</th><th>보유 수량</th><th>평균 매수가</th></tr></thead><tbody>{rows.map((r) => <tr key={r.rowId}>
        <td><input type="checkbox" aria-label={`${r.stock_name} 저장 선택`} checked={r.selected} onChange={(e) => setRows((prev) => prev.map((v) => v.rowId === r.rowId ? { ...v, selected: e.target.checked } : v))} className="size-4 accent-[#167B63]" /></td>
        <td><select aria-label={`${r.stock_name} 시장`} className="input min-w-[86px]" value={r.market_type} onChange={(e) => editRow(r.rowId, "market_type", e.target.value)}><option value="KR">한국</option><option value="US">미국</option></select></td>
        <td><input aria-label="종목명" className="input min-w-[140px]" maxLength={100} value={r.stock_name} onChange={(e) => editRow(r.rowId, "stock_name", e.target.value)}/></td>
        <td><input aria-label="종목 코드" className="input min-w-[112px]" maxLength={30} value={r.ticker} onChange={(e) => editRow(r.rowId, "ticker", e.target.value)}/></td>
        <td><input aria-label="보유 수량" className="input w-[104px]" type="number" min={1} step={1} value={r.quantity} onChange={(e) => editRow(r.rowId, "quantity", e.target.value)}/></td>
        <td><div className="flex items-center gap-1"><input aria-label="평균 매수가" className="input w-[138px]" type="number" min={0.01} step="any" value={r.buy_price} onChange={(e) => editRow(r.rowId, "buy_price", e.target.value)}/><span className="text-[11px]">{r.market_type === "KR" ? "원" : "$"}</span></div></td>
      </tr>)}</tbody></table></div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[12px] text-[#78928A]">{mode === "cloud" ? "현재 저장 위치: 로그인한 Supabase 계정. 선택한 종목만 저장돼요." : "현재 저장 위치: 브라우저 로컬 저장소. 로그인하면 계정별로 저장돼요."}</p><button type="button" disabled={!ready || savingSelected || !rows.some((r) => r.selected)} className="primary-btn" onClick={() => void saveSelected()}><CheckCircle2 size={16}/> {savingSelected ? "등록 중..." : "선택 종목 등록하기"}</button></div>
    </section>}
  </>;
}
