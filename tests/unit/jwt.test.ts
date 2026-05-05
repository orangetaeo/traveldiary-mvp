/**
 * JWT 발급/검증 테스트 — Batch 8.
 *
 * lib/auth/jwt.ts: signToken, verifyToken, jwtAvailable.
 * jose 라이브러리 실 사용 — env JWT_SECRET으로 분기.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const VALID_SECRET = "test-secret-key-minimum-32-characters-long!!";

describe("auth — jwt", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("jwtAvailable", () => {
    it("JWT_SECRET 미설정 → false", async () => {
      delete process.env.JWT_SECRET;
      const { jwtAvailable } = await import("@/lib/auth/jwt");
      expect(jwtAvailable()).toBe(false);
    });

    it("JWT_SECRET 32자 미만 → false", async () => {
      process.env.JWT_SECRET = "too-short";
      const { jwtAvailable } = await import("@/lib/auth/jwt");
      expect(jwtAvailable()).toBe(false);
    });

    it("JWT_SECRET 32자 이상 → true", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { jwtAvailable } = await import("@/lib/auth/jwt");
      expect(jwtAvailable()).toBe(true);
    });
  });

  describe("signToken", () => {
    it("secret 없으면 → null", async () => {
      delete process.env.JWT_SECRET;
      const { signToken } = await import("@/lib/auth/jwt");
      const result = await signToken("user-1", "access");
      expect(result).toBeNull();
    });

    it("access 토큰 생성 → JWT 문자열", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { signToken } = await import("@/lib/auth/jwt");
      const token = await signToken("user-123", "access");
      expect(token).not.toBeNull();
      expect(token!.split(".").length).toBe(3); // JWT 3 파트
    });

    it("refresh 토큰 생성 → JWT 문자열", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { signToken } = await import("@/lib/auth/jwt");
      const token = await signToken("user-456", "refresh");
      expect(token).not.toBeNull();
      expect(token!.split(".").length).toBe(3);
    });
  });

  describe("verifyToken", () => {
    it("secret 없으면 → null", async () => {
      delete process.env.JWT_SECRET;
      const { verifyToken } = await import("@/lib/auth/jwt");
      const result = await verifyToken("fake.jwt.token");
      expect(result).toBeNull();
    });

    it("유효한 access 토큰 → payload 반환", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { signToken, verifyToken } = await import("@/lib/auth/jwt");
      const token = await signToken("user-abc", "access");
      expect(token).not.toBeNull();

      const payload = await verifyToken(token!);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe("user-abc");
      expect(payload!.type).toBe("access");
    });

    it("유효한 refresh 토큰 → payload 반환", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { signToken, verifyToken } = await import("@/lib/auth/jwt");
      const token = await signToken("user-def", "refresh");

      const payload = await verifyToken(token!);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe("user-def");
      expect(payload!.type).toBe("refresh");
    });

    it("변조된 토큰 → null", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { signToken, verifyToken } = await import("@/lib/auth/jwt");
      const token = await signToken("user-x", "access");
      // 시그니처 부분을 완전히 다른 값으로 교체
      const parts = token!.split(".");
      parts[2] = "AAAA" + parts[2].slice(4).split("").reverse().join("");
      const tampered = parts.join(".");

      const payload = await verifyToken(tampered);
      expect(payload).toBeNull();
    });

    it("다른 secret으로 서명된 토큰 → null", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { signToken } = await import("@/lib/auth/jwt");
      const token = await signToken("user-y", "access");

      // secret 변경 후 검증
      vi.resetModules();
      process.env.JWT_SECRET = "different-secret-that-is-also-32-characters!";
      const { verifyToken } = await import("@/lib/auth/jwt");
      const payload = await verifyToken(token!);
      expect(payload).toBeNull();
    });

    it("빈 문자열 토큰 → null", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { verifyToken } = await import("@/lib/auth/jwt");
      const payload = await verifyToken("");
      expect(payload).toBeNull();
    });

    it("잘못된 형식 토큰 → null", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { verifyToken } = await import("@/lib/auth/jwt");
      const payload = await verifyToken("not.a.valid.jwt.at.all");
      expect(payload).toBeNull();
    });
  });

  describe("signToken → verifyToken 왕복", () => {
    it("sub에 한국어 포함 가능", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { signToken, verifyToken } = await import("@/lib/auth/jwt");
      const token = await signToken("사용자-1", "access");
      const payload = await verifyToken(token!);
      expect(payload!.sub).toBe("사용자-1");
    });

    it("sub에 UUID 형식", async () => {
      process.env.JWT_SECRET = VALID_SECRET;
      const { signToken, verifyToken } = await import("@/lib/auth/jwt");
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const token = await signToken(uuid, "refresh");
      const payload = await verifyToken(token!);
      expect(payload!.sub).toBe(uuid);
    });
  });
});
