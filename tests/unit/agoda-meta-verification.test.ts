/**
 * Agoda Partner 사이트 소유권 검증 메타 태그 회귀 가드.
 *
 * partners.agoda.com 매뉴얼 검증 단계에서 요구한 `<meta name="agd-partner-manual-verification" />`
 * 가 app/layout.tsx의 <head> 안에 존재하는지 확인.
 *
 * 회귀 시나리오:
 *  - layout.tsx 리팩터 시 메타 태그가 실수로 제거되면 Agoda 검증 실패 → AGODA_AFFILIATE_ID 신청 무효
 *  - 메타 태그 자체는 1회성이지만 영구 보존 필요 (Agoda 측 재검증 가능)
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const LAYOUT_PATH = path.resolve(__dirname, "../../app/layout.tsx");
const layoutSource = readFileSync(LAYOUT_PATH, "utf-8");

describe("Agoda partner meta verification", () => {
  it("agd-partner-manual-verification 메타 태그가 layout.tsx에 존재한다", () => {
    expect(layoutSource).toMatch(/<meta\s+name="agd-partner-manual-verification"\s*\/>/);
  });

  it("메타 태그가 <head> 블록 안에 있다 (<body> 이전)", () => {
    const metaIndex = layoutSource.indexOf("agd-partner-manual-verification");
    const headCloseIndex = layoutSource.indexOf("</head>");
    expect(metaIndex).toBeGreaterThan(0);
    expect(headCloseIndex).toBeGreaterThan(metaIndex);
  });

  it("주석으로 의도가 문서화되어 있다", () => {
    expect(layoutSource).toMatch(/Agoda Partner.*검증/);
  });
});
