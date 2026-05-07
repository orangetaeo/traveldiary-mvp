/**
 * actions/trip.ts 단위 테스트.
 *
 * createTripFromOnboarding, setTripMode, recordModeTransitionSkip.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockWriteAuditLog = vi.fn();
vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));

const mockGetActorId = vi.fn();
const mockGetOwnerId = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getActorId: () => mockGetActorId(),
  getOwnerId: () => mockGetOwnerId(),
}));

const mockCanWriteTrip = vi.fn();
vi.mock("@/lib/auth/authorize", () => ({
  canWriteTrip: (...args: unknown[]) => mockCanWriteTrip(...args),
}));

const mockCreateTripWithSeedItinerary = vi.fn();
const mockCreateTripWithAiItems = vi.fn();
const mockUpdateTripMode = vi.fn();
vi.mock("@/lib/repositories/trip.repository", () => ({
  createTripWithSeedItinerary: (...args: unknown[]) => mockCreateTripWithSeedItinerary(...args),
  createTripWithAiItems: (...args: unknown[]) => mockCreateTripWithAiItems(...args),
  updateTripMode: (...args: unknown[]) => mockUpdateTripMode(...args),
}));

const mockAiGenerationAvailable = vi.fn();
const mockGenerateItinerary = vi.fn();
vi.mock("@/lib/services/itinerary-generator", () => ({
  aiGenerationAvailable: () => mockAiGenerationAvailable(),
  generateItinerary: (...args: unknown[]) => mockGenerateItinerary(...args),
}));

const mockBuildModeTransitionMetadata = vi.fn();
vi.mock("@/lib/mode-transition", () => ({
  buildModeTransitionMetadata: (...args: unknown[]) => mockBuildModeTransitionMetadata(...args),
}));

let mockIsDbConnected = true;
vi.mock("@/lib/prisma", () => ({
  get isDbConnected() { return mockIsDbConnected; },
}));

vi.mock("@/lib/seed", () => ({
  DEMO_TRIP_ID: "demo-trip-danang",
}));

import {
  createTripFromOnboarding,
  setTripMode,
  recordModeTransitionSkip,
} from "@/actions/trip";

describe("trip actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDbConnected = true;
    mockGetActorId.mockResolvedValue("user-1");
    mockGetOwnerId.mockResolvedValue("owner-1");
    mockCanWriteTrip.mockResolvedValue(true);
    mockWriteAuditLog.mockResolvedValue(undefined);
    mockAiGenerationAvailable.mockReturnValue(false);
    mockBuildModeTransitionMetadata.mockReturnValue({ trigger: "manual" });
  });

  const TRIP_INPUT = {
    destination: "다낭",
    destinationCode: "DAD",
    startDate: "2026-07-01",
    nights: 3,
  };

  // ─── createTripFromOnboarding ────────────────────────────────

  describe("createTripFromOnboarding", () => {
    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      const r = await createTripFromOnboarding(TRIP_INPUT);
      expect(r).toEqual({ id: "demo-trip-danang", demo: true });
    });

    it("시드 fallback 성공 → ok + audit (generatedBy=seed)", async () => {
      const bundle = {
        trip: { id: "t-new", destination: "다낭", nights: 3 },
        items: [{ id: "i1" }, { id: "i2" }],
      };
      mockCreateTripWithSeedItinerary.mockResolvedValue(bundle);

      const r = await createTripFromOnboarding(TRIP_INPUT);
      expect(r).toEqual({ id: "t-new", demo: false });
      expect(mockWriteAuditLog).toHaveBeenCalledOnce();
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("trip.create");
      expect(log.metadata.generatedBy).toBe("seed");
      expect(log.metadata.itemCount).toBe(2);
    });

    it("시드 fallback 실패 → demo trip ID", async () => {
      mockCreateTripWithSeedItinerary.mockResolvedValue(null);
      const r = await createTripFromOnboarding(TRIP_INPUT);
      expect(r).toEqual({ id: "demo-trip-danang", demo: true });
    });

    it("AI 가용 + 성공 → AI trip 생성 + audit (generatedBy=ai)", async () => {
      mockAiGenerationAvailable.mockReturnValue(true);
      mockGenerateItinerary.mockResolvedValue({
        mode: "ok",
        items: [{ name: "A" }],
        model: "claude-opus",
      });
      const bundle = {
        trip: { id: "t-ai", destination: "다낭", nights: 3 },
        items: [{ id: "i1" }],
      };
      mockCreateTripWithAiItems.mockResolvedValue(bundle);

      const r = await createTripFromOnboarding(TRIP_INPUT);
      expect(r).toEqual({ id: "t-ai", demo: false });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.metadata.generatedBy).toBe("ai");
      expect(log.metadata.model).toBe("claude-opus");
    });

    it("AI 실패 → 시드 fallback", async () => {
      mockAiGenerationAvailable.mockReturnValue(true);
      mockGenerateItinerary.mockResolvedValue({ mode: "error" });
      const bundle = {
        trip: { id: "t-seed", destination: "다낭", nights: 3 },
        items: [],
      };
      mockCreateTripWithSeedItinerary.mockResolvedValue(bundle);

      const r = await createTripFromOnboarding(TRIP_INPUT);
      expect(r).toEqual({ id: "t-seed", demo: false });
    });
  });

  // ─── setTripMode ─────────────────────────────────────────────

  describe("setTripMode", () => {
    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      const r = await setTripMode({ tripId: "t1", mode: "in-travel" });
      expect(r).toEqual({ ok: true, demo: true });
    });

    it("데모 trip → demo", async () => {
      const r = await setTripMode({ tripId: "demo-trip-danang", mode: "in-travel" });
      expect(r).toEqual({ ok: true, demo: true });
    });

    it("권한 없음 → forbidden", async () => {
      mockCanWriteTrip.mockResolvedValue(false);
      const r = await setTripMode({ tripId: "t1", mode: "in-travel" });
      expect(r).toEqual({ ok: false, code: "forbidden" });
    });

    it("DB null → internal", async () => {
      mockUpdateTripMode.mockResolvedValue(null);
      const r = await setTripMode({ tripId: "t1", mode: "in-travel" });
      expect(r).toEqual({ ok: false, code: "internal" });
    });

    it("conflict → conflict", async () => {
      mockUpdateTripMode.mockResolvedValue("conflict");
      const r = await setTripMode({ tripId: "t1", mode: "in-travel" });
      expect(r).toEqual({ ok: false, code: "conflict" });
    });

    it("성공 → ok + tripUpdatedAt + audit", async () => {
      mockUpdateTripMode.mockResolvedValue({
        before: { currentMode: "pre-travel" },
        after: { currentMode: "in-travel", tripUpdatedAt: "2026-07-01T00:00:00Z" },
      });

      const r = await setTripMode({ tripId: "t1", mode: "in-travel" });
      expect(r).toMatchObject({ ok: true, demo: false, tripUpdatedAt: "2026-07-01T00:00:00Z" });
      const log = mockWriteAuditLog.mock.calls[0][0];
      expect(log.action).toBe("trip.mode_transition");
      expect(log.before).toEqual({ mode: "pre-travel" });
      expect(log.after).toEqual({ mode: "in-travel" });
    });
  });

  // ─── recordModeTransitionSkip ────────────────────────────────

  describe("recordModeTransitionSkip", () => {
    it("DB 미연결 → demo", async () => {
      mockIsDbConnected = false;
      const r = await recordModeTransitionSkip({
        tripId: "t1",
        skipReason: "denied",
        currentMode: "pre-travel",
      });
      expect(r).toEqual({ ok: true, demo: true });
    });

    it("데모 trip → demo", async () => {
      const r = await recordModeTransitionSkip({
        tripId: "demo-trip-danang",
        skipReason: "denied",
        currentMode: "pre-travel",
      });
      expect(r).toEqual({ ok: true, demo: true });
    });

    it("권한 없음 → forbidden", async () => {
      mockCanWriteTrip.mockResolvedValue(false);
      const r = await recordModeTransitionSkip({
        tripId: "t1",
        skipReason: "denied",
        currentMode: "pre-travel",
      });
      expect(r).toEqual({ ok: false, code: "forbidden" });
    });

    it("성공 → ok + audit (mode 미변경, log만)", async () => {
      const r = await recordModeTransitionSkip({
        tripId: "t1",
        skipReason: "already_in_mode",
        currentMode: "in-travel",
        trigger: "geolocation",
      });
      expect(r).toEqual({ ok: true, demo: false });
      expect(mockWriteAuditLog).toHaveBeenCalledOnce();
      expect(mockWriteAuditLog.mock.calls[0][0].action).toBe("trip.mode_transition");
      expect(mockBuildModeTransitionMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: "geolocation",
          previousMode: "in-travel",
        }),
      );
    });
  });
});
