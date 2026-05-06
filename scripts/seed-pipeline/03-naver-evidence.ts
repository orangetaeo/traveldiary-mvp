/**
 * Phase A-3: Naver Blog Evidence.
 *
 * 수집된 장소 목록에 대해 네이버 블로그 검색으로 한국인 후기를 수집한다.
 * 긍정률 휴리스틱 + 후기 수로 Evidence 데이터를 생성.
 *
 * 사용법:
 *   NAVER_CLIENT_ID=xxx NAVER_CLIENT_SECRET=yyy npx tsx scripts/seed-pipeline/03-naver-evidence.ts [city]
 *
 * 입력: data/seeds/{city}-details.json
 * 출력: data/seeds/{city}-naver-evidence.json
 */

import { CITY_CONFIGS } from "./config";
import type { CityKey } from "./config";
import type { NaverEvidence } from "./types";
import { getRequiredEnv, sleep, log, logError, writeJson, readJson, progressBar } from "./utils";

interface PlaceInput {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
}

const BLOG_URL = "https://openapi.naver.com/v1/search/blog.json";

// 검색 쿼리 생성 전략: "도시명 + 장소명"
const CITY_NAMES: Record<string, string> = {
  "phu-quoc": "푸꾸옥",
  "da-nang": "다낭",
};

// 긍정/부정 키워드 (기존 naver-search.ts와 동일)
const POSITIVE_KEYWORDS = [
  "추천", "맛있", "최고", "강추", "감동", "분위기", "인생", "JMT",
  "재방문", "행복", "예쁘", "친절", "꼭", "선물", "좋았", "만족",
  "대박", "꿀맛", "존맛", "굿",
];
const NEGATIVE_KEYWORDS = [
  "별로", "최악", "후회", "비싸", "맛없", "실망", "더럽", "불친절",
  "다신 안", "다시는", "비추", "노맛", "짜증",
];

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

  const clientId = getRequiredEnv("NAVER_CLIENT_ID");
  const clientSecret = getRequiredEnv("NAVER_CLIENT_SECRET");
  const cityNameKo = CITY_NAMES[cityArg] ?? config.name;

  const inputFile = `${cityArg}-details.json`;
  const outputFile = `${cityArg}-naver-evidence.json`;

  // 입력 로드
  const places = readJson<PlaceInput[]>(inputFile);
  if (!places || places.length === 0) {
    console.error(`입력 파일 없음: data/seeds/${inputFile}. 먼저 02-google-details를 실행하세요.`);
    process.exit(1);
  }

  log("03-naver", `시작: ${config.name} — ${places.length}곳 네이버 후기 수집`);

  // 기존 결과 로드 (중단 복구)
  const existing = readJson<NaverEvidence[]>(outputFile);
  const completed = new Set<string>();
  const results: NaverEvidence[] = [];
  if (existing) {
    for (const ev of existing) {
      completed.add(ev.placeId);
      results.push(ev);
    }
    log("03-naver", `기존 ${completed.size}곳 로드 (중단 복구)`);
  }

  const pending = places.filter((p) => !completed.has(p.placeId));
  log("03-naver", `남은 ${pending.length}곳 처리 시작`);

  let apiCalls = 0;
  const errors: string[] = [];

  for (let i = 0; i < pending.length; i++) {
    const place = pending[i];
    const query = buildSearchQuery(place.name, cityNameKo);

    try {
      const params = new URLSearchParams({
        query,
        display: "30", // 최대 30건으로 정확도 향상
        sort: "sim",
      });

      const resp = await fetch(`${BLOG_URL}?${params.toString()}`, {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      });

      apiCalls++;

      if (!resp.ok) {
        if (resp.status === 429) {
          // Rate limit — 1초 대기 후 재시도
          log("03-naver", `⏳ Rate limit — 1초 대기 (${place.name})`);
          await sleep(1000);
          i--; // 재시도
          continue;
        }
        errors.push(`HTTP ${resp.status} — ${place.name}`);
        continue;
      }

      const json = await resp.json() as {
        total?: number;
        items?: Array<{
          title?: string;
          link?: string;
          description?: string;
          postdate?: string;
        }>;
      };

      const items = json.items ?? [];
      const total = json.total ?? items.length;

      // 긍정률 계산
      let positive = 0;
      let negative = 0;
      for (const item of items) {
        const text = `${stripHtml(item.title ?? "")} ${stripHtml(item.description ?? "")}`;
        for (const k of POSITIVE_KEYWORDS) if (text.includes(k)) positive++;
        for (const k of NEGATIVE_KEYWORDS) if (text.includes(k)) negative++;
      }
      const positiveRate =
        positive + negative === 0
          ? 80 // 기본값 (한국 블로그는 대체로 긍정적)
          : Math.round((positive / (positive + negative)) * 100);

      // 상위 이유 추출 (빈도 기반)
      const topReasons = extractTopReasons(items, place.name, total, positiveRate);

      const evidence: NaverEvidence = {
        placeId: place.placeId,
        placeName: place.name,
        blogTotal: total,
        positiveRate,
        topReasons,
        blogSnippets: items.slice(0, 5).map((item) => ({
          title: stripHtml(item.title ?? ""),
          link: item.link ?? "",
          date: item.postdate ?? "",
        })),
      };

      results.push(evidence);

      // 100건마다 중간 저장
      if ((i + 1) % 100 === 0) {
        writeJson(outputFile, results);
        log("03-naver", progressBar(i + 1 + completed.size, places.length));
      }

      // Naver API rate limit (일 25000건 무료, 초당 10건 제한)
      await sleep(120);
    } catch (err) {
      const errMsg = `Network: ${err instanceof Error ? err.message : "unknown"} — ${place.name}`;
      logError("03-naver", errMsg);
      errors.push(errMsg);
    }
  }

  // 최종 저장
  writeJson(outputFile, results);

  // 통계
  const withEvidence = results.filter((r) => r.blogTotal > 0);
  const avgPositive = withEvidence.length > 0
    ? Math.round(withEvidence.reduce((s, r) => s + r.positiveRate, 0) / withEvidence.length)
    : 0;

  log("03-naver", `\n═══ 완료 ═══`);
  log("03-naver", `총 처리: ${results.length}곳`);
  log("03-naver", `후기 있음: ${withEvidence.length}곳 (${Math.round((withEvidence.length / results.length) * 100)}%)`);
  log("03-naver", `평균 긍정률: ${avgPositive}%`);
  log("03-naver", `API 호출: ${apiCalls}회`);
  if (errors.length > 0) {
    log("03-naver", `에러: ${errors.length}건`);
    errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }
}

// ═══════════════════════════════════════════════════════════════════
// 헬퍼
// ═══════════════════════════════════════════════════════════════════

function buildSearchQuery(placeName: string, cityName: string): string {
  // 베트남어 특수문자 제거 후 검색어 조합
  const cleaned = placeName
    .replace(/[()（）]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${cityName} ${cleaned}`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

function extractTopReasons(
  items: Array<{ title?: string; description?: string }>,
  placeName: string,
  totalBlogs: number,
  positiveRate: number,
): string[] {
  const reasons: string[] = [];

  if (totalBlogs > 0) {
    reasons.push(`네이버 블로그 후기 ${totalBlogs}건 중 ${positiveRate}% 긍정`);
  }

  // 자주 언급되는 키워드 추출
  const keywordFreq = new Map<string, number>();
  const interestKeywords = [
    "뷰", "분위기", "가성비", "친절", "깨끗", "맛있", "신선",
    "포토존", "일몰", "석양", "스노클링", "해산물", "야경",
    "프라이빗", "조용", "힐링", "인스타", "로컬",
  ];

  for (const item of items) {
    const text = `${stripHtml(item.title ?? "")} ${stripHtml(item.description ?? "")}`;
    for (const kw of interestKeywords) {
      if (text.includes(kw)) {
        keywordFreq.set(kw, (keywordFreq.get(kw) ?? 0) + 1);
      }
    }
  }

  // 상위 3개 키워드를 reason으로
  const sorted = [...keywordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  for (const [kw, count] of sorted) {
    const pct = Math.round((count / items.length) * 100);
    if (pct >= 20) {
      reasons.push(`한국인 후기 ${pct}%에서 "${kw}" 언급`);
    }
  }

  if (reasons.length === 0) {
    reasons.push(`${placeName} — 네이버 블로그 검색 결과 존재`);
  }

  return reasons;
}

main().catch((err) => {
  console.error("치명적 에러:", err);
  process.exit(1);
});
