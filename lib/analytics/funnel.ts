/**
 * 온보딩 퍼널 트래커 — 시나리오 C Phase C2.
 *
 * 클라이언트에서 호출, /api/analytics/funnel 로 전송.
 * DB 가용 시 AuditLog에 기록, 없으면 console.log fallback.
 */

"use client";

export type FunnelStep = "view" | "step1" | "step2" | "step3" | "step4" | "submit" | "complete";

export function trackFunnelStep(step: FunnelStep, meta?: Record<string, string>): void {
  try {
    const payload = {
      step,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    // 비동기 fire-and-forget (사용자 경험 무영향)
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/funnel",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
    } else {
      fetch("/api/analytics/funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // 실패해도 무시 — 트래킹 실패가 UX를 막으면 안 됨
      });
    }
  } catch {
    // 트래킹 에러는 절대 throw 하지 않음
  }
}
