/**
 * C4 — Admin 대시보드 인덱스 페이지 검증.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("C4 — /admin 인덱스 페이지", () => {
  const src = fs.readFileSync(
    path.resolve("app/admin/page.tsx"),
    "utf-8",
  );

  it("assertAdminAccess 가드", () => {
    expect(src).toContain("assertAdminAccess");
  });

  it("force-dynamic export", () => {
    expect(src).toContain('export const dynamic = "force-dynamic"');
  });

  it("어필리에이트 대시보드 링크", () => {
    expect(src).toContain("/admin/affiliate");
    expect(src).toContain("Affiliates");
  });

  it("퍼널 대시보드 링크", () => {
    expect(src).toContain("/admin/funnel");
    expect(src).toContain("Funnels");
  });

  it("초대 코드 대시보드 링크", () => {
    expect(src).toContain("/admin/invite");
    expect(src).toContain("초대 코드");
  });

  it("A/B 실험 대시보드 링크", () => {
    expect(src).toContain("/admin/ab");
    expect(src).toContain("A/B Testing");
  });

  it("M2 스킵 대시보드 링크", () => {
    expect(src).toContain("/admin/m2-skip-reasons");
  });

  it("key 파라미터 전달", () => {
    expect(src).toContain("keyParam");
    expect(src).toContain("searchParams.key");
  });

  it("5개 대시보드 카드", () => {
    const dashboards = src.match(/href: "/g);
    expect(dashboards).not.toBeNull();
    expect(dashboards!.length).toBeGreaterThanOrEqual(5);
  });

  // 사이클 U-admin-demo (2026-05-07) — 데모 마커 + 데드 링크 청소
  describe("U-admin-demo — 데모 마커 + Health Check 활성", () => {
    it("데모 데이터 마커 배너 노출 (운영자 인지)", () => {
      expect(src).toContain("데모 데이터 — 실 API 연동 대기 중");
      expect(src).toContain("정적 데모 값");
    });

    it("데모 마커 ARIA — role=note + aria-labelledby", () => {
      expect(src).toContain('role="note"');
      expect(src).toContain('aria-labelledby="admin-demo-banner-heading"');
    });

    it("데모 마커가 R1 사인오프 + ADR-046 인용 (정책 정체성)", () => {
      expect(src).toMatch(/R1 사인오프/);
      expect(src).toMatch(/ADR-046/);
    });

    it("Health Check → /api/health 활성 (이전 href=\"#\" 데드 링크)", () => {
      expect(src).toMatch(/href:\s*"\/api\/health"/);
      // 회귀 — Health Check 항목 옆에 href: "#" 잔여 없음
      expect(src).not.toMatch(/title:\s*"Health Check"[^}]*href:\s*"#"/);
    });

    it("KPI/Live feed 데이터는 데모 정체성 유지 (변경 없음)", () => {
      // 본 사이클은 마커만 추가, 실제 값은 변경하지 않음
      expect(src).toContain("New Trips");
      expect(src).toContain("AI Calls (Anthropic)");
      expect(src).toContain("Active OAuth Users");
      expect(src).toContain("Error Rate");
      expect(src).toContain("trip.create");
      expect(src).toContain("ota.click");
      expect(src).toContain("share.lookup");
    });
  });
});
