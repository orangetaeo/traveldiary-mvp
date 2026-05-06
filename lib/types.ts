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
  destinationCode: string;    // "PQC"/"SGN"/"HAN"/"DAD"/"NHA"/"DLI" — 베트남 6 도시 (M2 boundary 활성, ADR-043)
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

  // 사이클 7 (ADR-023) — 외부 이미지 URL 0~5장
  photos?: string[];

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

// ═══════════════════════════════════════════════════════════
// OTA OFFER (M8 — 사이클 12a, ADR-025)
// ═══════════════════════════════════════════════════════════

export type OtaProvider = "klook" | "kkday" | "agoda";

export interface OtaOffer {
  id: string;
  /** ItineraryItem 매칭 키 — `place.id` 또는 별도 태그 */
  matchTag: string;
  ota: OtaProvider;
  title: string;
  priceKrw: number;
  originalPriceKrw?: number;
  rating?: number;
  reviewCount?: number;
  /** OTA의 product/page URL (어필리에이트 wrapper 이전 base URL) */
  url: string;
}

// ═══════════════════════════════════════════════════════════
// SHARE LINK (M7 — 사이클 11a, ADR-024)
// ═══════════════════════════════════════════════════════════

export type SharePermission = "view" | "edit";

export interface ShareLink {
  id: string;
  tripId: string;
  syncKey: string;
  permission: SharePermission;
  expiresAt?: string;
  createdBy?: string;
  createdAt: string;
  revokedAt?: string;
}

export interface VoteOption {
  label: string;
  voters: string[];
}

export interface Vote {
  id: string;
  tripId: string;
  question: string;
  options: VoteOption[];
  status: "open" | "closed";
  decidedAt?: string;
  createdBy?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// M6 — CHECKLIST + COST (사이클 9, ADR-022)
// ═══════════════════════════════════════════════════════════

export type ChecklistCategory =
  | "documents"
  | "clothing"
  | "electronics"
  | "forbidden"
  | "declarable"
  | "custom";

export type DDayBucket = "D-30" | "D-14" | "D-7" | "D-1" | "during" | "after";

export interface ChecklistItem {
  id: string;
  tripId: string;
  category: ChecklistCategory;
  text: string;
  dDayBucket: DDayBucket;
  done: boolean;
  cityNote?: string;
  sortOrder: number;
  /** 사이클 TT (ADR-045) — 작성자 user.id. NULL = legacy/DEMO/미인증 */
  actorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Trip 생성 후 사용자가 "기본 템플릿 추가" 클릭 시 ChecklistItem으로 변환 */
export interface ChecklistTemplate {
  category: ChecklistCategory;
  text: string;
  dDayBucket: DDayBucket;
  cityNote?: string;
}

export type CostStatus = "paid" | "booked" | "planned";
export type CostCategory =
  | "food"
  | "transport"
  | "accommodation"
  | "shopping"
  | "activity"
  | "other";

export interface CostEntry {
  id: string;
  tripId: string;
  date: string;        // ISO date
  label: string;
  amountKrw: number;
  amountLocal?: { value: number; currency: string };
  status: CostStatus;
  category?: string;   // CostCategory 또는 자유 입력
  /**
   * 사이클 E1 (ADR-039) — splitWith[0] = 결제자 컨벤션.
   * v1: string[] (1/N 균등). v2: { name, weight? }[] (가중치).
   */
  splitWith?: Array<string | { name: string; weight?: number }>;
  /**
   * 사이클 UU (ADR-042) — 정산 완료 마커 (E1 v3 미니).
   * ISO datetime 또는 undefined. NOT NULL이면 정산 완료된 시점.
   * computeSettlement에서 제외됨.
   */
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// CITY (M5 — v2 비전 §4. 사이클 8 — 시드만, Prisma 영속화는 후속)
// ═══════════════════════════════════════════════════════════

export interface EmergencyContact {
  label: string;       // "한국 대사관 (호치민)"
  phone: string;       // "+84 28 3822 5757"
  hours?: string;      // "평일 08:30~17:00"
  notes?: string;      // "한국어 가능"
  category: "embassy" | "police" | "ambulance" | "fire" | "translator" | "card_lost";
  /** 사이클 Q (ADR-035 백로그) — 공식 사이트 URL (영사관·카드사 통합 콜센터 등) */
  url?: string;
}

export interface PaymentInfo {
  /** 사이클 H (ADR-032): currency/symbol/approxKrwRate는 country로 정규화 → optional. resolveCity()가 country.paymentDefaults에서 채움 */
  currency?: string;    // "VND"
  currencySymbol?: string; // "₫"
  /** 1 KRW 당 현지 통화 양 (대략) */
  approxKrwRate?: number;   // 1 KRW ≈ 18 VND
  cardAcceptance: "high" | "medium" | "low";
  cardNotes?: string;  // "관광지 외엔 현금 위주"
  atmAvailable: boolean;
  tipExpected: boolean;
  tipNotes?: string;
}

export interface TransportInfo {
  primary: "grab" | "metro" | "taxi" | "uber" | "walk";
  primaryNotes: string;     // "그랩이 압도적. 미터기 택시는 우회 위험"
  airportToCity?: { method: string; durationMin: number; priceKrw?: number };
  walkability: "high" | "medium" | "low";
}

export interface SituationalPhrase {
  situation: "greeting" | "menu" | "price" | "help" | "thanks" | "checkout" | "drink" | "slow" | "spicy" | "vegetarian";
  korean: string;       // "도와주세요"
  local: string;        // "Giúp tôi với" (베트남어)
  pronunciation?: string; // "지웁 또이 버이"
}

export interface CuratedGuide {
  id: string;
  title: string;       // "푸꾸옥 야시장 첫날 밤"
  subtitle?: string;   // "도착하자마자 가야 하는 5곳"
  hero?: { emoji?: string; gradient?: string };
  sections: { heading: string; body: string; tip?: string }[];
}

export interface City {
  code: string;                       // "PQC"
  slug: string;                       // "phu-quoc" (URL slug)
  name: string;                       // "푸꾸옥"
  country: string;                    // "베트남"
  countryCode: string;                // "VN"
  /** 사이클 8 MVP 필드 — 나머지는 후속 */
  emergencyContacts: EmergencyContact[];
  payment: PaymentInfo;
  transport: TransportInfo;
  /** 사이클 H (ADR-032): country로 정규화 → optional. resolveCity()가 country.defaultPhrases에서 채움 */
  phrases?: SituationalPhrase[];
  curatedGuides: CuratedGuide[];
  /** v2 §4 후속 필드. 사이클 H 이후 utilities/visa는 country로 fallback (시드에서 생략 가능) */
  utilities?: {
    voltage: string;           // "220V"
    plugType: string;          // "C/F/I"
    simAvailable: boolean;
  };
  visa?: {
    visaFreeDays?: number;     // 한국인 무비자
    eVisaRequired: boolean;
    notes?: string;
  };
  weather?: {
    season: string;
    avgTempC?: { min: number; max: number };
    notes?: string;
  };
}

/**
 * 사이클 H (ADR-032): resolveCity()가 반환하는 merge 결과.
 * country 정규화로 비워둔 city 필드가 country에서 채워진 상태.
 * 화면(/city/[slug]/page.tsx)은 항상 이 타입으로 받음 — narrowing 부담 없음.
 */
export interface ResolvedCity extends Omit<City, "payment" | "phrases"> {
  payment: PaymentInfo & {
    currency: string;
    currencySymbol: string;
    approxKrwRate: number;
  };
  phrases: SituationalPhrase[];
}

// ═══════════════════════════════════════════════════════════
// COUNTRY (사이클 H — ADR-032)
// ═══════════════════════════════════════════════════════════

export interface Country {
  code: string;                              // "VN"
  name: string;                              // "베트남"
  defaultPhrases: SituationalPhrase[];       // 베트남어 7개 (도시 공통)
  paymentDefaults: {
    currency: string;
    currencySymbol: string;
    /** 1 KRW 당 현지 통화 양 */
    approxKrwRate: number;
  };
  utilities: {
    voltage: string;
    plugType: string;
    simAvailable: boolean;
  };
  visa: {
    visaFreeDays?: number;
    eVisaRequired: boolean;
    notes?: string;
  };
  /** 국가 단위 응급 (예: 베트남 경찰 113, 응급 115) — 도시별 영사관과 별개 */
  countryEmergencyContacts: EmergencyContact[];
}

// ═══════════════════════════════════════════════════════════
// UI VIEW TYPES (시드↔화면 공유 타입)
// ═══════════════════════════════════════════════════════════

/** DayRouteMapView — 일일 동선 지도 핀 */
export interface RouteStop {
  id: string;
  order: number;
  name: string;
  time: string;
  category: string;
  categoryIcon: string;
  nextTransit?: string;
  isActive?: boolean;
  pinX: number;
  pinY: number;
}

/** PlaceDiscoveryView — 장소 카테고리 */
export type PlaceCategory = "food" | "spot" | "shopping" | "nature" | "cafe";

/** PlaceDiscoveryView — 탐색 장소 카드 */
export interface DiscoverPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  rating: number;
  reviewCount: number;
  distance: string;
  badge?: "ai" | "popular";
  imageUrl?: string;
}

/** NotificationListView — 알림 카테고리 */
export type NotificationCategory = "travel" | "companion" | "system";

/** NotificationListView — 알림 항목 */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  icon: string;
  iconColor: "purple" | "coral" | "amber" | "gray";
  href?: string;
  read: boolean;
  createdAt: string;
}

/** PostTripRecapView — 통계 */
export interface RecapStats {
  placesVisited: number;
  longestStay: string;
  totalDistanceKm: number;
  totalSteps: number;
  totalSpentKRW: number;
  biggestCategory: string;
}

/** PostTripRecapView — 하이라이트 */
export interface RecapHighlight {
  id: string;
  label: string;
  emoji: string;
  name: string;
  icon: string;
  color: "purple" | "coral" | "amber";
}

/** PostTripRecapView — 포토 모먼트 */
export interface RecapMoment {
  id: string;
  dayLabel: string;
  alt: string;
  imageUrl?: string;
}
