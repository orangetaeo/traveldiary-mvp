---
id: ADR-035
title: 응급 정보 서브 라우트 + 분실 가이드 + CityContextStrip 항상 노출
status: Accepted
date: 2026-05-02
decider: R1 CTO
proposer: T8 PM + T16 Security + T17 UX Designer
related: ADR-032 (Country 모델), ADR-022 (M6 모델), 사이클 8 M5 (City), CLAUDE.md M5 정의
---

# ADR-035: M5 응급/실용/도시 컨텍스트 강화 (사이클 P)

## 컨텍스트

CLAUDE.md 차별화 축 M5 = 응급/실용/도시 컨텍스트. 한국인 자유여행자 안전망. 사이클 8 (City 모델) + 사이클 H (Country 정규화) + 사이클 K (베트남 8 도시) 누적으로 콘텐츠 인프라는 갖춰졌으나 **도달성 한계**:

1. `CityContextStrip`이 `trip.currentMode === "in-travel"`일 때만 노출 — 출발 전 응급 정보 도달 불가
2. 응급 정보가 `/city/[slug]` 안 1 섹션에 묻힘 — 빠른 탐색 동선 부재
3. 분실(여권·카드·휴대폰·도난) 통합 가이드 부재 — 패닉 상황 골든타임 손실
4. 영사관 통역 서비스(외교부 콜센터)가 시드에 있으나 라벨 부재

## 결정

### A. `/city/[slug]/emergency` 서브 라우트 신설

기존 `/city/[slug]` 응급 섹션을 **별도 풀 페이지로 분리** + 분실 가이드 추가.

```
app/city/[slug]/page.tsx     ← 5 섹션 그대로 (요약), "응급 전체 보기 →" CTA로 서브 라우트 진입
app/city/[slug]/emergency/page.tsx  ← 신규 (~180행)
  - 도시 응급 contacts (영사관/경찰/병원)
  - 분실 가이드 4 카테고리 (여권/카드/휴대폰/도난)
  - 영사관 24시간 통역 서비스 강조
  - tel: 링크 + 영사관 공식 URL
```

**A 신규 라우트(`/emergency`) 기각** — BottomNav 슬롯 부족 + 도시별 응급은 도시 페이지 안에 있는 게 의미 정확.

### B. CityContextStrip 분기 제거 — 항상 노출

```ts
// before (TravelHome.tsx:238)
{trip.currentMode === "in-travel" && city && (
  <CityContextStrip city={city} />
)}

// after — 출발 전(pre-travel)에도 항상 노출
{city && <CityContextStrip city={city} />}
```

출발 전 사용자가 응급 정보 미리 확인 가능. 분기 제거로 코드도 단순화.

**`/itinerary/[id]`에도 추가** — 일정 화면에서도 도시 컨텍스트 1탭 도달.

### C. 분실 가이드 — `lib/constants/koreanLossContacts.ts` 신규

```ts
export interface LossGuideCategory {
  category: "passport" | "card" | "phone" | "theft";
  title: string;
  steps: string[];                     // 절차 안내
  contacts: { label: string; phone?: string; url?: string }[];
  notes?: string;
}

export const KOREAN_LOSS_GUIDES: LossGuideCategory[] = [...];
```

**번호는 검증 가능한 통합 번호만 시드** (개별 카드사 번호는 환각 위험 — 절차 안내 + "본인 카드사 번호 사전 확인" 권장).

### D. EmergencyHeader 컴포넌트 — 헤더 응급 버튼

`components/city/EmergencyHeader.tsx` — 도시별 응급 페이지 1탭 진입 버튼. TravelHome·city 페이지 헤더 우상단 슬롯.

### E. 영사관 통역 라벨 명확화

`Country.GLOBAL_EMERGENCY_CONTACTS`의 `한국어 통역 서비스 (영사 콜센터)` → category `translator` (이미 정의됨) + `/emergency` 페이지에서 별도 강조 카드.

### F. 시드 출처 주석 (T16)

8 활성 도시 city 시드에 영사관·관광경찰·응급번호 출처 주석:
```ts
// 출처: 외교부 영사콜센터 0404.go.kr (확인일: 2026-05-02)
```
URL 필드는 영사관 공식 사이트만 추가 (선택). 시드 검증 가능성 ↑.

## 거부된 대안

### A) `/emergency` 최상위 라우트 (도시 무관)
- BottomNav 5슬롯 모바일 한계
- 도시 무관 응급은 의미 부정확 — 응급은 항상 현재 위치 도시 컨텍스트
- 사용자가 도시 selector 보고 결정 필요 → 패닉 상황에서 1탭 추가 = 골든타임 손실

### B) BottomNav 5슬롯 변경
- 모바일 420px 너비 한계
- 4슬롯이 최적 (ADR-033 결정 답습)
- 헤더 버튼이 더 명시적

### C) 위치 공유 (Geolocation + 카카오톡 공유)
- ADR-017 답습 가능하지만 SDK + UX 검증 필요
- 사이클 R로 분리 (사이클 P는 콘텐츠 깊이에 집중)

### D) 응급 푸시 알림
- ServiceWorker + 푸시 인프라 신규 = 큰 사이클
- 사이클 R+

## 영향

### 코드
- 신규: `app/city/[slug]/emergency/page.tsx` (~180행)
- 신규: `components/city/EmergencyHeader.tsx` (~40행)
- 신규: `lib/constants/koreanLossContacts.ts` (~80행)
- 수정: `components/city/CityContextStrip.tsx` (currentMode 분기 제거 ~5행)
- 수정: `components/travel/TravelHome.tsx` (분기 제거 + 헤더 버튼 ~20행)
- 수정: `app/itinerary/[id]/page.tsx` (CityContextStrip 추가 ~5행)
- 수정: `app/city/[slug]/page.tsx` (응급 섹션에 "전체 보기" CTA + 헤더 버튼 ~15행)
- 신규 의존성 0 / 마이그 0 / mutation 0

### 테스트
- 신규: `tests/unit/emergency-route.test.ts` — 8 도시 응급 라우트 + 분실 가이드 무결성 (~18건)

### 사용자 화면
- 출발 전부터 응급 정보 도달 가능
- 1탭 도달 (헤더 버튼 또는 CityContextStrip 카드)
- 분실 통합 가이드 (패닉 상황 빠른 안내)

## 검증 기준

- 8 활성 도시 모두 `/city/[slug]/emergency` 응급 풀 페이지 정상 렌더
- `KOREAN_LOSS_GUIDES` 4 카테고리 (passport/card/phone/theft) 모두 절차 ≥3 단계
- 영사관 통역 서비스 라벨 명확 노출
- CityContextStrip이 currentMode 무관하게 항상 노출 (`trip.currentMode === "pre-travel"`에서도)
- vitest ≥18건 신규 + 회귀 0
- TypeScript `tsc --noEmit` 0 에러
