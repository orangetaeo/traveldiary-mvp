/**
 * Repository 레이어 횡단 패턴 검증.
 *
 * 모든 repository 파일이 일관된 구조를 따르는지 확인:
 * - "server-only" import (클라이언트 번들 방지)
 * - prisma import (DB 접근)
 * - !prisma null guard (데모 모드 fallback)
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const REPO_DIR = path.resolve("lib/repositories");
const REPO_FILES = fs
  .readdirSync(REPO_DIR)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => ({
    name: f,
    src: fs.readFileSync(path.join(REPO_DIR, f), "utf-8"),
  }));

/* ════════════════════════════════════════════
 * 파일 수 불변성
 * ════════════════════════════════════════════ */

describe("repository 파일 목록", () => {
  it("17개 repository 파일 존재", () => {
    expect(REPO_FILES.length).toBe(17);
  });

  it("알려진 repository 파일 전체 등록", () => {
    const names = REPO_FILES.map((f) => f.name).sort();
    expect(names).toEqual([
      "ab.repository.ts",
      "affiliate.repository.ts",
      "checklist.repository.ts",
      "cost.repository.ts",
      "evidence-cache.repository.ts",
      "funnel.repository.ts",
      "invite.repository.ts",
      "mode-transition-stats.repository.ts",
      "photo.repository.ts",
      "place.repository.ts",
      "review.repository.ts",
      "share.repository.ts",
      "shareComment.repository.ts",
      "trip.repository.ts",
      "user.repository.ts",
      "validation.repository.ts",
      "vote.repository.ts",
    ]);
  });
});

/* ════════════════════════════════════════════
 * "server-only" import
 * ════════════════════════════════════════════ */

describe("repository — 'server-only' import", () => {
  // trip.repository.ts는 시드 + 조회 혼합으로 server-only 미적용 (레거시)
  const EXPECTED_SERVER_ONLY = REPO_FILES.filter(
    (f) => f.name !== "trip.repository.ts",
  );

  it.each(EXPECTED_SERVER_ONLY.map((f) => [f.name, f.src]))(
    "%s — 'server-only' import 존재",
    (_name, src) => {
      expect(src).toContain('"server-only"');
    },
  );
});

/* ════════════════════════════════════════════
 * prisma import
 * ════════════════════════════════════════════ */

describe("repository — prisma import", () => {
  it.each(REPO_FILES.map((f) => [f.name, f.src]))(
    "%s — prisma import 존재",
    (_name, src) => {
      expect(src).toContain("prisma");
    },
  );
});

/* ════════════════════════════════════════════
 * !prisma null guard (데모 모드 fallback)
 * ════════════════════════════════════════════ */

describe("repository — !prisma null guard", () => {
  it.each(REPO_FILES.map((f) => [f.name, f.src]))(
    "%s — if (!prisma) 가드 존재",
    (_name, src) => {
      expect(src).toContain("!prisma");
    },
  );
});

/* ════════════════════════════════════════════
 * try/catch 에러 핸들링
 * ════════════════════════════════════════════ */

describe("repository — try/catch 패턴", () => {
  it.each(REPO_FILES.map((f) => [f.name, f.src]))(
    "%s — try/catch 에러 핸들링 존재",
    (_name, src) => {
      expect(src).toContain("catch");
    },
  );
});

/* ════════════════════════════════════════════
 * export 규칙 — default export 금지 (named export만)
 * ════════════════════════════════════════════ */

describe("repository — named export only", () => {
  it.each(REPO_FILES.map((f) => [f.name, f.src]))(
    "%s — export default 미사용",
    (_name, src) => {
      expect(src).not.toMatch(/^export default /m);
    },
  );
});
