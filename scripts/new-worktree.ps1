<#
.SYNOPSIS
    TravelDiary 격리 worktree 헬퍼 (Windows PowerShell)

.DESCRIPTION
    멀티 Claude Code 세션이 같은 메인 워크트리에서 동시 작업하다 swap 사고를 내는 것을 차단.
    1줄 명령으로 형제 디렉터리에 격리 worktree + node_modules junction + 새 브랜치 생성.

    박제 패턴 통합:
      - feedback_worktree_node_modules_junction.md (mklink /J)
      - feedback_git_push_head_explicit.md (git push origin HEAD:remote)
      - feedback_pre_commit_branch_check.md (git branch --show-current)

.PARAMETER Name
    worktree 디렉터리 suffix. `traveldiary-mvp-<Name>` 형태로 메인 워크트리의 형제로 생성.

.PARAMETER Branch
    생성할 브랜치 이름. 미지정 시 `auto/<Name>-yyyyMMdd-HHmm`.

.PARAMETER Base
    분기 베이스 브랜치. 기본 `main`.

.PARAMETER NoJunction
    node_modules junction 생성을 건너뛴다 (전체 npm install 필요).

.PARAMETER ReplaceModules
    worktree 디렉터리에 실제 node_modules 디렉터리가 이미 있으면 삭제하고 junction 생성.
    기본 동작은 abort (작업 유실 방지).

.EXAMPLE
    .\scripts\new-worktree.ps1 -Name session-h
    # → ..\traveldiary-mvp-session-h, brand auto/session-h-yyyyMMdd-HHmm

.EXAMPLE
    .\scripts\new-worktree.ps1 -Name fix-z -Branch fix/modal-z-index -Base main
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9][a-z0-9-]{0,30}$')]
    [string]$Name,

    [string]$Branch,

    [string]$Base = 'main',

    [switch]$NoJunction,

    [switch]$ReplaceModules
)

$ErrorActionPreference = 'Stop'

function Write-Step { param([string]$msg) Write-Host "[step] $msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$msg) Write-Host "[ok]   $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "[warn] $msg" -ForegroundColor Yellow }
function Abort      { param([string]$msg) Write-Host "[abort] $msg" -ForegroundColor Red; exit 1 }

# 1. 사전 체크
Write-Step '1/7 메인 워크트리 확인'
$repo = (& git rev-parse --show-toplevel 2>$null)
if (-not $repo) { Abort 'git 저장소가 아닙니다.' }
$repo = $repo -replace '/', '\'
$cwd = (Get-Location).Path
if ($cwd -ne $repo) { Abort "현재 위치가 메인 워크트리가 아닙니다. cd `"$repo`" 후 재실행." }

$linkedCount = (& git worktree list --porcelain | Select-String '^worktree ').Count
if ($linkedCount -gt 1) {
    Write-Warn "이미 다른 worktree가 $($linkedCount - 1)개 존재합니다 (git worktree list로 확인)."
}

Write-Step "2/7 origin fetch + $Base 최신화"
& git fetch origin --quiet
if ($LASTEXITCODE -ne 0) { Abort 'git fetch 실패.' }

# 2. 경로 산출
$parent = Split-Path $repo -Parent
$repoLeaf = Split-Path $repo -Leaf
$target = Join-Path $parent "$repoLeaf-$Name"
Write-Step "3/7 대상 경로: $target"

if (Test-Path $target) {
    Abort "대상 디렉터리가 이미 존재합니다: $target. 다른 -Name을 쓰거나 수동 정리 후 재실행."
}

# 3. 브랜치
if (-not $Branch) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmm'
    $Branch = "auto/$Name-$stamp"
}
Write-Step "4/7 브랜치 이름: $Branch"

$existing = & git rev-parse --verify --quiet "refs/heads/$Branch" 2>$null
if ($existing) { Abort "브랜치가 이미 존재합니다: $Branch. squash merge 후 재사용은 다른 -Branch 명시." }

# 4. worktree add
Write-Step "5/7 git worktree add"
& git worktree add $target -b $Branch "origin/$Base"
if ($LASTEXITCODE -ne 0) { Abort 'git worktree add 실패.' }
Write-Ok "worktree 생성: $target ($Branch from origin/$Base)"

# 5. junction
if ($NoJunction) {
    Write-Warn '6/7 -NoJunction 지정. node_modules junction 건너뜀. npm install 필요.'
} else {
    Write-Step '6/7 node_modules junction'
    $srcModules = Join-Path $repo 'node_modules'
    $tgtModules = Join-Path $target 'node_modules'

    if (-not (Test-Path $srcModules)) {
        Write-Warn "메인 워크트리에 node_modules가 없습니다. junction 건너뜀. cd `"$target`"; npm install 필요."
    } elseif (Test-Path $tgtModules) {
        $isJunction = (Get-Item $tgtModules -Force).Attributes -band [IO.FileAttributes]::ReparsePoint
        if ($isJunction) {
            Remove-Item $tgtModules -Force
            cmd /c "mklink /J `"$tgtModules`" `"$srcModules`"" | Out-Null
            if ($LASTEXITCODE -ne 0) { Write-Warn "dangling junction 재생성 실패. cd `"$target`"; npm install 필요." }
            else { Write-Ok 'dangling junction 재생성.' }
        } elseif ($ReplaceModules) {
            Remove-Item $tgtModules -Recurse -Force
            cmd /c "mklink /J `"$tgtModules`" `"$srcModules`"" | Out-Null
            if ($LASTEXITCODE -ne 0) { Write-Warn "junction 교체 실패. cd `"$target`"; npm install 필요." }
            else { Write-Ok 'node_modules 디렉터리 → junction 교체.' }
        } else {
            Write-Warn '대상에 실 node_modules 디렉터리가 이미 있습니다. -ReplaceModules 명시 시에만 교체.'
        }
    } else {
        cmd /c "mklink /J `"$tgtModules`" `"$srcModules`"" | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Warn "junction 생성 실패 (권한?). cd `"$target`"; npm install 필요." }
        else { Write-Ok 'junction 생성: 디스크/시간 0 공유.' }
    }
}

# 6. 검증 + 안내
Write-Step '7/7 검증 + cheat-sheet'
Push-Location $target
try {
    $cur = & git branch --show-current
    Write-Ok "branch --show-current: $cur"
} finally {
    Pop-Location
}

Write-Host ''
Write-Host '--- 다음 세션 진입 ---' -ForegroundColor Magenta
Write-Host "cd `"$target`"" -ForegroundColor White
Write-Host '' -ForegroundColor White
Write-Host '--- 작업 흐름 (박제 패턴 3건 통합) ---' -ForegroundColor Magenta
Write-Host '1) 코드 변경 + git add' -ForegroundColor White
Write-Host '2) git branch --show-current  # commit 직전 확인' -ForegroundColor White
Write-Host "3) git commit -m '...'" -ForegroundColor White
Write-Host "4) git push origin HEAD:$Branch  # HEAD 명시 (다른 세션 swap 회피)" -ForegroundColor White
Write-Host "5) gh pr create --base $Base --head $Branch ..." -ForegroundColor White
Write-Host ''
Write-Host '--- 작업 종료 후 정리 ---' -ForegroundColor Magenta
Write-Host "git worktree remove `"$target`"" -ForegroundColor White
Write-Host "# junction은 worktree remove 시 자동 제거. 수동 시 Remove-Item -Force." -ForegroundColor DarkGray
