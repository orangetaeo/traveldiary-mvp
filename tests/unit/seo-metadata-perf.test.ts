/**
 * SEO 메타데이터 + PhotoAlbumView 성능 최적화 테스트.
 *
 * 1. 주요 페이지 generateMetadata / metadata export 검증
 * 2. PhotoAlbumView useMemo 적용 검증
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/* ═══════ 1. generateMetadata — 동적 메타데이터 ═══════ */

describe("SEO — generateMetadata 추가", () => {
  const dynamicPages = [
    { label: "wrap-up", path: "app/wrap-up/[tripId]/page.tsx" },
    { label: "travel (D-Day)", path: "app/travel/[id]/page.tsx" },
    { label: "item detail", path: "app/itinerary/[id]/item/[itemId]/page.tsx" },
  ];

  for (const page of dynamicPages) {
    it(`${page.label} — generateMetadata 존재`, () => {
      const src = fs.readFileSync(path.resolve(page.path), "utf-8");
      expect(src).toContain("generateMetadata");
    });

    it(`${page.label} — Metadata 타입 import`, () => {
      const src = fs.readFileSync(path.resolve(page.path), "utf-8");
      expect(src).toContain("Metadata");
    });
  }

  it("wrap-up — 도시 이름 + 여행 일수 포함", () => {
    const src = fs.readFileSync(path.resolve("app/wrap-up/[tripId]/page.tsx"), "utf-8");
    expect(src).toContain("city.name");
    expect(src).toContain("trip.nights");
  });

  it("travel — Day N + 도시명 포함", () => {
    const src = fs.readFileSync(path.resolve("app/travel/[id]/page.tsx"), "utf-8");
    expect(src).toContain("Day ${day}");
  });

  it("item detail — 장소명 추출 (split)", () => {
    const src = fs.readFileSync(path.resolve("app/itinerary/[id]/item/[itemId]/page.tsx"), "utf-8");
    expect(src).toContain('.split(" (")');
  });
});

/* ═══════ 2. static metadata — 정적 메타데이터 ═══════ */

describe("SEO — static metadata 추가", () => {
  const staticPages = [
    { label: "profile", path: "app/profile/page.tsx" },
    { label: "booking", path: "app/booking/[bookingId]/page.tsx" },
    { label: "data-export", path: "app/settings/data-export/page.tsx" },
  ];

  for (const page of staticPages) {
    it(`${page.label} — metadata export 존재`, () => {
      const src = fs.readFileSync(path.resolve(page.path), "utf-8");
      expect(src).toContain("export const metadata");
    });

    it(`${page.label} — title 포함`, () => {
      const src = fs.readFileSync(path.resolve(page.path), "utf-8");
      expect(src).toContain("title:");
    });
  }
});

/* ═══════ 3. PhotoAlbumView — useMemo 최적화 ═══════ */

describe("PhotoAlbumView — useMemo 성능 최적화", () => {
  const albumSrc = fs.readFileSync(
    path.resolve("components/album/PhotoAlbumView.tsx"),
    "utf-8",
  );

  it("useMemo import 존재", () => {
    expect(albumSrc).toContain("useMemo");
  });

  it("visiblePhotos에 useMemo 적용", () => {
    // useMemo 블록 내에 filter + map 패턴
    expect(albumSrc).toMatch(/useMemo\(\s*\(\)\s*=>\s*\n?\s*photos\s*\n?\s*\.filter/);
  });

  it("grouped에 useMemo 적용", () => {
    expect(albumSrc).toContain("useMemo(() => groupByDay(visiblePhotos)");
  });

  it("dayKeys에 useMemo 적용", () => {
    expect(albumSrc).toContain("useMemo(() => Array.from(grouped.keys())");
  });

  it("올바른 deps — photos, optimisticHidden, captionOverrides", () => {
    expect(albumSrc).toContain("[photos, optimisticHidden, captionOverrides]");
  });
});
