/**
 * 일정 상세 페이지 표시용 유틸리티.
 * 순수 함수 — 외부 의존성 없음.
 */

/** 한국어/영어 이름 분리 (예: "킹콩마트 (King Kong Mart)") */
export function splitName(name: string): { ko: string; en: string } {
  const m = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (m) return { ko: m[1].trim(), en: m[2].trim() };
  return { ko: name, en: "" };
}

/** ISO 시간 → "HH:MM" 포맷 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}

/** D-Day 계산 (양수: 출발 전, 0: 당일, 음수: 출발 후) */
export function dDay(startDate: string, today: string): number {
  const s = new Date(`${startDate}T00:00:00.000Z`);
  const t = new Date(`${today}T00:00:00.000Z`);
  return Math.ceil((s.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

/** 분 → "N시간 M분" 또는 "N분" */
export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

/** 금액 → 가격 수준 라벨 + dot 색상 */
export function priceLevelOf(amount: number | undefined): {
  label: string;
  dotClass: string;
} {
  if (!amount || amount === 0) return { label: "무료", dotClass: "bg-success" };
  if (amount < 200000) return { label: "낮음", dotClass: "bg-success" };
  if (amount < 600000) return { label: "보통", dotClass: "bg-amber" };
  return { label: "높음", dotClass: "bg-accent" };
}

/** flexibility 코드 → 한국어 */
export function flexibilityKr(f: string): string {
  switch (f) {
    case "fixed":    return "고정";
    case "booked":   return "예약";
    case "flexible": return "유연";
    default:         return f;
  }
}

/** searchParams의 day 파라미터 파싱 (0~nights 범위 외 → undefined) */
export function parseDayParam(raw: string | undefined, nights: number): number | undefined {
  if (raw == null) return undefined;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n > nights) return undefined;
  return n;
}

/** 카테고리 → 한국어 라벨 */
export const CATEGORY_LABEL: Record<string, string> = {
  food: "음식점",
  spot: "관광",
  shopping: "쇼핑",
  rest: "휴식",
};

/** 카테고리 → Material Symbols 아이콘 */
export const CATEGORY_ICON: Record<string, string> = {
  food: "restaurant",
  spot: "photo_camera",
  shopping: "shopping_bag",
  rest: "bed",
};

/** 카테고리 → 히어로 그라디언트 */
export const CATEGORY_GRADIENT: Record<string, string> = {
  food: "bg-gradient-to-br from-accent to-amber-deep",
  spot: "bg-gradient-to-br from-purple to-purple-deep",
  shopping: "bg-gradient-to-br from-amber to-accent-deep",
  rest: "bg-gradient-to-br from-success-deep to-purple-deep",
};
