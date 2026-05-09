/**
 * /settings/data-export placeholder shell — Stitch 시안 `f8d3d50e` 매핑.
 * 박제 패턴 답습: components/legal/LegalPlaceholderShell (사이클 7 G10).
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("/settings/data-export — placeholder shell", () => {
  const src = fs.readFileSync(
    path.resolve("app/settings/data-export/page.tsx"),
    "utf-8",
  );

  it("파일 존재 + 헤더 타이틀", () => {
    expect(src.length).toBeGreaterThan(0);
    expect(src).toContain("내 데이터 내보내기");
  });

  it("설정 복귀 — PlaceholderShell wrap + default backHref('/settings')", () => {
    // PR #265 PlaceholderShell DRY 추출 후 — back link는 PlaceholderShell 내부.
    // page.tsx는 default backHref 사용(=/settings) → backHref override 미지정으로 검증.
    expect(src).toContain("PlaceholderShell");
    expect(src).not.toContain("backHref=");
  });

  it("Hero 메시지 (한국어, 사이클 U-shell-dry: PlaceholderShell description)", () => {
    expect(src).toContain("JSON 파일로 다운로드해서 백업");
    expect(src).toContain("JSON 파일로 다운로드");
  });

  it("GDPR 사용자 권리 명시", () => {
    expect(src).toMatch(/GDPR.*개인정보보호법/);
  });

  it("포함되는 데이터 6 항목 (trip / 일정 / 비용 / 체크리스트 / 댓글 / 감사 로그)", () => {
    expect(src).toContain("내 trip 목록");
    expect(src).toContain("일정 항목");
    expect(src).toContain("비용 기록");
    expect(src).toContain("체크리스트");
    expect(src).toContain("댓글·리액션");
    expect(src).toContain("감사 로그");
  });

  it("포함되지 않는 데이터 3 항목", () => {
    expect(src).toContain("다른 사용자 정보");
    expect(src).toContain("외부 API 응답 캐시");
    expect(src).toContain("시스템 메타데이터");
  });

  it("데이터 보호 안내 노트 + audit log 정책", () => {
    expect(src).toContain("데이터 보호 안내");
    expect(src).toContain("GDPR");
    expect(src).toContain("ADR-046");
  });

  it("DataExportButton 컴포넌트 포함 (실행 가능)", () => {
    expect(src).toContain("DataExportButton");
  });

  it("audit log 30일 기록 정책 명시", () => {
    expect(src).toMatch(/30일.*audit log/);
  });

  it("Server Component (no 'use client')", () => {
    expect(src).not.toContain('"use client"');
  });
});

describe("/settings 페이지 — 데드 링크 청소 (사이클 U-3)", () => {
  const src = fs.readFileSync(
    path.resolve("app/settings/page.tsx"),
    "utf-8",
  );

  it("'내 데이터 내보내기' 링크는 더 이상 데드 링크 아님", () => {
    expect(src).toContain('"/settings/data-export"');
    expect(src).not.toMatch(/label: "내 데이터 내보내기", href: "#"/);
  });
});
