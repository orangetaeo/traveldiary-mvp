/**
 * Service 레이어 횡단 패턴 검증.
 *
 * lib/services/ 파일이 일관된 구조를 따르는지 확인:
 * - "server-only" import (서버 전용 서비스)
 * - API key availability 함수 export (외부 API 래퍼)
 * - checkQuotaOrBlock / recordExternalCall 사용 (외부 API 호출)
 * - 데모 모드 fallback (API key 미설정 시)
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/** 재귀적으로 .ts 파일 수집 */
function collectServiceFiles(dir: string): { relPath: string; src: string }[] {
  const results: { relPath: string; src: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectServiceFiles(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      const relPath = path.relative(path.resolve("lib/services"), fullPath).replace(/\\/g, "/");
      results.push({ relPath, src: fs.readFileSync(fullPath, "utf-8") });
    }
  }
  return results;
}

const SERVICES_DIR = path.resolve("lib/services");
const ALL_SERVICES = collectServiceFiles(SERVICES_DIR);

// 외부 API를 호출하는 서비스 (데모 fallback + quota 필수)
const EXTERNAL_API_SERVICES = ALL_SERVICES.filter((f) =>
  [
    "google-places.ts",
    "google-vision.ts",
    "google-directions.ts",
    "naver-search.ts",
    "anthropic-claude.ts",
    "ota/fetch-ota.ts",
    "itinerary-generator.ts",
  ].includes(f.relPath),
);

// 순수 함수 서비스 (server-only 불필요)
const PURE_LOGIC_SERVICES = [
  "booking-rules.ts",
  "distance-rules.ts",
  "geolocation.ts",    // 브라우저 API, 클라이언트 실행
  "resolved-trip.ts",  // 뷰 객체 조합 (server/client 양용)
  "settlement.ts",     // 정산 계산 순수 함수
  "trips-listing.ts",  // SSR 카드 빌드
];

/* ════════════════════════════════════════════
 * 파일 수 불변성
 * ════════════════════════════════════════════ */

describe("service 파일 목록", () => {
  it("23개 service 파일 존재", () => {
    expect(ALL_SERVICES.length).toBe(23);
  });

  it("외부 API 서비스 7개", () => {
    expect(EXTERNAL_API_SERVICES.length).toBe(7);
  });
});

/* ════════════════════════════════════════════
 * "server-only" import
 * ════════════════════════════════════════════ */

describe("service — 'server-only' import", () => {
  const SHOULD_HAVE_SERVER_ONLY = ALL_SERVICES.filter(
    (f) => !PURE_LOGIC_SERVICES.includes(f.relPath),
  );

  it.each(SHOULD_HAVE_SERVER_ONLY.map((f) => [f.relPath, f.src]))(
    "%s — 'server-only' import 존재",
    (_path, src) => {
      expect(src).toContain('"server-only"');
    },
  );
});

/* ════════════════════════════════════════════
 * 외부 API 서비스 — API key availability 함수
 * ════════════════════════════════════════════ */

describe("외부 API 서비스 — availability 함수 export", () => {
  // fetch-ota는 개별 OTA 모듈에 availability 위임
  const AVAILABILITY_SERVICES = EXTERNAL_API_SERVICES.filter(
    (f) => f.relPath !== "ota/fetch-ota.ts",
  );

  it.each(AVAILABILITY_SERVICES.map((f) => [f.relPath, f.src]))(
    "%s — *Available 함수 export 존재",
    (_path, src) => {
      const hasAvailability =
        /export\s+(const|function)\s+\w*[Aa]vailable/.test(src);
      expect(hasAvailability).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * 외부 API 서비스 — checkQuotaOrBlock 사용
 * ════════════════════════════════════════════ */

describe("외부 API 서비스 — quota 관리", () => {
  it.each(EXTERNAL_API_SERVICES.map((f) => [f.relPath, f.src]))(
    "%s — checkQuotaOrBlock 또는 assertQuota import 존재",
    (_path, src) => {
      // checkQuotaOrBlock: 논블로킹 quota 검사 (Google/Naver/OTA)
      // assertQuota: throw 기반 quota 검사 (Claude/AI — budget 연계)
      const hasQuota =
        src.includes("checkQuotaOrBlock") || src.includes("assertQuota");
      expect(hasQuota).toBe(true);
    },
  );

  it.each(EXTERNAL_API_SERVICES.map((f) => [f.relPath, f.src]))(
    "%s — recordExternalCall import 존재",
    (_path, src) => {
      expect(src).toContain("recordExternalCall");
    },
  );
});

/* ════════════════════════════════════════════
 * 외부 API 서비스 — 데모 모드 fallback
 * ════════════════════════════════════════════ */

describe("외부 API 서비스 — 데모 모드 fallback", () => {
  it.each(EXTERNAL_API_SERVICES.map((f) => [f.relPath, f.src]))(
    "%s — demo fallback 존재",
    (_path, src) => {
      const hasDemoFallback =
        src.includes('"demo"') || src.includes("'demo'");
      expect(hasDemoFallback).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * 외부 API 서비스 — try/catch 에러 핸들링
 * ════════════════════════════════════════════ */

describe("외부 API 서비스 — 에러 핸들링", () => {
  it.each(EXTERNAL_API_SERVICES.map((f) => [f.relPath, f.src]))(
    "%s — try/catch 존재",
    (_path, src) => {
      expect(src).toContain("catch");
    },
  );
});

/* ════════════════════════════════════════════
 * 외부 API 서비스 — EvidenceCache 사용 (결과 캐싱)
 * ════════════════════════════════════════════ */

describe("외부 API 서비스 — 캐시 패턴", () => {
  // fetch-ota와 itinerary-generator는 자체 캐시 전략 사용
  const CACHE_SERVICES = EXTERNAL_API_SERVICES.filter(
    (f) => !["ota/fetch-ota.ts", "itinerary-generator.ts"].includes(f.relPath),
  );

  it.each(CACHE_SERVICES.map((f) => [f.relPath, f.src]))(
    "%s — EvidenceCache 사용",
    (_path, src) => {
      const hasCache =
        src.includes("getEvidenceCache") || src.includes("setEvidenceCache");
      expect(hasCache).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * default export 금지
 * ════════════════════════════════════════════ */

describe("service — named export only", () => {
  it.each(ALL_SERVICES.map((f) => [f.relPath, f.src]))(
    "%s — export default 미사용",
    (_path, src) => {
      expect(src).not.toMatch(/^export default /m);
    },
  );
});
