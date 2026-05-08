/**
 * Cost Entry Editing — 단위 테스트.
 *
 * 검증:
 *  - CostEntriesList: onEdit 미전달 시 수정 버튼 미노출
 *  - CostEntriesList: onEdit 전달 시 수정 버튼 aria-label 존재
 *  - AddCostForm: editEntry 전달 시 "비용 수정" 타이틀 + "수정" 버튼
 *  - AddCostForm: editEntry 전달 시 "취소" 버튼 노출
 *  - AddCostForm: isPending + editMode → "수정 중…"
 *  - AddCostForm: editEntry 미전달 시 기존 "비용 추가" 유지
 *  - CostView: updateCost import 존재
 *  - CostView: onEdit 콜백 → scrollIntoView 호출 (form 연동)
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CostEntriesList } from "@/components/cost/CostEntriesList";
import { AddCostForm } from "@/components/cost/AddCostForm";
import type { CostEntry } from "@/lib/types";
import fs from "node:fs";
import path from "node:path";

const NOOP = () => {};
const NOW = "2026-05-08T00:00:00Z";

function entry(
  id: string,
  overrides: Partial<CostEntry> = {},
): CostEntry {
  return {
    id,
    tripId: "t1",
    date: "2026-05-08",
    label: `entry-${id}`,
    amountKrw: 10_000,
    status: "paid",
    category: "food",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/* ════════════════════════════════════════════
 * CostEntriesList — onEdit 유무에 따른 수정 버튼
 * ════════════════════════════════════════════ */

describe("CostEntriesList — 수정 버튼", () => {
  it("onEdit 미전달 시 수정 버튼 미노출", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList entries={[entry("a")]} onDelete={NOOP} />,
    );
    expect(html).not.toContain('aria-label="수정"');
    expect(html).toContain('aria-label="삭제"');
  });

  it("onEdit 전달 시 수정 버튼 aria-label 존재", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList entries={[entry("a")]} onDelete={NOOP} onEdit={NOOP} />,
    );
    expect(html).toContain('aria-label="수정"');
    expect(html).toContain('aria-label="삭제"');
  });

  it("onEdit 전달 시 edit 아이콘 렌더", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList entries={[entry("a")]} onDelete={NOOP} onEdit={NOOP} />,
    );
    expect(html).toContain("edit");
  });

  it("빈 entries → 수정 버튼 없음 (빈 상태 메시지만)", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList entries={[]} onDelete={NOOP} onEdit={NOOP} />,
    );
    expect(html).not.toContain('aria-label="수정"');
    expect(html).toContain("아직 입력된 비용이 없어요");
  });

  it("여러 entry → 각각 수정 + 삭제 버튼", () => {
    const html = renderToStaticMarkup(
      <CostEntriesList
        entries={[entry("a"), entry("b"), entry("c")]}
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
 * AddCostForm — 편집 모드
 * ════════════════════════════════════════════ */

describe("AddCostForm — 편집 모드", () => {
  const editTarget = entry("edit-1", {
    label: "반미 점심",
    amountKrw: 5_500,
    amountLocal: { value: 110_000, currency: "VND" },
    category: "food",
    status: "paid",
    date: "2026-05-08",
  });

  it("editEntry 전달 → '비용 수정' 타이틀", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        editEntry={editTarget}
        onCancelEdit={NOOP}
      />,
    );
    expect(html).toContain("비용 수정");
    expect(html).not.toContain("비용 추가");
  });

  it("editEntry 전달 → '수정' 제출 버튼", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        editEntry={editTarget}
        onCancelEdit={NOOP}
      />,
    );
    // "수정" 버튼 존재 (not "비용 추가")
    expect(html).toMatch(/>수정</);
  });

  it("editEntry 전달 → '취소' 버튼 노출", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        editEntry={editTarget}
        onCancelEdit={NOOP}
      />,
    );
    expect(html).toContain("취소");
  });

  it("isPending + editMode → '수정 중…'", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={true}
        onSubmit={NOOP}
        onError={NOOP}
        editEntry={editTarget}
        onCancelEdit={NOOP}
      />,
    );
    expect(html).toContain("수정 중…");
    expect(html).not.toContain("추가 중…");
  });

  it("editEntry 미전달 → 기존 '비용 추가' 유지", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
      />,
    );
    expect(html).toContain("비용 추가");
    expect(html).not.toContain("비용 수정");
    expect(html).not.toContain("취소");
  });

  it("editEntry=null → 추가 모드 유지", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        editEntry={null}
        onCancelEdit={NOOP}
      />,
    );
    expect(html).toContain("비용 추가");
    expect(html).not.toContain("비용 수정");
  });

  it("editEntry label 값이 input value에 프리필됨", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        editEntry={editTarget}
        onCancelEdit={NOOP}
      />,
    );
    expect(html).toContain('value="반미 점심"');
  });

  it("editEntry amountKrw 값이 input value에 프리필됨", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        editEntry={editTarget}
        onCancelEdit={NOOP}
      />,
    );
    expect(html).toContain('value="5500"');
  });

  it("editEntry amountLocal 값이 input value에 프리필됨", () => {
    const html = renderToStaticMarkup(
      <AddCostForm
        currency="VND"
        currencySymbol="₫"
        approxKrwRate={20}
        isPending={false}
        onSubmit={NOOP}
        onError={NOOP}
        editEntry={editTarget}
        onCancelEdit={NOOP}
      />,
    );
    expect(html).toContain('value="110000"');
  });
});

/* ════════════════════════════════════════════
 * CostView — updateCost 연동 확인 (소스 코드 정적 검증)
 * ════════════════════════════════════════════ */

describe("CostView — updateCost 연동", () => {
  const src = fs.readFileSync(
    path.resolve("components/cost/CostView.tsx"),
    "utf-8",
  );

  it("updateCost import 존재", () => {
    expect(src).toContain("updateCost");
  });

  it("handleEdit 함수 정의 존재", () => {
    expect(src).toContain("handleEdit");
  });

  it("editingEntry state 존재", () => {
    expect(src).toContain("editingEntry");
  });

  it("onEdit 콜백 → scrollIntoView 호출 (form 연동)", () => {
    expect(src).toContain("scrollIntoView");
  });

  it("editEntry prop을 AddCostForm에 전달", () => {
    expect(src).toContain("editEntry={editingEntry}");
  });

  it("onCancelEdit 콜백을 AddCostForm에 전달", () => {
    expect(src).toContain("onCancelEdit=");
  });

  it("onEdit 콜백을 CostEntriesList에 전달", () => {
    expect(src).toContain("onEdit=");
  });

  it("optimistic update — 수정 실패 시 롤백 로직 존재", () => {
    expect(src).toContain("수정 실패");
  });
});
