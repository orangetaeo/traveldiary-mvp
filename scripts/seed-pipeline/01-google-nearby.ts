/**
 * Phase A-1: Google Places Nearby Search.
 *
 * 각 도시의 구역(Zone)별로 Nearby Search를 수행하여 장소를 수집한다.
 *
 * 사용법:
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/seed-pipeline/01-google-nearby.ts [city]
 *
 * 인자:
 *   city — "phu-quoc" | "da-nang" (기본값: phu-quoc)
 *
 * 출력:
 *   data/seeds/{city}-nearby-raw.json
 */

import { CITY_CONFIGS, API_CONFIG, TYPE_TO_CATEGORY } from "./config";
import type { CityKey } from "./config";
import type { RawGooglePlace } from "./types";
import { getRequiredEnv, sleep, log, logError, writeJson, readJson, progressBar } from "./utils";

const NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

// 핵심 타입만 사용 (23개 → 12개로 축소, 중복 결과 줄이고 속도 향상)
const CORE_SEARCH_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "tourist_attraction",
  "museum",
  "park",
  "amusement_park",
  "shopping_mall",
  "store",
  "lodging",
  "spa",
  "beauty_salon",
] as const;

// next_page_token INVALID_REQUEST 최대 재시도
const MAX_TOKEN_RETRIES = 3;

async function main() {
  const cityArg = (process.argv[2] ?? "phu-quoc") as CityKey;
  const config = CITY_CONFIGS[cityArg];
  if (!config) {
    console.error(`알 수 없는 도시: ${cityArg}. 가능: ${Object.keys(CITY_CONFIGS).join(", ")}`);
    process.exit(1);
  }

  const apiKey = getRequiredEnv("GOOGLE_PLACES_API_KEY");
  const totalSteps = config.zones.length * CORE_SEARCH_TYPES.length;
  log("01-nearby", `시작: ${config.name} (${config.zones.length}개 구역 × ${CORE_SEARCH_TYPES.length}개 타입 = ${totalSteps} 스텝)`);

  // 기존 결과가 있으면 이어서 (중단 복구)
  const outputFile = `${cityArg}-nearby-raw.json`;
  const existing = readJson<RawGooglePlace[]>(outputFile);
  const allPlaces: Map<string, RawGooglePlace> = new Map();
  if (existing) {
    for (const p of existing) allPlaces.set(p.placeId, p);
    log("01-nearby", `기존 ${allPlaces.size}곳 로드 (중단 복구)`);
  }

  let apiCalls = 0;
  let stepsDone = 0;
  const errors: string[] = [];

  for (let zi = 0; zi < config.zones.length; zi++) {
    const zone = config.zones[zi];
    log("01-nearby", `\n━━━ 구역 ${zi + 1}/${config.zones.length}: ${zone.name} ━━━`);

    for (const searchType of CORE_SEARCH_TYPES) {
      let pageToken: string | undefined;
      let pageNum = 0;
      let tokenRetries = 0;
      let typeCount = 0;

      do {
        const params = new URLSearchParams({
          location: `${zone.lat},${zone.lng}`,
          radius: zone.radiusMeters.toString(),
          type: searchType,
          key: apiKey,
          language: "ko",
        });
        if (pageToken) params.set("pagetoken", pageToken);

        try {
          const resp = await fetch(`${NEARBY_URL}?${params.toString()}`);
          apiCalls++;

          if (!resp.ok) {
            logError("01-nearby", `HTTP ${resp.status} — ${searchType}`);
            errors.push(`HTTP ${resp.status} — zone=${zone.id}, type=${searchType}`);
            break;
          }

          const json = await resp.json() as {
            status: string;
            results?: Array<{
              place_id?: string;
              name?: string;
              geometry?: { location?: { lat?: number; lng?: number } };
              vicinity?: string;
              types?: string[];
              rating?: number;
              user_ratings_total?: number;
              price_level?: number;
              business_status?: string;
              photos?: Array<{ photo_reference?: string }>;
              opening_hours?: { weekday_text?: string[] };
            }>;
            next_page_token?: string;
            error_message?: string;
          };

          // next_page_token 아직 활성화 안 됨 — 재시도 (최대 3회)
          if (json.status === "INVALID_REQUEST" && pageToken) {
            tokenRetries++;
            if (tokenRetries > MAX_TOKEN_RETRIES) {
              log("01-nearby", `  ${searchType}: token 재시도 ${MAX_TOKEN_RETRIES}회 초과, 다음 타입`);
              break;
            }
            await sleep(2000);
            continue;
          }
          tokenRetries = 0; // 성공 시 리셋

          if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
            logError("01-nearby", `API ${json.status}: ${json.error_message ?? ""} — ${searchType}`);
            errors.push(`API ${json.status} — zone=${zone.id}, type=${searchType}`);
            break;
          }

          for (const r of json.results ?? []) {
            if (!r.place_id || !r.name || !r.geometry?.location) continue;

            const place: RawGooglePlace = {
              placeId: r.place_id,
              name: r.name,
              lat: r.geometry.location.lat!,
              lng: r.geometry.location.lng!,
              address: r.vicinity ?? "",
              types: r.types ?? [],
              rating: r.rating,
              userRatingsTotal: r.user_ratings_total,
              priceLevel: r.price_level,
              businessStatus: r.business_status,
              photos: (r.photos ?? [])
                .slice(0, 3)
                .map((p) => p.photo_reference)
                .filter(Boolean) as string[],
              openingHours: r.opening_hours?.weekday_text,
            };

            if (!allPlaces.has(place.placeId)) {
              allPlaces.set(place.placeId, place);
              typeCount++;
            }
          }

          pageToken = json.next_page_token;
          pageNum++;

          await sleep(API_CONFIG.delayBetweenRequests);
        } catch (err) {
          logError("01-nearby", `Network: ${err instanceof Error ? err.message : "unknown"} — ${searchType}`);
          errors.push(`Network — zone=${zone.id}, type=${searchType}`);
          break;
        }
      } while (pageToken && pageNum < API_CONFIG.maxPagesPerZone);

      stepsDone++;
      if (typeCount > 0) {
        log("01-nearby", `  ${searchType}: +${typeCount}곳 (누적 ${allPlaces.size})`);
      }
    }

    // 구역 완료 후 중간 저장
    writeJson(outputFile, Array.from(allPlaces.values()));
    log("01-nearby", progressBar(stepsDone, totalSteps) + ` — 총 ${allPlaces.size}곳`);
  }

  // 최종 저장
  const result = Array.from(allPlaces.values());
  writeJson(outputFile, result);

  // 카테고리별 통계
  const stats = { food: 0, spot: 0, shopping: 0, rest: 0, unknown: 0 };
  for (const p of result) {
    const cat = inferCategory(p.types);
    if (cat) stats[cat]++;
    else stats.unknown++;
  }

  log("01-nearby", `\n═══ 완료 ═══`);
  log("01-nearby", `총 수집: ${result.length}곳`);
  log("01-nearby", `API 호출: ${apiCalls}회`);
  log("01-nearby", `카테고리: food=${stats.food}, spot=${stats.spot}, shopping=${stats.shopping}, rest=${stats.rest}, unknown=${stats.unknown}`);
  if (errors.length > 0) {
    log("01-nearby", `에러: ${errors.length}건`);
    errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }
}

function inferCategory(types: string[]): "food" | "spot" | "shopping" | "rest" | null {
  for (const t of types) {
    if (TYPE_TO_CATEGORY[t]) return TYPE_TO_CATEGORY[t];
  }
  return null;
}

main().catch((err) => {
  console.error("치명적 에러:", err);
  process.exit(1);
});
