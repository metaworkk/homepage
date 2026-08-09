# =====================================================================
#  img/ 폴더를 훑어 img/manifest.json 을 만든다.
#
#  이 파일이 있으면 script.js 는 count 숫자 대신 이 목록을 따른다.
#  즉 사진을 폴더에 넣기만 하면 화면에 나온다 —
#  count 를 손으로 세어 고칠 필요도, 파일 이름을 image01 로 맞출 필요도 없다.
#
#  배포할 때 sync-deploy.ps1 이 자동으로 부른다.
#  직접 실행:  powershell -ExecutionPolicy Bypass -File make-manifest.ps1
# =====================================================================
$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$Root   = "C:\Users\meta\Downloads\portfolio"
$ImgDir = Join-Path $Root "img"
$Out    = Join-Path $ImgDir "manifest.json"

if (-not (Test-Path $ImgDir)) { Write-Output "img 폴더가 없습니다."; exit 0 }

# image2 가 image10 보다 뒤로 가지 않도록 숫자를 자리수 맞춰 비교한다
$natural = {
    [regex]::Replace($_.Name, '\d+', { param($m) $m.Value.PadLeft(10, '0') })
}

$map = [ordered]@{}
$total = 0

Get-ChildItem $ImgDir -Directory | Sort-Object Name | ForEach-Object {
    $files = Get-ChildItem $_.FullName -File |
             Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp|gif|avif)$' } |
             Sort-Object $natural |
             ForEach-Object { $_.Name }

    # 사진이 없는 폴더는 넣지 않는다 (script.js 가 예전 방식으로 넘어가지 않도록
    # 빈 배열이라도 넣어야 "이 작품은 사진 0장"이 정확히 전달된다)
    $map[$_.Name] = @($files)
    $total += $files.Count
}

$json = $map | ConvertTo-Json -Depth 3

# 내용이 같으면 덮어쓰지 않는다.
# (수정시각이 바뀌면 배포 스크립트가 "내용이 바뀌었다"고 오해해 매번 배포한다)
$same = $false
if (Test-Path $Out) {
    $old = Get-Content $Out -Raw -Encoding UTF8
    if ($old.Trim() -eq $json.Trim()) { $same = $true }
}

if ($same) {
    Write-Output ("사진 목록 그대로 — 폴더 {0}개, 사진 {1}장" -f $map.Count, $total)
} else {
    # BOM 없는 UTF-8 로 저장 (브라우저 JSON.parse 가 BOM 을 싫어함)
    [IO.File]::WriteAllText($Out, $json, (New-Object Text.UTF8Encoding $false))
    Write-Output ("사진 목록 갱신 — 폴더 {0}개, 사진 {1}장" -f $map.Count, $total)
}
