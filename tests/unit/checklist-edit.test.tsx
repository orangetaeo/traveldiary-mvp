/**
 * Checklist Item Editing — 단위 테스트.
 *
 * 검증:
 *  - ChecklistBucketList: onEdit 미전달 시 수정 버튼 미노출
 *  - ChecklistBucketList: onEdit 전달 시 수정 버튼 aria-label 존재
 *  - ChecklistView: editChecklist import + 인라인 편집 모달 존재
 *  - actions/checklist.ts: editChecklist 함수 존재 + audit log
 *  - repository: updateChecklistItem 함수 존재
 *  - audit whitelist: checklist.edit 포함
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChecklistBucketList } from "@/components/checklist/ChecklistBucketList";
import type { ChecklistItem } from "@/lib/types";
import fs from "node:fs";
import path from "node:path";

const NOOP = () => {};
const NOW = "2026-05-08T00:00:00Z";

function item(
  id: string,
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  return {
    id,
    tripId: "t1",
    category: "essentials",
    text: `item-${id}`,
    dDayBucket: "D-30",
    done: false,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/* ════════════════════════════════════════════
 * ChecklistBucketList — onEdit 유무에 따른 수정 버튼
 * ════════════════════════════════════════════ */

describe("ChecklistBucketList — 수정 버튼", () => {
  it("onEdit 미전달 시 수정 버튼 미노출", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a")]}
        onToggle={NOOP}
        onDelete={NOOP}
      />,
    );
    expect(html).not.toContain('aria-label="수정"');
    expect(html).toContain('aria-label="삭제"');
  });

  it("onEdit 전달 시 수정 버튼 aria-label 존재", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a")]}
        onToggle={NOOP}
        onDelete={NOOP}
        onEdit={NOOP}
      />,
    );
    expect(html).toContain('aria-label="수정"');
    expect(html).toContain('aria-label="삭제"');
  });

  it("onEdit 전달 시 edit 아이콘 렌더", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a")]}
        onToggle={NOOP}
        onDelete={NOOP}
        onEdit={NOOP}
      />,
    );
    expect(html).toContain("edit");
  });

  it("selectionMode=true → onEdit 전달해도 수정 버튼 미노출", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a")]}
        onToggle={NOOP}
        onDelete={NOOP}
        onEdit={NOOP}
        selectionMode={true}
        selectedIds={new Set()}
        onSelectToggle={NOOP}
      />,
    );
    expect(html).not.toContain('aria-label="수정"');
    expect(html).not.toContain('aria-label="삭제"');
  });

  it("여러 항목 → 각각 수정 + 삭제 버튼", () => {
    const html = renderToStaticMarkup(
      <ChecklistBucketList
        items={[item("a"), item("b", { sortOrder: 1 }), item("c", { sortOrder: 2 })]}
        onToggle={NOOP}
        onDelete={NOOP}
        onEdit={NOOP}
      />,
    );
    const editCount = (html.match(/aria-label="수정"/g) || []).length;
    const deleteCount = (html.match(/aria-label="삭제"/g) || []).length;
    expect(editCount).toBe(3);
    expect(deleteCount).toBe(3);
  });
});

/* ════════════════════════════════════════════
 * ChecklistView — editChecklist 연동 확인 (소스 정적 검증)
 * ════════════════════════════════════════════ */

describe("ChecklistView — editChecklist 연동", () => {
  const src = fs.readFileSync(
    path.resolve("components/checklist/ChecklistView.tsx"),
    "utf-8",
  );

  it("editChecklist import 존재", () => {
    expect(src).toContain("editChecklist");
  });

  it("handleStartEdit 함수 정의 존재", () => {
    expect(src).toContain("handleStartEdit");
  });

  it("handleEditSubmit 함수 정의 존재", () => {
    expect(src).toContain("handleEditSubmit");
  });

  it("editingItem state 존재", () => {
    expect(src).toContain("editingItem");
  });

  it("인라인 편집 모달 존재", () => {
    expect(src).toContain("항목 수정");
    expect(src).toContain("체크리스트 항목 수정");
  });

  it("Escape 키 닫기 지원", () => {
    expect(src).toContain("Escape");
  });

  it("Enter 키 제출 지원", () => {
    expect(src).toContain("Enter");
  });

  it("optimistic update — 수정 실패 시 롤백 로직 존재", () => {
    expect(src).toContain("수정 실패");
  });

  it("onEdit를 ChecklistBucketList에 전달", () => {
    expect(src).toContain("onEdit=");
  });
});

/* ════════════════════════════════════════════
 * actions/checklist.ts — editChecklist 서버 액션
 * ════════════════════════════════════════════ */

describe("actions/checklist.ts — editChecklist", () => {
  const src = fs.readFileSync(
    path.resolve("actions/checklist.ts"),
    "utf-8",
  );

  it("editChecklist 함수 존재", () => {
    expect(src).toContain("export async function editChecklist");
  });

  it("writeAuditLog 호출 존재", () => {
    expect(src).toContain('action: "checklist.edit"');
  });

  it("updateChecklistItem import 존재", () => {
    expect(src).toContain("updateChecklistItem");
  });

  it("canWriteTripOrViaShareLink 권한 체크", () => {
    expect(src).toContain("canWriteTripOrViaShareLink");
  });
});

/* ════════════════════════════════════════════
 * repository — updateChecklistItem
 * ════════════════════════════════════════════ */

describe("checklist.repository — updateChecklistItem", () => {
  const src = fs.readFileSync(
    path.resolve("lib/repositories/checklist.repository.ts"),
    "utf-8",
  );

  it("updateChecklistItem 함수 export 존재", () => {
    expect(src).toContain("export async function updateChecklistItem");
  });

  it("UpdateChecklistResult 타입 export 존재", () => {
    expect(src).toContain("export interface UpdateChecklistResult");
  });

  it("before/after text 스냅샷 반환", () => {
    expect(src).toContain("before: { text:");
    expect(src).toContain("after: { text:");
  });

  it("not_found 분기 존재", () => {
    const matches = src.match(/not_found/g);
    expect(matches).not.toBeNull();
    // updateChecklistItem + deleteChecklistItem 등 여러 함수에서 사용
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });
});

/* ════════════════════════════════════════════
 * audit action whitelist — checklist.edit
 * ════════════════════════════════════════════ */

describe("audit whitelist — checklist.edit", () => {
  const src = fs.readFileSync(
    path.resolve("tests/unit/audit-action-codes.test.ts"),
    "utf-8",
  );

  it("checklist.edit가 화이트리스트에 포함", () => {
    expect(src).toContain('"checklist.edit"');
  });
});
