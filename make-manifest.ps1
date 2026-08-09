# =====================================================================
#  img/manifest.json 을 만든다. (실제 작업은 make-manifest.py 가 한다)
#
#  Python 으로 만들면 사진 목록과 함께 톤 값(명도·색상·채도)까지 잰다.
#  그 값으로 WORK 그리드가 어두운 것부터 밝은 것 순으로 배열된다.
#
#  Python 이나 Pillow 가 없는 PC 를 대비해, 실패하면 목록만이라도 만든다.
#  (톤 값이 없으면 그리드는 예전처럼 무작위 순서로 나온다 — 화면은 정상)
#
#  직접 실행:  powershell -ExecutionPolicy Bypass -File make-manifest.ps1
# =====================================================================
$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$Root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ImgDir = Join-Path $Root "img"
$Out    = Join-Path $ImgDir "manifest.json"
$Py     = Join-Path $Root "make-manifest.py"

if (-not (Test-Path $ImgDir)) { Write-Output "img 폴더가 없습니다."; exit 0 }

# ── 1) Python 으로 (목록 + 톤) ──
if (Test-Path $Py) {
    # Windows PowerShell의 기본 cp949 콘솔에서도 Python의 긴 대시·한글 로그가
    # 인코딩 오류로 실패하지 않게 표준 출력을 UTF-8로 고정한다.
    $env:PYTHONIOENCODING = "utf-8"
    foreach ($exe in @("python", "py")) {
        try {
            # stderr 를 합치지 않는다. PowerShell 5.1 은 네이티브 명령의 stderr 를
            # 오류로 감싸서, 경고 한 줄만 나와도 실패로 처리해 버린다.
            $pythonOutput = & $exe $Py
            if ($LASTEXITCODE -eq 0) {
                $pythonOutput | ForEach-Object { Write-Output $_ }
                exit 0
            }
        } catch {
            # 다음 실행기로
        }
    }
    Write-Output "알림: Python 실행 실패 — 톤 값 없이 목록만 만듭니다."
}

# ── 2) 대비책: 목록만 (톤 없음) ──
# image2 가 image10 보다 뒤로 가지 않도록 숫자를 자리수 맞춰 비교한다
$natural = {
    [regex]::Replace($_.Name, '\d+', { param($m) $m.Value.PadLeft(12, '0') })
}

$folders = [ordered]@{}
$total = 0

Get-ChildItem $ImgDir -Directory | Sort-Object Name | ForEach-Object {
    $files = Get-ChildItem $_.FullName -File |
             Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp|gif|avif)$' } |
             Sort-Object $natural |
             ForEach-Object { $_.Name }
    $folders[$_.Name] = @($files)
    $total += $files.Count
}

$json = [ordered]@{ v = 2; folders = $folders; tone = @{} } |
        ConvertTo-Json -Depth 4

$same = $false
if (Test-Path $Out) {
    $old = Get-Content $Out -Raw -Encoding UTF8
    if ($old.Trim() -eq $json.Trim()) { $same = $true }
}

if ($same) {
    Write-Output ("사진 목록 그대로 — 폴더 {0}개, 사진 {1}장 (톤 없음)" -f $folders.Count, $total)
} else {
    # BOM 없는 UTF-8 로 저장 (브라우저 JSON.parse 가 BOM 을 싫어함)
    [IO.File]::WriteAllText($Out, $json, (New-Object Text.UTF8Encoding $false))
    Write-Output ("사진 목록 갱신 — 폴더 {0}개, 사진 {1}장 (톤 없음)" -f $folders.Count, $total)
}
