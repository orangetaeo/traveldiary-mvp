/**
 * 알레르기·식이 매칭 — 순수 함수 (S-08).
 *
 * 사이클 4(ADR-015): 정적 메뉴 시드와 결합해 베트남어/한국어 키워드 매칭.
 * 사이클 5: 사용자 preferences DB 영속화 + 위험도 점수.
 *
 * 원칙 (S-08):
 *   - 키워드 매칭은 100% 확정만. 추론 금지.
 *   - 알레르기는 생명 직결 — "확실히 포함" 또는 "표시 안 함".
 */

export type AllergenCategory =
  | "새우"
  | "갑각류"
  | "조개"
  | "오징어"
  | "땅콩"
  | "우유"
  | "계란"
  | "돼지고기"
  | "소고기"
  | "닭고기"
  | "비건"
  | "베지테리언"
  | "글루텐";

export interface AllergenMatch {
  category: AllergenCategory;
  /** 텍스트에서 발견한 키워드 */
  keyword: string;
  /** "알레르기" 라벨 사용자엔 critical, "안 먹음"·식이는 preference */
  severity: "critical" | "preference";
}

// ═══════════════════════════════════════════════════════════════════
// 다국어 키워드 사전 (한국어 / 베트남어 / 영어)
// ═══════════════════════════════════════════════════════════════════

const KEYWORDS: Record<AllergenCategory, string[]> = {
  새우:    ["새우", "대하", "왕새우", "tôm", "shrimp", "prawn"],
  갑각류:  ["새우", "게", "랍스터", "바닷가재", "tôm", "cua", "lobster", "ghẹ", "hùm"],
  조개:    ["조개", "모시조개", "굴", "홍합", "nghêu", "sò", "hàu", "vẹm", "clam", "oyster", "mussel"],
  오징어:  ["오징어", "낙지", "문어", "mực", "bạch tuộc", "squid", "octopus"],
  땅콩:    ["땅콩", "đậu phộng", "lạc", "peanut"],
  우유:    ["우유", "치즈", "버터", "sữa", "phô mai", "bơ", "milk", "cheese", "butter"],
  계란:    ["계란", "달걀", "trứng", "egg"],
  돼지고기: ["돼지", "돈까스", "삼겹살", "thịt heo", "thịt lợn", "pork", "heo"],
  소고기:  ["소고기", "쇠고기", "thịt bò", "bò", "beef"],
  닭고기:  ["닭고기", "치킨", "thịt gà", "gà", "chicken"],
  비건:    ["고기", "생선", "계란", "우유", "치즈", "thịt", "cá", "trứng", "sữa", "meat", "fish"],
  베지테리언: ["고기", "생선", "thịt", "cá", "meat", "fish"],
  글루텐:  ["밀가루", "면", "빵", "bột mì", "bánh mì", "wheat", "flour"],
};

// ═══════════════════════════════════════════════════════════════════
// excludes 문자열 → 카테고리 정규화
// ═══════════════════════════════════════════════════════════════════

const ALIASES: Record<string, AllergenCategory> = {
  "새우 알레르기": "새우",
  "갑각류 알레르기": "갑각류",
  "조개 알레르기": "조개",
  "오징어 알레르기": "오징어",
  "땅콩 알레르기": "땅콩",
  "우유 알레르기": "우유",
  "계란 알레르기": "계란",
  "돼지고기 안 먹음": "돼지고기",
  "소고기 안 먹음": "소고기",
  "닭고기 안 먹음": "닭고기",
  비건: "비건",
  베지테리언: "베지테리언",
  "글루텐 프리": "글루텐",
};

export function normalizeExclude(input: string): AllergenCategory | null {
  const trimmed = input.trim();
  if (ALIASES[trimmed]) return ALIASES[trimmed];
  // 사전에 없으면 키워드 사전에 직접 일치하는지 검사
  if (trimmed in KEYWORDS) return trimmed as AllergenCategory;
  // 부분 일치 — "새우 알레르기" 등의 변종
  for (const [alias, cat] of Object.entries(ALIASES)) {
    if (trimmed.includes(alias) || alias.includes(trimmed)) return cat;
  }
  return null;
}

function getSeverity(rawExclude: string): "critical" | "preference" {
  if (rawExclude.includes("알레르기")) return "critical";
  return "preference";
}

// ═══════════════════════════════════════════════════════════════════
// 매칭
// ═══════════════════════════════════════════════════════════════════

export function matchAllergens(
  text: string,
  userExcludes: string[],
): AllergenMatch[] {
  const matches: AllergenMatch[] = [];
  const lower = text.toLowerCase();
  const seen = new Set<AllergenCategory>();

  for (const raw of userExcludes) {
    const cat = normalizeExclude(raw);
    if (!cat || seen.has(cat)) continue;

    const keywords = KEYWORDS[cat];
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        matches.push({
          category: cat,
          keyword,
          severity: getSeverity(raw),
        });
        seen.add(cat);
        break;
      }
    }
  }

  return matches;
}

export function buildWarning(matches: AllergenMatch[]): string | null {
  if (matches.length === 0) return null;
  const critical = matches.filter((m) => m.severity === "critical");
  if (critical.length > 0) {
    return `⚠️ ${critical.map((m) => m.category).join(", ")} 알레르기 위험`;
  }
  return `${matches.map((m) => m.category).join(", ")} 포함`;
}

// ═══════════════════════════════════════════════════════════════════
// 사용자 인터페이스용 선택지 (Translate 화면 칩)
// ═══════════════════════════════════════════════════════════════════

export const ALLERGEN_CHIPS: Array<{ label: string; raw: string }> = [
  { label: "새우 알레르기", raw: "새우 알레르기" },
  { label: "갑각류 알레르기", raw: "갑각류 알레르기" },
  { label: "조개 알레르기", raw: "조개 알레르기" },
  { label: "땅콩 알레르기", raw: "땅콩 알레르기" },
  { label: "우유 알레르기", raw: "우유 알레르기" },
  { label: "돼지고기", raw: "돼지고기 안 먹음" },
  { label: "비건", raw: "비건" },
];
