#!/usr/bin/env node
/**
 * AUTONOMY_PAUSED.flag 수동 복구 스크립트 (사이클 AAAA6, ENTRY.md §6).
 *
 * 손상 fail-closed 또는 budget.emergency 도달 후 사용자가 원인 분석 + 수동 복구할 때만 호출.
 * - ESLint `no-restricted-imports`로 자율 사이클 코드 경로 자동 호출 차단 (사이클 AAAA3).
 * - 본 스크립트는 scripts/ 디렉토리 override 적용 (allow-list).
 *
 * 사용법:
 *   node scripts/clear-autonomy-paused.mjs
 *   node scripts/clear-autonomy-paused.mjs --reason "post-mortem ABCD"
 *   AUTONOMY_MEMORY_DIR=/path node scripts/clear-autonomy-paused.mjs
 *
 * 동작:
 *   1. memory/AUTONOMY_PAUSED.flag 존재 확인
 *   2. 기존 reason/pausedAt 출력
 *   3. flag 삭제
 *   4. stdout 로그 (Prisma DB 의존 회피)
 *
 * 사용자 액션이므로 audit는 stdout만. 사용자가 의도적으로 호출했다는 사실은 shell 이력에 남음.
 */
import { existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

function getMemoryDir() {
  return process.env.AUTONOMY_MEMORY_DIR ?? join(process.cwd(), "memory");
}

function getPausedFlagPath(dir) {
  return join(dir, "AUTONOMY_PAUSED.flag");
}

function parseArgs(argv) {
  const reasonArg = argv.find((a) => a.startsWith("--reason="));
  const reason = reasonArg
    ? reasonArg.split("=").slice(1).join("=")
    : "manual_recovery";
  return { reason };
}

function main() {
  const { reason } = parseArgs(process.argv.slice(2));
  const dir = getMemoryDir();
  const flagPath = getPausedFlagPath(dir);

  if (!existsSync(flagPath)) {
    console.log(
      `[clear-autonomy-paused] flag not present at ${flagPath} — nothing to do`,
    );
    return;
  }

  let previous = null;
  try {
    const raw = readFileSync(flagPath, "utf-8");
    previous = JSON.parse(raw);
  } catch (err) {
    console.warn(
      `[clear-autonomy-paused] flag exists but unreadable (will still delete): ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (previous) {
    console.log(`[clear-autonomy-paused] previous flag:`);
    console.log(`  reason:    ${previous.reason}`);
    console.log(`  pausedAt:  ${previous.pausedAt}`);
    if (previous.currentUsd != null) {
      console.log(`  currentUsd: ${previous.currentUsd}`);
    }
    if (previous.thresholdUsd != null) {
      console.log(`  thresholdUsd: ${previous.thresholdUsd}`);
    }
  }

  unlinkSync(flagPath);
  const ts = new Date().toISOString();
  console.log(
    `[clear-autonomy-paused] cleared at ${ts} reason="${reason}" previous=${previous?.reason ?? "(unreadable)"}`,
  );
}

main();
