/**
 * 푸꾸옥 즈엉동 야시장 시푸드 식당 — 정적 메뉴 시드 (ADR-015).
 *
 * 사이클 4 카메라 번역의 시연 데이터.
 * 사이클 5에서 Google Vision OCR 결과 검증용 골든셋으로 재사용.
 */

import type { AllergenCategory } from "../allergens";

export interface MenuItem {
  id: string;
  /** 베트남어 원문 */
  original: string;
  /** 한국어 발음 (읽는 법) */
  phonetic: string;
  /** 한국어 번역 */
  translated: string;
  /** 문화적 맥락 — 한국인이 자주 시키는지·재료·먹는 법 */
  culturalNote?: string;
  /** 표시용 가격 */
  price: { vnd: number; krw: number };
  /** 한국인 인기도 — 인스타·블로그 사회적 증거 */
  koreanPopularity?: number; // 0~100
  /** 구체 재료 (알레르기 매칭에 사용) */
  ingredients: string[];
  /** 식약처 카테고리 */
  allergens: AllergenCategory[];
}

export const phuQuocMenu: MenuItem[] = [
  {
    id: "menu-tom-hum",
    original: "Tôm hùm nướng phô mai",
    phonetic: "똠 훔 느엉 포 마이",
    translated: "랍스터 치즈 구이",
    culturalNote: "푸꾸옥 야시장 대표 메뉴. 한국인 인스타 #푸꾸옥야시장 1위.",
    price: { vnd: 950000, krw: 52000 },
    koreanPopularity: 96,
    ingredients: ["랍스터", "치즈", "버터", "마늘"],
    allergens: ["갑각류", "우유"],
  },
  {
    id: "menu-cua-rang-me",
    original: "Cua rang me",
    phonetic: "꾸어 랑 메",
    translated: "게 타마린드 볶음",
    culturalNote: "타마린드 새콤달콤 소스. 베트남 남부 정통.",
    price: { vnd: 480000, krw: 26000 },
    koreanPopularity: 88,
    ingredients: ["게", "타마린드", "마늘", "땅콩"],
    allergens: ["갑각류", "땅콩"],
  },
  {
    id: "menu-muc-chien",
    original: "Mực chiên giòn",
    phonetic: "묵 찌엔 죠은",
    translated: "오징어 튀김",
    culturalNote: "맥주 안주로 한국인 선호.",
    price: { vnd: 220000, krw: 12000 },
    koreanPopularity: 82,
    ingredients: ["오징어", "밀가루", "계란"],
    allergens: ["오징어", "계란", "글루텐"],
  },
  {
    id: "menu-nghe-hap",
    original: "Nghêu hấp sả",
    phonetic: "응에우 헙 사",
    translated: "모시조개 레몬그라스 찜",
    culturalNote: "국물이 시원해 해장용으로도.",
    price: { vnd: 180000, krw: 10000 },
    koreanPopularity: 79,
    ingredients: ["모시조개", "레몬그라스", "마늘"],
    allergens: ["조개"],
  },
  {
    id: "menu-ca-loc-nuong",
    original: "Cá lóc nướng trui",
    phonetic: "까 럭 느엉 쭈이",
    translated: "가물치 짚불 구이",
    culturalNote: "라이스페이퍼에 싸서 먹음. 메콩 정통.",
    price: { vnd: 320000, krw: 17500 },
    koreanPopularity: 74,
    ingredients: ["가물치", "라이스페이퍼", "허브"],
    allergens: [],
  },
  {
    id: "menu-banh-xeo",
    original: "Bánh xèo Phú Quốc",
    phonetic: "반 쎄오 푸꾸옥",
    translated: "푸꾸옥식 베트남 부침개",
    culturalNote: "새우·돼지고기·숙주 — 강황 부침. 채소에 싸 먹음.",
    price: { vnd: 95000, krw: 5200 },
    koreanPopularity: 91,
    ingredients: ["쌀가루", "강황", "새우", "돼지고기", "숙주"],
    allergens: ["새우", "갑각류", "돼지고기"],
  },
  {
    id: "menu-pho-bo",
    original: "Phở bò tái",
    phonetic: "퍼 보 따이",
    translated: "쌀국수 (소고기 살짝 익힌 것)",
    culturalNote: "한국인이 가장 친숙한 메뉴. 호불호 적음.",
    price: { vnd: 75000, krw: 4100 },
    koreanPopularity: 95,
    ingredients: ["쌀국수", "소고기", "양파", "허브"],
    allergens: ["소고기"],
  },
  {
    id: "menu-bun-cha-ca",
    original: "Bún chả cá",
    phonetic: "분 짜 까",
    translated: "어묵 쌀국수",
    culturalNote: "남부식 어묵 — 매콤한 국물.",
    price: { vnd: 65000, krw: 3500 },
    koreanPopularity: 71,
    ingredients: ["쌀국수", "어묵", "생선"],
    allergens: [],
  },
  {
    id: "menu-cha-gio",
    original: "Chả giò hải sản",
    phonetic: "짜 죠 하이 산",
    translated: "해산물 스프링롤 (튀김)",
    culturalNote: "새우·게살 함께. 누옥맘 소스 찍어 먹음.",
    price: { vnd: 110000, krw: 6000 },
    koreanPopularity: 87,
    ingredients: ["라이스페이퍼", "새우", "게살", "당면", "계란"],
    allergens: ["새우", "갑각류", "계란"],
  },
  {
    id: "menu-ca-phe-sua-da",
    original: "Cà phê sữa đá",
    phonetic: "까 페 스아 다",
    translated: "베트남식 아이스 연유 커피",
    culturalNote: "디저트로도 좋음. 진하니 단맛 호불호.",
    price: { vnd: 35000, krw: 1900 },
    koreanPopularity: 98,
    ingredients: ["커피", "연유"],
    allergens: ["우유"],
  },
];

export const PHU_QUOC_MENU_VENUE = {
  name: "즈엉동 야시장 시푸드 (대표 메뉴 모음)",
  address: "Đ. Võ Thị Sáu, Dương Đông, Phú Quốc",
};
