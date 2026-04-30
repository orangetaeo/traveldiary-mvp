---
id: ADR-018
title: Google Places API 통합 + EvidenceCache 활성화 (검증 1~2단계)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T10 API Specialist + T4 Validation Engineer + T16 Security Engineer
related: ADR-009 (데모 모드), ADR-013 (mutation 패턴), S-03 (place verification), S-11 (api security), S-13 (audit log)
---

# ADR-018: Google Places API + EvidenceCache (검증 1~2단계)

## 컨텍스트

- 사이클 5b-1/5b-2까지 mutation Server Action + 낙관적 동시성 패턴 안착.
- M1 추천 근거 패널의 evidence는 푸꾸옥 시드 정적 큐레이션 (sources: naver/instagram).
- v2 비전 차별화 4축 중 "환각 차단 검증 레이어"는 5단계 중 0단계 실 동작 (모든 데모).
- Prisma 스키마에 `EvidenceCache` 모델은 이미 존재 (사이클 1 — Phase 1 비용 절감용).
- 사용자 결정 (사이클 6): 5b 인프라 → 5b-3 Google Places 우선 진행.

## 결정

### A. 신규 의존성 0개

`@googlemaps/google-maps-services-js` 같은 SDK는 **불채택**. 내장 `fetch`로 충분.
- 근거: 두 엔드포인트만 호출 (Find Place from Text, Place Details). SDK는 종속성·번들 크기·업데이트 부담 비례.
- ADR-010 정신 유지 — 사이클별 의존성 추가 시 명시적 ADR.

### B. Google Places API 호출 시퀀스

```
verifyPlace(name: string, location?: {lat,lng}):
  1. Find Place from Text API
     - input=name, inputtype=textquery, fields=place_id,formatted_address,name,business_status
     - locationbias=circle:5000@lat,lng (있을 때)
     - 캐시 키: hash(name + location), platform: "google.find_place", TTL 1시간
  2. Place Details API (1단계 결과의 place_id)
     - fields=name,formatted_address,opening_hours,business_status,rating,user_ratings_total
     - 캐시 키: place_id, platform: "google.details", TTL 24시간
  3. ValidationLite 도출:
     - placeExists = (find_place status === "OK" && candidates[0])
     - operatingStatus =
         business_status === "OPERATIONAL"
           ? (opening_hours?.open_now ? "open" : "closed")
           : "closed"
```

### C. EvidenceCache 활용

```typescript
model EvidenceCache {  // 이미 사이클 1 schema에 있음
  id        String  @id @default(cuid())
  placeId   String  // find_place는 query hash, details는 place_id
  platform  String  // "google.find_place" | "google.details"
  data      Json
  fetchedAt DateTime @default(now())
  expiresAt DateTime
  @@unique([placeId, platform])
}
```

- `expiresAt`을 비교해서 만료 확인 — DB 자동 폐기는 lazy (호출 시점 검사)
- upsert로 동시성 안전 (`@@unique([placeId, platform])`)
- 사이클 5b-3 단계엔 expired row 정리 cron 미도입 (사이클 7 운영 단계에서)

### D. 데모 fallback (ADR-009 패턴 답습)

```typescript
GOOGLE_PLACES_API_KEY 미설정 →
  verifyPlace 즉시 { mode: "demo", placeExists: null, operatingStatus: null } 반환
  외부 호출 0건, EvidenceCache 미쓰기, audit log 미쓰기
```

→ 라이브에서 키 누락 상태로 배포해도 회귀 0. 시드 evidence 그대로 표시.

### E. Privacy & Security (T16)

| 항목 | 정책 |
|------|------|
| API 키 위치 | Railway Variables `GOOGLE_PLACES_API_KEY` (서버 only) |
| 클라이언트 노출 | ❌ `NEXT_PUBLIC_*` 절대 사용 안 함 |
| `lib/services/google-places.ts` | `import "server-only"` 강제 (클라이언트 빌드 차단) |
| 검색어 로그 | audit log metadata.query에 평문 기록 (분석/디버깅용, 사용자 1인 데모라 OK. 사이클 11 OAuth 후 hash 도입 검토) |
| 사용자 위치 | 시드 trip의 destination 좌표만 (사용자 GPS는 5b-4부터) |
| API 키 회전 | 분기 (S-11) |
| Rate Limit | 5b-3은 함수 내부 dedup만. 분산 RL은 5b-5 (Naver·Anthropic 추가 시 일괄) |

### F. 응답 형태 — discriminated union (5b-2 표준 패턴 답습)

```typescript
export type VerifyPlaceResult =
  | { mode: "demo" }                    // API 키 미설정
  | { mode: "verified"; placeExists: true;  operatingStatus: "open"|"closed";
       placeId: string; rating?: number; userRatingsTotal?: number; cached: boolean }
  | { mode: "not_found"; placeExists: false; cached: boolean }
  | { mode: "error"; code: "google_api_error"|"network"|"internal"; message?: string };
```

### G. UI 통합

- `app/itinerary/[id]/item/[itemId]/page.tsx`에 검증 배지 표시
- 페이지 진입 시 자동 verifyPlace 호출 (Server Component) — 캐시 24h로 비용 통제
- 배지 텍스트:
  - `mode: "verified" + open` → "✓ Google 검증 — 운영 중 ★ 4.6 (387건)"
  - `mode: "verified" + closed` → "⚠ Google — 임시 휴업 / 운영 외 시간"
  - `mode: "not_found"` → "⚠ Google에서 장소 미확인"
  - `mode: "demo"` → "검증 미실행 (데모 모드)"
  - `mode: "error"` → 무표시 (회귀 안전)
- "재검증" 버튼은 5b-5에서 도입

### H. AuditLog payload (S-13)

```typescript
action: "evidence.gathered"
resource: "ItineraryItem"
resourceId: item.id
before: null
after: { placeExists, operatingStatus, rating, userRatingsTotal, placeId }
metadata: {
  source: "google",
  query: name,
  cached: boolean,
  fetchDurationMs: number,
  // 실패 시:
  error?: string,
}
```

audit log 실패는 비즈니스 막지 않음 (S-13 try/catch 격리).

### I. 검증 캐시 페이지 진입 시 자동 호출 안전성

- Server Component에서 직접 `verifyPlace` 호출 — useTransition·Server Action 불필요
- API 키 + DB 모두 있을 때만 실 호출. 둘 중 하나라도 없으면 `mode: "demo"` 짧게 반환
- 캐시 hit 시 외부 호출 0건 + DB 단순 SELECT만 → 페이지 응답 시간 영향 무시할 수준
- 실패 시 `mode: "error"` 반환, UI는 시드 evidence 그대로

## 대안

### 대안 1 — Google Maps SDK 채택 (비채택)
- 두 엔드포인트만 호출하므로 SDK 종속성 비효율. fetch가 더 명확.

### 대안 2 — 시드 24곳에 place_id baked-in (비채택)
- 시드 외 사용자 trip은 어차피 런타임 호출 필요 → 일관성 ↓
- 24곳 수동 검색 작업 부담

### 대안 3 — 5단계 전체 (placeExists~priceVerified) 사이클 5b-3에서 (비채택)
- distance/price는 Directions API + OTA API 추가 → 범위 폭증, ADR 다중 필요
- 5b-3은 1~2단계 한정, 3~5는 5b-5로 분리

### 대안 4 — 클라이언트에서 직접 호출 (비채택)
- API 키 노출 — Security 절대 금지 (S-11)

### 대안 5 — Naver Local API 우선 (비채택)
- 한국어 후기 가치 높지만 5b-3은 환각 차단(검증) 우선. Naver는 evidence 보강 (5b-5).

## 영향

### 긍정
- M1 추천 근거 패널이 처음으로 실 외부 데이터를 노출 — 환각 차단 차별화 첫 동작
- EvidenceCache 활성화 — Phase 1 비용 절감 패턴 검증
- 5b-2 mutation 표준 패턴 검증 (Server Action discriminated union return)

### 부정
- API 키 누락 시 검증 미실행 — 사용자가 Railway Variables 설정 필요
- Google API quota 비용 (free tier $200/월) — 캐시 24h로 압축

### 트레이드오프
- 페이지 진입 시 자동 호출은 비용 vs 사용자 경험. 캐시로 균형.

## 사용자 직접 액션

```
1. Google Cloud Console (https://console.cloud.google.com)
2. 새 프로젝트 또는 기존 프로젝트 선택
3. APIs & Services → Library → "Places API" 활성화
4. APIs & Services → Credentials → Create credentials → API key
5. (보안) API key 제한:
   - Application restrictions: HTTP referrers
     → traveldiary-mvp-production.up.railway.app/*
     → localhost:3000/* (개발용)
   - API restrictions: Places API only
6. Railway 대시보드 → 프로젝트 → Variables 탭
7. 추가: GOOGLE_PLACES_API_KEY=<생성된 키>
8. (자동) Railway 재배포 → /api/health에서 cycle 5b-3 확인
9. 라이브 사이트에서 일정 상세 진입 → 검증 배지 노출
```

## 검증 통과 기준 (STEP 4)

- [ ] `npx tsc --noEmit` 0
- [ ] `npx next build` 성공
- [ ] `lib/services/google-places.ts`에 `import "server-only"` 명시
- [ ] API 키 미설정 로컬 빌드 → `mode: "demo"` 반환, 회귀 0
- [ ] 라이브 + API 키: 페이지 진입 → EvidenceCache row 생성 (`google.find_place`, `google.details`)
- [ ] 라이브 + API 키: AuditLog `evidence.gathered` 행 적재
- [ ] 두 번째 진입 시 `cached: true` (캐시 hit, 외부 호출 0건)
- [ ] API 키 invalid: `mode: "error"`, 시드 evidence 그대로

## 사인오프

R1 ✅ · T3 ✅ · T4 ✅ · T10 ✅ · T16 ✅ · T13 ✅
