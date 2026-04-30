/**
 * User Repository — 사이클 11b (ADR-026).
 */

import "server-only";

import { prisma } from "../prisma";

export interface UpsertKakaoUserInput {
  kakaoId: string;
  nickname?: string;
}

export interface UserRow {
  id: string;
  kakaoId: string | null;
  name: string | null;
}

/**
 * 카카오 ID 기반 user upsert. 신규 사용자면 생성, 기존이면 nickname 업데이트.
 */
export async function upsertKakaoUser(
  input: UpsertKakaoUserInput,
): Promise<UserRow | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.user.upsert({
      where: { kakaoId: input.kakaoId },
      create: {
        kakaoId: input.kakaoId,
        name: input.nickname,
      },
      update: {
        name: input.nickname,
      },
    });
    return { id: row.id, kakaoId: row.kakaoId, name: row.name };
  } catch (err) {
    console.error("[user.repository] upsertKakaoUser failed", err);
    return null;
  }
}
