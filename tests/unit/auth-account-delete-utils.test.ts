/**
 * 사이클 8 (G3, ADR-049) — 계정 삭제 유틸리티 순수 함수 단위 테스트.
 *
 * - ACCOUNT_DELETE_CONFIRM_PHRASE: 한국어 정확히 일치 필수
 * - isValidAccountDeleteConfirm: 트림 후 정확 일치만 true
 * - audit.account_delete enum 정합 (audit-log AuditAction에 포함)
 */

import { describe, it, expect } from "vitest";
import {
  ACCOUNT_DELETE_CONFIRM_PHRASE,
  isValidAccountDeleteConfirm,
} from "@/lib/auth/account-delete";
import type { AuditAction } from "@/lib/audit-log";

describe("ACCOUNT_DELETE_CONFIRM_PHRASE", () => {
  it("한국어 '계정 삭제'로 박제", () => {
    expect(ACCOUNT_DELETE_CONFIRM_PHRASE).toBe("계정 삭제");
  });
});

describe("isValidAccountDeleteConfirm", () => {
  it("정확 일치 → true", () => {
    expect(isValidAccountDeleteConfirm("계정 삭제")).toBe(true);
  });

  it("앞뒤 공백은 trim 후 일치 → true", () => {
    expect(isValidAccountDeleteConfirm("  계정 삭제  ")).toBe(true);
    expect(isValidAccountDeleteConfirm("\n계정 삭제\t")).toBe(true);
  });

  it("부분 일치 → false", () => {
    expect(isValidAccountDeleteConfirm("계정")).toBe(false);
    expect(isValidAccountDeleteConfirm("삭제")).toBe(false);
    expect(isValidAccountDeleteConfirm("계정삭제")).toBe(false);
  });

  it("영문/오타 → false", () => {
    expect(isValidAccountDeleteConfirm("DELETE")).toBe(false);
    expect(isValidAccountDeleteConfirm("계정 삭재")).toBe(false);
  });

  it("non-string → false (replay 방어)", () => {
    expect(isValidAccountDeleteConfirm(undefined)).toBe(false);
    expect(isValidAccountDeleteConfirm(null)).toBe(false);
    expect(isValidAccountDeleteConfirm(123)).toBe(false);
    expect(isValidAccountDeleteConfirm({ confirm: "계정 삭제" })).toBe(false);
    expect(isValidAccountDeleteConfirm(["계정 삭제"])).toBe(false);
  });

  it("빈 문자열 → false", () => {
    expect(isValidAccountDeleteConfirm("")).toBe(false);
    expect(isValidAccountDeleteConfirm("   ")).toBe(false);
  });
});

describe("AuditAction enum 정합", () => {
  it("auth.account_delete가 AuditAction에 포함됨", () => {
    const action: AuditAction = "auth.account_delete";
    expect(action).toBe("auth.account_delete");
  });
});

describe("anonymizeUserAccount — atomicity (T13 Major fix)", () => {
  it("audit log 호출이 트랜잭션 내부 (tx.auditLog.create)에 박제", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve("lib/auth/account-delete.ts"),
      "utf-8",
    );
    expect(src).toContain("tx.auditLog.create");
    // S-13 atomicity — 외부 writeAuditLog 호출 금지 (tx 외부 호출 시 부분 실패 창 발생)
    expect(src).not.toContain("writeAuditLog(");
    // tx 내부 trip reassign + member delete + user update + auditLog.create 4 단계
    expect(src).toContain("tx.trip.updateMany");
    expect(src).toContain("tx.tripMember.deleteMany");
    expect(src).toContain("tx.user.update");
  });

  it("preferences NULL은 Prisma.JsonNull로 (T13 Minor fix)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve("lib/auth/account-delete.ts"),
      "utf-8",
    );
    expect(src).toContain("preferences: Prisma.JsonNull");
    expect(src).not.toContain("preferences: null as never");
  });

  it("reassignedTripIds 보존 (사이클 10 — 운영자 복구 SQL 입력)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.resolve("lib/auth/account-delete.ts"),
      "utf-8",
    );
    // 사이클 10 보강: tx.trip.findMany로 reassign 대상 ID 조회 + audit metadata 보존
    expect(src).toContain("tx.trip.findMany");
    expect(src).toContain("reassignedTripIds");
    // 박제 50 cap (feedback_bulk_mutation_pattern)
    expect(src).toContain("take: 50");
  });
});
