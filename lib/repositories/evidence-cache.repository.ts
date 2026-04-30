/**
 * EvidenceCache Repository — 사이클 5b-3 (ADR-018).
 *
 * 정책:
 *   - prisma 미연결 시 모든 함수가 null 반환 → 호출처는 "demo" 분기.
 *   - upsert로 동시성 안전 (@@unique([placeId, platform])).
 *   - expiresAt 비교는 호출 시점 lazy. 만료 row 정리 cron은 사이클 7+에서.
 */

import "server-only";

import { prisma } from "../prisma";

export interface EvidenceCacheEntry<T = unknown> {
  data: T;
  fetchedAt: Date;
  expiresAt: Date;
}

/**
 * 캐시 조회. 만료됐거나 없으면 null. JSON 컬럼은 unknown으로 반환 (호출처가 캐스팅).
 */
export async function getEvidenceCache<T = unknown>(
  placeId: string,
  platform: string,
): Promise<EvidenceCacheEntry<T> | null> {
  if (!prisma) return null;

  try {
    const row = await prisma.evidenceCache.findUnique({
      where: { placeId_platform: { placeId, platform } },
    });
    if (!row) return null;

    if (row.expiresAt.getTime() <= Date.now()) {
      // 만료 — null 반환. row 자체는 다음 setEvidenceCache에서 upsert로 갱신됨.
      return null;
    }

    return {
      data: row.data as T,
      fetchedAt: row.fetchedAt,
      expiresAt: row.expiresAt,
    };
  } catch (err) {
    console.error("[evidence-cache] get failed", err);
    return null;
  }
}

/**
 * 캐시 저장 (upsert). 같은 (placeId, platform) 행이 있으면 갱신.
 */
export async function setEvidenceCache(input: {
  placeId: string;
  platform: string;
  data: unknown;
  ttlMs: number;
}): Promise<void> {
  if (!prisma) return;

  const expiresAt = new Date(Date.now() + input.ttlMs);

  try {
    await prisma.evidenceCache.upsert({
      where: {
        placeId_platform: {
          placeId: input.placeId,
          platform: input.platform,
        },
      },
      create: {
        placeId: input.placeId,
        platform: input.platform,
        data: input.data as never,
        expiresAt,
      },
      update: {
        data: input.data as never,
        fetchedAt: new Date(),
        expiresAt,
      },
    });
  } catch (err) {
    console.error("[evidence-cache] set failed", err);
  }
}
