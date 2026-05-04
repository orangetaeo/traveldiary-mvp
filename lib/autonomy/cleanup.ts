/**
 * 30일 quarantine cleanup 로직 (사이클 AAAA6 P1, AAAA9 추출).
 *
 * **추출 트리거** (사이클 AAAA9): vitest 2.1.9 + Node 24 환경에서 `.mjs` 파일 직접 import 시
 * SyntaxError 발생. AAAA6 시점 일시 통과했던 `tests/unit/quarantine-cleanup.test.ts`가 본 사이클의
 * kst.ts swap 이후 회귀. logic을 TS로 분리하여 안정 import.
 *
 * - `scripts/quarantine-cleanup.mjs`는 현 상태 유지 (Node 단독 실행용 — Prisma DB 의존 회피)
 * - 본 모듈은 vitest 회귀 + 향후 다른 호출자 (예: dashboard) 사용
 * - DRY: script와 logic이 두 곳에 중복. P3 백로그 — script가 컴파일된 .js를 import하는 build step
 *   도입 시 통합. 현재는 핫패스가 아니므로 중복 허용.
 *
 * **DEAD flag 보존** (사이클 AAAA4 P0): `QUARANTINE_DEAD.flag`는 운영자 직접 처리 대상이므로
 * 자동 삭제 X.
 */

import { existsSync, readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";
import { getMemoryDir } from "@/lib/autonomy/kst";

const DEFAULT_RETENTION_DAYS = 30;
const QUARANTINE_DEAD_FLAG = "QUARANTINE_DEAD.flag";

export interface CleanupResult {
  scanned: number;
  removed: number;
  kept: number;
  errors: number;
  removedFiles: string[];
}

export interface CleanupOptions {
  retentionDays?: number;
  dryRun?: boolean;
  now?: number;
  dir?: string;
}

export function cleanupQuarantine(opts: CleanupOptions = {}): CleanupResult {
  const retentionDays = opts.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const dryRun = opts.dryRun ?? false;
  const now = opts.now ?? Date.now();
  const dir = opts.dir ?? getMemoryDir();
  const quarantineDir = join(dir, "quarantine");

  const result: CleanupResult = {
    scanned: 0,
    removed: 0,
    kept: 0,
    errors: 0,
    removedFiles: [],
  };

  if (!existsSync(quarantineDir)) {
    return result;
  }

  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
  const entries = readdirSync(quarantineDir);

  for (const entry of entries) {
    if (entry === QUARANTINE_DEAD_FLAG) {
      result.kept += 1;
      continue;
    }

    const path = join(quarantineDir, entry);
    result.scanned += 1;

    try {
      const st = statSync(path);
      if (!st.isFile()) {
        result.kept += 1;
        continue;
      }
      if (st.mtimeMs < cutoff) {
        if (!dryRun) {
          unlinkSync(path);
        }
        result.removed += 1;
        result.removedFiles.push(entry);
      } else {
        result.kept += 1;
      }
    } catch (err) {
      result.errors += 1;
      console.error(`[cleanup] failed to process ${path}:`, err);
    }
  }

  return result;
}
