/**
 * lib/types.ts union type ↔ 실제 사용처 일관성 검증.
 *
 * 타입 정의의 union 값이 시드 데이터, 상수, 코드에서 올바르게 사용되는지 확인.
 * 새 값 추가 시 타입만 바꾸고 코드를 안 바꾸는 누락을 자동 감지.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const TYPES_SRC = fs.readFileSync(path.resolve("lib/types.ts"), "utf-8");

/** union type에서 값 추출: type Xxx = "a" | "b" | "c" */
function extractUnionValues(src: string, typeName: string): string[] {
  // 멀티라인 union도 처리
  const regex = new RegExp(
    `export type ${typeName}\\s*=\\s*([^;]+);`,
    "s",
  );
  const match = regex.exec(src);
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/* ════════════════════════════════════════════
 * types.ts 파일 기본 구조
 * ════════════════════════════════════════════ */

describe("types.ts — 기본 구조", () => {
  it("46개 이상 export 존재", () => {
    const exports = TYPES_SRC.match(/^export (type|interface|enum)/gm);
    expect(exports!.length).toBeGreaterThanOrEqual(46);
  });

  it("default export 없음", () => {
    expect(TYPES_SRC).not.toMatch(/^export default/m);
  });
});

/* ════════════════════════════════════════════
 * Union type 값 추출 검증
 * ════════════════════════════════════════════ */

describe("types.ts — union type 값 추출", () => {
  it("CompanionType — 4값", () => {
    const values = extractUnionValues(TYPES_SRC, "CompanionType");
    expect(values).toEqual(["solo", "friends", "family", "group"]);
  });

  it("PaceType — 3값", () => {
    const values = extractUnionValues(TYPES_SRC, "PaceType");
    expect(values).toEqual(["relaxed", "balanced", "packed"]);
  });

  it("TripStatus — 4값", () => {
    const values = extractUnionValues(TYPES_SRC, "TripStatus");
    expect(values).toEqual(["draft", "confirmed", "in-progress", "completed"]);
  });

  it("TravelMode — 3값", () => {
    const values = extractUnionValues(TYPES_SRC, "TravelMode");
    expect(values).toEqual(["pre-travel", "in-travel", "post-travel"]);
  });

  it("ItemCategory — 4값", () => {
    const values = extractUnionValues(TYPES_SRC, "ItemCategory");
    expect(values).toEqual(["food", "spot", "shopping", "rest"]);
  });

  it("ItemFlexibility — 3값", () => {
    const values = extractUnionValues(TYPES_SRC, "ItemFlexibility");
    expect(values).toEqual(["fixed", "flexible", "booked"]);
  });

  it("OtaProvider — 3값", () => {
    const values = extractUnionValues(TYPES_SRC, "OtaProvider");
    expect(values).toEqual(["klook", "kkday", "agoda"]);
  });

  it("SharePermission — 2값", () => {
    const values = extractUnionValues(TYPES_SRC, "SharePermission");
    expect(values).toEqual(["view", "edit"]);
  });

  it("CostStatus — 3값", () => {
    const values = extractUnionValues(TYPES_SRC, "CostStatus");
    expect(values).toEqual(["paid", "booked", "planned"]);
  });

  it("CostCategory — 6값", () => {
    const values = extractUnionValues(TYPES_SRC, "CostCategory");
    expect(values.sort()).toEqual(
      ["food", "transport", "accommodation", "shopping", "activity", "other"].sort(),
    );
  });

  it("ChecklistCategory — 6값", () => {
    const values = extractUnionValues(TYPES_SRC, "ChecklistCategory");
    expect(values.sort()).toEqual(
      ["documents", "clothing", "electronics", "forbidden", "declarable", "custom"].sort(),
    );
  });

  it("DDayBucket — 6값", () => {
    const values = extractUnionValues(TYPES_SRC, "DDayBucket");
    expect(values).toEqual(["D-30", "D-14", "D-7", "D-1", "during", "after"]);
  });

  it("EvidencePlatform — 6값", () => {
    const values = extractUnionValues(TYPES_SRC, "EvidencePlatform");
    expect(values.sort()).toEqual(
      ["naver", "google", "kakao", "ota", "instagram", "user_review"].sort(),
    );
  });

  it("NotificationCategory — 3값", () => {
    const values = extractUnionValues(TYPES_SRC, "NotificationCategory");
    expect(values).toEqual(["travel", "companion", "system"]);
  });

  it("PlaceCategory — 5값", () => {
    const values = extractUnionValues(TYPES_SRC, "PlaceCategory");
    expect(values.sort()).toEqual(
      ["food", "spot", "shopping", "nature", "cafe"].sort(),
    );
  });
});

/* ════════════════════════════════════════════
 * Union type ↔ 시드 데이터 정합
 * ════════════════════════════════════════════ */

import { listDemoTrips } from "@/lib/seed/index";

describe("union type ↔ 시드 데이터 정합", () => {
  const ITEM_CATEGORIES = extractUnionValues(TYPES_SRC, "ItemCategory");
  const allItems = listDemoTrips().flatMap((b) => b.items);

  it("시드 item.category가 모두 ItemCategory 값", () => {
    for (const item of allItems) {
      expect(ITEM_CATEGORIES).toContain(item.category);
    }
  });

  it("시드에서 ItemCategory 3값 이상 사용됨", () => {
    const usedCategories = new Set(allItems.map((it) => it.category));
    // "rest"는 places pool에서 사용되나 일부 itinerary에 미포함될 수 있음
    expect(usedCategories.size).toBeGreaterThanOrEqual(3);
  });

  it("시드 item.flexibility가 모두 ItemFlexibility 값", () => {
    const ITEM_FLEXIBILITIES = extractUnionValues(TYPES_SRC, "ItemFlexibility");
    for (const item of allItems) {
      expect(ITEM_FLEXIBILITIES).toContain(item.flexibility);
    }
  });

  it("시드 trip.companion이 모두 CompanionType 값", () => {
    const COMPANION_TYPES = extractUnionValues(TYPES_SRC, "CompanionType");
    for (const bundle of listDemoTrips()) {
      expect(COMPANION_TYPES).toContain(bundle.trip.companion);
    }
  });

  it("시드 trip.status가 모두 TripStatus 값", () => {
    const TRIP_STATUSES = extractUnionValues(TYPES_SRC, "TripStatus");
    for (const bundle of listDemoTrips()) {
      expect(TRIP_STATUSES).toContain(bundle.trip.status);
    }
  });
});

/* ════════════════════════════════════════════
 * Union type ↔ 상수 파일 정합
 * ════════════════════════════════════════════ */

import {
  COST_CATEGORY_LABEL,
  STATUS_LABEL,
} from "@/lib/utils/cost-constants";
import {
  CHECKLIST_CATEGORY_LABEL,
  BUCKET_ORDER,
} from "@/lib/utils/checklist-constants";
import { OTA_LABEL } from "@/lib/constants/ota-constants";

describe("union type ↔ 상수 키 정합", () => {
  it("CostCategory 값 === COST_CATEGORY_LABEL 키", () => {
    const typeValues = extractUnionValues(TYPES_SRC, "CostCategory").sort();
    const constKeys = Object.keys(COST_CATEGORY_LABEL).sort();
    expect(typeValues).toEqual(constKeys);
  });

  it("CostStatus 값 === STATUS_LABEL 키", () => {
    const typeValues = extractUnionValues(TYPES_SRC, "CostStatus").sort();
    const constKeys = Object.keys(STATUS_LABEL).sort();
    expect(typeValues).toEqual(constKeys);
  });

  it("ChecklistCategory 값 === CHECKLIST_CATEGORY_LABEL 키", () => {
    const typeValues = extractUnionValues(TYPES_SRC, "ChecklistCategory").sort();
    const constKeys = Object.keys(CHECKLIST_CATEGORY_LABEL).sort();
    expect(typeValues).toEqual(constKeys);
  });

  it("DDayBucket 값 === BUCKET_ORDER", () => {
    const typeValues = extractUnionValues(TYPES_SRC, "DDayBucket");
    expect(typeValues).toEqual(BUCKET_ORDER);
  });

  it("OtaProvider 값이 OTA_LABEL 키에 포함", () => {
    const typeValues = extractUnionValues(TYPES_SRC, "OtaProvider");
    const constKeys = Object.keys(OTA_LABEL);
    for (const val of typeValues) {
      expect(constKeys).toContain(val);
    }
  });
});

/* ════════════════════════════════════════════
 * interface 필수 필드 존재 확인
 * ════════════════════════════════════════════ */

describe("types.ts — interface 필수 필드", () => {
  it("Trip — id, destination, startDate, nights", () => {
    const tripBlock = TYPES_SRC.match(/export interface Trip \{([^}]+)\}/s);
    expect(tripBlock).not.toBeNull();
    expect(tripBlock![1]).toContain("id:");
    expect(tripBlock![1]).toContain("destination:");
    expect(tripBlock![1]).toContain("startDate:");
    expect(tripBlock![1]).toContain("nights:");
  });

  it("ItineraryItem — id, tripId, dayIndex, name, category", () => {
    const block = TYPES_SRC.match(/export interface ItineraryItem \{([^}]+)\}/s);
    expect(block).not.toBeNull();
    expect(block![1]).toContain("id:");
    expect(block![1]).toContain("tripId:");
    expect(block![1]).toContain("dayIndex:");
    expect(block![1]).toContain("name:");
    expect(block![1]).toContain("category:");
  });

  it("City — slug, code, name, countryCode", () => {
    const block = TYPES_SRC.match(/export interface City \{([^}]+)\}/s);
    expect(block).not.toBeNull();
    expect(block![1]).toContain("slug:");
    expect(block![1]).toContain("code:");
    expect(block![1]).toContain("name:");
    expect(block![1]).toContain("countryCode:");
  });

  it("OtaOffer — id, matchTag, ota, title, priceKrw", () => {
    const block = TYPES_SRC.match(/export interface OtaOffer \{([^}]+)\}/s);
    expect(block).not.toBeNull();
    expect(block![1]).toContain("id:");
    expect(block![1]).toContain("matchTag:");
    expect(block![1]).toContain("ota:");
    expect(block![1]).toContain("title:");
    expect(block![1]).toContain("priceKrw:");
  });

  it("Evidence — reasons, sources, verifiedAt", () => {
    const block = TYPES_SRC.match(/export interface Evidence \{([^}]+)\}/s);
    expect(block).not.toBeNull();
    expect(block![1]).toContain("reasons:");
    expect(block![1]).toContain("sources:");
    expect(block![1]).toContain("verifiedAt:");
  });
});

/* ════════════════════════════════════════════
 * Prisma schema ↔ types.ts 필드 정합
 * ════════════════════════════════════════════ */

const SCHEMA_SRC = fs.readFileSync(path.resolve("prisma/schema.prisma"), "utf-8");

describe("types.ts ↔ Prisma schema 정합", () => {
  it("TripStatus 값이 Prisma Trip.status @default와 일치", () => {
    const typeStatuses = extractUnionValues(TYPES_SRC, "TripStatus");
    const defaultMatch = SCHEMA_SRC.match(/status\s+String\s+@default\("(\w+)"\)/);
    expect(defaultMatch).not.toBeNull();
    expect(typeStatuses).toContain(defaultMatch![1]);
  });

  it("TravelMode 값이 Prisma Trip.currentMode @default와 일치", () => {
    const typeModes = extractUnionValues(TYPES_SRC, "TravelMode");
    const defaultMatch = SCHEMA_SRC.match(/currentMode\s+String\s+@default\("([^"]+)"\)/);
    expect(defaultMatch).not.toBeNull();
    expect(typeModes).toContain(defaultMatch![1]);
  });

  it("CostStatus 값이 Prisma CostEntry.status @default와 일치", () => {
    const typeStatuses = extractUnionValues(TYPES_SRC, "CostStatus");
    // CostEntry 블록에서 status default 추출
    const costBlock = SCHEMA_SRC.match(/model CostEntry \{[\s\S]*?\}/);
    expect(costBlock).not.toBeNull();
    const defaultMatch = costBlock![0].match(/status\s+String\s+@default\("(\w+)"\)/);
    if (defaultMatch) {
      expect(typeStatuses).toContain(defaultMatch[1]);
    }
  });
});
