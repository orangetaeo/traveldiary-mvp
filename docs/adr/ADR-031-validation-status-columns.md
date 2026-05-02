---
id: ADR-031
title: ValidationResult enum 컬럼 + 중복 호출 통합 + UI 정밀화
status: Accepted
date: 2026-05-02
decider: R1 CTO
proposer: T14 DB Architect + T13 Code Reviewer + T17 UX Designer + T4 Validation Engineer + T12 QA Lead
related: ADR-018 (Google Places), ADR-029 (3·5단계), ADR-030 (4단계 distance), S-13 (audit log)
---

# ADR-031: ValidationResult enum 컬럼 + 중복 호출 통합 + UI 정밀화 (사이클 E)

## 컨텍스트

ADR-029/030 직후 인프라 부채 4종 누적:

1. **캐시 hit 평탄화**: ValidationResult.priceVerified·distanceVerified는 Boolean만 저장 → 캐시 hit 시 warn/mismatch/single_source/currency_mismatch 등 status 정보 손실. `false → "warn" 보수적 fallback`은 사용자에게 정확하지 않은 표시 (정보 가치 손실).

2. **외부 API 중복 호출**: `app/itinerary/[id]/item/[itemId]/page.tsx`가 `verifyPlaceAction` + `validateItemAction` 둘 다 호출 → 둘 다 내부적으로 `verifyPlace()` 호출 (Google Places find_place + details). 24h EvidenceCache로 dedupe되지만 페이지 진입마다 외부 호출 비용 2회·캐시 read 2회.

3. **mismatch 시각 부족**: 가격·이동 mismatch는 다른 status와 차별화가 약함 (`border-l-4`만). T17 권고에서 강조 부족 지적.

4. **UI 코드 중복**: ValidationBadges 안의 Booking·Distance·Price 뱃지가 모두 같은 구조 (icon + 2-line text + tone) → DRY 위반.

## 결정

### 1. 마이그레이션 0007 — ValidationResult enum 컬럼 추가

```sql
ALTER TABLE "ValidationResult"
  ADD COLUMN "priceStatus" TEXT,
  ADD COLUMN "distanceStatus" TEXT;
```

- NULLABLE — 기존 row 호환 (회귀 0)
- 새 row → 정확한 status enum 저장
- 기존 row(NULL) 캐시 hit → 이전 보수적 fallback 답습 (회귀 0)

### 2. validateItemAction 통합 (T13 권장)

`ValidateItemResult.googleResult: VerifyPlaceResult` 추가:

```ts
type ValidateItemResult = {
  mode: "ok";
  // ...
  googleResult: VerifyPlaceResult;  // 신규
  // ...
};
```

- page.tsx는 `verifyPlaceAction` 호출 제거 → 외부 API 호출 1회로 감소
- audit `evidence.gathered`는 validateItemAction 안에서 발행 (verifyPlaceAction 제거 대비)
- verifyPlaceAction은 `@deprecated` 표기만 (당장 제거 ❌, 호환성 유지)

### 3. StatusBadge 공통 컴포넌트 (T17 + T13 합의)

```ts
<StatusBadge tone icon title subtitle? emphasized? ariaLabel />
```

- tone: success / warn / danger / meta
- TONE_MAP 모듈 상수 (R1 매직 넘버 회피 답습)
- meta 톤은 위계 낮춤 (text-td-meta + text-ink-soft)

### 4. mismatch 시각 강화 (T17)

danger + emphasized=true → `border-l-4 ring-2 ring-danger/30` 추가:
- 시각 위계: warn < danger < danger+emphasized
- 가격·이동 mismatch만 emphasized=true (사용자 즉시 조정 필요 신호)

### 5. 캐시 hit fallback 정확화

```ts
function derivePriceFromCache(cached) {
  if (cached.priceStatus) {
    return { status: cached.priceStatus, ... };  // 정확 복원
  }
  // 기존 row (NULL) — 보수적 fallback
  return { status: cached.priceVerified ? "verified" : "warn", ... };
}
```

distance도 동일 패턴.

## 부정

- **verifyPlaceAction 즉시 제거**: 호환성 위해 @deprecated 표기만. 미래 사이클에서 호출처 0건 확인 후 제거.
- **ValidationResult cleanup cron**: 1.2k row/일 우려는 현재 미발생, 사이클 13+ 운영 단계로 미룸.
- **OtaOffer.currency 필드**: 현재 KRW 고정. 글로벌 OTA 통합 시 추가.
- **FX cron**: 현재 정적 테이블로 충분. 환율 변동 폭 ±10% 이내.
- **캐시 hit 시 google rating·types 복원**: ValidationResult 컬럼 추가 부담 — placeId·rating 별도 컬럼 신설 보류. operatingStatus만으로 demo/verified 추정.

## 결과

### 성능
- 외부 API 호출: 페이지 진입 시 2회 → **1회** (50% 감소)
- AuditLog `evidence.gathered`: 손실 0 (validateItemAction에서 발행)

### 정확성
- 캐시 hit 시 status enum 정확 복원 (warn/mismatch 평탄화 해소)
- "warn 보수적 fallback"은 기존 row만 (마이그레이션 후 신규 row 0%)

### UI
- mismatch 시각 강화 (border-l-4 + ring-2)
- StatusBadge 공통화 — Booking/Distance/Price 뱃지 코드 중복 제거

### 영향
- 신규 파일: `prisma/migrations/0007_validation_status_columns/migration.sql`, `components/ui/StatusBadge.tsx`, `tests/unit/status-badge.test.tsx`
- 수정 파일: schema.prisma, validation.repository.ts, actions/place.ts, page.tsx, ValidationBadges.tsx, vitest.config.ts
- 마이그레이션 1건 (NULLABLE 컬럼 추가)
- 의존성 0건
- vitest +7건 (총 115)
- 사용자 액션 1건: Railway 콘솔에서 `npx prisma migrate deploy` (DB 연결된 경우) 또는 `npx prisma db push`

### 후속 부채 (미룸)
- verifyPlaceAction 완전 제거 — 호출처 0건 확인 후 다음 사이클
- ValidationResult cleanup cron — 사이클 13+
- OtaOffer.currency 필드 — 글로벌 OTA 통합 시
- FX 주간 cron — 환율 변동성 모니터 후 결정
