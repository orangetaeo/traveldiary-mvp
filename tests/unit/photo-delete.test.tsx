/**
 * Photo Album Deletion — 단위 테스트.
 *
 * 검증:
 *  - DB 사진(uuid id) → 삭제 버튼 노출
 *  - itinerary 자동 사진(id "item-" 접두사) → 삭제 버튼 미노출
 *  - 사진 0장 + 빈 상태 메시지
 *  - PhotoAlbumView가 removePhoto import
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
 * 삭제 버튼 노출 — DB 사진만
 * ════════════════════════════════════════════ */

describe("PhotoAlbumView — 삭제 버튼", () => {
  it("DB 사진 → 삭제 버튼 aria-label 노출", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[dbPhoto("a")]} totalDays={3} />,
    );
    expect(html).toContain('aria-label="사진 삭제"');
  });

  it("itinerary 자동 사진(item- 접두사) → 삭제 버튼 미노출", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[itineraryPhoto("a")]} totalDays={3} />,
    );
    expect(html).not.toContain('aria-label="사진 삭제"');
  });

  it("DB + itinerary 혼합 → 삭제 버튼 1개만 (DB 사진 한정)", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView
        tripId="t1"
        photos={[dbPhoto("db-1"), itineraryPhoto("auto-1")]}
        totalDays={3}
      />,
    );
    const matches = html.match(/aria-label="사진 삭제"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("삭제 버튼은 close 아이콘 포함", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[dbPhoto("a")]} totalDays={3} />,
    );
    expect(html).toContain("close");
  });

  it("빈 photos → 삭제 버튼 없음 + 빈 상태 메시지", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[]} totalDays={3} />,
    );
    expect(html).not.toContain('aria-label="사진 삭제"');
    expect(html).toContain("아직 사진이 없어요");
  });

  it("여러 DB 사진 → 각각 삭제 버튼", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView
        tripId="t1"
        photos={[dbPhoto("a"), dbPhoto("b"), dbPhoto("c")]}
        totalDays={3}
      />,
    );
    const matches = html.match(/aria-label="사진 삭제"/g) ?? [];
    expect(matches.length).toBe(3);
  });
});

/* ════════════════════════════════════════════
 * 사진 추가 버튼 — 회귀 보호
 * ════════════════════════════════════════════ */

describe("PhotoAlbumView — 사진 추가 버튼 회귀", () => {
  it("사진 추가 버튼은 빈 상태에서도 노출", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[]} totalDays={3} />,
    );
    expect(html).toContain("사진 추가");
    expect(html).toContain("add_photo_alternate");
  });

  it("사진이 있어도 추가 버튼 유지", () => {
    const html = renderToStaticMarkup(
      <PhotoAlbumView tripId="t1" photos={[dbPhoto("a")]} totalDays={3} />,
    );
    expect(html).toContain("사진 추가");
  });
});

/* ════════════════════════════════════════════
 * 소스 단언 — removePhoto wiring + 옵티미스틱 패턴
 * ════════════════════════════════════════════ */

describe("PhotoAlbumView 소스 — removePhoto wiring", () => {
  const SRC = fs.readFileSync(
    path.resolve(__dirname, "../../components/album/PhotoAlbumView.tsx"),
    "utf-8",
  );

  it("removePhoto를 actions/photo에서 import", () => {
    expect(SRC).toMatch(/import\s+\{[^}]*removePhoto[^}]*\}\s+from\s+"@\/actions\/photo"/);
  });

  it("addPhoto도 함께 import (회귀 가드)", () => {
    expect(SRC).toMatch(/import\s+\{[^}]*addPhoto[^}]*\}\s+from\s+"@\/actions\/photo"/);
  });

  it("isDeletablePhoto 헬퍼로 item- 접두사 차단", () => {
    expect(SRC).toContain("function isDeletablePhoto");
    expect(SRC).toContain('photo.id.startsWith("item-")');
  });

  it("옵티미스틱 hidden Set + router.refresh 패턴", () => {
    expect(SRC).toContain("optimisticHidden");
    expect(SRC).toContain("router.refresh");
  });

  it("실패 시 hidden 롤백", () => {
    expect(SRC).toMatch(/next\.delete\(photoId\)/);
  });

  it("alertdialog role + 삭제 확인 모달", () => {
    expect(SRC).toContain('role="alertdialog"');
    expect(SRC).toContain("사진을 삭제할까요");
  });
});

/* ════════════════════════════════════════════
 * actions/photo 소스 — removePhoto 무결성
 * ════════════════════════════════════════════ */

describe("actions/photo.ts — removePhoto 회귀 가드", () => {
  const SRC = fs.readFileSync(
    path.resolve(__dirname, "../../actions/photo.ts"),
    "utf-8",
  );

  it("removePhoto export 존재", () => {
    expect(SRC).toMatch(/export\s+async\s+function\s+removePhoto/);
  });

  it("감사 로그 photo.delete 작성", () => {
    expect(SRC).toContain('action: "photo.delete"');
  });

  it("canWriteTripOrViaShareLink 권한 체크", () => {
    expect(SRC).toMatch(/canWriteTripOrViaShareLink\(input\.tripId/);
  });

  it("revalidatePath wrap-up + album 두 경로", () => {
    expect(SRC).toContain("/wrap-up/${input.tripId}");
    expect(SRC).toContain("/wrap-up/${input.tripId}/album");
  });
});
