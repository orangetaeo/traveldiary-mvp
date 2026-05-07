---
id: ADR-049
title: 로그아웃 + 계정 삭제 정책 (사이클 8 / G3)
status: Accepted (2026-05-06, cycle 8)
date: 2026-05-06
decider: R1 CTO
proposer: R1 CTO + T16 Security + T17 UX (3인 회의 — T14 schema 변경 없음)
related: ADR-026 (카카오 OAuth), ADR-036 (익명 협업 clientUuid), ADR-045 (actor SetNull)
---

# ADR-049: 로그아웃 + 계정 삭제 정책 (사이클 8 / G3)

## 컨텍스트

사용자 흐름 갭 G3 — OAuth 로그인 후 **로그아웃/계정 삭제 경로 부재**. settings 페이지의 "계정 삭제"는 `href="#"` 데드 링크 상태이고, 로그아웃 메뉴는 LoginButton 헤더 토글 외에 settings 페이지에 부재. 4-OAuth 게이트(사이클 6)와 독립적으로 진행하기 위해 **인프라만 박제** — OAuth 활성 시 자연 통합.

박제된 인프라:
- `User.deletedAt DateTime?` 컬럼 (soft delete marker)
- `email/kakaoId/name` 모두 nullable + `kakaoId @unique`
- 다른 모델의 `actorId`는 모두 `onDelete: SetNull` (ItineraryItem/CostEntry/Vote/Checklist/ShareComment)
- `POST /api/auth/logout` 라우트 (cookie clear + audit `auth.logout`)
- `auth.login`/`auth.logout` audit enum
- ShareComment.clientUuid LocalStorage 패턴 (ADR-036)

미박제:
- 계정 삭제 Server Action / API
- `Trip.ownerId`/`TripMember.userId` cascade 정책 (`onDelete` 미명시 = 기본 NoAction)
- `auth.account_delete` audit enum
- 로그아웃 confirm 모달 (LoginButton은 즉시 fetch — settings에서는 한 번 더 묻기)

## 결정

### D1. cascade 정책: 익명화 우선 (옵션 A)
**Trip.owner / TripMember.user는 SYSTEM_OWNER_ID로 reassign** (애플리케이션 레벨, schema 변경 없음). User row는 soft delete + PII NULL화. 다른 actor 참조는 이미 `SetNull` 박제됨.

**근거**:
- 다른 모든 actor 관계가 이미 `SetNull` (익명화 정책 박제) → 일관성
- 하드 삭제는 공유 trip에서 동행자 데이터까지 cascade 손실 → 운영 사고 위험
- ShareComment의 `clientUuid` 보존 패턴(ADR-036)과 정합 — "OAuth 정체성은 폐기, 익명 흔적은 유지"

**거부**:
- (B) 하드 삭제: 공유 trip 동행자 데이터 손실 + 박제 패턴 위반
- (C) 사용자 선택 분기: MVP에 UI 분기 가치 < 복잡도

### D2. grace period: 즉시 익명화 (옵션 A) — 30일 grace 미도입
**삭제 요청 즉시 트랜잭션 1회로 익명화 완료**. row 자체는 soft delete로 보존되어 운영자 수동 복구 가능.

**근거**:
- cron 인프라 부재 (Vercel/Railway scheduler 미도입) → 30일 grace는 별도 사이클 필요
- 베트남 단일 국가 → GDPR 의무 부재
- soft delete row 자체는 보존 → 사용자 후회 시 운영자 SQL 복구 가능
- 사용자 후회 방지는 UX 단계의 **2단계 confirm + 텍스트 입력**(T16 권고)으로 충당

**거부**:
- (B) 30일 grace + cron: 인프라 추가 1 사이클 + 운영 부담↑
- (C) 24h soft delete + 자동 복구: enforce 로직 복잡 + 24h 이후 처리 모호

### D3. clientUuid 처리: 로그아웃 보존, 계정 삭제 시 LocalStorage clear
**로그아웃**: cookie clear만, `td-client-uuid` LocalStorage 보존 (익명 사용자 자연 fallback).
**계정 삭제**: cookie clear + `td-client-uuid` LocalStorage 명시 clear (완전한 정체성 단절).

**근거**:
- 로그아웃은 OAuth 세션 종료일 뿐 — 익명 흔적까지 폐기할 이유 없음
- 계정 삭제 후 동일 디바이스에서 새로 시작 = 새 익명 사용자로 출발이 자연스러움
- DB의 ShareComment.clientUuid는 보존 (다른 사용자가 본 댓글이 갑자기 사라지지 않도록)

### D4. 인증 강화 — 텍스트 confirm (T16 권고)
**계정 삭제 2단계 모달**:
1. 1단계 — 영향 안내 (Trip 익명화/되돌릴 수 없음/필요 시 운영 문의)
2. 2단계 — 입력란에 "계정 삭제" 한글 입력 시에만 최종 버튼 활성화 + 서버에서도 재검증

**근거**: OAuth 단일 provider라 비밀번호/OTP 재인증 불가. GitHub 패턴 활용. 클라이언트 게이트 + 서버 재검증으로 OWASP A04 최소 충족.

### D5. JWT revocation 차기 사이클로 deferred
stateless JWT + 짧은 access TTL(15분)으로 cookie clear 충분. refresh TTL(30일) revocation 리스트는 차기 사이클에서 별도 ADR.

## 구현 범위

| # | 파일 | 변경 |
|---|------|------|
| 1 | `lib/audit-log.ts` | enum `auth.account_delete` 추가 |
| 2 | `lib/auth/account-delete.ts` | 신규 — 익명화 트랜잭션 (Trip/TripMember reassign + User soft delete + PII NULL) |
| 3 | `app/api/auth/account/route.ts` | 신규 — DELETE 엔드포인트 (텍스트 confirm 재검증 + cookie clear + redirect) |
| 4 | `components/auth/LogoutConfirmModal.tsx` | 신규 — Overlay |
| 5 | `components/auth/LogoutOrchestrator.tsx` | 신규 — state + fetch logout |
| 6 | `components/auth/AccountDeleteWarningModal.tsx` | 신규 — Overlay 1단계 |
| 7 | `components/auth/AccountDeleteConfirmModal.tsx` | 신규 — Overlay 2단계 (텍스트 입력) |
| 8 | `components/auth/AccountDeleteOrchestrator.tsx` | 신규 — 2단계 step + DELETE fetch |
| 9 | `app/account/deleted/page.tsx` | 신규 — 안내 페이지 |
| 10 | `app/settings/page.tsx` | 메뉴 활성화 (로그아웃 신규 + 계정 삭제 link → 모달 트리거) |
| 11 | `tests/unit/account-delete-anonymize.test.ts` | 신규 — 익명화 함수 단위 |
| 12 | `tests/unit/auth-modals-smoke.test.tsx` | 신규 — 4 컴포넌트 렌더 스모크 |

**Schema 변경 없음** — 마이그레이션 불필요. 모든 변경은 애플리케이션 레벨.

## 위험 / 박제 후보

- **재가입 시 데이터 단절**: 사용자가 같은 카카오 계정으로 재로그인하면 새 User row 생성 (이전 익명화된 row와 단절). 이는 의도된 동작 — "계정 삭제 = 새 출발".
- **운영자 수동 복구 절차**: `UPDATE User SET deletedAt = NULL, email = ?, kakaoId = ?, name = ?` + 관련 Trip의 ownerId reassign 역방향. 사이클 9에서 `scripts/restore-user.ts` 박제 검토.

### T13 코드 리뷰 — 사이클 9 처리 (✅ 4/5)

- ✅ **CSRF Origin/Referer 헤더 검증**: `isSameOriginRequest()` — Origin 우선 + Referer fallback + host 비교. cross-origin/누락 시 403 `forbidden_origin` + audit `auth.account_delete_origin_blocked` (security). CSRF 차단은 confirm/JWT보다 우선 (인증 정보 누설 차단).
- ✅ **Rate limit (사이클 9)**: `lib/auth/accountDeleteRateLimit.ts` — userId 기반 5분 1회 (LIMIT=1, WINDOW_MS=300_000). 박제 lookupRateLimit 패턴 답습 (Map<string, number[]> in-memory). 초과 시 429 `rate_limited` + audit `auth.account_delete_rate_limited` (security). 영속 store는 사이클 R1 게이트(JWT refresh revocation과 묶음).
- ✅ **외부 reason 매핑 (사이클 9)**: `mapAccountDeleteReason()` — 모든 내부 reason(`tx_failed`/`db_unavailable`/`user_not_found`/`unknown`) → `internal_error` 통일. raw reason은 server console.error에서만 추적 (정보 누설 차단).
- ✅ **localStorage 가시성 (사이클 9)**: `AccountDeleteOrchestrator.handleConfirm` — `console.warn` 추가. UX 영향 없음 (이미 server-side 익명화 commit 완료, redirect도 진행).
- ⏸️ **JWT refresh token revocation 리스트**: D5 — 별도 ADR-050(예정), R1 게이트.

### T13 코드 리뷰 — 즉시 fix 적용

- **audit log atomicity** (Major): 초기 구현은 `prisma.$transaction` 외부에서 `writeAuditLog` 호출 → 부분 실패 창. **tx 내부 `tx.auditLog.create`로 이동** (`lib/auth/account-delete.ts`). 박제 테스트 추가.
- **`preferences: Prisma.JsonNull`** (Minor): `null as never` 캐스팅 → 명시적 `Prisma.JsonNull`로 교체.

### 박제 후보 메모리 (T18 회고에서 검토)

- `feedback_account_delete_anonymize.md`: 익명화 트랜잭션 표준 패턴 (Trip/TripMember reassign + User PII NULL + tx 내부 audit + Prisma.JsonNull)
- `feedback_session_clear_checklist.md`: cookie + LocalStorage clear 표준 (clientUuid는 logout/delete 분기)
- `feedback_audit_atomic_in_tx.md`: 핵심 mutation의 audit log는 트랜잭션 내부에 박제 (S-13 강화)

## 성공 지표 (read-only reporter 선행)

- 사이클 8 머지 후 라이브에서 settings → 로그아웃 → /account/deleted 흐름 E2E nightly 추가 검증
- audit `auth.account_delete` row가 정상 기록되는지 (DB 검증)
- 익명화 후 동행자 trip이 그대로 유지되는지 (SYSTEM_OWNER_ID 보유 trip 조회 가능)
- (사이클 9) audit `auth.account_delete_origin_blocked` / `auth.account_delete_rate_limited` row가 abuse 시도 시 기록되는지

## 변경 이력

| 일자 | 사이클 | 변경 |
|------|-------|------|
| 2026-05-06 | 8 | 초기 — D1~D5 결정 + 익명화 트랜잭션 + 모달/페이지 + audit `auth.account_delete` |
| 2026-05-07 | 8 hotfix | server-only 분리 — `lib/auth/account-delete-shared.ts`로 PHRASE/validator 격리, account-delete.ts는 re-export로 외부 호환. CI 빌드 실패 fix. |
| 2026-05-07 | 9 | T13 deferred Minor 4/5 처리 — CSRF Origin/Referer 검증 + userId 기반 rate limit 5분 1회 + reason 매핑(`internal_error`) + localStorage console.warn. audit enum 2개 추가(`auth.account_delete_origin_blocked` / `auth.account_delete_rate_limited`). JWT refresh revocation은 ADR-050(예정)으로 분리. |
