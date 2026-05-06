/**
 * Phase A-1b: Shopping 카테고리 보강.
 *
 * Nearby Search의 type 필터로는 market/night market이 잘 잡히지 않으므로
 * Text Search로 쇼핑 관련 키워드를 직접 검색하여 보강한다.
 *
 * 사용법:
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/seed-pipeline/01b-shopping-boost.ts [city]
 *
 * 입력: data/seeds/{city}-nearby-raw.json (기존 결과에 병합)
 * 출력: data/seeds/{city}-nearby-raw.json (갱신)
 */

import { CITY_CONFIGS, API_CONFIG } from "./config";
import type { CityKey } from "./config";
import type { RawGooglePlace } from "./types";
import { getRequiredEnv, sleep, log, writeJson, readJson } from "./utils";

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";

// 쇼핑 관련 검색 쿼리 (도시명과 조합)
const SHOPPING_QUERIES_TEMPLATE = [
  "{city} market",
  "{city} night market",
  "{city} shopping mall",
  "{city} souvenir shop",
  "{city} local market",
  "{city} supermarket",
  "{city} convenience store",
  "{city} gift shop",
  "{city} pearl shop",        // 푸꾸옥 특산 — 진주
  "{city} fish sauce factory", // 푸꾸옥 특산 — 느억맘
  "{city} pepper farm",       // 푸꾸옥 특산 — 후추
  "{city} 야시장",
  "{city} 마켓",
  "{city} 쇼핑",
];

const CITY_SEARCH_NAMES: Record<string, string[]> = {
  "phu-quoc": ["Phu Quoc", "Phú Quốc"],
  "da-nang": ["Da Nang", "Đà Nẵng"],
};

async function main() {
  const cityArg = (process.argv[2] ?? "phu-quoc") as CityKey;
  const config = CITY_CONFIGS[cityArg];
  if (!config) {
    console.error(`알 수 없는 도시: ${cityArg}`);
    process.exit(1);
  }

  const apiKey = getRequiredEnv("GOOGLE_PLACES_API_KEY");
  const outputFile = `${cityArg}-nearby-raw.json`;

  // 기존 결과 로드
  const existing = readJson<RawGooglePlace[]>(outputFile);
  const allPlaces = new Map<string, RawGooglePlace>();
  if (existing) {
    for (const p of existing) allPlaces.set(p.placeId, p);
  }
  const beforeCount = allPlaces.size;
  log("01b-shop", `기존 ${beforeCount}곳 로드. Shopping 보강 시작.`);

  const cityNames = CITY_SEARCH_NAMES[cityArg] ?? [config.name];
  let apiCalls = 0;
  let newPlaces = 0;

  // 도시명 × 쿼리 조합
  for (const cityName of cityNames) {
    for (const template of SHOPPING_QUERIES_TEMPLATE) {
      const query = template.replace("{city}", cityName);

      // 도시 중심 좌표로 bias
      const centerZone = config.zones[0];
      const params = new URLSearchParams({
        query,
        key: apiKey,
        language: "ko",
        location: `${centerZone.lat},${centerZone.lng}`,
        radius: "30000", // 섬 전체 커버
      });

      try {
        const resp = await fetch(`${TEXT_SEARCH_URL}?${params.toString()}`);
        apiCalls++;

        if (!resp.ok) {
          log("01b-shop", `  HTTP ${resp.status} — "${query}"`);
          continue;
        }

        const json = await resp.json() as {
          status: string;
          results?: Array<{
            place_id?: string;
            name?: string;
            geometry?: { location?: { lat?: number; lng?: number } };
            formatted_address?: string;
            types?: string[];
            rating?: number;
            user_ratings_total?: number;
            price_level?: number;
            business_status?: string;
            photos?: Array<{ photo_reference?: string }>;
          }>;
        };

        if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
          log("01b-shop", `  API ${json.status} — "${query}"`);
          continue;
        }

        let queryNew = 0;
        for (const r of json.results ?? []) {
          if (!r.place_id || !r.name || !r.geometry?.location) continue;
          if (allPlaces.has(r.place_id)) continue;

          const place: RawGooglePlace = {
            placeId: r.place_id,
            name: r.name,
            lat: r.geometry.location.lat!,
            lng: r.geometry.location.lng!,
            address: r.formatted_address ?? "",
            types: r.types ?? [],
            rating: r.rating,
            userRatingsTotal: r.user_ratings_total,
            priceLevel: r.price_level,
            businessStatus: r.business_status,
            photos: (r.photos ?? [])
              .slice(0, 3)
              .map((p) => p.photo_reference)
              .filter(Boolean) as string[],
          };

          allPlaces.set(place.placeId, place);
          queryNew++;
          newPlaces++;
        }

        if (queryNew > 0) {
          log("01b-shop", `  "${query}": +${queryNew}곳`);
        }

        await sleep(API_CONFIG.delayBetweenRequests);
      } catch (err) {
        log("01b-shop", `  Network error: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }
  }

  // 저장
  writeJson(outputFile, Array.from(allPlaces.values()));

  log("01b-shop", `\n═══ 완료 ═══`);
  log("01b-shop", `신규 추가: +${newPlaces}곳 (${beforeCount} → ${allPlaces.size})`);
  log("01b-shop", `API 호출: ${apiCalls}회`);
}

main().catch((err) => {
  console.error("치명적 에러:", err);
  process.exit(1);
});
