/**
 * Phase A-4: Merge & Deduplicate.
 *
 * Google Details + Naver Evidence를 병합하고 중복 제거.
 * 품질 점수(qualityScore)를 계산하여 최종 Phase A 결과를 생성한다.
 *
 * 사용법:
 *   npx tsx scripts/seed-pipeline/04-merge-dedupe.ts [city]
 *
 * 입력:
 *   data/seeds/{city}-details.json
 *   data/seeds/{city}-naver-evidence.json
 * 출력:
 *   data/seeds/{city}-merged.json (최종 Phase A 결과)
 *   data/seeds/{city}-stats.json (통계 요약)
 */

import { CITY_CONFIGS, TYPE_TO_CATEGORY } from "./config";
import type { CityKey } from "./config";
import type { MergedSeedPlace, NaverEvidence, SeedCategory } from "./types";
import { log, writeJson, readJson } from "./utils";

interface DetailsInput {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  formattedAddress?: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  businessStatus?: string;
  photoUrls?: string[];
  photos?: string[];
  openingHours?: string[];
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  editorialSummary?: string;
}

// ═══════════════════════════════════════════════════════════════════
// 메인
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const cityArg = (process.argv[2] ?? "phu-quoc") as CityKey;
  const config = CITY_CONFIGS[cityArg];
  if (!config) {
    console.error(`알 수 없는 도시: ${cityArg}`);
    process.exit(1);
  }

  log("04-merge", `시작: ${config.name}`);

  // 입력 로드
  const details = readJson<DetailsInput[]>(`${cityArg}-details.json`);
  const naverData = readJson<NaverEvidence[]>(`${cityArg}-naver-evidence.json`);

  if (!details || details.length === 0) {
    console.error("입력 파일 없음. 먼저 02-google-details를 실행하세요.");
    process.exit(1);
  }

  log("04-merge", `Google Details: ${details.length}곳`);
  log("04-merge", `Naver Evidence: ${naverData?.length ?? 0}곳`);

  // Naver 데이터 → Map
  const naverMap = new Map<string, NaverEvidence>();
  if (naverData) {
    for (const ev of naverData) naverMap.set(ev.placeId, ev);
  }

  // 병합
  const merged: MergedSeedPlace[] = [];
  const seen = new Set<string>();

  for (const place of details) {
    // 중복 제거 (placeId 기준)
    if (seen.has(place.placeId)) continue;
    seen.add(place.placeId);

    // 폐업 제외
    if (place.businessStatus === "CLOSED_PERMANENTLY") continue;

    // 카테고리 추론
    const category = inferCategory(place.types);
    if (!category) continue; // 분류 불가 → 제외

    // Naver evidence 병합
    const naver = naverMap.get(place.placeId);

    // 품질 점수 계산
    const qualityScore = calculateQualityScore(place, naver);

    // 구역 추론 (좌표 기반)
    const zone = inferZone(place.lat, place.lng, config.zones);

    const result: MergedSeedPlace = {
      placeId: place.placeId,
      name: place.name,
      category,
      subCategory: inferSubCategory(place.types, category),
      lat: place.lat,
      lng: place.lng,
      address: place.formattedAddress ?? place.address,
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
      priceLevel: place.priceLevel,
      photos: place.photoUrls ?? [],
      businessStatus: place.businessStatus,
      openingHours: place.openingHours,
      naverEvidence: naver
        ? {
            blogTotal: naver.blogTotal,
            positiveRate: naver.positiveRate,
            topReasons: naver.topReasons,
          }
        : undefined,
      qualityScore,
      collectedAt: new Date().toISOString(),
      zone: zone ?? "unknown",
    };

    merged.push(result);
  }

  // 품질 점수 기준 정렬 (높은 것 먼저)
  merged.sort((a, b) => b.qualityScore - a.qualityScore);

  // 출력
  writeJson(`${cityArg}-merged.json`, merged);

  // 통계 생성
  const stats = generateStats(merged, config);
  writeJson(`${cityArg}-stats.json`, stats);

  // 콘솔 리포트
  log("04-merge", `\n═══ Phase A 완료 ═══`);
  log("04-merge", `최종 결과: ${merged.length}곳 (목표: ${config.targetCount})`);
  log("04-merge", `달성률: ${Math.round((merged.length / config.targetCount) * 100)}%`);
  log("04-merge", ``);
  log("04-merge", `카테고리 분포:`);
  log("04-merge", `  food:     ${stats.byCategory.food}곳 (${pct(stats.byCategory.food, merged.length)}%)`);
  log("04-merge", `  spot:     ${stats.byCategory.spot}곳 (${pct(stats.byCategory.spot, merged.length)}%)`);
  log("04-merge", `  shopping: ${stats.byCategory.shopping}곳 (${pct(stats.byCategory.shopping, merged.length)}%)`);
  log("04-merge", `  rest:     ${stats.byCategory.rest}곳 (${pct(stats.byCategory.rest, merged.length)}%)`);
  log("04-merge", ``);
  log("04-merge", `품질 분포:`);
  log("04-merge", `  상위 (≥70): ${stats.qualityBuckets.high}곳`);
  log("04-merge", `  중간 (40~69): ${stats.qualityBuckets.medium}곳`);
  log("04-merge", `  하위 (<40): ${stats.qualityBuckets.low}곳`);
  log("04-merge", ``);
  log("04-merge", `Naver 후기 보유: ${stats.withNaverEvidence}곳 (${pct(stats.withNaverEvidence, merged.length)}%)`);
  log("04-merge", `평균 품질점수: ${stats.avgQualityScore}`);
  log("04-merge", ``);
  log("04-merge", `구역별:`);
  for (const [zone, count] of Object.entries(stats.byZone)) {
    log("04-merge", `  ${zone}: ${count}곳`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 품질 점수 계산 (0~100)
// ═══════════════════════════════════════════════════════════════════

function calculateQualityScore(
  place: DetailsInput,
  naver?: NaverEvidence,
): number {
  let score = 0;

  // Google 평점 (0~30점)
  if (place.rating) {
    score += Math.min(30, (place.rating / 5) * 30);
  }

  // Google 리뷰 수 (0~20점) — log scale
  if (place.userRatingsTotal) {
    const logReviews = Math.log10(Math.max(1, place.userRatingsTotal));
    score += Math.min(20, (logReviews / 4) * 20); // 10000건 = 만점
  }

  // Naver 블로그 후기 (0~30점)
  if (naver) {
    // 후기 존재 여부 (10점)
    if (naver.blogTotal > 0) score += 10;
    // 후기 수 (0~10점) — log scale
    if (naver.blogTotal > 0) {
      const logBlogs = Math.log10(Math.max(1, naver.blogTotal));
      score += Math.min(10, (logBlogs / 3) * 10); // 1000건 = 만점
    }
    // 긍정률 (0~10점)
    score += (naver.positiveRate / 100) * 10;
  }

  // 사진 보유 (0~10점)
  if (place.photoUrls && place.photoUrls.length > 0) {
    score += Math.min(10, place.photoUrls.length * 2);
  } else if (place.photos && place.photos.length > 0) {
    score += Math.min(10, place.photos.length * 2);
  }

  // 영업중 보너스 (5점)
  if (place.businessStatus === "OPERATIONAL") {
    score += 5;
  }

  // 정보 완성도 보너스 (0~5점)
  let completeness = 0;
  if (place.phone) completeness++;
  if (place.website) completeness++;
  if (place.openingHours && place.openingHours.length > 0) completeness++;
  if (place.formattedAddress) completeness++;
  if (place.editorialSummary) completeness++;
  score += completeness;

  return Math.round(Math.min(100, score));
}

// ═══════════════════════════════════════════════════════════════════
// 카테고리 추론
// ═══════════════════════════════════════════════════════════════════

function inferCategory(types: string[]): SeedCategory | null {
  for (const t of types) {
    if (TYPE_TO_CATEGORY[t]) return TYPE_TO_CATEGORY[t];
  }
  return null;
}

function inferSubCategory(types: string[], mainCategory: SeedCategory): string | undefined {
  const subMap: Record<string, Record<string, string>> = {
    food: {
      cafe: "카페",
      bar: "바/펍",
      bakery: "베이커리",
      restaurant: "식당",
      meal_takeaway: "길거리",
    },
    spot: {
      museum: "박물관",
      park: "공원",
      aquarium: "수족관",
      amusement_park: "테마파크",
      church: "사원/성당",
      zoo: "동물원",
    },
    shopping: {
      shopping_mall: "쇼핑몰",
      clothing_store: "의류",
      jewelry_store: "쥬얼리",
      supermarket: "마트",
    },
    rest: {
      lodging: "숙소",
      spa: "스파",
      beauty_salon: "마사지",
    },
  };

  const subs = subMap[mainCategory];
  if (!subs) return undefined;

  for (const t of types) {
    if (subs[t]) return subs[t];
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════
// 구역 추론
// ═══════════════════════════════════════════════════════════════════

function inferZone(
  lat: number,
  lng: number,
  zones: Array<{ id: string; lat: number; lng: number; radiusMeters: number }>,
): string | null {
  let closest: { id: string; dist: number } | null = null;

  for (const zone of zones) {
    const dist = haversine(lat, lng, zone.lat, zone.lng);
    if (dist <= zone.radiusMeters && (!closest || dist < closest.dist)) {
      closest = { id: zone.id, dist };
    }
  }

  return closest?.id ?? null;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════════════════
// 통계 생성
// ═══════════════════════════════════════════════════════════════════

interface Stats {
  city: string;
  totalPlaces: number;
  targetCount: number;
  achievementRate: number;
  byCategory: Record<SeedCategory, number>;
  byZone: Record<string, number>;
  qualityBuckets: { high: number; medium: number; low: number };
  withNaverEvidence: number;
  avgQualityScore: number;
  generatedAt: string;
}

function generateStats(
  places: MergedSeedPlace[],
  config: { name: string; targetCount: number },
): Stats {
  const byCategory: Record<SeedCategory, number> = { food: 0, spot: 0, shopping: 0, rest: 0 };
  const byZone: Record<string, number> = {};
  const qualityBuckets = { high: 0, medium: 0, low: 0 };
  let withNaverEvidence = 0;
  let totalScore = 0;

  for (const p of places) {
    byCategory[p.category]++;
    byZone[p.zone] = (byZone[p.zone] ?? 0) + 1;
    if (p.qualityScore >= 70) qualityBuckets.high++;
    else if (p.qualityScore >= 40) qualityBuckets.medium++;
    else qualityBuckets.low++;
    if (p.naverEvidence) withNaverEvidence++;
    totalScore += p.qualityScore;
  }

  return {
    city: config.name,
    totalPlaces: places.length,
    targetCount: config.targetCount,
    achievementRate: Math.round((places.length / config.targetCount) * 100),
    byCategory,
    byZone,
    qualityBuckets,
    withNaverEvidence,
    avgQualityScore: places.length > 0 ? Math.round(totalScore / places.length) : 0,
    generatedAt: new Date().toISOString(),
  };
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

main().catch((err) => {
  console.error("치명적 에러:", err);
  process.exit(1);
});
