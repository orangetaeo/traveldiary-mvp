---
id: ADR-048
title: 자율 모드 동시성 가정 — flag/state read-write race condition (사이클 AAAA8)
status: Accepted (2026-05-04, cycle AAAA8)
date: 2026-05-04
decider: R1 CTO
proposer: T16 Security + T13 Code Reviewer
related: ADR-046 (24h 자율 안전 킬스위치), ADR-047 (모델 라우팅), AUTONOMY.md §0.5.5/§0.5.6
---

# ADR-048: 자율 모드 동시성 가정 — flag/state race condition

## 컨텍스트

사이클 AAAA3(fail-closed quarantine)과 AAAA4(quarantine 무한 루프 가드)가 도입되면서 다음 파일들이 자율 사이클 핫패스에서 **read-modify-write** 대상이 되었다:

- `memory/AUTONOMY_PAUSED.flag` — emergency stop sentinel + 손상 quarantine
- `memory/usage_quota_YYYY-MM-DD.json` — budget state (recordSpend 누적)
- `memory/quarantine/QUARANTINE_DEAD.flag` — cap 초과 sentinel

자율 모드는 이론상 **단일 프로세스**(Windows Task Scheduler — `claude --resume`)만 실행하지만, 실제로는 다음 시나리오에서 동시성이 발생할 수 있다:

1. **사용자 깨어있는 시간 동시 진행** — 09:00 사용자 작업과 22:00 자율 시작이 겹치는 경계 (KST 09:00 정각)
2. **다중 PC** — 사용자가 2대 이상에서 자율 모드 실행 (정책상 금지지만 사고 가능)
3. **GitHub Actions 동시 실행** — `quarantine-cleanup.yml`(AAAA6)이 매일 KST 09:30 실행, 사용자 작업 시간과 겹침
4. **테스트 중 fork** — vitest에서 같은 `AUTONOMY_MEMORY_DIR` 공유 시

또한 단일 프로세스 내에서도 **async 부수효과 누수**(예: `recordSpend` → `triggerEmergency`가 비동기 audit 작성 + 동기 file write)가 발생.

## 결정

**현 안전 회로는 "단일 라이터 가정" 위에서 동작한다. 진짜 동시성은 운영 정책으로 차단하고, 코드는 fail-closed 게이트로 손상 검출만 보장한다.**

### 1. 단일 라이터 정책 (운영 강제)

| 시나리오 | 정책 |
|----------|------|
| 자율 모드 + 사용자 깨어있는 시간 | KST 09:00 정각: 자율은 STEP 5까지 마치고 자동 종료(AUTONOMY.md §0.5). 사용자는 09:00 이후 ENTRY.md 검토부터 시작 — 09:00 정확 1분 동안만 실제 동시성 가능, 무시 가능 |
| 다중 PC | 정책상 금지 (AUTONOMY.md §7 "다중 세션 안전") |
| GitHub Actions cleanup | repo의 memory dir은 .gitignore로 비어 있음 — 충돌 표면 0 (AAAA6 §운영 메모) |
| 테스트 격리 | 각 테스트는 `mkdtempSync`로 별개 dir. `AUTONOMY_MEMORY_DIR` env override 필수 |

### 2. 코드 가정 (read-modify-write 부분 손상 허용)

| 파일 | 손상 가능 시나리오 | 회복 메커니즘 |
|------|------------------|--------------|
| `AUTONOMY_PAUSED.flag` | write 도중 프로세스 kill (ex: laptop 절전) | AAAA3 fail-closed: parse 실패 → quarantine + sentinel `flag.corrupt` 반환 → `assertBudget` throw → 자율 진입 차단. 사용자가 09:00에 `scripts/clear-autonomy-paused.mjs` 수동 복구 |
| `usage_quota_*.json` | write 도중 종료 | AAAA3 fail-closed: parse 실패 → quarantine + audit + default state 시작 (그날 누적 유실 OK) |
| `quarantine/*.corrupt-*` | rename 도중 종료 | AAAA4 cap=3 인메모리 + DEAD flag sentinel — 무한 retry 차단 |

### 3. **명시적 비-목표** (현 단계 도입 X)

- **파일 lock (flock 등)**: Node fs는 cross-platform lock 부재. 도입 시 Windows/Linux 분기 + 데드락 위험. **단일 라이터 정책으로 충분하다고 판단.**
- **DB 영속화**: AAAA2 회의 결정 — 메모리 파일 JSON 기반 유지. DB 도입은 multi-process 운영 시점에 재검토.
- **atomic write (write to .tmp + rename)**: 현재는 `writeFileSync` 직접 쓰기. AAAA9+ 트리거 — 1주일 dry-run 실측에서 손상 빈도 측정 후 도입 결정.

## 트리거 (재검토 시점)

본 ADR을 재방문해야 하는 신호:
1. **dry-run 실측에서 quarantine cap 도달 1회 이상** (2026-05-04~05-11)
2. **다중 PC 자율 모드 사용자 결정** (정책 변경)
3. **DB 영속화 결정** (AAAA2 미룸 → 본격 자율 시동 시 재방문)
4. **GitHub Actions가 실제 production memory를 sweep하도록 변경** (현재는 sanity probe)

## 영향

- **즉시 영향 0** — 본 ADR은 가정 박제만. 코드 변경 없음.
- **운영 변경**: AUTONOMY.md §7 "다중 세션 안전"에 "동시성은 단일 라이터 정책으로 차단" 1줄 추가 권장 (T18 후속).
- **회귀 가드**: `lib/autonomy/known-reasons.ts`(AAAA8)가 reason 화이트리스트를 박제하여 손상 검출 invariant 유지.

## 사이클 AAAA8 박제 산출물

1. 본 ADR-048
2. `lib/autonomy/known-reasons.ts` (KNOWN_REASONS 상수 통합)
3. `feedback_input_guard_silent_skip` (auto-memory 패턴 박제)

## 회의 멤버 (AAAA8)

R1 CTO, T16 Security, T13 Code Reviewer, T18 Self-Evolution Coach. T12 QA는 STEP 4 검증만 (BLOCKER 없음).
