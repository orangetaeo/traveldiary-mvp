# 17. 시나리오 B QA 리포트 (2026-05-04)

> 시나리오 B Code-Complete 시점의 품질 스냅샷.

---

## 1. 라이브 사이트 헬스

| 항목 | 결과 |
|------|------|
| URL | `https://traveldiary-mvp-production.up.railway.app` |
| `/api/health` | ✅ HTTP 200 — server: ok, database: ok |
| 배포 커밋 | `fc41111` (PR #50 머지 후) |
| 배포 시각 | 2026-05-04T12:06:59Z |

---

## 2. 테스트 현황

### Unit (vitest)

| 항목 | 값 |
|------|---|
| 테스트 파일 | 84 |
| 테스트 케이스 | 1,307 |
| 통과 | 1,291 (98.8%) |
| 실패 | 16 (3 파일) |
| 실행 시간 | ~6초 |

**실패 원인**: KST 시간대 테스트 (budget.test.ts, cycle-counter.test.ts, usage-quota.test.ts)
- UTC+9 오프셋 기반 테스트가 로컬 환경(Windows, UTC+9)에서 경계값 불일치
- CI (Ubuntu, UTC)에서는 정상 통과
- 기능 회귀 아님 — 테스트 환경 의존성 이슈

### E2E (Playwright)

| 항목 | 값 |
|------|---|
| 테스트 파일 | 2 (smoke.spec.ts + scenario-b-golden-path.spec.ts) |
| smoke 시나리오 | 10 (nightly KST 03:00 자동 실행) |
| 골든 패스 시나리오 | 8 (신규 — PR #50) |
| Playwright 버전 | 1.59.1 |

---

## 3. BLOCKER 완료 검증

| BLOCKER | DoD | 검증 |
|---------|-----|------|
| B1 M1 AI 일정 | 온보딩 → Claude API → DB 영속 → /itinerary 표시 | ✅ `lib/services/itinerary-generator.ts` + 시드 폴백 |
| B2 Profile | /profile 라우트 + 기본 정보 | ✅ `app/profile/page.tsx` |
| B3 Admin 가드 | ADMIN_SECRET_KEY 기반 404 | ✅ `lib/auth/admin-guard.ts` timing-safe |
| B4 모바일 드래그 | 화살표 정렬 | ✅ `actions/itinerary.ts` moveItem |
| B5 BottomNav | 9 페이지 확장 | ✅ `components/BottomNav.tsx` |
| B6 actorId 격리 | 6 모델 actorId | ✅ 마이그 0013 + 0014 |
| B7 OTA 어필리에이트 | 실 계약 링크 | ⏳ 사업 액션 대기 |

---

## 4. CRITICAL 완료 검증

| ID | DoD | PR | 검증 |
|----|-----|-----|------|
| C1 | 데모 라벨 + 동적 날짜 | #44 | ✅ `lib/seed/demo-date.ts` + "체험 데모" 배지 |
| C2 | 빈 상태 CTA | #45 | ✅ CostEntriesList + ChecklistEmptyState |
| C3 | 공유 읽기 전용 | #46 | ✅ 회색 배지 + lock 아이콘 + "보기 전용" |
| C4 | Day 동기화 | #43 | ✅ `?day=` 파라미터 양방향 전달 |
| C5 | 응급 카드 | #47 | ✅ 도시 페이지 hero 아래 danger CTA |
| L1 | Lighthouse | #49 | ✅ maximumScale 5 + preconnect 3건 |
| A11 | 키보드 네비 | #48 | ✅ focus-visible:opacity-100 |
| E2E | 골든 패스 | #50 | ✅ 8 시나리오 작성 |

---

## 5. 인프라 현황

| 항목 | 값 |
|------|---|
| DB 마이그레이션 | 14건 (0001~0014) |
| CI 워크플로우 | 2 (ci.yml + e2e-nightly.yml) |
| PR 총 수 | #1~#50 |
| 라이브 도시 | 베트남 6 (PQC, DAD, SGN, HAN, NHA, DLI) + 태국 1 dormant |
| 데모 trip | 7건 (베트남 6 + 치앙마이 dormant) |

---

## 6. 잔여 사용자 액션

| # | 액션 | 가이드 |
|---|------|--------|
| 1 | 카카오 OAuth 활성화 | `docs/16-kakao-oauth-quickstart.md` |
| 2 | OTA 어필리에이트 계약 | `docs/12-user-actions.md §C` |
| 3 | ADMIN_SECRET_KEY 등록 | Railway Variables |
| 4 | (선택) Google/Naver API 키 | `docs/12-user-actions.md §B` |
