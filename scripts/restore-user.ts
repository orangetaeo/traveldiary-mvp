#!/usr/bin/env tsx
/**
 * 운영자용 계정 복구 CLI — 사이클 10 (ADR-049 §위험 박제 약속).
 *
 * 사용:
 *   npx tsx scripts/restore-user.ts <userId> \
 *     --email=<email|null> \
 *     --kakao-id=<id|null> \
 *     --name=<name|null> \
 *     [--trips=<id1,id2,...>] \
 *     [--operator=<name>] \
 *     [--dry-run]
 *
 * 동작:
 *   - User row의 deletedAt = null + email/kakaoId/name 복원.
 *   - --trips로 전달한 trip ID 중 ownerId === SYSTEM_OWNER_ID인 것만 user로 reassign.
 *   - audit log "auth.account_restore" 트랜잭션 내부 atomic 기록.
 *
 * 안전 가드:
 *   - 이미 복구된 user(deletedAt=null) → "user_not_anonymized" 거부
 *   - 다른 user 소유 trip → 자동 skip (skippedTripIds로 보고)
 *   - --dry-run: 어떤 변경도 하지 않고 input/대상 trip만 출력
 *
 * 실행 환경:
 *   - DATABASE_URL 환경변수 필요. server-only 모듈 import.
 *   - 운영자가 직접 실행 (서버 endpoint 노출 X).
 */

/* eslint-disable no-console */

interface ParsedArgs {
  userId?: string;
  email?: string | null;
  kakaoId?: string | null;
  name?: string | null;
  tripIds?: string[];
  operator?: string;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { dryRun: false, help: false };
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg.startsWith("--email=")) {
      const v = arg.slice("--email=".length);
      out.email = v === "null" || v === "" ? null : v;
    } else if (arg.startsWith("--kakao-id=")) {
      const v = arg.slice("--kakao-id=".length);
      out.kakaoId = v === "null" || v === "" ? null : v;
    } else if (arg.startsWith("--name=")) {
      const v = arg.slice("--name=".length);
      out.name = v === "null" || v === "" ? null : v;
    } else if (arg.startsWith("--trips=")) {
      const v = arg.slice("--trips=".length);
      out.tripIds = v
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else if (arg.startsWith("--operator=")) {
      out.operator = arg.slice("--operator=".length);
    } else if (!arg.startsWith("--") && !out.userId) {
      out.userId = arg;
    }
  }
  return out;
}

function printUsage() {
  console.log(`
운영자용 계정 복구 CLI (ADR-049 §위험)

사용:
  npx tsx scripts/restore-user.ts <userId> --email=<email|null> --kakao-id=<id|null> --name=<name|null> [--trips=id1,id2,...] [--operator=<name>] [--dry-run]

예시 (PII만 복구):
  npx tsx scripts/restore-user.ts user-abc \\
    --email=user@example.com --kakao-id=12345 --name=홍길동 --operator=ops-A

예시 (PII + Trip 50개 복구):
  npx tsx scripts/restore-user.ts user-abc \\
    --email=user@example.com --kakao-id=12345 --name=홍길동 \\
    --trips=trip-1,trip-2,trip-3 --operator=ops-A

예시 (dry-run — 변경 없음, 검사만):
  npx tsx scripts/restore-user.ts user-abc --dry-run
`);
}

export async function runRestoreCli(argv: string[]): Promise<number> {
  const args = parseArgs(argv);

  if (args.help || !args.userId) {
    printUsage();
    return args.help ? 0 : 1;
  }

  // dry-run: 변경 없이 input + 대상 trip만 출력
  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          userId: args.userId,
          email: args.email,
          kakaoId: args.kakaoId,
          name: args.name,
          tripIds: args.tripIds ?? [],
          operator: args.operator ?? null,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  // 실제 실행 — 동적 import로 server-only 모듈을 CLI 진입점에서 분리
  const { restoreUserAccount } = await import("../lib/auth/account-restore");

  const result = await restoreUserAccount({
    userId: args.userId,
    email: args.email ?? null,
    kakaoId: args.kakaoId ?? null,
    name: args.name ?? null,
    reassignTripIds: args.tripIds,
    operator: args.operator,
  });

  console.log(JSON.stringify(result, null, 2));
  return result.ok ? 0 : 1;
}

// CLI 진입점 — vitest import 시에는 실행되지 않음.
// Windows path 정규화를 위해 node:url의 pathToFileURL 사용 (file:///C:/... 형식).
import { pathToFileURL } from "node:url";

const isDirectRun =
  typeof process !== "undefined" &&
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runRestoreCli(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err);
      process.exit(2);
    });
}
