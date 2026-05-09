/**
 * SEO 메타데이터 배치 2 — 레이아웃 기반 메타데이터 추가 검증.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SEO 배치 2 — 레이아웃 메타데이터", () => {
  const layouts = [
    { label: "itinerary/creating", path: "app/itinerary/creating/layout.tsx" },
    { label: "permission", path: "app/permission/layout.tsx" },
    { label: "admin", path: "app/admin/layout.tsx" },
  ];

  for (const layout of layouts) {
    it(`${layout.label} — layout.tsx 존재`, () => {
      expect(fs.existsSync(path.resolve(layout.path))).toBe(true);
    });

    it(`${layout.label} — metadata export 존재`, () => {
      const src = fs.readFileSync(path.resolve(layout.path), "utf-8");
      expect(src).toContain("export const metadata");
    });

    it(`${layout.label} — title 포함`, () => {
      const src = fs.readFileSync(path.resolve(layout.path), "utf-8");
      expect(src).toContain("title:");
    });
  }

  it("admin — robots noindex 설정", () => {
    const src = fs.readFileSync(path.resolve("app/admin/layout.tsx"), "utf-8");
    expect(src).toContain("index: false");
  });
});

/* ═══════ 전체 커버리지 카운트 ═══════ */

describe("SEO — 메타데이터 커버리지", () => {
  it("50개 페이지 중 최소 35개에 메타데이터 존재", () => {
    // page.tsx 또는 layout.tsx에 metadata가 있으면 커버됨
    const pagesWithMeta: string[] = [];
    const allPages = fs.readdirSync("app", { recursive: true, encoding: "utf-8" })
      .filter((f: string) => f.endsWith("page.tsx"));

    for (const page of allPages) {
      const fullPath = path.resolve("app", page);
      const src = fs.readFileSync(fullPath, "utf-8");
      if (src.includes("metadata") || src.includes("generateMetadata")) {
        pagesWithMeta.push(page);
        continue;
      }
      // layout.tsx 체크
      const dir = path.dirname(fullPath);
      const layoutPath = path.join(dir, "layout.tsx");
      if (fs.existsSync(layoutPath)) {
        const layoutSrc = fs.readFileSync(layoutPath, "utf-8");
        if (layoutSrc.includes("metadata")) {
          pagesWithMeta.push(page);
          continue;
        }
      }
      // 상위 디렉터리 layout 체크 (1단계)
      const parentDir = path.dirname(dir);
      const parentLayoutPath = path.join(parentDir, "layout.tsx");
      if (fs.existsSync(parentLayoutPath)) {
        const parentLayoutSrc = fs.readFileSync(parentLayoutPath, "utf-8");
        if (parentLayoutSrc.includes("metadata") && !parentLayoutSrc.includes("RootLayout")) {
          pagesWithMeta.push(page);
        }
      }
    }

    expect(pagesWithMeta.length).toBeGreaterThanOrEqual(35);
  });
});
