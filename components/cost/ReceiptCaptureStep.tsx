"use client";

/**
 * ReceiptCaptureStep — 영수증 촬영/갤러리 선택 단계.
 *
 * ReceiptScanView에서 추출 (사이클 JJ).
 */

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { scanReceiptAction } from "@/actions/receipt";
import type { ParsedReceipt } from "@/lib/services/receipt-ocr";

interface Props {
  tripId: string;
  onResult: (receipt: ParsedReceipt, previewUrl: string | null) => void;
}

export function ReceiptCaptureStep({ tripId, onResult }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function processFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      setError("이미지가 너무 큽니다 (20MB 이내).");
      return;
    }
    setError(null);
    setStatusMsg("이미지 처리 중...");

    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 1600;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("이미지를 처리할 수 없어요.");
        setStatusMsg(null);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const base64 = resizedDataUrl.split(",")[1] ?? "";
      if (!base64) {
        setError("이미지를 읽지 못했어요.");
        setStatusMsg(null);
        return;
      }

      setStatusMsg("영수증 인식 중...");
      startTransition(async () => {
        try {
          const result = await scanReceiptAction({ imageBase64: base64, tripId });

          if (result.mode === "demo") {
            setError("API 키 미설정 — 데모 모드입니다. 아래 '직접 비용 입력하기'를 이용해주세요.");
            setStatusMsg(null);
          } else if (result.mode === "ok") {
            setStatusMsg(null);
            onResult(result.receipt, resizedDataUrl);
          } else if (result.mode === "no_text") {
            setError("영수증에서 텍스트를 찾지 못했어요. 더 선명한 사진으로 다시 시도해주세요.");
            setStatusMsg(null);
          } else {
            setError(`인식 실패: ${result.stage} — ${result.code}${result.message ? ` (${result.message})` : ""}`);
            setStatusMsg(null);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          setError(`영수증 스캔 중 오류가 발생했어요.${msg ? ` (${msg.slice(0, 100)})` : ""}`);
          setStatusMsg(null);
        }
      });
    };
    img.onerror = () => {
      setError("이미지를 열 수 없어요. 다른 사진으로 시도해주세요.");
      setStatusMsg(null);
    };
    img.src = URL.createObjectURL(file);
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
