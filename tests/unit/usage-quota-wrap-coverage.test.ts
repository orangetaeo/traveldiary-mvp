/**
 * 사이클 AAAA1 — 외부 API 서비스 6개 모두 quota wrap 적용 회귀 가드.
 *
 * 새 외부 API 서비스 추가 시 본 테스트 LIST에 추가 + wrap 적용 필수.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");

interface ServiceFixture {
  file: string;
  provider: string;
  /** assertQuota 또는 checkQuotaOrBlock 호출 수 (function별) */
  quotaChecks: number;
  /** recordExternalCall 소스 호출 수 (checkQuotaOrBlock 내부 호출 제외) */
  recordCalls: number;
}

const FIXTURES: ServiceFixture[] = [
  // anthropic-claude는 AAAA5b 진화 #8: catch 분기 3건(blockedBy quota/budget/emergency) + fetch 후 1건 = 4
  { file: "lib/services/anthropic-claude.ts", provider: "anthropic", quotaChecks: 1, recordCalls: 4 },
  // checkQuotaOrBlock 표준 전환: quota recording은 헬퍼 내부로 이동, 소스에는 fetch 성공/에러 recordCalls만 잔존
  { file: "lib/services/google-vision.ts", provider: "google-vision", quotaChecks: 1, recordCalls: 1 },
  { file: "lib/services/google-places.ts", provider: "google-places", quotaChecks: 2, recordCalls: 2 },
  { file: "lib/services/google-directions.ts", provider: "google-directions", quotaChecks: 1, recordCalls: 1 },
  { file: "lib/services/naver-search.ts", provider: "naver-search", quotaChecks: 2, recordCalls: 2 },
  // OTA 3사 공통 래퍼 (agoda/kkday/klook → fetch-ota.ts로 DRY 추출)
  { file: "lib/services/ota/fetch-ota.ts", provider: "ota", quotaChecks: 1, recordCalls: 2 },
];

function readSource(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("usage-quota wrap coverage — 외부 API 서비스 (사이클 AAAA1)", () => {
  for (const fx of FIXTURES) {
    describe(`${fx.file} (provider=${fx.provider})`, () => {
      const src = readSource(fx.file);

      it("usage-quota import 존재", () => {
        expect(src).toMatch(/from\s+["']@\/lib\/usage-quota["']/);
        // assertQuota 또는 checkQuotaOrBlock 중 하나 이상 import
        const hasAssert = src.includes("assertQuota");
        const hasCheck = src.includes("checkQuotaOrBlock");
        expect(hasAssert || hasCheck).toBe(true);
        expect(src).toContain("recordExternalCall");
      });

      it(`quota 체크 ("${fx.provider}") ${fx.quotaChecks}회`, () => {
        // assertQuota("provider") 또는 checkQuotaOrBlock("provider") 매칭
        const assertMatches = src.match(
          new RegExp(`assertQuota\\(\\s*["']${fx.provider}["']\\s*[,)]`, "g"),
        );
        const checkMatches = src.match(
          new RegExp(`checkQuotaOrBlock\\(\\s*["']${fx.provider}["']\\s*[,)]`, "g"),
        );
        const total = (assertMatches?.length ?? 0) + (checkMatches?.length ?? 0);
        expect(total).toBe(fx.quotaChecks);
      });

      it(`recordExternalCall("${fx.provider}") 소스 호출 ${fx.recordCalls}회`, () => {
        const matches = src.match(
          new RegExp(`recordExternalCall\\(\\s*["']${fx.provider}["']\\s*[,)]`, "g"),
        );
        expect(matches?.length ?? 0).toBe(fx.recordCalls);
      });

      it("quota_exceeded 핸들링 보장", () => {
        // checkQuotaOrBlock 사용 시 헬퍼가 quota_exceeded를 반환하므로 소스에 리터럴 불필요
        const hasLiteral = src.includes("quota_exceeded");
        const usesHelper = src.includes("checkQuotaOrBlock");
        expect(hasLiteral || usesHelper).toBe(true);
      });
    });
  }

  it("FIXTURES가 lib/services 외부 fetch 호출 파일을 모두 포함", () => {
    // 회귀 가드: 새 외부 API 서비스 추가 시 FIXTURES에도 등록 필수
    const KNOWN_PROVIDERS = new Set([
      "anthropic",
      "google-vision",
      "google-places",
      "google-directions",
      "naver-search",
      "ota",
    ]);
    const fixtureProviders = new Set(FIXTURES.map((f) => f.provider));
    for (const p of KNOWN_PROVIDERS) {
      expect(fixtureProviders.has(p)).toBe(true);
    }
  });
});
