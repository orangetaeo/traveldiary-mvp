/**
 * 회귀 가드 — modal button type="button" 명시.
 *
 * `<button>`이 form 안에서 type 미지정 시 기본값 "submit". 모달이 portal로
 * form 외부에 마운트되더라도 form 안에 nested 사용될 가능성 + 표준 안전 패턴.
 *
 * 정정 대상 6 button (PR #424/#427 신규 모달):
 *   OtaInterstitialModal — 예약하기 + 돌아가기 (2)
 *   ReplanConflictModal — KeepA + KeepB + KeepBoth + Close (4)
 *
 * vitest cwd 우회: import.meta.url 기반 절대 경로 (feedback_bash_cd_workaround).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), "utf-8");
}

const FILES_AND_COUNTS: Array<[string, number]> = [
  ["components/modals/OtaInterstitialModal.tsx", 2],
  ["components/modals/ReplanConflictModal.tsx", 4],
];

describe("modal button type=\"button\" 명시 — form submit 회귀 차단", () => {
  for (const [file, expectedCount] of FILES_AND_COUNTS) {
    describe(file, () => {
      it(`type="button" 정확히 ${expectedCount}건 명시`, () => {
        const src = read(file);
        const matches = src.match(/type="button"/g) ?? [];
        expect(matches.length).toBe(expectedCount);
      });

      it("type 누락 button 부재 (회귀 차단)", () => {
        const src = read(file);
        // <button 다음 줄에 onClick 또는 className만 있고 type 누락 패턴 부재
        // 정확히: <button\n            onClick (type 없음)
        const dangling = src.match(/<button\s*\n\s+onClick=/g) ?? [];
        expect(dangling).toEqual([]);
      });

      it("disabled나 다른 boolean 속성과 type 동시 보존 가능", () => {
        const src = read(file);
        // type="button" 모두 onClick 또는 다른 prop과 페어 — 단순 존재 확인
        expect(src).toContain('type="button"');
      });
    });
  }

  it("두 파일 합계 6 button 모두 type=\"button\" 명시", () => {
    let total = 0;
    for (const [file] of FILES_AND_COUNTS) {
      const src = read(file);
      total += (src.match(/type="button"/g) ?? []).length;
    }
    expect(total).toBe(6);
  });
});
