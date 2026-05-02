/**
 * /trips 라우트 카드 빌드 + 필터 로직 — 사이클 I (ADR-033).
 * 사이클 J (ADR-034) — TripCardData를 ResolvedTrip 기반으로 리팩터.
 *
 * UI에서 분리한 이유:
 *  - 카드 분류·검증 카운트·필터 분기를 vitest로 회귀 단언
 *  - listDemoTrips() + listCities() 결합 결과를 단일 책임 함수에 모음
 */

import type { City, ItineraryItem } from "@/lib/types";
import type { DemoTripBundle } from "@/lib/seed";
import { isVietnamCity } from "@/lib/seed/cities";
import {
  listResolvedTrips,
  type ResolvedTrip,
} from "@/lib/services/resolved-trip";

export type FilterKey = "all" | "VN" | "coming-soon";

/** 사이클 J: trip 카드는 ResolvedTrip을 그대로 들고 다닌다 (view 객체 일원화). */
export interface TripCardData {
  kind: "trip";
  resolved: ResolvedTrip;
}

export interface CityOnlyCardData {
  kind: "city-only";
  city: City;
}

export interface ComingSoonCardData {
  kind: "coming-soon";
  city: City;
}

export type CardData = TripCardData | CityOnlyCardData | ComingSoonCardData;

const KIND_ORDER: CardData["kind"][] = ["trip", "city-only", "coming-soon"];

/** evidence.sources가 있는 item 수. 카드의 "AI 검증 N곳" 표기에 사용. */
export function countVerifiedItems(items: ItineraryItem[]): number {
  return items.filter((it) => it.evidence.sources.length > 0).length;
}

/** 카드 정렬·라벨에 쓰는 표면 필드 추출 (kind 무관). */
export function cardSurface(c: CardData): { name: string; code: string } {
  if (c.kind === "trip") {
    return {
      name: c.resolved.city.name,
      code: c.resolved.trip.destinationCode,
    };
  }
  return { name: c.city.name, code: c.city.code };
}

/**
 * trip 5 + city only(HOI) 1 + ComingSoon(BKK/TYO) 2 = 8 카드 빌드.
 *  - trip이 있는 도시 → trip 카드 (ResolvedTrip 기반)
 *  - trip이 없는 베트남 도시 → city-only
 *  - trip이 없는 비-베트남 도시 → coming-soon
 *
 * 사이클 J: bundles 매개변수는 호환성 유지(테스트 시드 주입 가능). 내부에서
 *   listResolvedTrips()를 호출해 city merge된 ResolvedTrip을 카드로 결합.
 *
 * 정렬: trip → city-only → coming-soon, 같은 kind 안에서는 한국어 이름 정렬.
 */
export function buildCards(
  bundles: DemoTripBundle[],
  cities: City[],
): CardData[] {
  const cardsByCode = new Map<string, CardData>();

  // 1) trip 카드 — ResolvedTrip 풀에서 매칭
  const resolvedByCode = new Map<string, ResolvedTrip>();
  for (const r of listResolvedTrips()) {
    resolvedByCode.set(r.trip.destinationCode, r);
  }
  for (const b of bundles) {
    const r = resolvedByCode.get(b.trip.destinationCode);
    if (!r) continue;
    cardsByCode.set(b.trip.destinationCode, { kind: "trip", resolved: r });
  }

  // 2) city only / coming-soon — trip이 없는 도시
  for (const city of cities) {
    if (cardsByCode.has(city.code)) continue;
    if (isVietnamCity(city)) {
      cardsByCode.set(city.code, { kind: "city-only", city });
    } else {
      cardsByCode.set(city.code, { kind: "coming-soon", city });
    }
  }

  return [...cardsByCode.values()].sort((a, b) => {
    const ai = KIND_ORDER.indexOf(a.kind);
    const bi = KIND_ORDER.indexOf(b.kind);
    if (ai !== bi) return ai - bi;
    return cardSurface(a).name.localeCompare(cardSurface(b).name, "ko");
  });
}

export function applyFilter(cards: CardData[], filter: FilterKey): CardData[] {
  if (filter === "all") return cards;
  if (filter === "coming-soon") {
    return cards.filter((c) => c.kind === "coming-soon");
  }
  return cards.filter((c) => {
    if (c.kind === "trip") {
      return c.resolved.city.countryCode === filter;
    }
    return c.city.countryCode === filter;
  });
}

export function parseFilter(raw: string | string[] | undefined): FilterKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "VN" || v === "coming-soon") return v;
  return "all";
}
