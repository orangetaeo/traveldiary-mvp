# 자율 모드 진입 카드 — TravelDiary

> 새 세션이 시작되면 **이 파일 5줄만 먼저 읽고** 작업 진입한다. MEMORY.md 전체 읽기는 게이트 통과 후.
>
> 사이클 BBBB(2026-05-04)에서 도입. 갱신 책임: STEP 5 T18 회고에서 "1. 다음 사이클" 라인만 1줄 갱신.
>
> 위치는 **프로젝트 내 `memory/ENTRY.md`** (정본, git 추적). user auto-memory에는 두지 않음.

---

## 1. 다음 사이클
**AAAA2** — 비용 트래킹 ($/토큰 누적) + `lib/usage-quota.ts` 영속 카운터(in-memory → KV/DB) + `pickModel(stage, criteria)` 자동 선택. R1 권장 1순위 (ADR-047 분포 측정 전제).

대안: 마이그레이션 1건 동반 시 사용자 액션은 `prisma migrate deploy` (Railway 자동, 별도 작업 0).

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
