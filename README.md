# metawork.org — 이진형 포트폴리오

정적 사이트. 빌드 과정 없이 파일 3개(`index.html` · `style.css` · `script.js`)가 전부입니다.

## 어디를 고치면 되나

| 고치고 싶은 것 | 위치 |
|---|---|
| 작품 제목 · 재료 · 연도 · 영상 경로 | `script.js` 의 `WORKS` 배열 |
| 작품 사진 추가 · 교체 | `img/<폴더>/` 에 넣기만 (자동 반영) |
| 전광판 문구 | `index.html` 의 `data-phrases` (문장은 `\|` 로 구분) |
| 작가 노트 · 소개글 | `index.html` 의 `#about` 섹션 |
| 이메일 · SNS 링크 | `index.html` 의 `#contact` 섹션 |
| 색 · 글자 크기 · 자간 | `style.css` 맨 위 `:root` 변수 |
| WORK 표시 방식 (사진 그리드 ↔ 회전하는 구) | `script.js` 맨 위 `GALLERY_MODE` |

### WORK 표시 방식

```js
const GALLERY_MODE = "grid";    // 사진 그리드 (현재)
const GALLERY_MODE = "orbit";   // 3D 구 위에서 카드가 도는 예전 방식
```

두 방식의 코드가 모두 살아 있어 이 한 줄로 오갈 수 있습니다.

- `grid` — 모든 작업의 모든 사진을 무작위 순서로 늘어놓습니다. 높이는 전부
  같고 가로폭만 사진의 원래 비율을 따르며, 간격은 일정합니다. 한 화면에
  다 들어오면 그 안에 맞추고, 안 들어오면 갤러리만 스크롤됩니다.
- `orbit` — 카드가 두 줄로 회전합니다. 드래그로 돌릴 수 있습니다.

어느 쪽이든 사진을 누르면 그 작품 페이지로 넘어갑니다.

### WORKS 항목 구조

```js
{ folder: "work01",                                   // img/work01/ 사진 폴더
  title: "어떤 힘",
  meta:  "Single channel video · 2026",
  video:   "video/force-web.mp4",                     // 미리보기(무음 반복재생)
  videoHQ: "https://video.metawork.org/force.mp4",    // 클릭 시 재생할 원본
  poster:  "video/test01.jpg",
  desc:    "작품 설명을 여기에.<br>줄바꿈은 <br> 로." }   // 비우면 안내 문구가 대신 나옴
```

### 사진 추가 — 폴더에 넣기만 하면 됩니다

**장수를 세어 적을 필요가 없습니다.** 배포할 때 `make-manifest.ps1` 이 `img/` 를
훑어 `img/manifest.json` 을 만들고, 사이트가 그 목록을 따릅니다. 파일 이름도
자유롭지만 순서는 이름순이라 `image01.jpg`, `image02.jpg` … 를 권합니다.
자세한 내용은 `img/README.md` 를 보세요.

새 **폴더**를 만들었을 때만 위 `WORKS` 배열에 한 줄을 넣으면 됩니다.
(제목·재료·연도는 자동으로 알 수 없기 때문입니다)

## 다른 PC 에서 작업하는 법

PowerShell 은 `&&` 를 지원하지 않으니 **한 줄씩** 실행하세요.

```powershell
git pull          # ① 시작 전 항상 먼저
```

② 고칩니다. 고칠 곳은 위 표 참고.

```powershell
git add -A
git commit -m "작품 설명 추가"
git push          # ③ 끝. 배포는 자동입니다
```

**캐시 버전(`?v=`)은 손대지 않으셔도 됩니다.** 배포 스크립트가 css/js 변경을
감지해 자동으로 올립니다.

**배포는 영상이 있는 PC 가 10분마다 자동 처리**합니다. 급하면 그 PC 에서:

```powershell
powershell -ExecutionPolicy Bypass -File sync-deploy.ps1
```

### 주의

- 이메일·링크는 **두 군데**를 같이 고치세요 — `href="mailto:주소"` 와 화면에 보이는 글자
- 영상·사진 교체는 저장소에 없으므로 **영상이 있는 PC** 에서만 가능합니다

## 이 저장소에 없는 것

용량 때문에 제외했습니다. 클론하면 영상이 안 보이지만 텍스트 수정에는 지장 없습니다.

- `video/` — 미리보기 압축본 (Cloudflare Pages 에 배포되어 있음)
- `meta/` — 히어로의 메타버스 임베드

원본 영상은 Cloudflare R2 (`video.metawork.org`) 에 있습니다.

## 배포

```bash
npx wrangler pages deploy . --project-name=metawork
```

배포 전 확인: **파일 하나라도 25MB 를 넘으면 업로드가 실패합니다.**

```bash
find . -type f -size +25M
```
