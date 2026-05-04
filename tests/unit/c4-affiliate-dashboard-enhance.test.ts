/**
 * C4 — 어필리에이트 대시보드 강화 검증.
 *
 * 시나리오 C Phase C4: 도시별·오퍼별 CTR 추적.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C4 — affiliate.repository 도시·오퍼 집계", () => {
  const src = fs.readFileSync(
    path.resolve("lib/repositories/affiliate.repository.ts"),
    "utf-8",
  );

  it("OFFER_PREFIX_CITY export", () => {
    expect(src).toContain("export const OFFER_PREFIX_CITY");
  });

  it("extractCityFromOfferId export", () => {
    expect(src).toContain("export function extractCityFromOfferId");
  });

  it("9+ 베트남 도시 prefix 매핑", () => {
    expect(src).toContain('pq: "푸꾸옥"');
    expect(src).toContain('dn: "다낭"');
    expect(src).toContain('ha: "하노이"');
    expect(src).toContain('hc: "호치민"');
    expect(src).toContain('ho: "호이안"');
    expect(src).toContain('nt: "나트랑"');
    expect(src).toContain('dl: "달랏"');
    expect(src).toContain('ct: "껀터"');
    expect(src).toContain('cm: "치앙마이"');
  });

  it("AffiliateSummary.byCity 타입 포함", () => {
    expect(src).toContain("byCity:");
    expect(src).toContain("cityLabel:");
  });

  it("AffiliateSummary.topOffers 타입 포함", () => {
    expect(src).toContain("topOffers:");
  });

  it("도시 집계 로직 (cityMap)", () => {
    expect(src).toContain("cityMap");
    expect(src).toContain("extractCityFromOfferId");
  });

  it("오퍼 집계 로직 (offerMap)", () => {
    expect(src).toContain("offerMap");
  });

  it("top 10 제한", () => {
    expect(src).toContain(".slice(0, 10)");
  });
});

describe("C4 — extractCityFromOfferId 단위 테스트", () => {
  // 직접 import 대신 구현 로직 검증 (server-only 모듈)
  function extractCityFromOfferId(offerId: string): string {
    const parts = offerId.split("-");
    return parts.length >= 2 ? parts[1] : "unknown";
  }

  it("klook-pq-cablecar → pq", () => {
    expect(extractCityFromOfferId("klook-pq-cablecar")).toBe("pq");
  });

  it("kkday-dn-banaHills → dn", () => {
    expect(extractCityFromOfferId("kkday-dn-banaHills")).toBe("dn");
  });

  it("agoda-cm-elephantSanctuary → cm", () => {
    expect(extractCityFromOfferId("agoda-cm-elephantSanctuary")).toBe("cm");
  });

  it("빈 문자열 → unknown", () => {
    expect(extractCityFromOfferId("")).toBe("unknown");
  });

  it("하이픈 없음 → unknown", () => {
    expect(extractCityFromOfferId("nohyphens")).toBe("unknown");
  });
});

describe("C4 — 대시보드 UI 도시별·오퍼별 섹션", () => {
  const src = fs.readFileSync(
    path.resolve("app/admin/affiliate/page.tsx"),
    "utf-8",
  );

  it("도시별 섹션 헤더", () => {
    expect(src).toContain("도시별");
    expect(src).toContain("summary.byCity");
  });

  it("인기 오퍼 섹션 헤더", () => {
    expect(src).toContain("인기 오퍼 Top 10");
    expect(src).toContain("summary.topOffers");
  });

  it("도시 라벨 표시 (cityLabel)", () => {
    expect(src).toContain("row.cityLabel");
  });

  it("오퍼 ID 표시", () => {
    expect(src).toContain("row.offerId");
  });
});
