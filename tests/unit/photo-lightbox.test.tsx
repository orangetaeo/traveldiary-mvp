/**
 * PhotoLightbox + PhotoAlbumView 라이트박스 wiring — 단위 테스트.
 *
 * 갭 1 fix: 사진 클릭 시 확대 안되던 문제 해소.
 * 사용자 보고 "사진 클릭시 확대 안됨" (2026-05-08).
 *
 * 검증:
 *  - PhotoLightbox 컴포넌트 무결성 (소스 단언)
 *  - PhotoAlbumView 클릭 영역 + lightboxIndex state wiring
 *  - 모든 사진(DB + itinerary 자동) 확대 가능
 *  - z-index 레이어링 (편집/삭제 버튼이 클릭 영역 위에)
 *  - aria-label / role 단언
 */

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

import { PhotoAlbumView } from "@/components/album/PhotoAlbumView";
import type { TripPhoto } from "@/lib/types";

const NOW = "2026-05-08T00:00:00Z";

function dbPhoto(id: string, overrides: Partial<TripPhoto> = {}): TripPhoto {
  return {
    id,
    tripId: "t1",
    actorId: "user-1",
    url: `https://example.com/${id}.jpg`,
    caption: `사진 ${id}`,
    dayIndex: 0,
    sortOrder: 0,
    createdAt: NOW,
    ...overrides,
  };
}

function itineraryPhoto(id: string, overrides: Partial<TripPhoto> = {}): TripPhoto {
  return {
    id: `item-${id}`,
    tripId: "t1",
    actorId: null,
    url: `https://example.com/itin-${id}.jpg`,
    caption: `일정 사진 ${id}`,
    dayIndex: 0,
    sortOrder: 0,
    createdAt: NOW,
    ...overrides,
  };
}

/* ════════════════════════════════════════════
 * PhotoAlbumView 클릭 영역 — 사진 모두 확대 가능
 * ════════════════════════════════════════════ */

describe("PhotoAlbumView — 라이트박스 클릭 영역", () => {
  it("DB 사진 → 확대 보기 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[dbPhoto("a")]} totalDays={3} />,
    );
    expect(html).toContain("확대 보기");
  });

  it("itinerary 자동 사진도 확대 가능 (item- 접두사 무관)", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[itineraryPhoto("a")]} totalDays={3} />,
    );
    expect(html).toContain("확대 보기");
  });

  it("사진 caption 있으면 aria-label에 caption 포함", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView
        tripId="t1"
        photos={[dbPhoto("a", { caption: "푸꾸옥 일몰" })]}
        totalDays={3}
      />,
    );
    expect(html).toContain('aria-label="푸꾸옥 일몰 — 확대 보기"');
  });

  it("사진 caption 없으면 기본 aria-label", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView
        tripId="t1"
        photos={[dbPhoto("a", { caption: null })]}
        totalDays={3}
      />,
    );
    expect(html).toContain('aria-label="사진 확대 보기"');
  });

  it("3장 모두 클릭 영역 노출", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView
        tripId="t1"
        photos={[dbPhoto("a"), dbPhoto("b"), itineraryPhoto("c")]}
        totalDays={3}
      />,
    );
    const matches = html.match(/확대 보기/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("빈 photos → 클릭 영역 없음", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[]} totalDays={3} />,
    );
    expect(html).not.toContain("확대 보기");
  });
});

/* ════════════════════════════════════════════
 * PhotoAlbumView 소스 — lightbox state + 클릭 wiring
 * ════════════════════════════════════════════ */

describe("PhotoAlbumView 소스 — 라이트박스 wiring", () => {
  const SRC = fs.readFileSync(
    path.resolve(__dirname, "../../components/album/PhotoAlbumView.tsx"),
    "utf-8",
  );

  it("PhotoLightbox import", () => {
    expect(SRC).toMatch(
      /import\s+\{\s*PhotoLightbox\s*\}\s+from\s+"@\/components\/album\/PhotoLightbox"/,
    );
  });

  it("lightboxIndex state 정의", () => {
    expect(SRC).toContain("lightboxIndex");
    expect(SRC).toMatch(/setLightboxIndex/);
  });

  it("사진 클릭 → setLightboxIndex 호출 (flatIndex 인자)", () => {
    expect(SRC).toMatch(/setLightboxIndex\(flatIndex\)/);
  });

  it("flatIndex는 visiblePhotos.indexOf로 계산", () => {
    expect(SRC).toMatch(/visiblePhotos\.indexOf\(photo\)/);
  });

  it("PhotoLightbox 렌더링은 lightboxIndex !== null 가드", () => {
    expect(SRC).toMatch(/lightboxIndex\s*!==\s*null/);
  });

  it("PhotoLightbox onClose → setLightboxIndex(null)", () => {
    expect(SRC).toMatch(/onClose=\{\(\)\s*=>\s*setLightboxIndex\(null\)\}/);
  });

  it("클릭 영역 z-10 + 편집/삭제 z-30 (레이어링 회귀 가드)", () => {
    expect(SRC).toContain("z-10 cursor-zoom-in");
    expect(SRC).toContain("z-30 flex gap-1");
  });

  it("caption div는 pointer-events-none (클릭 영역 통과)", () => {
    expect(SRC).toContain("z-20 pointer-events-none");
  });
});

/* ════════════════════════════════════════════
 * PhotoLightbox 컴포넌트 — 무결성
 * ════════════════════════════════════════════ */

describe("PhotoLightbox 소스 — 핵심 동작 회귀 가드", () => {
  const SRC = fs.readFileSync(
    path.resolve(__dirname, "../../components/album/PhotoLightbox.tsx"),
    "utf-8",
  );

  it('"use client" 지시어 (Server Component onClick throw 방지)', () => {
    expect(SRC.split("\n")[0]).toContain('"use client"');
  });

  it("role=dialog + aria-modal=true + aria-label", () => {
    expect(SRC).toContain('role="dialog"');
    expect(SRC).toContain('aria-modal="true"');
    expect(SRC).toContain('aria-label="사진 확대 보기"');
  });

  it("Escape 키로 닫기", () => {
    expect(SRC).toMatch(/e\.key\s*===\s*"Escape"/);
    expect(SRC).toMatch(/onClose\(\)/);
  });

  it("ArrowLeft / ArrowRight 키 nav", () => {
    expect(SRC).toMatch(/e\.key\s*===\s*"ArrowLeft"/);
    expect(SRC).toMatch(/e\.key\s*===\s*"ArrowRight"/);
  });

  it("body scroll lock (overflow=hidden + cleanup)", () => {
    expect(SRC).toContain('document.body.style.overflow = "hidden"');
    expect(SRC).toMatch(/document\.body\.style\.overflow = prev/);
  });

  it("배경 클릭 닫기 (e.target === e.currentTarget)", () => {
    expect(SRC).toMatch(/e\.target\s*===\s*e\.currentTarget/);
  });

  it("touch swipe 임계 50px + prev/next 분기", () => {
    expect(SRC).toContain("SWIPE_THRESHOLD_PX = 50");
    expect(SRC).toMatch(/Math\.abs\(dx\)/);
  });

  it("counter 노출 (index + 1 / total)", () => {
    expect(SRC).toMatch(/\{index \+ 1\}\s*\/\s*\{photos\.length\}/);
  });

  it("close 버튼 + aria-label", () => {
    expect(SRC).toContain('aria-label="확대 보기 닫기"');
  });

  it("prev/next 버튼은 hasPrev/hasNext 가드", () => {
    expect(SRC).toContain("hasPrev");
    expect(SRC).toContain("hasNext");
    expect(SRC).toMatch(/index\s*>\s*0/);
    expect(SRC).toMatch(/index\s*<\s*photos\.length\s*-\s*1/);
  });

  it("이미지 max-h 90vh + object-contain (확대 시 비율 보존)", () => {
    expect(SRC).toContain("max-h-[90vh]");
    expect(SRC).toContain("object-contain");
  });

  it("caption 있으면 하단 그라디언트 영역에 노출", () => {
    expect(SRC).toMatch(/photo\.caption/);
    expect(SRC).toContain("from-black/80");
  });

  it("이미지 lazy loading", () => {
    expect(SRC).toContain('loading="lazy"');
  });

  it("initialIndex 음수/초과 클램프", () => {
    expect(SRC).toMatch(/Math\.max\(0,\s*Math\.min\(initialIndex,\s*photos\.length\s*-\s*1\)\)/);
  });

  it("z-[60] (라이트박스 최상위)", () => {
    expect(SRC).toContain("z-[60]");
  });
});
