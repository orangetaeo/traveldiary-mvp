/**
 * 장소 탐색 데모 시드 — 베트남 6개 도시 + 치앙마이.
 *
 * 푸꾸옥: 파이프라인 자동 생성 608곳 (Phase A~B, 2026-05-06)
 * 다낭: 파이프라인 자동 생성 884곳 (Phase A~B, 2026-05-06)
 * 나머지: 수동 큐레이션 (기존 유지)
 *
 * Enrichment (디자인 갭 #1 U2): `mergeDiscoverEnrichment` 매핑으로 풍부 정보(한국 후기 인용,
 * AI 이유, 가격대, 한식 OK) 머지. 자동 생성 파일은 수동 편집 금지 → 별도 lookup 패턴.
 */

import type { DiscoverPlace } from "@/lib/types";
import { phuQuocDiscoverPlaces } from "./places/phu-quoc-discover";
import { daNangDiscoverPlaces } from "./places/da-nang-discover";
import { mergeDiscoverEnrichment } from "./places/phu-quoc-discover-enrichment";
import { mergeDanangEnrichment } from "./places/da-nang-discover-enrichment";

export const DEMO_DISCOVER_PLACES: DiscoverPlace[] = [
  // ── 푸꾸옥 (608곳 — 파이프라인 자동 생성 + enrichment 머지) ──
  ...phuQuocDiscoverPlaces.map(mergeDiscoverEnrichment),

  // ── 다낭 (884곳 — 파이프라인 자동 생성 + 디자인 갭 #1 U2 enrichment 머지) ──
  ...daNangDiscoverPlaces.map(mergeDanangEnrichment),

  // ── 하노이 (수동 큐레이션 + 디자인 갭 #1 U2 enrichment 직접 추가) ──
  {
    id: "discover-hn-halong",
    name: "하롱베이 데이투어",
    category: "spot",
    rating: 4.4,
    reviewCount: 5200,
    distance: "차량 3시간",
    badge: "popular",
    destination: "하노이",
    priceLevel: 3,
    koreanReviewQuote: {
      text: "꼭 1박 2일 추천 — 일출이 정말 멋져요",
      author: "윤소희",
    },
    koreanReviewCount: 412,
    aiReason: "베트남 1순위 자연유산 + 한국인 평점 4.5",
  },
  {
    id: "discover-hn-ninhbinh",
    name: "닌빈 짱안 보트투어",
    category: "spot",
    rating: 4.4,
    reviewCount: 2800,
    distance: "차량 2시간",
    badge: "ai",
    destination: "하노이",
    priceLevel: 2,
    koreanReviewQuote: {
      text: "수영장 같은 강에서 노 젓는 보트가 인상적",
      author: "오현주",
    },
    koreanReviewCount: 187,
    aiReason: "한국인 가성비 평점 4.6",
  },
  {
    id: "discover-hn-puppet",
    name: "탕롱 수상인형극",
    category: "spot",
    rating: 4.2,
    reviewCount: 1670,
    distance: "도보 15분",
    destination: "하노이",
    priceLevel: 1,
    koreanReviewQuote: {
      text: "1시간 분량 한국어 자막 안내가 친절",
      author: "강민호",
    },
    koreanReviewCount: 92,
    aiReason: "베트남 전통 공연 입문 추천",
  },
  {
    id: "discover-hn-oldquarter",
    name: "올드쿼터 야시장",
    category: "shopping",
    rating: 4.3,
    reviewCount: 3400,
    distance: "도보 5분",
    badge: "ai",
    destination: "하노이",
    priceLevel: 1,
    koreanReviewQuote: {
      text: "기념품 흥정 재미있어요",
      author: "김재훈",
    },
    koreanReviewCount: 256,
    aiReason: "주말 저녁 한국인 방문률 1위",
  },
  {
    id: "discover-hn-pho",
    name: "퍼 10 Lý Quốc Sư",
    category: "food",
    rating: 4.6,
    reviewCount: 890,
    distance: "도보 10분",
    badge: "popular",
    destination: "하노이",
    priceLevel: 1,
    koreanReviewQuote: {
      text: "현지인이 줄 서서 먹는 진짜 쌀국수",
      author: "이수진",
    },
    koreanReviewCount: 134,
    aiReason: "현지인 줄 서는 곳 + 한식 입맛 호환",
    koreanFoodFriendly: true,
  },

  // ── 호치민 (수동 큐레이션 + 디자인 갭 #1 U2 enrichment 직접 추가) ──
  {
    id: "discover-hcm-mekong",
    name: "메콩델타 미토 투어",
    category: "spot",
    rating: 4.3,
    reviewCount: 4100,
    distance: "차량 2시간",
    badge: "popular",
    destination: "호치민",
    priceLevel: 2,
    koreanReviewQuote: {
      text: "코코넛 농장 + 보트 코스 알찬 하루",
      author: "조하나",
    },
    koreanReviewCount: 287,
    aiReason: "한국인 단체 + 가족 추천",
  },
  {
    id: "discover-hcm-cruise",
    name: "사이공 강 디너크루즈",
    category: "food",
    rating: 4.3,
    reviewCount: 1250,
    distance: "차량 15분",
    badge: "ai",
    destination: "호치민",
    priceLevel: 3,
    koreanReviewQuote: {
      text: "야경 보면서 식사 — 신혼여행에 딱",
      author: "김도현",
    },
    koreanReviewCount: 98,
    aiReason: "야경 + 한국인 신혼 추천",
  },
  {
    id: "discover-hcm-palace",
    name: "통일궁 + 전쟁박물관",
    category: "spot",
    rating: 4.4,
    reviewCount: 6700,
    distance: "도보 20분",
    destination: "호치민",
    priceLevel: 1,
    koreanReviewQuote: {
      text: "베트남 현대사 이해에 도움돼요",
      author: "박서영",
    },
    koreanReviewCount: 215,
    aiReason: "역사 관심 한국인 평점 4.5",
  },
  {
    id: "discover-hcm-benthanh",
    name: "벤탄 야시장",
    category: "shopping",
    rating: 4.1,
    reviewCount: 3200,
    distance: "도보 10분",
    badge: "popular",
    destination: "호치민",
    priceLevel: 1,
    koreanReviewQuote: {
      text: "기념품과 길거리 음식 모두 즐기기 좋아요",
      author: "최민서",
    },
    koreanReviewCount: 178,
    aiReason: "흥정 + 야식 한국인 인기",
  },

  // ── 나트랑 ──────────────────────────────────────────────────
  {
    id: "discover-nt-vinwonders",
    name: "빈원더스 + 해상 케이블카",
    category: "spot",
    rating: 4.5,
    reviewCount: 2900,
    distance: "차량 20분",
    badge: "popular",
    destination: "나트랑",
  },
  {
    id: "discover-nt-island",
    name: "혼문 4섬 스노클링",
    category: "spot",
    rating: 4.3,
    reviewCount: 1800,
    distance: "보트 30분",
    badge: "ai",
    destination: "나트랑",
  },
  {
    id: "discover-nt-ponagar",
    name: "포나가르 참 타워",
    category: "spot",
    rating: 4.3,
    reviewCount: 1200,
    distance: "차량 10분",
    destination: "나트랑",
  },
  {
    id: "discover-nt-seafood",
    name: "나트랑 해산물 거리",
    category: "food",
    rating: 4.4,
    reviewCount: 650,
    distance: "도보 15분",
    badge: "ai",
    destination: "나트랑",
  },

  // ── 달랏 ──────────────────────────────────────────────────
  {
    id: "discover-dl-langbiang",
    name: "랑비앙 일출 지프투어",
    category: "nature",
    rating: 4.5,
    reviewCount: 1100,
    distance: "차량 30분",
    badge: "ai",
    destination: "달랏",
  },
  {
    id: "discover-dl-datanla",
    name: "다탄라 폭포 코스터",
    category: "spot",
    rating: 4.4,
    reviewCount: 980,
    distance: "차량 15분",
    badge: "popular",
    destination: "달랏",
  },
  {
    id: "discover-dl-crazy",
    name: "크레이지 하우스",
    category: "spot",
    rating: 4.2,
    reviewCount: 760,
    distance: "도보 20분",
    destination: "달랏",
  },
  {
    id: "discover-dl-nightmarket",
    name: "달랏 야시장",
    category: "food",
    rating: 4.3,
    reviewCount: 520,
    distance: "도보 10분",
    badge: "popular",
    destination: "달랏",
  },

  // ── 치앙마이 ──────────────────────────────────────────────────
  {
    id: "discover-cm-doisuthep",
    name: "도이수텝 사찰",
    category: "spot",
    rating: 4.7,
    reviewCount: 4500,
    distance: "차량 30분",
    badge: "popular",
    destination: "치앙마이",
  },
  {
    id: "discover-cm-elephant",
    name: "엘리펀트 자연보호소",
    category: "nature",
    rating: 4.8,
    reviewCount: 2100,
    distance: "차량 1시간",
    badge: "ai",
    destination: "치앙마이",
  },
  {
    id: "discover-cm-sunday",
    name: "일요 야시장",
    category: "shopping",
    rating: 4.5,
    reviewCount: 1800,
    distance: "도보 10분",
    badge: "popular",
    destination: "치앙마이",
  },
  {
    id: "discover-cm-khaosoi",
    name: "카오소이 맛집 거리",
    category: "food",
    rating: 4.4,
    reviewCount: 670,
    distance: "도보 15분",
    badge: "ai",
    destination: "치앙마이",
  },
];
