/**
 * SEO Metadata 구조 검증 — 주요 페이지에 title/description 있는지 확인.
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function readPage(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

const SERVER_PAGES_WITH_META = [
  { path: "app/page.tsx", title: "TRAVELDIARY" },
  { path: "app/trips/page.tsx", title: "내 여행" },
  { path: "app/translate/page.tsx", title: "카메라 번역" },
];

describe("SEO — 주요 페이지 metadata export", () => {
  it.each(SERVER_PAGES_WITH_META)(
    "$path — metadata 포함 (title: $title)",
    ({ path: p, title }) => {
      const src = readPage(p);
      expect(src).toContain("export const metadata");
      expect(src).toContain(title);
    },
  );

  it("root layout — 기본 metadata", () => {
    const src = readPage("app/layout.tsx");
    expect(src).toContain("export const metadata");
    expect(src).toContain("TRAVELDIARY");
  });

  it("/share/[key] — generateMetadata (동적)", () => {
    const src = readPage("app/share/[key]/page.tsx");
    expect(src).toContain("generateMetadata");
  });
});
