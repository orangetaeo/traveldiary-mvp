/**
 * lib/auth/jwt.ts 단위 테스트.
 *
 * jose 기반 JWT 발급/검증 + env 미설정 fallback.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  signToken,
  verifyToken,
  jwtAvailable,
} from "@/lib/auth/jwt";

const VALID_SECRET = "a".repeat(32); // 최소 32자

describe("auth/jwt", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ─── jwtAvailable ──────────────────────────────────────────

  it("JWT_SECRET 미설정 → jwtAvailable=false", () => {
    expect(jwtAvailable()).toBe(false);
  });

  it("JWT_SECRET 31자 (짧음) → jwtAvailable=false", () => {
    process.env.JWT_SECRET = "a".repeat(31);
    expect(jwtAvailable()).toBe(false);
  });

  it("JWT_SECRET 32자 이상 → jwtAvailable=true", () => {
    process.env.JWT_SECRET = VALID_SECRET;
    expect(jwtAvailable()).toBe(true);
  });

  // ─── signToken ─────────────────────────────────────────────

  it("secret 미설정 → signToken=null", async () => {
    const token = await signToken("user-1", "access");
    expect(token).toBeNull();
  });

  it("access 토큰 발급 성공", async () => {
    process.env.JWT_SECRET = VALID_SECRET;
    const token = await signToken("user-1", "access");
    expect(token).not.toBeNull();
    expect(typeof token).toBe("string");
    // JWT 형식: header.payload.signature (점 3개)
    expect(token!.split(".")).toHaveLength(3);
  });

  it("refresh 토큰 발급 성공", async () => {
    process.env.JWT_SECRET = VALID_SECRET;
    const token = await signToken("user-2", "refresh");
    expect(token).not.toBeNull();
  });

  // ─── verifyToken ───────────────────────────────────────────

  it("secret 미설정 → verifyToken=null", async () => {
    process.env.JWT_SECRET = VALID_SECRET;
    const token = await signToken("user-1", "access");
    delete process.env.JWT_SECRET;
    const payload = await verifyToken(token!);
    expect(payload).toBeNull();
  });

  it("유효한 access 토큰 검증", async () => {
    process.env.JWT_SECRET = VALID_SECRET;
    const token = await signToken("user-1", "access");
    const payload = await verifyToken(token!);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user-1");
    expect(payload!.type).toBe("access");
  });

  it("유효한 refresh 토큰 검증", async () => {
    process.env.JWT_SECRET = VALID_SECRET;
    const token = await signToken("user-2", "refresh");
    const payload = await verifyToken(token!);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user-2");
    expect(payload!.type).toBe("refresh");
  });

  it("잘못된 토큰 → null", async () => {
    process.env.JWT_SECRET = VALID_SECRET;
    const payload = await verifyToken("invalid.token.string");
    expect(payload).toBeNull();
  });

  it("다른 secret으로 서명된 토큰 → null", async () => {
    process.env.JWT_SECRET = VALID_SECRET;
    const token = await signToken("user-1", "access");
    process.env.JWT_SECRET = "b".repeat(32);
    const payload = await verifyToken(token!);
    expect(payload).toBeNull();
  });

  it("sign → verify 왕복 — sub 보존", async () => {
    process.env.JWT_SECRET = VALID_SECRET;
    const sub = "kakao:12345";
    const token = await signToken(sub, "access");
    const payload = await verifyToken(token!);
    expect(payload!.sub).toBe(sub);
  });
});
