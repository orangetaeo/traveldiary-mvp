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
    expect(src).toContain("날씨·기후");
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
    expect(src).toContain('"날씨"');
  });

  it("총 8개 chip (응급·결제·교통·비자·준비물·날씨·문장·시그니처)", () => {
    const chipMatches = src.match(/\{ id: "/g);
    expect(chipMatches).not.toBeNull();
    expect(chipMatches!.length).toBeGreaterThanOrEqual(8);
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
