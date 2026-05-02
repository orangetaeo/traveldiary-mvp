---
id: ADR-028
title: Google Maps Embed API — 인라인 지도 (A1)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T17 UX + T10 API
related: ADR-018 (Google Places), ADR-023 (deeplink)
---

# ADR-028: Google Maps Embed API (사이클 7.5 — A1 인라인 지도)

## 컨텍스트

- 사이클 7 ADR-023: Maps/Uber/Grab deeplink만. A1 인라인 지도는 별도.
- A1 인라인 지도는 시각 정체성 강화 — 일정 상세에서 위치를 즉시 확인.
- Google Maps **JavaScript API**는 클라이언트 키 노출 부담 + 비용 ↑.
- **Google Maps Embed API**가 더 단순:
  - iframe `src` 한 줄
  - 무료 (rate limit 없음)
  - 키 노출되어도 비용 영향 0 (Embed 전용 키 가능)

## 결정

### A. 신규 의존성 0개

네이티브 iframe + Embed API URL.

### B. Embed URL 패턴

```
https://www.google.com/maps/embed/v1/place
  ?key=<NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY>
  &q=<lat>,<lng>
  &zoom=15
  &maptype=roadmap
```

다른 모드:
- `directions` — 길찾기 (출발지·도착지 명시 필요, 5b-3+ 사용자 위치 통합 시)
- `view` — 가장 단순한 좌표만

### C. 신규 환경변수 — `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`

`NEXT_PUBLIC_*` 접두사로 클라이언트 노출 허용. 이유:
- Embed API는 **HTTP referrer 제한**으로 보안 (Google Cloud Console에서 도메인 화이트리스트)
- 키 노출되어도 다른 도메인에서 호출 불가
- 5b-3 `GOOGLE_PLACES_API_KEY`(server-only)와 별 키 (Embed 전용)

선택: 같은 키 재사용 가능 (Embed + Places 둘 다 활성). 비용 통제 위해 별 키 권장 (사용자 액션 절차에 명시).

### D. 컴포넌트 — `ItineraryMap.tsx`

```typescript
interface Props {
  lat: number;
  lng: number;
  placeName?: string;
  height?: number; // 기본 240
}
```

키 미설정 시 → "지도 미설정" placeholder 카드 (graceful degradation).
좌표 (0,0) → 미노출 (사이클 10 사용자 추가 일정 호환).

### E. UI 통합 — Item Detail Page

길찾기 섹션 위에 인라인 지도 추가. 이미 사진 갤러리 + EvidencePanel + Details Grid + 길찾기 deeplink 있음 → 지도는 길찾기 섹션 바로 위 (사용자가 위치 보고 → 길찾기 클릭 흐름).

### F. 보안 (T16)

- HTTP referrer 화이트리스트 필수 (Google Cloud Console):
  - https://traveldiary-mvp-production.up.railway.app/*
  - http://localhost:3000/*
- 키가 GitHub에 노출돼도 다른 도메인에선 차단

### G. AuditLog

지도 view는 비용 0이라 audit 미기록.

### H. 데모 fallback

`NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` 미설정 →
```
<div className="bg-surface-soft border border-divider rounded-xl p-td-md text-center">
  <span className="material-symbols-outlined text-ink-mute">map</span>
  <p className="text-td-meta text-ink-soft">지도 미설정</p>
</div>
```

## 대안

### 대안 1 — Maps JavaScript API (비채택)
- 비용 높음 ($7/1000 loads)
- 클라이언트 키 노출 + Loader 복잡

### 대안 2 — OpenStreetMap (Leaflet) (비채택)
- 의존성 추가 (leaflet ~150KB)
- 한국어 지명 부족

### 대안 3 — 사용자 GPS 기반 directions Embed (비채택, 7.5+)
- Geolocation 권한 필요 (5b-4 ADR-017과 결합)
- 7.5는 단순 place 모드만, directions는 후속

## 영향

### 긍정
- 시각 정체성 — 일정 상세에서 위치 즉시 확인
- 무료 Embed API — 비용 0
- 신규 의존성 0개

### 부정
- 사용자 액션 1건 (Google Cloud Console에서 Embed API 활성 + referrer 제한)
- iframe 로딩 ~500ms

## 사용자 직접 액션

```
1. Google Cloud Console (5b-3에서 이미 가입)
2. APIs & Services → Library → "Maps Embed API" 활성
3. APIs & Services → Credentials → 기존 API 키 사용 또는 새 키
4. (보안) 키 제한:
   - HTTP referrers:
     · https://traveldiary-mvp-production.up.railway.app/*
     · http://localhost:3000/*
   - API restrictions: Maps Embed API
5. Railway Variables:
   - NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=<키>
6. (자동) 재배포 → 일정 상세에 인라인 지도 노출
```

## 검증 통과 기준

- [ ] tsc + build 통과
- [ ] 키 미설정 → "지도 미설정" placeholder (회귀 0)
- [ ] 키 설정 → iframe 로드 + 좌표 핀
- [ ] 좌표 (0,0)인 사용자 추가 일정 → 지도 미노출

## 사인오프

R1 ✅ · T10 ✅ · T16 ✅ · T17 ✅
