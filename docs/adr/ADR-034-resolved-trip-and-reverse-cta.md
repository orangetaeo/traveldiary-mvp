---
id: ADR-034
title: ResolvedTrip 뷰 객체 + city→trip 역방향 CTA
status: Accepted
date: 2026-05-02
decider: R1 CTO
proposer: T14 DB Architect + T8 PM + T17 UX Designer + R5 FE
related: ADR-032 (ResolvedCity), ADR-033 (/trips 라우트), 사이클 I 백로그
---

# ADR-034: ResolvedTrip 뷰 객체 + city→trip 역방향 CTA (사이클 J)

## 컨텍스트

사이클 I(ADR-033) 종료 시 R1 CTO가 두 백로그 등록:
1. BottomNav 컴포넌트 추출 — 트리거: 3번째 페이지 추가 시 (이번 사이클 미해당)
2. **ResolvedTrip 뷰 객체 도입 — 트리거: city→trip 역방향 칩 추가 시점** ⬅ 이번 사이클 트리거 충족

ADR-032에서 정착한 `ResolvedCity` 패턴(feedback_resolved_view_pattern):
- raw seed는 optional 필드
- view 객체(`Resolved*`)는 required 필드 보장
- 화면은 항상 resolved 사용

trip도 동일 정규화 필요. 사이클 I `TripCardData`는 ResolvedTrip의 부분집합으로 재정의해 view 객체 일원화.

## 결정

### 1. ResolvedTrip 타입

```ts
export interface ResolvedTrip {
  trip: Trip;                  // raw seed
  city: ResolvedCity;          // ADR-032 답습 (country merged)
  items: ItineraryItem[];      // trip의 모든 일정
  itemCount: number;           // items.length 캐싱
  verifiedCount: number;       // evidence.sources.length > 0 인 item 수
}
```

### 2. 신규 모듈 — `lib/services/resolved-trip.ts`

```ts
export function resolveTrip(tripId: string): ResolvedTrip | null;
export function resolveTripsByCityCode(cityCode: string): ResolvedTrip[];
```

`lib/seed/`는 raw seed 책임, `lib/services/`는 view/aggregation 책임. ADR-032의 ResolvedCity가 cities/index.ts에 있는 건 단순 merge라 예외.

### 3. 사이클 I `TripCardData` 리팩터

```ts
// 변경 전
export interface TripCardData { kind: "trip"; trip: Trip; city: City | null; itemCount: number; verifiedCount: number; }

// 변경 후 — 카드용 부분집합 (city는 ResolvedCity로 강화)
export interface TripCardData {
  kind: "trip";
  resolved: ResolvedTrip;
}
// 기존 필드는 resolved.trip / resolved.city / resolved.itemCount / resolved.verifiedCount로 접근
```

호출부 변경 최소 — `c.trip` → `c.resolved.trip`, `c.city` → `c.resolved.city` 등 경로만 갱신. 사이클 I `app/trips/page.tsx`의 `TripCard` 컴포넌트만 수정.

### 4. CTA — `/city/[slug]` Hero 아래 큰 카드

- 위치: Hero 영역 바로 아래 (chip row 위)
- 콘텐츠: 도시명 · N박 N+1일 · N 일정 · "AI 검증 N곳" 뱃지 + "일정 보기 →" 버튼
- trip 있는 city (PQC/DAD/SGN/HAN/NHA): 큰 카드 노출
- trip 없는 city (HOI): 절충안 — amber 톤 안내 카드 ("이 도시 일정은 준비 중이에요" + "다른 도시 일정 둘러보기 →" → /trips)

### 5. 양방향 완성

- 사이클 I (단방향 trip→city): trip 상세 Hero에 "도시 가이드 →" 칩
- 사이클 J (역방향 city→trip): city 가이드 Hero 아래 큰 카드
- → trip ↔ city 양방향 탐색 동선 완성

## Prisma 승격 트리거 (미래)

다음 중 하나 발생 시 정적 lib → Prisma 승격:
1. **trip이 다중 city를 갖는 시점** (다도시 여행, 예: 호치민→다낭 연계)
2. **ResolvedTrip 호출부 캐시 hot path 화** (예: 5+ 라우트에서 호출)

## 거부된 대안

### A) ResolvedTrip 도입 미루기 (사이클 J에선 함수만)
- 백로그 부채 누적
- trip→city / city→trip 양방향 자산이 만들어지는 시점이 정규화 적기

### B) TripCardData를 그대로 두고 ResolvedTrip 별도 신설
- 두 view 객체 공존으로 정합성 부담↑
- feedback_resolved_view_pattern "view 일원화" 위반

### C) HOI에 CTA 미노출 (자연 차단)
- 시나리오 3 이탈 방치 (왜 일정이 없는지 설명 부재)
- 사이클 I /trips 자산을 활용한 유도 동선 손실

### D) "곧 추가됩니다" 약속 표현
- 데드라인 명시 없으면 신뢰↓
- 절충안: "준비 중" 중립 표현으로 약속 부담 회피

### E) Sticky bottom CTA
- 모바일 420px에서 chip row와 시각 경합
- BottomNav 패턴(사이클 I)과 충돌 위험

## 영향

### 코드
- `lib/services/resolved-trip.ts` 신규 (~85행)
- `lib/services/trips-listing.ts` 수정 — TripCardData를 ResolvedTrip 기반으로
- `app/trips/page.tsx` 수정 — TripCard 컴포넌트 필드 경로 갱신 (`c.trip` → `c.resolved.trip` 등)
- `app/city/[slug]/page.tsx` 수정 — Hero 아래 CTA 카드 추가 (~50행)
- 신규 의존성 ❌ / 마이그레이션 ❌ / 새 mutation ❌ / 디자인 토큰 변경 ❌

### 테스트
- 신규: `tests/unit/resolved-trip.test.ts` — 6건 이상
  - resolveTrip 5건 매칭 + null 케이스
  - resolveTripsByCityCode VN 도시 매칭 + HOI 빈 배열
  - verifiedCount 일치
  - city merge 결과 ResolvedCity 일치

### 사용자 화면
- city 페이지에 일정 CTA 추가 (양방향 완성)
- HOI는 amber 안내 카드 + /trips 유도

## 검증 기준

- `resolveTrip(tripId)` 5 trip 모두 매칭 + 알 수 없는 ID null
- `resolveTripsByCityCode("PQC")` ≥ 1건 (PQC trip)
- `resolveTripsByCityCode("HOI")` = 0건 (city only)
- `TripCardData.resolved` 경로로 사이클 I `/trips` 페이지 동작 무파괴
- vitest ≥ 6건 신규 + 사이클 I trips-listing 10건 회귀 PASS
- TypeScript `tsc --noEmit` 0 에러
