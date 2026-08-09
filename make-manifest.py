# =====================================================================
#  img/manifest.json 을 만든다.
#
#  1) img/<폴더>/ 의 사진 목록          — 사진을 넣기만 하면 화면에 나오게
#  2) 사진마다 톤 값 (명도·색상·채도)   — WORK 그리드를 톤 순서로 배열하려고
#
#  톤 값을 미리 재두는 이유: 브라우저에서 72장을 캔버스로 읽어 계산하면
#  느리고, 다 읽은 뒤 재배치되는 게 눈에 보인다. 여기서 재두면 브라우저는
#  정렬만 하면 된다.
#
#  배포할 때 sync-deploy.ps1 이 자동으로 부른다.
#  직접 실행:  python make-manifest.py
# =====================================================================
import io
import json
import math
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("Pillow 가 없어 톤 값 없이 목록만 만듭니다. (pip install pillow)")
    Image = None

ROOT = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(ROOT, "img")
VIDEO = os.path.join(ROOT, "video")
OUT = os.path.join(IMG, "manifest.json")
CACHE = os.path.join(ROOT, ".tone-cache.json")

PHOTO_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")


def natural(name):
    """image2 가 image10 보다 뒤로 가지 않게 숫자를 자리수 맞춰 비교."""
    out, num = [], ""
    for ch in name:
        if ch.isdigit():
            num += ch
        else:
            if num:
                out.append(num.rjust(12, "0")); num = ""
            out.append(ch.lower())
    if num:
        out.append(num.rjust(12, "0"))
    return "".join(out)


# ── 톤 계산 ──────────────────────────────────────────────────────────
def _srgb_to_linear(v):
    c = v / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


LIN = [_srgb_to_linear(v) for v in range(256)]


def tone(path):
    """[명도L*, 색상H, 채도S, 색선명도C, 가로세로비] 를 돌려준다.

    명도는 단순 평균이 아니라 지각 명도(CIE L*)의 중앙값이다.
    평균을 쓰면 밝은 하늘이나 검은 배경 한 덩어리에 값이 끌려간다.

    색상은 채도로 가중한 '원형' 평균이다. 색상은 0도와 359도가 같은 빨강이라
    그냥 평균 내면 엉뚱한 값이 나온다. 무채색 픽셀은 색상 정보가 믿을 수 없어
    투표에서 뺀다.

    색선명도(C)는 그 색이 한 방향으로 모여 있는 정도다(0~1). 낮으면
    '색이라 할 만한 게 없는 사진'이라는 뜻이라, 정렬에서 색상을 쓰지 않는다.
    """
    im = Image.open(path)
    ratio = im.width / im.height if im.height else 1.0
    im = im.convert("RGB")
    im.thumbnail((160, 160))
    raw = im.tobytes()                 # getdata() 는 Pillow 14 에서 없어진다

    lums = []
    sx = sy = sw = 0.0
    ssum = 0.0
    for i in range(0, len(raw), 3):
        r, g, b = raw[i], raw[i + 1], raw[i + 2]
        Y = 0.2126 * LIN[r] + 0.7152 * LIN[g] + 0.0722 * LIN[b]
        lums.append(Y)

        mx, mn = max(r, g, b), min(r, g, b)
        d = mx - mn
        s = 0.0 if mx == 0 else d / mx
        ssum += s
        if d:
            if mx == r:
                h = ((g - b) / d) % 6
            elif mx == g:
                h = (b - r) / d + 2
            else:
                h = (r - g) / d + 4
            a = h * math.pi / 3.0
            w = s * (mx / 255.0)          # 어둡거나 흐린 픽셀은 발언권을 줄인다
            sx += math.cos(a) * w
            sy += math.sin(a) * w
            sw += w

    lums.sort()
    Ym = lums[len(lums) // 2]
    L = 116 * (Ym ** (1 / 3)) - 16 if Ym > 0.008856 else 903.3 * Ym

    if sw > 1e-6:
        H = (math.degrees(math.atan2(sy, sx)) + 360) % 360
        C = math.hypot(sx, sy) / sw
    else:
        H = C = 0.0

    return [round(L, 1), round(H, 1), round(ssum / len(lums), 3),
            round(C, 3), round(ratio, 4)]


def load_cache():
    try:
        return json.load(io.open(CACHE, encoding="utf-8"))
    except Exception:
        return {}


def main():
    if not os.path.isdir(IMG):
        print("img 폴더가 없습니다.")
        return 0

    cache = load_cache()
    new_cache = {}
    tones = {}
    computed = reused = 0

    def measure(abs_path, web_path):
        nonlocal computed, reused
        st = os.stat(abs_path)
        key = "%s|%d|%d" % (web_path, st.st_size, int(st.st_mtime))
        if key in cache:
            new_cache[key] = cache[key]
            tones[web_path] = cache[key]
            reused += 1
            return
        if Image is None:
            return
        try:
            t = tone(abs_path)
        except Exception as e:
            print("  건너뜀 (%s): %s" % (web_path, e))
            return
        new_cache[key] = t
        tones[web_path] = t
        computed += 1

    # 작품 사진
    folders = {}
    total = 0
    for name in sorted(os.listdir(IMG)):
        d = os.path.join(IMG, name)
        if not os.path.isdir(d):
            continue
        files = sorted(
            (f for f in os.listdir(d) if f.lower().endswith(PHOTO_EXT)),
            key=natural)
        folders[name] = files
        total += len(files)
        for f in files:
            measure(os.path.join(d, f), "img/%s/%s" % (name, f))

    # 영상 작업의 포스터도 그리드에 들어가므로 같이 잰다
    if os.path.isdir(VIDEO):
        for f in sorted(os.listdir(VIDEO)):
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                measure(os.path.join(VIDEO, f), "video/%s" % f)

    data = {"v": 2, "folders": folders, "tone": tones}
    text = json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True)

    # 내용이 같으면 덮어쓰지 않는다.
    # (수정시각이 바뀌면 배포 스크립트가 "내용이 바뀌었다"고 오해해 매번 배포한다)
    old = None
    if os.path.exists(OUT):
        try:
            old = io.open(OUT, encoding="utf-8").read()
        except Exception:
            pass

    if old is not None and old.strip() == text.strip():
        print("사진 목록 그대로 — 폴더 %d개, 사진 %d장 (톤 %d장)"
              % (len(folders), total, len(tones)))
    else:
        io.open(OUT, "w", encoding="utf-8", newline="\n").write(text)
        print("사진 목록 갱신 — 폴더 %d개, 사진 %d장 (톤 %d장: 새로 잰 것 %d, 재사용 %d)"
              % (len(folders), total, len(tones), computed, reused))

    try:
        json.dump(new_cache, io.open(CACHE, "w", encoding="utf-8"))
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
