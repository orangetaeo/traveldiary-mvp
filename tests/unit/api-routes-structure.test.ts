/**
 * API Route 횡단 패턴 검증.
 *
 * 모든 app/api/ route 파일이 일관된 구조를 따르는지 확인:
 * - NextResponse import (JSON 응답)
 * - force-dynamic export (SSR 강제)
 * - HTTP 메서드 export (GET/POST)
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/** 재귀적으로 route.ts/route.tsx 파일 수집 */
function collectRouteFiles(dir: string): { relPath: string; src: string }[] {
  const results: { relPath: string; src: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectRouteFiles(fullPath));
    } else if (entry.name === "route.ts" || entry.name === "route.tsx") {
      const relPath = path.relative(path.resolve("app/api"), fullPath).replace(/\\/g, "/");
      results.push({ relPath, src: fs.readFileSync(fullPath, "utf-8") });
    }
  }
  return results;
}

const API_DIR = path.resolve("app/api");
const ROUTE_FILES = collectRouteFiles(API_DIR);

/* ════════════════════════════════════════════
 * 파일 수 불변성
 * ════════════════════════════════════════════ */

describe("API route 파일 목록", () => {
  it("13개 route 파일 존재", () => {
    expect(ROUTE_FILES.length).toBe(13);
  });

  it("알려진 route 파일 전체 등록", () => {
    const paths = ROUTE_FILES.map((f) => f.relPath).sort();
    expect(paths).toEqual([
      "analytics/ab/route.ts",
      "analytics/funnel/route.ts",
      // 사이클 8 (G3, ADR-049) — 계정 삭제
      "auth/account/route.ts",
      "auth/kakao/callback/route.ts",
      "auth/kakao/start/route.ts",
      "auth/logout/route.ts",
      "diag/translate/route.ts",
      "health/route.ts",
      "og/share/[key]/route.tsx",
      // 인스타 스토리 OG 이미지
      "og/share/[key]/story/route.tsx",
      // A3 관광지 이미지 — Google Places Photo 프록시
      "places/photo/route.ts",
      "share/lookup/route.ts",
      "share/my-activity/route.ts",
    ]);
  });
});

/* ════════════════════════════════════════════
 * NextResponse import
 * ════════════════════════════════════════════ */

describe("API route — Response import", () => {
  it.each(ROUTE_FILES.map((f) => [f.relPath, f.src]))(
    "%s — NextResponse 또는 ImageResponse import 존재",
    (_path, src) => {
      const hasResponse =
        src.includes("NextResponse") || src.includes("ImageResponse");
      expect(hasResponse).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * force-dynamic export
 * ════════════════════════════════════════════ */

describe("API route — force-dynamic export", () => {
  // analytics/funnel, analytics/ab: POST-only fire-and-forget → dynamic 미필수
  const DYNAMIC_REQUIRED = ROUTE_FILES.filter(
    (f) =>
      !f.relPath.startsWith("analytics/"),
  );

  it.each(DYNAMIC_REQUIRED.map((f) => [f.relPath, f.src]))(
    "%s — force-dynamic export 존재",
    (_path, src) => {
      expect(src).toContain('"force-dynamic"');
    },
  );
});

/* ════════════════════════════════════════════
 * HTTP 메서드 export (GET or POST)
 * ════════════════════════════════════════════ */

describe("API route — HTTP 메서드 export", () => {
  it.each(ROUTE_FILES.map((f) => [f.relPath, f.src]))(
    "%s — GET/POST/DELETE export 존재",
    (_path, src) => {
      const hasMethod =
        /export\s+(async\s+)?function\s+(GET|POST|DELETE|PUT|PATCH)/.test(src);
      expect(hasMethod).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * 에러 응답 패턴 (try/catch 또는 status 400+)
 * ════════════════════════════════════════════ */

describe("API route — 에러 핸들링", () => {
  // OG image: fallback 이미지 반환으로 에러 처리 (try/catch 불필요)
  // kakao callback: redirect fallback으로 에러 처리
  // diag/translate: 진단용 API로 에러 시 JSON 반환
  const ERROR_HANDLING_ROUTES = ROUTE_FILES.filter(
    (f) =>
      !["og/share/[key]/route.tsx", "auth/kakao/callback/route.ts", "diag/translate/route.ts"].includes(f.relPath),
  );

  it.each(ERROR_HANDLING_ROUTES.map((f) => [f.relPath, f.src]))(
    "%s — try/catch 또는 status 4xx/5xx 응답 존재",
    (_path, src) => {
      const hasErrorHandling =
        src.includes("catch") ||
        src.includes("status: 4") ||
        src.includes("status: 5") ||
        src.includes("{ status: 400 }") ||
        src.includes("{ status: 500 }");
      expect(hasErrorHandling).toBe(true);
    },
  );
});
