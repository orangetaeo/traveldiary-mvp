/**
 * Next.js 메타데이터 생성기 단위 테스트.
 *
 * manifest.ts, robots.ts, sitemap.ts.
 */

import { describe, it, expect, vi } from "vitest";

// ─── manifest ─────────────────────────────────────────

describe("manifest()", () => {
  it("PWA manifest 필수 필드", async () => {
    const mod = await import("@/app/manifest");
    const m = mod.default();
    expect(m.name).toContain("TRAVELDIARY");
    expect(m.short_name).toBe("TravelDiary");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("ko");
  });

  it("아이콘 3개 (192, 512, 512 maskable)", async () => {
    const mod = await import("@/app/manifest");
    const m = mod.default();
    expect(m.icons).toHaveLength(3);
    const sizes = m.icons!.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("shortcuts 2개 (계획, 여행)", async () => {
    const mod = await import("@/app/manifest");
    const m = mod.default();
    expect(m.shortcuts).toHaveLength(2);
    expect(m.shortcuts![0].url).toBe("/onboarding");
    expect(m.shortcuts![1].url).toBe("/trips");
  });

  it("theme_color 보라", async () => {
    const mod = await import("@/app/manifest");
    const m = mod.default();
    expect(m.theme_color).toBe("#7C3AED");
  });
});

// ─── robots ───────────────────────────────────────────

describe("robots()", () => {
  it("robots.txt 규칙", async () => {
    const mod = await import("@/app/robots");
    const r = mod.default();
    expect(r.rules).toBeDefined();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const first = rules[0]!;
    expect(first.userAgent).toBe("*");
    expect(first.allow).toBe("/");
    expect(first.disallow).toContain("/admin/");
    expect(first.disallow).toContain("/api/");
    expect(first.disallow).toContain("/shared");
  });

  it("sitemap URL 포함", async () => {
    const mod = await import("@/app/robots");
    const r = mod.default();
    expect(r.sitemap).toContain("/sitemap.xml");
  });
});

// ─── sitemap ──────────────────────────────────────────

vi.mock("@/lib/seed/cities", () => ({
  listCities: () => [
    { slug: "da-nang", name: "다낭" },
    { slug: "phu-quoc", name: "푸꾸옥" },
  ],
}));

describe("sitemap()", () => {
  it("정적 페이지 5개 포함", async () => {
    const mod = await import("@/app/sitemap");
    const s = mod.default();
    const urls = s.map((entry) => entry.url);
    expect(urls.some((u) => u.endsWith("/"))).toBe(true);
    expect(urls.some((u) => u.includes("/trips"))).toBe(true);
    expect(urls.some((u) => u.includes("/onboarding"))).toBe(true);
    expect(urls.some((u) => u.includes("/translate"))).toBe(true);
    expect(urls.some((u) => u.includes("/guide"))).toBe(true);
  });

  it("도시별 페이지 생성 (city + emergency)", async () => {
    const mod = await import("@/app/sitemap");
    const s = mod.default();
    const urls = s.map((entry) => entry.url);
    expect(urls.some((u) => u.includes("/city/da-nang"))).toBe(true);
    expect(urls.some((u) => u.includes("/city/da-nang/emergency"))).toBe(true);
    expect(urls.some((u) => u.includes("/city/phu-quoc"))).toBe(true);
    expect(urls.some((u) => u.includes("/city/phu-quoc/emergency"))).toBe(true);
  });

  it("총 페이지 수 = 정적(5) + 도시(2×2) = 9", async () => {
    const mod = await import("@/app/sitemap");
    const s = mod.default();
    expect(s).toHaveLength(9);
  });

  it("priority 설정", async () => {
    const mod = await import("@/app/sitemap");
    const s = mod.default();
    const home = s.find((e) => e.url.endsWith("/"))!;
    expect(home.priority).toBe(1.0);
  });
});
