/**
 * actions/affiliate.ts 단위 테스트.
 *
 * trackAffiliateClick — buildAffiliateUrl 호출 + audit log 기록 + 결과 반환.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockWriteAuditLog = vi.fn();
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
}));

const mockBuildAffiliateUrl = vi.fn();
vi.mock("@/lib/utils/affiliate", () => ({
  buildAffiliateUrl: (...args: unknown[]) => mockBuildAffiliateUrl(...args),
}));

import { trackAffiliateClick } from "@/actions/affiliate";

describe("trackAffiliateClick", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActorId.mockResolvedValue("user-1");
    mockWriteAuditLog.mockResolvedValue(undefined);
  });

  const BASE_INPUT = {
    offerId: "offer-1",
    itemId: "item-1",
    ota: "klook" as const,
    priceKrw: 39000,
    baseUrl: "https://klook.com/101",
  };

  it("tracked=true → 어필리에이트 URL 반환", async () => {
    mockBuildAffiliateUrl.mockReturnValue({
      url: "https://klook.com/101?aid=abc",
      tracked: true,
    });

    const result = await trackAffiliateClick(BASE_INPUT);

    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://klook.com/101?aid=abc",
      tracked: true,
    });
  });

  it("tracked=false → 원본 URL fallback", async () => {
    mockBuildAffiliateUrl.mockReturnValue({
      url: "https://klook.com/101",
      tracked: false,
    });

    const result = await trackAffiliateClick(BASE_INPUT);

    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://klook.com/101",
      tracked: false,
    });
  });

  it("buildAffiliateUrl에 ota + baseUrl 전달", async () => {
    mockBuildAffiliateUrl.mockReturnValue({ url: "u", tracked: false });

    await trackAffiliateClick(BASE_INPUT);

    expect(mockBuildAffiliateUrl).toHaveBeenCalledWith("klook", "https://klook.com/101");
  });

  it("audit log 기록 — affiliate.click", async () => {
    mockBuildAffiliateUrl.mockReturnValue({
      url: "https://klook.com/101?aid=abc",
      tracked: true,
    });

    await trackAffiliateClick(BASE_INPUT);

    expect(mockWriteAuditLog).toHaveBeenCalledOnce();
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.actorId).toBe("user-1");
    expect(log.action).toBe("affiliate.click");
    expect(log.resource).toBe("OtaOffer");
    expect(log.resourceId).toBe("offer-1");
    expect(log.after).toMatchObject({ redirectUrl: "https://klook.com/101?aid=abc", tracked: true });
    expect(log.metadata).toMatchObject({
      source: "web",
      ota: "klook",
      itemId: "item-1",
      priceKrw: 39000,
    });
  });

  it("미인증 → actorId=null 기록", async () => {
    mockGetActorId.mockResolvedValue(null);
    mockBuildAffiliateUrl.mockReturnValue({ url: "u", tracked: false });

    await trackAffiliateClick(BASE_INPUT);

    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.actorId).toBeNull();
  });

  it("kkday OTA 전달", async () => {
    mockBuildAffiliateUrl.mockReturnValue({ url: "u", tracked: false });

    await trackAffiliateClick({ ...BASE_INPUT, ota: "kkday" });

    expect(mockBuildAffiliateUrl).toHaveBeenCalledWith("kkday", BASE_INPUT.baseUrl);
    const log = mockWriteAuditLog.mock.calls[0][0];
    expect(log.metadata.ota).toBe("kkday");
  });
});
