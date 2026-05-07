/**
 * vietnamese-phrases 데이터 무결성 단위 테스트 (A3 디자인 갭, 사이클 W3).
 *
 * 검증:
 *  - 4 카테고리 정의 (식당/그랩/호텔/응급)
 *  - 14 문장 (식당 5 / 그랩 3 / 호텔 3 / 응급 3)
 *  - 모든 문장 필수 필드 (id/category/ko/vi/pronunciation)
 *  - id 유일성
 *  - groupByCategory + getCategoryMeta 헬퍼
 */

import { describe, it, expect } from "vitest";
import {
  PHRASE_CATEGORIES,
  PHRASES,
  groupByCategory,
  getCategoryMeta,
  type PhraseCategory,
} from "@/lib/vietnamese-phrases";

describe("PHRASE_CATEGORIES", () => {
  it("4 카테고리 (식당/그랩/호텔/응급)", () => {
    expect(PHRASE_CATEGORIES.length).toBe(4);
    const ids = PHRASE_CATEGORIES.map((c) => c.id).sort();
    expect(ids).toEqual(["emergency", "grab", "hotel", "restaurant"]);
  });

  it("각 카테고리 필수 필드 (label/icon/accent)", () => {
    for (const cat of PHRASE_CATEGORIES) {
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.icon.length).toBeGreaterThan(0);
      expect(["purple", "amber", "success", "danger"]).toContain(cat.accent);
    }
  });
});

describe("PHRASES", () => {
  it("총 14 문장 (식당 5 / 그랩 3 / 호텔 3 / 응급 3)", () => {
    expect(PHRASES.length).toBe(14);
    const counts: Record<PhraseCategory, number> = {
      restaurant: 0,
      grab: 0,
      hotel: 0,
      emergency: 0,
    };
    for (const p of PHRASES) counts[p.category]++;
    expect(counts.restaurant).toBe(5);
    expect(counts.grab).toBe(3);
    expect(counts.hotel).toBe(3);
    expect(counts.emergency).toBe(3);
  });

  it("모든 문장 필수 필드 (id/ko/vi/pronunciation)", () => {
    for (const p of PHRASES) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.ko.length).toBeGreaterThan(0);
      expect(p.vi.length).toBeGreaterThan(0);
      expect(p.pronunciation.length).toBeGreaterThan(0);
    }
  });

  it("모든 id 유일", () => {
    const ids = PHRASES.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("응급 카테고리에 '도와주세요' 포함 (사용자 안전)", () => {
    const emer = PHRASES.filter((p) => p.category === "emergency");
    const koJoined = emer.map((p) => p.ko).join(" ");
    expect(koJoined).toContain("도와");
    expect(koJoined).toContain("병원");
    expect(koJoined).toContain("여권");
  });

  it("식당 카테고리에 '매워' 정도 확인 문장 (한국인 특화)", () => {
    const rest = PHRASES.filter((p) => p.category === "restaurant");
    const koJoined = rest.map((p) => p.ko).join(" ");
    expect(koJoined).toContain("매워");
    expect(koJoined).toContain("계산");
  });

  it("그랩 카테고리에 출발/도착 안내 문장", () => {
    const grab = PHRASES.filter((p) => p.category === "grab");
    expect(grab.length).toBe(3);
    const koJoined = grab.map((p) => p.ko).join(" ");
    expect(koJoined).toContain("출발");
    expect(koJoined).toContain("세워");
  });
});

describe("groupByCategory", () => {
  it("카테고리별 그룹 분포 일치", () => {
    const grouped = groupByCategory();
    expect(grouped.restaurant.length).toBe(5);
    expect(grouped.grab.length).toBe(3);
    expect(grouped.hotel.length).toBe(3);
    expect(grouped.emergency.length).toBe(3);
  });

  it("그룹 합계 = 전체 문장 수", () => {
    const grouped = groupByCategory();
    const total =
      grouped.restaurant.length +
      grouped.grab.length +
      grouped.hotel.length +
      grouped.emergency.length;
    expect(total).toBe(PHRASES.length);
  });
});

describe("getCategoryMeta", () => {
  it("유효 id 시 메타 반환", () => {
    expect(getCategoryMeta("restaurant").label).toBe("식당");
    expect(getCategoryMeta("grab").label).toBe("그랩");
    expect(getCategoryMeta("hotel").label).toBe("호텔");
    expect(getCategoryMeta("emergency").label).toBe("응급");
  });

  it("무효 id 시 throw", () => {
    expect(() =>
      getCategoryMeta("invalid" as PhraseCategory),
    ).toThrow("Unknown phrase category");
  });
});
