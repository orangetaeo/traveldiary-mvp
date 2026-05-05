/**
 * Share API 라우트 테스트 — Batch 34.
 *
 * 2 라우트:
 *  - app/api/share/lookup/route.ts: POST — rate limit + validation + DB lookup
 *  - app/api/share/my-activity/route.ts: POST — rate limit + validation + repo call
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/* ──────── Mocks ──────── */

const mockCheckIpRate = vi.fn();
const mockListMyActivity = vi.fn();

vi.mock("@/lib/share/lookupRateLimit", () => ({
  checkIpRate: (...args: unknown[]) => mockCheckIpRate(...args),
}));

vi.mock("@/lib/repositories/shareComment.repository", () => ({
  listMyActivityByClientUuid: (...args: unknown[]) => mockListMyActivity(...args),
}));

const mockShareLinkFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shareLink: { findMany: (...args: unknown[]) => mockShareLinkFindMany(...args) },
  },
  isDbConnected: true,
}));

/* ──────── NextRequest helper ──────── */

function makeRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost/api/share/lookup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "1.2.3.4",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function makeNextRequest(body: unknown, headers?: Record<string, string>) {
  const req = makeRequest(body, headers);
  // NextRequest에서 사용되는 추가 속성 모킹
  return Object.assign(req, {
    nextUrl: new URL("http://localhost/api/share/lookup"),
    cookies: { get: () => undefined },
  });
}

/* ════════════════════════════════════════════
 * share/lookup — POST
 * ════════════════════════════════════════════ */

describe("api/share/lookup — POST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCheckIpRate.mockReturnValue(true); // 기본: rate limit 통과
  });

  it("rate limited → 429", async () => {
    mockCheckIpRate.mockReturnValue(false);
    const { POST } = await import("@/app/api/share/lookup/route");
    const resp = await POST(makeNextRequest({ keys: ["key1"] }) as never);
    expect(resp.status).toBe(429);
    const json = await resp.json();
    expect(json.error).toBe("rate_limited");
  });

  it("invalid JSON → 400", async () => {
    const badReq = Object.assign(
      new Request("http://localhost/api/share/lookup", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
        body: "not-json",
      }),
      {
        nextUrl: new URL("http://localhost/api/share/lookup"),
        cookies: { get: () => undefined },
      },
    );
    const { POST } = await import("@/app/api/share/lookup/route");
    const resp = await POST(badReq as never);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toBe("invalid_json");
  });

  it("keys 미전송 → 400", async () => {
    const { POST } = await import("@/app/api/share/lookup/route");
    const resp = await POST(makeNextRequest({}) as never);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toBe("keys_required");
  });

  it("keys 빈 배열 → 400", async () => {
    const { POST } = await import("@/app/api/share/lookup/route");
    const resp = await POST(makeNextRequest({ keys: [] }) as never);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toBe("keys_required");
  });

  it("keys > 50 → 400", async () => {
    const keys = Array.from({ length: 51 }, (_, i) => `k${i}`);
    const { POST } = await import("@/app/api/share/lookup/route");
    const resp = await POST(makeNextRequest({ keys }) as never);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toBe("too_many_keys");
  });

  it("DB 연결 시 → shareLink 조회 + status 분기", async () => {
    const now = new Date();
    const past = new Date(Date.now() - 86400000);
    mockShareLinkFindMany.mockResolvedValue([
      {
        syncKey: "key-active",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        trip: { destination: "다낭", nights: 5, startDate: now },
      },
      {
        syncKey: "key-revoked",
        revokedAt: past,
        expiresAt: null,
        trip: null,
      },
      {
        syncKey: "key-expired",
        revokedAt: null,
        expiresAt: past,
        trip: null,
      },
    ]);

    const { POST } = await import("@/app/api/share/lookup/route");
    const resp = await POST(
      makeNextRequest({ keys: ["key-active", "key-revoked", "key-expired", "key-missing"] }) as never,
    );
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.items).toHaveLength(4);
    expect(json.items[0].status).toBe("active");
    expect(json.items[0].destination).toBe("다낭");
    expect(json.items[1].status).toBe("revoked");
    expect(json.items[2].status).toBe("expired");
    expect(json.items[3].status).toBe("not_found");
  });

  it("IP 추출 — x-forwarded-for 첫 번째 사용", async () => {
    mockCheckIpRate.mockReturnValue(true);
    mockShareLinkFindMany.mockResolvedValue([]);
    const { POST } = await import("@/app/api/share/lookup/route");
    await POST(
      makeNextRequest({ keys: ["k1"] }, { "x-forwarded-for": "10.0.0.1, 10.0.0.2" }) as never,
    );
    expect(mockCheckIpRate).toHaveBeenCalledWith("10.0.0.1");
  });

  it("비 string keys 필터링", async () => {
    mockShareLinkFindMany.mockResolvedValue([]);
    const { POST } = await import("@/app/api/share/lookup/route");
    const resp = await POST(
      makeNextRequest({ keys: ["valid", "", 123, null, "ok"] }) as never,
    );
    expect(resp.status).toBe(200);
    // 빈 문자열과 비 string 필터됨
    const callArgs = mockShareLinkFindMany.mock.calls[0][0];
    expect(callArgs.where.syncKey.in).toEqual(["valid", "ok"]);
  });
});

/* ════════════════════════════════��═══════════
 * share/my-activity — POST
 * ═════════════════���══════════════════════════ */

function makeActivityRequest(body: unknown, headers?: Record<string, string>) {
  const req = new Request("http://localhost/api/share/my-activity", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "5.6.7.8",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return Object.assign(req, {
    nextUrl: new URL("http://localhost/api/share/my-activity"),
    cookies: { get: () => undefined },
  });
}

describe("api/share/my-activity — POST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCheckIpRate.mockReturnValue(true);
  });

  it("rate limited → 429", async () => {
    mockCheckIpRate.mockReturnValue(false);
    const { POST } = await import("@/app/api/share/my-activity/route");
    const resp = await POST(makeActivityRequest({ clientUuid: "uuid-1234" }) as never);
    expect(resp.status).toBe(429);
  });

  it("invalid JSON → 400", async () => {
    const badReq = Object.assign(
      new Request("http://localhost/api/share/my-activity", {
        method: "POST",
        headers: { "x-forwarded-for": "5.6.7.8" },
        body: "bad",
      }),
      {
        nextUrl: new URL("http://localhost/api/share/my-activity"),
        cookies: { get: () => undefined },
      },
    );
    const { POST } = await import("@/app/api/share/my-activity/route");
    const resp = await POST(badReq as never);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toBe("invalid_json");
  });

  it("clientUuid 미전송 → 400", async () => {
    const { POST } = await import("@/app/api/share/my-activity/route");
    const resp = await POST(makeActivityRequest({}) as never);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toBe("clientUuid_required");
  });

  it("clientUuid 너무 짧음 (< 8) → 400", async () => {
    const { POST } = await import("@/app/api/share/my-activity/route");
    const resp = await POST(makeActivityRequest({ clientUuid: "short" }) as never);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toBe("clientUuid_invalid");
  });

  it("clientUuid 너무 김 (> 200) → 400", async () => {
    const { POST } = await import("@/app/api/share/my-activity/route");
    const resp = await POST(makeActivityRequest({ clientUuid: "x".repeat(201) }) as never);
    expect(resp.status).toBe(400);
    const json = await resp.json();
    expect(json.error).toBe("clientUuid_invalid");
  });

  it("정상 요청 → repository 호출 + items 반환", async () => {
    const mockItems = [
      { id: "c1", content: "좋아요", createdAt: "2026-01-01" },
    ];
    mockListMyActivity.mockResolvedValue(mockItems);
    const { POST } = await import("@/app/api/share/my-activity/route");
    const resp = await POST(makeActivityRequest({ clientUuid: "valid-uuid-12345" }) as never);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.items).toEqual(mockItems);
    expect(mockListMyActivity).toHaveBeenCalledWith("valid-uuid-12345", 50);
  });
});
