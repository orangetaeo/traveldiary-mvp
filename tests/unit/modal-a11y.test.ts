/**
 * 모달/다이얼로그 접근성 검증 — aria-modal + aria-labelledby.
 *
 * 모든 role="dialog" / role="alertdialog"는 aria-modal="true" 필수.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), "utf-8");
}

/** 모든 role="dialog" 또는 role="alertdialog"에 aria-modal="true"가 있는지 검증 */
function checkAriaModal(src: string, label: string) {
  const dialogRegex = /role="(dialog|alertdialog)"/g;
  let match: RegExpExecArray | null;
  while ((match = dialogRegex.exec(src)) !== null) {
    const ctx = src.slice(Math.max(0, match.index - 100), match.index + 200);
    expect(
      ctx.includes('aria-modal="true"') || ctx.includes("aria-modal={true}"),
      `${label}: role="${match[1]}" at offset ${match.index} must have aria-modal="true"`,
    ).toBe(true);
  }
}

/* ═══════ PhotoAlbumView ═══════ */
describe("PhotoAlbumView 모달 접근성", () => {
  const src = readSrc("components/album/PhotoAlbumView.tsx");

  it("사진 추가 — aria-modal 존재", () => {
    const idx = src.indexOf('aria-label="사진 추가"');
    expect(idx).toBeGreaterThan(-1);
    const ctx = src.slice(Math.max(0, idx - 200), idx + 50);
    expect(ctx).toContain('aria-modal="true"');
  });

  it("캡션 수정 — role='dialog' + aria-modal + aria-labelledby", () => {
    const idx = src.indexOf('aria-labelledby="edit-caption-title"');
    expect(idx).toBeGreaterThan(-1);
    const ctx = src.slice(Math.max(0, idx - 200), idx + 50);
    expect(ctx).toContain('role="dialog"');
    expect(ctx).toContain('aria-modal="true"');
  });

  it("삭제 확인 — alertdialog + aria-modal", () => {
    const idx = src.indexOf('role="alertdialog"');
    expect(idx).toBeGreaterThan(-1);
    const ctx = src.slice(idx, idx + 200);
    expect(ctx).toContain('aria-modal="true"');
  });

  it("사진 추가 — Escape 키 지원", () => {
    const addModalIdx = src.indexOf('aria-label="사진 추가"');
    const chunk = src.slice(addModalIdx, addModalIdx + 500);
    expect(chunk).toContain("Escape");
  });

  it("모든 dialog에 aria-modal 포함", () => {
    checkAriaModal(src, "PhotoAlbumView");
  });
});

/* ═══════ TripClaimModal ═══════ */
describe("TripClaimModal 접근성", () => {
  const src = readSrc("components/auth/TripClaimModal.tsx");

  it("aria-modal='true' 포함", () => {
    expect(src).toContain('aria-modal="true"');
  });

  it("aria-label 포함", () => {
    expect(src).toContain('aria-label="내 여행 인계"');
  });
});

/* ═══════ ChecklistView 수정 모달 ═══════ */
describe("ChecklistView 수정 모달 접근성", () => {
  const src = readSrc("components/checklist/ChecklistView.tsx");

  it("항목 수정 — role='dialog' + aria-modal + aria-labelledby", () => {
    const idx = src.indexOf('aria-labelledby="edit-checklist-title"');
    expect(idx).toBeGreaterThan(-1);
    const ctx = src.slice(Math.max(0, idx - 200), idx + 50);
    expect(ctx).toContain('role="dialog"');
    expect(ctx).toContain('aria-modal="true"');
  });

  it("h3 title id 매칭", () => {
    expect(src).toContain('id="edit-checklist-title"');
  });
});

/* ═══════ 전체 모달 aria-modal 검사 ═══════ */
describe("전체 컴포넌트 — dialog에 aria-modal 누락 없음", () => {
  const modalFiles = [
    "components/itinerary/AddItemModal.tsx",
    "components/share/ShareModal.tsx",
    "components/modals/OtaInterstitialModal.tsx",
    "components/modals/ReplanConflictModal.tsx",
    "components/dashboard/TripDeleteButton.tsx",
    "components/profile/ProfileEditForm.tsx",
    "components/auth/LogoutConfirmModal.tsx",
    "components/auth/AccountDeleteConfirmModal.tsx",
    "components/auth/AccountDeleteWarningModal.tsx",
    "components/travel/ModeTransitionWelcome.tsx",
    "components/travel/ModeTransitionSkipSheet.tsx",
    "components/itinerary/ReplanModal.tsx",
    "components/itinerary/ItineraryCoachMark.tsx",
  ];

  for (const file of modalFiles) {
    it(`${file} — aria-modal 존재`, () => {
      const src = readSrc(file);
      checkAriaModal(src, file);
    });
  }
});
