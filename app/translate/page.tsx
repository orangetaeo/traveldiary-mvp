import { TranslateView } from "@/components/translate/TranslateView";

/**
 * 카메라 번역 (M4) — `/translate?trip=<id>`
 *
 * ADR-015: 사이클 4는 정적 베트남어 메뉴 시드로 시연.
 * 사이클 5에서 사진 업로드 + Google Vision + Claude API + writeAuditLog.
 */
export default function TranslatePage({
  searchParams,
}: {
  searchParams: { trip?: string };
}) {
  return <TranslateView tripId={searchParams.trip} />;
}
