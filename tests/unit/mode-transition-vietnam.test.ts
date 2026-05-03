/**
 * 사이클 WW (ADR-043) — 베트남 6 도시 boundary 회귀.
 *
 * 검증:
 *  1. trip 시드 보유 6 도시 모두 boundary 등록 (PQC/SGN/HAN/DAD/NHA/DLI)
 *  2. 도시 중심 좌표는 isWithinBoundary true
 *  3. 도시 중심에서 1000km 떨어진 좌표는 false
 *  4. 비-베트남 도시(BKK/CNX/TYO)는 boundary 미등록 — false
 *  5. detectMode가 D-Day≤0 + 도시 안에서 in-travel 반환
 */

import { describe, it, expect } from "vitest";
import {
  isWithinBoundary,
  detectMode,
  distanceKm,
} from "@/lib/mode-transition";
import type { Trip } from "@/lib/types";

// ─── 도시 중심 좌표 (mode-transition.ts와 동기) ───
const VIETNAM_CITIES = [
  { code: "PQC", name: "푸꾸옥", lat: 10.225, lng: 103.96 },
  { code: "SGN", name: "호치민", lat: 10.7769, lng: 106.7009 },
  { code: "HAN", name: "하노이", lat: 21.0285, lng: 105.8542 },
  { code: "DAD", name: "다낭", lat: 16.0544, lng: 108.2022 },
  { code: "NHA", name: "나트랑", lat: 12.2388, lng: 109.1967 },
  { code: "DLI", name: "달랏", lat: 11.9404, lng: 108.4583 },
];

const NON_VIETNAM_CITIES = [
  { code: "BKK", lat: 13.7563, lng: 100.5018 }, // 방콕
  { code: "CNX", lat: 18.7883, lng: 98.9853 },  // 치앙마이
  { code: "TYO", lat: 35.6762, lng: 139.6503 }, // 도쿄
];

function makeTrip(destinationCode: string, startDate: string, nights = 4): Trip {
  return {
    id: `trip-${destinationCode}`,
    destination: destinationCode,
    destinationCode,
    startDate,
    nights,
    companion: "friends",
    preferences: { vibes: [], pace: "balanced", excludes: [] },
    createdAt: new Date().toISOString(),
    status: "confirmed",
    currentMode: "pre-travel",
    updatedAt: new Date().toISOString(),
  };
}

describe("사이클 WW — 베트남 6 도시 boundary", () => {
  it.each(VIETNAM_CITIES)(
    "$name($code) 도시 중심은 boundary 안",
    ({ code, lat, lng }) => {
      expect(isWithinBoundary({ lat, lng }, code)).toBe(true);
    },
  );

  it.each(VIETNAM_CITIES)(
    "$name($code) 중심에서 1000km 떨어진 좌표는 boundary 밖",
    ({ code, lat, lng }) => {
      // 위도 +10도 ≈ 1100km — 어떤 도시 boundary(최대 30km)도 벗어남
      expect(isWithinBoundary({ lat: lat + 10, lng }, code)).toBe(false);
    },
  );

  it.each(NON_VIETNAM_CITIES)(
    "비-베트남 도시 $code 는 boundary 미등록 — 항상 false",
    ({ code, lat, lng }) => {
      expect(isWithinBoundary({ lat, lng }, code)).toBe(false);
    },
  );

  it("도시 중심 6개의 거리는 0에 근접", () => {
    for (const c of VIETNAM_CITIES) {
      const d = distanceKm({ lat: c.lat, lng: c.lng }, { lat: c.lat, lng: c.lng });
      expect(d).toBeLessThan(0.001);
    }
  });
});

describe("사이클 WW — detectMode 베트남 trip 6종 자동 전환", () => {
  // D-Day 0 (출발 당일) + 도시 안 → in-travel
  const startToday = new Date().toISOString().slice(0, 10);

  it.each(VIETNAM_CITIES)(
    "$name 출발 당일 + 도시 중심 좌표 → in-travel",
    ({ code, lat, lng }) => {
      const trip = makeTrip(code, startToday);
      const mode = detectMode(trip, new Date(), { lat, lng });
      expect(mode).toBe("in-travel");
    },
  );

  it.each(VIETNAM_CITIES)(
    "$name 출발 당일 + 도시 밖 좌표 → pre-travel (보수)",
    ({ code, lat, lng }) => {
      const trip = makeTrip(code, startToday);
      const mode = detectMode(trip, new Date(), { lat: lat + 10, lng });
      expect(mode).toBe("pre-travel");
    },
  );

  it.each(VIETNAM_CITIES)(
    "$name 위치 미제공 + D-Day 0 → pre-travel (보수)",
    ({ code }) => {
      const trip = makeTrip(code, startToday);
      const mode = detectMode(trip, new Date());
      expect(mode).toBe("pre-travel");
    },
  );
});
