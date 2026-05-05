/**
 * C3 — 도시 가이드 콘텐츠 심화 + /guide 목록 페이지 검증.
 *
 * 가이드 섹션 심화 (3→6 스텝) + SEO 가이드 목록 페이지.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/* ─── 다낭 가이드 심화 ─── */
describe("C3 — 다낭 가이드 6단계 심화", () => {
  const src = fs.readFileSync(
    path.resolve("lib/seed/cities/da-nang.ts"),
    "utf-8",
  );

  it("6개 heading 존재", () => {
    const headings = src.match(/heading:/g);
    expect(headings).not.toBeNull();
    expect(headings!.length).toBeGreaterThanOrEqual(6);
  });

  it("한시장 + 콩카페 섹션 추가", () => {
    expect(src).toContain("한시장");
    expect(src).toContain("콩카페");
  });

  it("바나힐 + 골든브릿지 섹션 추가", () => {
    expect(src).toContain("바나힐");
    expect(src).toContain("골든브릿지");
  });

  it("용다리 Dragon Bridge 섹션 추가", () => {
    expect(src).toContain("Dragon Bridge");
  });

  it("기존 호이안 + 미케 섹션 유지", () => {
    expect(src).toContain("호이안 등불");
    expect(src).toContain("미케 비치");
  });
});

/* ─── 호치민 가이드 심화 ─── */
describe("C3 — 호치민 가이드 6단계 심화", () => {
  const src = fs.readFileSync(
    path.resolve("lib/seed/cities/ho-chi-minh.ts"),
    "utf-8",
  );

  it("6개 heading 존재", () => {
    const headings = src.match(/heading:/g);
    expect(headings).not.toBeNull();
    expect(headings!.length).toBeGreaterThanOrEqual(6);
  });

  it("벤탄시장 + Bui Vien 섹션 추가", () => {
    expect(src).toContain("벤탄시장");
    expect(src).toContain("Bui Vien");
  });

  it("전쟁 박물관 + 통일궁 섹션 추가", () => {
    expect(src).toContain("War Remnants Museum");
    expect(src).toContain("Reunification Palace");
  });

  it("루프탑 바 섹션 추가", () => {
    expect(src).toContain("Chill Sky Bar");
  });

  it("기존 노트르담 + 분짜 섹션 유지", () => {
    expect(src).toContain("노트르담");
    expect(src).toContain("분짜");
  });
});

/* ─── /guide 목록 페이지 ─── */
describe("C3 — /guide SEO 목록 페이지", () => {
  const src = fs.readFileSync(
    path.resolve("app/guide/page.tsx"),
    "utf-8",
  );

  it("Metadata export 존재", () => {
    expect(src).toContain("export const metadata");
  });

  it("SEO 타이틀에 베트남 여행 가이드 포함", () => {
    expect(src).toContain("베트남 여행 가이드");
  });

  it("SEO description에 주요 도시명 포함", () => {
    expect(src).toContain("다낭");
    expect(src).toContain("하노이");
    expect(src).toContain("푸꾸옥");
  });

  it("OpenGraph 메타 포함", () => {
    expect(src).toContain("openGraph");
  });

  it("listVietnamCities 사용", () => {
    expect(src).toContain("listVietnamCities");
  });

  it("resolveCity 사용", () => {
    expect(src).toContain("resolveCity");
  });

  it("/city/[slug]#curated 링크", () => {
    expect(src).toContain("#curated");
  });

  it("가이드 카드에 emoji + 단계 수 표시", () => {
    expect(src).toContain("hero?.emoji");
    expect(src).toContain("sections.length");
    expect(src).toContain("개 스팟");
  });

  it("도시 정보 링크", () => {
    expect(src).toContain("도시 정보");
  });

  it("SEO 보조 텍스트 섹션", () => {
    expect(src).toContain("베트남 자유여행");
    expect(src).toContain("시그니처 코스");
  });
});

/* ─── 전체 도시 가이드 최소 섹션 수 ─── */
describe("C3 — 베트남 도시 가이드 최소 4단계 보장", () => {
  const cityFiles = [
    "da-nang",
    "ho-chi-minh",
    "hanoi",
    "phu-quoc",
    "hoi-an",
    "nha-trang",
    "da-lat",
    "can-tho",
  ];

  for (const city of cityFiles) {
    it(`${city} 가이드 최소 4단계`, () => {
      const src = fs.readFileSync(
        path.resolve(`lib/seed/cities/${city}.ts`),
        "utf-8",
      );
      const headings = src.match(/heading:/g);
      expect(headings).not.toBeNull();
      expect(headings!.length).toBeGreaterThanOrEqual(4);
    });
  }
});
