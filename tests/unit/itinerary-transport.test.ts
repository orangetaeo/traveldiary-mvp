import { describe, expect, test } from "vitest";
import { computeTransportSuggestion } from "@/lib/itinerary-transport";
import type { ItineraryItem } from "@/lib/types";

function makeItem(overrides: Partial<ItineraryItem> & { name: string; lat: number; lng: number }): ItineraryItem {
  return {
    id: overrides.id ?? overrides.name,
    tripId: "t1",
    dayIndex: 0,
    scheduledAt: "2026-06-01T09:00:00.000Z",
    durationMinutes: 60,
    flexibility: "flexible",
    priority: 3,
    flexMinutes: 30,
    name: overrides.name,
    category: "spot",
    location: { lat: overrides.lat, lng: overrides.lng, address: "" },
    evidence: { reasons: [], sources: [], verifiedAt: "" },
    dependencies: [],
  };
}

describe("computeTransportSuggestion", () => {
  test("좌표 미설정(0,0) sentinel은 null", () => {
    const a = makeItem({ name: "A", lat: 0, lng: 0 });
    const b = makeItem({ name: "B", lat: 10.776, lng: 106.701 });
    expect(computeTransportSuggestion(a, b)).toBeNull();
    expect(computeTransportSuggestion(b, a)).toBeNull();
  });

  test("동일 지점 (50m 미만)은 null — 관광지 내 이동 무시", () => {
    const a = makeItem({ name: "A", lat: 10.7769, lng: 106.7009 });
    const b = makeItem({ name: "B", lat: 10.7770, lng: 106.7010 });
    expect(computeTransportSuggestion(a, b)).toBeNull();
  });

  test("0.5km 단거리 — 도보 추천 + walk/grab 옵션 (버스 제외)", () => {
    // 호치민 시내 단거리 (≈0.5km)
    const a = makeItem({ name: "A", lat: 10.776, lng: 106.700 });
    const b = makeItem({ name: "B", lat: 10.776, lng: 106.7045 });
    const r = computeTransportSuggestion(a, b)!;
    expect(r).not.toBeNull();
    expect(r.recommendedMode).toBe("walk");
    expect(r.distanceKm).toBeLessThan(1);
    const modes = r.options.map((o) => o.mode);
    expect(modes).toContain("walk");
    expect(modes).toContain("grab");
    expect(modes).not.toContain("bus");
    expect(r.recommendedReason).toContain("도보 추천");
  });

  test("1.5km 중거리 — 도보 옵션 포함 + 그랩 추천 (베트남 더위 고려)", () => {
    const a = makeItem({ name: "A", lat: 10.776, lng: 106.700 });
    const b = makeItem({ name: "B", lat: 10.776, lng: 106.71375 });
    const r = computeTransportSuggestion(a, b)!;
    expect(r).not.toBeNull();
    expect(r.distanceKm).toBeGreaterThan(1);
    expect(r.distanceKm).toBeLessThan(2);
    expect(r.recommendedMode).toBe("grab");
    const modes = r.options.map((o) => o.mode);
    expect(modes).toContain("walk");
    expect(modes).toContain("grab");
    expect(modes).toContain("bus");
  });

  test("3km 시내 — 도보 옵션 사라지고 grab/bus만", () => {
    const a = makeItem({ name: "A", lat: 10.776, lng: 106.700 });
    const b = makeItem({ name: "B", lat: 10.776, lng: 106.7275 });
    const r = computeTransportSuggestion(a, b)!;
    expect(r.distanceKm).toBeGreaterThan(2.5);
    expect(r.recommendedMode).toBe("grab");
    const modes = r.options.map((o) => o.mode);
    expect(modes).not.toContain("walk");
    expect(modes).toContain("grab");
    expect(modes).toContain("bus");
  });

  test("8km 장거리 — 그랩 추천 + 시간 절약 강조", () => {
    const a = makeItem({ name: "A", lat: 10.776, lng: 106.700 });
    const b = makeItem({ name: "B", lat: 10.776, lng: 106.773 });
    const r = computeTransportSuggestion(a, b)!;
    expect(r.distanceKm).toBeGreaterThan(7);
    expect(r.recommendedMode).toBe("grab");
    expect(r.recommendedReason).toContain("시간 절약");
  });

  test("그랩 가격은 거리 비례 + 100원 단위 round", () => {
    const a = makeItem({ name: "A", lat: 10.776, lng: 106.700 });
    const b = makeItem({ name: "B", lat: 10.776, lng: 106.7275 });
    const r = computeTransportSuggestion(a, b)!;
    const grab = r.options.find((o) => o.mode === "grab")!;
    expect(grab.priceKrw).toBeGreaterThanOrEqual(18000);
    expect(grab.priceKrw! % 100).toBe(0);
  });

  test("도보 가격은 0원, 버스는 800원 고정", () => {
    const a = makeItem({ name: "A", lat: 10.776, lng: 106.700 });
    const b = makeItem({ name: "B", lat: 10.776, lng: 106.71375 });
    const r = computeTransportSuggestion(a, b)!;
    const walk = r.options.find((o) => o.mode === "walk");
    const bus = r.options.find((o) => o.mode === "bus");
    expect(walk?.priceKrw).toBe(0);
    expect(bus?.priceKrw).toBe(800);
  });

  test("durationMin은 1분 이상", () => {
    const a = makeItem({ name: "A", lat: 10.7760, lng: 106.7000 });
    const b = makeItem({ name: "B", lat: 10.7763, lng: 106.7003 });
    const r = computeTransportSuggestion(a, b);
    if (r) {
      for (const opt of r.options) {
        expect(opt.durationMin).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test("recommendedMode는 항상 options에 포함됨", () => {
    const cases: Array<[number, number]> = [
      [10.776, 106.7045], // 0.5km
      [10.776, 106.71375], // 1.5km
      [10.776, 106.7275], // 3km
      [10.776, 106.773], // 8km
    ];
    for (const [lat, lng] of cases) {
      const a = makeItem({ name: "A", lat: 10.776, lng: 106.700 });
      const b = makeItem({ name: "B", lat, lng });
      const r = computeTransportSuggestion(a, b)!;
      const modes = r.options.map((o) => o.mode);
      expect(modes).toContain(r.recommendedMode);
    }
  });
});
