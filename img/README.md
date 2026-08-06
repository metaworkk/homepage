# 작품 이미지 폴더

작품 하나당 폴더 하나입니다. **파일 이름만 그대로 두고 사진만 바꿔 넣으면** 사이트에 자동 반영됩니다.

```
img/
  work01/  ← 작품 01
    image01.jpg   ← 대표 이미지 (궤도 카드 + 마우스오버 배경에 사용)
    image02.jpg
    image03.jpg
  work02/
  work03/
  work04/
  work05/
```

## 규칙

- 파일명은 `image01.jpg`, `image02.jpg`, `image03.jpg` … 순서대로 (두 자리, 01부터)
- **`image01.jpg`이 대표 이미지** — 갤러리 카드와 마우스오버 배경에 쓰입니다
- 확장자는 `.jpg` (다른 걸 쓰려면 `script.js`의 `WORKS` 설정에서 `ext` 값을 바꾸세요)
- 장수를 늘리거나 줄이려면 `script.js` 맨 위 `WORKS`의 `count` 숫자만 바꾸면 됩니다

## 작품 제목·정보 바꾸기

`script.js` 상단의 `WORKS` 배열에서 수정합니다:

```js
const WORKS = [
  { folder: "work01", title: "작품 제목 01", meta: "Oil on canvas · 2026", count: 3 },
  ...
];
```

- `folder` — 이미지 폴더 이름
- `title` — 작품 제목
- `meta` — 재료 · 연도
- `count` — 그 폴더에 든 사진 장수

## 권장 사양

- 가로 1600px 이상, JPEG 품질 80% 안팎 (한 장당 300~500KB)
- 현재 들어있는 사진은 **테스트용 샘플**(Lorem Picsum)이니 실제 작품 사진으로 교체하세요
