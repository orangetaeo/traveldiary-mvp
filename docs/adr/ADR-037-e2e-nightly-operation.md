---
id: ADR-037
title: E2E nightly 운영 정책 (라이브 smoke 매일 KST 03:00)
status: Accepted
date: 2026-05-03
decider: R1 CTO
proposer: T15 DevOps + T12 QA
related: ADR-029 (CI 게이트), playwright.config.ts, e2e/smoke.spec.ts
---

# ADR-037: E2E nightly 운영 정책 (사이클 V)

## 컨텍스트

사이클 S(35eb085 + 067fe61)에서 GitHub Actions CI 게이트(`tsc + vitest + next build`)를 도입했지만, 이는 **빌드 시점 회귀**만 잡는다. 라이브 환경에서만 발견되는 회귀(시드 누락, env 키 만료, Railway 인프라 변동, DB 스키마와 코드 드리프트 등)는 사용자가 직접 발견하기 전까지 차단되지 않는다.

기존 자산:
- `playwright.config.ts` — 사이클 K 도입, `PLAYWRIGHT_BASE_URL` 지원
- `e2e/smoke.spec.ts` — 9 시나리오 (home/itinerary/item/city/translate/travel/checklist/cost/health)
- 사이클 S에서 tsconfig exclude로 빌드 격리 완료 — playwright.config.ts는 production 그래프에서 분리

## 결정

### A. 워크플로우: `.github/workflows/e2e-nightly.yml`

| 항목 | 값 | 근거 |
|---|---|---|
| `cron` | `0 18 * * *` UTC = KST 03:00 | 한국 사용자 트래픽 저시점 + 모니터링 알림이 다음 업무일 시작 시점 |
| `workflow_dispatch.inputs.base_url` | optional, default = production | 스테이징 추가 시 재사용 |
| `concurrency.group` | `e2e-nightly`, `cancel-in-progress: false` | 야간 누락 방지 — 직전 미완 시 다음 거 큐 대기 |
| Health probe (선행) | `curl /api/health` HTTP 200 검증 후 진행 | 라이브 다운 시 E2E 무의미 → fail-fast |
| `--reporter=github,html` | GitHub Actions annotation + HTML | annotation으로 즉시 확인 + HTML은 deep dive |
| Artifact 업로드 | playwright-report (14일) + trace on failure | 사후 디버깅 자료 |

### B. 알림 정책 (1단계)

- **현 단계**: 워크플로우 실패 자체가 GitHub 이메일 알림 (커밋터 + watcher) — 별도 Slack/Discord 미통합
- **승급 트리거**: 라이브 사용자 수 100+ 도달 OR 알림 누락으로 회귀 사용자 발견 사례 1건
- **승급 옵션**: GitHub Issue 자동 생성 (peter-evans/create-issue-from-file) → Slack webhook → PagerDuty (단계적)

### C. 무엇을 안 하는가

- ❌ E2E를 매 PR/push에 추가 — Playwright 브라우저 설치 4분 + smoke 1~2분 = CI 게이트 30% → 60% 시간 증가. 라이브 회귀는 "조기 경보"이 아닌 "사후 검출" 영역이라 nightly로 충분
- ❌ 데이터 변경 시나리오 — smoke는 read-only. mutation 시나리오는 별 워크플로우(주간 또는 PR-only sandbox DB)
- ❌ 실패 시 자동 롤백 — Railway 자동 롤백은 ADR 별도 안건 (사이클 W+)

### D. 운영

- 워크플로우 결과 모니터링: GitHub Actions 탭 직접 확인 (현 단계 100% 수동)
- 라이브 회귀 발견 시 → 사이클 시작 시 핸드오프에 "E2E nightly 빨강 N건" 명시 → STEP 1 우선 처리
- 워크플로우 자체 회귀 (false positive): playwright timeout, 네트워크 flake — `retries: 1` 이미 적용. 3회 연속 false positive 시 시나리오 재검토

## 결과

- 라이브 시드 누락/환경변수 만료/스키마 드리프트 회귀를 매일 새벽 자동 검출
- 사용자가 발견하기 전 차단 가능성 ↑
- 비용: GitHub Actions free tier — Linux 분당 $0.008, 1실행 5~7분 = 월 $1.5~2 미만
- 의존성 추가 0 (기존 playwright + smoke.spec 재활용)
- 마이그 0
- 사용자 액션: 0 (Branch Protection은 ADR-029 별도 안건)

## 회귀 방어

- E2E 시나리오 자체가 회귀 정의 — smoke.spec.ts에 시나리오 추가 시 nightly 자동 반영
- ADR-029 CI 게이트는 빌드 회귀, ADR-037 E2E nightly는 라이브 회귀 — **계층 분리**

## 다음 ADR 후보

- ADR-038: E2E mutation 시나리오 + sandbox DB (필요 시)
- ADR-039: 알림 자동 경로 (issue/Slack) — 라이브 트래픽 100+ 도달 후
