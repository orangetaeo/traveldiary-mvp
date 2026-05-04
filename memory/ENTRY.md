# 자율 모드 진입 카드 — TravelDiary

> 새 세션이 시작되면 **이 파일 5줄만 먼저 읽고** 작업 진입한다. MEMORY.md 전체 읽기는 게이트 통과 후.
>
> 사이클 BBBB(2026-05-04)에서 도입. 갱신 책임: STEP 5 T18 회고에서 "1. 다음 사이클" 라인만 1줄 갱신.
>
> 위치는 **프로젝트 내 `memory/ENTRY.md`** (정본, git 추적). user auto-memory에는 두지 않음.

---

## 1. 다음 사이클
**AAAA4** — AAAA3 + AAAA2 NON-BLOCKING 잔여 정리: P0 quarantine 무한 루프 가드 (rename 실패 후 재시도 차단) + P1 30일 quarantine cleanup cron + P2 getKstDateString DRY · emergency 중복 가드 · anthropic usage 부재 silent bypass · ADR-047 분포 측정 wiring.

대안 (R1 권장): AAAA4 머지 + 1주일 cap=2~3 실측 후 cap=10 본격 자율 시동 검토 (2026-05-11 이후).

## 2. 활성 게이트 (batch)
**없음.** 게이트 발생 시 `memory/project_gate_batch_YYYY_MM_DD.md` 위치 + 본 라인 `🔴 활성 게이트 N건` 갱신.

## 3. 오늘 자율 사이클 수
`memory/autonomy_counter_YYYY-MM-DD.json` 참조 (KST 일자 기준, 자동 리셋). cap=10 (env `AUTONOMY_DAILY_CYCLE_CAP` override).

## 4. 핵심 규칙 (위반 = 즉시 정지)
- **회의 없이 코드 작성 금지** — 5단계 하네스
- **PR 머지 흐름** (`feedback_branch_protection_pr_flow`) — `gh pr merge --admin/--auto/--approve` deny
- **writeAuditLog 절대 규칙** (S-13) + sanitizeAuditValue 13키 redact (ADR-046)
- **베트남 단일 국가 정책** (`feedback_vietnam_only_focus`)
- **자율 시간대** KST 22:00~09:00 (외부 = 동기 모드, 사용자 응답 필수)

## 5. 진입 절차
```
1. ToolSearch "select:ScheduleWakeup" — deferred tool schema 로드 (STEP 5 사이클 자동 트리거용)
2. assertAutonomyEntry() — 시각 + 카운터 게이트 (lib/autonomy/cycle-counter.ts)
3. docs/13-mvp-scenario-b-prd.md §3 사이클 시퀀스에서 다음 사이클 식별
4. .claude/INDEX.md 도서관에서 회의 멤버 + 참고 책 검색 (T19)
5. STEP 1 Triage 결과 보고 → STEP 2 회의 진입
6. STEP 5 종료 시:
   - incrementCycleCount(id)
   - 본 ENTRY.md "1. 다음 사이클" 1줄 갱신
   - 자율 영역 + 시각/cap OK이면 ScheduleWakeup(60~120s, "<<autonomous-loop-dynamic>>")
```

자율 시간대 외이거나 cap 도달 시: `NotAutonomyHoursError` / `CycleCapExceededError` throw → 사용자 호출 (게이트 batch 누적).

## 6. 손상 복구 절차 (사이클 AAAA3 도입)

자율 모드 안전 회로가 fail-closed로 동작하면 손상된 메모리 파일을 격리(`memory/quarantine/`)하고 자율 진입을 차단한다. 사용자 09:00 깨어나면 다음 절차로 복구:

```
1. memory/quarantine/ 검사
   ↓ 손상 파일 종류 확인 (AUTONOMY_PAUSED.flag.corrupt-* / usage_quota_*.json.corrupt-*)
2. audit log에서 원인 이벤트 확인 (autonomy.flag_corrupt / usage.budget.state_corrupt)
   ↓ severity:"security" metadata 포함
3. 원인 분석 후 수동 복구:
   - flag 손상 → 진짜 emergency였다면 그대로 두고 사용자가 PR 머지 후 clearAutonomyPausedFlag(scripts/clear-autonomy-paused.ts) 실행
   - state 손상 → 그날 누적 데이터 유실 OK. 다음 호출부터 default state로 재시작
4. 30일 후 quarantine 자동 정리 (AAAA4 백로그)
```

**중요 (T16 보안)**:
- `clearAutonomyPausedFlag`는 `scripts/` 또는 `tests/`에서만 호출 허용 (ESLint `no-restricted-imports` 강제).
- 자율 사이클 코드 경로에서 자동 호출 차단 — 손상으로 인한 fail-closed가 사용자 인지 없이 우회되는 것 방지.
