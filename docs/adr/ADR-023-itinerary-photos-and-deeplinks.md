---
id: ADR-023
title: ItineraryItem.photos 필드 + Google Maps/Uber/Grab deeplink (A3+D1+D2)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T3 Evidence Collector + T17 UX
related: ADR-013 (마이그레이션 운영), ADR-022 (마이그레이션 0002), v2 §4 Place 모델
---

# ADR-023: ItineraryItem.photos + deeplink (A3·D1·D2)

## 컨텍스트

- v2 비전 §4 Place 모델 (별도 풀)은 도입 부담 큼 — 푸꾸옥 시드 24곳을 Place로 이전하는 데이터 마이그레이션 필요.
- 사이클 7 핵심 가치는 *시각 정체성*(A3 이미지) + *deeplink*(D1 Maps, D2 우버/그랩) 2가지.
- A1 인라인 지도는 Google Maps JS API 키 필요 → 사용자 액션 발생 → 별도 사이클로 분리.
- ItineraryItem에 photos 필드만 추가하는 게 가장 단순 (Place 모델은 사이클 7.5+).

## 결정

### A. 신규 의존성 0개

이미지는 외부 URL (시드는 picsum.photos placeholder), deeplink는 URL 생성만.

### B. ItineraryItem.photos 필드 추가

```prisma
model ItineraryItem {
  // ... 기존
  photos       String[]  @default([])  // 외부 URL 배열
}
```

PostgreSQL TEXT[] native array. 0~5장 큐레이션 권장.

### C. 마이그레이션 0003

```sql
ALTER TABLE "ItineraryItem"
    ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
```

기존 행은 빈 배열로 자동 채움. 다운타임 0.

### D. 시드 photos (picsum.photos placeholder)

24곳 푸꾸옥 시드에 카테고리별 picsum.photos URL 1~2장씩.
실제 큐레이션 이미지는 사이클 7.5+ 또는 사이클 8.5(다낭 시드)에서 일괄 보강.

### E. Deeplink 헬퍼 (lib/utils/deeplinks.ts)

```typescript
googleMapsUrl(lat, lng, name?) → "https://www.google.com/maps/search/?api=1&query=..."
uberDeeplink(lat, lng) → "https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=...&dropoff[longitude]=..."
grabDeeplink(lat, lng, name?) → "grab://open?screenType=BOOKING&dropOffLatitude=...&dropOffLongitude=..."
phoneDial(phone) → "tel:..."
```

모든 함수 순수 함수, server/client 양쪽 사용 가능.

### F. UI 통합

`app/itinerary/[id]/item/[itemId]/page.tsx`에 추가:
- Hero 영역에 photos[0] 노출 (있을 때만, 카테고리 그라디언트 fallback)
- Details 섹션 끝에 "길찾기" 섹션 — Google Maps · Uber · Grab 3 버튼

`components/itinerary/ItineraryView.tsx` 카드는 사이클 7에서 변경 X (디자인 일관성, 사이클 7.5+에서 검토).

### G. 기존 시드 photos 누락 처리

photos 배열이 비어있을 때:
- Hero는 카테고리 그라디언트만 (5b 옵션 C 답습)
- Hero 영역에 이미지 자리 placeholder 노출 X

### H. mutation 영향

- 사이클 10 addItineraryItem는 photos 미지원 (사용자가 직접 추가하는 일정은 photos 빈 배열). 사이클 7.5+에서 옵션 추가 검토.
- reorderItineraryItems는 photos 영향 X.

## 대안

### 대안 1 — Place 모델 별도 도입 (비채택)
- 푸꾸옥 시드 24곳 데이터 마이그레이션 필요 → 부담 ↑
- 사이클 7 가치 대비 비용 큼

### 대안 2 — A1 인라인 지도 포함 (비채택)
- Google Maps JS API 키 → 사용자 직접 액션 발생
- 5b-3 Google Places API와 별도 키 필요
- 사이클 7.5로 분리

### 대안 3 — 이미지를 Json 컬럼으로 (비채택)
- String[] native array가 더 명확한 타입

### 대안 4 — Unsplash API (비채택)
- Rate limit 부담
- Picsum placeholder가 데모 단계엔 충분 (5b 답습)

## 영향

### 긍정
- 시각 정체성 첫 활성 — 일정 상세 화면이 비주얼하게 풍부해짐
- Maps/Uber/Grab deeplink — 모바일 사용자 즉시 행동 가능
- 마이그레이션 0003 — 0002 패턴 답습으로 운영 검증

### 부정
- placeholder 이미지 (picsum) — 진짜 큐레이션은 후속
- 인라인 지도 미포함 — A1 별도 사이클

### 트레이드오프
- Place 별도 모델 미도입 — v2 비전 §4 부분 채택. 사이클 7.5+에서 보강 가능.

## 사용자 직접 액션

```
없음 — Railway 자동 배포 + 자동 마이그레이션 0003. 라이브 즉시 사용 가능.
```

## 검증 통과 기준 (STEP 4)

- [ ] tsc + build 통과
- [ ] prisma generate 통과
- [ ] 라이브: 마이그레이션 0003 자동 적용 → ItineraryItem.photos 컬럼 존재
- [ ] 일정 상세 페이지 → 이미지 노출 또는 카테고리 그라디언트 fallback
- [ ] 길찾기 버튼 클릭 → 외부 앱/탭 열림
- [ ] 데모 trip(demo-trip-phu-quoc) 정상 동작 (시드 photos 활용)

## 사인오프

R1 ✅ · T3 ✅ · T14 ✅ · T17 ✅ · T13 ✅
