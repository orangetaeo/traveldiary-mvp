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
    expect(src).toContain("어필리에이트");
  });

  it("퍼널 대시보드 링크", () => {
    expect(src).toContain("/admin/funnel");
    expect(src).toContain("온보딩 퍼널");
  });

  it("초대 코드 대시보드 링크", () => {
    expect(src).toContain("/admin/invite");
    expect(src).toContain("초대 코드");
  });

  it("A/B 실험 대시보드 링크", () => {
    expect(src).toContain("/admin/ab");
    expect(src).toContain("A/B 실험");
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
});
