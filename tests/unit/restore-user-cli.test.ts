/**
 * 사이클 10 — scripts/restore-user.ts CLI 인자 파서 단위 테스트.
 *
 * 운영자 입력 검증 — 잘못된 인자 형식 회귀 차단.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockRestore = vi.fn();
vi.mock("@/lib/auth/account-restore", () => ({
  restoreUserAccount: (...args: unknown[]) => mockRestore(...args),
}));

describe("restore-user CLI", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("인자 없음 → exit 1 + 사용법 출력", async () => {
    const { runRestoreCli } = await import("@/scripts/restore-user");
    const code = await runRestoreCli([]);
    expect(code).toBe(1);
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("--help → exit 0 + 사용법 출력", async () => {
    const { runRestoreCli } = await import("@/scripts/restore-user");
    const code = await runRestoreCli(["--help"]);
    expect(code).toBe(0);
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("--dry-run → 변경 없이 input echo", async () => {
    const { runRestoreCli } = await import("@/scripts/restore-user");
    const code = await runRestoreCli([
      "user-abc",
      "--email=x@y.com",
      "--name=홍길동",
      "--dry-run",
    ]);
    expect(code).toBe(0);
    expect(mockRestore).not.toHaveBeenCalled();
    const logged = logSpy.mock.calls.flat().join("\n");
    expect(logged).toContain("dry-run");
    expect(logged).toContain("user-abc");
    expect(logged).toContain("x@y.com");
  });

  it("정상 인자 → restoreUserAccount 호출", async () => {
    mockRestore.mockResolvedValue({ ok: true, restoredTripCount: 0 });
    const { runRestoreCli } = await import("@/scripts/restore-user");
    const code = await runRestoreCli([
      "user-abc",
      "--email=x@y.com",
      "--kakao-id=12345",
      "--name=홍길동",
      "--operator=ops-A",
    ]);
    expect(code).toBe(0);
    expect(mockRestore).toHaveBeenCalledWith({
      userId: "user-abc",
      email: "x@y.com",
      kakaoId: "12345",
      name: "홍길동",
      reassignTripIds: undefined,
      operator: "ops-A",
    });
  });

  it("--email=null → 명시 NULL 전달", async () => {
    mockRestore.mockResolvedValue({ ok: true });
    const { runRestoreCli } = await import("@/scripts/restore-user");
    await runRestoreCli([
      "user-1",
      "--email=null",
      "--kakao-id=null",
      "--name=null",
    ]);
    expect(mockRestore).toHaveBeenCalledWith(
      expect.objectContaining({
        email: null,
        kakaoId: null,
        name: null,
      }),
    );
  });

  it("--trips=t1,t2,t3 → 배열 파싱", async () => {
    mockRestore.mockResolvedValue({ ok: true });
    const { runRestoreCli } = await import("@/scripts/restore-user");
    await runRestoreCli([
      "user-1",
      "--trips=t1,t2,t3",
      "--email=null",
      "--kakao-id=null",
      "--name=null",
    ]);
    expect(mockRestore).toHaveBeenCalledWith(
      expect.objectContaining({
        reassignTripIds: ["t1", "t2", "t3"],
      }),
    );
  });

  it("restoreUserAccount 실패 → exit 1", async () => {
    mockRestore.mockResolvedValue({ ok: false, reason: "user_not_found" });
    const { runRestoreCli } = await import("@/scripts/restore-user");
    const code = await runRestoreCli([
      "missing",
      "--email=null",
      "--kakao-id=null",
      "--name=null",
    ]);
    expect(code).toBe(1);
  });

  it("--trips 빈 값 → 빈 배열", async () => {
    mockRestore.mockResolvedValue({ ok: true });
    const { runRestoreCli } = await import("@/scripts/restore-user");
    await runRestoreCli([
      "user-1",
      "--trips=",
      "--email=null",
      "--kakao-id=null",
      "--name=null",
    ]);
    expect(mockRestore).toHaveBeenCalledWith(
      expect.objectContaining({
        reassignTripIds: [],
      }),
    );
  });
});
