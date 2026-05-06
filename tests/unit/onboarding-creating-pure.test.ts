/**
 * onboarding + creating 페이지 순수 함수 테스트.
 *
 * utils.ts / steps.ts로 추출된 순수 함수 직접 검증.
 */

import { describe, it, expect } from "vitest";

import {
  formatStartDateKo,
  destinationToCode,
  paceLabelToCode,
} from "@/app/onboarding/utils";

import { getSteps } from "@/app/itinerary/creating/steps";

/* ════════════════════════════════════════════
 * formatStartDateKo
 * ════════════════════════════════════════════ */

describe("formatStartDateKo", () => {
  it("정상 날짜 → '월 일 (요일)' 포맷", () => {
    // 2026-05-10 = 일요일
    const result = formatStartDateKo("2026-05-10");
    expect(result).toBe("5월 10일 (일)");
  });

  it("1월 1일 → 새해 첫날", () => {
    // 2026-01-01 = 목요일
    const result = formatStartDateKo("2026-01-01");
    expect(result).toBe("1월 1일 (목)");
  });

  it("12월 31일 → 연말", () => {
    // 2026-12-31 = 목요일
    const result = formatStartDateKo("2026-12-31");
    expect(result).toBe("12월 31일 (목)");
  });

  it("윤년 2월 29일", () => {
    // 2028-02-29 = 화요일
    const result = formatStartDateKo("2028-02-29");
    expect(result).toBe("2월 29일 (화)");
  });

  it("잘못된 날짜 → 원본 문자열 반환", () => {
    expect(formatStartDateKo("not-a-date")).toBe("not-a-date");
  });

  it("빈 문자열 → 원본 반환", () => {
    expect(formatStartDateKo("")).toBe("");
  });

  it("7개 요일 모두 커버 (월~일)", () => {
    // 2026-05-04(월), 05(화), 06(수), 07(목), 08(금), 09(토), 10(일)
    const days = ["월", "화", "수", "목", "금", "토", "일"];
    for (let i = 0; i < 7; i++) {
      const date = `2026-05-${String(4 + i).padStart(2, "0")}`;
      const result = formatStartDateKo(date);
      expect(result).toContain(`(${days[i]})`);
    }
  });
});

/* ════════════════════════════════════════════
 * destinationToCode
 * ════════════════════════════════════════════ */

describe("destinationToCode", () => {
  it("6개 베트남 도시 매핑", () => {
    expect(destinationToCode("푸꾸옥")).toBe("PQC");
    expect(destinationToCode("다낭")).toBe("DAD");
    expect(destinationToCode("호치민")).toBe("SGN");
    expect(destinationToCode("하노이")).toBe("HAN");
    expect(destinationToCode("나트랑")).toBe("NHA");
    expect(destinationToCode("달랏")).toBe("DLI");
  });

  it("미등록 도시 → PQC 기본값", () => {
    expect(destinationToCode("방콕")).toBe("PQC");
    expect(destinationToCode("")).toBe("PQC");
  });
});

/* ════════════════════════════════════════════
 * paceLabelToCode
 * ════════════════════════════════════════════ */

describe("paceLabelToCode", () => {
  it("여유롭게 → relaxed", () => {
    expect(paceLabelToCode("여유롭게")).toBe("relaxed");
  });

  it("최대한 많이 → packed", () => {
    expect(paceLabelToCode("최대한 많이")).toBe("packed");
  });

  it("기본(적당히) → balanced", () => {
    expect(paceLabelToCode("적당히")).toBe("balanced");
  });

  it("미지원 라벨 → balanced 기본값", () => {
    expect(paceLabelToCode("")).toBe("balanced");
    expect(paceLabelToCode("unknown")).toBe("balanced");
  });
});

/* ════════════════════════════════════════════
 * getSteps (creating 페이지)
 * ════════════════════════════════════════════ */

describe("getSteps", () => {
  it("4개 단계 반환", () => {
    const steps = getSteps("다낭");
    expect(steps).toHaveLength(4);
  });

  it("destination이 2번째 단계 title에 삽입", () => {
    const steps = getSteps("호이안");
    expect(steps[1].title).toBe("호이안 인기 장소 검토");
  });

  it("각 단계에 title + detail 필드 존재", () => {
    const steps = getSteps("다낭");
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
    }
  });

  it("마지막 단계는 5단계 검증 관련", () => {
    const steps = getSteps("다낭");
    expect(steps[3].title).toContain("검증");
  });

  it("빈 destination도 크래시 없음", () => {
    const steps = getSteps("");
    expect(steps).toHaveLength(4);
    expect(steps[1].title).toContain("인기 장소 검토");
  });
});
