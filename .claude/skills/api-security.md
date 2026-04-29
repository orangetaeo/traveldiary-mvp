# Skill S-11: API Security (API 보안)

> **스킬 유형**: 인프라·품질
> **핵심**: API 키 관리, Rate Limiting, OAuth, 입력 검증
> **사용 에이전트**: T16 Security Engineer, T10 API Specialist

## 4가지 핵심 영역

```
1. 시크릿 관리   (API 키, 토큰)
2. 인증·인가     (OAuth, JWT, RBAC)
3. 입력 검증     (Zod, sanitize)
4. Rate Limiting (남용 방지)
```

---

## 1. 시크릿 관리

### 절대 규칙

```
❌ 코드/Repo에 비밀 정보 커밋 금지
❌ 클라이언트 번들에 노출 금지 (NEXT_PUBLIC_* 외)
❌ 로그에 출력 금지
```

### 표준 위치

| 환경 | 저장 위치 |
|------|----------|
| Repo | `.env.example` (값 비움) |
| 로컬 개발 | `.env.local` (gitignored) |
| 프로덕션 | Railway Variables |

### `.env.example` 템플릿

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/traveldiary

# External APIs (서버 only)
GOOGLE_PLACES_API_KEY=
GOOGLE_DIRECTIONS_API_KEY=
GOOGLE_VISION_CREDENTIALS=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KLOOK_API_KEY=
ANTHROPIC_API_KEY=

# Auth
JWT_SECRET=
SESSION_SECRET=

# Public (클라이언트 노출 OK)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 시크릿 회전 정책

| 종류 | 주기 |
|------|------|
| Google API Keys | 분기 |
| LLM API Keys | 분기 |
| OAuth Client Secret | 연 1회 또는 사고 시 |
| JWT/Session Secret | 사고 시 즉시 |
| DB Password | 분기 (Railway 자동) |

### API 키 사용 패턴

```typescript
// ❌ 잘못된 패턴
const apiKey = 'AIza...'; // 하드코딩

// ✅ 올바른 패턴
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_PLACES_API_KEY is not configured');
}
```

---

## 2. 인증 (Phase 1: 카카오 로그인)

### OAuth 2.0 Authorization Code Grant

```typescript
// app/api/auth/kakao/callback/route.ts

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code');
  if (!code) return Response.json({ error: 'no_code' }, { status: 400 });
  
  // 1. 토큰 교환 (서버 측)
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID!,
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/kakao/callback`,
      code,
    }),
  });
  
  if (!tokenRes.ok) return Response.json({ error: 'token_exchange_failed' }, { status: 400 });
  
  const { access_token } = await tokenRes.json();
  
  // 2. 사용자 정보 조회
  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const userInfo = await userRes.json();
  
  // 3. User upsert
  const user = await prisma.user.upsert({
    where: { kakaoId: String(userInfo.id) },
    create: { kakaoId: String(userInfo.id), name: userInfo.kakao_account?.profile?.nickname },
    update: {},
  });
  
  // 4. JWT 발급
  const jwt = signJWT({ sub: user.id }, '15m');
  const refresh = signJWT({ sub: user.id, type: 'refresh' }, '30d');
  
  // 5. AuditLog (S-13)
  await writeAuditLog({
    actorId: user.id,
    action: 'auth.login',
    resource: 'User',
    resourceId: user.id,
    metadata: { provider: 'kakao' },
  });
  
  // 6. httpOnly Cookie 저장
  const headers = new Headers();
  headers.append('Set-Cookie', `access_token=${jwt}; HttpOnly; Secure; SameSite=Lax; Max-Age=900; Path=/`);
  headers.append('Set-Cookie', `refresh_token=${refresh}; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`);
  
  return new Response(null, { status: 302, headers: { ...headers, Location: '/' } });
}
```

### JWT 검증 미들웨어

```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken';

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: Request): Promise<User | null> {
  const cookie = req.headers.get('cookie');
  const accessToken = parseCookie(cookie, 'access_token');
  if (!accessToken) return null;
  
  const payload = verifyJWT(accessToken);
  if (!payload) return null;
  
  return prisma.user.findUnique({ where: { id: payload.sub } });
}
```

### 권한 체크 (Trip 멤버십)

```typescript
async function requireTripAccess(userId: string, tripId: string, requiredRole: Role) {
  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });
  
  const hierarchy = { viewer: 0, editor: 1, owner: 2 };
  if (!member || hierarchy[member.role] < hierarchy[requiredRole]) {
    throw new ForbiddenError('insufficient_permission');
  }
}

// 사용
await requireTripAccess(user.id, tripId, 'editor');
```

---

## 3. 입력 검증 (Zod)

```typescript
// lib/schemas.ts
import { z } from 'zod';

export const CreateTripSchema = z.object({
  destination: z.string().min(1).max(50),
  destinationCode: z.enum(['TYO', 'OSA', 'KYO']),
  startDate: z.string().datetime(),
  nights: z.number().int().min(1).max(30),
  companion: z.enum(['solo', 'friends', 'family', 'group']),
  preferences: z.object({
    vibes: z.array(z.string()).max(10),
    pace: z.enum(['relaxed', 'balanced', 'packed']),
    excludes: z.array(z.string().max(50)).max(20),
  }),
});

// API에서 사용
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateTripSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'validation_failed', issues: parsed.error.issues }, { status: 400 });
  }
  
  // ... parsed.data 사용 (타입 안전)
}
```

### XSS 방지

```
React 자동 escape: ✅ 일반적으로 안전
dangerouslySetInnerHTML: ❌ T13 리뷰에서 차단
사용자 HTML: DOMPurify로 sanitize
```

### SQL Injection 방지

```
Prisma parametrized: ✅ 자동
$queryRaw 사용 시: ❌ 입력은 반드시 Prisma.sql 태그로
```

---

## 4. Rate Limiting

```typescript
// lib/rate-limit.ts
const buckets = new Map<string, { count: number; resetAt: number }>();

const LIMITS = {
  user_api: { max: 100, windowMs: 60_000 },
  search_api: { max: 60, windowMs: 60_000 },
  validation_api: { max: 30, windowMs: 60_000 },
  llm_api: { max: 10, windowMs: 60_000 },
  auth_api: { max: 5, windowMs: 60_000 },
};

export function checkRateLimit(
  category: keyof typeof LIMITS,
  identifier: string // userId 또는 IP
): { allowed: boolean; remaining: number; resetAt: number } {
  const limit = LIMITS[category];
  const key = `${category}:${identifier}`;
  const now = Date.now();
  
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, remaining: limit.max - 1, resetAt: now + limit.windowMs };
  }
  
  if (bucket.count >= limit.max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  
  bucket.count += 1;
  return { allowed: true, remaining: limit.max - bucket.count, resetAt: bucket.resetAt };
}
```

> 프로덕션은 Redis 기반으로 교체 (분산 환경).

### 응답 헤더

```typescript
const result = checkRateLimit('user_api', userId);
const headers = {
  'X-RateLimit-Remaining': String(result.remaining),
  'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
};

if (!result.allowed) {
  return Response.json(
    { error: 'rate_limit_exceeded' },
    { status: 429, headers: { ...headers, 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
  );
}
```

---

## 5. 보안 헤더 (next.config.js)

```javascript
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=()' },
];

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

---

## 6. 사고 대응 절차

```
1. 즉시 (5분 내):
   - 노출된 키 회전
   - 영향 범위 파악 (AuditLog 분석)

2. 30분 내:
   - 사용자 알림 (필요 시)
   - 추가 모니터링

3. 24시간 내:
   - 사후 보고서 작성
   - 재발 방지책

4. 1주 내:
   - T18 회고
   - 도서관 갱신 (S-11 보강)
```

## 파일 위치

`c:\Projects\traveldiary-mvp\.claude\skills\api-security.md`
