/**
 * 여행 추억 리캡 페이지 — /wrap-up/[tripId]/recap
 *
 * 실제 여행 일정 데이터에서 통계·하이라이트를 계산하여 표시.
 */

import { notFound } from "next/navigation";
import { PostTripRecapView } from "@/components/recap/PostTripRecapView";
import { resolveTrip } from "@/lib/services/resolved-trip";
import type { ItineraryItem, RecapStats, RecapHighlight, RecapMoment } from "@/lib/types";

export const metadata = {
  title: "여행 추억 리캡 — TravelDiary",
  description: "여행의 하이라이트, 통계, 추억 사진을 한눈에 돌아보세요.",
};

// ── 일정 데이터에서 리캡 통계 계산 ──────────────────────────────

function buildStats(items: ItineraryItem[]): RecapStats {
  const placesVisited = items.length;

  // 가장 오래 머문 장소
  const longest = items.reduce(
    (max, it) => (it.durationMinutes > max.durationMinutes ? it : max),
    items[0],
  );
  const longestHours = Math.floor(longest.durationMinutes / 60);
  const longestMins = longest.durationMinutes % 60;
  const longestStay = `${longest.name} (${longestHours > 0 ? `${longestHours}시간` : ""}${longestMins > 0 ? ` ${longestMins}분` : ""})`.trim();

  // 총 예상 비용 (estimatedPrice)
  const totalSpentKRW = items.reduce((sum, it) => {
    if (!it.estimatedPrice) return sum;
    const { amount, currency } = it.estimatedPrice;
    if (currency === "KRW") return sum + amount;
    if (currency === "VND") return sum + Math.round(amount / 18);
    if (currency === "USD") return sum + Math.round(amount * 1350);
    return sum + amount;
  }, 0);

  // 카테고리별 장소 수
  const catCount: Record<string, number> = {};
  for (const it of items) {
    catCount[it.category] = (catCount[it.category] ?? 0) + 1;
  }
  const catLabels: Record<string, string> = { food: "맛집", spot: "관광", shopping: "쇼핑", rest: "휴식" };
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
  const biggestCategory = topCat
    ? `${catLabels[topCat[0]] ?? topCat[0]} (${Math.round((topCat[1] / placesVisited) * 100)}%)`
    : "—";

  // 총 이동거리 추정 (직선거리 합산)
  let totalDistanceKm = 0;
  const sorted = [...items].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].location;
    const curr = sorted[i].location;
    totalDistanceKm += haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
  }
  totalDistanceKm = Math.round(totalDistanceKm);

  return {
    placesVisited,
    longestStay,
    totalDistanceKm,
    totalSteps: totalDistanceKm * 1300, // ~1300보/km 추정
    totalSpentKRW,
    biggestCategory,
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildHighlights(items: ItineraryItem[]): RecapHighlight[] {
  const foods = items.filter((it) => it.category === "food");
  const spots = items.filter((it) => it.category === "spot");

  const bestFood = foods.sort((a, b) => b.priority - a.priority)[0];
  const bestSpot = spots.sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
  const bestValue = [...items]
    .filter((it) => it.estimatedPrice && it.estimatedPrice.amount > 0)
    .sort((a, b) => (a.estimatedPrice?.amount ?? 0) - (b.estimatedPrice?.amount ?? 0))[0];

  const highlights: RecapHighlight[] = [];
  if (bestFood) {
    highlights.push({ id: "hl-food", label: "베스트 맛집", emoji: "🏆", name: bestFood.name, icon: "restaurant", color: "purple" });
  }
  if (bestSpot) {
    highlights.push({ id: "hl-view", label: "베스트 관광", emoji: "📸", name: bestSpot.name, icon: "photo_camera", color: "coral" });
  }
  if (bestValue) {
    highlights.push({ id: "hl-value", label: "가성비 왕", emoji: "💰", name: bestValue.name, icon: "savings", color: "amber" });
  }
  return highlights;
}

function buildMoments(items: ItineraryItem[]): RecapMoment[] {
  // 각 day별 가장 높은 priority 아이템을 대표 모먼트로
  const dayMap = new Map<number, ItineraryItem>();
  for (const it of items) {
    const existing = dayMap.get(it.dayIndex);
    if (!existing || it.priority > existing.priority) {
      dayMap.set(it.dayIndex, it);
    }
  }
  return Array.from(dayMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, it]) => ({
      id: `moment-${it.id}`,
      dayLabel: `Day ${day + 1} · ${it.name}`,
      alt: it.name,
    }));
}

// ── 페이지 ──────────────────────────────────────────────────────

export default function RecapPage({
  params,
}: {
  params: { tripId: string };
}) {
  const resolved = resolveTrip(params.tripId);
  if (!resolved) notFound();

  const { trip, city, items } = resolved;
  const totalDays = trip.nights + 1;
  const tripTitle = `🇻🇳 ${city.name}의 기억`;
  const dateRange = `${trip.nights}박 ${totalDays}일`;

  const stats = buildStats(items);
  const highlights = buildHighlights(items);
  const moments = buildMoments(items);

  return (
    <PostTripRecapView
      tripId={params.tripId}
      tripTitle={tripTitle}
      dateRange={dateRange}
      stats={stats}
      highlights={highlights}
      moments={moments}
    />
  );
}
