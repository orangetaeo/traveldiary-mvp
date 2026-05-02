/**
 * Validation Badges — 사이클 D (ADR-029) + M (ADR-030) + E (ADR-031 리팩터링).
 *
 * validateItemAction의 ValidateItemResult를 일정 상세 페이지에 노출.
 * - booking 뱃지 (3·required: true/false)
 * - distance 뱃지 (4·status 6종)
 * - price 뱃지 (5·status 7종)
 *
 * 사이클 E (ADR-031): StatusBadge 공통 컴포넌트 추출 + mismatch 시각 강화.
 *
 * 정책 (T17 디자인 합의):
 * - no_estimate / no_offers / no_next / missing_location은 숨김 (노이즈 방지)
 * - required:false는 meta 톤 (위계 낮음)
 * - mismatch는 emphasized=true (border-l-4 + ring-2)
 * - 데모 모드/forbidden/not_found는 명시적 노출
 *
 * 디자인 토큰만 사용.
 */

import type { ValidateItemResult } from "@/actions/place";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";

type ValidateOk = Extract<ValidateItemResult, { mode: "ok" }>;
type BookingResult = ValidateOk["booking"];
type PriceResult = ValidateOk["price"];
type DistanceResult = ValidateOk["distance"];

export interface ValidationBadgesProps {
  result: ValidateItemResult;
}

export function ValidationBadges({ result }: ValidationBadgesProps) {
  if (result.mode === "forbidden") {
    return (
      <StatusBadge
        tone="meta"
        icon="lock"
        title="이 일정의 검증 권한이 없어요."
        ariaLabel="검증 권한 없음"
      />
    );
  }

  if (result.mode === "not_found") {
    return null; // 일정 자체가 없음 — 페이지 상위에서 notFound() 처리됨
  }

  return (
    <>
      <BookingBadge booking={result.booking} />
      <DistanceBadge distance={result.distance} />
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
      <StatusBadge
        tone="warn"
        icon="event_available"
        title="예약 권장"
        subtitle={booking.reason}
        ariaLabel="예약 정보: 권장"
      />
    );
  }

  return (
    <StatusBadge
      tone="meta"
      icon="lock_open"
      title="워크인 가능"
      subtitle={booking.reason}
      ariaLabel="예약 정보: 워크인 가능"
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// Distance 뱃지 (사이클 M · 4단계)
// ═══════════════════════════════════════════════════════════════════

function DistanceBadge({ distance }: { distance: DistanceResult }) {
  // no_next, missing_location: 숨김
  if (distance.status === "no_next" || distance.status === "missing_location") {
    return null;
  }

  const cfg = mapDistanceStatus(distance.status);
  if (!cfg) return null;

  return (
    <StatusBadge
      tone={cfg.tone}
      icon={cfg.icon}
      title={cfg.title}
      subtitle={distance.reason}
      emphasized={cfg.emphasized}
      ariaLabel={cfg.ariaLabel}
    />
  );
}

function mapDistanceStatus(
  status: DistanceResult["status"],
): { tone: BadgeTone; icon: string; title: string; emphasized: boolean; ariaLabel: string } | null {
  switch (status) {
    case "verified":
      return {
        tone: "success",
        icon: "directions",
        title: "이동 검증 완료",
        emphasized: false,
        ariaLabel: "이동 검증: 일치",
      };
    case "warn":
      return {
        tone: "warn",
        icon: "schedule",
        title: "이동시간 빠듯",
        emphasized: false,
        ariaLabel: "이동 정보: 빠듯",
      };
    case "mismatch":
      return {
        tone: "danger",
        icon: "running_with_errors",
        title: "이동시간 부족 — 일정 조정 필요",
        emphasized: true,
        ariaLabel: "이동 정보: 부족",
      };
    case "demo":
      return {
        tone: "meta",
        icon: "near_me",
        title: "이동시간 추정",
        emphasized: false,
        ariaLabel: "이동 정보: 추정",
      };
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Price 뱃지 (사이클 N · 5단계)
// ═══════════════════════════════════════════════════════════════════

function PriceBadge({ price }: { price: PriceResult }) {
  // 정보 가치 0인 status는 숨김 (T17 합의)
  if (price.status === "no_estimate" || price.status === "no_offers") {
    return null;
  }

  const cfg = mapPriceStatus(price);
  if (!cfg) return null;

  return (
    <StatusBadge
      tone={cfg.tone}
      icon={cfg.icon}
      title={cfg.title}
      subtitle={price.reason}
      emphasized={cfg.emphasized}
      ariaLabel={cfg.ariaLabel}
    />
  );
}

function mapPriceStatus(
  price: PriceResult,
): { tone: BadgeTone; icon: string; title: string; emphasized: boolean; ariaLabel: string } | null {
  switch (price.status) {
    case "verified": {
      const deltaText = price.deltaPct !== null
        ? ` (±${Math.abs(price.deltaPct).toFixed(1)}%)`
        : "";
      return {
        tone: "success",
        icon: "paid",
        title: "가격 검증 완료",
        emphasized: false,
        ariaLabel: `가격 검증: 일치${deltaText}`,
      };
    }
    case "warn":
      return {
        tone: "warn",
        icon: "trending_up",
        title: "가격 변동 가능",
        emphasized: false,
        ariaLabel: "가격 정보: 변동 가능",
      };
    case "mismatch":
      return {
        tone: "danger",
        icon: "price_change",
        title: "가격 불일치 — 재확인 필요",
        emphasized: true,
        ariaLabel: "가격 정보: 불일치",
      };
    case "single_source":
      return {
        tone: "meta",
        icon: "info",
        title: "단일 출처 — 참고용",
        emphasized: false,
        ariaLabel: "가격 정보: 단일 출처",
      };
    case "currency_mismatch":
      return {
        tone: "warn",
        icon: "currency_exchange",
        title: "통화 비교 불가",
        emphasized: false,
        ariaLabel: "가격 정보: 통화 비교 불가",
      };
    default:
      return null;
  }
}
