/**
 * 응급 빠른 액세스 버튼 — 사이클 P (ADR-035).
 *
 * TravelHome / city 페이지 헤더 우상단에 배치.
 * 도시별 `/city/[slug]/emergency` 1탭 진입.
 */

import Link from "next/link";

interface EmergencyHeaderButtonProps {
  citySlug: string;
  /** 패닉 상황 시각적 강도 — false면 일반, true면 강조 (in-travel 모드 등) */
  emphasized?: boolean;
}

export function EmergencyHeaderButton({
  citySlug,
  emphasized = false,
}: EmergencyHeaderButtonProps) {
  return (
    <Link
      href={`/city/${citySlug}/emergency`}
      aria-label="응급 정보 빠른 보기"
      className={`inline-flex items-center gap-1 px-td-xs py-1 rounded-full text-td-caption font-bold transition-colors ${
        emphasized
          ? "bg-danger text-white hover:bg-danger-deep shadow-sm"
          : "bg-danger-soft text-danger-deep hover:bg-danger/15"
      }`}
    >
      <span
        className={`material-symbols-outlined text-[14px] ${emphasized ? "filled" : ""}`}
        aria-hidden
      >
        emergency
      </span>
      응급
    </Link>
  );
}
