# 자율 모드 시동 — Windows Task Scheduler 셋업 가이드

> **사이클 BBBB (2026-05-04)** — "보호된 11시간 자율(KST 22:00~09:00) + 09:00 사용자 검증" 모드 시동 절차.
>
> **전제**: PC 24시간 켜둠 + 절전 모드 비활성. Claude Code CLI(`claude`) 설치 + 로그인 완료.

---

## 1. 동작 모델

```
┌─────────────────────────────────────────────────────────────┐
│ Windows Task Scheduler                                      │
│  ├─ Task A: "Claude Autonomy Start" (매일 KST 22:00)        │
│  │  └─ claude --resume (TravelDiary 워크스페이스)            │
│  └─ Task B: "Claude Autonomy Stop" (매일 KST 09:00)         │
│     └─ Stop-Process -Name "claude" (또는 정상 종료 신호)     │
└─────────────────────────────────────────────────────────────┘
       ↓ Task A 실행 시
┌─────────────────────────────────────────────────────────────┐
│ Claude 세션 시작 → ENTRY.md 5줄 read                         │
│  → assertAutonomyEntry() (시각 + 카운터 게이트)             │
│  → 통과 → STEP 1 Triage → 사이클 1                          │
│  → STEP 5 종료 → ScheduleWakeup(60s) → 사이클 2             │
│  → ... (세션당 3 사이클 캡 / 컨텍스트 80% 도달 시 종료)     │
│  → 게이트 발생 시 batch 메모리 누적                         │
└─────────────────────────────────────────────────────────────┘
       ↓ Task B 실행 시 (KST 09:00)
┌─────────────────────────────────────────────────────────────┐
│ 09:00 사용자 깨어남                                         │
│  → ENTRY.md + memory/autonomy_counter_YYYY-MM-DD.json 확인 │
│  → 게이트 batch 처리 (있으면)                                │
│  → PR 머지 / 다음 사이클 결정                                │
└─────────────────────────────────────────────────────────────┘
```

**한계** (5명 회의 합의):
- ScheduleWakeup은 같은 세션 내 wakeup만 가능. 세션 종료 후 새 세션은 외부 cron(Task Scheduler)으로 부팅
- AI는 자기 PR을 자기 머지 불가 (`.claude/settings.json` deny). 머지는 09:00 사용자 시간에만
- PC 꺼짐 / Claude CLI 실행 실패 시 자율 종료. 다음 22:00에 재시도

---

## 2. 사전 체크리스트

```
□ PC 절전 모드 비활성 (Settings → System → Power → "Sleep" = "Never")
□ 모니터 절전은 OK (Display sleep ≠ system sleep)
□ Claude Code CLI 설치 확인: `claude --version`
□ Claude 로그인: `claude` 실행 후 인증
□ TravelDiary 워크스페이스 절대 경로 확인 (예: c:\Projects\traveldiary-mvp)
□ memory/ENTRY.md 존재 확인 (사이클 BBBB 산출물)
□ git 작업 디렉토리 clean (자율 시작 전 직전 PR 머지 또는 stash)
```

---

## 3. PowerShell로 Task 등록

관리자 PowerShell에서 실행:

### 3-1. 자율 시동 Task (KST 22:00 매일)

```powershell
$workspace = "c:\Projects\traveldiary-mvp"
$action = New-ScheduledTaskAction `
  -Execute "claude" `
  -Argument "--resume" `
  -WorkingDirectory $workspace

$trigger = New-ScheduledTaskTrigger -Daily -At "22:00"

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask `
  -TaskName "Claude Autonomy Start" `
  -Description "TravelDiary 자율 모드 매일 KST 22:00 시동 (사이클 BBBB)" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest
```

### 3-2. 자율 종료 + 깨움 알림 Task (KST 09:00 매일)

T12 사이클 BBBB 검증 BLOCKER 처리: 09:00에 사용자가 자발적으로 ENTRY.md를 열지 않으면 게이트 batch가 며칠 누적될 수 있다. Stop task에 알림 marker + msg toast를 동시 발행한다.

```powershell
$workspace = "c:\Projects\traveldiary-mvp"
$stopScript = @"
# 1. Claude 프로세스 정상 종료
Get-Process claude -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. marker 파일 생성 (사용자가 매일 09:00 이후 첫 PC 사용 시 ENTRY.md 검토 trigger)
`$marker = Join-Path '$workspace' 'memory\AWAKE_CHECK_REQUIRED.txt'
`$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
`$body = `"Claude Autonomy: 야간 자율 종료 ($ts).`r`n`r`n검토 순서:`r`n  1. memory/ENTRY.md (5줄 카드)`r`n  2. memory/autonomy_counter_*.json (오늘 사이클 수)`r`n  3. memory/project_gate_batch_*.md (게이트 batch)`r`n  4. PR 큐 (gh pr list)`r`n`r`n검토 완료 후 본 marker 파일 삭제.`"
Set-Content -Path `$marker -Value `$body -Encoding UTF8

# 3. 로그인 사용자에게 toast (msg.exe 시도, 실패 시 무시 — marker가 fallback)
try { msg * /TIME:300 'Claude Autonomy 검토 필요: memory/AWAKE_CHECK_REQUIRED.txt 참조' } catch {}
"@

$stopAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -Command $stopScript"

$stopTrigger = New-ScheduledTaskTrigger -Daily -At "09:00"

Register-ScheduledTask `
  -TaskName "Claude Autonomy Stop" `
  -Description "TravelDiary 자율 모드 매일 KST 09:00 정상 종료 + 사용자 깨움 알림 (사이클 BBBB)" `
  -Action $stopAction `
  -Trigger $stopTrigger `
  -RunLevel Highest
```

**알림 메커니즘 3중화** (R1 권장):
1. **marker 파일** (`memory/AWAKE_CHECK_REQUIRED.txt`) — 사용자가 PC 사용 시 visible. `.gitignore`에 등록 권장 (휘발성).
2. **msg toast** (`msg * /TIME:300`) — Win11 Pro/Server는 기본, Home은 부재 가능 (try/catch fallback)
3. **MEMORY.md 🔴 자동 갱신** — CCCC에서 Stop task에 `Update-MemoryAlert.ps1` 추가 검토 (현재 미구현)

### 3-3. Quarantine Cleanup Task (KST 09:30 매일, 사이클 AAAA6 P1)

자율 모드 안전 회로(AAAA3/AAAA4)가 손상 파일을 `memory/quarantine/`에 격리한다. 30일 경과한 격리 파일을 자동 삭제하여 무한 누적 차단.

```powershell
$workspace = "c:\Projects\traveldiary-mvp"
$cleanupAction = New-ScheduledTaskAction `
  -Execute "node" `
  -Argument "scripts/quarantine-cleanup.mjs --retention-days=30" `
  -WorkingDirectory $workspace

$cleanupTrigger = New-ScheduledTaskTrigger -Daily -At "09:30"

Register-ScheduledTask `
  -TaskName "Claude Autonomy Quarantine Cleanup" `
  -Description "memory/quarantine/ 30일 sweep (사이클 AAAA6 P1)" `
  -Action $cleanupAction `
  -Trigger $cleanupTrigger `
  -RunLevel Highest
```

**옵션**:
- `--dry-run`: 삭제 안 하고 목록만 출력 (첫 1주 권장)
- `--retention-days=N`: 보존 기간 (default 30)
- `QUARANTINE_DEAD.flag`는 운영자 직접 처리 대상이므로 자동 삭제 X (사이클 AAAA4 P0)

**GitHub Actions 백업**: `.github/workflows/quarantine-cleanup.yml`이 매일 KST 09:30 동시 실행 (sanity probe — repo memory dir은 .gitignore로 비어 있음).

**npm 명령어**:
```powershell
npm run quarantine:cleanup -- --dry-run
npm run quarantine:cleanup -- --retention-days=60
```

### 3-4. 등록 확인

```powershell
Get-ScheduledTask -TaskName "Claude Autonomy*" | Format-Table TaskName, State, NextRunTime
```

---

## 4. 환경변수 (선택)

`$env:` 또는 시스템 환경변수에 설정 시 자율 모드 동작 조정:

| env | 의미 | default |
|-----|------|--------|
| `AUTONOMY_DAILY_CYCLE_CAP` | 일일 자율 사이클 캡 | 10 |
| **`AUTONOMY_TZ_OFFSET_HOURS`** ⭐ | **자율 시간대 offset (hours from UTC). default 9 (KST). 베트남/태국 거주 시 7. 인도 5.5. 범위 -12~14.** | **9** |
| **`AUTONOMY_BYPASS_HOURS_GATE`** ⚠️ | **테스트 전용** — `"1"` 시 자율 시간대 게이트 우회 (낮 시간 사이클 진입 강제). 다른 값은 우회 X. 우회 시 audit 기록. **process scope만 사용** (영구 등록 시 22:00 정상 시동도 우회). | unset |
| `QUOTA_DAILY_CAP_ANTHROPIC` | Anthropic API 일일 cap | 1000 |
| `QUOTA_DAILY_CAP_GOOGLE_VISION` | Vision API 일일 cap | 500 |
| `QUOTA_DAILY_CAP_NAVER_SEARCH` | Naver API 일일 cap | 5000 |
| `QUOTA_DAILY_CAP_OTA` | OTA 통합 일일 cap | 1000 |
| `AUTONOMY_MEMORY_DIR` | 카운터/batch 메모리 디렉토리 | `<workspace>/memory` |

**사이클 AAAA2 추가** — 비용 트래킹 임계치 (USD):

| env | 의미 | default |
|-----|------|--------|
| `USAGE_BUDGET_HOURLY_WARN` | 시간당 경고 임계치 ($) | 3 |
| `USAGE_BUDGET_HOURLY_THROW` | 시간당 throw 임계치 ($, BudgetExceededError) | 6 |
| `USAGE_BUDGET_DAILY_WARN` | 일일 경고 임계치 ($) | 30 |
| `USAGE_BUDGET_DAILY_THROW` | 일일 throw 임계치 ($, BudgetExceededError) | 50 |
| `USAGE_BUDGET_DAILY_EMERGENCY` | 일일 emergency-stop ($, AUTONOMY_PAUSED.flag 생성) | 200 |
| `USAGE_BUDGET_DISABLED` | `1` 설정 시 비용 트래킹 비활성 (테스트/로컬 우회) | (unset) |

시스템 환경변수 등록:
```powershell
[System.Environment]::SetEnvironmentVariable("AUTONOMY_DAILY_CYCLE_CAP", "5", "User")
[System.Environment]::SetEnvironmentVariable("USAGE_BUDGET_DAILY_THROW", "20", "User")
```

**테스트 모드 — 자율 시간대 게이트 우회 (사이클 AAAA10)**:
```powershell
# 같은 PowerShell 창에서만 (process scope — 영구 미설정)
$env:AUTONOMY_BYPASS_HOURS_GATE="1"
cd c:\Projects\traveldiary-mvp
claude --resume
```
- env가 `"1"` 일 때만 우회. `"0"`/`"true"`/`""` 등은 우회 X (부주의 fallback 차단)
- 우회 시 `console.warn` + `audit log` (`autonomy.hours_gate_bypassed`, severity:"security")
- **process scope env 사용 — 같은 창 종료 시 자동 제거**. Task Scheduler 22:00 자동 시동에는 영향 0
- **영구 등록 절대 금지**: `[System.Environment]::SetEnvironmentVariable` 으로 등록하면 22:00 정상 시동도 우회 = 안전 회로 무력화
- 종료 후 검증: 새 PowerShell 창에서 `$env:AUTONOMY_BYPASS_HOURS_GATE` → 빈 줄 (미설정) 확인

**베트남/태국 거주자 (사이클 AAAA9 도입)**:
```powershell
# PC OS 시간대가 UTC+7 (베트남/태국)이고 자율을 그 시간대 기준으로 돌리고 싶다면:
[System.Environment]::SetEnvironmentVariable("AUTONOMY_TZ_OFFSET_HOURS", "7", "User")

# 확인 (새 PowerShell 창 열어서)
[System.Environment]::GetEnvironmentVariable("AUTONOMY_TZ_OFFSET_HOURS", "User")
```

이렇게 하면 `isAutonomyHours()` 게이트가 베트남 시간 22:00~09:00을 자율 시간대로 인식. Task Scheduler의 22:00/09:00/09:30 trigger도 OS 시간대 기준 = 베트남 시간 기준으로 정확히 동작.

**dry-run 모드** (R1 권장 — AAAA2 머지 첫날):
```powershell
[System.Environment]::SetEnvironmentVariable("AUTONOMY_DAILY_CYCLE_CAP", "1", "User")
[System.Environment]::SetEnvironmentVariable("USAGE_BUDGET_DAILY_THROW", "5", "User")
```
1 사이클만 + 일일 $5 throw로 안전하게 첫 검증.

---

## 5. 첫 실행 검증

### 5-1. 수동 시동 테스트 (등록 후)

```powershell
Start-ScheduledTask -TaskName "Claude Autonomy Start"
```

Claude가 워크스페이스에서 실행되는지 확인. 첫 응답이 ENTRY.md 5줄 read + 사이클 진입이면 성공.

### 5-2. 매일 09:00 사용자 절차 (필수, 3~5분)

야간 자율 모드가 종료되면 marker 파일이 생성된다. 매일 첫 작업으로:

```
1. 책상 PC에서 marker 확인:
   Get-Content c:\Projects\traveldiary-mvp\memory\AWAKE_CHECK_REQUIRED.txt
   (없으면 Stop task 미실행 — Task Scheduler 점검)

2. ENTRY.md 5줄 read:
   Get-Content c:\Projects\traveldiary-mvp\memory\ENTRY.md -TotalCount 30

3. 오늘 자율 사이클 수 + 비용 (수동 어림):
   Get-Content c:\Projects\traveldiary-mvp\memory\autonomy_counter_*.json | ConvertFrom-Json

4. 게이트 batch 처리 (있으면):
   Get-ChildItem c:\Projects\traveldiary-mvp\memory\project_gate_batch_*.md
   → 각 항목 읽고 결정 (의존성 추가? 마이그? UX 옵션? 사업 결정?)
   → 처리 완료 후 batch 파일 삭제 또는 archive

5. 자율 모드가 생성한 PR 큐 검토:
   gh pr list --state open --label autonomy
   → 머지 가능한 것 머지 (gh pr merge N --squash --delete-branch)
   → 반려할 것 코멘트 + close

6. marker 파일 삭제:
   Remove-Item c:\Projects\traveldiary-mvp\memory\AWAKE_CHECK_REQUIRED.txt
```

### 5-3. 로그 확인

Task Scheduler 실행 이력:
```powershell
Get-ScheduledTaskInfo -TaskName "Claude Autonomy Start"
```

자율 사이클 카운터 (KST 일자 기반):
```powershell
Get-Content "c:\Projects\traveldiary-mvp\memory\autonomy_counter_*.json" | ConvertFrom-Json
```

게이트 batch (자는 시간 동안 누적된 게이트):
```powershell
Get-ChildItem "c:\Projects\traveldiary-mvp\memory\project_gate_batch_*.md"
```

---

## 6. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Task 등록 실패 (RunLevel Highest 거부) | UAC 권한 부족 | PowerShell을 "관리자 권한으로 실행" |
| 22:00에 Claude 실행 안 됨 — `claude not found` | Task Scheduler가 사용자 PATH 미상속 | Action에 `-Execute "cmd.exe" -Argument "/c claude --resume"` wrap 또는 `claude` 절대 경로 (예: `npx claude` 또는 `%APPDATA%\npm\claude.cmd`) 명시 |
| 22:00에 Claude 실행 안 됨 — PC 절전 | Sleep 진입 | Power 설정 "Sleep" = "Never" 재확인 |
| Claude 시작했으나 즉시 종료 — 인증 | 인증 만료 | 수동 `claude` 실행 후 재로그인 |
| Claude 시작했으나 즉시 종료 — 인자 | `--resume` 인자 미지원 또는 변경 | Anthropic Claude Code CLI 공식 문서 확인 후 인자 갱신. 시동 전 수동 `claude --resume` 1회 검증 |
| Counter 파일이 매번 0으로 보임 | env `AUTONOMY_MEMORY_DIR` 부재 + cwd 다름 | Task Action의 WorkingDirectory 절대 경로 확인 |
| 사이클 진입 시 NotAutonomyHoursError | KST 시각 계산 불일치 (서버 시간대) | OS 시간대를 "Korea Standard Time" 설정 |
| 게이트 batch 5건 도달 후 멈춤 | 정상 동작 (AUTONOMY §0.5) | 09:00 사용자가 batch 처리 후 archive |
| 09:00 msg toast 안 보임 | Win 11 Home은 `msg.exe` 부재 | marker 파일(`memory/AWAKE_CHECK_REQUIRED.txt`)로 fallback. 또는 PowerShell 모듈 `BurntToast` 설치(`Install-Module BurntToast -Scope CurrentUser`) 후 stop script에 `New-BurntToastNotification -Text 'Claude Autonomy 검토 필요'` 추가 |
| Stop task가 진행 중 사이클 강제 종료 | `Stop-Process -Force` graceful X | CCCC에서 graceful shutdown 검토. 현재는 STEP 5 incrementCycleCount 누락 가능 (counter 파일과 실제 사이클 수 mismatch 위험) |

---

## 7. Task 제거 (자율 모드 일시 중지)

```powershell
Unregister-ScheduledTask -TaskName "Claude Autonomy Start" -Confirm:$false
Unregister-ScheduledTask -TaskName "Claude Autonomy Stop" -Confirm:$false
```

또는 일시 비활성:
```powershell
Disable-ScheduledTask -TaskName "Claude Autonomy Start"
Disable-ScheduledTask -TaskName "Claude Autonomy Stop"
```

---

## 8. 한계 + 권장 운영 패턴

### 본질적 한계 (회의 5명 합의)
- **AI 자기 검증 구조적 불가능** — 자율 모드 PR은 머지 X, 09:00 사용자 검증 필수
- **외부 신호 없는 결정 자율 불가** — 의존성 추가, UX 호불호, 사업 결정은 게이트 batch
- **세션 컨텍스트 휘발** — ScheduleWakeup은 같은 세션 내만, 새 세션 부팅은 Task Scheduler 의존

### 권장 운영 패턴
1. **첫 1주는 cap=3** (default 10 대신) — 답습 안정성 확인 후 점진적 확대
2. **매일 09:00 첫 작업**: ENTRY.md → counter 파일 → 게이트 batch → PR 큐 순서 점검 (3~5분)
3. **머지는 사용자 시간만** — 자율 모드는 PR 생성까지만, 머지는 09:00~22:00에
4. **주 1회 회고**: 일주일 자율 사이클 결과 종합 → AUTONOMY.md 갱신
5. **PR 백로그 ≥ 5건**: 자율 처리 속도가 사용자 검토 속도를 초과하면 캡 줄이기

---

## 참조
- `lib/autonomy/cycle-counter.ts` — `assertAutonomyEntry()` 게이트 + `isAutonomyHours()`
- `lib/usage-quota.ts` — 외부 API 일일 cap
- `.claude/AUTONOMY.md` §0.5.1~§0.5.3 — 캡 정책 + 안전 킬스위치 + 모델 라우팅
- `memory/ENTRY.md` — 새 세션 진입 5줄 카드
- `docs/adr/ADR-046` — 안전 킬스위치 4종
- `docs/adr/ADR-047` — 모델 라우팅 정책
