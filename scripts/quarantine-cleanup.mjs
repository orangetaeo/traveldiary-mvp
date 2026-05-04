#!/usr/bin/env node
/**
 * 30일 quarantine cleanup (사이클 AAAA6 P1).
 *
 * memory/quarantine/ 디렉토리에서 retentionDays(default 30)보다 오래된 파일을 삭제.
 * - QUARANTINE_DEAD.flag는 운영자 직접 처리 대상이므로 자동 삭제 X.
 * - mtime 기준 (atime은 일부 파일시스템에서 비활성).
 * - audit log는 stdout만 (start.sh precedent — Prisma DB 의존 회피).
 *
 * 사용법:
 *   node scripts/quarantine-cleanup.mjs                          # 30일 default
 *   node scripts/quarantine-cleanup.mjs --dry-run                # 삭제 안 하고 목록만
 *   node scripts/quarantine-cleanup.mjs --retention-days=60      # 60일 유지
 *   AUTONOMY_MEMORY_DIR=/path node scripts/quarantine-cleanup.mjs
 *
 * 위치: GitHub Actions cron (.github/workflows/quarantine-cleanup.yml) 또는
 *       Windows Task Scheduler (docs/14-autonomy-task-scheduler-setup.md §3-3).
 */
import { existsSync, readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

const DEFAULT_RETENTION_DAYS = 30;
const QUARANTINE_DEAD_FLAG = "QUARANTINE_DEAD.flag";

export function getMemoryDir() {
  return process.env.AUTONOMY_MEMORY_DIR ?? join(process.cwd(), "memory");
}

/**
 * 30일 경과한 quarantine 파일 sweep.
 *
 * @param {{ retentionDays?: number, dryRun?: boolean, now?: number, dir?: string }} opts
 * @returns {{ scanned: number, removed: number, kept: number, errors: number, removedFiles: string[] }}
 */
export function cleanupQuarantine(opts = {}) {
  const retentionDays = opts.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const dryRun = opts.dryRun ?? false;
  const now = opts.now ?? Date.now();
  const dir = opts.dir ?? getMemoryDir();
  const quarantineDir = join(dir, "quarantine");

  const result = {
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
      // DEAD flag는 운영자가 직접 처리 (사이클 AAAA4 P0 sentinel). cleanup skip.
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
      console.error(`[quarantine-cleanup] failed to process ${path}:`, err);
    }
  }

  return result;
}

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const retentionArg = argv.find((a) => a.startsWith("--retention-days="));
  const retentionDays = retentionArg
    ? Number.parseInt(retentionArg.split("=")[1], 10)
    : DEFAULT_RETENTION_DAYS;
  if (!Number.isFinite(retentionDays) || retentionDays < 0) {
    throw new Error(`invalid --retention-days: ${retentionArg}`);
  }
  return { dryRun, retentionDays };
}

function main() {
  const { dryRun, retentionDays } = parseArgs(process.argv.slice(2));
  const dir = getMemoryDir();
  console.log(
    `[quarantine-cleanup] dir=${dir} retention=${retentionDays}d dry-run=${dryRun}`,
  );
  const result = cleanupQuarantine({ retentionDays, dryRun });
  console.log(
    `[quarantine-cleanup] scanned=${result.scanned} removed=${result.removed} kept=${result.kept} errors=${result.errors}`,
  );
  if (result.removedFiles.length > 0) {
    console.log(`[quarantine-cleanup] removed files (sample 50):`);
    for (const f of result.removedFiles.slice(0, 50)) {
      console.log(`  - ${f}`);
    }
  }
  process.exit(result.errors > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("quarantine-cleanup.mjs")) {
  main();
}
