/**
 * 이미지 lazy loading 검증.
 *
 * 모든 <img> 태그에 loading="lazy" 또는 loading="eager"(의도적)가 있어야 함.
 * hero 이미지처럼 eager가 필요한 경우만 예외.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), "utf-8");
}

/**
 * 파일 내 모든 <img 태그에 loading= 속성이 있는지 검사.
 * 없으면 위치를 포함한 에러 메시지 반환.
 */
function checkImgLoading(src: string, label: string): void {
  const imgRegex = /<img\b/g;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(src)) !== null) {
    // img 태그 종료까지 500자 내에서 loading= 존재 확인
    const chunk = src.slice(match.index, match.index + 500);
    const closingIdx = chunk.indexOf("/>");
    const tagContent = closingIdx > 0 ? chunk.slice(0, closingIdx) : chunk;
    expect(
      tagContent.includes('loading="lazy"') || tagContent.includes('loading="eager"'),
      `${label}: <img> at offset ${match.index} must have loading="lazy" or loading="eager"`,
    ).toBe(true);
  }
}

describe("이미지 lazy loading 적용 검증", () => {
  const files = [
    "components/album/PhotoAlbumView.tsx",
    "components/recap/PostTripRecapView.tsx",
    "components/itinerary/PlaceDiscoveryView.tsx",
    "components/auth/TripClaimModal.tsx",
    "components/cost/ReceiptScanView.tsx",
    "app/share/[key]/page.tsx",
    "app/itinerary/[id]/item/[itemId]/page.tsx",
  ];

  for (const file of files) {
    it(`${file} — 모든 <img>에 loading 속성 포함`, () => {
      const src = readSrc(file);
      checkImgLoading(src, file);
    });
  }
});

describe("개별 이미지 lazy 확인", () => {
  it("PostTripRecapView — loading='lazy'", () => {
    const src = readSrc("components/recap/PostTripRecapView.tsx");
    expect(src).toContain('loading="lazy"');
  });

  it("PlaceDiscoveryView — loading='lazy'", () => {
    const src = readSrc("components/itinerary/PlaceDiscoveryView.tsx");
    expect(src).toContain('loading="lazy"');
  });

  it("TripClaimModal — loading='lazy'", () => {
    const src = readSrc("components/auth/TripClaimModal.tsx");
    expect(src).toContain('loading="lazy"');
  });

  it("ReceiptScanView — loading='lazy'", () => {
    const src = readSrc("components/cost/ReceiptScanView.tsx");
    expect(src).toContain('loading="lazy"');
  });

  it("share/[key] — loading='lazy'", () => {
    const src = readSrc("app/share/[key]/page.tsx");
    expect(src).toContain('loading="lazy"');
  });

  it("item detail hero — loading='eager' (의도적)", () => {
    const src = readSrc("app/itinerary/[id]/item/[itemId]/page.tsx");
    expect(src).toContain('loading="eager"');
  });
});
