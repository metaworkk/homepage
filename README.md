# metawork.org — 이진형 포트폴리오

정적 사이트. 빌드 과정 없이 파일 3개(`index.html` · `style.css` · `script.js`)가 전부입니다.

## 어디를 고치면 되나

| 고치고 싶은 것 | 위치 |
|---|---|
| 작품 제목 · 재료 · 연도 · 영상 경로 | `script.js` 의 `WORKS` 배열 |
| 전광판 문구 | `index.html` 의 `data-phrases` (문장은 `\|` 로 구분) |
| 작가 노트 · 소개글 | `index.html` 의 `#about` 섹션 |
| 이메일 · SNS 링크 | `index.html` 의 `#contact` 섹션 |
| 색 · 글자 크기 · 자간 | `style.css` 맨 위 `:root` 변수 |

### WORKS 항목 구조

```js
{ folder: "work01",                                   // img/work01/ 사진 폴더
  title: "어떤 힘",
  meta:  "Single channel video · 2026",
  count: 3,                                           // 그 폴더의 사진 장수
  video:   "video/force-web.mp4",                     // 미리보기(무음 반복재생)
  videoHQ: "https://video.metawork.org/force.mp4",    // 클릭 시 재생할 원본
  poster:  "video/test01.jpg",
  desc:    "작품 설명을 여기에.<br>줄바꿈은 <br> 로." }   // 비우면 안내 문구가 대신 나옴
```

`ratio: "4/3"` 을 추가하면 그 작품만 액자 비율이 4:3 이 됩니다. (기본 16:9)

## ⚠️ 파일 수정 후 반드시 할 것

`index.html` 맨 위의 **버전 숫자를 올려주세요.** 안 그러면 브라우저가 옛날 파일을 계속 씁니다.

```html
<link rel="stylesheet" href="style.css?v=23">
<script src="script.js?v=23"></script>
```

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
