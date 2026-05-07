/**
 * /city/[slug] phrases 섹션 → /phrases 풀 페이지 cross-link (옵션 P, 사이클 BB).
 *
 * PR #298(옵션 N) "전체 보기 →" 링크 패턴 답습 — 도시 가이드 phrases 섹션이
 * /phrases 14문장 + TTS 풀 페이지로 진입 가능해야 함.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("/city/[slug] phrases 섹션 cross-link to /phrases", () => {
  const src = fs.readFileSync(
    path.resolve("app/city/[slug]/page.tsx"),
    "utf-8",
  );

  it("phrases 섹션 헤더에 /phrases 링크 존재", () => {
    // phrases 섹션 내부에서 /phrases 링크 찾기
    const phrasesSectionMatch = src.match(
      /id="phrases"[\s\S]*?<\/section>/,
    );
    expect(phrasesSectionMatch).not.toBeNull();
    const sectionContent = phrasesSectionMatch![0];
    expect(sectionContent).toContain('href="/phrases"');
  });

  it("링크 라벨 — 14문장 + 발음 강조", () => {
    expect(src).toContain("전체 14문장 + 발음");
  });

  it("payment·emergency 답습 — text-purple-deep + hover:underline", () => {
    const phrasesSectionMatch = src.match(
      /id="phrases"[\s\S]*?<\/section>/,
    );
    const sectionContent = phrasesSectionMatch![0];
    expect(sectionContent).toContain("text-purple-deep");
    expect(sectionContent).toContain("hover:underline");
  });

  it("phrases 섹션 헤더 layout — flex justify-between (payment 답습)", () => {
    const phrasesSectionMatch = src.match(
      /id="phrases"[\s\S]*?<\/section>/,
    );
    const sectionContent = phrasesSectionMatch![0];
    expect(sectionContent).toMatch(
      /flex\s+items-center\s+justify-between/,
    );
  });
});
