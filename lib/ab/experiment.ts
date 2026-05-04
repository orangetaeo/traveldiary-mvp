/**
 * A/B 테스트 인프라 — 시나리오 C Phase C4.
 *
 * 클라이언트 variant 할당 + 노출/전환 추적.
 * 스키마 변경 없음 — localStorage + AuditLog 활용.
 */

"use client";

/** 실험 정의 */
export interface Experiment {
  id: string;
  variants: string[];
}

/** 활성 실험 목록 */
export const EXPERIMENTS: Experiment[] = [
  {
    id: "ota_cta_text",
    variants: ["최저가 보기", "가격 비교하기"],
  },
  {
    id: "ota_position",
    variants: ["below_evidence", "above_evidence"],
  },
];

const STORAGE_PREFIX = "td_ab_";

/**
 * 사용자에게 할당된 variant 반환.
 * 첫 방문 시 랜덤 할당 → localStorage에 고정.
 */
export function getVariant(experimentId: string): string {
  const exp = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!exp) return "control";

  if (typeof window === "undefined") return exp.variants[0];

  const key = `${STORAGE_PREFIX}${experimentId}`;
  const stored = localStorage.getItem(key);
  if (stored && exp.variants.includes(stored)) return stored;

  const variant = exp.variants[Math.floor(Math.random() * exp.variants.length)];
  localStorage.setItem(key, variant);
  return variant;
}

/**
 * A/B 이벤트 추적 (fire-and-forget).
 * impression: 노출, conversion: 전환 (클릭 등).
 */
export function trackAbEvent(
  experimentId: string,
  variant: string,
  event: "impression" | "conversion",
  meta?: Record<string, string>,
): void {
  try {
    const payload = {
      experimentId,
      variant,
      event,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/ab",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
    } else {
      fetch("/api/analytics/ab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // 트래킹 에러는 무시
  }
}
