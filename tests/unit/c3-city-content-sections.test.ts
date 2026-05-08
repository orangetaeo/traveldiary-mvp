/**
 * C3 — 도시 가이드 콘텐츠 섹션 검증.
 *
 * visa/utilities/weather 3 섹션 추가 + chip nav 업데이트.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C3 — /city/[slug] 신규 섹션 (visa/utilities/weather)", () => {
  const src = fs.readFileSync(
    path.resolve("app/city/[slug]/page.tsx"),
    "utf-8",
  );

  it("visa 섹션 존재", () => {
    expect(src).toContain('id="visa"');
    expect(src).toContain("비자·입국");
  });

  it("무비자 일수 표시", () => {
    expect(src).toContain("visaFreeDays");
  });

  it("e-Visa 필요 여부 표시", () => {
    expect(src).toContain("eVisaRequired");
  });

  it("utilities 섹션 존재", () => {
    expect(src).toContain('id="utilities"');
    expect(src).toContain("준비물·전기·통신");
  });

  it("전압·플러그·SIM 3 컬럼", () => {
    expect(src).toContain("city.utilities.voltage");
    expect(src).toContain("city.utilities.plugType");
    expect(src).toContain("city.utilities.simAvailable");
  });

  it("weather 섹션 존재", () => {
    expect(src).toContain('id="weather"');
    expect(src).toContain("날씨·복장");
  });

  it("시즌 + 평균 기온 표시", () => {
    expect(src).toContain("city.weather.season");
    expect(src).toContain("avgTempC");
  });
});

describe("C3 — chip nav 업데이트", () => {
  const src = fs.readFileSync(
    path.resolve("app/city/[slug]/page.tsx"),
    "utf-8",
  );

  it("visa chip 추가", () => {
    expect(src).toContain('"visa"');
    expect(src).toContain('"비자"');
  });

  it("utilities chip 추가", () => {
    expect(src).toContain('"utilities"');
    expect(src).toContain('"준비물"');
  });

  it("weather chip 추가", () => {
    expect(src).toContain('"weather"');
    expect(src).toContain('"날씨·복장"');
  });

  it("medical chip 추가 (F2)", () => {
    expect(src).toContain('"medical"');
    expect(src).toContain('"약국·병원"');
  });

  it("총 9개 chip (응급·약국·결제·교통·비자·준비물·날씨·문장·시그니처)", () => {
    const chipMatches = src.match(/\{ id: "/g);
    expect(chipMatches).not.toBeNull();
    expect(chipMatches!.length).toBeGreaterThanOrEqual(9);
  });
});

describe("C3 — 시드 데이터 정합성 (country → city resolve)", () => {
  const countrySrc = fs.readFileSync(
    path.resolve("lib/constants/countries.ts"),
    "utf-8",
  );
  const indexSrc = fs.readFileSync(
    path.resolve("lib/seed/cities/index.ts"),
    "utf-8",
  );

  it("country에 utilities 정의", () => {
    expect(countrySrc).toContain("utilities:");
    expect(countrySrc).toContain("voltage:");
    expect(countrySrc).toContain("plugType:");
  });

  it("country에 visa 정의", () => {
    expect(countrySrc).toContain("visa:");
    expect(countrySrc).toContain("visaFreeDays:");
  });

  it("resolveCity에서 utilities/visa merge", () => {
    expect(indexSrc).toContain("city.utilities ?? country.utilities");
    expect(indexSrc).toContain("city.visa ?? country.visa");
  });
});

// 2026-05-08 — /city/[slug] 헤더 dead account_circle <span> 활성화 회귀.
// 홈 헤더 menu → /settings (PR #322 옵션 W) 답습 패턴.
describe("/city/[slug] 헤더 — account_circle 활성 Link", () => {
  const src = fs.readFileSync(
    path.resolve("app/city/[slug]/page.tsx"),
    "utf-8",
  );

  it("account_circle은 <Link href=\"/profile\">로 wrap (dead <span> 활성화)", () => {
    // 활성 Link 패턴 존재 (account_circle이 Link 자식으로 위치)
    expect(src).toMatch(/<Link\s+href="\/profile"[\s\S]{0,400}?account_circle/);
    expect(src).toContain('aria-label="내 프로필"');
  });

  it("account_circle Link은 EmergencyHeaderButton 직후 위치 (헤더 우측 그룹)", () => {
    expect(src).toMatch(/<EmergencyHeaderButton[\s\S]*?<Link[\s\S]*?href="\/profile"[\s\S]*?account_circle/);
  });
});
