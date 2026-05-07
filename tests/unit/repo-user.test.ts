/**
 * lib/repositories/user.repository.ts 단위 테스트.
 *
 * upsertKakaoUser — 카카오 ID 기반 user upsert.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockUpsert = vi.fn();
const mockFindUnique = vi.fn();

let mockPrisma: unknown = {
  user: {
    upsert: (...args: unknown[]) => mockUpsert(...args),
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() { return mockPrisma; },
}));

import { upsertKakaoUser } from "@/lib/repositories/user.repository";

const MOCK_USER = {
  id: "user-1",
  kakaoId: "k123",
  name: "홍길동",
  email: "hong@test.com",
};

describe("user.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      user: {
        upsert: (...args: unknown[]) => mockUpsert(...args),
        findUnique: (...args: unknown[]) => mockFindUnique(...args),
      },
    };
    // 기본: 기존 사용자 있음 (isNew=false)
    mockFindUnique.mockResolvedValue({ id: "user-1" });
  });

  it("prisma null → null", async () => {
    mockPrisma = null;
    expect(await upsertKakaoUser({ kakaoId: "k1" })).toBeNull();
  });

  it("성공 → UpsertResult 반환 (기존 사용자)", async () => {
    mockFindUnique.mockResolvedValue({ id: "user-1" });
    mockUpsert.mockResolvedValue(MOCK_USER);
    const r = await upsertKakaoUser({ kakaoId: "k123", nickname: "홍길동", email: "hong@test.com" });
    expect(r!.user.id).toBe("user-1");
    expect(r!.user.kakaoId).toBe("k123");
    expect(r!.user.name).toBe("홍길동");
    expect(r!.user.email).toBe("hong@test.com");
    expect(r!.isNew).toBe(false);
  });

  it("신규 사용자 → isNew=true", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue(MOCK_USER);
    const r = await upsertKakaoUser({ kakaoId: "k123", nickname: "홍길동" });
    expect(r!.isNew).toBe(true);
  });

  it("email 없으면 update에 email 미포함", async () => {
    mockUpsert.mockResolvedValue({ ...MOCK_USER, email: null });
    await upsertKakaoUser({ kakaoId: "k123", nickname: "테스트" });

    const call = mockUpsert.mock.calls[0][0];
    expect(call.update).not.toHaveProperty("email");
  });

  it("email 있으면 update에 email 포함", async () => {
    mockUpsert.mockResolvedValue(MOCK_USER);
    await upsertKakaoUser({ kakaoId: "k123", email: "new@test.com" });

    const call = mockUpsert.mock.calls[0][0];
    expect(call.update.email).toBe("new@test.com");
  });

  it("DB 에러 → null", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB"));
    expect(await upsertKakaoUser({ kakaoId: "k1" })).toBeNull();
  });
});
