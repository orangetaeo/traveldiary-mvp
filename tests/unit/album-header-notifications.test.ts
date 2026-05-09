/**
 * 자율 진행 (2026-05-08) — /wrap-up/[tripId]/album 헤더 빈 spacer → /notifications Link 진화.
 *
 * PR #291 → #348 → #311 → #368 → #370 답습 (6번째). 빈 헤더 spacer
 * (`<div className="w-10" />` PR #368 변형)을 의미 있는 알림 진입점으로 활성화.
 *
 * source-grep으로 검증 (feedback_empty_header_spacer_pattern 박제 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/wrap-up/[tripId]/album/page.tsx"),
  "utf-8",
);

describe("/wrap-up/[tripId]/album 헤더 — 빈 spacer 제거 + /notifications 진입", () => {
  it("빈 spacer div (`<div className=\"w-10\" />`) 제거됨", () => {
    expect(SRC).not.toMatch(/<div className="w-10"\s*\/>\s*\{\/\*\s*spacer\s*\*\/\}/);
    expect(SRC).not.toMatch(/<div className="w-10"\s*\/>/);
  });

  it("/notifications Link 진입 추가됨", () => {
    expect(SRC).toContain('href="/notifications"');
  });

  it("aria-label '알림' 명시 (스크린 리더 명확화)", () => {
    expect(SRC).toContain('aria-label="알림"');
  });

  it("notifications material symbol 아이콘 사용", () => {
    expect(SRC).toMatch(/material-symbols-outlined[^>]*>notifications</);
  });

  it("좌측 arrow_back Link (마무리 페이지로) BC 100% 보존", () => {
    expect(SRC).toContain("href={`/wrap-up/${trip.id}`}");
    expect(SRC).toContain('aria-label="마무리 페이지로 돌아가기"');
    expect(SRC).toMatch(/material-symbols-outlined[^>]*>arrow_back</);
  });

  it("h1 '사진 앨범' 텍스트 BC 보존", () => {
    expect(SRC).toContain("사진 앨범");
  });
});

describe("/wrap-up/[tripId]/album 페이지 — E3 앨범 기능 BC 보존", () => {
  it("PhotoAlbumView 컴포넌트 사용 BC 보존", () => {
    expect(SRC).toContain("PhotoAlbumView");
  });

  it("getPhotos action 호출 BC 보존 (DB 사진 로드)", () => {
    expect(SRC).toContain("getPhotos(trip.id)");
  });

  it("ItineraryItem.photos[] 자동 수집 + URL 중복 제거 BC 보존", () => {
    expect(SRC).toContain("itineraryPhotos");
    expect(SRC).toContain("seenUrls");
  });

  it("Hero 섹션 도시명/박일/사진 수 표시 BC 보존", () => {
    expect(SRC).toContain("city.name");
    expect(SRC).toContain("trip.nights");
    expect(SRC).toContain("allPhotos.length");
  });
});
