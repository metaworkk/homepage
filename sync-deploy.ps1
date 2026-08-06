# =====================================================================
#  GitHub 에서 변경분을 받아 Cloudflare Pages 로 배포한다.
#  - 다른 PC 에서 push 한 내용을 이 PC 로 가져와 배포하는 용도
#  - 영상(video/)은 이 PC 에만 있으므로 배포는 반드시 여기서 해야 한다
#
#  수동 실행:   powershell -ExecutionPolicy Bypass -File sync-deploy.ps1
#  변경 없어도 강제 배포:  ... -File sync-deploy.ps1 -Force
# =====================================================================
param([switch]$Force)

$ErrorActionPreference = "Stop"
# 콘솔에 한글이 깨지지 않도록
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$OutputEncoding = [Text.Encoding]::UTF8
$Root = "C:\Users\meta\Downloads\portfolio"
$Log  = Join-Path $Root "sync-deploy.log"

function Say($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Write-Output $line
    Add-Content -Path $Log -Value $line -Encoding utf8
}

Set-Location $Root
Say "--- 동기화 시작 ---"

# 1) 원격에서 변경분 가져오기
$before = (git rev-parse HEAD).Trim()
git fetch origin main --quiet
$remote = (git rev-parse origin/main).Trim()

if ($before -eq $remote -and -not $Force) {
    Say "변경 없음 (HEAD $($before.Substring(0,7))). 배포 생략."
    exit 0
}

if ($before -ne $remote) {
    # 로컬에 커밋 안 된 수정이 있으면 pull 이 깨지므로 먼저 확인
    $dirty = git status --porcelain
    if ($dirty) {
        Say "경고: 로컬에 커밋되지 않은 변경이 있어 pull 을 중단했습니다."
        Say $dirty
        exit 1
    }
    git pull --ff-only origin main --quiet
    $after = (git rev-parse HEAD).Trim()
    Say "받음: $($before.Substring(0,7)) -> $($after.Substring(0,7))"
    git log --oneline "$before..$after" | ForEach-Object { Say "  $_" }
} else {
    Say "변경 없지만 -Force 지정됨."
}

# 2) 배포 전 안전장치 — Pages 는 파일당 25MB 를 넘으면 업로드가 실패한다
$big = Get-ChildItem $Root -Recurse -File |
       Where-Object { $_.Length -gt 25MB -and $_.FullName -notmatch '\\\.git\\' }
if ($big) {
    Say "중단: 25MB 초과 파일이 있습니다."
    $big | ForEach-Object { Say ("  {0:N1}MB  {1}" -f ($_.Length/1MB), $_.FullName.Replace($Root,'.')) }
    exit 1
}

# 3) 배포
Say "배포 시작..."
# --branch 를 반드시 지정한다. 생략하면 git 브랜치명(main)으로 나가는데
# 이 프로젝트의 프로덕션 브랜치는 "portfolio" 라서 라이브 도메인에 반영되지 않는다.
$out = & npx --yes wrangler@latest pages deploy . --project-name=metawork --branch=portfolio --commit-dirty=true 2>&1
$out | Where-Object { $_ -notmatch '^npm notice' } | ForEach-Object { Say "  $_" }

if ($out -match "Deployment complete") {
    Say "배포 성공"
    exit 0
} else {
    Say "배포 실패 — 위 로그를 확인하세요."
    exit 1
}
