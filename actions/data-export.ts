"use server";

/**
 * 내 데이터 내보내기 Server Action — GDPR 사용자 권리.
 *
 * 현재 사용자(ownerId)의 trip + 일정 + 비용 + 체크리스트 + 투표를
 * JSON 직렬화하여 반환. 클라이언트에서 Blob → download 트리거.
 */

import { prisma, isDbConnected } from "@/lib/prisma";
import { getOwnerId } from "@/lib/auth/session";
import { getActorId } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit-log";

export type DataExportResult = {
  ok: true;
  json: string;
  counts: { trips: number; items: number; costs: number; checklists: number; votes: number };
} | {
  ok: false;
  code: "no_db" | "no_data" | "internal";
}

export async function exportUserData(): Promise<DataExportResult> {
  if (!isDbConnected || !prisma) {
    return { ok: false, code: "no_db" };
  }

  try {
    const ownerId = await getOwnerId();
    const actorId = await getActorId();

    // 사용자 소유 trip 전체 조회
    const trips = await prisma.trip.findMany({
      where: { ownerId, deletedAt: null },
      include: {
        items: { orderBy: { scheduledAt: "asc" } },
      },
      orderBy: { startDate: "asc" },
    });

    if (trips.length === 0) {
      return { ok: false, code: "no_data" };
    }

    const tripIds = trips.map((t) => t.id);

    // 비용, 체크리스트, 투표 병렬 조회
    const [costs, checklists, votes] = await Promise.all([
      prisma.costEntry.findMany({
        where: { tripId: { in: tripIds } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.checklistItem.findMany({
        where: { tripId: { in: tripIds } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.vote.findMany({
        where: { tripId: { in: tripIds } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalItems = trips.reduce((s, t) => s + t.items.length, 0);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      ownerId,
      trips: trips.map((t) => ({
        id: t.id,
        destination: t.destination,
        destinationCode: t.destinationCode,
        startDate: t.startDate,
        nights: t.nights,
        companion: t.companion,
        status: t.status,
        preferences: t.preferences,
        createdAt: t.createdAt,
        items: t.items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          scheduledAt: item.scheduledAt,
          durationMinutes: item.durationMinutes,
          flexibility: item.flexibility,
          priority: item.priority,
          location: { lat: item.locationLat, lng: item.locationLng, address: item.locationAddress },
          evidence: item.evidence,
          createdAt: item.createdAt,
        })),
      })),
      costs: costs.map((c) => ({
        id: c.id,
        tripId: c.tripId,
        date: c.date,
        label: c.label,
        amountKrw: c.amountKrw,
        amountLocal: c.amountLocal,
        category: c.category,
        status: c.status,
        settledAt: c.settledAt,
        createdAt: c.createdAt,
      })),
      checklists: checklists.map((cl) => ({
        id: cl.id,
        tripId: cl.tripId,
        text: cl.text,
        dDayBucket: cl.dDayBucket,
        done: cl.done,
        sortOrder: cl.sortOrder,
        createdAt: cl.createdAt,
      })),
      votes: votes.map((v) => ({
        id: v.id,
        tripId: v.tripId,
        question: v.question,
        options: v.options,
        createdAt: v.createdAt,
      })),
    };

    const json = JSON.stringify(exportData, null, 2);

    // 감사 로그 기록 (ADR-046)
    await writeAuditLog({
      resource: "data_export",
      resourceId: ownerId,
      action: "dataexport.export",
      actorId: actorId ?? "anonymous",
      metadata: {
        trips: trips.length,
        items: totalItems,
        costs: costs.length,
        checklists: checklists.length,
        votes: votes.length,
      },
    });

    return {
      ok: true,
      json,
      counts: {
        trips: trips.length,
        items: totalItems,
        costs: costs.length,
        checklists: checklists.length,
        votes: votes.length,
      },
    };
  } catch (err) {
    console.error("[data-export] failed", err);
    return { ok: false, code: "internal" };
  }
}
