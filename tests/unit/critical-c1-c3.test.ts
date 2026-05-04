/**
 * CRITICAL C1 + C3 구조 테스트 — 사이클 CRITICAL-BATCH.
 *
 * C1: 온보딩 hardcoded 날짜 제거 → 동적 날짜 함수
 * C3: /share/[key] 보기 전용 배너 개선
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

describe("C1 — 온보딩 동적 날짜", () => {
  const src = readSrc("app/onboarding/page.tsx");

  it("hardcoded '2026-05-14' 제거", () => {
    expect(src).not.toContain('"2026-05-14"');
  });

  it("getDefaultStartDate 함수 존재", () => {
    expect(src).toContain("getDefaultStartDate");
  });

  it("formatStartDateKo 함수 존재", () => {
    expect(src).toContain("formatStartDateKo");
  });

  it("Step3 UI에 hardcoded 날짜 없음 (JSDoc 제외)", () => {
    // JSDoc 주석은 허용, 실제 JSX에서 하드코딩 제거 확인
    const lines = src.split("\n").filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("/**"));
    const nonComment = lines.join("\n");
    expect(nonComment).not.toContain('"5월 14일');
  });

  it("startDate state 사용", () => {
    expect(src).toContain("startDate");
    expect(src).toContain("startDateLabel");
  });
});

describe("C3 — 공유 페이지 보기 전용 배너", () => {
  const src = readSrc("app/share/[key]/page.tsx");

  it("보기 전용 배너 존재", () => {
    expect(src).toContain("보기 전용");
    expect(src).toContain("lock");
  });

  it("내 여행 만들기 CTA 링크", () => {
    expect(src).toContain("내 여행 만들기");
    expect(src).toContain('href="/onboarding"');
  });

  it("회색 배경 배너 스타일 (C3 DoD: 회색 배지)", () => {
    expect(src).toContain("bg-gray-100");
    expect(src).toContain("text-gray-600");
  });

  it("아이템 카드에 보기 전용 배지", () => {
    expect(src).toContain("bg-gray-200");
    // 카드 내부에 "보기 전용" 배지 존재
    const cardSection = src.slice(src.indexOf("<article"));
    expect(cardSection).toContain("보기 전용");
  });

  it("헤더 회색 배지", () => {
    expect(src).toContain("bg-gray-200 text-gray-600");
  });
});

describe("C2 — 비용 빈 상태 개선", () => {
  const src = readSrc("components/cost/CostEntriesList.tsx");

  it("아이콘 포함 빈 상태", () => {
    expect(src).toContain("receipt_long");
  });

  it("안내 문구 개선", () => {
    expect(src).toContain("위의 입력 폼에서");
  });
});
