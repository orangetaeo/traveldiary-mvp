---
id: ADR-017
title: Geolocation API + 자동 모드 전환 + Privacy 정책
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T7 Mode Transition + T16 Security + T17 UX
related: ADR-014 (mode transition demo toggle), ADR-013 (mutation pattern), S-04 (mode transition), S-11 (api security)
---

# ADR-017: Geolocation API + 자동 모드 전환 + Privacy

## 컨텍스트

- 사이클 3 ADR-014: 데모 토글로 mode 시연. `lib/mode-transition.ts`에 `detectMode/isWithinBoundary` 순수 함수는 이미 존재.
- 사이클 5b-2: `setTripMode` mutation으로 DB 영속화 + audit log 동작.
- 사이클 5b-3: Google Places로 검증 1~2단계 활성.
- 차별화 4축 중 "여행 중에 살아있음"의 핵심 = M2 D-Day 자동 모드 전환.
- 사용자가 버튼을 누르지 않아도 출발 당일 도시 진입 시 UI가 코랄로 자동 swap → 락인.
- Privacy 부담 큼 — 위치 데이터는 가장 민감한 정보 중 하나.

## 결정

### A. 신규 의존성 0개

`navigator.geolocation` 표준 browser API만 사용. 외부 라이브러리 미도입.

### B. 권한 요청은 명시적 사용자 액션 후만

**페이지 진입 시 자동 prompt ❌**.
`<AutoModeDetector>` 컴포넌트가 "📍 내 위치로 자동 전환" 버튼 노출 → **사용자 클릭 후** prompt.

이유:
- 페이지 진입 시 자동 prompt는 거부율 ↑ (UX)
- 사용자가 의도적으로 활성화하므로 멘탈 모델 ↑

### C. 위치 데이터 처리 — Privacy 핵심

| 항목 | 정책 |
|------|------|
| 좌표 서버 전송 | ❌ **절대 금지** |
| `isWithinBoundary` 실행 | 클라이언트에서만 (DESTINATION_BOUNDARIES는 정적 공개 데이터) |
| 서버에 보내는 값 | `setTripMode("in-travel")` mode 값만 |
| AuditLog metadata | `trigger: "geolocation"`만 (좌표 X) |
| 좌표 보존 | 함수 스코프 메모리만. localStorage·sessionStorage·state·DB 어디에도 X |
| 사이클 11 OAuth 후 | actorId가 추가되더라도 좌표 결합 X |

→ "위치 데이터는 기기 내 처리, 서버 미전송" 원칙 (S-04 Privacy 절).

### D. Geolocation API 옵션

```typescript
navigator.geolocation.getCurrentPosition(success, error, {
  enableHighAccuracy: false,  // 도시 경계 30km라 cell tower 정확도 충분, 배터리 절약
  timeout: 10_000,            // 10초 (권한 prompt + GPS lock)
  maximumAge: 60_000,         // 1분 캐시 — 같은 페이지 재호출 시 활용
});
```

### E. One-shot vs watchPosition

**One-shot `getCurrentPosition`만 채택**. `watchPosition`은 5b-4 범위 X.
- 배터리 부담 ↑
- Privacy 부담 ↑ (지속 추적)
- 사용자 명시적 트리거에 한해서만 호출

watchPosition 도입은 별도 ADR (사이클 7+ 운영 단계).

### F. 거부·실패 처리 (graceful degradation)

| 시나리오 | 처리 |
|---------|------|
| `PERMISSION_DENIED` (1) | 토스트 "위치 권한이 거부됐어요. 수동 버튼 활용 가능" + 버튼 disabled |
| `POSITION_UNAVAILABLE` (2) | 토스트 "위치를 가져올 수 없어요" + 재시도 가능 |
| `TIMEOUT` (3) | 토스트 "시간 초과 — 다시 시도해주세요" |
| 도시 경계 밖 (`isWithinBoundary === false`) | 토스트 "{destination} 안에 있지 않아 자동 전환 안 됨" — mode 미변경 |
| `setTripMode` 실패 | 5b-2 conflict/internal 에러 — toast로 안내 |

수동 "여행 중 모드로 전환" 버튼은 5b-4 후에도 그대로 유지 (fallback path).

### G. UI 통합

```tsx
// app/travel/[id]/page.tsx
<AutoModeDetector trip={trip} />  // GPS 배너 다음에 노출

// components/travel/AutoModeDetector.tsx ('use client')
- 버튼 "📍 내 위치로 자동 전환"
- 클릭 → getCurrentPosition (브라우저 권한 prompt)
- 권한 OK → detectMode 클라이언트 실행 → mode 결정
- mode === "in-travel" → setTripMode("in-travel", { trigger: "geolocation" }) Server Action
- 결과 토스트 + router.refresh()
```

### H. setTripMode 시그니처 확장

```typescript
// 5b-2 시그니처
interface SetTripModeInput {
  tripId: string;
  mode: TravelMode;
  expectedTripUpdatedAt?: string;
}
// 5b-4 추가 (optional)
+ trigger?: "manual" | "geolocation";
```

audit log metadata에 반영:
```typescript
metadata: {
  trigger: input.trigger ?? "manual",
  source: "web",
}
```

### I. 보안 헤더 (S-11)

`next.config.js`에 Permissions Policy:
```javascript
{ key: 'Permissions-Policy', value: 'geolocation=(self), camera=(self), microphone=()' }
```

→ 5b-4 단계엔 `next.config.js` 갱신 안 함 (이미 next.config.js 없거나 기본값. 다음 보안 사이클에서 일괄). 단, ADR-017 명시.

### J. 사용자 표시 텍스트 (Privacy 안내)

버튼 옆 작은 텍스트:
```
"위치는 자동 모드 전환에만 사용됩니다. 좌표는 서버에 전송되지 않아요."
```

## 대안

### 대안 1 — IP 기반 위치 (비채택)
- IP geolocation은 도시 단위만, 30km 정밀도 부족
- 외부 서비스 의존성 (ipinfo, MaxMind 등) — 추가 비용·Privacy 부담

### 대안 2 — watchPosition으로 자동 추적 (비채택)
- 배터리·Privacy 부담 ↑
- 5b-4 범위 X. 사이클 7+ 운영 단계에서 ADR 별도

### 대안 3 — 페이지 진입 시 자동 prompt (비채택)
- 거부율 ↑
- 사용자 동의 멘탈 모델 ↓

### 대안 4 — 좌표를 audit metadata에 기록 (비채택)
- Privacy 절대 금지 (T16)
- 사용자 동선 추적 가능

## 영향

### 긍정
- M2 매직 모먼트 자동 트리거 활성 — "사용자는 버튼을 누른 적 없다" 원칙 첫 실현
- Privacy 부담 최소화 — 좌표 서버 미전송
- 5b-2 setTripMode 인프라 그대로 활용 (시그니처만 확장)

### 부정
- 사용자가 "내 위치로 자동 전환" 버튼을 눌러야 권한 prompt → 100% 자동은 아님
- HTTPS 환경 필수 (라이브 OK, localhost는 예외 허용)
- 권한 거부 시 fallback이 수동 버튼 → "자동" 정체성 약화

### 트레이드오프
- 진정한 100% 자동 (페이지 진입 시 즉시 prompt)을 위해선 거부율 감수해야 함. 5b-4는 명시적 트리거로 안전하게 시작.

## 사용자 직접 액션

```
없음 — 별도 환경변수·외부 키 불필요. 라이브 배포 즉시 사용 가능.
사용자(브라우저) 측 액션:
1. /travel/[id] 진입
2. "📍 내 위치로 자동 전환" 버튼 클릭
3. 브라우저 권한 prompt → 허용
4. 토스트 "푸꾸옥 도착 감지 — 여행 중 모드로 전환됐어요"
```

## 검증 통과 기준 (STEP 4)

- [ ] `npx tsc --noEmit` 0
- [ ] `npx next build` 성공
- [ ] `lib/services/geolocation.ts` client-only (window·navigator 직접 사용 — server 빌드 시 사용 안 됨)
- [ ] 권한 거부 → 토스트 + 버튼 disabled (회귀 안전)
- [ ] 도시 경계 밖 좌표 → mode 미변경, 토스트만
- [ ] 도시 경계 안 좌표 → setTripMode("in-travel") 호출, audit log metadata.trigger="geolocation"
- [ ] 좌표가 어디에도 보존되지 않음 (코드 grep으로 확인)
- [ ] 라이브 배포 후 브라우저 실 테스트 (사용자 영역)

## 사인오프

R1 ✅ · T7 ✅ · T16 ✅ · T17 ✅ · T13 ✅
