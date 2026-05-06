/**
 * 장소 탐색 데모 시드 — 베트남 6개 도시 + 치앙마이.
 *
 * 푸꾸옥: 파이프라인 자동 생성 608곳 (Phase A~B, 2026-05-06)
 * 다낭: 파이프라인 자동 생성 884곳 (Phase A~B, 2026-05-06)
 * 나머지: 수동 큐레이션 (기존 유지)
 */

import type { DiscoverPlace } from "@/lib/types";
import { phuQuocDiscoverPlaces } from "./places/phu-quoc-discover";
import { daNangDiscoverPlaces } from "./places/da-nang-discover";

export const DEMO_DISCOVER_PLACES: DiscoverPlace[] = [
  // ── 푸꾸옥 (608곳 — 파이프라인 자동 생성) ──
  ...phuQuocDiscoverPlaces,

  // ── 다낭 (884곳 — 파이프라인 자동 생성) ──
  ...daNangDiscoverPlaces,

  // ── 하노이 ──────────────────────────────────────────────────
  {
    id: "discover-hn-halong",
    name: "하롱베이 데이투어",
    category: "spot",
    rating: 4.4,
    reviewCount: 5200,
    distance: "차량 3시간",
    badge: "popular",
    destination: "하노이",
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
  },
  {
    id: "discover-hn-puppet",
    name: "탕롱 수상인형극",
    category: "spot",
    rating: 4.2,
    reviewCount: 1670,
    distance: "도보 15분",
    destination: "하노이",
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
  },

  // ── 호치민 ──────────────────────────────────────────────────
  {
    id: "discover-hcm-mekong",
    name: "메콩델타 미토 투어",
    category: "spot",
    rating: 4.3,
    reviewCount: 4100,
    distance: "차량 2시간",
    badge: "popular",
    destination: "호치민",
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
  },
  {
    id: "discover-hcm-palace",
    name: "통일궁 + 전쟁박물관",
    category: "spot",
    rating: 4.4,
    reviewCount: 6700,
    distance: "도보 20분",
    destination: "호치민",
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
