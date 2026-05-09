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
  | "견과류"
  | "대두"
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
  갑각류:  ["새우", "게", "랍스터", "바닷가재", "tôm", "cua", "lobster", "ghẹ", "hùm", "crustacean"],
  조개:    ["조개", "모시조개", "굴", "홍합", "nghêu", "sò", "hàu", "vẹm", "clam", "oyster", "mussel"],
  오징어:  ["오징어", "낙지", "문어", "mực", "bạch tuộc", "squid", "octopus"],
  땅콩:    ["땅콩", "đậu phộng", "lạc", "peanut"],
  견과류:  ["견과류", "견과", "호두", "아몬드", "캐슈넛", "hạt điều", "nut", "walnut", "almond", "cashew"],
  대두:    ["대두", "콩", "간장", "된장", "두부", "đậu nành", "nước tương", "đậu hũ", "soy", "soybean", "tofu"],
  우유:    ["우유", "치즈", "버터", "sữa", "phô mai", "bơ", "milk", "cheese", "butter"],
  계란:    ["계란", "달걀", "trứng", "egg"],
  돼지고기: ["돼지", "돈까스", "삼겹살", "thịt heo", "thịt lợn", "pork", "heo"],
  소고기:  ["소고기", "쇠고기", "thịt bò", "bò", "beef"],
  닭고기:  ["닭고기", "치킨", "thịt gà", "gà", "chicken"],
  비건:    ["고기", "생선", "계란", "우유", "치즈", "thịt", "cá", "trứng", "sữa", "meat", "fish"],
  베지테리언: ["고기", "생선", "thịt", "cá", "meat", "fish"],
  글루텐:  ["밀가루", "면", "빵", "bột mì", "bánh mì", "wheat", "flour", "gluten"],
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
  "견과류 알레르기": "견과류",
  "대두 알레르기": "대두",
  "우유 알레르기": "우유",
  "계란 알레르기": "계란",
  "돼지고기 안 먹음": "돼지고기",
  "소고기 안 먹음": "소고기",
  "닭고기 안 먹음": "닭고기",
  비건: "비건",
  베지테리언: "베지테리언",
  "글루텐 프리": "글루텐",
};

// ═══════════════════════════════════════════════════════════════════
// API 알레르기 코드 → AllergenCategory 매핑
// Claude API가 반환하는 영어 코드를 한국어 카테고리로 변환.
// ═══════════════════════════════════════════════════════════════════

const API_CODE_MAP: Record<string, AllergenCategory> = {
  shrimp: "새우",
  prawn: "새우",
  crustacean: "갑각류",
  lobster: "갑각류",
  crab: "갑각류",
  clam: "조개",
  oyster: "조개",
  mussel: "조개",
  shellfish: "조개",
  squid: "오징어",
  octopus: "오징어",
  peanut: "땅콩",
  nut: "견과류",
  tree_nut: "견과류",
  soy: "대두",
  soybean: "대두",
  milk: "우유",
  dairy: "우유",
  egg: "계란",
  pork: "돼지고기",
  beef: "소고기",
  chicken: "닭고기",
  gluten: "글루텐",
  wheat: "글루텐",
};

/**
 * Claude API 영어 알레르기 코드 → AllergenCategory 변환.
 * 매칭 실패 시 null (알 수 없는 코드는 안전하게 무시).
 */
export function mapApiAllergenCode(code: string): AllergenCategory | null {
  return API_CODE_MAP[code.toLowerCase().trim()] ?? null;
}

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

/**
 * AllergenFilterChips 컴포넌트가 받는 chip 항목 형태.
 * lib에 도메인 타입 정의 (components → lib import는 정상, 역방향 지양).
 *
 * - severity: "danger" = 알레르기·식이 제한 (빨강 시각), "neutral" = 관심사
 * - icon: Material Symbols Outlined 아이콘 이름 (block / hot_tub / eco / egg / opacity)
 */
export interface AllergenChipItem {
  raw: string;
  label: string;
  severity?: "danger" | "neutral";
  icon?: string;
}

export const ALLERGEN_CHIPS: AllergenChipItem[] = [
  { label: "새우 알레르기", raw: "새우 알레르기", severity: "danger", icon: "block" },
  { label: "갑각류 알레르기", raw: "갑각류 알레르기", severity: "danger", icon: "block" },
  { label: "조개 알레르기", raw: "조개 알레르기", severity: "danger", icon: "block" },
  { label: "땅콩 알레르기", raw: "땅콩 알레르기", severity: "danger", icon: "block" },
  { label: "견과류 알레르기", raw: "견과류 알레르기", severity: "danger", icon: "block" },
  { label: "대두 알레르기", raw: "대두 알레르기", severity: "danger", icon: "block" },
  { label: "우유 알레르기", raw: "우유 알레르기", severity: "danger", icon: "opacity" },
  { label: "돼지고기", raw: "돼지고기 안 먹음", severity: "danger", icon: "block" },
  { label: "비건", raw: "비건", severity: "danger", icon: "eco" },
];
