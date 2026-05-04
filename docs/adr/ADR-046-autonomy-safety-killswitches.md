---
id: ADR-046
title: 24h 자율 모드 안전 킬스위치 4종 도입 (사이클 ZZZ)
status: Accepted (2026-05-04, cycle ZZZ)
date: 2026-05-04
decider: R1 CTO
proposer: R1 CTO + T15 DevOps + T19 Librarian + T18 Self-Evolution + T16 Security (5인 회의)
related: AUTONOMY.md §0.5.1, ADR-026 (카카오 OAuth), ADR-040 (ESLint CI 게이트)
---

# ADR-046: 24h 자율 모드 안전 킬스위치 4종 도입 (사이클 ZZZ)

## 컨텍스트

2026-05-04 사용자가 "보호된 11시간 자율(KST 22:00~09:00) + 09:00 검증" 모드 채택. STEP 2 회의(R1 CTO + T15 DevOps + T19 Librarian + T18 Self-Evolution + T16 Security 5인)에서 P0 10건이 식별됐고, 그 중 **자율 진입 전 안전 차단** 영역(T16 그룹 C) 4건을 사이클 ZZZ에서 우선 도입하기로 결정.

**5명 공통 합의**: AI는 자기 PR을 자기 리뷰 → 독립 검증 구조적 불가능. 따라서 자율 모드에서는 **돌이킬 수 없는 행동**(자동 머지, secret 노출, API 폭주)을 사전에 차단해야 함.

## 결정

**4종 안전 킬스위치 도입. anthropic API quota wrap만 ZZZ에 포함, 5개 잔여 외부 API wrap은 사이클 AAAA로 분리.**

### 결정 매트릭스

| 결정 | 선택 | 근거 |
|---|---|---|
| **D1 자동 머지 차단** | A — `.claude/settings.json` Bash deny | 자율 모드가 자기 PR을 `gh pr merge --admin`/`--auto`/`gh pr review --approve`로 우회 머지 불가. 머지는 09:00~22:00 사용자 시간에만. T12 권장으로 `gh api ... pulls/N/merge --method PUT` 우회 경로도 차단 |
| **D2 Secret 노출 방지** | A — 2중화 (settings.json `.env*` Read deny + CI grep) | 로컬에서 Read 자체 차단 + CI에서 코드 노출 grep 차단. gitleaks 같은 npm 의존성 추가 회피(R1 게이트). `.env.example`는 허용 |
| **D3 외부 API 일일 cap** | B — `lib/usage-quota.ts` in-memory 헬퍼 + provider별 default + env override | DB/Redis 영속 카운터는 AAAA로 미룸. 사이클 ZZZ 범위는 인터페이스(`assertQuota`/`recordExternalCall`)와 1개 wrap(anthropic) 검증. KST 자정 자동 리셋 |
| **D4 AuditLog secret redact** | A — `sanitizeAuditValue()` 13 키 패턴 자동 redact | before/after/metadata 3 슬롯 모두 적용. 도메인 데이터(tripId/sortOrder/source 등)는 매칭 0건 검증. 깊이 6 가드 + 중첩/배열 지원 |
| **D5 anthropic만 ZZZ wrap** | A — 1 서비스 시범 | M1 미활성 → 현 시점 비용 임팩트 가장 큼. 5개 잔여(google-vision/places/directions, naver-search, ota)는 AAAA에서 일괄 wrap. ADR-045 답습(시범 도입 → 검증 → 확장) |
| **D6 deny 보수성** | A — `Bash(rm -rf .*)`, `git push --no-verify` 등 광범위 차단 | 의도적 정리는 사용자 명시 승인 후 case-by-case 허용. 자율 모드 안전 우선 |

### 안전 킬스위치 카탈로그

#### 1. 자동 머지/승인 차단 (`.claude/settings.json` deny)

```
Bash(gh pr merge*--admin*)        Bash(gh pr merge*--auto*)
Bash(gh pr merge*-A *)            Bash(gh pr merge*-A)
Bash(gh pr review*--approve*)
Bash(gh api*--method PUT*pulls*reviews*)
Bash(gh api*--method POST*pulls*reviews*event=APPROVE*)
Bash(gh api*pulls/*/merge*)       Bash(gh api*--method PUT*pulls/*/merge*)
```

#### 2. 파괴적 git/DB 차단

```
Bash(git push --force*)           Bash(git push -f*)
Bash(git push origin main*)       Bash(git push --no-verify*)
Bash(git commit*--no-verify*)
Bash(rm -rf /*)                   Bash(rm -rf .*)        Bash(rm -rf ~*)
Bash(prisma migrate reset*)
```

#### 3. `.env*` 직접 읽기 차단 (`.env.example`은 허용)

```
Read(./.env)                      Read(./.env.local)
Read(./.env.production)           Read(./.env.production.local)
Read(./.env.development)          Read(./.env.development.local)
Read(./.env.test)                 Read(./.env.test.local)
Bash(cat .env)                    Bash(cat .env.local)
Bash(cat .env.production*)        Bash(cat .env.development*)
```

#### 4. CI Secret Scan (`.github/workflows/secret-scan.yml`)

PR + push to main 시 7 패턴 grep:
- `AKIA[0-9A-Z]{16}` (AWS access key)
- `sk-ant-[A-Za-z0-9_-]{30,}` (Anthropic)
- `sk-[A-Za-z0-9]{40,}` (OpenAI 등)
- `AIza[0-9A-Za-z_-]{35}` (Google)
- `ghp_[A-Za-z0-9]{36}` / `github_pat_[A-Za-z0-9_]{82}` (GitHub PAT)
- `xox[abp]-[A-Za-z0-9-]{20,}` (Slack)

#### 5. 외부 API 일일 cap (`lib/usage-quota.ts`)

| Provider | Default cap | env override | ZZZ wrap 적용 |
|---|---|---|---|
| anthropic | 1000 | `QUOTA_DAILY_CAP_ANTHROPIC` | ✅ |
| google-vision | 500 | `QUOTA_DAILY_CAP_GOOGLE_VISION` | ❌ → AAAA |
| google-places | 5000 | `QUOTA_DAILY_CAP_GOOGLE_PLACES` | ❌ → AAAA |
| google-directions | 5000 | `QUOTA_DAILY_CAP_GOOGLE_DIRECTIONS` | ❌ → AAAA |
| naver-search | 5000 | `QUOTA_DAILY_CAP_NAVER_SEARCH` | ❌ → AAAA |
| ota | 1000 | `QUOTA_DAILY_CAP_OTA` | ❌ → AAAA |

**KST 자정 자동 리셋** (`getKstMidnightMs()`). cap 도달 시 `QuotaExceededError` throw — anthropic wrap에서는 `{ mode: "error", code: "quota_exceeded" }`로 변환.

#### 6. AuditLog secret redact (`lib/audit-log.ts`)

13 키 패턴 (case-insensitive): `password / passwd / secret / token / api[_-]?key / authorization / bearer / cookie / session(?:[_-]?id)? / credential / private[_-]?key / access[_-]?key / refresh[_-]?token` → `[REDACTED]`. 깊이 6 + 중첩 객체 + 배열 지원.

## 트리거 (다음 사이클/ADR로 분리)

| 트리거 | 후속 |
|---|---|
| 5개 외부 API wrap 일괄 | 사이클 AAAA |
| 영속 카운터(DB/Redis) — 서버 재시작 무관 | AAAA + Prisma `UsageQuota` 모델 또는 Redis |
| 일일 예산($) 매핑 (호출수 → 비용) | AAAA |
| settings.json deny가 자율 사이클 진행 차단 사례 발생 | 사례 수집 → ADR supersede |
| secret-scan false positive 보고 | exclude pattern 보강 |

## 영향

### Positive
- 자율 모드 진입 전 P0 안전 4건 차단 → "11시간 보호된 자율" 진입 가능
- 의존성 0 (R1 게이트 회피) — 신규 npm 패키지 0
- AuditLog secret 노출 위험 사전 차단 (S-13 절대 규칙 강화)
- T12 권장 우회 경로(`gh api pulls/N/merge`) 사전 차단

### Negative
- in-memory STATE는 서버 재시작 시 카운터 리셋 → 영속화는 AAAA 필수
- 5개 외부 API는 ZZZ에서 미보호 → AAAA 머지 전 자율 모드 활성 시 폭주 위험 잔존
- deny 보수성 → 의도적 `rm -rf .next` 등은 사용자 명시 승인 후만 가능

### Neutral
- AAAA 머지까지 자율 모드 활성 권장 X (5개 wrap 누락 상태)
- 사용자 PC 24h 가동 + Windows Task Scheduler 셋업은 사이클 BBBB에서 가이드 작성

## 참조
- `lib/usage-quota.ts`, `tests/unit/usage-quota.test.ts` (14 케이스)
- `lib/audit-log.ts` `sanitizeAuditValue()`, `tests/unit/audit-log-sanitize.test.ts` (11 케이스)
- `lib/services/anthropic-claude.ts` (quota wrap 답습 패턴)
- `.claude/settings.json` deny 규칙 28건
- `.github/workflows/secret-scan.yml`
- `.claude/AUTONOMY.md` §0.5.1
