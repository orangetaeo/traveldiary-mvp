/**
 * C3 — SEO 인프라 구조 검증 (sitemap + robots + JSON-LD).
 *
 * 시나리오 C Phase C3: 크롤러 발견성.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C3 — sitemap.ts", () => {
  it("app/sitemap.ts 존재", () => {
    expect(fs.existsSync(path.resolve("app/sitemap.ts"))).toBe(true);
  });

  it("sitemap 함수 반환값에 정적 페이지 포함", async () => {
    const mod = await import("../../app/sitemap");
    const entries = mod.default();
    const urls = entries.map((e: { url: string }) => e.url);
    expect(urls.some((u: string) => u.endsWith("/"))).toBe(true);
    expect(urls.some((u: string) => u.includes("/trips"))).toBe(true);
    expect(urls.some((u: string) => u.includes("/onboarding"))).toBe(true);
  });

  it("sitemap에 도시 페이지 포함", async () => {
    const mod = await import("../../app/sitemap");
    const entries = mod.default();
    const urls = entries.map((e: { url: string }) => e.url);
    expect(urls.some((u: string) => u.includes("/city/phu-quoc"))).toBe(true);
    expect(urls.some((u: string) => u.includes("/city/da-nang"))).toBe(true);
  });

  it("sitemap에 응급 페이지 포함", async () => {
    const mod = await import("../../app/sitemap");
    const entries = mod.default();
    const urls = entries.map((e: { url: string }) => e.url);
    expect(urls.some((u: string) => u.includes("/emergency"))).toBe(true);
  });
});

describe("C3 — robots.ts", () => {
  it("app/robots.ts 존재", () => {
    expect(fs.existsSync(path.resolve("app/robots.ts"))).toBe(true);
  });

  it("robots 함수 반환값에 rules + sitemap", async () => {
    const mod = await import("../../app/robots");
    const r = mod.default();
    expect(r.rules).toBeDefined();
    expect(r.sitemap).toContain("sitemap.xml");
  });

  it("/admin/ 차단", async () => {
    const mod = await import("../../app/robots");
    const r = mod.default();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const disallowed = rules.flatMap((rule: { disallow?: string | string[] }) =>
      Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow],
    );
    expect(disallowed).toContain("/admin/");
  });

  it("/api/ 차단", async () => {
    const mod = await import("../../app/robots");
    const r = mod.default();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const disallowed = rules.flatMap((rule: { disallow?: string | string[] }) =>
      Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow],
    );
    expect(disallowed).toContain("/api/");
  });
});

describe("C3 — JSON-LD (홈 페이지)", () => {
  const src = fs.readFileSync(path.resolve("app/page.tsx"), "utf-8");

  it("OrganizationJsonLd 사용", () => {
    expect(src).toContain("OrganizationJsonLd");
  });

  it("WebAppJsonLd 사용", () => {
    expect(src).toContain("WebAppJsonLd");
  });

  it("TravelApplication 카테고리", () => {
    expect(src).toContain("TravelApplication");
  });
});

describe("C3 — JSON-LD 컴포넌트", () => {
  const src = fs.readFileSync(
    path.resolve("components/seo/JsonLd.tsx"),
    "utf-8",
  );

  it("application/ld+json 스크립트 타입", () => {
    expect(src).toContain("application/ld+json");
  });

  it("schema.org 컨텍스트", () => {
    expect(src).toContain("https://schema.org");
  });

  it("Organization + WebApplication + BreadcrumbList 3 타입", () => {
    expect(src).toContain("Organization");
    expect(src).toContain("WebApplication");
    expect(src).toContain("BreadcrumbList");
  });
});
