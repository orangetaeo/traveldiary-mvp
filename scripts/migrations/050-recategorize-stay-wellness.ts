/**
 * ADR-050 — Place 데이터 재분류 마이그레이션 (stay/wellness 신설).
 *
 * 배경:
 *   ItemCategory 4 → 6 확장 (food/spot/shopping/stay/wellness/rest).
 *   기존 시드 4,324 places 중 subCategory 정확하나 main category 잘못된 ~294건 보정 +
 *   subCategory 기반 stay/wellness 분류 ~841건 재할당.
 *
 * 흐름 (3단계):
 *   1. Dry-run (기본): 미스매치 검출 → 콘솔/CSV. DB 변경 없음.
 *   2. Apply (--apply): 트랜잭션 update + AuditLog 적재.
 *   3. Verify (--verify): apply 후 cross-check (미스매치 0 확인).
 *
 * 사용:
 *   npx tsx scripts/migrations/050-recategorize-stay-wellness.ts            # dry-run
 *   npx tsx scripts/migrations/050-recategorize-stay-wellness.ts --apply    # apply (R1 별도 사인오프 후)
 *   npx tsx scripts/migrations/050-recategorize-stay-wellness.ts --verify   # apply 후 검증
 *
 * 롤백:
 *   AuditLog `action="adr-050-recategorize"` 필터로 before 값 복원 가능.
 */

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

const SUB_TO_CATEGORY: Record<string, string> = {
  // 숙소 계열 → stay
  "숙소": "stay",
  "리조트": "stay",
  "호텔": "stay",
  "게스트하우스": "stay",
  // 마사지·뷰티 → wellness
  "스파/마사지": "wellness",
  "마사지": "wellness",
  "뷰티": "wellness",
};

interface PlaceMin {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
}

interface MismatchRow {
  id: string;
  name: string;
  before: string;
  after: string;
  subCategory: string;
}

async function findMismatches(): Promise<MismatchRow[]> {
  if (!prisma) {
    console.error("[ADR-050] prisma 미가용 (demo 모드).");
    return [];
  }

  const places = (await prisma.place.findMany({
    select: { id: true, name: true, category: true, subCategory: true },
  })) as PlaceMin[];

  const rows: MismatchRow[] = [];
  for (const p of places) {
    if (!p.subCategory) continue;
    const target = SUB_TO_CATEGORY[p.subCategory];
    if (target && p.category !== target) {
      rows.push({
        id: p.id,
        name: p.name,
        before: p.category,
        after: target,
        subCategory: p.subCategory,
      });
    }
  }
  return rows;
}

function printSummary(rows: MismatchRow[]): void {
  const byTarget = new Map<string, number>();
  for (const r of rows) {
    byTarget.set(r.after, (byTarget.get(r.after) ?? 0) + 1);
  }
  console.log(`\n[ADR-050] 미스매치 합계: ${rows.length}건`);
  for (const [target, count] of byTarget.entries()) {
    console.log(`  → ${target}: ${count}건`);
  }
}

function printCsv(rows: MismatchRow[], limit = 50): void {
  console.log("\nid,name,before,after,subCategory");
  for (const r of rows.slice(0, limit)) {
    console.log(`${r.id},"${r.name}",${r.before},${r.after},${r.subCategory}`);
  }
  if (rows.length > limit) {
    console.log(`... (${rows.length - limit}건 생략)`);
  }
}

async function applyMigration(rows: MismatchRow[]): Promise<void> {
  if (!prisma) {
    console.error("[ADR-050] prisma 미가용 — apply 중단.");
    return;
  }
  if (rows.length === 0) {
    console.log("[ADR-050] 변경 대상 0건 — apply 종료.");
    return;
  }

  console.log(`[ADR-050] apply 시작 — ${rows.length}건 update + AuditLog 적재.`);

  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      await tx.place.update({
        where: { id: r.id },
        data: { category: r.after },
      });
    }
  });

  // AuditLog는 transaction 밖에서 best-effort (audit 실패가 마이그레이션을 차단하지 않음).
  for (const r of rows) {
    await writeAuditLog({
      action: "adr-050-recategorize",
      resource: "Place",
      resourceId: r.id,
      before: { category: r.before, subCategory: r.subCategory },
      after: { category: r.after, subCategory: r.subCategory },
      metadata: { reason: "ADR-050 stay/wellness 신설로 인한 재분류" },
    });
  }

  console.log(`[ADR-050] apply 완료 — ${rows.length}건 갱신.`);
}

async function verifyMigration(): Promise<void> {
  const rows = await findMismatches();
  if (rows.length === 0) {
    console.log("[ADR-050] verify 통과 — 미스매치 0건.");
  } else {
    console.error(`[ADR-050] verify 실패 — 미스매치 ${rows.length}건 잔존.`);
    printCsv(rows);
    process.exitCode = 1;
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const isApply = args.has("--apply");
  const isVerify = args.has("--verify");

  if (isVerify) {
    await verifyMigration();
    return;
  }

  const rows = await findMismatches();
  printSummary(rows);
  printCsv(rows);

  if (isApply) {
    if (rows.length === 0) {
      console.log("[ADR-050] apply 대상 없음 — 종료.");
      return;
    }
    await applyMigration(rows);
  } else {
    console.log("\n[ADR-050] DRY-RUN — DB 변경 없음.");
    console.log("적용하려면 --apply 플래그 추가 (R1 별도 사인오프 후).");
  }
}

main()
  .catch((err) => {
    console.error("[ADR-050] 실행 실패", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
