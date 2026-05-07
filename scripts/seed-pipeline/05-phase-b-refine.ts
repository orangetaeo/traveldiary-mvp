/**
 * Phase B: 정제 (Refine).
 *
 * Phase A의 merged 데이터를 앱에서 사용할 수 있는 형태로 변환한다.
 *   1. 한글명 정제 — Google이 반환한 한국어 이름 정리 + 현지어 병기
 *   2. 세부 카테고리 매핑 — types → subCategory 세분화
 *   3. Evidence 객체 생성 — 앱의 Evidence 인터페이스 형식으로
 *   4. 품질 점수 재계산 — 보강 데이터 반영
 *   5. SeedPlace 형식 출력 — lib/seed/phu-quoc.ts 와 호환
 *
 * 사용법:
 *   npx tsx scripts/seed-pipeline/05-phase-b-refine.ts [city]
 *
 * 입력: data/seeds/{city}-merged.json
 * 출력:
 *   data/seeds/{city}-refined.json   (정제된 전체 목록)
 *   data/seeds/{city}-seed-ready.json (SeedPlace[] 형식)
 */

import { readJson, writeJson, log } from "./utils";
import { CITY_CONFIGS } from "./config";
import type { CityKey } from "./config";
import type { MergedSeedPlace, SeedCategory } from "./types";

// ═══════════════════════════════════════════════════════════════════
// 출력 타입 (앱의 SeedPlace와 호환)
// ═══════════════════════════════════════════════════════════════════

interface RefinedPlace {
  id: string;
  placeId: string;
  name: string;         // 한글 우선, 없으면 원문
  nameLocal: string;    // 현지어(베트남어) 원문
  category: SeedCategory;
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

  const inputFile = `${cityArg}-merged.json`;
  const merged = readJson<MergedSeedPlace[]>(inputFile);
  if (!merged || merged.length === 0) {
    console.error(`입력 파일 없음: data/seeds/${inputFile}`);
    process.exit(1);
  }

  log("05-refine", `시작: ${config.name} — ${merged.length}곳 정제`);

  const now = new Date().toISOString();
  const refined: RefinedPlace[] = [];
  let skipped = 0;

  for (const place of merged) {
    // 1. 한글명 정제
    const { displayName, localName } = refineNames(place.name);

    // 2. 세부 카테고리
    const subCategory = place.subCategory ?? inferSubCategory(place);

    // 3. 기본 체류시간 추정
    const duration = estimateDuration(place.category, subCategory);

    // 4. 가격 추정
    const price = estimatePrice(place);

    // 5. Evidence 생성
    const evidence = buildEvidence(place, now);

    // 6. 품질 필터 — 최저 기준 미달 시 스킵
    if (place.qualityScore < 15) {
      skipped++;
      continue;
    }

    // 7. ID 생성
    const id = generateId(cityArg, place.category, displayName, refined.length);

    refined.push({
      id,
      placeId: place.placeId,
      name: displayName,
      nameLocal: localName,
      category: place.category,
      subCategory,
      location: {
        lat: place.lat,
        lng: place.lng,
        address: place.address,
      },
      estimatedPrice: price,
      defaultDurationMinutes: duration,
      evidence,
      photos: place.photos.slice(0, 5),
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
      qualityScore: place.qualityScore,
      zone: place.zone,
    });
  }

  // 품질 점수 기준 정렬
  refined.sort((a, b) => b.qualityScore - a.qualityScore);

  writeJson(`${cityArg}-refined.json`, refined);

  // 통계
  const stats = {
    total: refined.length,
    skipped,
    byCategory: countBy(refined, "category"),
    bySubCategory: countBy(refined, "subCategory"),
    avgQuality: Math.round(refined.reduce((s, p) => s + p.qualityScore, 0) / refined.length),
    withPhotos: refined.filter((p) => p.photos.length > 0).length,
    withPrice: refined.filter((p) => p.estimatedPrice).length,
    topPlaces: refined.slice(0, 10).map((p) => ({
      name: p.name,
      category: p.category,
      score: p.qualityScore,
      rating: p.rating,
      reviews: p.userRatingsTotal,
    })),
  };

  writeJson(`${cityArg}-refine-stats.json`, stats);

  log("05-refine", `\n═══ Phase B 완료 ═══`);
  log("05-refine", `입력: ${merged.length}곳 → 출력: ${refined.length}곳 (스킵: ${skipped})`);
  log("05-refine", `평균 품질: ${stats.avgQuality}`);
  log("05-refine", `사진 보유: ${stats.withPhotos}곳 (${pct(stats.withPhotos, refined.length)}%)`);
  log("05-refine", ``);
  log("05-refine", `카테고리:`);
  for (const [cat, count] of Object.entries(stats.byCategory)) {
    log("05-refine", `  ${cat}: ${count}곳`);
  }
  log("05-refine", ``);
  log("05-refine", `세부 카테고리:`);
  for (const [sub, count] of Object.entries(stats.bySubCategory)) {
    log("05-refine", `  ${sub}: ${count}곳`);
  }
  log("05-refine", ``);
  log("05-refine", `TOP 10:`);
  for (const p of stats.topPlaces) {
    log("05-refine", `  ${p.name} — ${p.category} ★${p.rating ?? "-"} (${p.reviews ?? 0}건) Q=${p.score}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 한글명 정제
// ═══════════════════════════════════════════════════════════════════

function refineNames(rawName: string): { displayName: string; localName: string } {
  // Google이 language=ko로 반환한 이름 — 이미 한국어인 경우 다수
  // 패턴: "한글명 (원문)" or "원문"
  const parenMatch = rawName.match(/^(.+?)\s*[（(](.+?)[)）]\s*$/);
  if (parenMatch) {
    return { displayName: parenMatch[1].trim(), localName: parenMatch[2].trim() };
  }

  // 한글이 포함되어 있으면 그대로 사용
  if (/[가-힣]/.test(rawName)) {
    return { displayName: rawName, localName: rawName };
  }

  // 영문/베트남어만 — 그대로 유지 (LLM 번역 없이)
  return { displayName: rawName, localName: rawName };
}

// ═══════════════════════════════════════════════════════════════════
// 세부 카테고리 추론
// ═══════════════════════════════════════════════════════════════════

function inferSubCategory(place: MergedSeedPlace): string {
  const name = place.name.toLowerCase();
  const addr = place.address.toLowerCase();

  switch (place.category) {
    case "food": {
      if (name.includes("cafe") || name.includes("cà phê") || name.includes("coffee") || name.includes("카페"))
        return "카페";
      if (name.includes("bar") || name.includes("pub") || name.includes("cocktail") || name.includes("beer"))
        return "바/펍";
      if (name.includes("bakery") || name.includes("bánh"))
        return "베이커리";
      if (name.includes("bbq") || name.includes("grill") || name.includes("nướng"))
        return "바베큐";
      if (name.includes("seafood") || name.includes("hải sản") || name.includes("해산물"))
        return "해산물";
      if (name.includes("phở") || name.includes("bún") || name.includes("mì"))
        return "베트남식";
      if (name.includes("pizza") || name.includes("burger") || name.includes("pasta"))
        return "양식";
      if (name.includes("sushi") || name.includes("japan"))
        return "일식";
      if (name.includes("korean") || name.includes("한국") || name.includes("한식"))
        return "한식";
      return "식당";
    }
    case "spot": {
      if (name.includes("beach") || name.includes("bãi") || name.includes("비치"))
        return "해변";
      if (name.includes("temple") || name.includes("chùa") || name.includes("pagoda") || name.includes("church"))
        return "사원/성당";
      if (name.includes("museum") || name.includes("bảo tàng"))
        return "박물관";
      if (name.includes("park") || name.includes("vườn") || name.includes("garden"))
        return "공원/정원";
      if (name.includes("waterfall") || name.includes("thác"))
        return "폭포";
      if (name.includes("island") || name.includes("đảo"))
        return "섬";
      if (name.includes("diving") || name.includes("snorkeling") || name.includes("lặn"))
        return "스노클링/다이빙";
      if (name.includes("cable") || name.includes("cáp treo"))
        return "케이블카";
      if (name.includes("vinwonders") || name.includes("amusement") || name.includes("theme"))
        return "테마파크";
      if (name.includes("sunset") || name.includes("hoàng hôn"))
        return "일몰 포인트";
      return "관광지";
    }
    case "shopping": {
      if (name.includes("market") || name.includes("chợ") || name.includes("마켓") || name.includes("시장"))
        return "마켓/시장";
      if (name.includes("night market") || name.includes("야시장"))
        return "야시장";
      if (name.includes("pearl") || name.includes("ngọc trai") || name.includes("진주"))
        return "진주/특산품";
      if (name.includes("fish sauce") || name.includes("nước mắm") || name.includes("느억맘"))
        return "느억맘/특산품";
      if (name.includes("pepper") || name.includes("tiêu") || name.includes("후추"))
        return "후추/특산품";
      if (name.includes("souvenir") || name.includes("gift"))
        return "기념품";
      if (name.includes("mall") || name.includes("center") || name.includes("plaza"))
        return "쇼핑몰";
      if (name.includes("minimart") || name.includes("mart") || name.includes("supermarket"))
        return "마트";
      if (name.includes("convenience") || name.includes("circle k") || name.includes("family mart"))
        return "편의점";
      return "상점";
    }
    case "rest": {
      if (name.includes("resort") || name.includes("리조트"))
        return "리조트";
      if (name.includes("hotel") || name.includes("khách sạn") || name.includes("호텔"))
        return "호텔";
      if (name.includes("hostel") || name.includes("homestay") || name.includes("nhà nghỉ"))
        return "호스텔/홈스테이";
      if (name.includes("villa") || name.includes("biệt thự") || name.includes("빌라"))
        return "풀빌라";
      if (name.includes("spa") || name.includes("massage") || name.includes("스파") || name.includes("마사지"))
        return "스파/마사지";
      if (name.includes("nail") || name.includes("hair") || name.includes("beauty"))
        return "뷰티";
      return "숙소";
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 체류시간 추정 (분)
// ═══════════════════════════════════════════════════════════════════

function estimateDuration(category: SeedCategory, subCategory: string): number {
  const map: Record<string, number> = {
    // food
    "식당": 60, "카페": 45, "바/펍": 90, "베이커리": 30,
    "바베큐": 90, "해산물": 75, "베트남식": 45, "양식": 60,
    "일식": 60, "한식": 60,
    // spot
    "해변": 120, "사원/성당": 30, "박물관": 60, "공원/정원": 45,
    "폭포": 60, "섬": 180, "스노클링/다이빙": 180,
    "케이블카": 120, "테마파크": 240, "일몰 포인트": 60, "관광지": 60,
    // shopping
    "마켓/시장": 60, "야시장": 90, "진주/특산품": 30, "느억맘/특산품": 30,
    "후추/특산품": 30, "기념품": 30, "쇼핑몰": 90, "마트": 30, "편의점": 15, "상점": 30,
    // rest
    "리조트": 0, "호텔": 0, "호스텔/홈스테이": 0, "풀빌라": 0,
    "스파/마사지": 90, "뷰티": 60, "숙소": 0,
  };
  return map[subCategory] ?? (category === "food" ? 60 : category === "spot" ? 60 : 30);
}

// ═══════════════════════════════════════════════════════════════════
// 가격 추정 (VND)
// ═══════════════════════════════════════════════════════════════════

function estimatePrice(place: MergedSeedPlace): { amount: number; currency: string } | undefined {
  if (place.priceLevel === undefined) return undefined;

  // Google priceLevel 0~4 → VND 추정
  const priceMap: Record<number, number> = {
    0: 50000,    // 무료~저가
    1: 150000,   // 저렴 (~7,500원)
    2: 350000,   // 보통 (~17,500원)
    3: 700000,   // 비쌈 (~35,000원)
    4: 1500000,  // 매우 비쌈 (~75,000원)
  };

  return {
    amount: priceMap[place.priceLevel] ?? 200000,
    currency: "VND",
  };
}

// ═══════════════════════════════════════════════════════════════════
// Evidence 생성
// ═══════════════════════════════════════════════════════════════════

function buildEvidence(
  place: MergedSeedPlace,
  verifiedAt: string,
): RefinedPlace["evidence"] {
  const reasons: string[] = [];
  const sources: RefinedPlace["evidence"]["sources"] = [];
  const warnings: string[] = [];

  // Google 평점 기반 reason
  if (place.rating && place.userRatingsTotal) {
    if (place.rating >= 4.5 && place.userRatingsTotal >= 100) {
      reasons.push(`Google 평점 ${place.rating}점 (${place.userRatingsTotal.toLocaleString()}건 리뷰) — 최상위`);
    } else if (place.rating >= 4.0) {
      reasons.push(`Google 평점 ${place.rating}점 (${place.userRatingsTotal.toLocaleString()}건 리뷰)`);
    } else {
      reasons.push(`Google 리뷰 ${place.userRatingsTotal.toLocaleString()}건 등록`);
    }

    sources.push({
      platform: "google",
      reviewCount: place.userRatingsTotal,
      positiveRate: place.rating ? Math.round((place.rating / 5) * 100) : undefined,
      url: `https://maps.google.com/?q=${encodeURIComponent(place.name)}`,
      lastVerified: verifiedAt,
    });
  }

  // Naver evidence (있는 경우)
  if (place.naverEvidence && place.naverEvidence.blogTotal > 0) {
    for (const reason of place.naverEvidence.topReasons) {
      reasons.push(reason);
    }
    sources.push({
      platform: "naver",
      reviewCount: place.naverEvidence.blogTotal,
      positiveRate: place.naverEvidence.positiveRate,
      lastVerified: verifiedAt,
    });
  }

  // 카테고리 기반 추가 reason
  if (place.photos.length >= 3) {
    reasons.push("사진이 풍부한 장소");
  }

  // 경고 생성
  if (place.rating && place.rating < 3.5) {
    warnings.push(`평점 ${place.rating}점 — 방문 전 최근 리뷰 확인 권장`);
  }
  if (place.businessStatus === "CLOSED_TEMPORARILY") {
    warnings.push("일시 휴업 중 — 방문 전 확인 필요");
  }

  // 최소 1개 reason 보장
  if (reasons.length === 0) {
    reasons.push(`${place.name} — Google Maps 등록 장소`);
  }

  return {
    reasons,
    sources,
    verifiedAt,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ID 생성
// ═══════════════════════════════════════════════════════════════════

function generateId(city: string, category: SeedCategory, name: string, index: number): string {
  const CITY_PREFIX: Record<string, string> = {
    "phu-quoc": "pq", "da-nang": "dn", "ho-chi-minh": "hcm",
    "hanoi": "han", "nha-trang": "nha", "da-lat": "dl",
  };
  const prefix = CITY_PREFIX[city] ?? city.slice(0, 2);
  const catShort = { food: "food", spot: "spot", shopping: "shop", rest: "rest" }[category];
  // 간단한 slug 생성
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 30);
  return `${prefix}-${catShort}-${slug || index}`;
}

// ═══════════════════════════════════════════════════════════════════
// 유틸
// ═══════════════════════════════════════════════════════════════════

function countBy<T>(arr: T[], key: keyof T): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of arr) {
    const val = String(item[key]);
    result[val] = (result[val] ?? 0) + 1;
  }
  return result;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

main().catch((err) => {
  console.error("치명적 에러:", err);
  process.exit(1);
});
