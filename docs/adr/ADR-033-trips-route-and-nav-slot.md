---
id: ADR-033
title: /trips 라우트 신설 + Bottom Nav 4슬롯 (정보 아키텍처)
status: Accepted
date: 2026-05-02
decider: R1 CTO
proposer: T8 PM + T17 UX Designer + T19 Librarian + R5 FE
related: ADR-032 (Country 모델), ADR-024 (ShareLink), 사이클 D (다낭 시드), 사이클 G 시리즈 (베트남 6도시)
---

# ADR-033: /trips 라우트 + Bottom Nav 4슬롯 (사이클 I)

## 컨텍스트

사이클 D~H 완료 시점에 베트남 5 demo trip(PQC·DAD·SGN·HAN·NHA) + 6 city 가이드(+ HOI city only) 시드가 누적됨. 그러나 다중 trip 탐색 동선이 부재하다:

- 홈(/) Hero는 푸꾸옥 고정. "다른 도시 둘러보기" 카드 4개로 부분 노출하지만 **/trips 라우트가 없음**.
- 사용자는 trip → city 가이드 또는 trip → 다른 trip 사이를 자연스럽게 오갈 수 없음.
- 다음 사이클에서 trip 추가 시 홈 hero를 매번 갱신하거나 카드 추가로만 대응 → 정보 아키텍처 부재.

## 결정

### `/trips` 라우트 신설 — 도시 단위 탐색 허브

#### 1. 카드 정보 (4개 메트릭)

| 필드 | 표시 |
|------|------|
| 도시·국가코드 | "다낭 · VN" |
| 기간 | "3박 4일" |
| 일정수 + 검증된 곳 | "12 일정 · AI 검증 12곳" |
| 검증 뱃지 | `<Badge tone="success">AI 검증 N곳</Badge>` |

D-day, OTA 매칭률은 카드 노이즈로 제외. (D-day는 demo trip이라 의미 약함, OTA 매칭률은 마케팅 지표).

#### 2. UX 패턴 — sticky 칩 필터 + 1열 리스트

- 상단 sticky 칩: `[전체 / 베트남 / 곧 출시]` (확장 시 country 필드 활용)
- 1열 리스트 카드 (그리드 2열은 420px에서 정보 압축 심함)
- 쿼리 파라미터: `/trips?filter=VN` — useState 0개, 캐시 친화적

#### 3. 카드 분기 (3종)

| 종류 | 본체 Link | secondary | 시각 |
|------|-----------|-----------|------|
| trip 있는 베트남 도시 (5) | `/itinerary/[tripId]` | "도시 가이드 →" → `/city/[slug]` | 기본 |
| city only (HOI 1) | `/city/[slug]` 직행 | (없음) | `tone="amber"` "도시 가이드만" 뱃지 |
| ComingSoon (BKK·TYO 2) | (Link 없음, div) | (없음) | `opacity-60` + "준비 중" 뱃지 |

a-tag nesting 회피 — 본체는 카드 전체 Link, secondary는 카드 외부 푸터 영역.

#### 4. Bottom Nav 4슬롯 변경

- 기존: `Home / Itinerary / Profile` (3슬롯)
- 변경: `Home / Trips / Itinerary / Profile` (4슬롯)
- 적용 범위: **홈(/)과 /trips 두 페이지만**. 다른 페이지(/city·/translate·/travel 등)는 헤더 뒤로가기로 동작 (현 정책 유지).

#### 5. 홈 "다른 도시" 섹션 헤더에 "전체 보기" 링크 추가

기존 카드 4개 노출은 유지. 섹션 헤더 우측에 `→ 전체 보기` 텍스트 링크 → /trips 진입.

#### 6. trip 상세 헤더 city 칩 (단방향 탐색)

`/itinerary/[id]/page.tsx` Hero 영역에 city 가이드가 있는 trip이면 `<Link href="/city/[slug]">도시 가이드 →</Link>` 칩 추가.
city → trip 역방향은 다음 사이클로 분리 (이번 사이클은 trip→city 한 방향 우선 검증).

## 거부된 대안

### A) 그리드 2열 카드
- 420px 너비에서 검증 뱃지·일정수·국가코드 4개 메트릭이 줄바꿈 발생
- T17 검토: 1열 리스트가 정보 밀도와 가독성 모두 우위

### B) Bottom Nav 변경 없이 홈 헤더 링크만
- "탐색 허브" 발견성이 홈 첫 화면에만 묶임
- v3에서 trip 10+ 되면 어차피 Nav 추가 필요 → 미리 도입

### C) HOI(city only) /trips에서 제외
- "trip 단위" 의미는 깔끔하지만 사용자가 도시 가이드 단독 콘텐츠를 발견할 진입점이 사라짐
- amber "도시 가이드만" 뱃지로 시각 차별화하면 의미 모순 완화

### D) BKK·TYO 완전 차단
- 로드맵 신호(곧 출시) 손실
- opacity-60 + Link 제거 disabled 카드로 명확히 구분 → "탐색 가능" 신뢰 깨짐 우려는 최소화

### E) trip ↔ city 양방향 동시 도입
- 회의 R2/T8 우선순위 판단: 이번 사이클은 trip→city 단방향만 검증
- city→trip 역방향 CTA는 별도 회의 후 다음 사이클

## 영향

### 코드
- `app/trips/page.tsx` 신규 (~180행, SSR, useState 0개)
- `app/page.tsx` Bottom Nav 슬롯 1개 추가 + "다른 도시" 섹션 "전체 보기" 링크
- `app/itinerary/[id]/page.tsx` Hero 영역 city 칩 추가
- 신규 의존성 ❌ / 마이그레이션 ❌ / 새 mutation ❌ / 디자인 토큰 변경 ❌

### 테스트
- 신규: `tests/unit/trips-listing.test.ts` — 도시 분류·검증 카운트·country 필터 분기 (≥5 케이스)

### 데모 모드
- 영향 없음 (정적 시드, DB 미사용)

### 사용자 화면
- /trips 신규 진입점 (Bottom Nav 4번째 + 홈 섹션 "전체 보기")
- trip 상세에 도시 가이드 1탭 진입

## 검증 기준

- `listDemoTrips()` 5건이 trip 카드로 모두 노출
- HOI는 amber "도시 가이드만" 카드로 분리 표시
- BKK·TYO는 opacity-60 disabled 카드로 노출 (Link 미동작)
- country 필터 `?filter=VN` 시 베트남 6도시(5 trip + HOI)만 노출
- Bottom Nav "Trips" active 상태가 /trips에서 purple 강조
- vitest 5건 이상 통과
- TypeScript `tsc --noEmit` 0 에러
