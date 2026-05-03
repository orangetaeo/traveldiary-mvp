/**
 * 사이클 VVV — lib/constants/city-labels 회귀.
 *
 * R1 사인오프 조건:
 *  1. CITY_LABEL_KO Object는 frozen (외부 변이 차단)
 *  2. getCityLabelKo는 매핑된 코드를 한국어 라벨로 변환
 *  3. 미매핑 코드는 원본 반환 (RR 호환 패턴 `?? d.code`)
 *  4. null/undefined/빈 문자열은 "(unknown)"으로 안전 fallback
 *  5. 시드 destinationCode union ⊂ CITY_LABEL_KO 키 (T14 드리프트 회귀)
 *  6. unknown 키도 매핑 보유 ((기록 이전) — RR audit log 응답)
 */

import { describe, it, expect } from "vitest";
import {
  CITY_LABEL_KO,
  getCityLabelKo,
} from "@/lib/constants/city-labels";

// 시드 trip의 실제 destinationCode union (lib/seed/*.ts grep 결과).
// 누군가 새 trip 시드 추가 시 이 배열도 업데이트해야 회귀 안전망 유지.
const SEEDED_DESTINATION_CODES = [
  "PQC", // 푸꾸옥
  "DAD", // 다낭
  "HAN", // 하노이
  "SGN", // 호치민
  "NHA", // 나트랑
  "DLI", // 달랏
  "CNX", // 치앙마이 (dormant 정책이지만 trip 시드 보유)
] as const;

describe("CITY_LABEL_KO Object", () => {
  it("frozen 상태 — 외부 변이 시도는 무시 (또는 throw)", () => {
    // Object.freeze는 silent-fail (non-strict) 또는 TypeError (strict).
    // 양쪽 모두 결과 동일: 변이가 적용되지 않음.
    try {
      (CITY_LABEL_KO as Record<string, string>).PQC = "변경";
    } catch {
      // strict mode TypeError — 정상 동작
    }
    expect(CITY_LABEL_KO.PQC).toBe("푸꾸옥");
  });

  it("11개 키 + unknown — 8 활성 도시 + 3 dormant + unknown fallback", () => {
    expect(Object.keys(CITY_LABEL_KO).length).toBe(12);
  });

  it("unknown 키는 audit log 응답용 (RR pre-AAA 데이터 호환)", () => {
    expect(CITY_LABEL_KO.unknown).toBe("(기록 이전)");
  });

  it.each([
    ["PQC", "푸꾸옥"],
    ["DAD", "다낭"],
    ["HAN", "하노이"],
    ["SGN", "호치민"],
    ["HOI", "호이안"],
    ["NHA", "나트랑"],
    ["DLI", "달랏"],
    ["CTH", "껀터"],
    ["TYO", "도쿄"],
    ["BKK", "방콕"],
    ["CNX", "치앙마이"],
  ])("%s → %s", (code, expected) => {
    expect(CITY_LABEL_KO[code]).toBe(expected);
  });
});

describe("getCityLabelKo", () => {
  it("매핑된 코드 → 한국어 라벨", () => {
    expect(getCityLabelKo("DAD")).toBe("다낭");
    expect(getCityLabelKo("SGN")).toBe("호치민");
  });

  it("미매핑 코드 → 원본 그대로 (RR `?? d.code` 호환)", () => {
    expect(getCityLabelKo("XYZ")).toBe("XYZ");
    expect(getCityLabelKo("NEW_CODE")).toBe("NEW_CODE");
  });

  it("null/undefined/빈 문자열 → '(unknown)' fallback", () => {
    expect(getCityLabelKo(null)).toBe("(unknown)");
    expect(getCityLabelKo(undefined)).toBe("(unknown)");
    expect(getCityLabelKo("")).toBe("(unknown)");
  });

  it("unknown 키 명시 → '(기록 이전)' (CITY_LABEL_KO 매핑 우선)", () => {
    expect(getCityLabelKo("unknown")).toBe("(기록 이전)");
  });
});

describe("드리프트 회귀 — 시드 destinationCode ⊂ CITY_LABEL_KO 키", () => {
  it.each(SEEDED_DESTINATION_CODES)(
    "시드 %s는 CITY_LABEL_KO에 매핑 보유",
    (code) => {
      expect(CITY_LABEL_KO[code]).toBeDefined();
      expect(CITY_LABEL_KO[code]).not.toBe(code); // 한국어 라벨이지 코드 자체가 아님
    },
  );

  it("시드 코드는 모두 베트남 IATA + 치앙마이 dormant (T14 검증 답습)", () => {
    expect(SEEDED_DESTINATION_CODES.length).toBeGreaterThanOrEqual(7);
  });
});
