/**
 * 회귀 가드 — aria-disabled boolean 값 명시 (WCAG 2.1 SC 4.1.2).
 *
 * `aria-disabled` (값 없음, JSX) → SSR 시 `aria-disabled=""` (빈 문자열) 출력.
 * 일부 스크린리더는 빈 문자열을 false로 해석할 수 있어 "true" 명시 권장.
 *
 * 4 placeholder/admin 페이지 모두 정정 (옵션 Y / U-deadlinks 답습 미세 정정):
 *   - app/settings/cache/page.tsx
 *   - app/settings/account-link/page.tsx
 *   - app/admin/affiliate/page.tsx
 *   - app/admin/funnel/page.tsx
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// vitest cwd 의존성 회피 — 테스트 파일 기준 절대 경로 (feedback_bash_cd_workaround)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

const FILES = [
  "app/settings/cache/page.tsx",
  "app/settings/account-link/page.tsx",
  "app/admin/affiliate/page.tsx",
  "app/admin/funnel/page.tsx",
];

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), "utf-8");
}

describe("aria-disabled boolean 값 명시 (WCAG)", () => {
  for (const file of FILES) {
    describe(file, () => {
      it("disabled + aria-disabled=\"true\" 동시 명시", () => {
        const src = read(file);
        // 정정 후 패턴: `aria-disabled="true"` 명시
        expect(src).toContain('aria-disabled="true"');
      });

      it("값 없는 `aria-disabled` 단독 라인 부재 (정정 완료)", () => {
        const src = read(file);
        // 회귀 차단: `aria-disabled` 뒤에 = 없이 줄 바꿈/공백/스페이스 종료 패턴 부재
        // 정확한 매칭: 라인 끝이 `aria-disabled` 자체(값 없음)
        expect(src).not.toMatch(/^\s*aria-disabled\s*$/m);
      });

      it("disabled 속성도 동시 보존 (HTML5 표준 + ARIA 이중 보강)", () => {
        const src = read(file);
        // `disabled\n        aria-disabled="true"` 페어 — 양쪽 모두 보존
        expect(src).toMatch(/disabled\s*\n\s*aria-disabled="true"/);
      });
    });
  }

  it("4 파일 중 어디에도 값 없는 aria-disabled 잔존 없음 (회귀 차단)", () => {
    for (const file of FILES) {
      const src = read(file);
      const lines = src.split(/\r?\n/);
      const dangling = lines.filter((line) =>
        /^\s*aria-disabled\s*$/.test(line),
      );
      expect(dangling).toEqual([]);
    }
  });
});
