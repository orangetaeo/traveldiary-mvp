/**
 * Geolocation API 래퍼 — 사이클 5b-4 (ADR-017).
 *
 * 정책:
 *   - 좌표는 함수 스코프 메모리에서만. 외부에 보존(localStorage/state/DB) 금지.
 *   - 호출자(AutoModeDetector)는 좌표를 받아 isWithinBoundary 클라이언트 실행 후 mode만 서버 전송.
 *   - One-shot getCurrentPosition. watchPosition은 미도입.
 *   - HTTPS 환경 필수 (브라우저가 강제. localhost는 예외).
 *
 * client-only: 'use client' 컴포넌트에서만 import. SSR에서 호출 금지 (window 미정의).
 */

export type GeolocationOutcome =
  | { mode: "ok"; lat: number; lng: number; accuracy: number }
  | { mode: "unsupported" }
  | { mode: "denied" }
  | { mode: "unavailable" }
  | { mode: "timeout" };

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: false, // 도시 30km 경계 — cell tower 정확도 충분
  timeout: 10_000,           // 10초
  maximumAge: 60_000,        // 1분 캐시 활용
};

/**
 * 현재 위치 1회 조회. Privacy 정책:
 *   - 반환된 좌표는 함수 호출자가 사용 후 즉시 폐기해야 함.
 *   - 어디에도 보존하지 말 것 (ADR-017 §C).
 */
export async function getCurrentLocation(): Promise<GeolocationOutcome> {
  if (typeof window === "undefined" || !window.navigator?.geolocation) {
    return { mode: "unsupported" };
  }

  return new Promise((resolve) => {
    window.navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          mode: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            resolve({ mode: "denied" });
            break;
          case err.POSITION_UNAVAILABLE:
            resolve({ mode: "unavailable" });
            break;
          case err.TIMEOUT:
            resolve({ mode: "timeout" });
            break;
          default:
            resolve({ mode: "unavailable" });
        }
      },
      DEFAULT_OPTIONS,
    );
  });
}
