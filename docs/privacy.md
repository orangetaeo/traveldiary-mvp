# Privacy 정책 — TravelDiary

> 자유여행자를 위한 AI 여행 동반자가 사용자의 위치·활동 데이터를 어떻게 다루는지 한국어로 정리한 문서입니다.
> **근거 ADR**: [ADR-017 §C](./adr/ADR-017-geolocation-and-privacy.md), 사이클 AAA(`buildModeTransitionMetadata`), 사이클 KK(`recordModeTransitionSkip`).

---

## 1. 위치 좌표 — 서버에 전송하지 않습니다

자동 모드 전환(M2)을 위해 브라우저의 `navigator.geolocation` API로 한 번 좌표를 조회하지만:

| 항목 | 처리 |
|------|------|
| **좌표(lat·lng)** | 사용자 기기 안에서만 사용 — 함수 스코프에 잠시 머물고 즉시 폐기 |
| **서버 전송** | 절대 금지 (ADR-017 §C) |
| `localStorage`, `sessionStorage`, React state, 데이터베이스 | 어디에도 저장하지 않음 |
| 도시 경계(boundary) 판정 | 사용자 기기에서 `isWithinBoundary()` 함수로 즉시 계산 (정적 공개 데이터 비교) |
| 서버에 보내는 값 | `mode`(예: `"in-travel"`)와 `trigger`(예: `"geolocation"`)뿐 — **숫자 좌표는 어떤 형태로도 포함되지 않음** |

> 코드 레벨 보장: `lib/mode-transition.ts`의 `buildModeTransitionMetadata()`가 화이트리스트 필드만 통과시킵니다. `lat`·`lng`·`accuracy`·`distanceKm` 같은 키를 호출자가 넘겨도 audit 로그에 절대 포함되지 않습니다.

---

## 2. 자동 모드 전환 audit 로그 — 무엇이 기록되는가

사이클 KK 이후, 자동 전환을 시도한 모든 사용자 클릭은 (성공·실패 모두) 감사 로그(`trip.mode_transition`)로 남습니다. 이는 **운영 디버깅과 사용자 본인의 활동 이력 표시**가 목적이며, 다음과 같이 화이트리스트가 적용됩니다.

### 2-1. 기록되는 정보 (메타데이터)

| 필드 | 예시 | 의미 |
|------|------|------|
| `trigger` | `"manual"` 또는 `"geolocation"` | 버튼 클릭의 트리거 종류 |
| `source` | `"web"` | 클라이언트 종류 |
| `previousMode` | `"pre-travel"` | 이전 모드 (전환 전) |
| `dDay` | `0` | 출발일 기준 D-Day (음수면 출발 후) |
| `boundaryHit` | `true` 또는 `false` | 도시 경계 안에 있었는가 (좌표 자체는 미포함) |
| `destinationCode` | `"PQC"`, `"DAD"`, `"SGN"` 등 | IATA-like 도시 코드 |
| `outcome` | `"applied"` 또는 `"skipped"` | 모드가 실제로 바뀌었는지 |
| `skipReason` | 6 카테고리 enum (아래) | 전환이 안 된 사유 (skipped일 때만) |

### 2-2. `skipReason` 카테고리 (사이클 KK)

| 코드 | 의미 |
|------|------|
| `not_in_destination` | 도시 경계 밖에 있어 자동 전환 안 됨 |
| `not_yet_started` | 출발일 전이라 자동 전환 안 됨 |
| `already_in_mode` | 이미 여행 중 모드여서 변경할 게 없음 |
| `geolocation_unsupported` | 기기가 위치 기능을 지원하지 않음 |
| `geolocation_denied` | 사용자가 권한 prompt를 거부함 |
| `geolocation_unavailable` | GPS 신호 미수신·timeout 등 일시적 실패 |

> 모든 `skipReason`은 추상화된 enum입니다. **"5.2km 떨어짐"**, **"위치 정확도 30m"** 같은 거리·정확도 수치는 어떤 경우에도 저장되지 않습니다 (`not_in_destination`이라는 사실만 남음).

---

## 3. 기록되지 않는 정보 (절대)

| 데이터 | 처리 |
|--------|------|
| 위·경도 좌표 | ❌ 메모리에서도 즉시 폐기 |
| 거리·정확도 수치 (`distanceKm`, `accuracy`) | ❌ 메타데이터 화이트리스트에 없음 |
| IP 주소 | ❌ AuditLog 스키마에 컬럼 자체 없음 (`prisma/schema.prisma`) |
| User-Agent · 디바이스 핑거프린트 | ❌ 동일 — AuditLog에 미저장 |
| 위치 추적 (`watchPosition`) | ❌ 한 번도 호출하지 않음 — 일회성 `getCurrentPosition`만 (ADR-017 §E) |
| 백그라운드 위치 | ❌ 적용 불가 (브라우저 권한 모델 + 코드 미사용) |

---

## 4. 인증·식별 정보

- **카카오 로그인**(M7 OAuth, 사이클 11b) 사용 시: 카카오에서 받은 사용자 ID·닉네임·이메일(선택)을 `User` 테이블에 저장합니다. JWT 토큰은 HttpOnly 쿠키에 1시간 저장 후 자동 만료(ADR-026).
- **익명 사용자**(로그인 없이 댓글·공유 사용): LocalStorage `clientUuid`만 사용. 서버는 `clientUuid`를 식별자로 받지만 IP·디바이스 정보는 결합하지 않습니다.
- audit log의 `actorId`는 카카오 로그인한 경우 `User.id`, 익명일 때 `null`입니다.

---

## 5. 데이터 보존

| 데이터 | 보존 기간 |
|--------|-----------|
| audit log (`trip.mode_transition` 포함) | 운영 기간 동안 (수동 삭제 도구는 별도 사이클) |
| 좌표 자체 | 0초 — 함수 스코프 종료 시 즉시 GC |
| 카카오 OAuth 토큰 | 쿠키 1시간 (자동 만료) |

> 사용자 데이터 일괄 삭제·내보내기 도구는 별도 사이클(다중 사용자 격리 마이그 직후) 진행 예정입니다.

---

## 6. 사용자 권리

- 위치 권한 prompt를 거부하면 audit log에 `geolocation_denied`가 한 줄 남고, 자동 전환은 동작하지 않습니다. 수동 "여행 중 모드로 전환" 버튼은 그대로 동작합니다.
- 브라우저 설정에서 사이트 위치 권한을 언제든 회수할 수 있으며, 회수 후에는 같은 효과(`geolocation_denied`)로 처리됩니다.
- `watchPosition`을 사용하지 않으므로, 백그라운드에서 위치가 추적되는 일은 일어나지 않습니다.

---

## 7. 변경 이력

| 일자 | 변경 |
|------|------|
| 2026-04-30 | ADR-017 §C 정책 확정 (좌표 서버 미전송) |
| 2026-05-03 (사이클 AAA) | `buildModeTransitionMetadata` 화이트리스트 도입 — 좌표 leak 방어 코드 레벨화 |
| 2026-05-03 (사이클 KK) | `recordModeTransitionSkip` 추가 — 자동 전환 실패 사유 6 카테고리 audit 기록 시작 (negative path) |
| 2026-05-03 (사이클 MM) | 본 문서(`docs/privacy.md`) 신설 — 사용자 facing 정리 |

---

## 8. 관련 코드·문서

- [ADR-017 — Geolocation API + 자동 모드 전환 + Privacy 정책](./adr/ADR-017-geolocation-and-privacy.md)
- [`lib/mode-transition.ts`](../lib/mode-transition.ts) — `buildModeTransitionMetadata`(AAA), skip reason enum(KK)
- [`actions/trip.ts`](../actions/trip.ts) — `setTripMode`, `recordModeTransitionSkip`
- [`components/travel/AutoModeDetector.tsx`](../components/travel/AutoModeDetector.tsx) — UI + 권한 흐름
- [`prisma/schema.prisma`](../prisma/schema.prisma) — `AuditLog` 모델 (IP·UA 컬럼 없음)
