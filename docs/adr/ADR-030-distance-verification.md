---
id: ADR-030
title: 5단계 검증 4단계 distanceVerified — Google Directions + Haversine fallback
status: Accepted
date: 2026-05-02
decider: R1 CTO
proposer: T4 Validation Engineer + T10 API Specialist + T2 Itinerary Graph Engineer + T14 DB Architect + T16 Security Engineer + T17 UX Designer + T13 Code Reviewer
related: ADR-018 (Google Places 1·2단계), ADR-029 (3·5단계 booking + price), S-03 (place verification), S-11 (API security), S-13 (audit log)
---

# ADR-030: 5단계 검증 4단계 distanceVerified (사이클 M)

## 컨텍스트

- ADR-029로 3·5단계 활성. 1·2·3·5 = 4단계 완료. 4단계 distanceVerified만 누락.
- 차별화 축 2 (검증 인프라) 강도 65%. 환각 차단 검증 레이어의 마지막 빈칸.
- Google Directions API는 사용자 액션 1건 (Maps Embed와 같은 Google Cloud 카드) 추가만으로 도입 가능.
- 5b-3 Google Places 도입 시 정립한 외부 API 통합 표준 패턴(server-only · 데모 fallback · 캐시 우선 · audit fresh-only) 그대로 답습 → 회귀 위험 0.
- `ValidationResult.distanceVerified Boolean` 컬럼은 마이그레이션 0001부터 이미 정의됨 (schema.prisma:140) → 마이그레이션 추가 불필요.

## 결정

### A. 신규 의존성 0개

기존 자원만 활용:
- 새 Google API SKU (Directions) — 카드 1건은 이미 Maps Embed/Places와 같은 Google Cloud 프로젝트에서 발급 가능.
- 기존 `EvidenceCache` (24h TTL), `AuditLog` (`validation.completed` 이미 등재됨).
- ADR-029에서 정립한 `validateItemAction` 진입점에 4단계 분기 추가만으로 통합.

### B. 함수 분리 (T13 사전 리뷰 채택, ADR-029 패턴 답습)

```
lib/services/distance-rules.ts          (순수 함수, 단위 테스트 100%)
  ├─ haversineKm()                      # Great-circle 거리
  ├─ pickTravelMode()                   # 1km 분기
  ├─ estimateTravelMinutes()            # Fallback 추정 (도보 4km/h × 1.4, 차량 60km/h × 1.4)
  └─ compareDistanceVerification()      # 메인 비교 (status 6종)

lib/services/google-directions.ts        (외부 API wrapper, server-only)
  └─ fetchDirections()                  # Directions API + EvidenceCache

lib/services/distance-verification.ts    (thin wrapper)
  └─ verifyItemDistance()               # API 호출 → compareDistanceVerification 주입
```

### C. 룰 — distanceVerified 정의

일정 N의 `distanceVerified` = 일정 N+1과의 실제 이동시간이 갭(+ flexMinutes) 이내.

- "다음 일정"은 같은 `dayIndex` 안에서 `scheduledAt` 기준 다음 노드 (T2 합의 — 단순화).
- 마지막 일정 → `no_next` (검증 면제).

비교 룰 (priceVerification 답습):

| status | 조건 | DB.distanceVerified |
|--------|------|---------------------|
| `verified` | travel ≤ gap | true |
| `warn` | gap < travel ≤ gap + flexMin | false |
| `mismatch` | travel > gap + flexMin | false |
| `no_next` | nextItem 없음 | false |
| `missing_location` | 좌표 (0,0) 또는 시간 파싱 실패 | false |
| `demo` | API 키 미설정 + Haversine 추정 표시 | false |

### D. 모드 결정 + 데모 fallback

```
거리 < 1.0km     → walking, 4 km/h × 1.4
거리 ≥ 1.0km     → driving, 60 km/h × 1.4
```

- transit 미지원 (사이클 13+ 운영 단계로 미룸 — 시드 도시들 transit 빈약).
- 우회 보정계수 1.4는 도시 격자·일방통행 평균 (T10 권장).

### E. 캐시 + Privacy

- 키: `SHA256(origin_lat,lng | dest_lat,lng | mode)`, 32자.
- TTL: 24h (운영 시간과 동일 빈도).
- ZERO_RESULTS·NOT_FOUND도 캐시 (재호출 비용 절감).
- 좌표는 이미 `ItineraryItem.location`에 영속화 — 추가 privacy 리스크 없음.
- AuditLog metadata에 좌표 포함 ❌ — `placeId·distanceKm·mode·status`만.

### F. UI — DistanceBadge

`ValidationBadges.tsx`에 `BookingBadge` ↔ `PriceBadge` 사이에 추가:

| status | 톤 | 아이콘 |
|--------|----|--------|
| verified | success-soft | directions |
| warn | amber-soft | schedule |
| mismatch | danger-soft + border-l-4 | running_with_errors |
| demo | meta (surface-soft) | near_me |
| no_next / missing_location | 숨김 | — |

### G. 회귀 안전망

- vitest ≥15건 (실 23건 PASS).
  - Haversine 정확도: 서울↔부산 ±5km, 동일좌표 0, 교환법칙
  - 모드 분기: threshold 경계
  - Fallback 추정: 0.5km 도보 11분, 5km 차량 7분
  - 비교 룰: verified/warn/mismatch/no_next/missing_location/실측 주입
- 키 미설정 → `mode: "demo"` 즉시 반환 → Haversine 추정 fallback (회귀 0).

## 부정 (Considered alternatives)

### 1. transit 모드 도입
거절 이유: 시드 4도시 중 transit 의미 있는 곳은 도쿄/방콕만. 사이클 13+ 운영 단계에서 도시별 모드 매핑 추가.

### 2. distanceStatus enum 컬럼 추가 (ValidationResult)
거절 이유: 마이그레이션 1건 추가 부담. priceStatus도 같은 한계 → 사이클 E (인프라 부채)에서 마이그레이션 0007 한 번에 묶음.

### 3. DAG 트래버설로 다음 일정 결정
거절 이유: T2 권장 — 같은 dayIndex 내 시간순 단순화로 충분. DAG dependents는 사이클 12+ Live Replan 옵션 생성에서 활용 중 (중복 비용 회피).

### 4. 캐시 키에 위치를 hash 안 함 (raw)
거절 이유: 좌표 4자리 정밀도(~10m)는 식별 가능 → Privacy. SHA256으로 정규화.

## 결과

### 강도
- 차별화 축 2 (검증 인프라): **65% → 85%** ("트리플 약점 직격" 4/5 단계 활성)
- 5단계 검증 활성: 1·2·3·5 → 1·2·3·**4**·5 = 5/5

### 영향 범위
- 신규 파일 4개 (services 3 + tests 1)
- 수정 파일 3개 (`actions/place.ts`, `ValidationBadges.tsx`, `app/itinerary/[id]/item/[itemId]/page.tsx`)
- 마이그레이션 0건 / 의존성 추가 0건

### 사용자 액션 (선택)
- `GOOGLE_DIRECTIONS_API_KEY` 1건 (선택) — Maps Embed/Places와 같은 Google Cloud 프로젝트에서 활성화 가능.
- 미설정 시 데모 fallback (Haversine 추정) 동작 — 회귀 0.

### 후속 부채 (R1·T13)
- `ValidationResult` 컬럼 enum 확장 (priceStatus + distanceStatus) — 사이클 E.
- `verifyPlace`와 중복 호출 통합 — 사이클 E.
- mismatch 시각 차별화 (border-l-4 외) — 사이클 E.
