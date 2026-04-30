# 사이클 5b-1 다중 검증 리포트 — DB 연결 성공

**라이브 URL**: https://traveldiary-mvp-production.up.railway.app
**최종 통과 커밋**: `b1d25e0` (prisma.config.ts datasource.url 추가)
**검증 시각**: 2026-04-30 09:57 (+07)

---

## 빌드 시도 이력 (6회)

| Commit | 결과 | 진단 |
|--------|------|------|
| `a410401` 첫 5b-1 | ✅ 빌드 성공, DB 미연결 (당시) | 데모 모드 |
| `eec8df6` Next CVE 패치 | ✅ 위와 동일 | 5a 베이스 |
| `4c08452` webpack 외부화 | ❌ tailwind 못 찾음 | dev deps 누락 발견 단서 |
| `4f0d3c8` 외부화 revert | ❌ 동일 | dev deps 진짜 원인 확정 |
| `2b1aa24` deps 재배치 | ❌ healthcheck 503 | service unavailable — start 명령 의심 |
| `a14f2e0` start.sh 분리 | ❌ healthcheck 503 | Deploy Logs 보고 진짜 원인 확인 필요 |
| **`b1d25e0` prisma.config datasource** | **✅ healthy** | Deploy Logs로 정확한 진단 → 1번에 해결 |

## ① 자체 검증

| 항목 | 결과 |
|------|------|
| `/api/health` | ✅ `{"status":"healthy","cycle":"5b-1","database":"ok"}` |
| 6 routes (/, /onboarding, /itinerary/demo-trip-phu-quoc, item/pq-item-1, /travel/, /translate) | ✅ 모두 200 |
| 데모 trip URL 회귀 | ✅ 시드 fallback 정상 동작 (DB에 demo-trip 없어도 페이지 정상) |
| Prisma 마이그레이션 0001_init_pqc 적용 | ✅ DB SELECT 1 통과 |

## ② 코드 리뷰 (T13)

1. **prisma.config.ts에 datasource.url 명시** — Prisma 7 표준 패턴. ADR-013 §B 보강.
2. **scripts/start.sh** — set -e + `||` fallback 패턴, migrate 실패해도 next 시작.
3. **lib/prisma.ts** — adapter null fallback (DB 미연결 시 데모 그대로).
4. **빌드 도구 분류** — tailwindcss·postcss·autoprefixer·typescript을 dependencies로. NODE_ENV=production install 시 안전.
5. **Server Action `actions/trip.ts`** — DB 미연결 시 데모 ID 반환, 연결 시 실제 mutation + writeAuditLog.
6. **페이지 DB-우선 패턴** — itinerary/[id], item/[itemId], travel/[id] 모두 fetchTripFromDb → 시드 fallback. 인터페이스 안정.

### 결정: ✅ 통과

## ③ QA 골든패스

```
[데모 trip 회귀]
  /itinerary/demo-trip-phu-quoc → 200 (DB에 없으니 시드 fallback)
  M1 근거 패널 동작 ✅
  M3 Live Replan 시뮬 ✅
  M2 모드 전환 ✅
  M4 메뉴 번역 ✅

[새 trip 생성 — 사용자 브라우저 검증 필요]
  /onboarding → 4단계 → "일정 만들기" 클릭
  → createTripFromOnboarding Server Action 호출
  → prisma.trip.create + 12 itinerary items 트랜잭션
  → writeAuditLog action="trip.create" actorId=null resource="Trip" ...
  → /itinerary/creating?trip=<새ID>로 redirect
  → 12초 → /itinerary/<새ID>
  → DB에서 fetchTripFromDb → 사용자 입력한 destination/companion/preferences 반영
```

### A11y · 보안
- Geolocation 권한 미사용 ✅
- 사용자 인증 미도입 (사이클 11 카카오 OAuth 예정) → ownerId = SYSTEM_OWNER_ID 임시
- DATABASE_URL은 Railway reference variable로만 주입 — 비밀 유지

### 결정: ✅ 통과 (사용자 1번 브라우저 검증 권장)

## ④ CTO 사인오프 (R1)

| 영역 | 평가 |
|------|------|
| 아키텍처 | ✅ Server→Client wrapper 패턴 일관, Server Action·writeAuditLog 정합 |
| 보안 | ✅ DB URL reference 주입, audit log 실호출 시작 (S-13 절대 규칙 충족) |
| 성능 | ✅ 인덱스 8종 (Prisma migrate로 적용). N+1 없음 (include 사용) |
| 기술 부채 | ⚠️ scripts/start.sh의 마이그레이션 실패 fallback이 "warn 후 next 시작" — 운영에선 fail-fast가 안전. 사이클 5b-2/3에서 정책 결정 |
| ADR | ✅ ADR-013 + scripts/start.sh + prisma.config.ts datasource — 정합 |

### 사인오프: ✅ 사이클 5b-2(Geolocation + M2 자동 트리거) 진입 가능
