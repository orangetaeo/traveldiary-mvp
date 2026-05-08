/**
 * PlaceDiscoveryView — "일정에 추가" 실제 연결 테스트.
 *
 * 데모 토스트 → 실제 addItineraryItem 서버 액션 호출로 전환 검증.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const VIEW_SRC = readFileSync(
  resolve(__dirname, "../../components/itinerary/PlaceDiscoveryView.tsx"),
  "utf-8",
);

const TYPES_SRC = readFileSync(
  resolve(__dirname, "../../lib/types.ts"),
  "utf-8",
);

const REPO_SRC = readFileSync(
  resolve(__dirname, "../../lib/repositories/place.repository.ts"),
  "utf-8",
);

/* ════════════════════════════════════════════
 * addItineraryItem 서버 액션 연결
 * ════════════════════════════════════════════ */

describe("PlaceDiscoveryView — addItineraryItem 연결", () => {
  it("addItineraryItem import", () => {
    expect(VIEW_SRC).toContain('import { addItineraryItem }');
  });

  it("useTransition 사용 (비동기 상태 관리)", () => {
    expect(VIEW_SRC).toContain("useTransition");
    expect(VIEW_SRC).toContain("startTransition");
  });

  it("데모 토스트 제거됨 (데모 문구 미포함)", () => {
    expect(VIEW_SRC).not.toContain("(데모)");
  });

  it("addItineraryItem 호출 (startTransition 내부)", () => {
    expect(VIEW_SRC).toContain("await addItineraryItem({");
  });

  it("tripId, dayIndex, scheduledAt, name, category 전달", () => {
    expect(VIEW_SRC).toContain("tripId,");
    expect(VIEW_SRC).toContain("dayIndex,");
    expect(VIEW_SRC).toContain("scheduledAt,");
    expect(VIEW_SRC).toContain("name: place.name");
    expect(VIEW_SRC).toContain("category: itemCategory");
  });

  it("location (lat/lng/address) 전달", () => {
    expect(VIEW_SRC).toContain("lat: place.lat");
    expect(VIEW_SRC).toContain("lng: place.lng");
    expect(VIEW_SRC).toContain("address: place.address");
  });
});

/* ════════════════════════════════════════════
 * 카테고리 변환 매핑
 * ════════════════════════════════════════════ */

describe("PlaceCategory → ItemCategory 변환", () => {
  it("PLACE_TO_ITEM_CATEGORY 매핑 존재", () => {
    expect(VIEW_SRC).toContain("PLACE_TO_ITEM_CATEGORY");
  });

  it("food → food", () => {
    expect(VIEW_SRC).toMatch(/food:\s*"food"/);
  });

  it("cafe → food", () => {
    expect(VIEW_SRC).toMatch(/cafe:\s*"food"/);
  });

  it("spot → spot", () => {
    expect(VIEW_SRC).toMatch(/spot:\s*"spot"/);
  });

  it("nature → spot", () => {
    expect(VIEW_SRC).toMatch(/nature:\s*"spot"/);
  });

  it("activity → spot", () => {
    expect(VIEW_SRC).toMatch(/activity:\s*"spot"/);
  });

  it("nightlife → spot", () => {
    expect(VIEW_SRC).toMatch(/nightlife:\s*"spot"/);
  });

  it("shopping → shopping", () => {
    expect(VIEW_SRC).toMatch(/shopping:\s*"shopping"/);
  });
});

/* ════════════════════════════════════════════
 * 로딩 상태 + 결과 피드백
 * ════════════════════════════════════════════ */

describe("PlaceDiscoveryView — UX 피드백", () => {
  it("추가 중 로딩 상태 (addingPlaceId)", () => {
    expect(VIEW_SRC).toContain("addingPlaceId");
  });

  it("isAdding prop으로 카드에 전달", () => {
    expect(VIEW_SRC).toContain("isAdding={addingPlaceId === place.id}");
  });

  it("버튼 disabled 처리", () => {
    expect(VIEW_SRC).toContain("disabled={isAdding}");
  });

  it('추가 중 텍스트 "추가 중…"', () => {
    expect(VIEW_SRC).toContain("추가 중…");
  });

  it("성공 토스트 (데모 아님)", () => {
    expect(VIEW_SRC).toContain("일정에 추가됨");
    expect(VIEW_SRC).toContain('variant: "success"');
  });

  it("실패 토스트", () => {
    expect(VIEW_SRC).toContain("추가 실패");
    expect(VIEW_SRC).toContain('variant: "danger"');
  });
});

/* ════════════════════════════════════════════
 * DiscoverPlace 타입 — lat/lng/address 필드
 * ════════════════════════════════════════════ */

describe("DiscoverPlace 타입 — 좌표 필드", () => {
  it("lat 필드 (optional)", () => {
    expect(TYPES_SRC).toMatch(/lat\?:\s*number/);
  });

  it("lng 필드 (optional)", () => {
    expect(TYPES_SRC).toMatch(/lng\?:\s*number/);
  });

  it("address 필드 (optional)", () => {
    expect(TYPES_SRC).toMatch(/address\?:\s*string/);
  });
});

/* ════════════════════════════════════════════
 * Place Repository — lat/lng/address 매핑
 * ════════════════════════════════════════════ */

describe("place.repository — 좌표 매핑", () => {
  it("lat 매핑", () => {
    expect(REPO_SRC).toContain("lat: p.lat");
  });

  it("lng 매핑", () => {
    expect(REPO_SRC).toContain("lng: p.lng");
  });

  it("address 매핑", () => {
    expect(REPO_SRC).toContain("address: p.address");
  });
});
