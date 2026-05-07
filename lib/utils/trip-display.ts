/**
 * Trip 카드/대시보드 표시용 헬퍼 — 사이클 ZZ+1 (/trips 카드 정보 구조 강화).
 *
 * 답습 — feedback_local_const_to_shared_lib_extraction:
 *   trips/[tripId]/page.tsx inline `formatStartDate` + KO_DAY_OF_WEEK + todayKstISO를
 *   /trips 카드 렌더러에서도 재사용해야 하므로 2번째 사용처 등장 → lib/utils로 추출.
 *
 * 순수 함수 — 외부 의존성 없음. dDay는 item-display에서 임포트하여 단일 출처 유지.
 */

import type { CompanionType, TripStatus } from "@/lib/types";
import { dDay } from "@/lib/utils/item-display";

const KO_DAY_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/** ISO date(yyyy-mm-dd) → "5월 12일 (월)" */
export function formatStartDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return iso;
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const dow = KO_DAY_OF_WEEK[d.getUTCDay()];
  return `${month}월 ${day}일 (${dow})`;
}

/** KST(+09:00) 기준 yyyy-mm-dd. 서버 timezone 영향 회피 (trips/[tripId] 답습). */
export function todayKstISO(): string {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().slice(0, 10);
}

const COMPANION_LABEL: Record<CompanionType, string> = {
  solo: "혼자",
  friends: "친구와",
  family: "가족과",
  group: "그룹",
};

export function formatCompanionLabel(c: CompanionType): string {
  return COMPANION_LABEL[c];
}

/** D-Day 뱃지 톤 — Tailwind 클래스 직접 노출 대신 의미 라벨로 추상화 */
export type DDayTone = "purple" | "amber" | "success" | "neutral";

export interface DDayBadge {
  tone: DDayTone;
  label: string;
  /** 정렬·우선순위 비교용 raw 값. status가 우선이면 d는 그대로 반영. */
  d: number;
}

/**
 * 출발일 + 박수 + 오늘 + (옵셔널) status로 D-Day 뱃지 계산.
 *
 * 우선순위:
 *   1) status === "completed" → "여행 완료" (neutral)
 *   2) d > 0 → "D-N" (purple)
 *   3) d === 0 → "출발 당일" (amber)
 *   4) -nights <= d < 0 → "여행 중 · D+|d|" (success)
 *   5) d < -nights → "여행 완료" (neutral) — status가 미갱신인 raw seed 방어
 */
export function getDDayBadge(
  startDate: string,
  nights: number,
  today: string,
  status?: TripStatus,
): DDayBadge {
  const d = dDay(startDate, today);
  if (status === "completed" || d < -nights) {
    return { tone: "neutral", label: "여행 완료", d };
  }
  if (d > 0) return { tone: "purple", label: `D-${d}`, d };
  if (d === 0) return { tone: "amber", label: "출발 당일", d };
  return { tone: "success", label: `여행 중 · D+${-d}`, d };
}

const D_DAY_TONE_CLASS: Record<DDayTone, string> = {
  purple: "bg-purple text-white",
  amber: "bg-amber-soft text-amber-deep",
  success: "bg-success-soft text-success-deep",
  neutral: "bg-surface-soft text-ink-mute",
};

/** D-Day 뱃지 톤별 Tailwind 클래스. purple만 진한 보라(강조), 나머지는 soft 톤. */
export function dDayToneClass(tone: DDayTone): string {
  return D_DAY_TONE_CLASS[tone];
}
