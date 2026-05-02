/**
 * Country 모델 + resolveCity 단위 테스트 — 사이클 H (ADR-032).
 *
 * 검증 핵심:
 *   1. Country 정의 무결성 (VN/TH/JP)
 *   2. resolveCity merge 결과가 정규화 전 raw 데이터와 동등 (사용자 view 무변경 보장)
 *   3. 시드 정규화 — payment.currency/symbol/rate, phrases, utilities, visa는
 *      raw seed에 없어도 country로 채워짐
 *   4. emergencyContacts merge 순서 (city → country → GLOBAL)
 *   5. resolveCityByCode 회귀
 */

import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  GLOBAL_EMERGENCY_CONTACTS,
  getCountry,
  listCountries,
} from "@/lib/constants/countries";
import {
  getCityBySlug,
  resolveCity,
  resolveCityByCode,
} from "@/lib/seed/cities";

// ═══════════════════════════════════════════════════════════════════
// Country 정의
// ═══════════════════════════════════════════════════════════════════

describe("Country 정의 — 무결성", () => {
  it("VN/TH/JP 3개 country 정의됨", () => {
    expect(COUNTRIES.VN).toBeDefined();
    expect(COUNTRIES.TH).toBeDefined();
    expect(COUNTRIES.JP).toBeDefined();
  });

  it("VN paymentDefaults — VND 18", () => {
    const vn = COUNTRIES.VN;
    expect(vn.paymentDefaults.currency).toBe("VND");
    expect(vn.paymentDefaults.currencySymbol).toBe("₫");
    expect(vn.paymentDefaults.approxKrwRate).toBe(18);
  });

  it("VN utilities — 220V A/C/G", () => {
    expect(COUNTRIES.VN.utilities.voltage).toBe("220V");
    expect(COUNTRIES.VN.utilities.plugType).toBe("A/C/G");
  });

  it("VN visa — 무비자 45일", () => {
    expect(COUNTRIES.VN.visa.visaFreeDays).toBe(45);
    expect(COUNTRIES.VN.visa.eVisaRequired).toBe(false);
  });

  it("VN defaultPhrases — 베트남어 7개", () => {
    expect(COUNTRIES.VN.defaultPhrases.length).toBe(7);
    const greet = COUNTRIES.VN.defaultPhrases.find(
      (p) => p.situation === "greeting",
    );
    expect(greet?.local).toBe("Xin chào");
  });

  it("TH defaultPhrases — 태국어 7개 (방콕 시드 풀 분량)", () => {
    expect(COUNTRIES.TH.defaultPhrases.length).toBe(7);
  });

  it("JP defaultPhrases — 일본어 7개 (도쿄 시드 풀 분량)", () => {
    expect(COUNTRIES.JP.defaultPhrases.length).toBe(7);
  });

  it("countryEmergencyContacts — 베트남 113·115", () => {
    const codes = COUNTRIES.VN.countryEmergencyContacts.map((c) => c.phone);
    expect(codes).toContain("113");
    expect(codes).toContain("115");
  });

  it("getCountry / listCountries 헬퍼", () => {
    expect(getCountry("VN")?.code).toBe("VN");
    expect(getCountry("XX")).toBeNull();
    expect(listCountries().length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GLOBAL_EMERGENCY_CONTACTS
// ═══════════════════════════════════════════════════════════════════

describe("GLOBAL_EMERGENCY_CONTACTS — 모든 country 공통", () => {
  it("영사 콜센터 + 카드 분실 2건", () => {
    expect(GLOBAL_EMERGENCY_CONTACTS.length).toBe(2);
    const labels = GLOBAL_EMERGENCY_CONTACTS.map((c) => c.label);
    expect(labels.some((l) => l.includes("영사 콜센터"))).toBe(true);
    expect(labels.some((l) => l.includes("신용카드 분실"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolveCity merge 결과 — 정규화 전 동등성 보장
// ═══════════════════════════════════════════════════════════════════

describe("resolveCity — 베트남 도시 merge", () => {
  it("푸꾸옥 — payment 통화 3필드가 country에서 채워짐", () => {
    const city = resolveCity("phu-quoc");
    expect(city).not.toBeNull();
    expect(city?.payment.currency).toBe("VND");
    expect(city?.payment.currencySymbol).toBe("₫");
    expect(city?.payment.approxKrwRate).toBe(18);
    // 도시별 항목은 그대로
    expect(city?.payment.cardAcceptance).toBe("medium");
  });

  it("푸꾸옥 — phrases가 country.defaultPhrases (7개)", () => {
    const city = resolveCity("phu-quoc");
    expect(city?.phrases.length).toBe(7);
    const greet = city?.phrases.find((p) => p.situation === "greeting");
    expect(greet?.local).toBe("Xin chào");
  });

  it("푸꾸옥 — utilities·visa가 country에서 채워짐", () => {
    const city = resolveCity("phu-quoc");
    expect(city?.utilities?.voltage).toBe("220V");
    expect(city?.visa?.visaFreeDays).toBe(45);
  });

  it("푸꾸옥 — emergencyContacts merge: city → country → GLOBAL", () => {
    const city = resolveCity("phu-quoc");
    const labels = city?.emergencyContacts.map((c) => c.label) ?? [];
    // city 도시별 (영사관·추천 병원)
    expect(labels.some((l) => l.includes("호치민 대한민국 총영사관"))).toBe(true);
    expect(labels.some((l) => l.includes("Vinmec) 푸꾸옥"))).toBe(true);
    // country (베트남 경찰·응급)
    expect(labels.some((l) => l === "베트남 경찰")).toBe(true);
    expect(labels.some((l) => l === "베트남 응급 의료")).toBe(true);
    // GLOBAL (영사 콜센터·카드 분실)
    expect(labels.some((l) => l.includes("영사 콜센터"))).toBe(true);
    expect(labels.some((l) => l.includes("신용카드 분실"))).toBe(true);
  });

  it("다낭 — country merge 동일 적용", () => {
    const city = resolveCity("da-nang");
    expect(city?.payment.currency).toBe("VND");
    expect(city?.phrases.length).toBe(7);
    expect(city?.utilities?.voltage).toBe("220V");
  });

  it("호치민 / 하노이 / 호이안 / 나트랑 모두 country 정규화됨", () => {
    for (const slug of ["ho-chi-minh", "hanoi", "hoi-an", "nha-trang"]) {
      const city = resolveCity(slug);
      expect(city, slug).not.toBeNull();
      expect(city?.payment.currency, slug).toBe("VND");
      expect(city?.phrases.length, slug).toBe(7);
      expect(city?.utilities?.voltage, slug).toBe("220V");
      expect(city?.visa?.visaFreeDays, slug).toBe(45);
    }
  });
});

describe("resolveCity — 비-베트남 도시", () => {
  it("방콕 — TH 정규화 (THB·태국어)", () => {
    const city = resolveCity("bangkok");
    expect(city?.payment.currency).toBe("THB");
    expect(city?.payment.currencySymbol).toBe("฿");
    expect(city?.phrases.length).toBe(7);
    expect(city?.utilities?.voltage).toBe("220V");
    expect(city?.visa?.visaFreeDays).toBe(90);
    // 베트남 경찰 113은 안 들어감
    const labels = city?.emergencyContacts.map((c) => c.label) ?? [];
    expect(labels.some((l) => l === "태국 관광경찰")).toBe(true);
    expect(labels.some((l) => l === "베트남 경찰")).toBe(false);
  });

  it("도쿄 — JP 정규화 (JPY·일본어 7개·100V)", () => {
    const city = resolveCity("tokyo");
    expect(city?.payment.currency).toBe("JPY");
    expect(city?.phrases.length).toBe(7);
    expect(city?.utilities?.voltage).toBe("100V");
    const veg = city?.phrases.find((p) => p.situation === "vegetarian");
    expect(veg?.local).toContain("肉と魚");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Raw seed vs Resolved — 시드는 비워두고 country로 채워짐 검증
// ═══════════════════════════════════════════════════════════════════

describe("Raw seed → Resolved 정규화 검증", () => {
  it("푸꾸옥 raw seed는 phrases·utilities·visa 비어있음 (사이클 H 정규화)", () => {
    const raw = getCityBySlug("phu-quoc");
    expect(raw?.phrases).toBeUndefined();
    expect(raw?.utilities).toBeUndefined();
    expect(raw?.visa).toBeUndefined();
    expect(raw?.payment.currency).toBeUndefined();
  });

  it("raw 도시 emergencyContacts는 도시별 항목만 (113·115·영사콜센터·카드분실 없음)", () => {
    const raw = getCityBySlug("phu-quoc");
    const phones = raw?.emergencyContacts.map((c) => c.phone) ?? [];
    expect(phones).not.toContain("113");
    expect(phones).not.toContain("115");
    // 사이클 Q: 표기 하이픈 통일
    expect(phones).not.toContain("+82-2-3210-0404");
    expect(phones).not.toContain("+82-2-1577-0000");
  });

  it("resolveCity는 모든 정보 복원 (raw + country + GLOBAL)", () => {
    const resolved = resolveCity("phu-quoc");
    const phones = resolved?.emergencyContacts.map((c) => c.phone) ?? [];
    expect(phones).toContain("113"); // country
    expect(phones).toContain("115"); // country
    // 사이클 Q: 외교부 0404.go.kr 공식 표기 (하이픈) 통일
    expect(phones).toContain("+82-2-3210-0404"); // GLOBAL translator
    expect(phones).toContain("+82-2-1577-0000"); // GLOBAL card_lost
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolveCityByCode 회귀
// ═══════════════════════════════════════════════════════════════════

describe("resolveCityByCode — 코드 기반 조회", () => {
  it("PQC → 푸꾸옥 resolved", () => {
    const city = resolveCityByCode("PQC");
    expect(city?.slug).toBe("phu-quoc");
    expect(city?.payment.currency).toBe("VND");
  });

  it("BKK → 방콕 resolved (THB)", () => {
    const city = resolveCityByCode("BKK");
    expect(city?.payment.currency).toBe("THB");
  });

  it("미존재 코드 → null", () => {
    expect(resolveCityByCode("XXX")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 미존재 슬러그
// ═══════════════════════════════════════════════════════════════════

describe("resolveCity edge cases", () => {
  it("미존재 슬러그 → null", () => {
    expect(resolveCity("nonexistent")).toBeNull();
  });
});
