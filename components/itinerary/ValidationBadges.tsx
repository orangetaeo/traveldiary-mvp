/**
 * Validation Badges — 사이클 D (ADR-029 UI 통합).
 *
 * validateItemAction의 ValidateItemResult를 일정 상세 페이지에 노출.
 * - booking 뱃지 (3·required: true/false)
 * - price 뱃지 (5·status 7종)
 *
 * 정책 (T17 디자인 합의):
 * - no_estimate / no_offers는 숨김 (다른 섹션이 처리, 노이즈 방지)
 * - required:false는 meta 톤 (위계 낮음)
 * - 데모 모드/forbidden/not_found는 명시적 노출
 *
 * 디자인 토큰만 사용 (하드코딩 hex 금지).
 */

import type { ValidateItemResult } from "@/actions/place";

type ValidateOk = Extract<ValidateItemResult, { mode: "ok" }>;
type BookingResult = ValidateOk["booking"];
type PriceResult = ValidateOk["price"];

export interface ValidationBadgesProps {
  result: ValidateItemResult;
}

export function ValidationBadges({ result }: ValidationBadgesProps) {
  if (result.mode === "forbidden") {
    return (
      <div
        role="status"
        aria-label="검증 권한 없음"
        className="flex items-center gap-td-xs p-td-sm bg-surface-soft border border-divider rounded-xl"
      >
        <span className="material-symbols-outlined text-ink-mute" aria-hidden>
          lock
        </span>
        <span className="text-td-meta text-ink-soft">
          이 일정의 검증 권한이 없어요.
        </span>
      </div>
    );
  }

  if (result.mode === "not_found") {
    return null; // 일정 자체가 없음 — 페이지 상위에서 notFound() 처리됨, 안전 fallback
  }

  // mode: "ok"
  return (
    <>
      <BookingBadge booking={result.booking} />
      <PriceBadge price={result.price} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Booking 뱃지 (사이클 L · 3단계)
// ═══════════════════════════════════════════════════════════════════

function BookingBadge({ booking }: { booking: BookingResult }) {
  if (booking.required) {
    return (
      <div
        role="status"
        aria-label="예약 정보: 권장"
        className="flex items-start gap-td-xs p-td-sm bg-amber-soft border border-amber-soft rounded-xl"
      >
        <span
          className="material-symbols-outlined filled text-amber-deep"
          aria-hidden
        >
          event_available
        </span>
        <div className="flex flex-col">
          <span className="text-td-body text-amber-deep font-semibold">예약 권장</span>
          <span className="text-td-caption text-amber-deep/80">{booking.reason}</span>
        </div>
      </div>
    );
  }

  // required: false — meta 톤 (T17: 위계 낮춤, 워크인 가능 안심 정보)
  return (
    <div
      role="status"
      aria-label="예약 정보: 워크인 가능"
      className="flex items-start gap-td-xs p-td-sm bg-surface-soft border border-divider rounded-xl"
    >
      <span className="material-symbols-outlined text-ink-mute" aria-hidden>
        lock_open
      </span>
      <div className="flex flex-col">
        <span className="text-td-meta text-ink-soft font-medium">워크인 가능</span>
        <span className="text-td-caption text-ink-mute">{booking.reason}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Price 뱃지 (사이클 N · 5단계)
// ═══════════════════════════════════════════════════════════════════

function PriceBadge({ price }: { price: PriceResult }) {
  // 정보 가치 0인 status는 숨김 (T17 합의)
  // - no_estimate: '비용 수준' 그리드가 이미 무료 표시
  // - no_offers: 'OTA 가격 비교' 섹션이 부재로 자동 처리
  if (price.status === "no_estimate" || price.status === "no_offers") {
    return null;
  }

  if (price.status === "verified") {
    const deltaText = price.deltaPct !== null
      ? ` (±${Math.abs(price.deltaPct).toFixed(1)}%)`
      : "";
    return (
      <div
        role="status"
        aria-label={`가격 검증: 일치${deltaText}`}
        className="flex items-start gap-td-xs p-td-sm bg-success-soft border border-success-soft rounded-xl"
      >
        <span
          className="material-symbols-outlined filled text-success-deep"
          aria-hidden
        >
          paid
        </span>
        <div className="flex flex-col">
          <span className="text-td-body text-success-deep font-semibold">
            가격 검증 완료
          </span>
          <span className="text-td-caption text-success-deep/80">{price.reason}</span>
        </div>
      </div>
    );
  }

  if (price.status === "warn") {
    return (
      <div
        role="status"
        aria-label="가격 정보: 변동 가능"
        className="flex items-start gap-td-xs p-td-sm bg-amber-soft border border-amber-soft rounded-xl"
      >
        <span
          className="material-symbols-outlined filled text-amber-deep"
          aria-hidden
        >
          trending_up
        </span>
        <div className="flex flex-col">
          <span className="text-td-body text-amber-deep font-semibold">
            가격 변동 가능
          </span>
          <span className="text-td-caption text-amber-deep/80">{price.reason}</span>
        </div>
      </div>
    );
  }

  if (price.status === "mismatch") {
    return (
      <div
        role="status"
        aria-label="가격 정보: 불일치"
        className="flex items-start gap-td-xs p-td-sm bg-danger-soft border border-danger-soft rounded-xl border-l-4"
      >
        <span
          className="material-symbols-outlined filled text-danger"
          aria-hidden
        >
          price_change
        </span>
        <div className="flex flex-col">
          <span className="text-td-body text-danger-deep font-semibold">
            가격 불일치 — 재확인 필요
          </span>
          <span className="text-td-caption text-danger-deep/80">{price.reason}</span>
        </div>
      </div>
    );
  }

  if (price.status === "single_source") {
    return (
      <div
        role="status"
        aria-label="가격 정보: 단일 출처"
        className="flex items-start gap-td-xs p-td-sm bg-surface-soft border border-divider rounded-xl"
      >
        <span className="material-symbols-outlined text-ink-mute" aria-hidden>
          info
        </span>
        <div className="flex flex-col">
          <span className="text-td-meta text-ink-soft font-medium">
            단일 출처 — 참고용
          </span>
          <span className="text-td-caption text-ink-mute">{price.reason}</span>
        </div>
      </div>
    );
  }

  if (price.status === "currency_mismatch") {
    return (
      <div
        role="status"
        aria-label="가격 정보: 통화 비교 불가"
        className="flex items-start gap-td-xs p-td-sm bg-amber-soft border border-amber-soft rounded-xl"
      >
        <span
          className="material-symbols-outlined text-amber-deep"
          aria-hidden
        >
          currency_exchange
        </span>
        <div className="flex flex-col">
          <span className="text-td-body text-amber-deep font-semibold">
            통화 비교 불가
          </span>
          <span className="text-td-caption text-amber-deep/80">{price.reason}</span>
        </div>
      </div>
    );
  }

  return null;
}
