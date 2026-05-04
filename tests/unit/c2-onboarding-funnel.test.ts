/**
 * C2 — 온보딩 퍼널 트래킹 구조 검증.
 *
 * 시나리오 C Phase C2: 온보딩 단계별 이탈률 추적.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C2 — 퍼널 트래커 (lib/analytics/funnel.ts)", () => {
  const src = fs.readFileSync(
    path.resolve("lib/analytics/funnel.ts"),
    "utf-8",
  );

  it("trackFunnelStep export", () => {
    expect(src).toContain("export function trackFunnelStep");
  });

  it("FunnelStep 타입 정의 (view~complete)", () => {
    expect(src).toContain("view");
    expect(src).toContain("step1");
    expect(src).toContain("step4");
    expect(src).toContain("submit");
    expect(src).toContain("complete");
  });

  it("sendBeacon 우선 + fetch fallback", () => {
    expect(src).toContain("sendBeacon");
    expect(src).toContain("fetch");
  });

  it("/api/analytics/funnel 엔드포인트", () => {
    expect(src).toContain("/api/analytics/funnel");
  });

  it("에러 무시 (fire-and-forget)", () => {
    expect(src).toContain("catch");
  });
});

describe("C2 — 퍼널 API (app/api/analytics/funnel/route.ts)", () => {
  const src = fs.readFileSync(
    path.resolve("app/api/analytics/funnel/route.ts"),
    "utf-8",
  );

  it("POST 핸들러 존재", () => {
    expect(src).toContain("export async function POST");
  });

  it("writeAuditLog 호출", () => {
    expect(src).toContain("writeAuditLog");
  });

  it("funnel.onboarding 액션", () => {
    expect(src).toContain("funnel.onboarding");
  });

  it("유효 step 검증", () => {
    expect(src).toContain("VALID_STEPS");
    expect(src).toContain("invalid step");
  });
});

describe("C2 — 온보딩 페이지 트래킹 통합", () => {
  const src = fs.readFileSync(
    path.resolve("app/onboarding/page.tsx"),
    "utf-8",
  );

  it("trackFunnelStep import", () => {
    expect(src).toContain("trackFunnelStep");
  });

  it("페이지 진입 시 view 트래킹", () => {
    expect(src).toContain('"view"');
  });

  it("submit 트래킹", () => {
    expect(src).toContain('"submit"');
  });

  it("complete 트래킹", () => {
    expect(src).toContain('"complete"');
  });
});
