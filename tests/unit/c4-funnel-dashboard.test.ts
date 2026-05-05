/**
 * C4 — 온보딩 퍼널 대시보드 검증.
 *
 * 시나리오 C Phase C4: 퍼널 리포지토리 + 관리자 대시보드.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C4 — funnel.repository 구조", () => {
  const src = fs.readFileSync(
    path.resolve("lib/repositories/funnel.repository.ts"),
    "utf-8",
  );

  it("getFunnelSummary export", () => {
    expect(src).toContain("export async function getFunnelSummary");
  });

  it("FunnelSummary 타입 (steps + overallConversionRate)", () => {
    expect(src).toContain("FunnelSummary");
    expect(src).toContain("overallConversionRate");
  });

  it("FunnelStepCount 타입 (conversionRate)", () => {
    expect(src).toContain("FunnelStepCount");
    expect(src).toContain("conversionRate");
  });

  it("STEP_ORDER 7단계 정의", () => {
    expect(src).toContain("view");
    expect(src).toContain("step1");
    expect(src).toContain("step4");
    expect(src).toContain("submit");
    expect(src).toContain("complete");
  });

  it("funnel.onboarding 액션 필터", () => {
    expect(src).toContain("funnel.onboarding");
  });

  it("resourceId → step 파싱", () => {
    expect(src).toContain('replace("onboarding-"');
  });

  it("windowDays 지원", () => {
    expect(src).toContain("windowDays");
    expect(src).toContain("buildWindowCutoffFilter");
  });

  it("server-only import", () => {
    expect(src).toContain('"server-only"');
  });
});

describe("C4 — /admin/funnel 대시보드 UI", () => {
  const src = fs.readFileSync(
    path.resolve("app/admin/funnel/page.tsx"),
    "utf-8",
  );

  it("assertAdminAccess 가드", () => {
    expect(src).toContain("assertAdminAccess");
  });

  it("getFunnelSummary 호출", () => {
    expect(src).toContain("getFunnelSummary");
  });

  it("force-dynamic", () => {
    expect(src).toContain('"force-dynamic"');
  });

  it("STEP_LABEL 7단계 한국어 라벨", () => {
    expect(src).toContain("도착");
    expect(src).toContain("일정 생성");
    expect(src).toContain("완성");
  });

  it("요약 카드 (진입·완료·전환율)", () => {
    expect(src).toContain("totalViews");
    expect(src).toContain("totalCompletes");
    expect(src).toContain("overallConversionRate");
  });

  it("단계별 전환 바 차트", () => {
    expect(src).toContain("barWidth");
    expect(src).toContain("conversionRate");
  });

  it("TimeWindowFilter 컴포넌트", () => {
    expect(src).toContain("TimeWindowFilter");
    expect(src).toContain("/admin/funnel");
  });

  it("DB 미연결 fallback", () => {
    expect(src).toContain("isDbConnected");
    expect(src).toContain("퍼널 통계 조회 불가");
  });
});
