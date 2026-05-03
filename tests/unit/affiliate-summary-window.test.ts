/**
 * 사이클 XXX — getAffiliateSummary windowDays + scalar fallback 회귀.
 *
 * helper-evolution 6번째 답습 (NN→OO→QQ→RR + getAffiliateSummary):
 * scalar limit → options { limit, windowDays } + typeof fallback.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: { findMany: mockFindMany },
  },
  isDbConnected: true,
}));

vi.mock("server-only", () => ({}));

import { getAffiliateSummary } from "@/lib/repositories/affiliate.repository";

beforeEach(() => {
  mockFindMany.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-03T12:00:00Z"));
});

function buildAuditRow(overrides: {
  id?: string;
  ota?: string;
  priceKrw?: number;
  createdAt?: Date;
}) {
  return {
    id: overrides.id ?? "audit-1",
    actorId: null,
    action: "affiliate.click",
    resource: "ota",
    resourceId: "offer-1",
    before: null,
    after: { tracked: true },
    metadata: {
      ota: overrides.ota ?? "klook",
      itemId: "item-1",
      priceKrw: overrides.priceKrw ?? 100000,
    },
    createdAt: overrides.createdAt ?? new Date("2026-05-03T10:00:00Z"),
  };
}

describe("getAffiliateSummary — scalar fallback (helper-evolution 6번째 답습)", () => {
  it("scalar limit (legacy 호출) — windowDays 없음 + limit 적용", async () => {
    mockFindMany.mockResolvedValueOnce([buildAuditRow({})]);

    const result = await getAffiliateSummary(10);

    expect(result).not.toBeNull();
    expect(result?.recent.length).toBe(1);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    // where에 createdAt 키 부재 (전체 조회)
    expect("createdAt" in mockFindMany.mock.calls[0][0].where).toBe(false);
  });

  it("기본값 (인자 미제공) — limit=20, 전체", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getAffiliateSummary();

    expect("createdAt" in mockFindMany.mock.calls[0][0].where).toBe(false);
  });
});

describe("getAffiliateSummary — options object (XXX 신규)", () => {
  it("{ windowDays: 7 } → where.createdAt.gte = 7일 전", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getAffiliateSummary({ windowDays: 7 });

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.action).toBe("affiliate.click");
    expect(where.createdAt?.gte).toBeDefined();
    expect((where.createdAt.gte as Date).toISOString()).toBe(
      "2026-04-26T12:00:00.000Z",
    );
  });

  it("{ windowDays: 30 } → where.createdAt.gte = 30일 전", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getAffiliateSummary({ windowDays: 30 });

    const where = mockFindMany.mock.calls[0][0].where;
    expect((where.createdAt.gte as Date).toISOString()).toBe(
      "2026-04-03T12:00:00.000Z",
    );
  });

  it("{ limit: 5, windowDays: 7 } → recent 길이 ≤ 5", async () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      buildAuditRow({ id: `audit-${i}`, priceKrw: 50000 }),
    );
    mockFindMany.mockResolvedValueOnce(rows);

    const result = await getAffiliateSummary({ limit: 5, windowDays: 7 });

    expect(result?.totalClicks).toBe(10);
    expect(result?.recent.length).toBe(5); // limit만큼만 노출
  });

  it("{ windowDays: undefined } → 전체 조회 (createdAt 키 부재)", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getAffiliateSummary({ windowDays: undefined });

    expect("createdAt" in mockFindMany.mock.calls[0][0].where).toBe(false);
  });

  it("빈 옵션 객체 — 기본값 limit=20 + 전체", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getAffiliateSummary({});

    expect("createdAt" in mockFindMany.mock.calls[0][0].where).toBe(false);
  });
});

describe("getAffiliateSummary — byOta 집계 invariant 유지", () => {
  it("windowDays 적용 후에도 OTA별 집계 정상", async () => {
    mockFindMany.mockResolvedValueOnce([
      buildAuditRow({ id: "a1", ota: "klook", priceKrw: 100000 }),
      buildAuditRow({ id: "a2", ota: "klook", priceKrw: 200000 }),
      buildAuditRow({ id: "a3", ota: "kkday", priceKrw: 50000 }),
    ]);

    const result = await getAffiliateSummary({ windowDays: 7 });

    expect(result?.totalClicks).toBe(3);
    expect(result?.byOta.length).toBe(2);
    expect(result?.byOta[0].ota).toBe("klook"); // 클릭 많은 순
    expect(result?.byOta[0].clicks).toBe(2);
    expect(result?.byOta[1].ota).toBe("kkday");
  });
});
