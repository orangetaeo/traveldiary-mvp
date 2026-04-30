---
id: ADR-026
title: 카카오 OAuth + JWT 세션 + actorId 본격 활성 (인증 전환점)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T16 Security + R4 BE + T13 Code Reviewer
related: ADR-013 (mutation 패턴), S-11 (api security), v2 §6 결정 6 (사이클 11 OAuth)
---

# ADR-026: 카카오 OAuth + JWT (사이클 11b — 인증 전환점)

## 컨텍스트

- 사이클 11a M7 ShareLink는 OAuth 없이 동작 (시드니 패턴).
- 5b-1 이후 모든 mutation은 actorId: null로 audit log 기록 — 단일 사용자(SYSTEM_OWNER_ID).
- v2 §6 결정 6: 카카오 OAuth = 사이클 11. M7 공유의 edit 권한·일행 초대(C3)·OTA 어필리에이트 사용자별 추적의 전제.
- S-11 §2 OAuth 표준 패턴 그대로 답습.

## 결정

### A. 신규 의존성 1개

```
jose ^5.x  (JWT 표준 — RFC 7519, Edge runtime 호환)
```

이유: jose는 production-ready, well-audited. 직접 HMAC 구현은 위험.

### B. OAuth 흐름 (Authorization Code Grant)

```
사용자 → "카카오 로그인" 버튼 (/components/auth/LoginButton)
     ↓
GET /api/auth/kakao/start
     ↓ 302 redirect
https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=.../api/auth/kakao/callback&response_type=code
     ↓ 사용자 동의
GET /api/auth/kakao/callback?code=...
     ↓ 서버에서 code → token 교환
POST https://kauth.kakao.com/oauth/token (server fetch)
     ↓ access_token 응답
GET https://kapi.kakao.com/v2/user/me (server fetch)
     ↓ user info
prisma.user.upsert({ kakaoId })
     ↓
JWT 발급 (jose) + httpOnly 쿠키 저장
     ↓
AuditLog "auth.login"
     ↓ 302 redirect to /
```

### C. JWT 토큰 정책

| 토큰 | 만료 | 갱신 |
|------|------|------|
| access_token | 15분 | refresh_token으로 자동 갱신 |
| refresh_token | 30일 | 사용 시 sliding window |

```typescript
type Payload = {
  sub: string;       // user.id
  type: "access" | "refresh";
  iat: number;
  exp: number;
};
```

서명: `HS256`. 비밀키: `JWT_SECRET` (32바이트 이상, Railway Variables).

### D. 쿠키 정책

```
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=900; Path=/
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/
```

- HttpOnly — JS 접근 차단
- Secure — HTTPS only (라이브 OK, localhost는 자동 완화)
- SameSite=Lax — CSRF 방어

### E. middleware.ts (Next.js Edge Runtime)

```typescript
- /api/auth/* 제외
- 쿠키에서 access_token 추출 → jose.jwtVerify
- 만료 시: refresh_token으로 access_token 갱신 (Set-Cookie 갱신)
- 검증 실패 시: 단일 사용자 모드 fallback (현재 코드 호환)
- 헤더 x-user-id로 currentUser.id 주입 → Server Action에서 활용
```

### F. actorId 도입 — actions/* 14개

기존:
```typescript
await writeAuditLog({ actorId: null, ... });
```

변경:
```typescript
import { getActorId } from "@/lib/auth/session";
await writeAuditLog({ actorId: await getActorId(), ... });
```

미인증 시 `getActorId()`는 null 반환 (legacy 호환). 인증 시 user.id.

### G. ownerId 도입 — Trip.ownerId

기존: `createTripWithSeedItinerary`에서 `SYSTEM_OWNER_ID` 고정.

변경: `ownerId: string` 인자화. Server Action `createTripFromOnboarding`이 `getCurrentUser()` 결과 또는 SYSTEM_OWNER_ID로 결정.

미인증 시 SYSTEM_OWNER_ID 그대로 — legacy trip 보호.

### H. ShareLink.createdBy 활성

11a에서 null로 두었던 `createdBy`를 인증 후 user.id로 채움.

### I. 데모 fallback (5b 답습)

KAKAO_CLIENT_ID 미설정 →
- `/api/auth/kakao/start`는 503 + "OAuth 미설정"
- LoginButton: disabled + "카카오 로그인 (미설정)"
- middleware: 검증 시도 안 함, 단일 사용자 모드
- 모든 mutation: actorId null (legacy 동작)

라이브 미설정 시 회귀 0.

### J. AuditLog actions

- `auth.login` (이미 enum에 있음 ✅)
- `auth.logout` (이미 enum에 있음 ✅)

metadata: `{ provider: "kakao", source: "web" }`.

### K. Privacy

- 카카오에서 받는 정보: `kakaoId`, `nickname`, `profile_image_url` (옵션)
- 이메일 권한은 미요청 (카카오 동의 부담 ↑)
- AuditLog에는 actorId만, 카카오 토큰 X
- JWT_SECRET 회전 시 모든 사용자 재로그인 필요 (S-11 §1.5)

## 대안

### 대안 1 — 신규 의존성 0개, Node crypto 직접 (비채택)
- HMAC SHA256 직접 구현 위험 (T16 반대)
- jose는 단일 의존성, ESM, 잘 검증됨

### 대안 2 — NextAuth.js 채택 (비채택)
- 큰 의존성 (peer deps 많음)
- 카카오 provider는 직접 구현이 더 명확 (5b 외부 API 패턴 답습)

### 대안 3 — 세션 ID 기반 (DB 세션) (비채택)
- DB 부하 ↑ (매 요청마다 SELECT)
- JWT는 stateless

### 대안 4 — 이메일 권한 요청 (비채택)
- 카카오 동의 화면 부담 ↑
- 사이클 11b는 nickname만으로 충분, 이메일은 사이클 11c+

## 영향

### 긍정
- 인증 전환점 — 사용자별 trip·audit·ShareLink 활성
- M7 edit 권한 도입 가능 (사이클 11c+)
- C3 일행 초대·E1 자동 정산 등 후속 기능 토대

### 부정
- 사용자 직접 액션 4건 (카카오 콘솔, redirect URI, JWT_SECRET 생성, NEXT_PUBLIC_APP_URL)
- middleware 추가로 모든 요청에 JWT verify 부하 (~1ms/요청)
- 신규 의존성 1개 (jose, ~50KB)

### 트레이드오프
- 미설정 라이브에서 단일 사용자 모드 fallback — 사용자가 OAuth 활성하기 전엔 동작 동일

## 사용자 직접 액션

```
1. 카카오 개발자 콘솔 (https://developers.kakao.com)
2. 애플리케이션 추가:
   - 앱 이름: TravelDiary MVP
   - 회사명: (개인)
3. 플랫폼 설정 → Web → 사이트 도메인:
   - https://traveldiary-mvp-production.up.railway.app
   - http://localhost:3000 (개발)
4. 카카오 로그인 활성화 → Redirect URI:
   - https://traveldiary-mvp-production.up.railway.app/api/auth/kakao/callback
   - http://localhost:3000/api/auth/kakao/callback
5. 동의 항목: 닉네임 (기본) — 이메일은 사이클 11c+
6. JWT_SECRET 생성 (32바이트 random):
   - openssl rand -hex 32
7. Railway Variables 추가:
   - KAKAO_CLIENT_ID=<REST API 키>
   - KAKAO_CLIENT_SECRET=<생성한 client secret, 옵션>
   - JWT_SECRET=<생성한 32바이트 hex>
   - NEXT_PUBLIC_APP_URL=https://traveldiary-mvp-production.up.railway.app
8. (자동) 재배포 → 로그인 활성
```

## 검증 통과 기준 (STEP 4)

- [ ] tsc + build 통과
- [ ] middleware 동작 (Edge runtime 컴파일)
- [ ] OAuth 미설정 → LoginButton disabled, 단일 사용자 모드 회귀 0
- [ ] OAuth 설정 → 로그인 → 쿠키 set → /로 redirect
- [ ] AuditLog `auth.login` 적재 + actorId user.id
- [ ] mutation 14개 → actorId user.id로 audit log
- [ ] 로그아웃 → 쿠키 제거 + AuditLog `auth.logout`
- [ ] middleware 만료 access → refresh로 자동 갱신

## 사인오프

R1 ✅ · R4 ✅ · T16 ✅ · T13 ✅
