/**
 * lib/auth/account-delete-shared.ts 단위 테스트.
 *
 * ACCOUNT_DELETE_CONFIRM_PHRASE + isValidAccountDeleteConfirm 검증.
 */

import { describe, it, expect } from "vitest";
import {
  ACCOUNT_DELETE_CONFIRM_PHRASE,
  isValidAccountDeleteConfirm,
} from "@/lib/auth/account-delete-shared";

describe("account-delete-shared", () => {
  it("PHRASE 상수값 = '계정 삭제'", () => {
    expect(ACCOUNT_DELETE_CONFIRM_PHRASE).toBe("계정 삭제");
  });

  it("정확한 문구 → true", () => {
    expect(isValidAccountDeleteConfirm("계정 삭제")).toBe(true);
  });

  it("앞뒤 공백 → trim 후 통과", () => {
    expect(isValidAccountDeleteConfirm("  계정 삭제  ")).toBe(true);
  });

  it("빈 문자열 → false", () => {
    expect(isValidAccountDeleteConfirm("")).toBe(false);
  });

  it("다른 문자열 → false", () => {
    expect(isValidAccountDeleteConfirm("탈퇴")).toBe(false);
  });

  it("null → false", () => {
    expect(isValidAccountDeleteConfirm(null)).toBe(false);
  });

  it("undefined → false", () => {
    expect(isValidAccountDeleteConfirm(undefined)).toBe(false);
  });

  it("숫자 → false", () => {
    expect(isValidAccountDeleteConfirm(123)).toBe(false);
  });

  it("부분 일치 → false", () => {
    expect(isValidAccountDeleteConfirm("계정")).toBe(false);
  });
});
