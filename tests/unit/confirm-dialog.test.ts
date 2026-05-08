/**
 * ConfirmDialog 공용 컴포넌트 + 적용 검증.
 *
 * 1. ConfirmDialog 컴포넌트 구조
 * 2. CostView, VoteListView, ItineraryView에서 window.confirm() 제거 확인
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/* ═══════ 1. ConfirmDialog 컴포넌트 ═══════ */

const dialogSrc = fs.readFileSync(
  path.resolve("components/ui/ConfirmDialog.tsx"),
  "utf-8",
);

describe("ConfirmDialog — 공용 컴포넌트", () => {
  it("ConfirmDialog export 존재", () => {
    expect(dialogSrc).toContain("export function ConfirmDialog(");
  });

  it("ConfirmDialogProps 인터페이스 정의", () => {
    expect(dialogSrc).toContain("export interface ConfirmDialogProps");
  });

  it("role=dialog + aria-modal 접근성", () => {
    expect(dialogSrc).toContain('role="dialog"');
    expect(dialogSrc).toContain('aria-modal="true"');
  });

  it("aria-labelledby 연결", () => {
    expect(dialogSrc).toContain('aria-labelledby="confirm-dialog-title"');
    expect(dialogSrc).toContain('id="confirm-dialog-title"');
  });

  it("Escape 키 닫기 지원", () => {
    expect(dialogSrc).toContain('"Escape"');
  });

  it("배경 클릭 닫기 지원", () => {
    expect(dialogSrc).toContain("e.target === e.currentTarget");
  });

  it("isPending 중 닫기 방지", () => {
    expect(dialogSrc).toContain("!isPending");
  });

  it("danger/non-danger 스타일 분기", () => {
    expect(dialogSrc).toContain("bg-danger");
    expect(dialogSrc).toContain("bg-purple");
  });

  it("open=false일 때 null 반환", () => {
    expect(dialogSrc).toContain("if (!open) return null");
  });

  it("취소 버튼에 autoFocus (cancelRef)", () => {
    expect(dialogSrc).toContain("cancelRef");
    expect(dialogSrc).toContain("cancelRef.current?.focus()");
  });
});

/* ═══════ 2. CostView — window.confirm 제거 ═══════ */

const costSrc = fs.readFileSync(
  path.resolve("components/cost/CostView.tsx"),
  "utf-8",
);

describe("CostView — ConfirmDialog 적용", () => {
  it("window.confirm 미사용", () => {
    expect(costSrc).not.toContain("window.confirm");
    expect(costSrc).not.toMatch(/\bconfirm\(/);
  });

  it("ConfirmDialog import 존재", () => {
    expect(costSrc).toContain("ConfirmDialog");
  });

  it("deletingEntry 상태 존재", () => {
    expect(costSrc).toContain("deletingEntry");
  });

  it("handleConfirmDelete 함수 존재", () => {
    expect(costSrc).toContain("handleConfirmDelete");
  });

  it("ConfirmDialog 렌더링", () => {
    expect(costSrc).toContain("<ConfirmDialog");
    expect(costSrc).toContain('title="비용 삭제"');
  });
});

/* ═══════ 3. VoteListView — window.confirm 제거 ═══════ */

const voteSrc = fs.readFileSync(
  path.resolve("components/vote/VoteListView.tsx"),
  "utf-8",
);

describe("VoteListView — ConfirmDialog 적용", () => {
  it("window.confirm 미사용", () => {
    expect(voteSrc).not.toContain("window.confirm");
  });

  it("ConfirmDialog import 존재", () => {
    expect(voteSrc).toContain("ConfirmDialog");
  });

  it("deletingVote 상태 존재", () => {
    expect(voteSrc).toContain("deletingVote");
  });

  it("handleConfirmDeleteVote 함수 존재", () => {
    expect(voteSrc).toContain("handleConfirmDeleteVote");
  });

  it("ConfirmDialog 렌더링", () => {
    expect(voteSrc).toContain("<ConfirmDialog");
    expect(voteSrc).toContain('title="투표 삭제"');
  });
});

/* ═══════ 4. ItineraryView — window.confirm 제거 ═══════ */

const itSrc = fs.readFileSync(
  path.resolve("components/itinerary/ItineraryView.tsx"),
  "utf-8",
);

describe("ItineraryView — ConfirmDialog 적용", () => {
  it("window.confirm 미사용", () => {
    expect(itSrc).not.toContain("window.confirm");
  });

  it("ConfirmDialog import 존재", () => {
    expect(itSrc).toContain("ConfirmDialog");
  });

  it("deletingItem 상태 존재", () => {
    expect(itSrc).toContain("deletingItem");
  });

  it("handleConfirmDeleteItem 함수 존재", () => {
    expect(itSrc).toContain("handleConfirmDeleteItem");
  });

  it("ConfirmDialog 렌더링", () => {
    expect(itSrc).toContain("<ConfirmDialog");
    expect(itSrc).toContain('title="일정 삭제"');
  });
});
