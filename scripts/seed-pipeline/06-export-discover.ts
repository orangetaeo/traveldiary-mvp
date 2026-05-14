/**
 * Phase D-1: Export to discover-places.ts.
 *
 * Phase B의 refined 데이터를 앱의 DiscoverPlace[] + SeedPlace[] 형식으로
 * 변환하여 lib/seed/ 에 직접 쓸 수 있는 TypeScript 파일을 생성한다.
 *
 * 사용법:
 *   npx tsx scripts/seed-pipeline/06-export-discover.ts [city]
 *
 * 입력: data/seeds/{city}-refined.json
 * 출력: lib/seed/places/{city}.ts (자동 생성)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { CITY_CONFIGS } from "./config";
import type { CityKey } from "./config";
import { log } from "./utils";

interface RefinedPlace {
  id: string;
  placeId: string;
  name: string;
  nameLocal: string;
  category: "food" | "spot" | "shopping" | "rest";
  subCategory: string;
  location: { lat: number; lng: number; address: string };
  estimatedPrice?: { amount: number; currency: string };
  defaultDurationMinutes: number;
  evidence: {
    reasons: string[];
    sources: Array<{
      platform: string;
      reviewCount?: number;
      positiveRate?: number;
      url?: string;
      lastVerified: string;
    }>;
    verifiedAt: string;
    warnings?: string[];
  };
  photos: string[];
  rating?: number;
  userRatingsTotal?: number;
  qualityScore: number;
  zone: string;
}

// DiscoverPlace 카테고리 매핑 (ADR-050: rest→spot 강제 매핑 해제, stay/wellness 신설)
const CATEGORY_MAP: Record<string, string> = {
  "카페": "cafe",
  "food": "food",
  "spot": "spot",
  "shopping": "shopping",
  "stay": "stay",        // ADR-050: 호텔/리조트/게스트하우스
  "wellness": "wellness", // ADR-050: 스파/마사지/뷰티
  "rest": "rest",        // ADR-050: 본 카테고리 유지 (spot 강제 매핑 해제)
};

function toDiscoverCategory(category: string, subCategory: string): string {
  if (subCategory === "카페") return "cafe";
  if (subCategory === "공원/정원" || subCategory === "해변" || subCategory === "폭포" || subCategory === "섬") return "nature";
  // ADR-050: subCategory 기반 정확 분기 (rest→spot 강제 매핑 해제)
  if (subCategory === "스파/마사지" || subCategory === "뷰티" || subCategory === "마사지") return "wellness";
  if (subCategory === "숙소" || subCategory === "리조트" || subCategory === "호텔" || subCategory === "게스트하우스") return "stay";
  if (category === "rest") return "rest"; // 보존 (공원·산책 등 폴백)
  return category;
}

function estimateDistance(zone: string): string {
  const distMap: Record<string, string> = {
    "pq-duong-dong": "즈엉동",
    "pq-ong-lang": "옹랑",
    "pq-an-thoi": "안터이",
    "pq-cua-can": "꺼이쩐",
    "pq-bai-dai": "바이다이",
    "pq-ham-ninh": "함닌",
    "dn-my-khe": "미케",
    "dn-han-river": "한강",
    "dn-son-tra": "선짜",
    "dn-ba-na": "바나힐",
    "dn-hoi-an": "호이안",
    "dn-ngu-hanh-son": "오행산",
    "hcm-district1": "1군",
    "hcm-district3": "3군",
    "hcm-thao-dien": "타오디엔",
    "hcm-district5": "5군",
    "hcm-binh-thanh": "빈탄",
    "hcm-district7": "7군",
    "han-old-quarter": "구시가지",
    "han-ba-dinh": "바딘",
    "han-tay-ho": "타이호",
    "han-dong-da": "동다",
    "han-hai-ba-trung": "하이바쯩",
    "nha-tran-phu": "트란푸",
    "nha-north": "북부",
    "nha-vinpearl": "빈펄",
    "nha-west": "서부",
    "nha-south": "남부",
    "dl-center": "시내",
    "dl-langbiang": "랑비앙",
    "dl-datanla": "다탄라",
    "dl-tuyen-lam": "뚜옌럼",
    "dl-north": "북부",
  };
  return distMap[zone] ?? "시내";
}

const CITY_DEST_MAP: Record<string, string> = {
  "phu-quoc": "푸꾸옥",
  "da-nang": "다낭",
  "ho-chi-minh": "호치민",
  "hanoi": "하노이",
  "nha-trang": "나트랑",
  "da-lat": "달랏",
};

async function main() {
  const cityArg = (process.argv[2] ?? "phu-quoc") as CityKey;
  const config = CITY_CONFIGS[cityArg];
  if (!config) {
    console.error(`알 수 없는 도시: ${cityArg}`);
    process.exit(1);
  }

  const ROOT = join(__dirname, "..", "..");
  const inputPath = join(ROOT, "data", "seeds", `${cityArg}-refined.json`);
  if (!existsSync(inputPath)) {
    console.error(`입력 파일 없음: ${inputPath}`);
    process.exit(1);
  }

  const refined: RefinedPlace[] = JSON.parse(readFileSync(inputPath, "utf-8"));
  log("06-export", `${config.name}: ${refined.length}곳 변환 시작`);

  const destination = CITY_DEST_MAP[cityArg] ?? config.name;

  // DiscoverPlace 배열 생성 (숙소 제외, 유효 rating만, ID 중복 제거)
  const seenIds = new Set<string>();
  const discoverPlaces = refined
    .filter((p) => {
      // 숙소(호텔/리조트/홈스테이)는 discover에서 제외
      if (p.category === "rest" && !["스파/마사지", "뷰티"].includes(p.subCategory)) return false;
      // rating 없거나 0인 곳 제외
      if (!p.rating || p.rating <= 0) return false;
      // reviewCount 없거나 0인 곳 제외
      if (!p.userRatingsTotal || p.userRatingsTotal <= 0) return false;
      return true;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: toDiscoverCategory(p.category, p.subCategory),
      rating: p.rating!,
      reviewCount: p.userRatingsTotal!,
      distance: estimateDistance(p.zone),
      badge: p.qualityScore >= 60 ? "popular" as const : p.qualityScore >= 50 ? "ai" as const : undefined,
      destination,
    }))
    .filter((p) => {
      // ID 중복 제거 (첫 번째만 유지)
      if (seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });

  // SeedPlace 배열 (전체 756곳, evidence 포함)
  const seedPlaces = refined.map((p) => ({
    id: p.id,
    googlePlaceId: p.placeId,
    name: p.name,
    nameLocal: p.nameLocal,
    category: p.category,
    subCategory: p.subCategory,
    location: p.location,
    estimatedPrice: p.estimatedPrice,
    defaultDurationMinutes: p.defaultDurationMinutes,
    evidence: p.evidence,
    photos: p.photos,
    rating: p.rating,
    userRatingsTotal: p.userRatingsTotal,
    qualityScore: p.qualityScore,
    zone: p.zone,
  }));

  // TypeScript 파일 생성
  const outDir = join(ROOT, "lib", "seed", "places");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // 1. Discover places
  const discoverFile = join(outDir, `${cityArg}-discover.ts`);
  const discoverContent = `/**
 * ${config.name} Discover Places — 자동 생성 (${new Date().toISOString().slice(0, 10)})
 * 생성: npx tsx scripts/seed-pipeline/06-export-discover.ts ${cityArg}
 * 수동 편집 금지 — 파이프라인에서 재생성.
 */

import type { DiscoverPlace } from "@/lib/types";

export const ${camelCase(cityArg)}DiscoverPlaces: DiscoverPlace[] = ${JSON.stringify(discoverPlaces, null, 2)};

export const ${camelCase(cityArg)}DiscoverCount = ${discoverPlaces.length};
`;
  writeFileSync(discoverFile, discoverContent, "utf-8");
  log("06-export", `  ✓ ${discoverFile} (${discoverPlaces.length}곳)`);

  // 2. Full seed places (JSON — too large for inline TS)
  const seedFile = join(outDir, `${cityArg}-places.json`);
  writeFileSync(seedFile, JSON.stringify(seedPlaces, null, 2), "utf-8");
  log("06-export", `  ✓ ${seedFile} (${seedPlaces.length}곳)`);

  // 3. Index file
  const indexFile = join(outDir, "index.ts");
  const indexContent = generateIndex(cityArg);
  writeFileSync(indexFile, indexContent, "utf-8");
  log("06-export", `  ✓ ${indexFile}`);

  // 통계
  const catCounts: Record<string, number> = {};
  for (const p of discoverPlaces) {
    catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
  }

  log("06-export", `\n═══ 완료 ═══`);
  log("06-export", `Discover: ${discoverPlaces.length}곳 (숙소 제외)`);
  log("06-export", `Full Seed: ${seedPlaces.length}곳`);
  log("06-export", `카테고리:`);
  for (const [cat, count] of Object.entries(catCounts)) {
    log("06-export", `  ${cat}: ${count}곳`);
  }
}

function camelCase(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function generateIndex(cityArg: string): string {
  return `/**
 * 시드 장소 풀 인덱스 — 자동 생성.
 * Discover 페이지 + AddItemModal에서 사용.
 */

export { ${camelCase(cityArg)}DiscoverPlaces, ${camelCase(cityArg)}DiscoverCount } from "./${cityArg}-discover";

import ${camelCase(cityArg)}PlacesJson from "./${cityArg}-places.json";
export const ${camelCase(cityArg)}Places = ${camelCase(cityArg)}PlacesJson;

import type { DiscoverPlace } from "@/lib/types";

const allDiscoverPlaces: DiscoverPlace[] = [];

// 동적 import를 피하고 정적 배열로 결합
import { ${camelCase(cityArg)}DiscoverPlaces } from "./${cityArg}-discover";
allDiscoverPlaces.push(...${camelCase(cityArg)}DiscoverPlaces);

/** 전체 discover places (모든 도시 합산) */
export function getAllDiscoverPlaces(): DiscoverPlace[] {
  return allDiscoverPlaces;
}

/** 도시별 discover places 필터 */
export function getDiscoverPlacesByDestination(destination: string): DiscoverPlace[] {
  return allDiscoverPlaces.filter(
    (p) => !p.destination || p.destination === destination,
  );
}

/** 전체 seed places (JSON) — 도시별 */
export function getSeedPlaces(city: string) {
  if (city === "${cityArg}" || city === "${CITY_DEST_MAP[cityArg] ?? ""}") return ${camelCase(cityArg)}PlacesJson;
  return [];
}
`;
}

main().catch((err) => {
  console.error("치명적 에러:", err);
  process.exit(1);
});
