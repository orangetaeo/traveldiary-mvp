# 18. 격리 worktree 가이드

> **목적**: 멀티 Claude Code 세션이 동시 작업할 때 메인 워크트리 swap 사고를 막는다.
> **도입**: 2026-05-06 (Session G 학습 → Session H 정착)
> **헬퍼**: [`scripts/new-worktree.ps1`](../scripts/new-worktree.ps1) — Windows PowerShell

---

## 1. 빠른 시작 (3줄)

메인 워크트리 (`c:\Projects\traveldiary-mvp`)에서:

```powershell
.\scripts\new-worktree.ps1 -Name session-h
cd ..\traveldiary-mvp-session-h
# 이제부터 모든 작업은 이 디렉터리에서. 메인 워크트리는 다른 세션이 점유 가능.
```

스크립트가 자동 처리:
- 형제 디렉터리 `..\traveldiary-mvp-session-h\` 생성
- 새 브랜치 `auto/session-h-yyyyMMdd-HHmm` (또는 `-Branch` 지정)
- `node_modules` junction (디스크/시간 0 공유)
- 작업 cheat-sheet 출력

---

## 2. 명령 레퍼런스

```powershell
.\scripts\new-worktree.ps1 -Name <suffix> [옵션]
```

| 플래그 | 기본값 | 의미 |
|--------|--------|------|
| `-Name` (필수) | — | worktree 디렉터리 suffix. `^[a-z0-9][a-z0-9-]{0,30}$` 검증 |
| `-Branch` | `auto/<Name>-yyyyMMdd-HHmm` | 새로 만들 브랜치 이름 |
| `-Base` | `main` | 분기 베이스 (origin/<Base> 기준) |
| `-NoJunction` | off | node_modules junction 생성 건너뜀 (npm install 필요) |
| `-ReplaceModules` | off | 대상에 실 node_modules가 있으면 삭제 후 junction. 기본은 abort |

### 예시

```powershell
# 가장 흔한 사용 — auto-naming
.\scripts\new-worktree.ps1 -Name session-h

# 명시적 브랜치 이름 (PR 제목과 정렬하고 싶을 때)
.\scripts\new-worktree.ps1 -Name fix-modal-z -Branch fix/modal-z-index

# 다른 브랜치에서 분기 (예: hotfix)
.\scripts\new-worktree.ps1 -Name hotfix-prod -Branch fix/prod-crash -Base release/v1
```

---

## 3. 충돌 시나리오 — 무엇이 막히고 어떻게 복구하는가

### 3.1 멀티 세션 같은 파일 swap (Session G 사고 패턴)

**증상**: 메인 워크트리에서 작업 중 다른 세션이 브랜치 swap → 내 변경이 reset / 커밋이 다른 브랜치 위로 들어감.

**예방**: 격리 worktree 사용. 각 세션은 자기 worktree만 점유.

**복구**: 사고 발생 시 `git reflog`로 잃은 커밋 추적. 각 worktree의 reflog는 독립.

### 3.2 junction dangling

**증상**: worktree 삭제 후 `..\traveldiary-mvp-X\node_modules` junction이 빈 곳을 가리킴.

**처리**: 스크립트가 자동 감지 + 재생성. 수동 정리는 `Remove-Item -Force <junction>` (junction은 안전 삭제 — 원본은 영향 없음).

### 3.3 동시 npm install 충돌

**증상**: 두 worktree가 같은 `node_modules`(junction 공유)를 동시에 install → 패키지 손상 가능.

**규칙**: **메인 워크트리에서만 install**. 의존성 변경 PR은 R1 CTO 게이트라 자율 영역 밖이므로 자연스럽게 메인에서만 발생.

### 3.4 squash merge 후 브랜치 정리

**증상**: PR squash merge 후 `auto/session-h-...` 브랜치가 stale로 남음.

**처리**:
```powershell
# worktree 정리 (junction도 함께 제거됨)
git worktree remove ..\traveldiary-mvp-session-h

# 로컬 브랜치 정리 (gh가 --delete-branch 했으면 origin은 이미 정리됨)
git branch -D auto/session-h-yyyyMMdd-HHmm
```

---

## 4. 정리 — worktree 삭제 순서

```powershell
# 1. 변경사항 모두 push 또는 stash 확인
cd ..\traveldiary-mvp-session-h
git status                                            # clean이어야 안전
$br = git branch --show-current                       # 예: auto/session-h-20260506-1530
git push origin "HEAD:$br"                            # HEAD 명시 (박제 패턴)

# 2. 메인 워크트리로 복귀
cd c:\Projects\traveldiary-mvp

# 3. worktree 제거 (junction 자동 정리)
git worktree remove ..\traveldiary-mvp-session-h

# 4. 머지된 브랜치 삭제
git branch -d $br                                     # 머지 안 됐으면 -D
```

---

## 5. FAQ

### Q. Windows symlink 권한이 필요한가?

A. `mklink /J`(junction)는 비특권 — Vista 이후 누구나 가능. `/D`(directory symlink)와 달리 SeCreateSymbolicLinkPrivilege 불필요.

### Q. WSL/macOS에서는?

A. 스크립트는 Windows 전용. 다른 OS는 `git worktree add`만 수동 + `ln -s` 또는 `mklink /D` 직접. (PowerShell Core가 있으면 `$IsWindows` 분기로 fallback 가능 — 향후 확장.)

### Q. CI에서도 의미 있나?

A. CI 환경은 단일 세션이므로 격리 worktree 불필요. 본 가이드는 로컬 멀티 세션 한정.

### Q. `mklink /J`(junction) vs `/D`(directory symlink)?

| | `/J` junction | `/D` directory symlink |
|---|---|---|
| 권한 | 비특권 | SeCreateSymbolicLinkPrivilege 필요 |
| 범위 | 같은 볼륨만 | 볼륨 간 가능 |
| 원격 경로 | 불가 | 가능 |
| 본 프로젝트 | ✅ 사용 | — |

같은 디스크 내 형제 디렉터리만 묶기 때문에 junction이 적합.

### Q. 의존성을 같은 디스크에서 같은 inode로 공유한다면 캐시 충돌은?

A. Next.js `.next/`, Vitest `node_modules/.vitest/` 같은 빌드 캐시는 worktree마다 별도 (junction은 `node_modules`만). 안전.

---

## 6. 박제 패턴 cross-link (3건)

이 가이드는 다음 박제 feedback의 통합 도구다:

- `feedback_worktree_node_modules_junction.md` — junction 명령 + 한계
- `feedback_git_push_head_explicit.md` — `git push origin HEAD:remote-branch` 명시
- `feedback_pre_commit_branch_check.md` — commit 직전 `git branch --show-current`

스크립트의 cheat-sheet 출력이 위 3패턴을 1줄씩 매번 reminder.

---

## 7. 알려진 한계

- 동시 두 worktree에서 `npm install` 충돌 → 메인에서만 install
- worktree 삭제 시 junction은 dangling → 새 worktree에서 자동 재생성 또는 수동 정리
- 메인 워크트리에서 직접 `package.json` 변경 후 다른 worktree가 의존성 미스매치 감지 못 함 → 의존성 변경은 R1 CTO 게이트라 자연스럽게 동기화 가능

---

## 8. 변경 이력

| 일자 | 변경 |
|------|------|
| 2026-05-06 | 초기 작성. Session G 학습 + 박제 3패턴 통합. |
