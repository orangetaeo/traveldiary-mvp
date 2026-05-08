/**
 * 자율 진행 (2026-05-08) — booking 페이지 헤더 빈 spacer → /notifications Link 진화.
 *
 * PR #316 (TravelHome 알림) + PR #348 (Trip Dashboard 알림) 답습 — 빈 헤더 spacer를
 * 의미 있는 진입점으로 활성화. close button(좌)과 균형 유지하면서 알림 진입 추가.
 *
 * source-grep으로 검증 (Session N 박제 답습).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(
  resolve(process.cwd(), "app/booking/[bookingId]/page.tsx"),
  "utf-8",
);

describe("booking 헤더 — 빈 spacer 제거 + /notifications 진입", () => {
  it("빈 spacer div (`<div className=\"w-10\" />`) 제거됨", () => {
    expect(SRC).not.toMatch(/<div className="w-10"\s*\/>\s*\{\/\*\s*spacer\s*\*\/\}/);
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

  it("close button(좌측) BC 100% 보존", () => {
    expect(SRC).toContain('aria-label="내 여행 목록으로"');
    expect(SRC).toMatch(/material-symbols-outlined[^>]*>close</);
  });

  it("h1 '예약 완료' 텍스트 BC 보존", () => {
    expect(SRC).toContain("예약 완료");
  });
});

describe("booking 페이지 — 옵션 V (PR #318) BC 보존", () => {
  it("'내 일정에서 확인' + '일행에게 공유' 카피 보존", () => {
    expect(SRC).toContain("내 일정에서 확인");
    expect(SRC).toContain("일행에게 공유");
  });

  it("BLOCKER 7 stub 데모 안내 보존", () => {
    expect(SRC).toContain("데모 예약");
    expect(SRC).toContain("BLOCKER 7");
  });

  it("Klook + 다낭 바나힐 stub 데이터 보존", () => {
    expect(SRC).toContain("Klook");
    expect(SRC).toContain("다낭 바나힐");
  });
});
