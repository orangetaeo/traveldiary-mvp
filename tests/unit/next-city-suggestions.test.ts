import { describe, it, expect } from "vitest";
import {
  getNextCitySuggestions,
  VIETNAM_ACTIVE_CITY_CODES,
} from "@/lib/wrap-up/next-city-suggestions";

describe("getNextCitySuggestions", () => {
  it("destinationCode 미지정(null/undefined/'') → 활성 도시 limit개", () => {
    expect(getNextCitySuggestions(null, { limit: 5 })).toHaveLength(5);
    expect(getNextCitySuggestions(undefined, { limit: 5 })).toHaveLength(5);
    expect(getNextCitySuggestions("", { limit: 5 })).toHaveLength(5);
  });

  it("default limit = 5", () => {
    expect(getNextCitySuggestions("DAD")).toHaveLength(5);
  });

  it("destinationCode 매칭 시 해당 도시 제외", () => {
    const got = getNextCitySuggestions("DAD", { limit: 8 });
    expect(got.find((c) => c.code === "DAD")).toBeUndefined();
    // DAD 제외 후 7개만 남음
    expect(got).toHaveLength(7);
  });

  it("destinationCode 소문자도 매칭 (대소문 정규화)", () => {
    const got = getNextCitySuggestions("dad", { limit: 8 });
    expect(got.find((c) => c.code === "DAD")).toBeUndefined();
  });

  it("dormant/비매칭 코드는 활성 8 도시 모두 반환", () => {
    expect(getNextCitySuggestions("TYO", { limit: 8 })).toHaveLength(8);
    expect(getNextCitySuggestions("XXX", { limit: 8 })).toHaveLength(8);
  });

  it("첫 항목에 BEST 배지, 나머지는 undefined", () => {
    const got = getNextCitySuggestions("PQC", { limit: 5 });
    expect(got[0].badge).toBe("BEST");
    for (let i = 1; i < got.length; i++) {
      expect(got[i].badge).toBeUndefined();
    }
  });

  it("destinationCode가 인기 1위(DAD)일 때 BEST는 2위(HAN)로 이동", () => {
    const got = getNextCitySuggestions("DAD", { limit: 5 });
    expect(got[0].code).toBe("HAN");
    expect(got[0].badge).toBe("BEST");
  });

  it("name 한국어 라벨 매핑", () => {
    const got = getNextCitySuggestions(null, { limit: 8 });
    const names = got.map((c) => c.name);
    expect(names).toContain("다낭");
    expect(names).toContain("하노이");
    expect(names).toContain("호치민");
    expect(names).toContain("나트랑");
    expect(names).toContain("호이안");
    expect(names).toContain("달랏");
    expect(names).toContain("푸꾸옥");
    expect(names).toContain("껀터");
  });

  it("slug = code 소문자 (라우트 호환)", () => {
    const got = getNextCitySuggestions(null, { limit: 8 });
    for (const c of got) {
      expect(c.slug).toBe(c.code.toLowerCase());
    }
  });

  it("limit 0/음수/NaN/Infinity → 빈 배열", () => {
    expect(getNextCitySuggestions("DAD", { limit: 0 })).toEqual([]);
    expect(getNextCitySuggestions("DAD", { limit: -1 })).toEqual([]);
    expect(getNextCitySuggestions("DAD", { limit: Number.NaN })).toEqual([]);
    expect(getNextCitySuggestions("DAD", { limit: Number.POSITIVE_INFINITY })).toEqual([]);
  });

  it("limit 부동소수 → floor", () => {
    expect(getNextCitySuggestions(null, { limit: 3.9 })).toHaveLength(3);
  });

  it("limit > 활성 도시 수 → max 8", () => {
    expect(getNextCitySuggestions(null, { limit: 100 })).toHaveLength(8);
  });

  it("dormant 도시(TYO/BKK/CNX)는 추천 목록에 없음", () => {
    const got = getNextCitySuggestions(null, { limit: 8 });
    const codes = got.map((c) => c.code);
    expect(codes).not.toContain("TYO");
    expect(codes).not.toContain("BKK");
    expect(codes).not.toContain("CNX");
  });

  it("VIETNAM_ACTIVE_CITY_CODES 8개 노출 (시드 정합)", () => {
    expect(VIETNAM_ACTIVE_CITY_CODES).toHaveLength(8);
  });

  it("순서 결정적 — 동일 입력 동일 출력", () => {
    const a = getNextCitySuggestions("HAN", { limit: 5 });
    const b = getNextCitySuggestions("HAN", { limit: 5 });
    expect(a).toEqual(b);
  });
});
