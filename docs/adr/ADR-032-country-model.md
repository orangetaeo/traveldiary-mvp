---
id: ADR-032
title: Country 데이터 모델 도입 (정적 lib + 하이브리드)
status: Accepted
date: 2026-05-02
decider: R1 CTO
proposer: T14 DB Architect + T19 Librarian + T8 PM + T17 UX Designer
related: ADR-009 (시드 데모 모드), 사이클 8 M5 (City), 사이클 G 시리즈 (베트남 6도시)
---

# ADR-032: Country 데이터 모델 도입 (사이클 H)

## 컨텍스트

사이클 G 시리즈(G-1~G-4) 완료 시점에 베트남 6도시(푸꾸옥·다낭·호치민·하노이·호이안·나트랑) City 시드가 완성됨. 시드 분포 측정 결과 country 단위 동일 데이터가 6/6 중복:

| 필드 | 베트남 6도시 동일 | 중복 라인 |
|------|------------------|----------|
| `payment.currency` / `currencySymbol` / `approxKrwRate` | VND / ₫ / 18 | 18행 |
| `utilities.voltage` / `plugType` / `simAvailable` | 220V / A/C/G / true | 18행 |
| `visa.visaFreeDays` / `eVisaRequired` | 45 / false | 12행 |
| `phrases` 베트남어 7건 (신짜오·깜언 등) | 완전 동일 | **42행** |
| 영사 콜센터 / 카드 분실 emergencyContacts (한국 발신) | 모든 country 공통 | 12행 |
| 베트남 경찰 113 / 응급 115 | 베트남 단위 | 12행 |

**총 ~110행 중복.** 향후 도시 추가 시 일관성 유지 부담 + 환율·비자 정책 변경 시 6곳 수정 필요.

## 결정

### 옵션 C — 하이브리드 (정적 lib 우선 + Prisma 승격 트리거 명시)

#### 1. 정적 `lib/constants/countries.ts` 도입

```ts
export interface Country {
  code: string;                              // "VN"
  name: string;                              // "베트남"
  defaultPhrases: SituationalPhrase[];       // 베트남어 7개
  paymentDefaults: {
    currency: string;
    currencySymbol: string;
    approxKrwRate: number;
  };
  utilities: { voltage: string; plugType: string; simAvailable: boolean };
  visa: { visaFreeDays?: number; eVisaRequired?: boolean; notes?: string };
  countryEmergencyContacts: EmergencyContact[];   // 베트남 경찰 113, 응급 115
}

export const COUNTRIES: Record<string, Country> = {
  VN: { ... },
  TH: { ... },  // 방콕 검증 데이터
  JP: { ... },  // 도쿄 검증 데이터
};

export const GLOBAL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  // 영사 콜센터, 카드 분실 — 모든 country 공통
];
```

#### 2. City 타입 정규화 범위 (medium)

City에서 country로 옮기는 필드:
- `phrases` → required → optional (시드 비워두면 country.defaultPhrases로 fallback)
- `payment.currency` / `currencySymbol` / `approxKrwRate` → optional
- `utilities` → 이미 optional, 시드에서 제거
- `visa` → 이미 optional, 시드에서 제거 (도시별 visa.notes는 city에 둘 수 있음)
- `emergencyContacts` 일부 → 영사 콜센터·카드 분실·국가 경찰/응급 제거

**City에 유지하는 필드 (도시 차별화):**
- `payment.cardAcceptance` / `cardNotes` / `tipNotes`
- `transport` (도시별 그랩·시클로·도보)
- `weather` (북부/중부/남부 다름)
- `curatedGuides`
- `emergencyContacts` 도시별 영사관·응급의료(병원)

#### 3. resolveCity() merge 함수

```ts
export function resolveCity(slug: string): ResolvedCity | null {
  const city = getCityBySlug(slug);
  if (!city) return null;
  const country = COUNTRIES[city.countryCode];
  return mergeCity(city, country);
}
```

화면(`/city/[slug]/page.tsx`)은 `resolveCity()` 사용 — 사용자 view 무변경.

`getCityBySlug()` 시그니처는 유지 → 기존 코드/테스트 영향 없음.

## Prisma 승격 트리거 (미래)

다음 중 하나 발생 시 정적 lib → Prisma Country 모델로 승격하고 마이그레이션:

1. **두 번째 country full 출시** — 예: 태국 itinerary 시드 추가 시
2. **country 단위 query 필요** — 예: 어드민 도구에서 country별 도시 목록·통계
3. **사용자가 country 데이터 편집** — 환율 자동 업데이트, 비자 정책 변경 알림 등

## 거부된 대안

### A) Prisma Country 즉시 도입
- DATABASE_URL 미설정 환경에서 데모 모드 영향 위험
- 마이그레이션 0008 추가 부담
- 단일 country(베트남) 출시 단계엔 과도

### B) 정적 lib only (트리거 없음)
- 미래 Prisma 승격 시 두 번째 마이그레이션 부담
- 데이터 모델 일관성 결여 (city.country 문자열 vs Country 엔티티)

## 영향

### 코드
- `lib/constants/countries.ts` 신규 (~120L)
- `lib/types.ts` 갱신 — Country 타입 + City 일부 optional
- 도시 시드 6개(베트남) + 2개(비-베트남) 정리 — **~110행 감축**
- `lib/seed/cities/index.ts` — `resolveCity()` 추가
- `app/city/[slug]/page.tsx` — `resolveCity()` 사용

### 테스트
- 신규: `tests/unit/country-resolve.test.ts` — Country 정의·merge 로직·resolved 객체 무결성
- 회귀: 기존 city 테스트 raw seed 단언 → resolved 단언으로 갱신

### 데모 모드
- 영향 없음 (정적 lib, DB 변경 없음)

### 사용자 화면
- 영향 없음 (resolveCity merge로 view 무변경)

## 검증 기준

- 베트남 6도시 resolveCity 결과가 정규화 전과 100% 동일 (raw seed `JSON.stringify`로 회귀 비교)
- 비-베트남(방콕·도쿄)도 동일 정규화 적용 검증
- `getCityBySlug` 시그니처 무변경 (기존 호출처 영향 0)
