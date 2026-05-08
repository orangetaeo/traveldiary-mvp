/**
 * 액션 버튼 모바일 발견성 회귀 가드.
 *
 * 배경: hover 의존 UI(`opacity-0 group-hover:opacity-100`)는 터치 디바이스에서
 *      손가락 hover가 없으므로 버튼 발견 불가. 모바일은 항상 노출(opacity-70/80),
 *      데스크톱(md:)에만 hover 의존 패턴 적용.
 *
 * 검증 대상:
 *  - components/album/PhotoAlbumView.tsx (사진 삭제 버튼)
 *  - components/cost/CostEntriesList.tsx (수정 + 삭제 버튼)
 *  - components/checklist/ChecklistBucketList.tsx (삭제 버튼)
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

const FILES = [
  "components/album/PhotoAlbumView.tsx",
  "components/cost/CostEntriesList.tsx",
  "components/checklist/ChecklistBucketList.tsx",
];

describe("액션 버튼 모바일 발견성", () => {
  for (const rel of FILES) {
    describe(rel, () => {
      const src = fs.readFileSync(path.resolve(ROOT, rel), "utf-8");

      it("hover-only opacity-0 패턴 부재 (모바일 차단 회귀 가드)", () => {
        // base에서 opacity-0이면 모바일 노출 X
        // 허용: md:opacity-0 (데스크톱만 숨김)
        const lines = src.split("\n");
        for (const line of lines) {
          if (!line.includes("opacity-0")) continue;
          if (line.includes("md:opacity-0")) continue;
          // base opacity-0 + group-hover만 있는 라인은 fail
          if (line.includes("group-hover:opacity-100")) {
            expect.fail(`hover-only 라인 발견: ${line.trim()}`);
          }
        }
      });

      it("md: 브레이크포인트로 데스크톱만 hover 의존 (mobile-first)", () => {
        // 모든 group-hover:opacity-100는 md: 프리픽스가 붙어야 함
        // (`:` 포함 prefix 캡처)
        const matches = src.match(/[a-z:-]*group-hover:opacity-100/g) ?? [];
        for (const m of matches) {
          expect(m).toBe("md:group-hover:opacity-100");
        }
      });

      it("모바일 기본 opacity가 60~80 범위 (발견 가능)", () => {
        // opacity-60 ~ opacity-80 중 하나는 있어야 함
        const hasMobileOpacity =
          /opacity-(6[0-9]|7[0-9]|80)\b/.test(src);
        expect(hasMobileOpacity).toBe(true);
      });

      it("focus-visible 또는 focus 키보드 노출 유지", () => {
        expect(src).toMatch(/focus(-visible)?:opacity-100/);
      });
    });
  }
});
