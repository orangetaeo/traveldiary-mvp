<#
.SYNOPSIS
    TravelDiary isolated worktree helper (Windows PowerShell)

.DESCRIPTION
    Prevents swap accidents when multiple Claude Code sessions work on the same main worktree.
    Creates a sibling worktree directory + new branch + node_modules junction in one command.

    Integrates 3 documented patterns:
      - feedback_worktree_node_modules_junction.md (mklink /J)
      - feedback_git_push_head_explicit.md (git push origin HEAD:remote)
      - feedback_pre_commit_branch_check.md (git branch --show-current)

    NOTE: Script is intentionally ASCII-only so PowerShell 5.1 (Windows default) parses it
    correctly even when the file is saved as BOM-less UTF-8. Korean usage guidance lives
    in docs/18-worktree-isolation.md.

.PARAMETER Name
    Worktree directory suffix. Creates a sibling 'traveldiary-mvp-<Name>'.

.PARAMETER Branch
    New branch name. Defaults to 'auto/<Name>-yyyyMMdd-HHmm'.

.PARAMETER Base
    Base branch for the new worktree. Defaults to 'main'.

.PARAMETER NoJunction
    Skip node_modules junction (requires full 'npm install' inside the new worktree).

.PARAMETER ReplaceModules
    If a real node_modules directory already exists in the target, delete it and create the junction.
    Default behavior is abort (prevents data loss).

.EXAMPLE
    .\scripts\new-worktree.ps1 -Name session-h
    # -> ..\traveldiary-mvp-session-h, branch auto/session-h-yyyyMMdd-HHmm

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

# 1. Pre-flight
Write-Step '1/7 main worktree check'
$repo = (& git rev-parse --show-toplevel 2>$null)
if (-not $repo) { Abort 'Not a git repository.' }
$repo = $repo -replace '/', '\'
$cwd = (Get-Location).Path
if ($cwd -ne $repo) { Abort "Current location is not the main worktree. cd `"$repo`" and retry." }

$linkedCount = (& git worktree list --porcelain | Select-String '^worktree ').Count
if ($linkedCount -gt 1) {
    Write-Warn "Other worktrees already exist ($($linkedCount - 1)). Run 'git worktree list' to inspect."
}

Write-Step "2/7 git fetch origin + sync $Base"
& git fetch origin --quiet
if ($LASTEXITCODE -ne 0) { Abort 'git fetch failed.' }

# 2. Path resolution
$parent = Split-Path $repo -Parent
$repoLeaf = Split-Path $repo -Leaf
$target = Join-Path $parent "$repoLeaf-$Name"
Write-Step "3/7 target path: $target"

if (Test-Path $target) {
    Abort "Target directory already exists: $target. Use a different -Name or clean up manually."
}

# 3. Branch
if (-not $Branch) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmm'
    $Branch = "auto/$Name-$stamp"
}
Write-Step "4/7 branch name: $Branch"

$existing = & git rev-parse --verify --quiet "refs/heads/$Branch" 2>$null
if ($existing) { Abort "Branch already exists: $Branch. After squash merge, specify a different -Branch." }

# 4. git worktree add
Write-Step "5/7 git worktree add"
& git worktree add $target -b $Branch "origin/$Base"
if ($LASTEXITCODE -ne 0) { Abort 'git worktree add failed.' }
Write-Ok "worktree created: $target ($Branch from origin/$Base)"

# 5. node_modules junction
if ($NoJunction) {
    Write-Warn '6/7 -NoJunction set. Skipping junction. Run npm install in the new worktree.'
} else {
    Write-Step '6/7 node_modules junction'
    $srcModules = Join-Path $repo 'node_modules'
    $tgtModules = Join-Path $target 'node_modules'

    if (-not (Test-Path $srcModules)) {
        Write-Warn "Main worktree has no node_modules. Skipping junction. cd `"$target`" then npm install."
    } elseif (Test-Path $tgtModules) {
        $isJunction = (Get-Item $tgtModules -Force).Attributes -band [IO.FileAttributes]::ReparsePoint
        if ($isJunction) {
            Remove-Item $tgtModules -Force
            cmd /c "mklink /J `"$tgtModules`" `"$srcModules`"" | Out-Null
            if ($LASTEXITCODE -ne 0) { Write-Warn "dangling junction recreate failed. cd `"$target`" then npm install." }
            else { Write-Ok 'dangling junction recreated.' }
        } elseif ($ReplaceModules) {
            Remove-Item $tgtModules -Recurse -Force
            cmd /c "mklink /J `"$tgtModules`" `"$srcModules`"" | Out-Null
            if ($LASTEXITCODE -ne 0) { Write-Warn "junction replace failed. cd `"$target`" then npm install." }
            else { Write-Ok 'real node_modules replaced with junction.' }
        } else {
            Write-Warn 'Target already has a real node_modules directory. Pass -ReplaceModules to overwrite.'
        }
    } else {
        cmd /c "mklink /J `"$tgtModules`" `"$srcModules`"" | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Warn "junction creation failed (permissions?). cd `"$target`" then npm install." }
        else { Write-Ok 'junction created: 0 disk/0 time shared with main.' }
    }
}

# 6. Verify + cheat-sheet
Write-Step '7/7 verify + cheat-sheet'
Push-Location $target
try {
    $cur = & git branch --show-current
    Write-Ok "branch --show-current: $cur"
} finally {
    Pop-Location
}

Write-Host ''
Write-Host '--- Next session entry ---' -ForegroundColor Magenta
Write-Host "cd `"$target`"" -ForegroundColor White
Write-Host '' -ForegroundColor White
Write-Host '--- Workflow (3 documented patterns integrated) ---' -ForegroundColor Magenta
Write-Host '1) Edit files + git add' -ForegroundColor White
Write-Host '2) git branch --show-current  # verify branch right before commit' -ForegroundColor White
Write-Host "3) git commit -m '...'" -ForegroundColor White
Write-Host "4) git push origin HEAD:$Branch  # explicit HEAD (avoids swap by other sessions)" -ForegroundColor White
Write-Host "5) gh pr create --base $Base --head $Branch ..." -ForegroundColor White
Write-Host ''
Write-Host '--- After PR merge: cleanup ---' -ForegroundColor Magenta
Write-Host "git worktree remove `"$target`"" -ForegroundColor White
Write-Host "# junction is removed automatically; manual: Remove-Item -Force." -ForegroundColor DarkGray
