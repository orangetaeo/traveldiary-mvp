/**
 * ResolvedTrip 뷰 객체 — 사이클 J (ADR-034).
 *
 * 패턴 답습 — feedback_resolved_view_pattern:
 *   - raw seed는 optional 필드
 *   - view 객체(Resolved*)는 required 필드 보장
 *   - 화면은 항상 resolved 사용
 *
 * ADR-032의 ResolvedCity 답습. trip + city + items + 집계까지 결합.
 */

import type { ItineraryItem, ResolvedCity, Trip } from "@/lib/types";
import { listDemoTrips, type DemoTripBundle } from "@/lib/seed";
import { resolveCityByCode } from "@/lib/seed/cities";

export interface ResolvedTrip {
  trip: Trip;
  /** city + country merged. trip의 destinationCode가 매칭되는 city 기준. */
  city: ResolvedCity;
  items: ItineraryItem[];
  /** items.length 캐싱 (카드·배지에서 빈번히 사용) */
  itemCount: number;
  /** evidence.sources.length > 0 인 item 수 — "AI 검증 N곳" 표기 */
  verifiedCount: number;
}

/** evidence.sources가 있는 item 수. trips-listing 동일 정의 답습. */
function countVerifiedItems(items: ItineraryItem[]): number {
  return items.filter((it) => it.evidence.sources.length > 0).length;
}

function fromBundle(bundle: DemoTripBundle): ResolvedTrip | null {
  const city = resolveCityByCode(bundle.trip.destinationCode);
  if (!city) return null;
  return {
    trip: bundle.trip,
    city,
    items: bundle.items,
    itemCount: bundle.items.length,
    verifiedCount: countVerifiedItems(bundle.items),
  };
}

/** trip ID로 ResolvedTrip 조회. city 매칭 실패 시 null. */
export function resolveTrip(tripId: string): ResolvedTrip | null {
  const bundle = listDemoTrips().find((b) => b.trip.id === tripId);
  if (!bundle) return null;
  return fromBundle(bundle);
}

/**
 * city code(예: "PQC")로 그 도시의 demo trip 모두 조회.
 * city only(HOI) 등 trip 없는 도시는 빈 배열.
 *
 * 사이클 J: 현 시드는 도시당 trip 1개. 미래 다도시 trip 추가 시 N개 가능.
 */
export function resolveTripsByCityCode(cityCode: string): ResolvedTrip[] {
  const out: ResolvedTrip[] = [];
  for (const bundle of listDemoTrips()) {
    if (bundle.trip.destinationCode !== cityCode) continue;
    const resolved = fromBundle(bundle);
    if (resolved) out.push(resolved);
  }
  return out;
}

/** 모든 ResolvedTrip 목록. /trips 페이지에서 사이클 I 답습 호출. */
export function listResolvedTrips(): ResolvedTrip[] {
  const out: ResolvedTrip[] = [];
  for (const bundle of listDemoTrips()) {
    const resolved = fromBundle(bundle);
    if (resolved) out.push(resolved);
  }
  return out;
}
