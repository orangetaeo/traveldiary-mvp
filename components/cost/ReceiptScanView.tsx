"use client";

/**
 * ReceiptScanView — 영수증 OCR 스캔 + 결과 확인 + 비용 등록.
 *
 * 3단계 흐름:
 *   1. capture: 갤러리/카메라로 이미지 선택
 *   2. result: OCR 파싱 결과 확인 + 편집
 *   3. (비용 등록 → /cost/[tripId]로 이동)
 *
 * M4 TranslateView.tsx 패턴 답습.
 */

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { scanReceiptAction } from "@/actions/receipt";
import { addCost } from "@/actions/cost";
import type { ParsedReceipt } from "@/lib/services/receipt-ocr";
import {
  COST_CATEGORY_OPTIONS,
  COST_CATEGORY_LABEL,
} from "@/lib/utils/cost-constants";

// ── 환율 맵 (시드 기반 대략치) ──────────────────────────────────
const CURRENCY_TO_KRW: Record<string, number> = {
  VND: 1 / 18,    // 1 VND ≈ 0.056 KRW
  THB: 40,        // 1 THB ≈ 40 KRW
  JPY: 9,         // 1 JPY ≈ 9 KRW
  USD: 1350,      // 1 USD ≈ 1350 KRW
  KRW: 1,
};

function toKrw(amount: number, currency: string): number {
  const rate = CURRENCY_TO_KRW[currency] ?? 1;
  return Math.round(amount * rate);
}

const CURRENCY_SYMBOL: Record<string, string> = {
  VND: "₫",
  THB: "฿",
  JPY: "¥",
  USD: "$",
  KRW: "₩",
};

interface Props {
  tripId: string;
}

type Step = "capture" | "result";

export function ReceiptScanView({ tripId }: Props) {
  const [step, setStep] = useState<Step>("capture");
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (step === "result" && receipt) {
    return (
      <ResultStep
        tripId={tripId}
        receipt={receipt}
        previewUrl={previewUrl}
        onRetake={() => {
          setStep("capture");
          setReceipt(null);
          setPreviewUrl(null);
        }}
      />
    );
  }

  return (
    <CaptureStep
      tripId={tripId}
      onResult={(r, preview) => {
        setReceipt(r);
        setPreviewUrl(preview);
        setStep("result");
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// Step 1: Capture (카메라/갤러리 선택)
// ═══════════════════════════════════════════════════════════

function CaptureStep({
  tripId,
  onResult,
}: {
  tripId: string;
  onResult: (receipt: ParsedReceipt, previewUrl: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function processFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지가 너무 큽니다 (10MB 이내).");
      return;
    }
    setError(null);
    setStatusMsg("영수증 인식 중...");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      if (!base64) {
        setError("이미지를 읽지 못했어요.");
        setStatusMsg(null);
        return;
      }

      startTransition(async () => {
        const result = await scanReceiptAction({ imageBase64: base64, tripId });

        if (result.mode === "demo") {
          setError("API 키 미설정 — 데모 모드입니다. 비용을 직접 입력해주세요.");
          setStatusMsg(null);
        } else if (result.mode === "ok") {
          setStatusMsg(null);
          onResult(result.receipt, dataUrl);
        } else if (result.mode === "no_text") {
          setError("영수증에서 텍스트를 찾지 못했어요. 더 선명한 사진으로 다시 시도해주세요.");
          setStatusMsg(null);
        } else {
          setError(`인식 실패: ${result.stage} — ${result.code}${result.message ? ` (${result.message})` : ""}`);
          setStatusMsg(null);
        }
      });
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  return (
    <div className="min-h-screen bg-ink text-white pb-24">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-td-md h-14 bg-black/40 backdrop-blur-md border-b border-white/10">
        <Link
          href={`/cost/${tripId}`}
          aria-label="닫기"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </Link>
        <h1 className="text-td-card-title font-semibold tracking-tight text-white">
          영수증 스캔
        </h1>
        <div className="w-10" />
      </header>

      {/* Viewfinder */}
      <section className="relative h-[420px] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-purple-deep via-ink to-black py-td-lg">
        <div className="relative z-10 mt-td-md bg-accent text-white text-td-meta font-bold px-td-md py-td-xxs rounded-full shadow-lg">
          영수증을 사각형 안에 맞춰주세요
        </div>

        <div className="relative z-10 w-full max-w-[280px] aspect-[3/4] border-2 border-dashed border-white/40 rounded-md">
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-md" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-md" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-md" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-md" />
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-soft to-transparent opacity-70" />
        </div>

        <p className="relative z-10 text-center text-white/90 text-td-body font-medium drop-shadow-md px-td-md">
          가게명/금액/날짜/카테고리를 자동으로 추출해요
        </p>
      </section>

      {/* 카메라 컨트롤 */}
      <section
        aria-label="카메라 컨트롤"
        className="relative bg-ink py-td-md px-td-md flex items-center justify-around max-w-md mx-auto"
      >
        {/* 카메라 촬영 (capture) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => cameraInputRef.current?.click()}
          aria-label="카메라로 촬영"
          className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-white">photo_camera</span>
        </button>

        {/* 갤러리 선택 (메인 버튼) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          aria-label="갤러리에서 선택"
          className="relative w-20 h-20 rounded-full flex items-center justify-center ring-4 ring-white/30 hover:ring-white/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="w-[72px] h-[72px] bg-white rounded-full border-2 border-ink flex items-center justify-center">
            <span className="material-symbols-outlined text-ink text-3xl">
              {isPending ? "hourglass_top" : "add_photo_alternate"}
            </span>
          </span>
        </button>

        <div className="w-12 h-12" />
      </section>

      {/* 상태 메시지 / 에러 */}
      <main className="bg-surface-soft text-ink rounded-t-lg -mt-td-xs relative">
        <div className="max-w-md mx-auto px-td-md py-td-lg">
          {statusMsg && (
            <div className="flex items-center gap-td-xs bg-purple-soft border border-purple/30 rounded-md p-td-sm mb-td-md">
              <div className="w-5 h-5 border-2 border-purple/30 border-t-purple rounded-full animate-spin shrink-0" />
              <p className="text-td-body text-purple-deep font-medium">{statusMsg}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-td-xs bg-danger-soft border border-danger/30 rounded-md p-td-sm mb-td-md">
              <span className="material-symbols-outlined text-danger text-lg shrink-0 mt-0.5" aria-hidden>error</span>
              <p className="text-td-body text-danger-deep">{error}</p>
            </div>
          )}

          <div className="text-center mb-td-md">
            <h2 className="text-td-title text-ink mb-td-xxs">영수증을 찍으면 자동 입력</h2>
            <p className="text-td-body text-ink-soft">통화·금액·항목을 AI가 읽어드려요</p>
          </div>

          {/* 3대 핵심 기능 */}
          <div className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md space-y-td-xs">
            <Feature icon="currency_exchange" title="VND → KRW 자동 환산" desc="당일 환율 적용해 계산합니다" />
            <Feature icon="category" title="카테고리 자동 분류" desc="식비, 관광 등 항목을 자동 지정합니다" />
            <Feature icon="lock" title="사진은 기기 안에서만 처리" desc="서버에 저장하지 않아 안전합니다" />
          </div>

          <Link
            href={`/cost/${tripId}`}
            className="block w-full rounded-md bg-surface-card border border-divider text-ink-soft font-medium py-td-sm text-center hover:bg-surface-soft transition-colors"
          >
            직접 비용 입력하기
          </Link>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-td-sm">
      <span className="material-symbols-outlined text-purple text-xl shrink-0 mt-0.5" aria-hidden>{icon}</span>
      <div>
        <p className="text-td-body font-bold text-ink">{title}</p>
        <p className="text-td-caption text-ink-soft">{desc}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Step 2: Result (파싱 결과 확인 + 편집 + 등록)
// ═══════════════════════════════════════════════════════════

function ResultStep({
  tripId,
  receipt,
  previewUrl,
  onRetake,
}: {
  tripId: string;
  receipt: ParsedReceipt;
  previewUrl: string | null;
  onRetake: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 편집 가능 필드
  const [vendor, setVendor] = useState(receipt.vendor);
  const [total, setTotal] = useState(receipt.total);
  const [currency, setCurrency] = useState(receipt.currency);
  const [category, setCategory] = useState<string>(receipt.category);
  const [date, setDate] = useState(
    receipt.date || new Date().toISOString().slice(0, 10),
  );

  const krwAmount = toKrw(total, currency);
  const sym = CURRENCY_SYMBOL[currency] ?? currency;

  function handleSave() {
    startTransition(async () => {
      const result = await addCost({
        tripId,
        date,
        label: vendor,
        amountKrw: krwAmount,
        amountLocal:
          currency !== "KRW"
            ? { value: total, currency }
            : undefined,
        status: "paid",
        category,
      });

      if (result.ok) {
        router.push(`/cost/${tripId}`);
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface-soft text-ink pb-24">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-td-md h-14 bg-surface-card/90 backdrop-blur-md border-b border-divider">
        <button
          type="button"
          onClick={onRetake}
          aria-label="다시 촬영"
          className="p-2 rounded-full hover:bg-surface-soft transition-colors"
        >
          <span className="material-symbols-outlined text-ink">arrow_back</span>
        </button>
        <h1 className="text-td-card-title font-semibold tracking-tight text-ink">
          인식 결과
        </h1>
        <div className="w-10" />
      </header>

      <main className="max-w-md mx-auto px-td-md py-td-lg">
        {/* 성공 배지 */}
        <div className="flex items-center gap-td-xs bg-success-soft border border-success/30 rounded-md p-td-sm mb-td-md">
          <span className="material-symbols-outlined text-success-deep text-lg" aria-hidden>check_circle</span>
          <p className="text-td-body text-success-deep font-medium">영수증 인식 완료</p>
        </div>

        {/* 미리보기 이미지 */}
        {previewUrl && (
          <div className="mb-td-md rounded-md overflow-hidden border border-divider">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="영수증 미리보기"
              className="w-full max-h-48 object-contain bg-surface-card"
            />
          </div>
        )}

        {/* 금액 요약 카드 */}
        <div className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md text-center">
          <p className="text-td-caption text-ink-soft mb-1">인식된 총액</p>
          <p className="text-3xl font-bold text-purple-deep">
            {sym} {total.toLocaleString()}
          </p>
          {currency !== "KRW" && (
            <p className="text-td-body text-ink-soft mt-1">
              ≈ ₩{krwAmount.toLocaleString()} KRW
            </p>
          )}
        </div>

        {/* 상세 항목 */}
        {receipt.items.length > 0 && (
          <div className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md">
            <h3 className="text-td-meta text-ink-soft font-bold uppercase tracking-wider mb-td-xs">
              인식된 항목
            </h3>
            <ul className="space-y-td-xs">
              {receipt.items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center border-b border-divider last:border-b-0 pb-td-xxs last:pb-0"
                >
                  <span className="text-td-body text-ink">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-ink-mute"> x{item.quantity}</span>
                    )}
                  </span>
                  <span className="text-td-body font-medium text-ink tabular-nums">
                    {sym} {item.price.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 편집 폼 */}
        <div className="bg-surface-card rounded-md border border-divider p-td-md mb-td-md space-y-td-sm">
          <h3 className="text-td-meta text-ink-soft font-bold uppercase tracking-wider">
            정보 확인 · 수정
          </h3>

          {/* 가게명 */}
          <label className="block">
            <span className="text-td-caption text-ink-soft">가게명</span>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              maxLength={50}
              className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
            />
          </label>

          {/* 총액 + 통화 */}
          <div className="flex gap-td-xs">
            <label className="flex-1 block">
              <span className="text-td-caption text-ink-soft">총액</span>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value) || 0)}
                min={0}
                className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40 tabular-nums"
              />
            </label>
            <label className="w-24 block">
              <span className="text-td-caption text-ink-soft">통화</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              >
                <option value="VND">VND</option>
                <option value="THB">THB</option>
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
                <option value="KRW">KRW</option>
              </select>
            </label>
          </div>

          {/* 날짜 */}
          <label className="block">
            <span className="text-td-caption text-ink-soft">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
            />
          </label>

          {/* 카테고리 */}
          <label className="block">
            <span className="text-td-caption text-ink-soft">카테고리</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-divider bg-surface-soft px-td-sm py-2 text-td-body text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
            >
              {COST_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* KRW 환산 표시 */}
          {currency !== "KRW" && (
            <p className="text-td-caption text-ink-mute">
              ≈ ₩{toKrw(total, currency).toLocaleString()} KRW ({COST_CATEGORY_LABEL[category] ?? category})
            </p>
          )}
        </div>

        {/* CTA 버튼 */}
        <button
          type="button"
          disabled={isPending || !vendor || total <= 0}
          onClick={handleSave}
          className="w-full rounded-md bg-purple text-white font-bold py-td-sm text-center hover:bg-purple-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-td-sm"
        >
          {isPending ? "저장 중..." : "비용 등록하기"}
        </button>

        <button
          type="button"
          onClick={onRetake}
          className="w-full rounded-md bg-surface-card border border-divider text-ink-soft font-medium py-td-sm text-center hover:bg-surface-soft transition-colors"
        >
          다시 촬영하기
        </button>
      </main>
    </div>
  );
}
