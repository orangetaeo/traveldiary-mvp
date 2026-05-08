/**
 * 영수증 스캔 페이지 — Claude Vision 멀티모달 → 비용 자동 등록.
 *
 * 파이프라인: 이미지 선택 → Claude Vision (OCR + 파싱 통합)
 * → 결과 확인/편집 → addCost() 서버 액션으로 비용 등록.
 *
 * API 키 미설정 시 데모 fallback (직접 입력 안내).
 */

import type { Metadata } from "next";
import { ReceiptScanView } from "@/components/cost/ReceiptScanView";
import { scanAvailable } from "@/lib/services/receipt-ocr";

export const metadata: Metadata = {
  title: "영수증 스캔 — TRAVELDIARY",
  description: "영수증을 찍으면 통화·금액·항목을 AI가 자동 입력합니다.",
};

export default function CostScanPage({
  params,
}: {
  params: { tripId: string };
}) {
  return <ReceiptScanView tripId={params.tripId} scanAvailable={scanAvailable()} />;
}
