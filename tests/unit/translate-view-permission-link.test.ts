/**
 * 사이클 4 (G9) — TranslateView 헤더 권한 도움말 링크 회귀 테스트.
 *
 * CapturingView 헤더의 데드 settings 버튼이 /permission/camera 도움말 링크로
 * 변경됐는지 source-level grep으로 단언. (TranslateView는 useState/useRef
 * 의존이라 정적 렌더 테스트가 어려워 source 검사로 회귀 차단.)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const SOURCE_PATH = path.resolve(
  __dirname,
  "../../components/translate/TranslateView.tsx",
);

describe("TranslateView — 사이클 4 (G9) 헤더 권한 도움말", () => {
  const source = readFileSync(SOURCE_PATH, "utf-8");

  it("헤더에 /permission/camera Link 존재", () => {
    expect(source).toContain('href="/permission/camera"');
  });

  it("aria-label '카메라 권한 도움말' 명시", () => {
    expect(source).toContain('aria-label="카메라 권한 도움말"');
  });

  it("help 아이콘 사용 (settings 데드 버튼 대체)", () => {
    // help 아이콘이 헤더 영역에서 사용되는지 — material-symbols-outlined help
    expect(source).toMatch(/material-symbols-outlined[^>]*>\s*help\s*</);
  });

  it("이전 데드 settings 버튼 회귀 차단 — '설정' aria-label 미존재", () => {
    expect(source).not.toContain('aria-label="설정"');
  });
});
