/**
 * TRAVELDIARY 데이터 모델
 *
 * 핵심 통찰: 일정은 "리스트"가 아니라 "그래프"여야 한다.
 * Live Replan을 위해 처음부터 변경 가능한 구조로 설계.
 */

// ═══════════════════════════════════════════════════════════
// USER & TRIP
// ═══════════════════════════════════════════════════════════

export type CompanionType = "solo" | "friends" | "family" | "group";
export type PaceType = "relaxed" | "balanced" | "packed";
export type TripStatus = "draft" | "confirmed" | "in-progress" | "completed";
export type TravelMode = "pre-travel" | "in-travel" | "post-travel";

export interface UserPreferences {
  vibes: string[];          // ["맛집 위주", "사진 명소", ...]
  pace: PaceType;
  excludes: string[];       // ["새우 알레르기", "매운 거 못 먹음", ...]
}

export interface Trip {
  id: string;
  destination: string;        // "푸꾸옥"
  destinationCode: string;    // "PQC" — Phase 0 푸꾸옥, Phase 1 도쿄·오사카·교토 확장
  startDate: string;          // ISO date
  nights: number;
  companion: CompanionType;
  preferences: UserPreferences;
  createdAt: string;
  status: TripStatus;
  currentMode?: TravelMode;
  updatedAt?: string;         // ISO datetime — 낙관적 동시성 (사이클 5b-2)
}

// ═══════════════════════════════════════════════════════════
// ITINERARY ITEM — DAG 노드
// ═══════════════════════════════════════════════════════════

export type ItemCategory = "food" | "spot" | "shopping" | "rest";
export type ItemFlexibility = "fixed" | "flexible" | "booked";

export interface ItineraryItem {
  id: string;
  tripId: string;
  dayIndex: number;           // 0-based (Day 1 = 0)

  /** 시간 윈도우 — Live Replan에서 핵심 */
  scheduledAt: string;        // ISO datetime
  durationMinutes: number;

  /**
   * fixed   : 고정 (예약·교통편 등 절대 못 바꿈)
   * flexible: 유연 (Replan에서 시간 조정 가능)
   * booked  : 예약 완료된 유연 (시간 조정 시 취소 필요)
   */
  flexibility: ItemFlexibility;

  /** Live Replan 시 이 노드를 얼마나 보호할지. 5 = 절대 빼지 마 */
  priority: 1 | 2 | 3 | 4 | 5;

  /** ±N분 이동 가능 */
  flexMinutes: number;

  // 콘텐츠
  name: string;
  category: ItemCategory;
  location: {
    lat: number;
    lng: number;
    address: string;
  };

  // 가격·예약
  estimatedPrice?: { amount: number; currency: string };
  bookingStatus?: {
    provider: string;          // "Klook", "공식"
    bookingId: string;
    refundable: boolean;
  };

  // 추천 근거 — 우리의 정체성
  evidence: Evidence;

  // 그래프 구조
  dependencies: string[];      // 선행 노드 ID들
}

// ═══════════════════════════════════════════════════════════
// EVIDENCE — "왜 이걸 골랐나" 패널 데이터
// ═══════════════════════════════════════════════════════════

export type EvidencePlatform = "naver" | "google" | "kakao" | "ota" | "instagram" | "user_review";

export interface EvidenceSource {
  platform: EvidencePlatform;
  url?: string;
  reviewCount?: number;       // "후기 387건"
  positiveRate?: number;      // 0~100 (퍼센트)
  lastVerified?: string;      // ISO date
}

export interface Evidence {
  reasons: string[];           // ["네이버 후기 387건 중 92% 긍정", ...]
  sources: EvidenceSource[];   // 출처 — 검증 가능성
  verifiedAt: string;          // 마지막 검증 시각
  warnings?: string[];         // ["웨이팅 30분 예상", ...]
}

// ═══════════════════════════════════════════════════════════
// VALIDATION — 환각 차단 5단계 결과
// ═══════════════════════════════════════════════════════════

export interface ValidationResult {
  itemId: string;
  checks: {
    placeExists: boolean;
    operatingStatus: "open" | "closed" | "temporary" | "unknown";
    bookingRequired: boolean;
    distanceVerified: boolean;
    priceVerified: boolean;
  };
  validatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// LIVE REPLAN
// ═══════════════════════════════════════════════════════════

export interface ReplanContext {
  tripId: string;
  triggerType: "delay" | "weather" | "wait_time" | "manual";
  currentTime: string;
  currentLocation?: { lat: number; lng: number };
  affectedItemId: string;
  delayMinutes?: number;
}

export interface ReplanOption {
  id: string;
  label: "추천" | "안전" | "강행";
  title: string;
  description: string;
  impacts: ReplanImpact[];
}

export interface ReplanImpact {
  key: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}

// ═══════════════════════════════════════════════════════════
// COLLABORATION
// ═══════════════════════════════════════════════════════════

export interface TripMember {
  userId: string;
  tripId: string;
  role: "owner" | "editor" | "viewer";
  joinedAt: string;
}

export interface Vote {
  id: string;
  tripId: string;
  itemId: string;
  options: { label: string; voters: string[] }[];
  decidedAt?: string;
}
