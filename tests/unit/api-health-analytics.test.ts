/**
 * API Route 단위 테스트 — Batch 41b.
 *
 * 4 라우트:
 *  - /api/health (GET — demo, healthy, degraded)
 *  - /api/diag/translate (GET — 키 마스킹)
 *  - /api/analytics/funnel (POST — valid step, invalid step, parse error)
 *  - /api/analytics/ab (POST — valid event, invalid payload, parse error)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/* ──────── Mocks ──────── */

const mockWriteAuditLog = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

/* ════════════════════════════════════════════
 * /api/analytics/funnel
 * ════════════════════════════════════════════ */

describe("api/analytics/funnel — POST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("valid step → 200 { ok: true } + audit", async () => {
    const { POST } = await import("@/app/api/analytics/funnel/route");
    const req = new Request("http://localhost/api/analytics/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "step1", destination: "다낭" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "funnel.onboarding",
        resourceId: "onboarding-step1",
        metadata: expect.objectContaining({ step: "step1", destination: "다낭" }),
      }),
    );
  });

  it("invalid step → 400", async () => {
    const { POST } = await import("@/app/api/analytics/funnel/route");
    const req = new Request("http://localhost/api/analytics/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "invalid_step" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid step");
  });

  it("JSON 파싱 에러 → 200 (트래킹 실패 허용)", async () => {
    const { POST } = await import("@/app/api/analytics/funnel/route");
    const req = new Request("http://localhost/api/analytics/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

/* ════════════════════════════════════════════
 * /api/analytics/ab
 * ════════════════════════════════════════════ */

describe("api/analytics/ab — POST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("valid impression → 200 + audit", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://localhost/api/analytics/ab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId: "exp-1",
        variant: "B",
        event: "impression",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ab.impression",
        resource: "experiment",
        resourceId: "exp-1",
        metadata: expect.objectContaining({ variant: "B" }),
      }),
    );
  });

  it("valid conversion → 200 + audit action ab.conversion", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://localhost/api/analytics/ab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId: "exp-2",
        variant: "A",
        event: "conversion",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ab.conversion" }),
    );
  });

  it("invalid event type → 400", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://localhost/api/analytics/ab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId: "exp-1",
        variant: "A",
        event: "click",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("missing experimentId → 400", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://localhost/api/analytics/ab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant: "A", event: "impression" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("JSON 파싱 에러 → 200 (트래킹 실패 허용)", async () => {
    const { POST } = await import("@/app/api/analytics/ab/route");
    const req = new Request("http://localhost/api/analytics/ab", {
      method: "POST",
      body: "broken",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

/* ════════════════════════════════════════════
 * /api/health
 * ════════════════════════════════════════════ */

describe("api/health — GET", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("DB 연결 OK → healthy 200", async () => {
    vi.doMock("@/lib/prisma", () => ({
      prisma: { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) },
      isDbConnected: true,
    }));
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.checks.database).toBe("ok");
    expect(data.app).toBe("traveldiary-mvp");
  });

  it("DB 미연결 → demo 200", async () => {
    vi.doMock("@/lib/prisma", () => ({
      prisma: null,
      isDbConnected: false,
    }));
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("demo");
    expect(data.checks.database).toBe("demo");
  });

  it("DB 연결 실패 → degraded 503", async () => {
    vi.doMock("@/lib/prisma", () => ({
      prisma: { $queryRaw: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) },
      isDbConnected: true,
    }));
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.status).toBe("degraded");
    expect(data.checks.error).toBe("ECONNREFUSED");
  });
});

/* ════════════════════════════════════════════
 * /api/diag/translate
 * ════════════════════════════════════════════ */

describe("api/diag/translate — GET", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("키 설정 → available: true + 마스킹", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-xyz1234567890abcdef";
    vi.doMock("@/lib/services/menu-translation", () => ({
      translateAvailable: () => true,
    }));
    vi.doMock("@/lib/services/anthropic-claude", () => ({
      claudeAvailable: () => true,
    }));
    const { GET } = await import("@/app/api/diag/translate/route");
    const res = GET();
    const data = await res.json();
    expect(data.services.claudeVision.available).toBe(true);
    expect(data.services.claudeVision.keyMask).toMatch(/^\*\*\*\*.{4}$/);
    expect(data.services.claudeText.available).toBe(true);
    expect(data.services.claudeText.keyMask).toMatch(/^\*\*\*\*.{4}$/);
  });

  it("키 미설정 → available: false + keyMask: null", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.doMock("@/lib/services/menu-translation", () => ({
      translateAvailable: () => false,
    }));
    vi.doMock("@/lib/services/anthropic-claude", () => ({
      claudeAvailable: () => false,
    }));
    const { GET } = await import("@/app/api/diag/translate/route");
    const res = GET();
    const data = await res.json();
    expect(data.services.claudeVision.available).toBe(false);
    expect(data.services.claudeVision.keyMask).toBeNull();
    expect(data.services.claudeText.available).toBe(false);
    expect(data.services.claudeText.keyMask).toBeNull();
  });
});
