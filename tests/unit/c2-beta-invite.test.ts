/**
 * C2 — 베타 초대 시스템 검증.
 *
 * 시나리오 C Phase C2: 초대 코드 랜딩 + 퍼널 ref 추적 + 관리자 대시보드.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C2 — /invite/[code] 랜딩 페이지", () => {
  const src = fs.readFileSync(
    path.resolve("app/invite/[code]/page.tsx"),
    "utf-8",
  );

  it("writeAuditLog 호출 (invite.use)", () => {
    expect(src).toContain("writeAuditLog");
    expect(src).toContain("invite.use");
  });

  it("코드 길이 제한 (보안)", () => {
    expect(src).toContain("slice(0, 32)");
  });

  it("redirect → /onboarding?ref=", () => {
    expect(src).toContain("redirect");
    expect(src).toContain("/onboarding?ref=");
  });

  it("resource: invite", () => {
    expect(src).toContain('"invite"');
  });
});

describe("C2 — 온보딩 ref 추적 통합", () => {
  const src = fs.readFileSync(
    path.resolve("app/onboarding/page.tsx"),
    "utf-8",
  );

  it("useSearchParams import", () => {
    expect(src).toContain("useSearchParams");
  });

  it("ref 파라미터 추출", () => {
    expect(src).toContain('searchParams.get("ref")');
  });

  it("view 트래킹에 ref 포함", () => {
    expect(src).toContain("ref ? { ref }");
  });

  it("submit 트래킹에 ref 포함", () => {
    expect(src).toMatch(/trackFunnelStep\("submit".*ref/);
  });

  it("complete 트래킹에 ref 포함", () => {
    expect(src).toMatch(/trackFunnelStep\("complete".*ref/);
  });
});

describe("C2 — invite.repository 구조", () => {
  const src = fs.readFileSync(
    path.resolve("lib/repositories/invite.repository.ts"),
    "utf-8",
  );

  it("getInviteSummary export", () => {
    expect(src).toContain("export async function getInviteSummary");
  });

  it("InviteSummary 타입 (totalUses + uniqueCodes + byCodes)", () => {
    expect(src).toContain("totalUses");
    expect(src).toContain("uniqueCodes");
    expect(src).toContain("byCodes");
  });

  it("invite.use 액션 필터", () => {
    expect(src).toContain("invite.use");
  });

  it("windowDays 지원", () => {
    expect(src).toContain("windowDays");
    expect(src).toContain("buildWindowCutoffFilter");
  });

  it("server-only import", () => {
    expect(src).toContain('"server-only"');
  });
});

describe("C2 — /admin/invite 대시보드", () => {
  const src = fs.readFileSync(
    path.resolve("app/admin/invite/page.tsx"),
    "utf-8",
  );

  it("assertAdminAccess 가드", () => {
    expect(src).toContain("assertAdminAccess");
  });

  it("getInviteSummary 호출", () => {
    expect(src).toContain("getInviteSummary");
  });

  it("초대 링크 형식 가이드", () => {
    expect(src).toContain("/invite/");
  });

  it("코드별 사용 섹션", () => {
    expect(src).toContain("코드별 사용");
    expect(src).toContain("summary.byCodes");
  });

  it("TimeWindowFilter 컴포넌트", () => {
    expect(src).toContain("TimeWindowFilter");
    expect(src).toContain("/admin/invite");
  });
});
