/**
 * 프로필 편집 기능 단위 테스트.
 *
 * actions/user.ts + lib/repositories/user.repository.ts 패턴 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ACTION_SRC = readFileSync(
  resolve(__dirname, "../../actions/user.ts"),
  "utf-8",
);

const REPO_SRC = readFileSync(
  resolve(__dirname, "../../lib/repositories/user.repository.ts"),
  "utf-8",
);

const COMPONENT_SRC = readFileSync(
  resolve(__dirname, "../../components/profile/ProfileEditForm.tsx"),
  "utf-8",
);

const PAGE_SRC = readFileSync(
  resolve(__dirname, "../../app/profile/page.tsx"),
  "utf-8",
);

/* ════════════════════════════════════════════
 * Server Action 패턴
 * ════════════════════════════════════════════ */

describe("actions/user.ts — 서버 액션 패턴", () => {
  it('"use server" 지시문 존재', () => {
    expect(ACTION_SRC).toContain('"use server"');
  });

  it("writeAuditLog 호출", () => {
    expect(ACTION_SRC).toContain("writeAuditLog");
  });

  it('audit action 코드 "user.update_profile"', () => {
    expect(ACTION_SRC).toContain('"user.update_profile"');
  });

  it("getActorId import", () => {
    expect(ACTION_SRC).toContain("getActorId");
  });

  it("getCurrentUserId 인증 검사", () => {
    expect(ACTION_SRC).toContain("getCurrentUserId");
  });

  it("isDbConnected 데모 가드", () => {
    expect(ACTION_SRC).toContain("isDbConnected");
  });

  it("updateUserProfile export", () => {
    expect(ACTION_SRC).toMatch(/export\s+async\s+function\s+updateUserProfile/);
  });

  it("닉네임 길이 검증 (1~80자)", () => {
    expect(ACTION_SRC).toContain("name.length < 1");
    expect(ACTION_SRC).toContain("name.length > 80");
  });

  it("forbidden 반환 (미인증 시)", () => {
    expect(ACTION_SRC).toContain('"forbidden"');
  });

  it("revalidatePath /profile 호출", () => {
    expect(ACTION_SRC).toContain('revalidatePath("/profile")');
  });
});

/* ════════════════════════════════════════════
 * Repository 패턴
 * ════════════════════════════════════════════ */

describe("user.repository.ts — updateUser", () => {
  it("updateUser export", () => {
    expect(REPO_SRC).toMatch(/export\s+async\s+function\s+updateUser/);
  });

  it("UpdateUserInput 인터페이스", () => {
    expect(REPO_SRC).toContain("UpdateUserInput");
  });

  it("prisma.user.update 호출", () => {
    expect(REPO_SRC).toContain("prisma.user.update");
  });

  it("server-only import", () => {
    expect(REPO_SRC).toContain('"server-only"');
  });

  it("에러 핸들링 (try/catch)", () => {
    expect(REPO_SRC).toContain("[user.repository] updateUser failed");
  });
});

/* ════════════════════════════════════════════
 * 클라이언트 컴포넌트 패턴
 * ════════════════════════════════════════════ */

describe("ProfileEditForm 컴포넌트", () => {
  it('"use client" 지시문', () => {
    expect(COMPONENT_SRC).toContain('"use client"');
  });

  it("updateUserProfile 서버 액션 import", () => {
    expect(COMPONENT_SRC).toContain("updateUserProfile");
  });

  it("닉네임 입력 필드 (maxLength=80)", () => {
    expect(COMPONENT_SRC).toContain("maxLength={80}");
  });

  it("에러 상태 UI", () => {
    expect(COMPONENT_SRC).toContain("닉네임을 입력해 주세요");
  });

  it("성공 상태 UI", () => {
    expect(COMPONENT_SRC).toContain("저장되었습니다");
  });

  it("모달 접근성 (role=dialog, aria-modal)", () => {
    expect(COMPONENT_SRC).toContain('role="dialog"');
    expect(COMPONENT_SRC).toContain('aria-modal="true"');
  });

  it("프로필 편집 aria-label", () => {
    expect(COMPONENT_SRC).toContain('aria-label="프로필 편집"');
  });

  it("저장 중 로딩 상태", () => {
    expect(COMPONENT_SRC).toContain("저장 중…");
  });

  it("이메일 읽기 전용 표시", () => {
    expect(COMPONENT_SRC).toContain("카카오 계정 이메일");
    expect(COMPONENT_SRC).toContain("변경 불가");
  });
});

/* ════════════════════════════════════════════
 * 프로필 페이지 통합
 * ════════════════════════════════════════════ */

describe("app/profile/page.tsx — ProfileEditForm 통합", () => {
  it("ProfileEditForm import", () => {
    expect(PAGE_SRC).toContain("ProfileEditForm");
  });

  it("currentName prop 전달", () => {
    expect(PAGE_SRC).toContain("currentName={userName}");
  });

  it("userEmail prop 전달", () => {
    expect(PAGE_SRC).toContain("userEmail={userEmail}");
  });
});
