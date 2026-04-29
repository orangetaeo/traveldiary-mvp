# Skill: Place Verification (장소 검증)

> **스킬 유형**: 도메인 스킬
> **핵심 내용**: Google Places + OTA 5단계 사실 확인, 환각 차단
> **사용 에이전트**: T4 Validation Engineer

## 개요

AI가 생성한 정보의 진위를 검증하는 5단계 검증 레이어이다.
트리플·Layla·Mindtrip의弱点(환각)를 극복하는 핵심 스킬이다.

## 5단계 검증 구조

```typescript
interface ValidationResult {
  itemId: string;
  checks: {
    placeExists: boolean;              // 1단계: 장소 실재 확인
    operatingStatus: "open" | "closed" | "temporary";  // 2단계: 운영 상태
    bookingRequired: boolean;          // 3단계: 예약 필요성
    distanceVerified: boolean;         // 4단계: 거리 정확성
    priceVerified: boolean;            // 5단계: 가격 정확성
  };
  validatedAt: string;
}
```

## 검증 파이프라인

```
1. AI 추천 생성
       ↓
2. [1단계] Google Places API로 장소 존재 확인
       ↓
3. [2단계] 운영 시간/상태 조회 (实时)
       ↓
4. [3단계] 예약 필요성 판단
       ↓
5. [4단계] 거리 계산 (다음 일정과의 소요시간)
       ↓
6. [5단계] 가격 정보 조회 (가능한 경우)
       ↓
7. ValidationResult 저장
       ↓
8. 검증 실패 시 → 사용자에게 경고 또는 대체 제안
```

## 1단계: 장소 실재 확인

### 검증 방법

```
Google Places Details API 호출
  → place_id 존재 여부 확인
  → name, formatted_address 일치 여부
```

### 결과 처리

| 결과 | 처리 |
|------|------|
| placeExists: true | 다음 단계 진행 |
| placeExists: false | 즉시 제거, 대체 장소 제안 |

## 2단계: 운영 상태 확인

### 검증 방법

```
Google Places Details API
  → opening_hours 확인
  → current_openness 확인
  → permanently_closed 확인
```

### 상태 분류

| 상태 | 의미 | 처리 |
|------|------|------|
| `open` | 영업 중 | 정상 사용 |
| `closed` | 휴업/폐업 | 다음 일정으로 이동 제안 |
| `temporary` | 임시 휴업 | 별도 경고 표시, 사용자 결정 |

### 실시간 확인

- **생성 시**: 전체 검증
- **여행 D-1**: 출발 전 재검증 (운영 상태 중심)
- **여행 중**: 실시간 필요 시 추가 검증

## 3단계: 예약 필요성 판단

### 판단 기준

```typescript
function determineBookingRequired(place: PlaceDetails): boolean {
  // 1. 카테고리 기반
  if (place.types.includes("restaurant")) {
    // 식당: 인원 수, 시간대에 따라 결정
    return place.rating >= 4.5 && place.userRatingsTotal >= 100;
  }
  
  if (place.types.includes("hotel")) {
    // 숙소: 항상 필요
    return true;
  }
  
  if (place.types.includes("airport") || place.types.includes("train_station")) {
    // 교통: 필요 없음
    return false;
  }
  
  // 2. 평점/후기 수 기반
  return place.rating >= 4.0 && place.userRatingsTotal >= 50;
}
```

### 결과 표시

| 결과 | UI 표시 |
|------|---------|
| bookingRequired: true | "예약 필요" 뱃지 |
| bookingRequired: false | "즉시 방문 가능" |

## 4단계: 거리 정확성 확인

### 검증 방법

```
Google Directions API
  → 다음 일정과의 소요시간 계산
  → 교통수단 (도보/지하철/버스)
```

### 정확성 기준

| 계산 vs 실제 | 처리 |
|-------------|------|
| ±10분 이내 | distanceVerified: true |
| ±10~30분 | 경고 표시 |
| 30분 이상 | distanceVerified: false, 재계산 |

## 5단계: 가격 정확성 (선택적)

### 검증 방법

```
OTA API (Klook, Agoda)
  → 최신 가격 조회
  → 변동 확인
```

### 결과 처리

| 상황 | 처리 |
|------|------|
| priceVerified: true | 가격 표시 |
| priceVerified: false | "가격 변동 가능" 경고 |
| 가격 정보 없음 | 가격 제거 |

## 검증 실패 처리

| 실패 유형 | 처리 방식 |
|-----------|----------|
| placeExists: false | 즉시 제거, 대체 장소 제안 |
| operatingStatus: closed | 다음 일정으로 이동 제안 |
| operatingStatus: temporary | 별도 경고 표시, 사용자 결정 |
| distanceVerified: false | 거리 재계산, 시간 조정 |
| priceVerified: false | 가격 제거, "가격 변동 가능" 경고 |

## 캐시 전략

```
검증 결과: 24시간 캐시
  → 비용 최적화 (API 호출 비용 절감)
  → 실시간성 vs 비용 균형
  
캐시 무효화:
  - 여행 D-1 재검증
  - 사용자 요청 시
  - 24시간 경과 후
```

## 구현 예시

```typescript
// lib/validation.ts

export async function validatePlace(placeId: string): Promise<ValidationResult> {
  // 1단계: 장소 존재 확인
  const placeDetails = await googlePlaces.getPlaceDetails(placeId);
  if (!placeDetails) {
    return { itemId: placeId, checks: { placeExists: false, ... }, validatedAt: now() };
  }
  
  // 2단계: 운영 상태
  const operatingStatus = placeDetails.opening_hours?.open_now 
    ? "open" 
    : "closed";
  
  // 3단계: 예약 필요성
  const bookingRequired = determineBookingRequired(placeDetails);
  
  // 4단계: 거리 (다음 일정과의 계산은 별도 함수에서)
  
  // 5단계: 가격 (가능한 경우)
  const priceVerified = await verifyPrice(placeId);
  
  return {
    itemId: placeId,
    checks: {
      placeExists: true,
      operatingStatus,
      bookingRequired,
      distanceVerified: true, // 후처리
      priceVerified
    },
    validatedAt: now()
  };
}
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\place-verification.md`