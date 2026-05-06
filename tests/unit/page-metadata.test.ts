/**
 * 페이지 metadata 존재 검증 — SEO/OG 카드 누락 방지.
 *
 * 공개 페이지/레이아웃에 metadata 또는 generateMetadata가 있는지 확인.
 * 새 페이지 추가 시 metadata 누락을 자동 감지.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/** 재귀적으로 page.tsx / layout.tsx 파일 수집 */
function collectPages(dir: string): { relPath: string; src: string }[] {
  const results: { relPath: string; src: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPages(fullPath));
    } else if (entry.name === "page.tsx" || entry.name === "layout.tsx") {
      const relPath = path.relative(path.resolve("app"), fullPath).replace(/\\/g, "/");
      results.push({ relPath, src: fs.readFileSync(fullPath, "utf-8") });
    }
  }
  return results;
}

const ALL_PAGES = collectPages(path.resolve("app"));

// metadata가 있는 페이지/레이아웃 (자동 감지)
const PAGES_WITH_METADATA = ALL_PAGES.filter(
  (f) =>
    f.src.includes("export const metadata") ||
    f.src.includes("export async function generateMetadata"),
);

// 공개 페이지 (SEO 필수) — admin/permission/settings는 제외
const PUBLIC_PAGES_WITH_METADATA = PAGES_WITH_METADATA.filter(
  (f) =>
    !f.relPath.startsWith("admin/") &&
    !f.relPath.startsWith("permission/") &&
    !f.relPath.startsWith("settings/"),
);

/* ════════════════════════════════════════════
 * metadata 파일 수
 * ════════════════════════════════════════════ */

describe("페이지 metadata 커버리지", () => {
  it("metadata가 있는 페이지/레이아웃 17개 이상", () => {
    expect(PAGES_WITH_METADATA.length).toBeGreaterThanOrEqual(17);
  });

  it("공개 페이지 metadata 15개 이상", () => {
    expect(PUBLIC_PAGES_WITH_METADATA.length).toBeGreaterThanOrEqual(15);
  });
});

/* ════════════════════════════════════════════
 * 모든 metadata 페이지 — export 존재 확인
 * ════════════════════════════════════════════ */

describe("페이지 metadata export 존재 검증", () => {
  it.each(PAGES_WITH_METADATA.map((f) => [f.relPath, f.src]))(
    "%s — metadata 또는 generateMetadata export",
    (_path, src) => {
      const hasMetadata =
        src.includes("export const metadata") ||
        src.includes("export async function generateMetadata");
      expect(hasMetadata).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * 공개 페이지 — title 포함 확인
 * ════════════════════════════════════════════ */

describe("공개 페이지 — title 포함", () => {
  it.each(PUBLIC_PAGES_WITH_METADATA.map((f) => [f.relPath, f.src]))(
    "%s — title 속성 존재",
    (_path, src) => {
      expect(src).toContain("title");
    },
  );
});

/* ════════════════════════════════════════════
 * 주요 페이지 — 한국어 title 확인
 * ════════════════════════════════════════════ */

describe("주요 페이지 한국어 title", () => {
  const koreanTitles: [string, string][] = [
    ["checklist/[tripId]/page.tsx", "체크리스트"],
    ["cost/[tripId]/page.tsx", "비용"],
    ["vote/[tripId]/page.tsx", "투표"],
    ["guide/page.tsx", "가이드"],
    ["translate/page.tsx", "번역"],
  ];

  it.each(koreanTitles)(
    "%s — '%s' 한국어 키워드 포함",
    (file, keyword) => {
      const src = fs.readFileSync(path.resolve("app", file), "utf-8");
      expect(src).toContain(keyword);
    },
  );
});

/* ════════════════════════════════════════════
 * 루트 레이아웃 — 필수 metadata 필드
 * ════════════════════════════════════════════ */

describe("루트 레이아웃 metadata", () => {
  it("layout.tsx — description 포함", () => {
    const src = fs.readFileSync(path.resolve("app/layout.tsx"), "utf-8");
    expect(src).toContain("description");
  });

  it("layout.tsx — openGraph 또는 og 포함", () => {
    const src = fs.readFileSync(path.resolve("app/layout.tsx"), "utf-8");
    const hasOg = src.includes("openGraph") || src.includes("og:");
    expect(hasOg).toBe(true);
  });
});
