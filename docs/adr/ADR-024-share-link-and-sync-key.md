---
id: ADR-024
title: ShareLink 모델 + 동기화 키 (시드니 패턴, OAuth 없이 협업)
status: Accepted
date: 2026-04-30
decider: R1 CTO
proposer: T9 Business + T16 Security + T14 DB
related: ADR-022 (M6 마이그레이션), v2 §4 ShareLink (C1·C2)
---

# ADR-024: ShareLink — URL 토큰만으로 협업 (사이클 11a)

## 컨텍스트

- v2 §4 ShareLink 모델: 시드니 패턴 — 카카오 OAuth 없이 문자열 키만으로 협업.
- 사이클 11b OAuth는 사용자 액션 부담 큼 (카카오 콘솔, redirect URI). 별도 사이클로 분리.
- 사이클 11a는 OAuth 없이 *링크 공유*만. view-only 우선, edit 권한은 11b OAuth 후.

## 결정

### A. ShareLink 모델

```prisma
model ShareLink {
  id          String   @id @default(cuid())
  tripId      String
  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)

  /** URL 노출 키 — cuid()의 충분히 unguessable 부분 */
  syncKey     String   @unique
  /** "view" | "edit" — 11a는 view만 허용, edit는 11b OAuth 후 */
  permission  String   @default("view")
  expiresAt   DateTime?
  /** 누가 만들었는지 — 11a는 null, 11b OAuth 후 사용자 ID */
  createdBy   String?

  createdAt   DateTime @default(now())
  revokedAt   DateTime?

  @@index([syncKey])
  @@index([tripId])
}
```

### B. syncKey 생성

cuid()는 25~32자 collision-resistant. 충분히 unguessable.
→ `crypto.randomUUID()` 또는 `cuid()`로 syncKey 생성, URL `/share/[syncKey]` 노출.

### C. /share/[syncKey] 페이지

- view-only 권한만 노출
- 일정 카드 + 시간표 + 추천 근거 패널 (M1)
- "복사해서 내 여행으로" 버튼은 11b OAuth 후 (지금은 read-only 안내만)
- expiresAt 만료 또는 revokedAt 설정 시 → 만료 페이지

### D. ShareLink 생성 흐름

`/itinerary/[id]` 또는 `/travel/[id]`에서 "공유" 버튼 클릭:
1. `createShareLink(tripId)` Server Action 호출
2. 결과: `{ syncKey, url }` 반환
3. ShareModal에서 URL 노출 + "복사" 버튼

### E. 데모 fallback (5b 답습)

DEMO_TRIP_ID 또는 DB 미연결 → `mode:"demo"`, 클라이언트 시뮬 syncKey + 알림 토스트.

### F. AuditLog 액션 추가

```
+ "share.create"    (createShareLink)
+ "share.revoke"    (사이클 11b+에서 사용)
+ "share.access"    (사이클 11b+에서 옵션, 5b-5 audit fresh-only 답습)
```

### G. mutation 표준 — 5b-2 답습

```typescript
createShareLink({ tripId, expiresInDays? }): { syncKey: string; url: string }
revokeShareLink({ id, tripId }): { ok: boolean }
fetchByShareKey(syncKey): TripBundle | null
```

낙관적 동시성 미도입 (단일 사용자, 11b 후 검토).

### H. UI

- `ItineraryView` 하단 "공유" 버튼 → ShareModal
- `ShareModal` — 생성/복사/만료시간 설정
- `/share/[syncKey]` — view-only Itinerary 노출 (간소화)

### I. Privacy (T16)

- syncKey는 unguessable이지만 *URL 알면 누구든 접근 가능*. 사용자에게 명시
- expiresAt 자동 만료 (기본 30일)
- revokedAt으로 즉시 차단 가능 (11b+)
- 사이클 11a 단계엔 view만 — write 권한 누출 위험 0

## 대안

### 대안 1 — 카카오 OAuth 동시 도입 (비채택)
- 사용자 액션 ↑ (카카오 콘솔, redirect URI, JWT secret 등)
- 11b로 분리

### 대안 2 — JWT 토큰으로 syncKey 대체 (비채택)
- 만료/권한을 JWT payload로 검증 가능하지만 11a 범위 ↑
- 단순 cuid + DB 조회로 충분

## 영향

### 긍정
- M7 매직 모먼트 첫 활성 — 사용자가 친구에게 일정 공유 가능
- OAuth 없이 단순 링크로 협업 (시드니 패턴)
- 11b OAuth 도입 시 ShareLink.createdBy + permission="edit" 활성

### 부정
- syncKey URL 알면 누구든 접근 — 명시 필요 (Privacy 안내)
- expiresAt 만료 정리 cron 미도입 (11b+ 운영 단계)

## 사용자 직접 액션

```
없음 — Railway 자동 배포 + 마이그레이션 0004. 라이브 즉시 사용.
```

## 검증 통과 기준 (STEP 4)

- [ ] tsc + build 통과
- [ ] 마이그레이션 0004 자동 적용 (라이브 healthy + database OK)
- [ ] 데모 trip → 공유 버튼 → mode:"demo" 토스트
- [ ] DB trip → 공유 → syncKey 생성 + AuditLog "share.create"
- [ ] /share/[key] 진입 → view-only trip 노출
- [ ] 잘못된 key → 404

## 사인오프

R1 ✅ · T9 ✅ · T14 ✅ · T16 ✅ · T13 ✅
