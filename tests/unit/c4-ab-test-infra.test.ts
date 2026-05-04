/**
 * C4 — A/B 테스트 인프라 검증.
 *
 * experiment.ts (클라이언트) + API route + repository + admin dashboard.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/* ─── experiment.ts 클라이언트 ─── */
describe("C4 — A/B experiment.ts 클라이언트", () => {
  const src = fs.readFileSync(
    path.resolve("lib/ab/experiment.ts"),
    "utf-8",
  );

  it("use client 지시어", () => {
    expect(src).toContain('"use client"');
  });

  it("EXPERIMENTS 배열 export", () => {
    expect(src).toContain("export const EXPERIMENTS");
  });

  it("ota_cta_text 실험 정의", () => {
    expect(src).toContain('"ota_cta_text"');
    expect(src).toContain('"최저가 보기"');
    expect(src).toContain('"가격 비교하기"');
  });

  it("ota_position 실험 정의", () => {
    expect(src).toContain('"ota_position"');
    expect(src).toContain('"below_evidence"');
    expect(src).toContain('"above_evidence"');
  });

  it("getVariant 함수 export", () => {
    expect(src).toContain("export function getVariant");
  });

  it("localStorage 기반 고정 할당", () => {
    expect(src).toContain("localStorage.getItem");
    expect(src).toContain("localStorage.setItem");
  });

  it("SSR 안전 — window undefined 체크", () => {
    expect(src).toContain('typeof window === "undefined"');
  });

  it("trackAbEvent 함수 export", () => {
    expect(src).toContain("export function trackAbEvent");
  });

  it("sendBeacon 우선 + fetch fallback", () => {
    expect(src).toContain("navigator.sendBeacon");
    expect(src).toContain('"/api/analytics/ab"');
  });

  it("impression + conversion 이벤트 타입", () => {
    expect(src).toContain('"impression"');
    expect(src).toContain('"conversion"');
  });
});

/* ─── API route ─── */
describe("C4 — /api/analytics/ab route", () => {
  const src = fs.readFileSync(
    path.resolve("app/api/analytics/ab/route.ts"),
    "utf-8",
  );

  it("POST 핸들러 export", () => {
    expect(src).toContain("export async function POST");
  });

  it("writeAuditLog 호출", () => {
    expect(src).toContain("writeAuditLog");
  });

  it("ab.impression / ab.conversion action 패턴", () => {
    expect(src).toContain("ab.");
  });

  it("유효성 검사 — impression/conversion만 허용", () => {
    expect(src).toContain("VALID_EVENTS");
    expect(src).toContain('"impression"');
    expect(src).toContain('"conversion"');
  });

  it("invalid payload 시 400 반환", () => {
    expect(src).toContain("400");
    expect(src).toContain("invalid payload");
  });

  it("실패 시에도 200 반환 (클라이언트 무영향)", () => {
    // catch 블록에서 ok: true 반환
    expect(src).toContain('{ ok: true }');
  });
});

/* ─── Repository ─── */
describe("C4 — ab.repository 집계", () => {
  const src = fs.readFileSync(
    path.resolve("lib/repositories/ab.repository.ts"),
    "utf-8",
  );

  it("server-only import", () => {
    expect(src).toContain('"server-only"');
  });

  it("getAbSummary 함수 export", () => {
    expect(src).toContain("export async function getAbSummary");
  });

  it("ab. prefix로 AuditLog 조회", () => {
    expect(src).toContain('startsWith: "ab."');
  });

  it("experimentId + variant 집계", () => {
    expect(src).toContain("experimentId");
    expect(src).toContain("variant");
    expect(src).toContain("impressions");
    expect(src).toContain("conversions");
  });

  it("conversionRate 계산", () => {
    expect(src).toContain("conversionRate");
    expect(src).toContain("stats.conversions / stats.impressions");
  });

  it("WindowOption 시간 윈도우 지원", () => {
    expect(src).toContain("buildWindowCutoffFilter");
    expect(src).toContain("WindowOption");
  });

  it("DB 미연결 시 null 반환", () => {
    expect(src).toContain("if (!prisma) return null");
  });
});

/* ─── Admin dashboard ─── */
describe("C4 — /admin/ab 대시보드", () => {
  const src = fs.readFileSync(
    path.resolve("app/admin/ab/page.tsx"),
    "utf-8",
  );

  it("assertAdminAccess 가드", () => {
    expect(src).toContain("assertAdminAccess");
  });

  it("force-dynamic export", () => {
    expect(src).toContain('export const dynamic = "force-dynamic"');
  });

  it("getAbSummary 호출", () => {
    expect(src).toContain("getAbSummary");
  });

  it("TimeWindowFilter 사용", () => {
    expect(src).toContain("TimeWindowFilter");
    expect(src).toContain('basePath="/admin/ab"');
  });

  it("실험 없을 때 빈 상태 표시", () => {
    expect(src).toContain("아직 A/B 데이터가 없습니다");
    expect(src).toContain("활성 실험");
  });

  it("variant별 비교 바 차트", () => {
    expect(src).toContain("barWidth");
    expect(src).toContain("bg-purple");
  });

  it("전환율 표시", () => {
    expect(src).toContain("전환율");
    expect(src).toContain("conversionRate");
  });

  it("우세 variant 표시", () => {
    expect(src).toContain("(우세)");
    expect(src).toContain("isWinner");
  });

  it("노출·전환 요약", () => {
    expect(src).toContain("노출");
    expect(src).toContain("전환");
    expect(src).toContain("totalImpressions");
    expect(src).toContain("totalConversions");
  });

  it("EXPERIMENTS import — 빈 상태에서 활성 실험 표시", () => {
    expect(src).toContain('from "@/lib/ab/experiment"');
    expect(src).toContain("EXPERIMENTS.length");
    expect(src).toContain("EXPERIMENTS.map");
  });
});
