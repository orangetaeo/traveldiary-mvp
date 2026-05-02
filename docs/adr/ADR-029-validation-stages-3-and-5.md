---
id: ADR-029
title: 5단계 검증 3·5단계 구체화 — 룰 기반 booking + OTA price 교차검증
status: Accepted
date: 2026-05-02
decider: R1 CTO
proposer: T4 Validation Engineer + T10 API Specialist + T14 DB Architect + T13 Code Reviewer
related: ADR-007 (5단계 검증 비전), ADR-018 (Google Places 1~2단계), ADR-025 (OTA 가격 시드), ADR-027 (실 OTA aggregator), S-03 (place verification), S-13 (audit log)
---

# ADR-029: 5단계 검증 3·5단계 구체화 (사이클 L+N)

## 컨텍스트

- 5단계 검증 중 1·2단계만 활성 (사이클 5b-3, ADR-018). 3·5단계 미구현 → 차별화 축 2 강도 약 40%.
- `ValidationResult` Prisma 모델은 5필드 모두 정의되어 있으나 (schema.prisma 130~146) 어떤 코드도 `.create()` 호출 안 함 — 결과는 반환만, DB 영속화 0.
- 사이클 L (3단계 bookingRequired) + N (5단계 priceVerified)을 사용자 외부 액션 0건으로 구현 가능 (Google Places `types` 활용 + 기존 OTA aggregator).
- 4단계 distanceVerified는 Google Directions API 키 1건 필요 → 사이클 M으로 분리.

## 결정

### A. 신규 의존성 0개

기존 자원만 활용:
- Google Places `types` 필드 (DETAILS_FIELDS 추가, 동일 SKU)
- OTA aggregator (`aggregateOffersForItem`) 그대로 재사용
- 기존 `EvidenceCache` (24h TTL), `AuditLog` (`validation.completed` 이미 union에 등재됨)

### B. 함수 분리 (SRP — T13 사전 리뷰 채택)

```
lib/services/
  place-verification.ts   ← 1·2단계 (기존, 무변경)
  booking-rules.ts        ← 3단계 (신규, 순수 함수)
  price-verification.ts   ← 5단계 (신규, OTA wrapping)

lib/repositories/
  validation.repository.ts ← ValidationResult.create + 24h 캐시 lookup (신규)

actions/
  place.ts                ← validateItemAction 신규 (thin orchestrator)
                            verifyPlaceAction은 무변경 (회귀 위험 0)
```

### C. 사이클 L — bookingRequired 룰 (2단 분기)

```typescript
// 우선순위 1: Google Places types (실 API)
if (types.includes("lodging")) return true;
if (types.intersects(["airport", "train_station", "transit_station"])) return false;
if (types.includes("restaurant")) {
  return rating >= 4.5 && userRatingsTotal >= 100;
}
return rating >= 4.0 && userRatingsTotal >= 50;

// 우선순위 2: 데모 fallback (category + name 키워드)
if (category === "rest") return true;
if (category === "spot" && /케이블카|투어|티켓|스노클|입장권|크루즈/.test(name)) return true;
if (category === "food" && /미슐랭|파인|오마카세|예약|cavern|pepper/i.test(name)) return true;
return false;
```

- 매직 넘버 인라인 ❌ → 모듈 상수로 분리 (R1 조건)
- 룰은 i18n·도시별 변동 가능하지만 이번 사이클은 default만 (룰 함수 시그니처에 city 인자 여지 남김)
- 출력: `{ required: boolean; reason: string }` — UI에서 근거 표시 가능

### D. 사이클 N — priceVerified 임계값 (T4 + R1 합의)

```typescript
deltaPct = |estimated - medianOtaPrice| / estimated * 100

deltaPct <= 20    → priceVerified: true   ("verified")
20 < deltaPct <= 50 → priceVerified: false ("warn")    + UI "변동 가능"
deltaPct > 50      → priceVerified: false ("mismatch") + UI 강한 경고
estimatedPrice 없음 → priceVerified: null  ("no_estimate")
OTA offers 0건     → priceVerified: null  ("no_offers")
OTA single source  → priceVerified: null  ("single_source")
```

- DB 컬럼 `priceVerified Boolean` (non-null) 유지 → null/unknown 케이스는 `false`로 저장 + audit metadata `reason` 분리 (마이그레이션 회피)
- 단일 OTA 자기자신 비교 금지 (T10 사전 경고)
- 통화 불일치 → `"unknown"` + audit warn (모든 시드 KRW이지만 방어 코드)

### E. ValidationResult 영속화 패턴 (T14 권장 채택)

```typescript
// 24h 캐시 lookup (기존 row 재사용)
prisma.validationResult.findFirst({
  where: { itemId, validatedAt: { gt: new Date(Date.now() - 24*3600_000) } },
  orderBy: { validatedAt: "desc" },
})

// 새 검증은 항상 create (history 누적, 덮어쓰기 ❌)
prisma.validationResult.create({ data: { ... } })
```

- 인덱스: 기존 `@@index([itemId, validatedAt])` 그대로 활용
- 마이그레이션 ❌
- cleanup cron은 사이클 13+ 운영 단계 (T14 우려 — 1.2k row/일 발생 가능)

### F. 트랜잭션 정책 (T14 + 5b-3 패턴 답습)

- 외부 API 호출(1초+)을 트랜잭션에 넣지 ❌ → connection pool 고갈 위험
- `validateItemAction`은 트랜잭션 미사용. ValidationResult.create는 단발 INSERT
- Trip.updatedAt no-op write ❌ (메타 데이터지 일정 변경 아님)
- 권한: `canReadTrip`만 (ValidationResult는 부속 데이터)

### G. audit log policy (S-13 + T10 + T13 답습)

```typescript
action: "validation.completed"
resource: "ItineraryItem"
resourceId: item.id
after: {
  placeExists, operatingStatus, bookingRequired,
  distanceVerified: false (4단계 미구현),
  priceVerified
}
metadata: {
  source: "validation",
  bookingReason, priceReason, priceDeltaPct, medianOtaPrice,
  cacheHit: boolean,
  fetchDurationMs: number,
}
```

- **fresh-only**: 24h 캐시 hit 시 audit log 미기록 (5b-3 정책 답습)
- 모든 단계 부분 실패는 try/catch 격리 — 한 단계 실패가 전체 막지 않음

### H. UI 정책 (이번 사이클 backend만)

- 사이클 L+N은 backend + ValidationResult DB 저장까지
- 일정 상세 뱃지 노출은 별도 사이클 (T17 디자인 승인 후)
- API 결과는 `validateItemAction` 반환값으로 사용 가능 — 후속 사이클에서 UI 통합

## 대안

### 대안 1 — verifyPlaceAction 1개로 1·2·3·5 모두 (T4 1차 안, 비채택)
- T13 사전 경고 채택: 단계별 실패 격리 깨짐 + 100줄 union 폭발
- 절충: 새 `validateItemAction` 신설, 내부에서 step별 service 함수 호출

### 대안 2 — ValidationEngine 클래스 (비채택)
- YAGNI. 함수 5개 모음으로 충분 (T13 권장)

### 대안 3 — bookingRequired·priceVerified 별도 endpoint (비채택)
- 사용자 1클릭 = 1행 원칙 깨짐. ValidationResult 일관성 ↓ (T4 우려)

### 대안 4 — operatingStatus String → enum 마이그레이션 (비채택)
- T14 보류 권장. application-level 검증으로 충분, 도메인 안정화 후 0007에서 일괄

### 대안 5 — 사이클 M (Directions) 동시 진행 (R1 권고했으나 사용자 결정 옵션 A1 채택)
- 사용자 카드 등록 1건 발생 → "자동 진행" 정의 벗어남
- 후속 사이클 M에서 처리 (차별화 축 2 강도 65% → 85%)

## 영향

### 긍정
- 차별화 축 2 강도 40% → **65%** (3·5단계 추가)
- ValidationResult 처음으로 DB 영속화 — 검증 history 추적 가능
- 사용자 외부 액션 0건 (자동 진행 약속 지킴)
- 마이그레이션 0, 신규 의존성 0, 회귀 위험 ↓

### 부정
- 룰 휴리스틱 부채 — 시간 흐르며 데이터 드리븐(예약률 로그)으로 진화 필요
- 시드 가격 신뢰성 한계 — priceVerified는 "변동 감지" 목적, "정확성 보증" 아님
- ValidationResult row 누적 — cleanup cron 사이클 13+ 필수

### 트레이드오프
- 자동 제거 ❌ + 강도별 경고 배지 → 사용자 결정권 보존 vs UX 노이즈 증가
- 24h 캐시 vs 실시간성 — 비용 균형, D-1 자동 재검증으로 보강

## 사용자 직접 액션

**없음.** 키 미설정 상태에서도 데모 fallback으로 동작.

## 검증 통과 기준 (STEP 4)

- [ ] `npx tsc --noEmit` 0
- [ ] `npx next build` 성공
- [ ] `lib/services/booking-rules.ts` + `price-verification.ts` 모두 `import "server-only"` 명시
- [ ] booking-rules 단위 테스트 5건 이상 (R1 조건)
- [ ] price-verification 단위 테스트 5건 이상
- [ ] API 키 미설정 로컬 빌드 → `mode: "demo"` fallback, 회귀 0
- [ ] DB 미연결 상태 → ValidationResult 저장 시도하지만 null 반환, 비즈니스 막지 않음
- [ ] 라이브 + DB: `validateItemAction` 호출 → ValidationResult row 1건 생성
- [ ] 라이브 + DB: 24h 내 재호출 → 캐시 hit, 새 row 생성 ❌, audit log 미기록
- [ ] 라이브 + DB: 24h 경과 → 새 row 생성, audit log `validation.completed` 1건

## 사인오프

R1 ✅ (조건부) · T4 ✅ · T10 ✅ · T13 ✅ · T14 ✅
