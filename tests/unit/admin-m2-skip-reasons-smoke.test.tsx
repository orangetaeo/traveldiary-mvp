/**
 * /admin/m2-skip-reasons 렌더 스모크 — Phase 7 admin 잔여 1건.
 *
 * async server component + assertAdminAccess + isDbConnected + getModeTransitionStats
 * 의존. vi.hoisted 상태 토글로 4 분기(미연결/null/empty/normal) 검증.
 *
 * renderToStaticMarkup 정적 마크업 검증 (testing-library 미도입 정책).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ModeTransitionStats } from "@/lib/repositories/mode-transition-stats.repository";

// ─── Mocks ────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  isDbConnected: true as boolean,
  statsResult: null as ModeTransitionStats | null,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    prefetch: _prefetch,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    prefetch?: boolean;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  notFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

vi.mock("@/lib/prisma", () => ({
  get isDbConnected() {
    return mocks.isDbConnected;
  },
  prisma: null,
}));

vi.mock("@/lib/auth/admin-guard", () => ({
  assertAdminAccess: vi.fn(),
}));

vi.mock("@/lib/repositories/mode-transition-stats.repository", () => ({
  getModeTransitionStats: vi.fn(async () => mocks.statsResult),
}));

// ─── Imports (mocks 정의 후) ──────────────────────────────

import ModeTransitionStatsDashboard from "@/app/admin/m2-skip-reasons/page";

// ─── Fixtures ─────────────────────────────────────────────

function makeStats(overrides: Partial<ModeTransitionStats> = {}): ModeTransitionStats {
  return {
    totalAttempts: 42,
    applied: 30,
    skipped: 12,
    successRate: 71,
    byReason: [
      { reason: "not_in_destination", count: 8 },
      { reason: "geolocation_denied", count: 4 },
    ],
    byTrigger: [
      { trigger: "geolocation", count: 30 },
      { trigger: "manual", count: 12 },
    ],
    byDestinationCode: [
      { code: "PQC", total: 25, applied: 20, skipped: 5 },
      { code: "DAD", total: 17, applied: 10, skipped: 7 },
    ],
    recent: [
      {
        id: "row-1",
        createdAt: "2026-05-06T10:00:00.000Z",
        trigger: "geolocation",
        outcome: "applied",
        destinationCode: "PQC",
        dDay: 0,
        boundaryHit: true,
      },
      {
        id: "row-2",
        createdAt: "2026-05-06T09:00:00.000Z",
        trigger: "geolocation",
        outcome: "skipped",
        skipReason: "not_in_destination",
        destinationCode: "DAD",
        dDay: 1,
        boundaryHit: false,
      },
    ],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────

describe("/admin/m2-skip-reasons 렌더 스모크", () => {
  beforeEach(() => {
    mocks.isDbConnected = true;
    mocks.statsResult = makeStats();
  });

  it("DB 미연결 시 안내 카피 노출", async () => {
    mocks.isDbConnected = false;
    const node = await ModeTransitionStatsDashboard({ searchParams: {} });
    const html = renderToStaticMarkup(node);
    expect(html).toContain("DB 미연결");
    expect(html).toContain("M2 스킵 사유");
  });

  it("stats null 시 데이터 로드 실패 메시지", async () => {
    mocks.statsResult = null;
    const node = await ModeTransitionStatsDashboard({ searchParams: {} });
    const html = renderToStaticMarkup(node);
    expect(html).toContain("데이터 로드 실패");
  });

  it("totalAttempts=0 시 빈 상태 카피", async () => {
    mocks.statsResult = makeStats({
      totalAttempts: 0,
      applied: 0,
      skipped: 0,
      successRate: 0,
      byReason: [],
      byTrigger: [],
      byDestinationCode: [],
      recent: [],
    });
    const node = await ModeTransitionStatsDashboard({ searchParams: {} });
    const html = renderToStaticMarkup(node);
    expect(html).toContain("아직 자동 전환 시도 데이터가 없어요");
  });

  it("window=7 + totalAttempts=0 시 윈도우 카피", async () => {
    mocks.statsResult = makeStats({
      totalAttempts: 0,
      applied: 0,
      skipped: 0,
      successRate: 0,
      byReason: [],
      byTrigger: [],
      byDestinationCode: [],
      recent: [],
      windowDays: 7,
    });
    const node = await ModeTransitionStatsDashboard({
      searchParams: { window: "7" },
    });
    const html = renderToStaticMarkup(node);
    expect(html).toContain("최근 7일간 자동 전환 시도 데이터가 없어요");
  });

  it("정상 stats: 총합 + 성공률 + 4 섹션 헤더", async () => {
    const node = await ModeTransitionStatsDashboard({ searchParams: {} });
    const html = renderToStaticMarkup(node);
    expect(html).toContain("총 시도");
    expect(html).toContain("42");
    expect(html).toContain("성공률");
    expect(html).toContain("71%");
    expect(html).toContain("스킵 사유 분포");
    expect(html).toContain("트리거별");
    expect(html).toContain("도시별");
    expect(html).toContain("최근 시도");
  });

  it("정상 stats: 스킵 사유 라벨 + 도시 라벨 노출", async () => {
    const node = await ModeTransitionStatsDashboard({ searchParams: {} });
    const html = renderToStaticMarkup(node);
    expect(html).toContain("도시 경계 밖");
    expect(html).toContain("권한 거부");
    expect(html).toContain("위치 기반");
    expect(html).toContain("수동");
  });

  it("헤더: admin 라벨 + 뒤로 링크 (key 보존)", async () => {
    const node = await ModeTransitionStatsDashboard({
      searchParams: { key: "secret-test-key" },
    });
    const html = renderToStaticMarkup(node);
    expect(html).toContain("M2 스킵 사유");
    expect(html).toContain("Admin");
    expect(html).toContain('href="/admin?key=secret-test-key"');
  });

  it("헤더: key 없으면 /admin 링크 (베어)", async () => {
    const node = await ModeTransitionStatsDashboard({ searchParams: {} });
    const html = renderToStaticMarkup(node);
    expect(html).toContain('href="/admin"');
    expect(html).not.toContain('href="/admin?key=');
  });

  it("ADR-017 프라이버시 인용 노출", async () => {
    const node = await ModeTransitionStatsDashboard({ searchParams: {} });
    const html = renderToStaticMarkup(node);
    expect(html).toContain("ADR-017");
  });
});
