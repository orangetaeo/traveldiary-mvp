/**
 * C2 — 빈 상태 가이드 구조 검증.
 *
 * /cost, /checklist 빈 상태에서 "첫 항목 추가" 명시 CTA.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C2 — Cost 빈 상태 CTA", () => {
  const src = fs.readFileSync(
    path.resolve("components/cost/CostEntriesList.tsx"),
    "utf-8",
  );

  it("첫 비용 기록하기 CTA 버튼", () => {
    expect(src).toContain("첫 비용 기록하기");
  });

  it("scroll to form 동작", () => {
    expect(src).toContain("add-cost-form");
    expect(src).toContain("scrollIntoView");
  });

  it("안내 메시지 포함", () => {
    expect(src).toContain("아직 입력된 비용이 없어요");
  });
});

describe("C2 — Cost AddCostForm id 추가", () => {
  const src = fs.readFileSync(
    path.resolve("components/cost/AddCostForm.tsx"),
    "utf-8",
  );

  it("add-cost-form id 속성", () => {
    expect(src).toContain('id="add-cost-form"');
  });
});

describe("C2 — Checklist 빈 상태 CTA", () => {
  const src = fs.readFileSync(
    path.resolve("components/checklist/ChecklistEmptyState.tsx"),
    "utf-8",
  );

  it("기본 템플릿 추가 CTA 유지", () => {
    expect(src).toContain("기본 템플릿 추가");
  });

  it("직접 추가하기 보조 CTA", () => {
    expect(src).toContain("직접 추가하기");
  });

  it("onAddManual props 선언", () => {
    expect(src).toContain("onAddManual");
  });

  it("아이콘 포함", () => {
    expect(src).toContain("checklist");
  });
});

describe("C2 — Checklist AddChecklistForm id 추가", () => {
  const src = fs.readFileSync(
    path.resolve("components/checklist/AddChecklistForm.tsx"),
    "utf-8",
  );

  it("add-checklist-form id 속성", () => {
    expect(src).toContain('id="add-checklist-form"');
  });
});

describe("C2 — ChecklistView 빈 상태 → 직접 추가 연결", () => {
  const src = fs.readFileSync(
    path.resolve("components/checklist/ChecklistView.tsx"),
    "utf-8",
  );

  it("onAddManual 콜백 전달", () => {
    expect(src).toContain("onAddManual");
    expect(src).toContain("add-checklist-form");
    expect(src).toContain("scrollIntoView");
  });
});
