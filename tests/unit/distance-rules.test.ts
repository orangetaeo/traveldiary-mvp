/**
 * Distance Rules 단위 테스트 — 사이클 M (ADR-030, R1 조건).
 *
 * 순수 함수 — 외부 API·DB 의존 없음.
 * 케이스: Haversine 정확도, 모드 결정, fallback 추정, 비교 룰 4 status, 경계.
 */

import { describe, it, expect } from "vitest";
import {
  haversineKm,
  pickTravelMode,
  estimateTravelMinutes,
  compareDistanceVerification,
  WALKING_DISTANCE_THRESHOLD_KM,
  WALKING_SPEED_KMH,
  DRIVING_SPEED_KMH,
  DRIVE_DETOUR_FACTOR,
} from "@/lib/services/distance-rules";

// ═══════════════════════════════════════════════════════════════════
// 테스트 헬퍼
// ═══════════════════════════════════════════════════════════════════

function makeItem(opts: {
  scheduledAt: string;
  durationMinutes?: number;
  flexMinutes?: number;
  location: { lat: number; lng: number };
}) {
  return {
    id: "test-item",
    scheduledAt: opts.scheduledAt,
    durationMinutes: opts.durationMinutes ?? 60,
    flexMinutes: opts.flexMinutes ?? 0,
    location: { ...opts.location, address: "" },
  };
}

const SEOUL = { lat: 37.5665, lng: 126.978 }; // 서울 시청
const BUSAN = { lat: 35.1796, lng: 129.0756 }; // 부산 시청
const SEOUL_NEAR = { lat: 37.5705, lng: 126.9826 }; // 서울 시청 ~500m

// ═══════════════════════════════════════════════════════════════════
// haversineKm — Great-circle 정확도
// ═══════════════════════════════════════════════════════════════════

describe("haversineKm", () => {
  it("서울 ↔ 부산 ≈ 325km (±5km)", () => {
    const d = haversineKm(SEOUL, BUSAN);
    expect(d).toBeGreaterThan(320);
    expect(d).toBeLessThan(330);
  });

  it("동일 좌표 → 0km", () => {
    expect(haversineKm(SEOUL, SEOUL)).toBe(0);
  });

  it("교환 법칙 — origin/dest swap 결과 동일", () => {
    const d1 = haversineKm(SEOUL, BUSAN);
    const d2 = haversineKm(BUSAN, SEOUL);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });

  it("근거리 — 서울 시청 인접 좌표 < 1km", () => {
    const d = haversineKm(SEOUL, SEOUL_NEAR);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// pickTravelMode — 거리 기반 분기
// ═══════════════════════════════════════════════════════════════════

describe("pickTravelMode", () => {
  it("0.5km → walking", () => {
    expect(pickTravelMode(0.5)).toBe("walking");
  });

  it("threshold 미만 → walking", () => {
    expect(pickTravelMode(WALKING_DISTANCE_THRESHOLD_KM - 0.001)).toBe(
      "walking",
    );
  });

  it("threshold 정확히 → driving (>= threshold)", () => {
    expect(pickTravelMode(WALKING_DISTANCE_THRESHOLD_KM)).toBe("driving");
  });

  it("10km → driving", () => {
    expect(pickTravelMode(10)).toBe("driving");
  });
});

// ═══════════════════════════════════════════════════════════════════
// estimateTravelMinutes — Fallback 추정
// ═══════════════════════════════════════════════════════════════════

describe("estimateTravelMinutes", () => {
  it("0.5km 도보 — (0.5 × 1.4 × 60) / 4 ≈ 11분 (ceil 10.5)", () => {
    const minutes = estimateTravelMinutes(0.5, "walking");
    // 정확히: 0.5 * 1.4 * 60 / 4 = 10.5 → ceil = 11
    expect(minutes).toBe(11);
  });

  it("5km 차량 — (5 × 1.4 × 60) / 60 = 7분", () => {
    const minutes = estimateTravelMinutes(5, "driving");
    expect(minutes).toBe(7);
  });

  it("거리 0 → 0분", () => {
    expect(estimateTravelMinutes(0, "walking")).toBe(0);
    expect(estimateTravelMinutes(0, "driving")).toBe(0);
  });

  it("상수 정합성 — driving 60km/h, walking 4km/h", () => {
    expect(DRIVING_SPEED_KMH).toBe(60);
    expect(WALKING_SPEED_KMH).toBe(4);
    expect(DRIVE_DETOUR_FACTOR).toBe(1.4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// compareDistanceVerification — 메인 비교 룰
// ═══════════════════════════════════════════════════════════════════

describe("compareDistanceVerification — 5 status 분기", () => {
  it("nextItem=null → status: no_next", () => {
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T03:00:00Z",
        location: SEOUL,
      }),
      nextItem: null,
    });
    expect(out.status).toBe("no_next");
    expect(out.verified).toBe(false);
    expect(out.travelMinutes).toBeNull();
  });

  it("origin 좌표 (0,0) → status: missing_location", () => {
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T03:00:00Z",
        location: { lat: 0, lng: 0 },
      }),
      nextItem: {
        scheduledAt: "2026-05-10T05:00:00Z",
        location: { ...SEOUL, address: "" },
      },
    });
    expect(out.status).toBe("missing_location");
    expect(out.distanceKm).toBeNull();
  });

  it("dest 좌표 (0,0) → status: missing_location", () => {
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T03:00:00Z",
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T05:00:00Z",
        location: { lat: 0, lng: 0, address: "" },
      },
    });
    expect(out.status).toBe("missing_location");
  });

  it("verified — 갭 충분 (서울 → 인근, 도보 ≈ 11분 ≤ 49분 갭)", () => {
    // 일정 N: 09:00, 60분 → 종료 10:00
    // 일정 N+1: 10:49 → 갭 49분
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T00:00:00Z",
        durationMinutes: 60,
        flexMinutes: 0,
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T01:49:00Z",
        location: { ...SEOUL_NEAR, address: "" },
      },
    });
    expect(out.status).toBe("verified");
    expect(out.verified).toBe(true);
    expect(out.mode).toBe("walking");
    expect(out.gapMinutes).toBe(49);
  });

  it("warn — 갭은 부족하지만 flexMinutes로 커버", () => {
    // 일정 N: 60분, flex 10분
    // 갭 5분 (실제 추정 11분) → 5 < 11 ≤ 5 + 10 → warn
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T00:00:00Z",
        durationMinutes: 60,
        flexMinutes: 10,
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T01:05:00Z",
        location: { ...SEOUL_NEAR, address: "" },
      },
    });
    expect(out.status).toBe("warn");
    expect(out.verified).toBe(false);
    expect(out.gapMinutes).toBe(5);
  });

  it("mismatch — 서울→부산 차량 ≈ 455분이지만 갭 60분 (flex 0)", () => {
    // 일정 N: 60분, flex 0
    // 다음 일정 60분 후 → 갭 0분
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T00:00:00Z",
        durationMinutes: 60,
        flexMinutes: 0,
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T01:00:00Z",
        location: { ...BUSAN, address: "" },
      },
    });
    expect(out.status).toBe("mismatch");
    expect(out.verified).toBe(false);
    expect(out.mode).toBe("driving");
    expect(out.travelMinutes).toBeGreaterThan(400);
    expect(out.gapMinutes).toBe(0);
  });

  it("실측 actualTravelMinutes 주입 시 fallback 추정 무시 (source: directions)", () => {
    // 서울→부산 직선 ≈ 325km, 추정 ≈ 455분.
    // 실측 30분 주입 → travelMinutes는 30 사용 (Directions 우선)
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T00:00:00Z",
        durationMinutes: 60,
        flexMinutes: 0,
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T02:00:00Z",
        location: { ...BUSAN, address: "" },
      },
      actualTravelMinutes: 30,
    });
    expect(out.travelMinutes).toBe(30);
    expect(out.source).toBe("directions");
    expect(out.status).toBe("verified");
    expect(out.gapMinutes).toBe(60);
  });

  it("forceMode='walking' — 거리 무관 도보로 강제", () => {
    // 서울→부산 ≈ 325km × 1.4 × 60 / 4 = 6,825분 (도보)
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T00:00:00Z",
        durationMinutes: 60,
        flexMinutes: 0,
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T02:00:00Z",
        location: { ...BUSAN, address: "" },
      },
      forceMode: "walking",
    });
    expect(out.mode).toBe("walking");
    expect(out.travelMinutes).toBeGreaterThan(6000);
  });

  it("scheduledAt 파싱 실패 → status: missing_location (방어)", () => {
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "invalid-date",
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T01:00:00Z",
        location: { ...SEOUL_NEAR, address: "" },
      },
    });
    expect(out.status).toBe("missing_location");
  });

  it("source: fallback — actualTravelMinutes 미주입 시", () => {
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T00:00:00Z",
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T02:00:00Z",
        location: { ...SEOUL_NEAR, address: "" },
      },
    });
    expect(out.source).toBe("fallback");
  });

  it("verified 메시지에 거리·모드·시간 포함", () => {
    const out = compareDistanceVerification({
      item: makeItem({
        scheduledAt: "2026-05-10T00:00:00Z",
        durationMinutes: 60,
        flexMinutes: 0,
        location: SEOUL,
      }),
      nextItem: {
        scheduledAt: "2026-05-10T02:00:00Z",
        location: { ...SEOUL_NEAR, address: "" },
      },
    });
    expect(out.status).toBe("verified");
    expect(out.reason).toContain("도보");
    expect(out.reason).toContain("분");
  });
});
