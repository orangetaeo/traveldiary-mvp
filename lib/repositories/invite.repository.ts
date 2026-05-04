/**
 * 초대 코드 AuditLog 집계 — 시나리오 C Phase C2.
 *
 * AuditLog.action="invite.use" 행을 코드별 카운트.
 * 스키마 변경 없음 — AuditLog만 활용.
 */

import "server-only";

import { prisma } from "../prisma";
import {
  buildWindowCutoffFilter,
  type WindowOption,
} from "../admin/window-filter";

export interface InviteCodeStat {
  code: string;
  uses: number;
  firstUsed: string;
  lastUsed: string;
}

export interface InviteSummary {
  totalUses: number;
  uniqueCodes: number;
  byCodes: InviteCodeStat[];
}

export interface GetInviteSummaryOptions {
  windowDays?: WindowOption;
}

export async function getInviteSummary(
  options: GetInviteSummaryOptions = {},
): Promise<InviteSummary | null> {
  if (!prisma) return null;
  try {
    const rows = await prisma.auditLog.findMany({
      where: {
        action: "invite.use",
        ...buildWindowCutoffFilter(options.windowDays),
      },
      select: { resourceId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const codeMap = new Map<
      string,
      { uses: number; firstUsed: Date; lastUsed: Date }
    >();
    for (const row of rows) {
      const code = row.resourceId;
      const cur = codeMap.get(code);
      if (cur) {
        cur.uses += 1;
        if (row.createdAt < cur.firstUsed) cur.firstUsed = row.createdAt;
        if (row.createdAt > cur.lastUsed) cur.lastUsed = row.createdAt;
      } else {
        codeMap.set(code, {
          uses: 1,
          firstUsed: row.createdAt,
          lastUsed: row.createdAt,
        });
      }
    }

    const byCodes = Array.from(codeMap.entries())
      .map(([code, v]) => ({
        code,
        uses: v.uses,
        firstUsed: v.firstUsed.toISOString(),
        lastUsed: v.lastUsed.toISOString(),
      }))
      .sort((a, b) => b.uses - a.uses);

    return {
      totalUses: rows.length,
      uniqueCodes: codeMap.size,
      byCodes,
    };
  } catch (err) {
    console.error("[invite.repository] getInviteSummary failed", err);
    return null;
  }
}
