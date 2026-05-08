/**
 * admin/logs 감사 로그 뷰어 — 소스 grep 테스트.
 *
 * 리포지토리 + 페이지 소스를 직접 읽어 패턴 준수 검증.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const REPO_SRC = fs.readFileSync(
  path.resolve("lib/repositories/audit-log.repository.ts"),
  "utf-8",
);
const PAGE_SRC = fs.readFileSync(
  path.resolve("app/admin/logs/page.tsx"),
  "utf-8",
);
const ADMIN_SRC = fs.readFileSync(
  path.resolve("app/admin/page.tsx"),
  "utf-8",
);

/* ════════════════════════════════════════════
 * Repository 패턴
 * ════════════════════════════════════════════ */

describe("audit-log.repository — 구조", () => {
  it("server-only import 존재", () => {
    expect(REPO_SRC).toContain('"server-only"');
  });

  it("prisma import 존재", () => {
    expect(REPO_SRC).toContain('from "../prisma"');
  });

  it("prisma 미연결 시 null 반환", () => {
    expect(REPO_SRC).toContain("if (!prisma) return null");
  });

  it("buildWindowCutoffFilter 사용", () => {
    expect(REPO_SRC).toContain("buildWindowCutoffFilter");
  });

  it("listAuditLogs 함수 export", () => {
    expect(REPO_SRC).toMatch(/export async function listAuditLogs/);
  });

  it("try/catch 에러 핸들링", () => {
    expect(REPO_SRC).toContain("catch");
    expect(REPO_SRC).toContain("console.error");
  });

  it("페이지네이션 지원 (limit + offset)", () => {
    expect(REPO_SRC).toContain("take:");
    expect(REPO_SRC).toContain("skip:");
  });

  it("총 건수 카운트 반환", () => {
    expect(REPO_SRC).toContain(".count(");
  });

  it("createdAt 내림차순 정렬", () => {
    expect(REPO_SRC).toContain('createdAt: "desc"');
  });

  it("actionPrefix startsWith 필터", () => {
    expect(REPO_SRC).toContain("startsWith");
  });
});

/* ════════════════════════════════════════════
 * Page 패턴
 * ════════════════════════════════════════════ */

describe("admin/logs/page.tsx — 구조", () => {
  it("assertAdminAccess 호출", () => {
    expect(PAGE_SRC).toContain("assertAdminAccess");
  });

  it("force-dynamic 설정", () => {
    expect(PAGE_SRC).toContain('"force-dynamic"');
  });

  it("isDbConnected 가드", () => {
    expect(PAGE_SRC).toContain("isDbConnected");
  });

  it("listAuditLogs 호출", () => {
    expect(PAGE_SRC).toContain("listAuditLogs");
  });

  it("TimeWindowFilter 사용", () => {
    expect(PAGE_SRC).toContain("TimeWindowFilter");
  });

  it("parseWindow 사용", () => {
    expect(PAGE_SRC).toContain("parseWindow");
  });

  it("페이지네이션 UI 존재", () => {
    expect(PAGE_SRC).toContain("이전");
    expect(PAGE_SRC).toContain("다음");
  });

  it("DB 미연결 안내 존재", () => {
    expect(PAGE_SRC).toContain("DB 미연결");
  });

  it("빈 결과 안내 존재", () => {
    expect(PAGE_SRC).toContain("조회 결과 없음");
  });

  it("action prefix 필터 칩 존재", () => {
    expect(PAGE_SRC).toContain("액션 필터");
    expect(PAGE_SRC).toContain("Trip");
    expect(PAGE_SRC).toContain("Auth");
  });
});

describe("admin/logs/page.tsx — 접근성", () => {
  it("aria-label 페이지 탐색", () => {
    expect(PAGE_SRC).toContain('aria-label="페이지 탐색"');
  });

  it("aria-label 액션 필터", () => {
    expect(PAGE_SRC).toContain('aria-label="액션 필터"');
  });

  it("Admin 대시보드 복귀 링크", () => {
    expect(PAGE_SRC).toContain("Admin 대시보드로 돌아가기");
  });

  it("role=radiogroup (액션 필터)", () => {
    expect(PAGE_SRC).toContain('role="radiogroup"');
  });
});

/* ════════════════════════════════════════════
 * Admin 대시보드 연결
 * ════════════════════════════════════════════ */

describe("admin/page.tsx — 로그 뷰어 연결", () => {
  it("모든 로그 보기 → /admin/logs Link", () => {
    expect(ADMIN_SRC).toContain("/admin/logs");
    expect(ADMIN_SRC).toContain("모든 로그 보기");
  });

  it("keyParam 전달", () => {
    // Link href에 keyParam이 포함되어야 함
    expect(ADMIN_SRC).toMatch(/href=\{`\/admin\/logs\$\{keyParam\}`\}/);
  });
});

/* ════════════════════════════════════════════
 * Action 필터 목록 검증
 * ════════════════════════════════════════════ */

describe("admin/logs — action 필터 완전성", () => {
  const EXPECTED_PREFIXES = [
    "trip",
    "itinerary",
    "cost",
    "checklist",
    "share",
    "comment",
    "auth",
    "affiliate",
    "replan",
    "funnel",
  ];

  it.each(EXPECTED_PREFIXES)("필터에 %s prefix 존재", (prefix) => {
    expect(PAGE_SRC).toContain(`prefix: "${prefix}"`);
  });
});
