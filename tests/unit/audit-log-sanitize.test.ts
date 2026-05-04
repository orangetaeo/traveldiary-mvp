import { describe, it, expect } from "vitest";
import { sanitizeAuditValue } from "@/lib/audit-log";

describe("sanitizeAuditValue — secret 키 redact (사이클 ZZZ)", () => {
  it("primitive(string/number/boolean/null/undefined)는 그대로 반환", () => {
    expect(sanitizeAuditValue("plain")).toBe("plain");
    expect(sanitizeAuditValue(42)).toBe(42);
    expect(sanitizeAuditValue(true)).toBe(true);
    expect(sanitizeAuditValue(null)).toBeNull();
    expect(sanitizeAuditValue(undefined)).toBeUndefined();
  });

  it("일반 객체 키는 보존", () => {
    expect(sanitizeAuditValue({ name: "kim", count: 3 })).toEqual({
      name: "kim",
      count: 3,
    });
  });

  it("password / passwd 키는 redact", () => {
    expect(sanitizeAuditValue({ password: "abc" })).toEqual({
      password: "[REDACTED]",
    });
    expect(sanitizeAuditValue({ passwd: "x" })).toEqual({ passwd: "[REDACTED]" });
  });

  it("token / api_key / apiKey 키는 redact", () => {
    expect(sanitizeAuditValue({ token: "t" })).toEqual({ token: "[REDACTED]" });
    expect(sanitizeAuditValue({ api_key: "k" })).toEqual({ api_key: "[REDACTED]" });
    expect(sanitizeAuditValue({ apiKey: "k" })).toEqual({ apiKey: "[REDACTED]" });
    expect(sanitizeAuditValue({ "api-key": "k" })).toEqual({
      "api-key": "[REDACTED]",
    });
  });

  it("authorization / bearer / cookie / session 키는 redact", () => {
    expect(sanitizeAuditValue({ authorization: "Bearer X" })).toEqual({
      authorization: "[REDACTED]",
    });
    expect(sanitizeAuditValue({ bearer: "X" })).toEqual({ bearer: "[REDACTED]" });
    expect(sanitizeAuditValue({ cookie: "sid=1" })).toEqual({
      cookie: "[REDACTED]",
    });
    expect(sanitizeAuditValue({ sessionId: "abc" })).toEqual({
      sessionId: "[REDACTED]",
    });
    expect(sanitizeAuditValue({ session: "abc" })).toEqual({
      session: "[REDACTED]",
    });
  });

  it("credential / privateKey / accessKey / refreshToken 키는 redact", () => {
    expect(sanitizeAuditValue({ credential: "x" })).toEqual({
      credential: "[REDACTED]",
    });
    expect(sanitizeAuditValue({ privateKey: "x" })).toEqual({
      privateKey: "[REDACTED]",
    });
    expect(sanitizeAuditValue({ access_key: "x" })).toEqual({
      access_key: "[REDACTED]",
    });
    expect(sanitizeAuditValue({ refreshToken: "x" })).toEqual({
      refreshToken: "[REDACTED]",
    });
  });

  it("중첩된 객체에서도 redact", () => {
    expect(
      sanitizeAuditValue({
        user: { id: 1, password: "pw", profile: { token: "t", name: "kim" } },
      }),
    ).toEqual({
      user: {
        id: 1,
        password: "[REDACTED]",
        profile: { token: "[REDACTED]", name: "kim" },
      },
    });
  });

  it("배열 안의 객체도 redact", () => {
    expect(
      sanitizeAuditValue([
        { id: 1, secret: "a" },
        { id: 2, secret: "b" },
      ]),
    ).toEqual([
      { id: 1, secret: "[REDACTED]" },
      { id: 2, secret: "[REDACTED]" },
    ]);
  });

  it("키 매칭은 case-insensitive", () => {
    expect(sanitizeAuditValue({ PASSWORD: "x", Token: "y" })).toEqual({
      PASSWORD: "[REDACTED]",
      Token: "[REDACTED]",
    });
  });

  it("MAX_DEPTH(6) 초과 시 [DEEP] (0~6 depth는 정상, 7번째 진입에서 cut)", () => {
    const deep: Record<string, unknown> = {};
    let cur = deep;
    for (let i = 0; i < 10; i++) {
      const next: Record<string, unknown> = {};
      cur.next = next;
      cur = next;
    }
    cur.password = "secret";
    const sanitized = sanitizeAuditValue(deep) as Record<string, unknown>;
    // depth 0~6은 정상 객체, 7번째 .next 접근에서 "[DEEP]"
    let walk: unknown = sanitized;
    for (let i = 0; i < 7; i++) {
      walk = (walk as Record<string, unknown>).next;
    }
    expect(walk).toBe("[DEEP]");
  });

  it("undefined input → undefined (writeAuditLog metadata 부재 케이스)", () => {
    expect(sanitizeAuditValue(undefined)).toBeUndefined();
  });
});
