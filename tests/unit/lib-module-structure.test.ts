/**
 * lib/ 모듈 구조 검증.
 *
 * lib/ 하위 디렉토리와 파일이 프로젝트 표준을 따르는지 확인:
 * - 서버 전용 모듈에 "server-only" import
 * - actions/ 파일 "use server" 선언
 * - lib/ 파일 default export 금지
 * - 필수 모듈 존재 확인
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/** 재귀적으로 .ts 파일 수집 */
function collectTsFiles(dir: string, baseDir: string): { relPath: string; src: string }[] {
  const results: { relPath: string; src: string }[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(fullPath, baseDir));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      results.push({ relPath, src: fs.readFileSync(fullPath, "utf-8") });
    }
  }
  return results;
}

const LIB_DIR = path.resolve("lib");
const ACTIONS_DIR = path.resolve("actions");
const ALL_LIB_FILES = collectTsFiles(LIB_DIR, LIB_DIR);
const ALL_ACTION_FILES = collectTsFiles(ACTIONS_DIR, ACTIONS_DIR);

/* ════════════════════════════════════════════
 * lib/ 파일 수
 * ════════════════════════════════════════════ */

describe("lib/ 모듈 수", () => {
  it("80개 이상 lib 파일 존재", () => {
    expect(ALL_LIB_FILES.length).toBeGreaterThanOrEqual(80);
  });

  it("actions 파일 13개 이상", () => {
    expect(ALL_ACTION_FILES.length).toBeGreaterThanOrEqual(13);
  });
});

/* ════════════════════════════════════════════
 * lib/ 필수 하위 디렉토리
 * ════════════════════════════════════════════ */

describe("lib/ 필수 디렉토리 구조", () => {
  const REQUIRED_DIRS = [
    "auth",
    "autonomy",
    "constants",
    "repositories",
    "seed",
    "services",
    "utils",
  ];

  it.each(REQUIRED_DIRS.map((d) => [d]))(
    "lib/%s/ 디렉토리 존재",
    (dir) => {
      const hasFiles = ALL_LIB_FILES.some((f) => f.relPath.startsWith(`${dir}/`));
      expect(hasFiles, `lib/${dir}/ 디렉토리에 파일 없음`).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * lib/ 필수 루트 파일
 * ════════════════════════════════════════════ */

describe("lib/ 필수 루트 파일", () => {
  const REQUIRED_ROOT_FILES = [
    "types.ts",
    "prisma.ts",
    "audit-log.ts",
    "allergens.ts",
    "mode-transition.ts",
    "replan.ts",
    "usage-quota.ts",
  ];

  const rootFiles = ALL_LIB_FILES.map((f) => f.relPath);

  it.each(REQUIRED_ROOT_FILES.map((f) => [f]))(
    "lib/%s 존재",
    (file) => {
      expect(rootFiles).toContain(file);
    },
  );
});

/* ════════════════════════════════════════════
 * actions/ — "use server" 선언
 * ════════════════════════════════════════════ */

describe("actions/ — 'use server' 선언", () => {
  // cache-utils는 "use server" 불필요 (유틸리티)
  const SERVER_ACTIONS = ALL_ACTION_FILES.filter(
    (f) => !f.relPath.includes("cache-utils"),
  );

  it.each(SERVER_ACTIONS.map((f) => [f.relPath, f.src]))(
    "%s — 'use server' 선언 존재",
    (_path, src) => {
      expect(src).toMatch(/^["']use server["']/m);
    },
  );
});

/* ════════════════════════════════════════════
 * actions/ — writeAuditLog 호출 (S-13)
 * ════════════════════════════════════════════ */

describe("actions/ — audit log (S-13)", () => {
  const MUTATION_ACTIONS = ALL_ACTION_FILES.filter(
    (f) => !f.relPath.includes("cache-utils"),
  );

  it.each(MUTATION_ACTIONS.map((f) => [f.relPath, f.src]))(
    "%s — writeAuditLog 호출 존재",
    (_path, src) => {
      expect(src).toContain("writeAuditLog");
    },
  );
});

/* ════════════════════════════════════════════
 * actions/ — auth 패턴 (getActorId/getOwnerId)
 * ════════════════════════════════════════════ */

describe("actions/ — 인증 패턴", () => {
  const AUTH_ACTIONS = ALL_ACTION_FILES.filter(
    (f) => !f.relPath.includes("cache-utils"),
  );

  it.each(AUTH_ACTIONS.map((f) => [f.relPath, f.src]))(
    "%s — 인증 함수 참조 존재",
    (_path, src) => {
      const hasAuth =
        src.includes("getActorId") ||
        src.includes("getOwnerId") ||
        src.includes("actorId");
      expect(hasAuth).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * lib/ — default export 금지
 * ════════════════════════════════════════════ */

describe("lib/ — named export only", () => {
  it.each(ALL_LIB_FILES.map((f) => [f.relPath, f.src]))(
    "lib/%s — export default 미사용",
    (_path, src) => {
      expect(src).not.toMatch(/^export default /m);
    },
  );
});

/* ════════════════════════════════════════════
 * lib/auth/ — 인증 모듈 필수 파일
 * ════════════════════════════════════════════ */

describe("lib/auth/ — 필수 파일", () => {
  const AUTH_FILES = ALL_LIB_FILES.filter((f) => f.relPath.startsWith("auth/"));

  it("인증 모듈 5개 이상 파일", () => {
    expect(AUTH_FILES.length).toBeGreaterThanOrEqual(5);
  });

  const REQUIRED_AUTH_FILES = [
    "auth/authorize.ts",
    "auth/jwt.ts",
    "auth/session.ts",
    "auth/kakao.ts",
  ];

  it.each(REQUIRED_AUTH_FILES.map((f) => [f]))(
    "lib/%s 존재",
    (file) => {
      const exists = AUTH_FILES.some((f) => f.relPath === file);
      expect(exists).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * lib/repositories/ — 파일 수 + 패턴
 * ════════════════════════════════════════════ */

describe("lib/repositories/ — 구조", () => {
  const REPO_FILES = ALL_LIB_FILES.filter((f) => f.relPath.startsWith("repositories/"));

  it("14개 이상 repository 파일", () => {
    expect(REPO_FILES.length).toBeGreaterThanOrEqual(14);
  });

  it("모든 repository 파일이 .repository.ts 확장자", () => {
    for (const f of REPO_FILES) {
      expect(f.relPath).toMatch(/\.repository\.ts$/);
    }
  });
});

/* ════════════════════════════════════════════
 * lib/services/ — 파일 수
 * ════════════════════════════════════════════ */

describe("lib/services/ — 구조", () => {
  const SERVICE_FILES = ALL_LIB_FILES.filter((f) => f.relPath.startsWith("services/"));

  it("20개 이상 service 파일", () => {
    expect(SERVICE_FILES.length).toBeGreaterThanOrEqual(20);
  });
});

/* ════════════════════════════════════════════
 * lib/autonomy/ — 24h 자율 인프라
 * ════════════════════════════════════════════ */

describe("lib/autonomy/ — 구조", () => {
  const AUTONOMY_FILES = ALL_LIB_FILES.filter((f) => f.relPath.startsWith("autonomy/"));

  it("8개 이상 autonomy 파일", () => {
    expect(AUTONOMY_FILES.length).toBeGreaterThanOrEqual(8);
  });

  const REQUIRED_AUTONOMY_FILES = [
    "autonomy/budget.ts",
    "autonomy/cycle-counter.ts",
    "autonomy/pick-model.ts",
    "autonomy/kst.ts",
  ];

  it.each(REQUIRED_AUTONOMY_FILES.map((f) => [f]))(
    "lib/%s 존재",
    (file) => {
      const exists = AUTONOMY_FILES.some((f) => f.relPath === file);
      expect(exists).toBe(true);
    },
  );
});

/* ════════════════════════════════════════════
 * lib/seed/ — 시드 모듈 구조
 * ════════════════════════════════════════════ */

describe("lib/seed/ — 구조", () => {
  const SEED_FILES = ALL_LIB_FILES.filter((f) => f.relPath.startsWith("seed/"));

  it("15개 이상 seed 파일", () => {
    expect(SEED_FILES.length).toBeGreaterThanOrEqual(15);
  });

  it("cities/ 하위 디렉토리에 10개 이상 도시 시드", () => {
    const cityFiles = SEED_FILES.filter((f) => f.relPath.startsWith("seed/cities/"));
    expect(cityFiles.length).toBeGreaterThanOrEqual(10);
  });
});
