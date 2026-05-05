/**
 * C3 — 동적 페이지 SEO 메타 검증.
 *
 * 시나리오 C Phase C3: city/emergency/itinerary 페이지 generateMetadata.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C3 — /city/[slug] generateMetadata", () => {
  const src = fs.readFileSync(
    path.resolve("app/city/[slug]/page.tsx"),
    "utf-8",
  );

  it("Metadata import", () => {
    expect(src).toContain("import type { Metadata }");
  });

  it("generateMetadata export", () => {
    expect(src).toContain("export function generateMetadata");
  });

  it("openGraph 포함", () => {
    expect(src).toContain("openGraph");
  });

  it("도시명 기반 title", () => {
    expect(src).toContain("city.name");
    expect(src).toContain("여행 가이드");
  });

  it("BreadcrumbJsonLd import", () => {
    expect(src).toContain("BreadcrumbJsonLd");
  });
});

describe("C3 — /city/[slug]/emergency generateMetadata", () => {
  const src = fs.readFileSync(
    path.resolve("app/city/[slug]/emergency/page.tsx"),
    "utf-8",
  );

  it("Metadata import", () => {
    expect(src).toContain("import type { Metadata }");
  });

  it("generateMetadata export", () => {
    expect(src).toContain("export function generateMetadata");
  });

  it("응급 키워드 포함", () => {
    expect(src).toContain("응급 정보");
  });

  it("분실 가이드 description", () => {
    expect(src).toContain("분실");
  });
});

describe("C3 — /itinerary/[id] generateMetadata", () => {
  const src = fs.readFileSync(
    path.resolve("app/itinerary/[id]/page.tsx"),
    "utf-8",
  );

  it("Metadata import", () => {
    expect(src).toContain("import type { Metadata }");
  });

  it("generateMetadata async export", () => {
    expect(src).toContain("export async function generateMetadata");
  });

  it("openGraph 포함", () => {
    expect(src).toContain("openGraph");
  });

  it("trip 기반 title (destination + nights)", () => {
    expect(src).toContain("trip.destination");
    expect(src).toContain("trip.nights");
  });

  it("DB fallback → demo 시드 (resolveTripBundle)", () => {
    expect(src).toContain("resolveTripBundle");
  });
});
