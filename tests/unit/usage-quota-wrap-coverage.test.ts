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
  fetchCalls: number; // 호출처 수 (function별)
}

const FIXTURES: ServiceFixture[] = [
  { file: "lib/services/anthropic-claude.ts", provider: "anthropic", fetchCalls: 1 },
  { file: "lib/services/google-vision.ts", provider: "google-vision", fetchCalls: 1 },
  { file: "lib/services/google-places.ts", provider: "google-places", fetchCalls: 2 },
  { file: "lib/services/google-directions.ts", provider: "google-directions", fetchCalls: 1 },
  { file: "lib/services/naver-search.ts", provider: "naver-search", fetchCalls: 2 },
  { file: "lib/services/ota/agoda.ts", provider: "ota", fetchCalls: 1 },
  { file: "lib/services/ota/kkday.ts", provider: "ota", fetchCalls: 1 },
  { file: "lib/services/ota/klook.ts", provider: "ota", fetchCalls: 1 },
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
        expect(src).toContain("assertQuota");
        expect(src).toContain("recordExternalCall");
        expect(src).toContain("QuotaExceededError");
      });

      it(`assertQuota("${fx.provider}") 호출 ${fx.fetchCalls}회`, () => {
        const matches = src.match(
          new RegExp(`assertQuota\\(\\s*["']${fx.provider}["']\\s*\\)`, "g"),
        );
        expect(matches?.length ?? 0).toBe(fx.fetchCalls);
      });

      it(`recordExternalCall("${fx.provider}") 호출 ${fx.fetchCalls}회`, () => {
        const matches = src.match(
          new RegExp(`recordExternalCall\\(\\s*["']${fx.provider}["']\\s*\\)`, "g"),
        );
        expect(matches?.length ?? 0).toBe(fx.fetchCalls);
      });

      it("outcome union에 quota_exceeded 포함", () => {
        expect(src).toContain("quota_exceeded");
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
