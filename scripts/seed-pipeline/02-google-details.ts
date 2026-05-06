/**
 * Phase A-2: Google Places Details.
 *
 * 01-google-nearby에서 수집한 placeId 목록으로 상세 정보를 조회한다.
 * 사진 URL, 영업시간, 전화번호, 웹사이트 등 추가 필드 확보.
 *
 * 사용법:
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/seed-pipeline/02-google-details.ts [city]
 *
 * 입력: data/seeds/{city}-nearby-raw.json
 * 출력: data/seeds/{city}-details.json
 */

import { CITY_CONFIGS, API_CONFIG } from "./config";
import type { CityKey } from "./config";
import type { RawGooglePlace } from "./types";
import { getRequiredEnv, sleep, log, logError, writeJson, readJson, progressBar } from "./utils";

const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
const PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo";

const DETAILS_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "url", // Google Maps URL
  "geometry",
  "business_status",
  "opening_hours",
  "rating",
  "user_ratings_total",
  "price_level",
  "types",
  "photos",
  "reviews",
  "editorial_summary",
].join(",");

// ═══════════════════════════════════════════════════════════════════
// 확장된 상세 정보 타입
// ═══════════════════════════════════════════════════════════════════

export interface PlaceWithDetails extends RawGooglePlace {
  formattedAddress: string;
  phone?: string;
  internationalPhone?: string;
  website?: string;
  googleMapsUrl?: string;
  editorialSummary?: string;
  photoUrls: string[]; // photo_reference → 실제 URL
  reviews?: Array<{
    rating: number;
    text: string;
    language: string;
    time: number;
  }>;
  detailsFetchedAt: string;
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

  const apiKey = getRequiredEnv("GOOGLE_PLACES_API_KEY");
  const inputFile = `${cityArg}-nearby-raw.json`;
  const outputFile = `${cityArg}-details.json`;

  // 입력 로드
  const rawPlaces = readJson<RawGooglePlace[]>(inputFile);
  if (!rawPlaces || rawPlaces.length === 0) {
    console.error(`입력 파일 없음: data/seeds/${inputFile}. 먼저 01-google-nearby를 실행하세요.`);
    process.exit(1);
  }

  log("02-details", `시작: ${config.name} — ${rawPlaces.length}곳 상세 조회`);

  // 기존 결과 로드 (중단 복구)
  const existing = readJson<PlaceWithDetails[]>(outputFile);
  const completed = new Set<string>();
  const results: PlaceWithDetails[] = [];
  if (existing) {
    for (const p of existing) {
      completed.add(p.placeId);
      results.push(p);
    }
    log("02-details", `기존 ${completed.size}곳 로드 (중단 복구)`);
  }

  // 미완료 목록
  const pending = rawPlaces.filter((p) => !completed.has(p.placeId));
  log("02-details", `남은 ${pending.length}곳 처리 시작`);

  let apiCalls = 0;
  const errors: string[] = [];

  // 배치 처리
  for (let i = 0; i < pending.length; i += API_CONFIG.detailsBatchSize) {
    const batch = pending.slice(i, i + API_CONFIG.detailsBatchSize);

    for (const place of batch) {
      try {
        const params = new URLSearchParams({
          place_id: place.placeId,
          fields: DETAILS_FIELDS,
          key: apiKey,
          language: "ko",
        });

        const resp = await fetch(`${DETAILS_URL}?${params.toString()}`);
        apiCalls++;

        if (!resp.ok) {
          errors.push(`HTTP ${resp.status} — ${place.placeId}`);
          continue;
        }

        const json = await resp.json() as {
          status: string;
          result?: {
            place_id?: string;
            name?: string;
            formatted_address?: string;
            formatted_phone_number?: string;
            international_phone_number?: string;
            website?: string;
            url?: string;
            geometry?: { location?: { lat?: number; lng?: number } };
            business_status?: string;
            opening_hours?: { weekday_text?: string[] };
            rating?: number;
            user_ratings_total?: number;
            price_level?: number;
            types?: string[];
            photos?: Array<{ photo_reference?: string; width?: number; height?: number }>;
            reviews?: Array<{
              rating?: number;
              text?: string;
              language?: string;
              time?: number;
            }>;
            editorial_summary?: { overview?: string };
          };
          error_message?: string;
        };

        if (json.status !== "OK" || !json.result) {
          if (json.status === "NOT_FOUND") {
            // 삭제된 장소 — 스킵
            continue;
          }
          errors.push(`API ${json.status}: ${json.error_message ?? ""} — ${place.placeId}`);
          continue;
        }

        const r = json.result;

        // 사진 reference 저장 (최대 5장) — API 키 노출 방지, 런타임에 URL 생성
        const photoUrls = (r.photos ?? []).slice(0, 5)
          .map((photo) => photo.photo_reference)
          .filter(Boolean) as string[];

        const detailed: PlaceWithDetails = {
          ...place,
          name: r.name ?? place.name,
          lat: r.geometry?.location?.lat ?? place.lat,
          lng: r.geometry?.location?.lng ?? place.lng,
          address: place.address, // vicinity 유지
          formattedAddress: r.formatted_address ?? place.address,
          phone: r.formatted_phone_number,
          internationalPhone: r.international_phone_number,
          website: r.website,
          googleMapsUrl: r.url,
          types: r.types ?? place.types,
          rating: r.rating ?? place.rating,
          userRatingsTotal: r.user_ratings_total ?? place.userRatingsTotal,
          priceLevel: r.price_level ?? place.priceLevel,
          businessStatus: r.business_status ?? place.businessStatus,
          openingHours: r.opening_hours?.weekday_text ?? place.openingHours,
          photos: place.photos, // photo_reference 유지
          photoUrls,
          editorialSummary: r.editorial_summary?.overview,
          reviews: (r.reviews ?? []).slice(0, 3).map((rev) => ({
            rating: rev.rating ?? 0,
            text: rev.text ?? "",
            language: rev.language ?? "ko",
            time: rev.time ?? 0,
          })),
          detailsFetchedAt: new Date().toISOString(),
        };

        results.push(detailed);
        await sleep(API_CONFIG.detailsDelay);
      } catch (err) {
        const errMsg = `Network: ${err instanceof Error ? err.message : "unknown"} — ${place.placeId}`;
        logError("02-details", errMsg);
        errors.push(errMsg);
      }
    }

    // 배치 완료 후 중간 저장
    writeJson(outputFile, results);
    const progress = Math.min(i + API_CONFIG.detailsBatchSize, pending.length);
    log("02-details", progressBar(progress + completed.size, rawPlaces.length));
  }

  // 폐업 필터링
  const active = results.filter(
    (p) => p.businessStatus !== "CLOSED_PERMANENTLY"
  );
  const closed = results.length - active.length;

  writeJson(outputFile, active);

  log("02-details", `\n═══ 완료 ═══`);
  log("02-details", `총 처리: ${results.length}곳 (폐업 제외: ${closed}곳)`);
  log("02-details", `최종 결과: ${active.length}곳`);
  log("02-details", `API 호출: ${apiCalls}회`);
  if (errors.length > 0) {
    log("02-details", `에러: ${errors.length}건`);
    errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }
}

main().catch((err) => {
  console.error("치명적 에러:", err);
  process.exit(1);
});
