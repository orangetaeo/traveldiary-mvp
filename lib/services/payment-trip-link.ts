/**
 * payment 페이지 → 활성 trip 매칭 (옵션 G, Session Y cap 3/3).
 *
 * city slug로 진입한 결제 가이드에서 동일 도시를 향한 데모 trip이 있으면
 * `/trips/[tripId]` 컨텍스트 진입을 제공. 없으면 `/trips` 일반 진입.
 *
 * SSR 순수 함수 — LocalStorage/Network 의존 0. 사용자 활성 trip 식별은
 * R1 게이트(OAuth + Prisma trip 모델) 후에 동일 시그니처로 swap 예정.
 */
import type { DemoTripBundle } from "../seed";
import { getCityBySlug } from "../seed/cities";

export interface ActiveTripLink {
  tripId: string;
  destination: string;
  isDemoTrip: boolean;
}

/**
 * city slug에 매칭되는 trip이 있으면 진입 정보를 반환.
 * `trip.destinationCode === city.code`로 매칭 (예: da-nang → DAD).
 */
export function findActiveTripByCity(
  slug: string,
  trips: DemoTripBundle[],
): ActiveTripLink | null {
  const city = getCityBySlug(slug);
  if (!city) return null;
  const bundle = trips.find((b) => b.trip.destinationCode === city.code);
  if (!bundle) return null;
  return {
    tripId: bundle.trip.id,
    destination: bundle.trip.destination,
    isDemoTrip: true,
  };
}
