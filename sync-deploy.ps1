# =====================================================================
#  사이트 내용이 바뀌면 Cloudflare Pages 로 배포한다.
#
#  - GitHub 에 새 커밋이 있으면 받아온다 (다른 PC 에서 작업한 경우)
#  - 이 PC 에서 직접 고친 것도 감지해서 배포한다 (커밋 안 해도 됨)
#  - 실제 내용이 바뀐 경우에만 배포하므로 10분마다 돌아도 부담이 없다
#
#  수동 실행:  powershell -ExecutionPolicy Bypass -File sync-deploy.ps1
#  강제 배포:  ... -File sync-deploy.ps1 -Force
# =====================================================================
param([switch]$Force)

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$OutputEncoding = [Text.Encoding]::UTF8

$Root  = "C:\Users\meta\Downloads\portfolio"
$Log   = Join-Path $Root "sync-deploy.log"
$Stamp = Join-Path $Root ".assets-hash"

function Say($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Write-Output $line
    Add-Content -Path $Log -Value $line -Encoding utf8
}

function Get-Md5($text) {
    $md5 = [Security.Cryptography.MD5]::Create()
    $b = $md5.ComputeHash([Text.Encoding]::UTF8.GetBytes($text))
    return [BitConverter]::ToString($b).Replace("-", "")
}

# 배포될 내용의 지문. 캐시 버전(?v=NN)은 결과이지 원인이 아니므로 제외한다.
function Get-Fingerprint {
    $parts = ""
    foreach ($f in @("index.html", "style.css", "script.js")) {
        $t = Get-Content (Join-Path $Root $f) -Raw -Encoding UTF8
        $t = $t -replace '\?v=\d+', ''
        $parts += Get-Md5 $t
    }
    # 미디어는 내용 대신 이름·크기·수정시각으로 (용량이 커서 해시는 비쌈)
    # manifest.json 은 이 스크립트가 만들어내는 결과물이라 제외한다.
    # (넣어두면 갱신 → 지문 변화 → 또 배포 가 끝없이 반복된다)
    foreach ($dir in @("video", "img", "fonts", "meta")) {
        $p = Join-Path $Root $dir
        if (Test-Path $p) {
            $list = Get-ChildItem $p -Recurse -File |
                    Where-Object { $_.Name -ne "manifest.json" } |
                    Sort-Object FullName |
                    ForEach-Object { "$($_.FullName)|$($_.Length)|$($_.LastWriteTimeUtc.Ticks)" }
            $parts += Get-Md5 ($list -join "`n")
        }
    }
    return Get-Md5 $parts
}

Set-Location $Root
Say "--- 동기화 시작 ---"

# ── 0) 사진 목록 갱신 ──
# img/ 폴더를 훑어 img/manifest.json 을 다시 만든다.
# 사진을 폴더에 넣기만 하면 화면에 나오게 하는 장치. (내용이 같으면 건드리지 않음)
try {
    $mf = & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "make-manifest.ps1")
    $mf | ForEach-Object { Say "  $_" }
} catch {
    Say "알림: 사진 목록을 만들지 못했습니다 — count 방식으로 표시됩니다. $($_.Exception.Message)"
}

# ── 1) GitHub 에 새 커밋이 있으면 받아온다 ──
git fetch origin main --quiet
$local  = (git rev-parse HEAD).Trim()
$remote = (git rev-parse origin/main).Trim()

if ($local -ne $remote) {
    $dirty = git status --porcelain
    if ($dirty) {
        # 이 PC 에서 작업 중이면 덮어쓰지 않는다. 배포는 계속 진행.
        Say "알림: 이 PC 에 커밋되지 않은 변경이 있어 GitHub 받기를 건너뜁니다."
        Say "      (다른 PC 의 변경을 받으려면 여기서 먼저 commit/push 하세요)"
    } else {
        git pull --ff-only origin main --quiet
        Say "받음: $($local.Substring(0,7)) -> $((git rev-parse HEAD).Trim().Substring(0,7))"
        git log --oneline "$local..HEAD" | ForEach-Object { Say "  $_" }
    }
}

# ── 2) 내용이 바뀌었는지 판단 ──
$now  = Get-Fingerprint
$prev = if (Test-Path $Stamp) { (Get-Content $Stamp -Raw).Trim() } else { "" }

if ($now -eq $prev -and -not $Force) {
    Say "내용 변경 없음. 배포 생략."
    exit 0
}

# ── 3) 캐시 버전 자동 갱신 (css/js 가 바뀐 경우만) ──
$html = Join-Path $Root "index.html"
$raw  = Get-Content $html -Raw -Encoding UTF8
$cur  = [regex]::Match($raw, 'style\.css\?v=(\d+)').Groups[1].Value
$next = [int]$cur + 1
$raw  = $raw -replace 'style\.css\?v=\d+',  "style.css?v=$next"
$raw  = $raw -replace 'script\.js\?v=\d+', "script.js?v=$next"
Set-Content $html -Value $raw -Encoding UTF8 -NoNewline
Say "캐시 버전: v$cur -> v$next"

# ── 4) 안전장치 — Pages 는 파일당 25MB 를 넘으면 업로드가 실패한다 ──
$big = Get-ChildItem $Root -Recurse -File |
       Where-Object { $_.Length -gt 25MB -and $_.FullName -notmatch '\\\.git\\' }
if ($big) {
    Say "중단: 25MB 초과 파일이 있습니다."
    $big | ForEach-Object { Say ("  {0:N1}MB  {1}" -f ($_.Length/1MB), $_.FullName.Replace($Root,'.')) }
    exit 1
}

# ── 5) 배포 ──
# --branch 를 반드시 지정한다. 생략하면 git 브랜치명(main)으로 나가는데
# 이 프로젝트의 프로덕션 브랜치는 "portfolio" 라서 라이브 도메인에 반영되지 않는다.
Say "배포 시작..."
$out = & npx --yes wrangler@latest pages deploy . --project-name=metawork --branch=portfolio --commit-dirty=true 2>&1
$out | Where-Object { $_ -notmatch '^npm notice' } | ForEach-Object { Say "  $_" }

if ($out -match "Deployment complete") {
    # 배포에 성공한 내용의 지문을 기록 (버전 갱신 후 다시 계산)
    Set-Content $Stamp -Value (Get-Fingerprint) -NoNewline
    Say "배포 성공"
    exit 0
} else {
    Say "배포 실패 — 위 로그를 확인하세요."
    exit 1
}
