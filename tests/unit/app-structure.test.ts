/**
 * app/ 디렉토리 구조 검증.
 *
 * Next.js App Router 규칙 + 프로젝트 표준 확인:
 * - page.tsx: 최소 default export, metadata/generateMetadata 존재 여부
 * - layout.tsx: children props 전달
 * - route.ts: HTTP 메서드 export, NextResponse 사용
 * - 동적 라우트 [param]: params 타입 처리
 * - "use client" 사용 시 서버 전용 import 금지
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/** 재귀적으로 파일 수집 */
function collectFiles(
  dir: string,
  filter: (name: string) => boolean,
): { relPath: string; src: string }[] {
  const results: { relPath: string; src: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, filter));
    } else if (filter(entry.name)) {
      const relPath = path.relative(path.resolve("app"), fullPath).replace(/\\/g, "/");
      results.push({ relPath, src: fs.readFileSync(fullPath, "utf-8") });
    }
  }
  return results;
}

const APP_DIR = path.resolve("app");
const ALL_PAGES = collectFiles(APP_DIR, (n) => n === "page.tsx");
const ALL_LAYOUTS = collectFiles(APP_DIR, (n) => n === "layout.tsx");
const ALL_ROUTES = collectFiles(APP_DIR, (n) => n === "route.ts");
const ALL_APP_FILES = collectFiles(APP_DIR, (n) => n.endsWith(".tsx") || n.endsWith(".ts"));

/* ════════════════════════════════════════════
 * 파일 수 기본 확인
 * ════════════════════════════════════════════ */

describe("app 디렉토리 — 파일 수", () => {
  it("34개 이상 page.tsx 존재", () => {
    expect(ALL_PAGES.length).toBeGreaterThanOrEqual(34);
  });

  it("3개 이상 layout.tsx 존재", () => {
    expect(ALL_LAYOUTS.length).toBeGreaterThanOrEqual(3);
  });

  it("9개 이상 API route 존재", () => {
    expect(ALL_ROUTES.length).toBeGreaterThanOrEqual(9);
  });
});

/* ════════════════════════════════════════════
 * page.tsx — export default 존재
 * ════════════════════════════════════════════ */

describe("page.tsx — default export", () => {
  it.each(ALL_PAGES.map((f) => [f.relPath, f.src]))(
    "%s — default export 존재",
    (_path, src) => {
      const hasDefaultExport =
        /export default/.test(src) || /export \{[^}]*default/.test(src);
      expect(hasDefaultExport).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * layout.tsx — children 전달
 * ════════════════════════════════════════════ */

describe("layout.tsx — children props", () => {
  it.each(ALL_LAYOUTS.map((f) => [f.relPath, f.src]))(
    "%s — children 참조 존재",
    (_path, src) => {
      expect(src).toContain("children");
    },
  );
});

/* ════════════════════════════════════════════
 * 동적 라우트 — [param] 디렉토리 확인
 * ════════════════════════════════════════════ */

describe("동적 라우트 — params 처리", () => {
  const DYNAMIC_PAGES = ALL_PAGES.filter((f) => f.relPath.includes("["));

  it("동적 라우트 페이지 15개 이상", () => {
    expect(DYNAMIC_PAGES.length).toBeGreaterThanOrEqual(15);
  });

  it.each(DYNAMIC_PAGES.map((f) => [f.relPath, f.src]))(
    "%s — params 또는 동적 param 참조 존재",
    (relPath, src) => {
      // [xxx] 에서 param 이름 추출
      const paramMatch = relPath.match(/\[(\w+)\]/);
      if (paramMatch) {
        const paramName = paramMatch[1];
        const hasParam =
          src.includes("params") ||
          src.includes(paramName) ||
          src.includes("searchParams");
        expect(hasParam, `${paramName} 파라미터 참조 없음`).toBe(true);
      }
    },
  );
});

/* ════════════════════════════════════════════
 * "use client" 페이지 — server-only import 금지
 * ════════════════════════════════════════════ */

describe("app 파일 — use client + server-only 충돌 방지", () => {
  const CLIENT_FILES = ALL_APP_FILES.filter((f) =>
    /^["']use client["']/.test(f.src.trimStart()),
  );

  it.each(CLIENT_FILES.map((f) => [f.relPath, f.src]))(
    "%s — 'server-only' import 없음",
    (_path, src) => {
      expect(src).not.toContain('"server-only"');
    },
  );
});

/* ════════════════════════════════════════════
 * 주요 페이지 경로 존재 확인
 * ════════════════════════════════════════════ */

describe("주요 페이지 경로 존재", () => {
  const REQUIRED_PAGES = [
    "page.tsx",                         // 홈
    "guide/page.tsx",                   // 가이드
    "translate/page.tsx",               // 번역
    "trips/page.tsx",                   // 여행 목록
    "profile/page.tsx",                 // 프로필
    "settings/page.tsx",               // 설정
    "shared/page.tsx",                  // 공유받은 키
    "onboarding/page.tsx",             // 온보딩
    "notifications/page.tsx",          // 알림
    "checklist/[tripId]/page.tsx",     // 체크리스트
    "cost/[tripId]/page.tsx",          // 비용
    "vote/[tripId]/page.tsx",          // 투표
    "itinerary/[id]/page.tsx",         // 일정 상세
    "city/[slug]/page.tsx",            // 도시 가이드
    "share/[key]/page.tsx",            // 공유 페이지
    "admin/page.tsx",                   // 관리자
  ];

  const pageRelPaths = ALL_PAGES.map((f) => f.relPath);

  it.each(REQUIRED_PAGES.map((p) => [p]))(
    "%s — 페이지 존재",
    (requiredPath) => {
      expect(pageRelPaths).toContain(requiredPath);
    },
  );
});

/* ════════════════════════════════════════════
 * admin 페이지 — 인증 가드 (ADMIN_SECRET_KEY)
 * ════════════════════════════════════════════ */

describe("admin 페이지 — 인증 패턴", () => {
  const ADMIN_PAGES = ALL_PAGES.filter((f) => f.relPath.startsWith("admin/"));

  it("admin 페이지 5개 이상", () => {
    expect(ADMIN_PAGES.length).toBeGreaterThanOrEqual(5);
  });

  it.each(ADMIN_PAGES.map((f) => [f.relPath, f.src]))(
    "%s — searchParams 또는 인증 체크 참조",
    (_path, src) => {
      // admin 페이지는 searchParams 또는 ADMIN_SECRET_KEY 체크
      const hasAuth =
        src.includes("searchParams") ||
        src.includes("ADMIN") ||
        src.includes("adminKey") ||
        src.includes("secret");
      expect(hasAuth).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * API route — HTTP 메서드 export
 * ════════════════════════════════════════════ */

describe("API route — HTTP 메서드", () => {
  it.each(ALL_ROUTES.map((f) => [f.relPath, f.src]))(
    "%s — GET 또는 POST export 존재",
    (_path, src) => {
      const hasMethod =
        /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/.test(src);
      expect(hasMethod).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * API route — NextResponse 사용
 * ════════════════════════════════════════════ */

describe("API route — NextResponse", () => {
  it.each(ALL_ROUTES.map((f) => [f.relPath, f.src]))(
    "%s — NextResponse import 존재",
    (_path, src) => {
      expect(src).toContain("NextResponse");
    },
  );
});

/* ════════════════════════════════════════════
 * 라우트 그룹 — 디렉토리 분류
 * ════════════════════════════════════════════ */

describe("app 디렉토리 — 라우트 그룹", () => {
  const topLevelDirs = new Set<string>();
  for (const f of ALL_APP_FILES) {
    const firstDir = f.relPath.split("/")[0];
    if (firstDir !== f.relPath) {
      topLevelDirs.add(firstDir);
    }
  }

  it("15개 이상 라우트 그룹 존재", () => {
    expect(topLevelDirs.size).toBeGreaterThanOrEqual(15);
  });

  const REQUIRED_DIRS = [
    "admin",
    "api",
    "checklist",
    "city",
    "cost",
    "guide",
    "itinerary",
    "onboarding",
    "profile",
    "share",
    "translate",
    "travel",
    "trips",
    "vote",
  ];

  it.each(REQUIRED_DIRS.map((d) => [d]))(
    "%s/ 디렉토리 존재",
    (dir) => {
      expect(topLevelDirs.has(dir), `${dir}/ 디렉토리 없음`).toBe(true);
    },
  );
});
