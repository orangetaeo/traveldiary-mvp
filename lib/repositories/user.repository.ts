/**
 * User Repository — 사이클 11b (ADR-026).
 */

import "server-only";

import { prisma } from "../prisma";

export interface UpsertKakaoUserInput {
  kakaoId: string;
  nickname?: string;
  /** 사이클 11c — 이메일 권한 동의 시 채움 */
  email?: string;
}

export interface UserRow {
  id: string;
  kakaoId: string | null;
  name: string | null;
  email: string | null;
}

export interface UpsertResult {
  user: UserRow;
  isNew: boolean;
}

/**
 * 카카오 ID 기반 user upsert. 신규 사용자면 생성, 기존이면 nickname/email 업데이트.
 * isNew: 이번 호출에서 신규 생성됐는지 여부 (환영 페이지 분기용).
 */
export interface UpdateUserInput {
  userId: string;
  name: string;
}

/**
 * 프로필 편집 — 닉네임 업데이트.
 * 반환: 업데이트된 UserRow | null (실패 시).
 */
export async function updateUser(
  input: UpdateUserInput,
): Promise<UserRow | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.user.update({
      where: { id: input.userId },
      data: { name: input.name },
    });
    return {
      id: row.id,
      kakaoId: row.kakaoId,
      name: row.name,
      email: row.email,
    };
  } catch (err) {
    console.error("[user.repository] updateUser failed", err);
    return null;
  }
}

export async function upsertKakaoUser(
  input: UpsertKakaoUserInput,
): Promise<UpsertResult | null> {
  if (!prisma) return null;
  try {
    // 기존 사용자 존재 여부 확인 (isNew 판별)
    const existing = await prisma.user.findUnique({
      where: { kakaoId: input.kakaoId },
      select: { id: true },
    });

    const row = await prisma.user.upsert({
      where: { kakaoId: input.kakaoId },
      create: {
        kakaoId: input.kakaoId,
        name: input.nickname,
        email: input.email,
      },
      update: {
        name: input.nickname,
        // email은 동의했을 때만 갱신 (재로그인 시 권한 거부됐다면 기존 값 유지)
        ...(input.email && { email: input.email }),
      },
    });
    return {
      user: {
        id: row.id,
        kakaoId: row.kakaoId,
        name: row.name,
        email: row.email,
      },
      isNew: !existing,
    };
  } catch (err) {
    console.error("[user.repository] upsertKakaoUser failed", err);
    return null;
  }
}
