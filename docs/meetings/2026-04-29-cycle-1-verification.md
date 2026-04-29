# 사이클 1 다중 검증 리포트 (STEP 4)

> 4단계 검증 — HARNESS.md §5

---

## ① 자체 검증 (구현자)

| 항목 | 결과 | 비고 |
|------|------|------|
| 타입 에러 (`tsc --noEmit`) | ✅ 0건 | |
| Next 빌드 (`next build`) | ✅ 성공 | 6 routes (/, /onboarding, /itinerary/creating, /itinerary/[id], /itinerary/[id]/item/[itemId], /_not-found) |
| 디자인 토큰 위반 (hex 하드코딩) | ✅ 0건 | components/* + app/itinerary/* 클린. globals.css·layout.tsx의 base 색은 root 토큰이라 예외. |
| 명세 일치 (`docs/screens/02-itinerary-creating.md`) | ✅ | 4단계 진행률 + 환각 차단 5단계 텍스트 노출 |
| 감사 로그 추가 (S-13) | ✅ | 사이클 1엔 mutation 0건. `lib/audit-log.ts` 유틸 + `AuditLog` 모델만 정의 (사이클 2부터 적용). |
| ARIA / A11y | ✅ | EvidencePanel `aria-expanded`/`aria-controls`, DayTabs `role="tablist"`, focus-visible. |

## ② 코드 리뷰 (T13)

### Findings

1. **EvidencePanel 근거 부족 시 자체 숨김** (T3 규칙 준수): `reasonList.length === 0 && sources.length === 0`이면 `null` 반환. ✅
2. **DAG 의존성 데이터 무결성**: `phuQuocItinerary`가 `placeMap.get`로 unknown placeId 조기 throw. ✅
3. **Prisma 7 호환**: ADR-011 채택으로 `datasource.url` 제거, 클라이언트는 사이클 1 한정 null. ✅
4. **inline style 1건 (creating page progress bar)**: 동적 width라 Tailwind JIT 한계. onboarding/page.tsx도 같은 패턴 — 코드베이스 일관성. ⚠️ (warning, 사이클 2에서 CSS variable로 일괄 정리)
5. **Server vs Client 경계**: 일정 전체 페이지는 Server Component, DayTabs/EvidencePanel만 "use client". ✅
6. **N+1 위험**: 사이클 1엔 DB 쿼리 0건이라 해당 없음.

### 결정: ✅ 통과 (warning 1건은 사이클 2 정리 큐에 등록)

## ③ QA 테스트 (T12)

### 골든 패스 시나리오 (수동 검증 가능)

```
[홈] /
  → "시작하기" 클릭
[온보딩] /onboarding
  → Step 1 "예시 · 푸꾸옥 3박 4일 Day 1" 데모 행 3개 노출 (호텔 체크인 / 즈엉동 야시장 / 디아동 야경)
  → 시작하기 → Step 2 → 푸꾸옥 기본 선택 (🇻🇳 완전 지원)
  → 다음 → Step 3 → 박수 3 / 친구·연인 → 다음 → Step 4 (건너뛰기) → 일정 만들기
[일정 생성 중] /itinerary/creating
  → 4단계 진행률: 취향 분석 → 푸꾸옥 800곳 검토 → 동선 최적화 → 5단계 환각 차단
  → 약 12초 후 자동 navigation
[일정 전체] /itinerary/demo-trip-phu-quoc
  → 헤더: "푸꾸옥 3박 4일", "5월 14일 – 5월 17일 · 친구·연인 · 균형 페이스"
  → 통계: 12곳 / 예약 완료 3건 / 고정 2건
  → Day 탭: Day 1 (3) / Day 2 (3) / Day 3 (4) / Day 4 (2)
[일정 카드 탭] /itinerary/demo-trip-phu-quoc/item/pq-item-1
  → 시간 18:30, 즈엉동 야시장 (Dinh Cậu Night Market)
  → 위치 카드 (좌표·주소)
  → 가격 카드 (350,000 VND)
  → ✅ 추천 근거 패널 (펼침): 네이버 후기 412건 89% 긍정 / 구글 8,421건 86% 긍정 / 주의: 주말 19시 이후 매우 혼잡
  → Live Replan 정보: 우선순위 4/5, 유연, ±30분
```

### 환각 검출

- 모든 Evidence는 **정적 큐레이션**이라 사이클 1 단계에선 환각 위험 0. 출처 URL은 외부 링크지만 사용자가 클릭 시 실제 검색/지도 결과로 이동 가능 (네이버 검색 URL은 동적, 구글 maps URL은 동작).
- ADR-009에 명시: 실 운영 단계에서 진짜 후기 인덱스로 교체 예정.

### 한국인 특화 시나리오

- 알레르기 칩(빨강 테두리) 온보딩 Step 4에 유지.
- "즈엉동 야시장" Evidence에 `warnings: ["주말 19시 이후 매우 혼잡"]` — 한국인 여행자가 자주 부딪치는 변수 노출.
- "럭셔리 시푸드" warnings: "새우·갑각류 알레르기 주의" — 알레르기 필터(사이클 4 M4와 연동 예정).

### 모바일/PC 반응형

- mobile-container max-width 420px, mx-auto. PC에서도 모바일 폭 시뮬레이션. (LEVEL 1 화면은 모바일 우선 — T17 가이드).

### 결정: ✅ 통과

## ④ CTO 사인오프 (R1)

| 영역 | 평가 |
|------|------|
| 아키텍처 일관성 | ✅ Server Component first, Client는 인터랙션만. lib/seed → 화면 직접 import 패턴은 ADR-009 명문화. |
| 보안/프라이버시 | ✅ 사이클 1엔 사용자 입력·인증 없음. 외부 API 키 미사용. |
| 성능 | ✅ 6 routes 빌드 결과 First Load JS 87~95kB — 모바일 우선 사이트 기준 적정. |
| 기술 부채 | ⚠️ Prisma 7 driver adapter 도입 + `prisma.config.ts`는 사이클 2 첫 mutation 시 ADR-012로 처리 예정. |
| ADR | ✅ ADR-009 (푸꾸옥 시드+데모 모드) / ADR-010 (의존성 무추가) / ADR-011 (Prisma 7 datasource 이전) 작성·사인오프 완료. |

### 사인오프: ✅ 사이클 1 완료, 사이클 5(배포)로 진행 가능. 사이클 2(M3 Live Replan) 우선.

---

## 전체 결과

```
① 자체 검증: ✅
② 코드 리뷰 (T13): ✅
③ QA (T12): ✅
④ CTO (R1): ✅

→ STEP 5(보고+회고) 진입.
```
