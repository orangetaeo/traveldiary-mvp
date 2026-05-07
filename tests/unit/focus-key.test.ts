/**
 * lib/utils/focus-key 단위 테스트 — 옵션 J.
 *
 * parseFocusKey:
 *   - 4 known keys → 그대로 반환
 *   - 알려지지 않은 값/배열 첫째 값/undefined → undefined
 * focusElementId: focus-{key} 패턴.
 */

import { describe, it, expect } from "vitest";
import {
  parseFocusKey,
  focusElementId,
  FOCUS_KEYS,
} from "@/lib/utils/focus-key";

describe("parseFocusKey", () => {
  it("4 known keys 모두 그대로 반환", () => {
    expect(parseFocusKey("itinerary")).toBe("itinerary");
    expect(parseFocusKey("cost")).toBe("cost");
    expect(parseFocusKey("checklist")).toBe("checklist");
    expect(parseFocusKey("vote")).toBe("vote");
  });

  it("알려지지 않은 값 → undefined", () => {
    expect(parseFocusKey("hero")).toBeUndefined();
    expect(parseFocusKey("payment")).toBeUndefined();
    expect(parseFocusKey("")).toBeUndefined();
  });

  it("undefined 입력 → undefined (search param 없음)", () => {
    expect(parseFocusKey(undefined)).toBeUndefined();
  });

  it("배열 입력 → 첫째 원소 적용", () => {
    expect(parseFocusKey(["cost", "vote"])).toBe("cost");
    expect(parseFocusKey(["unknown"])).toBeUndefined();
  });
});

describe("focusElementId", () => {
  it("focus-{key} 패턴", () => {
    expect(focusElementId("itinerary")).toBe("focus-itinerary");
    expect(focusElementId("cost")).toBe("focus-cost");
    expect(focusElementId("checklist")).toBe("focus-checklist");
    expect(focusElementId("vote")).toBe("focus-vote");
  });

  it("FOCUS_KEYS 4개 모두 노출", () => {
    expect(FOCUS_KEYS).toEqual(["itinerary", "cost", "checklist", "vote"]);
  });
});
