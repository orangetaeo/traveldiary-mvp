/**
 * lib/utils/item-display.ts 유틸리티 단위 테스트.
 */

import { describe, it, expect } from "vitest";
import {
  splitName,
  formatTime,
  dDay,
  durationLabel,
  priceLevelOf,
  flexibilityKr,
  CATEGORY_LABEL,
  CATEGORY_ICON,
  CATEGORY_GRADIENT,
} from "@/lib/utils/item-display";

describe("splitName", () => {
  it("한국어(영어) → 분리", () => {
    expect(splitName("킹콩마트 (King Kong Mart)")).toEqual({
      ko: "킹콩마트",
      en: "King Kong Mart",
    });
  });

  it("괄호 없으면 ko만", () => {
    expect(splitName("빈펄 사파리")).toEqual({ ko: "빈펄 사파리", en: "" });
  });

  it("빈 문자열", () => {
    expect(splitName("")).toEqual({ ko: "", en: "" });
  });

  it("중첩 괄호 — 마지막 괄호 기준", () => {
    const result = splitName("맛집 (A) (B)");
    expect(result.ko).toBe("맛집 (A)");
    expect(result.en).toBe("B");
  });
});

describe("formatTime", () => {
  it("유효 ISO → HH:MM", () => {
    expect(formatTime("2026-05-01T09:30:00Z")).toBe("09:30");
  });

  it("오후 시간", () => {
    expect(formatTime("2026-05-01T14:05:00Z")).toBe("14:05");
  });

  it("잘못된 ISO → 빈 문자열", () => {
    expect(formatTime("invalid")).toBe("");
  });
});

describe("durationLabel", () => {
  it("60분 미만 → N분", () => {
    expect(durationLabel(45)).toBe("45분");
  });

  it("정확히 60분 → 1시간", () => {
    expect(durationLabel(60)).toBe("1시간");
  });

  it("90분 → 1시간 30분", () => {
    expect(durationLabel(90)).toBe("1시간 30분");
  });

  it("120분 → 2시간", () => {
    expect(durationLabel(120)).toBe("2시간");
  });
});

describe("priceLevelOf", () => {
  it("undefined → 무료", () => {
    expect(priceLevelOf(undefined)).toEqual({ label: "무료", dotClass: "bg-success" });
  });

  it("0 → 무료", () => {
    expect(priceLevelOf(0)).toEqual({ label: "무료", dotClass: "bg-success" });
  });

  it("100000 → 낮음", () => {
    expect(priceLevelOf(100000)).toEqual({ label: "낮음", dotClass: "bg-success" });
  });

  it("300000 → 보통", () => {
    expect(priceLevelOf(300000)).toEqual({ label: "보통", dotClass: "bg-amber" });
  });

  it("800000 → 높음", () => {
    expect(priceLevelOf(800000)).toEqual({ label: "높음", dotClass: "bg-accent" });
  });
});

describe("flexibilityKr", () => {
  it("fixed → 고정", () => expect(flexibilityKr("fixed")).toBe("고정"));
  it("booked → 예약", () => expect(flexibilityKr("booked")).toBe("예약"));
  it("flexible → 유연", () => expect(flexibilityKr("flexible")).toBe("유연"));
  it("unknown → 그대로", () => expect(flexibilityKr("custom")).toBe("custom"));
});

describe("카테고리 상수", () => {
  it("CATEGORY_LABEL 4종", () => {
    expect(Object.keys(CATEGORY_LABEL)).toEqual(["food", "spot", "shopping", "rest"]);
  });

  it("CATEGORY_ICON 4종", () => {
    expect(CATEGORY_ICON.food).toBe("restaurant");
    expect(CATEGORY_ICON.spot).toBe("photo_camera");
  });

  it("CATEGORY_GRADIENT 4종", () => {
    expect(CATEGORY_GRADIENT.food).toContain("bg-gradient");
    expect(Object.keys(CATEGORY_GRADIENT)).toHaveLength(4);
  });
});

describe("dDay", () => {
  it("출발 5일 전 → 5", () => {
    expect(dDay("2026-05-15", "2026-05-10")).toBe(5);
  });

  it("출발 당일 → 0", () => {
    expect(dDay("2026-05-15", "2026-05-15")).toBe(0);
  });

  it("출발 2일 후 → -2", () => {
    expect(dDay("2026-05-15", "2026-05-17")).toBe(-2);
  });

  it("같은 날짜 → 0", () => {
    expect(dDay("2026-01-01", "2026-01-01")).toBe(0);
  });
});
