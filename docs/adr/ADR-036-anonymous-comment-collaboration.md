---
id: ADR-036
title: 익명 댓글/리액션 협업 (nickname + clientUuid) + 카카오톡 공유 URL scheme
status: Accepted
date: 2026-05-02
decider: R1 CTO
proposer: T8 PM + T9 Business + T16 Security + T17 UX
related: ADR-024 (ShareLink), ADR-026 (카카오 OAuth — 미활성 시점에 익명 우선)
---

# ADR-036: M7 협업 강화 — 익명 댓글/리액션 + 카카오 공유 (사이클 R)

## 컨텍스트

CLAUDE.md M7 = 공유 링크 + 동기화 키 협업. 사이클 11a/11b/11c로 ShareLink 인프라는 구축됐으나 **view-only**. 사용자 카카오 OAuth 활성 대기 중.

**한계**:
- 일행 4명이 공유 받아도 의견 교환 불가 (받기 전용)
- 공유 채널이 URL 복사뿐 — 한국 사용자 90%가 카카오톡 사용
- ShareLink 받은 trip 다시 찾기 어려움

**OAuth 의존성**: 사용자 액션 대기 — OAuth 활성될 때까지 차단되면 M7 강화 자체 멈춤. **nickname 기반 익명 협업 우선**, OAuth 활성 후 actorId 매핑은 nullable 컬럼으로 자연 통합.

## 결정

### A. ShareComment 모델 (마이그 0008)

```prisma
model ShareComment {
  id          String   @id @default(cuid())
  shareLinkId String
  shareLink   ShareLink @relation(fields: [shareLinkId], references: [id], onDelete: Cascade)
  /** trip 전체 댓글이면 null, 일정별이면 ItineraryItem.id */
  itemId      String?
  /** 표시 닉네임 — 2~10자 */
  nickname    String
  /** 본문 — 최대 200자, HTML escape 후 저장 */
  body        String   @db.VarChar(500)
  /** 가벼운 투표 흡수 — 옵션 D */
  reaction    String?  // "LIKE" | "DISLIKE" | "QUESTION" | null
  /** 본인 식별 토큰 — LocalStorage UUID, 본인 삭제 권한 (OAuth 없이) */
  clientUuid  String
  /** OAuth 활성 후 user.id 매핑 (nullable) — 마이그 없이 자연 통합 */
  actorId     String?
  createdAt   DateTime @default(now())
  deletedAt   DateTime?
  @@index([shareLinkId])
  @@index([clientUuid])
  @@index([deletedAt])
}
```

### B. nickname + clientUuid 식별 정책

- **nickname**: 2~10자, 사용자가 입력. XSS escape, 욕설 필터는 사이클 R 외.
- **clientUuid**: LocalStorage `td_client_uuid` (`crypto.randomUUID()`) — 1년 유효. 본인 삭제 권한.
- **actorId**: nullable. OAuth 활성 시 자동 채움 (UpdateMutation 미들웨어).

### C. AuditLog enum 추가

```ts
+ "comment.create"
+ "comment.delete"
+ "reaction.toggle"
```

### D. 카카오 공유 — Web Share API + URL scheme (의존성 0)

```ts
async function share(url: string, text: string) {
  if (navigator.share) {
    try { await navigator.share({ url, text }); return; } catch {}
  }
  // 폴백 — 카카오 share URL scheme
  window.open(
    `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
}
```

- Web Share API 우선 (모바일 native 시트 — 카톡·메시지·메일 통합)
- 폴백: 카카오 share URL (PC 또는 미지원 브라우저)
- `@kakaopay/link-sdk` 신규 의존성 **거부** (카카오 콘솔 등록 부담)

### E. ShareLink 만료/revoke 정책 — repository 레벨 차단

```ts
async function createComment(shareKey: string, ...) {
  const link = await fetchShareLinkBySyncKey(shareKey);
  if (!link) throw new ShareError("not_found");
  if (link.revokedAt) throw new ShareError("revoked");
  if (link.expiresAt && link.expiresAt < new Date()) throw new ShareError("expired");
  // ...
}
```

UI 신뢰 X — repository 레벨 검증 + vitest 회귀 단언.

### F. 데모 모드 fallback

DATABASE_URL 미설정 → `mode: "demo"` + LocalStorage에 댓글 저장 (sessionStorage는 새로고침 시 사라짐). 실 DB 연결 시 마이그 적용 필요.

### G. Rate Limit (T16)

clientUuid당 분당 5건 댓글 (in-memory rate limiter, edge case는 사이클 R 외).

## 거부된 대안

### Vote 통합 (별 라우트)
- `/vote/[tripId]`는 그대로 유지 (별 라우트 의미 명확)
- 댓글에 `reaction` 필드로 가벼운 투표 흡수

### 정산(E1) — Cost 모델 + 일행
- M9 후보. ShareComment와 결합도 높지만 일행 식별 OAuth 의존
- 사이클 R 범위 외

### 카카오 Link SDK
- 의존성 1개 + 카카오 콘솔 등록
- URL scheme + Web Share API로 95% 커버

### `/shared` 받은 trip 목록 페이지 (LocalStorage)
- A 안정화 후 별도 미니 사이클로

## 영향

### 코드
- 신규: `prisma/migrations/0008_share_comment/migration.sql`
- 신규: `prisma/schema.prisma` (+15행 ShareComment)
- 신규: `lib/repositories/shareComment.ts` (~120행) + `actions/shareComment.ts` (~60행)
- 신규: `lib/share/clientId.ts` (~40행) — LocalStorage UUID
- 신규: `app/share/[key]/CommentSection.tsx` (~180행, "use client")
- 신규: `components/share/KakaoShareButton.tsx` (~60행)
- 수정: `lib/audit-log.ts` — comment.* + reaction.toggle 추가
- 수정: `components/share/ShareModal.tsx` — KakaoShareButton 추가
- 수정: `app/share/[key]/page.tsx` — CommentSection 추가
- 신규 의존성 0

### 테스트
- 신규: `tests/unit/share-comment.test.ts` — repository 권한·만료·revoke·rate limit·XSS escape (~14건)

### 사용자 화면
- `/share/[key]` 하단 댓글 섹션 (nickname 입력 후 댓글 + 리액션)
- `ShareModal` "카카오톡 공유" 버튼 (Web Share API + URL scheme)

## 검증 기준

- ShareComment 마이그 0008 실 DB 적용 가능 (사용자 액션은 별도 — `prisma migrate deploy`)
- nickname 2~10자 + body 200자 길이 검증
- ShareLink 만료/revoke 시 댓글 작성 차단 (repository 레벨)
- AuditLog `comment.create` / `comment.delete` / `reaction.toggle` 동시 구현
- Web Share API 미지원 브라우저에서 카카오 URL scheme 폴백
- vitest ≥14건 신규 + 기존 회귀 0
- TypeScript `tsc --noEmit` 0 에러
