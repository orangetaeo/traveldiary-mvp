/**
 * lib/utils/trip-display 단위 테스트 — 사이클 ZZ+1.
 *
 * 헬퍼:
 *   - formatStartDateLabel: yyyy-mm-dd → "5월 12일 (월)"
 *   - formatCompanionLabel: CompanionType → 한국어
 *   - getDDayBadge: status + dDay 분기 4 톤
 *   - dDayToneClass: 톤 → Tailwind 클래스 매핑
 *
 * timezone: dDay()와 동일하게 UTC 기준 — 실제 서버는 todayKstISO()로 KST 보정.
 */

import { describe, it, expect } from "vitest";
import {
  formatStartDateLabel,
  formatCompanionLabel,
  getDDayBadge,
  dDayToneClass,
} from "@/lib/utils/trip-display";

describe("formatStartDateLabel", () => {
  it("ISO date를 '월일 (요일)' 한국어로 포맷", () => {
    // 2026-05-12 (UTC) = 화요일
    expect(formatStartDateLabel("2026-05-12")).toBe("5월 12일 (화)");
    // 2026-01-01 (UTC) = 목요일
    expect(formatStartDateLabel("2026-01-01")).toBe("1월 1일 (목)");
  });

  it("잘못된 입력은 그대로 반환", () => {
    expect(formatStartDateLabel("not-a-date")).toBe("not-a-date");
  });
});

describe("formatCompanionLabel", () => {
  it("CompanionType 4종 모두 한국어 라벨", () => {
    expect(formatCompanionLabel("solo")).toBe("혼자");
    expect(formatCompanionLabel("friends")).toBe("친구와");
    expect(formatCompanionLabel("family")).toBe("가족과");
    expect(formatCompanionLabel("group")).toBe("그룹");
  });
});

describe("getDDayBadge", () => {
  it("출발 전: D-N (purple)", () => {
    const b = getDDayBadge("2026-05-12", 7, "2026-05-09");
    expect(b.tone).toBe("purple");
    expect(b.label).toBe("D-3");
    expect(b.d).toBe(3);
  });

  it("출발 당일: '출발 당일' (amber)", () => {
    const b = getDDayBadge("2026-05-12", 7, "2026-05-12");
    expect(b.tone).toBe("amber");
    expect(b.label).toBe("출발 당일");
    expect(b.d).toBe(0);
  });

  it("여행 중: 'D+|d|' (success)", () => {
    const b = getDDayBadge("2026-05-12", 7, "2026-05-15");
    expect(b.tone).toBe("success");
    expect(b.label).toBe("여행 중 · D+3");
    expect(b.d).toBe(-3);
  });

  it("여행 후 (d < -nights): '여행 완료' (neutral)", () => {
    // 7박 → 마지막 day는 d=-7. d=-8이면 종료 다음 날
    const b = getDDayBadge("2026-05-12", 7, "2026-05-20");
    expect(b.tone).toBe("neutral");
    expect(b.label).toBe("여행 완료");
  });

  it("status='completed' 우선 — d 값과 무관하게 neutral", () => {
    // 출발 전인데 status가 completed면 (raw seed 모순) status 우선
    const b = getDDayBadge("2026-05-12", 7, "2026-05-09", "completed");
    expect(b.tone).toBe("neutral");
    expect(b.label).toBe("여행 완료");
  });

  it("status='in-progress'는 dDay 분기에 영향 없음 (label은 d 기반)", () => {
    const b = getDDayBadge("2026-05-12", 7, "2026-05-15", "in-progress");
    expect(b.tone).toBe("success");
    expect(b.label).toBe("여행 중 · D+3");
  });
});

describe("dDayToneClass", () => {
  it("4 톤 모두 Tailwind 클래스 매핑", () => {
    expect(dDayToneClass("purple")).toContain("bg-purple");
    expect(dDayToneClass("purple")).toContain("text-white");
    expect(dDayToneClass("amber")).toContain("amber");
    expect(dDayToneClass("success")).toContain("success");
    expect(dDayToneClass("neutral")).toContain("ink-mute");
  });
});
