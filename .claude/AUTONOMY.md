# 🤖 자율 모드 운영 정책 — TravelDiary

> **목적**: 사용자가 "다음 뭐?"를 매번 답하지 않아도 사이클이 계속 진행되도록.
>
> **짝**: `docs/13-mvp-scenario-b-prd.md`(무엇을 할지) + 이 문서(어떻게 진행할지)
>
> **활성 일자**: 2026-05-03 (시나리오 B 채택과 함께)

---

## 0. 절대 원칙 (자율 모드 한정)

| # | 원칙 | 의미 |
|---|------|------|
| 1 | **PRD를 먼저 본다** | 다음 사이클 무엇을 할지는 `docs/13-mvp-scenario-b-prd.md` §3 사이클 시퀀스에서 결정. 사용자에게 묻지 않음. |
| 2 | **게이트는 절대 우회하지 않는다** | 새 의존성, 마이그, 외부 API 모델 선택, 베트남 정책 위반은 사용자/R1 CTO 호출 필수. |
| 3 | **막히면 멈춰서 묻는다** | 자율로 답할 수 없으면 진행을 멈추고 사용자 호출. 추측해서 굳히지 않음. |
| 4 | **체크포인트는 N=3 사이클** | 3 사이클마다 진행 상황을 메모리에 누적. 사용자가 들어오면 한 번에 파악 가능. |
| 5 | **회의 5단계는 유지** | 자율 모드라도 STEP 1~5 절차는 그대로. R1 CTO 게이트만 매트릭스대로 자동/수동 분기. |

---

## 0.5. 자율 모드 캡 정책 (2026-05-03 사용자 결정)

| 항목 | 값 | 사유 |
|------|----|------|
| **자율 시간대** | 22:00 ~ 09:00 (매일, 11시간) | default offset 9 (KST). env `AUTONOMY_TZ_OFFSET_HOURS` override 가능 — 베트남/태국 거주 시 7 (사이클 AAAA9). 사용자 자는 시간만 자율. 깨어있는 시간(09:00~22:00)은 동기 모드. **테스트 우회**: env `AUTONOMY_BYPASS_HOURS_GATE=1` (process scope만, 사이클 AAAA10) — audit log 추적. |
| **자율 사이클 캡** | **10 사이클/일** | 비용 + 컨텍스트 보호. 도달 시 자율 자동 정지(자는 시간 남았어도). |
| **컨텍스트 가드** | 세션당 **80%** | 80% 도달 시 즉시 핸드오프 작성 + 세션 종료 + 새 세션 자동 시작. |
| **세션당 사이클** | 최대 **3 사이클** | 컨텍스트 누적 차단. 3 사이클 종료 시 핸드오프 + 새 세션. |
| **게이트 batch** | **5건 또는 6시간** 중 먼저 도달 | 자는 시간에 게이트 발생 시 즉시 정지가 아니라 batch 메모리에 누적. 5건 또는 6시간 도달 시 batch 알림 메모리 잠금(다음 사이클 정지). |
| **자율 영역** | Phase 1 + Phase 6 + 리팩터/테스트만 | M1(Phase 4) 핵심 결정은 자는 시간 진행 금지. 깨어있는 시간만. |

### 0.5.1 안전 킬스위치 (사이클 ZZZ 도입, AAAA1 보강)

| 항목 | 값 | 위치 |
|------|----|------|
| **외부 API 일일 cap** | anthropic 1000 / google-vision 500 / google-places 5000 / google-directions 5000 / naver-search 5000 / ota 1000 (env `QUOTA_DAILY_CAP_<PROVIDER>` override) | `lib/usage-quota.ts` — 6 서비스 모두 wrap 적용 (AAAA1): `anthropic-claude / google-vision / google-places / google-directions / naver-search / ota{agoda,kkday,klook}`. cap 도달 시 `QuotaExceededError` → `{mode:"error", code:"quota_exceeded"}` outcome |
| **AuditLog metadata redact** | 13개 키 패턴 `password / passwd / secret / token / api[_-]?key / authorization / bearer / cookie / session(?:[_-]?id)? / credential / private[_-]?key / access[_-]?key / refresh[_-]?token`은 자동 `[REDACTED]` (case-insensitive, 중첩/배열 지원, 깊이 6) | `lib/audit-log.ts` `sanitizeAuditValue()` |
| **자동 머지/승인 차단** | `gh pr merge --admin/--auto/-A`, `gh pr review --approve`, `gh api ... reviews ... event=APPROVE` | `.claude/settings.json` deny |
| **파괴적 git 차단** | `git push --force/-f`, `git push origin main`, `git push --no-verify`, `git commit --no-verify` | `.claude/settings.json` deny |
| **`.env*` 직접 읽기 차단** | `Read(./.env*)`, `Bash(cat .env*)` (단 `.env.example`은 허용) | `.claude/settings.json` deny |
| **CI Secret Scan** | PR/push to main 시 위험 패턴 grep (AKIA, sk-ant-, sk-, AIza, ghp_, github_pat_, xox[abp]-) | `.github/workflows/secret-scan.yml` |

### 0.5.2 사이클 카운터 + 모델 라우팅 (사이클 AAAA1 도입)

| 항목 | 값 | 위치 |
|------|----|------|
| **일일 사이클 카운터** | 메모리 파일 기반 `memory/autonomy_counter_YYYY-MM-DD.json` (KST 일자). `cycles/cap/lastCycleAt/lastCycleId`. 파일명 일자 박힘 → KST 자정 자동 리셋 (새 파일 0부터). | `lib/autonomy/cycle-counter.ts` — `assertCycleCap()` (STEP 1) + `incrementCycleCount(id)` (STEP 5) |
| **자율 시간대 게이트** | `isAutonomyHours(now)` — KST 22:00~09:00 범위 체크. STEP 1 진입 시 호출. | 동일 |
| **사이클 캡 override** | env `AUTONOMY_DAILY_CYCLE_CAP` (default 10) | 동일 |
| **모델 라우팅** (ADR-047) | Triage=Haiku / 회의·구현·검증=Sonnet / R1게이트·M1·5+ 파일·보안=Opus. 분포 목표 H 5~10% / S 70~75% / O 15~25%. | `docs/adr/ADR-047-model-routing-policy.md` — 권장만, 강제 메커니즘은 AAAA2 |
| **Opus 호출 전 4-체크** | 5+ 파일 / 아키텍처·보안 / Sonnet 2회 실패 / release 전 최종 QA — 모두 Yes일 때만 Opus | ADR-047 |

### 0.5.6 quarantine 무한 루프 가드 (사이클 AAAA4 도입)

| 항목 | 값 | 위치 |
|------|----|------|
| **인메모리 cap** | `MAX_QUARANTINE_ATTEMPTS = 3` (R1 결정). 동일 srcPath 4번째 호출부터 rename 시도 skip. | `lib/autonomy/budget.ts` `quarantineAttempts: Map<string, number>` |
| **DEAD flag 영속 sentinel** | cap 도달 시 `<dir>/quarantine/QUARANTINE_DEAD.flag` (JSON: srcPath/reason/attempts/cap/failedAt) 작성. 사용자 가시화 + 운영 모니터링 채널. | 동일 `getQuarantineDeadFlagPath()` |
| **audit dedup** | `auditedQuarantineFailures: Set<string>` keyed by `${normalizedPath}:rename_failed` / `${normalizedPath}:cap_exceeded`. 동일 path 동일 reason은 1회만 audit. | 동일 |
| **절대경로 정규화** | `path.resolve(srcPath)`로 normalized. 같은 파일이 다른 표기(상대/절대/심볼릭)로 cap 우회 차단 (T12 권고). | 동일 |
| **rename 성공 시 리셋** | quarantine 성공 시 `quarantineAttempts.delete()` + 양 dedup 키 delete. 디스크 일시 장애 회복 후 재손상 정상 cap 보장. | 동일 |
| **DEAD flag silent fail** | DEAD flag write 자체 실패도 try/catch silent (R1: 인메모리 cap이 1차 방어선이므로 충분). | 동일 |
| **audit log 2 key 추가** | `quarantine.rename_failed` / `quarantine.cap_exceeded` (모두 severity:"security"). | `lib/audit-log.ts` `AuditAction` |
| **수동 개입 필요** | cap 초과 후 자동 리셋 없음. 사용자가 DEAD flag 보고 디스크 복구 후 `__resetQuarantineForTests` 또는 프로세스 재시작. | `memory/ENTRY.md` "6. 손상 복구" |

**옵션 매트릭스 (회의 합의)**:

| | A 인메모리 cap | B sentinel 파일 | C 즉시 throw | A+B 하이브리드 (채택) |
|---|---|---|---|---|
| 안전성 | 중 | 중-상 | 상 | **상** |
| 영속성 | 프로세스만 | 영속 | 영속 (자율 정지) | **영속** |
| 운영 부담 | 낮음 | 낮음 | 높음 | **낮음** |
| DoS 표면 | 없음 | 없음 | **있음** (1바이트 손상으로 영구 정지) | **없음** |

C(즉시 throw) 회피 사유: 공격자가 flag 1바이트 손상시키면 자율 영구 정지 → DoS 표면.

### 0.5.5 안전 회로 fail-closed + quarantine + 입력 가드 (사이클 AAAA3 도입)

| 항목 | 값 | 위치 |
|------|----|------|
| **flag 손상 fail-closed** | `readAutonomyPausedFlag` JSON parse 실패 또는 알 수 없는 reason → quarantine + sentinel `{reason:"flag.corrupt"}` 반환. `assertBudget`/`assertAutonomyEntry`가 sentinel 보고 throw → 자율 진입 차단 | `lib/autonomy/budget.ts` |
| **state 손상 quarantine** | `readBudgetState` JSON parse 실패 → `memory/quarantine/usage_quota_*.json.corrupt-<timestamp>` 이동 + audit + default 시작 (그날 누적 유실, 다음 호출부터 0) | 동일 |
| **음수/NaN/Infinity 입력 가드** | `recordSpend` 진입 시 `Number.isFinite + >= 0` 검사. 위반 시 audit `usage.budget.invalid_input` (severity:"security") + silent skip (외부 응답은 사용 가능, 누적만 0) | 동일 |
| **quarantine 디렉토리** | `memory/quarantine/` (`.gitignore` 등록 — git 추적 차단). 30일 자동 정리는 AAAA4 백로그 | `.gitignore` |
| **audit log 3 키 추가** | `usage.budget.invalid_input` / `usage.budget.state_corrupt` / `autonomy.flag_corrupt` (모두 severity:"security" metadata) | `lib/audit-log.ts` |
| **`clearAutonomyPausedFlag` 자동 호출 차단** | ESLint `no-restricted-imports` — `scripts/` + `tests/` 외 호출 차단. 손상 fail-closed 우회 방지 | `.eslintrc.json` |
| **손상 복구 절차** | ENTRY.md "6. 손상 복구" — 09:00 사용자 검사 → 원인 분석 → 수동 `clearAutonomyPausedFlag` 호출 (CLI/스크립트만) | `memory/ENTRY.md` |

**flag reason 화이트리스트** (T12 권고):
- `budget.emergency` — AAAA2 emergency 도달
- `manual` — 수동 일시 정지 (향후)
- `flag.corrupt` — AAAA3 fail-closed sentinel

이 외 reason은 손상으로 간주하여 quarantine.

### 0.5.4 비용 트래킹 + 임계치 + 모델 라우팅 헬퍼 (사이클 AAAA2 도입)

| 항목 | 값 | 위치 |
|------|----|------|
| **비용 트래킹** | 메모리 파일 JSON `memory/usage_quota_YYYY-MM-DD.json`. provider/model별 count + inputTokens + outputTokens + costUsd + 시간당 버킷. KST 자정 자동 리셋. | `lib/autonomy/budget.ts` `recordSpend()` |
| **임계치 3단계** | warn (log+audit) → throw (BudgetExceededError, 호출자 demo fallback) → emergency (AUTONOMY_PAUSED.flag 생성, 자율 정지) | 동일 |
| **임계치 기본값** | 시간당 $3 warn / $6 throw, 일일 $30 warn / $50 throw / $200 emergency | env override 7개 |
| **사전 게이트** | `assertBudget(now?, dir?)` — 외부 API 호출 전 검사. emergency flag 우선, throw 임계치 후순. recordSpend는 누적+audit만, throw는 assertBudget 책임 분리 | `lib/autonomy/budget.ts` |
| **모델 라우팅 헬퍼** | `pickModel(stage, criteria)` — ADR-047 매트릭스 + Opus 4-체크. 권장 반환만, throw 없음 (R1 결정 c). `forceTier?` + `dryRunCap1?` override 지원 | `lib/autonomy/pick-model.ts` |
| **모델 단가표** | Haiku $1/$5, Sonnet $3/$15, Opus $15/$75 per MTok. 가격 변경 시 별도 PR | `lib/autonomy/model-pricing.ts` `MODEL_PRICING` + `calculateCostUsd()` |
| **AUTONOMY_PAUSED.flag** | emergency 도달 시 `memory/AUTONOMY_PAUSED.flag` 생성. `assertAutonomyEntry()`가 시각/cap보다 우선 검사 → AutonomyPausedError throw → 새 사이클 진입 차단 | `lib/autonomy/budget.ts` + cycle-counter.ts |
| **audit log 4 key** | `usage.budget.warn` / `usage.budget.throw` / `usage.budget.emergency` / `opus.gate.bypass` 사전 등록 | `lib/audit-log.ts` `AuditAction` |

**env override (7개)**:
- `USAGE_BUDGET_HOURLY_WARN` (default 3)
- `USAGE_BUDGET_HOURLY_THROW` (default 6)
- `USAGE_BUDGET_DAILY_WARN` (default 30)
- `USAGE_BUDGET_DAILY_THROW` (default 50)
- `USAGE_BUDGET_DAILY_EMERGENCY` (default 200)
- `USAGE_BUDGET_DISABLED` (1=비활성, 테스트/로컬 우회)
- 기본 사용은 anthropic-claude.ts에서만 통합 (다른 wrap은 AAAA3에서 추가 예정)

### 0.5.3 자율 시동 절차 (사이클 BBBB 도입)

| 항목 | 값 | 위치 |
|------|----|------|
| **세션 진입 카드** | 5줄 카드: 다음 사이클 / 활성 게이트 / 오늘 사이클 수 / 핵심 규칙 / 진입 절차. 새 세션 30초 안에 작업 컨텍스트 복원 | `memory/ENTRY.md` (T19 사서 첫 줄) |
| **사이클 진입 게이트** | `assertAutonomyEntry()` — 시각(KST 22:00~09:00) + 사이클 수 (cap 10) 통합 체크. throw 시 STEP 1 정지 | `lib/autonomy/cycle-counter.ts` |
| **사이클 → 사이클 자동 트리거** | STEP 5 회고 직후 `ScheduleWakeup(prompt="<<autonomous-loop-dynamic>>", delaySeconds=60~120, reason="next cycle")` 호출. 같은 세션 내 wakeup만 가능 | HARNESS.md STEP 5 박제 |
| **세션 → 세션 부팅** | Windows Task Scheduler 2 task — 22:00 `claude --resume` 시동, 09:00 `Stop-Process claude` 종료 | `docs/14-autonomy-task-scheduler-setup.md` |
| **PC 환경 요구** | 24h 전원 + 절전 비활성 + 시간대 KST + Claude CLI 인증 유효 | 동일 |
| **ENTRY.md 갱신 책임** | STEP 5 T18 회고 시 "1. 다음 사이클" 라인 1줄 갱신 | T18 회고 체크리스트 |

**자는 시간 cron**:
- 시작: KST 22:00 (UTC 13:00) — `0 13 * * *`
- 종료: KST 09:00 (UTC 00:00) — `0 0 * * *`

---

## 1. 자율 사이클 진행 트리거

### ✅ 자율로 다음 사이클을 시작해도 되는 경우

- 직전 사이클이 STEP 5(회고)까지 완료
- PRD §3 사이클 시퀀스에서 다음 사이클이 명확히 식별됨
- 다음 사이클이 PRD §4 매트릭스에서 🟢 자율 OK 영역
- 사용자가 자율 모드 일시 중지 명령(`멈춰`, `대기`, `검토 후 진행`)을 내리지 않음
- 라이브 검증 외 차단 요소 없음
- **현재 시각이 KST 22:00~09:00 범위 안** (§0.5 자율 시간대)
- **오늘 자율 사이클 수 < 10** (§0.5 일일 캡)
- **세션 컨텍스트 사용량 < 80%** (§0.5 컨텍스트 가드)
- **다음 사이클이 자율 영역** (Phase 1 / Phase 6 / 리팩터/테스트). Phase 4 M1 핵심 결정 사이클은 자는 시간 진행 금지.

### 🔴 멈추고 사용자를 호출해야 하는 경우 (게이트 트리거)

다음 중 하나라도 충족되면 진행을 멈추고 명시적으로 사용자에게 알림:

| 트리거 | 사유 | 알림 메시지 패턴 |
|--------|------|----------------|
| 새 npm 의존성 추가 필요 | R1 CTO 게이트 | "사이클 X에서 패키지 `Y` 추가가 필요합니다. 의존성 0 대안: ___, R1 권장: ___. 결정 부탁드립니다." |
| 새 Prisma 마이그레이션 | 사용자 `migrate deploy` 필요 | "마이그 `00NN_xxx` 작성 완료. PR 머지 후 라이브에서 `prisma migrate deploy` 실행해 주세요." |
| 외부 API 모델/비용 정책 결정 | R1 CTO 게이트 | "M1 사이클에서 Claude 모델을 `claude-haiku-4-5` vs `claude-sonnet-4-6` 선택해야 합니다. 비용 추정: A=$X/월, B=$Y/월." |
| 새 외부 키 요구 (env) | 사용자 액션 | "환경변수 `Z` 추가가 필요합니다. `docs/12-user-actions.md` 절차 참조." |
| 베트남 정책 위반 후보 | 사용자 결정 | "BLOCKER 7 OTA 계약을 위해 어필리에이트 사업 액션이 필요합니다." |
| UX 큰 결정 (옵션 A vs B 등) | 사용자 호불호 영역 | "BLOCKER 4 모바일 드래그를 옵션 A(화살표, 의존성 0) 또는 옵션 B(@dnd-kit, +3 패키지) 중 결정 부탁드립니다. 권장: A." |
| 회의 STEP 4 다중 검증 BLOCKER 발생 | T12 QA가 환각/심각 결함 발견 | "사이클 X STEP 4 ③ QA에서 발견: ___. STEP 3 복귀 또는 사용자 판단 필요." |
| PRD에 명시되지 않은 작업 후보 | 정렬 부재 | "현재 사이클 시퀀스 외에 ___ 작업 후보가 발견되었습니다. PRD 갱신 또는 보류 결정 부탁드립니다." |
| 라이브 헬스체크 실패 | 배포 회귀 | "라이브 `/api/health` 응답이 비정상입니다. SHA: ___. 즉시 확인 필요." |
| N=3 체크포인트 도달 | 정기 체크인 | "3 사이클 완료. 진행 요약: ___. 계속 진행할까요?" — 단, 사용자가 "계속" 답하면 다음 N=3까지 묻지 않음 |

---

## 2. 자율 사이클 종료 + 다음 시작 절차

```
사이클 N 종료 (STEP 5 회고 완료)
   ↓
다음 사이클 N+1 식별 (PRD §3 시퀀스)
   ↓
PRD §4 매트릭스에서 자율/게이트 판정
   ↓
🟢 자율 → STEP 1 Triage 자동 시작
🔴 게이트 → §1 표의 알림 메시지 → 사용자 응답 대기
```

### 자율 진행 시 사용자에게 보여주는 1줄 요약

각 사이클 STEP 5 직후 사용자가 화면에 들어오면 즉시 파악할 수 있도록:

```
사이클 NN 완료 (BLOCKER 5 BottomNav 9 페이지 확장).
다음: 사이클 OO — BLOCKER 3 Admin 인증 가드 시작.
누적: 3 사이클 / N=3 체크포인트까지 0.
```

---

## 3. 라이브 검증 자동화 (사용자 눈을 줄이는 방법)

### 자동화 가능한 검증

- ✅ vitest 회귀 (CI에서 자동)
- ✅ tsc --noEmit (CI에서 자동)
- ✅ Lighthouse CI (사이클 추가 가능)
- ✅ Playwright E2E nightly (ADR-037 — 매일 KST 03:00 자동)
- ✅ 라이브 `/api/health` probe (Claude가 스스로 fetch 가능)

### 사람 눈이 여전히 필요한 검증

- 🔴 모바일 실 디바이스 감각 (화면 크기, 터치 반응)
- 🔴 디자인 호불호
- 🔴 카카오 실제 로그인 흐름(개발자 콘솔 설정 후)
- 🔴 사업 의사결정 (어필리에이트, 가격 정책)

**전략**: 자동화 가능한 건 Claude가 사이클 STEP 4에서 자체 실행. 사람 눈이 필요한 건 체크포인트나 게이트 트리거로 묶어 한 번에 사용자에게 보여줌.

---

## 4. 회의 5단계의 자율 모드 조정

### STEP 1 Triage
- T19 Librarian이 PRD §3 시퀀스에서 다음 사이클 식별 → 자동 진행

### STEP 2 회의
- 회의 멤버 병렬 호출은 그대로
- R1 CTO 게이트는 §1 매트릭스 기준 자동 판정
  - 🟢 자율 OK 영역 → R1을 회의 참석시키되, "별도 사용자 호출 없이" 진행
  - 🔴 게이트 영역 → R1 의견 모은 후 사용자 호출

### STEP 3 구현
- 그대로 진행

### STEP 4 다중 검증
- 자체 / T13 / T12 / R1 4단계 그대로
- T12 QA에서 BLOCKER 발견 시 STEP 3 복귀는 자동
- 단, T12가 환각/보안/사용자 정렬 결함 발견 시 즉시 사용자 호출 (게이트 트리거)

### STEP 5 보고 + 회고
- T18이 메모리/도서관 갱신 자동
- 다음 사이클 트리거 자동 (게이트 없을 시)

---

## 5. 메모리 누적 정책 (체크포인트용)

### 매 사이클마다 저장 (기존)
- `memory/project_cycle_XX_complete.md` — 사이클 산출물 + 회고

### N=3 체크포인트마다 저장 (세션 종료 트리거)
- `memory/project_session_handoff_YYYY_MM_DD_after_XX.md` — 3 사이클 누적 핸드오프
- **세션 종료 + 새 세션 자동 시작** (자율 모드 한정 — `ScheduleWakeup` 또는 cron 메커니즘)
- 사용자가 화면에 들어왔을 때 첫 줄에서 보이도록 MEMORY.md 최상단에 🟢 우선
- 새 세션은 핸드오프 + MEMORY.md 첫 줄 + PRD §3만 읽음 (전체 파일 X)

### 게이트 batch 메모리 (자율 시간 한정)
- `memory/project_gate_batch_YYYY_MM_DD.md` — 자는 시간 동안 누적된 게이트 모음
- 형식: 게이트 1건당 항목 (어떤 사이클, 무엇이 막혔는지, 후보 옵션, R1 권장)
- **5건 또는 6시간 도달 시** 자율 모드 자동 정지 + MEMORY.md 최상단 🔴
- 사용자가 깨어났을 때 한 번에 처리

### 컨텍스트 80% 가드 메모리
- `memory/project_context_handoff_YYYY_MM_DD_HHMM.md` — 세션 컨텍스트 한도 임박 시
- 즉시 작성 후 세션 종료 → 새 세션이 이어받음

### 메모리 위생 (오래된 핸드오프 압축)
- N=10 핸드오프 누적 시 T18 자가 진화가 월별로 압축 (`project_session_handoffs_YYYY_MM_archive.md`)
- MEMORY.md는 항상 최신 5개 핸드오프 + 핵심 규칙 + 활성 게이트만 보이도록 유지

---

## 6. 일시 중지 / 재개

### 사용자 명령

- `자율 멈춰` / `대기` / `검토 후 진행` → 자율 모드 일시 정지. 명시적 재개 명령 전까지 다음 사이클 시작 안 함.
- `자율 재개` / `계속` / `진행해` → 자율 모드 다시 활성. 다음 사이클 자동 시작.
- `시나리오 B 변경` → PRD 재작성 트리거. 자율 모드 자동 정지.

### 자동 정지 조건

- 라이브 헬스체크 실패 3회 연속
- 사이클 STEP 3에서 같은 에러 3회 연속 (무한 루프 방지)
- 사용자가 `git pull`로 외부 변경을 가져온 직후 (충돌 가능성)
- 다른 세션이 동시 작업 중이고 충돌 신호 발견
- **현재 시각이 KST 09:00 도달** (자율 시간대 종료 — 진행 중 사이클은 STEP 5까지 마치고 정지)
- **오늘 자율 사이클 10건 도달** (§0.5 일일 캡)
- **세션 컨텍스트 80% 도달** (§0.5 컨텍스트 가드 — 핸드오프 후 새 세션)
- **게이트 batch 5건 또는 6시간 도달** (§0.5 batch 정책)

---

## 7. 다중 세션 안전

병렬 세션이 동시 진행 중인 경우 (2026-05-03 현재 최소 2개):

| 상황 | 정책 |
|------|------|
| 같은 BLOCKER 작업 중 | 메모리 `project_session_handoff_*` 첫 줄 확인 → 다른 사이클로 분기 |
| 같은 파일 수정 후보 | git status / git pull 먼저. 충돌 시 사용자 호출 |
| PRD 갱신 후보 | 한 세션만 PRD 갱신. 다른 세션은 메모리 알림 후 보류 |
| 마이그레이션 충돌 | 마이그 번호 충돌 시 즉시 정지 + 사용자 호출 |

**기본 원칙**: 사이클 시작 전 `git status` + 메모리 첫 줄 확인 항상 수행.

---

## 8. 한계 (자율 모드가 못 하는 것)

- 🔴 사업 결정 (계약, 가격, 파트너십)
- 🔴 디자인 호불호 (큰 UX 방향)
- 🔴 사용자 의도 정렬 (시나리오 변경, 우선순위 재조정)
- 🔴 외부 시스템 액션 (개발자 콘솔, 결제, 도메인)
- 🔴 라이브 모바일 실 디바이스 검증
- 🔴 사용자 데이터/프라이버시 정책 결정

이런 영역은 자율 모드라도 사용자 호출 필수.

---

## 9. 자율 모드 진입 체크리스트 (다음 세션이 시작 시)

```
□ 현재 시각이 KST 22:00~09:00 범위 안인가?
□ 오늘 자율 사이클 수가 10 미만인가?
□ memory/MEMORY.md 핵심 규칙 + 첫 줄 핸드오프 확인
□ memory/project_gate_batch_*.md 활성 게이트 batch가 5건 미만인가?
□ docs/13-mvp-scenario-b-prd.md §3 사이클 시퀀스에서 현재 위치 식별
□ 다음 사이클이 자율 영역(Phase 1/6 또는 리팩터)인가?
□ git status + git log 최근 5커밋 확인 (다른 세션 충돌 여부)
□ 라이브 /api/health 헬스체크 통과 확인
□ 다음 사이클이 PRD §4 매트릭스에서 🟢 자율 OK인가?
□ 컨텍스트 사용량 80% 미만인가?
□ 위 모두 OK → STEP 1 Triage 자동 시작
□ 어느 하나라도 NO → 적절한 정지 모드 + 메모리 작성
```

---

## 10. 변경 이력

| 일자 | 사이클 | 변경 |
|------|-------|------|
| 2026-05-03 | (신규) | 시나리오 B 자율 모드 정책 초기 작성. PRD §4 매트릭스와 짝. |
| 2026-05-03 | (구체값 박제) | 사용자 결정 반영: 자율 시간대 22:00~09:00 KST · 일일 캡 10 사이클 · 컨텍스트 80% 가드 · 세션당 3 사이클 · 게이트 batch 5건/6시간 · 자율 영역 Phase 1/6 + 리팩터 한정. |
| 2026-05-04 | ZZZ | §0.5.1 안전 킬스위치 도입: `lib/usage-quota.ts` 외부 API cap(anthropic wrap 적용, 5개 서비스 AAAA 미룸) · `lib/audit-log.ts` `sanitizeAuditValue` (13 키 패턴 redact, ADR-046) · `.claude/settings.json` deny (자동 머지/승인/force push/`.env` Read) · `.github/workflows/secret-scan.yml` (7 패턴 grep). |
| 2026-05-04 | AAAA1 | §0.5.1 보강 + §0.5.2 신규: 6 외부 API 서비스 모두 quota wrap (vision/places/directions/naver/ota{agoda,kkday,klook}) + grep coverage 회귀 + `lib/autonomy/cycle-counter.ts` 메모리 파일 기반 일일 카운터 + `isAutonomyHours()` + ADR-047 모델 라우팅 정책. AAAA2 미룸: 영속 카운터 / 비용 트래킹 / 임계치 / pickModel 헬퍼. |
| 2026-05-04 | BBBB | §0.5.3 신규 자율 시동 절차: `assertAutonomyEntry()` 시각+카운터 통합 게이트 + `memory/ENTRY.md` 5줄 진입 카드 + `docs/14-autonomy-task-scheduler-setup.md` Windows Task Scheduler 가이드(22:00 시동/09:00 종료) + HARNESS.md STEP 5 ScheduleWakeup 박제. AAAA2 미룸: 비용 트래킹 / 영속 카운터 / pickModel. |
| 2026-05-04 | AAAA2 | §0.5.4 신규 비용 트래킹 + 임계치 + 모델 라우팅: `lib/autonomy/budget.ts` 비용 누적+3단계 임계치+emergency flag + `lib/autonomy/pick-model.ts` ADR-047 매트릭스 헬퍼 + `lib/autonomy/model-pricing.ts` Claude 단가표 + `assertAutonomyEntry()` 보강(flag 검사 우선) + audit log 4 key 등록 + env 7개. AAAA3 미룸: auto-degrade / pickModel 강제 throw / DB 영속화. |
| 2026-05-04 | AAAA3 | §0.5.5 신규 안전 회로 fail-closed: `readAutonomyPausedFlag` 손상 시 quarantine + sentinel 반환 (이전 fail-open) + `readBudgetState` 손상 시 quarantine + default + `recordSpend` 음수/NaN 가드 + audit + silent skip + `memory/quarantine/` 디렉토리 + `.gitignore` 등록 + audit log 3 key 추가 (모두 severity:"security") + ESLint `no-restricted-imports` `clearAutonomyPausedFlag` 자동 호출 차단 + ENTRY.md "6. 손상 복구" 절차. AAAA4 미룸: 30일 quarantine cleanup, getKstDateString DRY, emergency 중복 가드, anthropic usage silent bypass, ADR-047 분포 측정. |
| 2026-05-04 | AAAA4 P0 | §0.5.6 신규 quarantine 무한 루프 가드: `quarantineFile()` cap=3 인메모리 + DEAD flag 영속 sentinel + audit dedup (rename_failed/cap_exceeded) + `path.resolve()` 정규화 + 성공 시 attempts/dedup 리셋 + DEAD flag silent fail + audit log 2 key 추가 (모두 severity:"security") + `__resetQuarantineForTests` export. 옵션 A+B 하이브리드 채택 (C 즉시 throw는 DoS 표면으로 회피). T12 NON-BLOCKING 3건 + P2 4건은 AAAA5에서 묶음 처리. |
| 2026-05-04 | AAAA5a | DRY 추출 + 테스트 강화: `lib/autonomy/kst.ts` 신규 (KST_OFFSET_MS + getKstDateString + getMemoryDir 3 영역 추출, T16 보안 invariant 격리) + budget/cycle-counter/usage-quota 3 파일 swap + 원위치 re-export 유지 (외부 호환) + `__getQuarantineDedupSetForTests` 신규 export (audit 1회 단언, 옵션 C) + top-level beforeEach 일원화 + dedup 단언 3건 추가. AAAA4 NON-BLOCKING 3건 + DRY 1건 = 4건 동시 처리. STEP 3 복귀 0회. AAAA5b 미룸: silent bypass + emergency 가드 + 분포 측정 + ADR-047 보강. |
| 2026-05-04 | AAAA5b | 옵션 진화 #8 + 거버넌스 관측: `recordExternalCall({attempted, succeeded, blockedBy})` 분리 카운터 (R1 옵션 B, BC 보장 9 호출처 swap 0, anthropic-claude.ts 3 catch 분기 적용) + `triggerEmergency` 중복 가드 (T16 옵션 E, audit 매번 + write skip + duplicate 메타) + `lib/autonomy/distribution.ts` 신규 read-only reporter (R1+T13 옵션 C, classifyModel + getDailyModelDistribution + isWithinTargetDistribution, 비용 가중 %, ADR-047 §분포 목표 wiring) + ADR-047 변경 이력 보강. STEP 3 복귀 0회 (FIXTURES.recordCalls 갱신 1회 hotfix). |
| 2026-05-04 | AAAA6+AAAA7+AAAA8 | 30일 quarantine cleanup cron + scripts/clear-autonomy-paused.mjs (ENTRY.md §6 누락 해소) + classifyModel JSDoc + BudgetState.emergency 카운터 + getEmergencyStats + google-vision/places blockedBy + lib/autonomy/known-reasons.ts (4 상수 박제) + ADR-048 race condition. PR #30 단일 묶음. vitest 1003→1019 (+16). |
| 2026-05-04 | AAAA9 | env 인지 시간대 (베트남 거주자 지원): `lib/autonomy/kst.ts` env `AUTONOMY_TZ_OFFSET_HOURS` 도입 (default 9 KST, range -12~14, 입력 가드 + console.warn fallback). KST_OFFSET_MS const → getTzOffsetMs()/getTzOffsetIsoString() 함수 진화 + 4 import swap. `lib/autonomy/cleanup.ts` 추출 (vitest 2.1.9+Node 24의 .mjs transform 회귀 회피, P3 DRY 백로그). vitest 1019→1039 (+20). 사용자 env=7 설정 → 베트남 시간 22:00~09:00 자율. |
| 2026-05-04 | AAAA10 | 테스트 우회 env: `isAutonomyHours()`가 `AUTONOMY_BYPASS_HOURS_GATE="1"` 인지 시 강제 true + console.warn + audit log `autonomy.hours_gate_bypassed` (severity:"security"). 정확히 "1"만 우회 (0/true/"" 등 부주의 fallback 차단). default OFF로 22:00 자동 시동 영향 0. process scope만 사용 권장 (영구 등록 시 안전 회로 무력화). vitest 1039→1045 (+6). |

> 이후 변경은 게이트 매트릭스 보강이나 자동화 영역 확대 시 갱신.
