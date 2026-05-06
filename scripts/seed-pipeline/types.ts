/**
 * 시드 파이프라인 공통 타입.
 *
 * Phase A (수집) → Phase B (정제) → Phase C (검증) → Phase D (출력)
 * 이 파일은 모든 Phase에서 공유하는 인터페이스를 정의한다.
 */

// ═══════════════════════════════════════════════════════════════════
// Google Places API 원시 결과
// ═══════════════════════════════════════════════════════════════════

export interface RawGooglePlace {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  businessStatus?: string;
  photos?: string[]; // photo_reference 배열
  openingHours?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Naver Evidence 결과
// ═══════════════════════════════════════════════════════════════════

export interface NaverEvidence {
  placeId: string; // Google placeId와 매칭
  placeName: string;
  blogTotal: number;
  positiveRate: number; // 0~100
  topReasons: string[]; // LLM 요약 or 휴리스틱
  blogSnippets: Array<{
    title: string;
    link: string;
    date: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════
// 병합된 시드 장소 (Phase A 최종 출력)
// ═══════════════════════════════════════════════════════════════════

export type SeedCategory = "food" | "spot" | "shopping" | "rest";

export interface MergedSeedPlace {
  placeId: string;
  name: string; // 현지어 원문
  nameKo?: string; // 한글 번역 (Phase B에서 채움)
  category: SeedCategory;
  subCategory?: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  photos: string[];
  businessStatus?: string;
  openingHours?: string[];
  naverEvidence?: {
    blogTotal: number;
    positiveRate: number;
    topReasons: string[];
  };
  qualityScore: number; // 자동 계산 (rating × reviews × korean evidence)
  collectedAt: string; // ISO
  zone: string; // 수집 구역 ID
}

// ═══════════════════════════════════════════════════════════════════
// 구역(Zone) 설정
// ═══════════════════════════════════════════════════════════════════

export interface SearchZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

// ═══════════════════════════════════════════════════════════════════
// 파이프라인 진행 상태
// ═══════════════════════════════════════════════════════════════════

export interface PipelineProgress {
  phase: string;
  city: string;
  totalZones: number;
  completedZones: number;
  totalPlaces: number;
  errors: string[];
  startedAt: string;
  updatedAt: string;
}
