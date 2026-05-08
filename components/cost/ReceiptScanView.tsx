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
 * 사이클 JJ: CaptureStep·ResultStep 별도 파일 추출 (CC/DD/HH 답습).
 */

import Link from "next/link";
import { useState } from "react";
import type { ParsedReceipt } from "@/lib/services/receipt-ocr";
import { ReceiptCaptureStep } from "./ReceiptCaptureStep";
import { ReceiptResultStep } from "./ReceiptResultStep";

interface Props {
  tripId: string;
  /** 서버에서 Vision API 키 존재 여부 전달. false면 데모 안내만 표시. */
  scanAvailable?: boolean;
}

type Step = "capture" | "result";

export function ReceiptScanView({ tripId, scanAvailable = true }: Props) {
  const [step, setStep] = useState<Step>("capture");
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!scanAvailable) {
    return <DemoFallback tripId={tripId} />;
  }

  if (step === "result" && receipt) {
    return (
      <ReceiptResultStep
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
    <ReceiptCaptureStep
      tripId={tripId}
      onResult={(r, preview) => {
        setReceipt(r);
        setPreviewUrl(preview);
        setStep("result");
      }}
    />
  );
}

// ── DemoFallback — API 키 미설정 시 안내 ────────────────────────
function DemoFallback({ tripId }: { tripId: string }) {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="sticky top-0 z-10 bg-surface border-b border-divider px-td-md py-td-sm flex items-center gap-td-sm">
        <Link
          href={`/cost/${tripId}`}
          className="material-symbols-outlined text-td-title text-ink-soft"
          aria-label="뒤로"
        >
          arrow_back
        </Link>
        <h1 className="text-td-body font-semibold text-ink">영수증 스캔</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-td-md gap-td-md text-center">
        <span
          className="material-symbols-outlined text-5xl text-ink-mute"
          aria-hidden
        >
          document_scanner
        </span>

        <div className="space-y-td-xs">
          <p className="text-td-body font-semibold text-ink">
            데모 모드에서는 스캔을 사용할 수 없어요
          </p>
          <p className="text-td-meta text-ink-soft max-w-xs mx-auto">
            영수증 스캔은 Google Vision API + Claude AI 연동이 필요합니다.
            비용은 직접 입력으로 등록할 수 있어요.
          </p>
        </div>

        <Link
          href={`/cost/${tripId}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent text-white font-semibold px-6 py-td-sm transition-colors hover:bg-accent-deep"
        >
          <span className="material-symbols-outlined text-td-icon" aria-hidden>
            edit_note
          </span>
          직접 비용 입력하기
        </Link>
      </main>
    </div>
  );
}
