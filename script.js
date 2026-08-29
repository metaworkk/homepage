/* ============================================================
   PORTFOLIO SCRIPT — 반전 커서 / 3D 틸트 / 패럴랙스 / 리빌
   ============================================================ */
(async () => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ── WORK 갤러리 표시 방식 ────────────────────────────────
     "grid"  = 모든 작업 사진을 무작위 순서로, 같은 높이·같은 간격으로 흩어 놓는다
     "orbit" = 예전 방식. 3D 구 위에서 카드가 두 줄로 회전한다
     이 한 줄만 바꾸면 서로 오갈 수 있습니다. 두 방식의 코드는 모두 살아 있습니다. */
  const GALLERY_MODE = "grid";

  /* 사진 캐시 무력화 —
     사진을 같은 파일명으로 교체하면 브라우저가 예전 것을 계속 보여준다.
     script.js?v=NN 의 버전을 사진 주소에도 붙여 새 파일을 받게 한다.
     (영상은 용량이 커서 제외 — 바뀌면 파일명을 바꾸는 편이 낫다) */
  const ASSET_V = (() => {
    const t = document.querySelector('script[src*="script.js"]');
    const m = t && t.getAttribute("src").match(/[?&]v=(\d+)/);
    return m ? m[1] : "";
  })();
  const bust = (u) =>
    (!u || !ASSET_V) ? u : u + (u.includes("?") ? "&" : "?") + "v=" + ASSET_V;

  // 히어로 타이틀 등장
  document.body.classList.add("loaded");

  /* ----------------------------------------------------------
     반전 커서 — 즉각 반응
     ---------------------------------------------------------- */
  if (!isTouch) {
    const cursor = document.querySelector(".cursor");

    window.addEventListener("mousemove", (e) => {
      cursor.style.transform =
        `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    }, { passive: true });

    document.querySelectorAll("a, button, [data-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
      el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });
  }

  /* ----------------------------------------------------------
     3D 틸트 — data-tilt 요소가 마우스를 따라 기울어짐
     ---------------------------------------------------------- */
  if (!isTouch && !reducedMotion) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      let raf = null;

      el.addEventListener("mousemove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const rotY = (px - 0.5) * 16;
          const rotX = (0.5 - py) * 16;
          el.style.transform =
            `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
          raf = null;
        });
      });

      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "perspective(900px) rotateX(0) rotateY(0) scale(1)";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }


  /* ----------------------------------------------------------
     상단 메뉴 이동 — 즉시 이동

     예전에는 html { scroll-behavior: smooth } 로 9,800px 을 애니메이션했다.
     그 사이 scroll-snap-stop 이 중간 스냅마다 끼어들고 TEXT 구간에서
     스냅이 켜졌다 꺼지면서, About 을 눌러도 10초 뒤 목적지 470px 앞의
     빈 화면에 멈췄다. 긴 거리 앵커에 부드러운 스크롤은 득이 없다.
     ---------------------------------------------------------- */
  document.querySelectorAll('.nav a[href^="#"], .footer a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "instant", block: "start" });
      history.replaceState(null, "", a.getAttribute("href"));
      // 키보드 사용자가 이동 후 그 자리에서 이어서 탭 할 수 있게
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  /* ----------------------------------------------------------
     TEXT — 긴 글은 접어 둔다

     두 편이 8.9화면이라, 작품을 다 본 직후에 그만큼의 글이 이어지면
     읽히기보다 스크롤로 지나가 버린다. 평소에는 제목·형식만 보여주고
     누른 사람에게만 편다.
     JS 가 없으면 접히지 않고 그냥 다 보인다 — 글이 사라지진 않는다.
     ---------------------------------------------------------- */
  document.querySelectorAll("article.tx").forEach((art) => {
    const body = art.querySelector(".tx-body");
    const title = art.querySelector(".tx-title");
    if (!body || !title) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tx-toggle";

    const label = () => {
      const open = art.classList.contains("tx-open");
      btn.textContent = open ? "접기" : "읽기";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) body.removeAttribute("hidden");
      else body.setAttribute("hidden", "");
    };

    // 제목을 눌러도 열리게 — 버튼만 노리는 것보다 손이 편하다
    const toggle = () => {
      const willClose = art.classList.contains("tx-open");
      art.classList.toggle("tx-open");
      label();
      // 접을 때는 글 머리로 돌려보낸다. 안 그러면 화면이 갑자기 뚝 떨어진다
      if (willClose) art.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    btn.addEventListener("click", toggle);
    title.addEventListener("click", toggle);
    title.style.cursor = "pointer";

    art.classList.add("tx-collapsible");
    (art.querySelector(".tx-meta") || title).insertAdjacentElement("afterend", btn);
    label();
  });
  /* ----------------------------------------------------------
     히어로 크로스헤어 — 마우스를 따라가는 직선
     ---------------------------------------------------------- */
  const hero = document.querySelector(".hero");
  const xhairH = document.querySelector(".xhair-h");
  const xhairV = document.querySelector(".xhair-v");

  if (!isTouch && hero && xhairH) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      xhairH.style.top = (e.clientY - r.top) + "px";
      xhairV.style.left = (e.clientX - r.left) + "px";
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     데이터 스트립 — 테스트 패턴 (랜덤 바이너리 바)
     ---------------------------------------------------------- */
  const strip = document.getElementById("dataStrip");

  if (strip) {
    const sctx = strip.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function stripResize() {
      strip.width = strip.clientWidth * dpr;
      strip.height = strip.clientHeight * dpr;
    }

    function stripDraw() {
      const w = strip.width, h = strip.height;
      sctx.clearRect(0, 0, w, h);
      let x = 0;
      while (x < w) {
        const bw = (1 + Math.floor(Math.random() * 14)) * dpr;
        const roll = Math.random();
        if (roll < 0.42) {
          sctx.fillStyle = roll < 0.02 ? "#ffffff" : "rgba(255,255,255,0.72)";
          // 일부 바는 절반 높이로 — 리듬감
          const bh = Math.random() < 0.25 ? h * 0.5 : h;
          sctx.fillRect(x, (h - bh) / 2, bw, bh);
        }
        x += bw;
      }
    }

    stripResize();
    stripDraw();
    window.addEventListener("resize", () => { stripResize(); stripDraw(); });
    if (!reducedMotion) setInterval(stripDraw, 160);
  }

  /* ----------------------------------------------------------
     GALLERY — 3D 구 캐러셀
     작품 데이터: images 배열에 실제 경로를 넣으면 사진이 뜨고,
     null이면 플레이스홀더가 표시됩니다.
     예: images: ["img/work1-a.jpg", "img/work1-b.jpg"]
     ---------------------------------------------------------- */
  /* 작품 설정 — 사진은 img/<folder>/image01.jpg, image02.jpg … 순서로 자동 연결.
     사진을 바꾸려면 같은 이름으로 덮어쓰기만 하면 됩니다. (img/README.md 참고)
     count = 그 폴더에 든 사진 장수, ext = 확장자

     folder 이름 규칙 —
       · 작품마다 겹치지 않게 짓는다. 두 작품이 같은 이름을 쓰면
         한쪽에 사진을 넣는 순간 다른 쪽에도 똑같이 나온다.
       · 사진 작업은 photo01, photo02 … 순번.
       · 영상 작업은 영상 파일명과 같은 이름을 쓴다.
         (force → force-web.mp4, kuku → kuku-web.mp4 …)
         번호로 부르면 작품이 빠지거나 순서가 바뀔 때 어긋난다.
       · 영상 작업도 사진을 붙일 수 있다. img/<folder>/ 를 만들어
         사진을 넣고 count 를 장수만큼 올리면, 라이트박스에서
         영상이 첫 장, 사진이 그 뒤로 넘어간다. */
  /* 영상을 넣으려면 video(+poster) 한 줄만 추가하면 됩니다.
     영상이 있으면 카드가 무음 반복 재생되고, 라이트박스 첫 장으로 들어갑니다.
     count를 0으로 두면 사진 없이 영상만 있는 작품이 됩니다. */
  /* video    = 미리보기용 압축본 (카드·작품화면에서 무음 반복재생)
     videoHQ  = 클릭해서 볼 원본. R2 등 외부 저장소 주소를 넣으면 그걸 재생하고,
                비워두면 미리보기용 압축본을 그대로 씁니다.
     캡션 양식 — 디테일 샷을 열면 이 순서로 나옵니다.
       title  = 작품 제목
       meta   = 재료·형식·연도
       place  = 장소. "Performed at …" / "installation at …" 처럼 적습니다.
                예전에는 desc 안에 섞여 있었는데 줄로 분리했습니다.
       desc   = 작품 설명만. 장소는 넣지 마세요.
                줄바꿈이 필요하면 <br> 을 쓰세요.
                꺾쇠 < > 는 태그로 먹히니 작품명 인용은 《 》 를 쓰세요.
     videos   = 영상이 여러 편인 작품. 배열로 적으면 클릭 후 화살표로 넘겨봅니다.
                첫 편이 카드·작품화면의 대표 영상이 됩니다.
                videos: [{ web: "video/xx-01-web.mp4", hq: "https://video.metawork.org/xx-01.mp4" },
                         { web: "video/xx-02-web.mp4", hq: "https://video.metawork.org/xx-02.mp4" }] */
  const WORKS = [
        /* 전광판 작품 — type:"sign" 이면 영상 대신 세그먼트 디스플레이가 들어갑니다.
       phrases / phrasesSub 는 각각 윗줄·아랫줄 문구.
       표시 가능 문자: A-Z, 0-9, 공백, - / (한글 불가) */
    { type: "sign", featured: 1, folder: "sign", title: "인스타그램 매니페스토",
      meta: "Split-flap display, instagram dataset · 2026", count: 0,
      poster: "video/sign-poster.jpg",
      place: "Performed at Web", desc: "",
      phrases:    ["Like this post", "Save this for later", "Tag someone who", "DM me for details","Double tap", "if you agree", "comments",],
      phrasesSub: ["LOVE YOU", "thank you", "good vives only ", "life lately","take me back","No filter","Photo dump","HAPPY BIRTHDAY!"] },

       /* ── 사진 작업 (궤도 윗줄) ──
       row: 0 = 윗줄, 생략하면 아랫줄. 사진은 img/<folder>/image01.jpg … 순서로 연결 */
    { row: 0, folder: "photo13", title: "내일의 이웃", meta: " AR Interactive performance with choreography, Unreal · 2022", count: 5, place: "Performed at 국립아시아문화전당, Gwang-ju", desc: "연기자의 시야를 몸 바깥에 부착시켜 새로운 감각을 느낄 수 있게 한다 <br> 외부 센서와 Unreal 엔진으로 제작" },
    { row: 0, featured: 5, folder: "photo15", title: "말의머리", meta: "Performed on Roblox · 2022", count: 5, place: "Installation at KF gallery, Seoul", desc: "한 - 벨기에 수교 120주년 기념전 《말의 머리》 전시 <br>메타버스 공간 제작" },
    { row: 0, folder: "photo14", title: "I'm the church", meta: "VR project for theater performance · 2021", count: 4, place: "Performed at TINC, Seoul", desc: "VR을 사용한 현실과 혼합된 새로운 방식의 연극, 변방연극제" },
    { row: 0, folder: "photo12", title: "영혼을 수놓은 초상", meta: "Metaverse project in Zepeto · 2022", count: 5, place: "Installation at KF gallery, Seoul", desc: "메타버스 아바타 제작"  },
    { row: 0, folder: "photo01", title: "국군난수체조 - 암호화된 숫자로 구성된 건강한 신체를 위한 체조 비디오", meta: "Mixed media with Single channel video · 2015", count: 3, place: "Performed at 175 gallery, Seoul", desc: "국군 난수체조는 단파라디오로 수집한 난수방송의 숫자를 신체의 움직임으로 변환한 비디오 작업이다. 난수방송의 숫자는 해독 체계를 공유하지 않는 사람에게는 의미 없는 나열이지만, 특정한 수신자에게는 행동을 지시하는 정보가 된다. 수집된 숫자는 무용과 운동의 기호로 변환되고, 다시 국군도수체조의 동작으로 구성된다. 숫자에서 기호로, 기호에서 신체로 옮겨가면서 읽을 수 없었던 정보는 또 다른 방식의 수행 가능한 명령이 된다." },
    { row: 0, folder: "photo02", title: "Stock phase", meta: "Stockdata, CRT, druming machine · 2014", count: 3, desc: "시나 말투, 제스처, 자연과 일상의 모든 곳에는 리듬이 있다. 역사적 현상과 시장가격, 주식가격의 변화 역시 차이와 반복을 통해 리듬을 만들어낸다. Stock Phase는 실시간 주식 데이터를 받아 영상과 사운드를 생성하는 작업이다. 체결 강도와 가격의 움직임은 알고리즘을 거치며 서로 다른 시청각적 리듬으로 변환된다. 숫자로 기록되던 변화가 이미지와 소리로 반복되고 변주될 때, 시장의 움직임은 정보와는 다른 방식으로 감각된다. 나는 그 과정에서 만들어지는 일종의 리듬의 메아리에 관심을 두었다." },
    { row: 0, folder: "photo03", title: "text2eye", meta: "자막 보조용 스마트 글라스 · 2017", count: 3, desc: "실시간 자막이 필요한 사람들을 위한 웨어러블 디바이스 이다. 장애인이나,뮤지션의 해외 공연등 의사 소통이 실시간으로 필요한 경우에 상황에 맞게 반응 하는 자막을 볼수 있어 사람들에게 편리함을 제공해 준다" },
    { row: 0, folder: "photo04", title: "받았지만 쏘았고 쏘았지만 받았으며 받지도 쏘지도 않은것", meta: "두개의 공 쏘는 장치, 타자기 , 1ch 영상  · 2012", count: 4, desc: "공을 던지는 사건에는 분명한 순서가 있다. 던지고, 날아가고, 도착한다. 우리는 이 연속된 움직임을 하나의 인과적인 사건으로 이해하고, 다시 언어의 순서로 옮긴다. 이 작업에서 두 개의 장치는 공을 계속해서 주고받는다. 도착은 다시 다음 발사의 조건이 되고, 결과는 곧 새로운 원인이 된다. 그 사이에 놓인 타자기는 반복되는 움직임을 문장으로 옮기며 사건에 앞과 뒤의 순서를 부여한다. 그러나 왕복이 계속될수록 그 순서는 되감기고 겹쳐진다. 결과는 다음 원인이 되고, 시작과 끝은 반복 안에서 더 이상 같은 위치에 머물지 않는다." },
    { row: 0, folder: "photo05", title: "Who’s afraid of school?", meta: "RPG game · 2012", count: 5, desc: "이 작업은 실제 학교 공간을 게임 엔진 안에 재구성해, 현실 공간과 가상 공간의 중첩을 다뤘다. 학교를 다니지만 그 안에 완전히 정착하지 못한 채 매일 주변을 배회하는 사람들의 상태를 게임의 구조로 만들었다. 캐릭터는 쥐와 싸우고, 유령을 만나고, 주변의 작업들을 평가하며 계속 이동하지만 끝내 레벨업하지 못한다. 학교라는 공간 안에서 반복되는 이동과 평가, 정체된 상태는 가상세계의 캐릭터가 놓인 조건과 겹쳐진다." },
    { row: 0, folder: "photo06", title: "metawork", meta: "Artcenter for education · 2015", count: 2, desc: "" },   
    /* 사진 미정 — img/photo09/image01.jpg … 를 넣고 count 를 장수만큼 올리면 표시됩니다 */
    { row: 0, folder: "photo09", title: "Permeation", meta: "Mixed media · 2012", count: 3, desc: "침투는 일본 대지진 이후의 방사능 누출에서 시작된 작업이다. 방사능은 직접 감각할 수 없지만, 측정되고 숫자로 기록된다. 실시간 방사능 수치는 비규칙적인 시각 패턴으로 변환되고, 프로젝션 매핑을 통해 공간의 여러 표면 위로 확장된다. 하나의 수치에서 시작된 이미지는 특정한 경계를 갖지 않은 채 벽과 구조물, 공간을 따라 계속해서 다른 형태로 나타난다." },
    { row: 0, folder: "photo11", title: "The Emperor's New Clothes", meta: "Mixed media · 2012", count: 7, desc: "카메라 앞을 지나는 사람의 모습은 그대로 재현되지 않는다. 인물의 형태와 표정, 옷과 같은 시각적 정보는 색을 구성하는 수치로 변환되고, 이 데이터는 다시 공간 위에 추상적인 이미지로 매핑된다. 관객은 자신의 모습을 보고 있지만, 화면에는 더 이상 자신을 알아볼 수 있는 이미지가 남아 있지 않는다." },
    { row: 0, folder: "photo10", title: "Just ride it, 5 인터-락트-큐터스(5 Interloc(k)utors) remix", meta: "Mixed media · 2010", count: 4, place: "Performed at 백남준아트센터, Gyeonggi", desc: " Just Ride It은 2010년 백남준아트센터 《랜덤 액세스》에서 Tammy Kim의 〈5 Interloc(k)utors〉에 개입한 작업이다. 원작은 신체의 높이와 시선의 방향을 조정해 권력의 위치를 역전시킨다. Just Ride It은 그 물리적인 역전을 한 단계 더 밀어, 구조물 자체를 올라타고 움직이는 대상으로 바꾼다. 위계를 조정하던 장치는 하나의 탈것이 된다." },
    
   

    { featured: 2, folder: "force", title: "어떤 힘", meta: "Performance installation with choreography, and interactive media, 60 min · 2024", count: 0,
      video: "video/force-web.mp4",        videoHQ: "https://video.metawork.org/force.mp4", poster: "video/force-poster.jpg",
      place: "Performed at 아르코예술극장 소극장, Seoul",
      desc: "어떤 힘은 직접 보이지 않지만 관계와 변화 속에서 드러나는 힘에서 출발한다. 서로 떨어져 있는 대상 사이의 비가시적인 연결과 영향은 사운드, 사물의 움직임, 신체의 반응으로 이어진다. 무대 위의 오브제와 소리는 서로를 움직이고, 무용수는 이미 작동하고 있는 환경 안에서 그 힘을 감지하고 반응한다. 힘은 그 자체로 나타나지 않는다. 대신 진동하고, 이동하고, 흔들리는 것들의 변화 속에서 잠시 모습을 드러낸다." },
    { featured: 4, folder: "adg7", title: "타, 드르닥", meta: "Single-channel video for concert, 12 min. · 2025", count: 0,
      video: "video/ADG7-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
      place: "Performed at 남산국악당, Seoul",
      desc: "PAMS CHOICE 악단광칠 NEXT JOURNEY" },
    /* 영상이 여러 편인 작품 — 편을 추가하려면 videos 배열에 한 줄씩 넣으면 됩니다 */
    { featured: 3, folder: "float", title: "부유생물체의 여러가지 사정" , meta: "Hologram installation for choreography, 60 min · 2025", count: 0,
      videos: [
        { web: "video/float-01-web.mp4", hq: "https://video.metawork.org/float-01.mp4" },
        { web: "video/float-02-web.mp4", hq: "https://video.metawork.org/float-02.mp4" },
        { web: "video/float-03-web.mp4", hq: "https://video.metawork.org/float-03.mp4" },
        { web: "video/float-04-web.mp4", hq: "https://video.metawork.org/float-04.mp4" },
        { web: "video/float-05-web.mp4", hq: "https://video.metawork.org/float-05.mp4" },
        { web: "video/float-06-web.mp4", hq: "https://video.metawork.org/float-06.mp4" }
      ],
      poster: "video/float-poster.jpg",
      place: "Performed at 아르코예술극장 대극장, Seoul",
      desc: "멜랑콜리 컴퍼니 - 테스트드라이브 작품 내 홀로그램 프로젝트, 유기적 움직임 실험" },
    // { folder: "arko", title: "내일의 이웃", meta: " AR Interactive performance with choreography, Unreal · 2022", count: 0,
    //   video: "video/arko-web.mp4",         videoHQ: "https://video.metawork.org/arko.mp4", poster: "video/arko-poster.jpg",
    //   desc: " 연기자의 시야를 몸 바깥에 부착시켜 새로운 감각을 느낄 수 있게 한다 <br> 외부 센서와 Unreal 엔진으로 제작 <br>  Performed at 국립아시아문화전당, Gwang-ju"},
    { folder: "kf", title: "KF 창립 30주년 기념 특별전 [이음]", meta: "Metaverse project in VRCHAT · 2021", count: 1,
      video: "video/KF-web.mp4",           videoHQ: "https://video.metawork.org/KF.mp4", poster: "video/KF-poster.jpg",
      place: "Installation at KF gallery, Seoul",
      desc: "지난 30년간의 한국국제교류재단의 히스토리를 아카이빙함과 동시에 미래 비전을 만나볼 수 있는 전시로, 실제 전시의 공간을 메타버스 공간으로 제작하였습니다 <br> https://www.youtube.com/watch?v=LmrBQT2jwYQ" },
    //{ folder: "horsehead", title: "말의 머리" , meta: "Metaverse project in Roblox · 2021", count: 0,
    //  video: "video/horsehead-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
    //  desc: "Performed at Roblox" },
    // { folder: "church", title: "I'm the church" , meta: "VR project for theater performance · 2021", count: 0,
      // video: "video/church-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
      // desc: "VR을 사용한 현실과 혼합된 새로운 방식의 연극, 변방연극제 Performed at TINC, Seoul" },
    { folder: "room", title: "내 방 - 방구석대모험", meta: "Metaverse project in VRchat · 2021", count: 0,
      video: "video/room-web.mp4",         videoHQ: "https://video.metawork.org/room.mp4", poster: "video/room-poster.jpg",
      place: "Performed at VRchat",
      desc: "arte 한국문화예술교육진흥원 비대면 VR 교육프로그램" },
    /* 영상을 바꿀 때는 파일명도 바꾼다 — 이름이 같으면 브라우저가 예전 것을 계속 보여준다.
       (사진과 달리 영상에는 ?v= 캐시 무력화를 걸지 않는다. 용량이 커서) */
    { folder: "little2", title: "A Small Satisfaction", meta: "Mixed media with 2 channel video · 2015", count: 0,
      video: "video/little2-web.mp4",      videoHQ: "https://video.metawork.org/little2.mp4", poster: "video/little2-poster.jpg",
      desc: "〈작은 만족〉은 실시간 주식 데이터를 이용한 〈Stock Phase〉에서 이어진 작업이다. 시장의 체결강도를 중심으로 설정된 특정 조건이 충족되면, 네 종류의 동물 사냥 장면이 드럼 사운드와 함께 재생된다.각 장면은 정방향과 역방향을 반복하며 포식자가 먹이를 쫓고 포획하는 순간을 계속해서 되돌린다. 사냥은 완결되지 않고, 획득과 철회가 짧은 주기로 반복된다. 영상의 자막은 작은 가격 변동에서 반복적으로 수익을 취하는 거래 방식인 ‘스캘핑(scalping)’이라는 말의 유래를 따라간다. 시장의 수치는 가격을 설명하는 정보에서 벗어나 사냥 장면을 작동시키는 신호가 된다. 순간적인 차이를 포착하고 곧 다시 다음 기회를 기다리는 움직임은, 잡고 놓치고 다시 쫓는 이미지의 반복과 겹쳐진다." },
    { folder: "stock-march", title: "Stock march", meta: "Mixed media with 2 channel video · 2011", count: 1,
      video: "video/stock-march-web.mp4?v=20260809", videoHQ: "https://video.metawork.org/stock-march.mp4?v=20260809", poster: "video/stock-march-poster.jpg",
      desc: "Stock March는 연평도 사건 당시, 사회적 긴장과는 반대로 상승하던 국방 관련 주식의 움직임에서 시작되었다. 코스피 지수, 국방 관련 종목, 그리고 직접 보유하고 있던 주식의 가격 변화를 데이터로 받아 사운드로 변환했다. 수치의 변화는 일정한 규칙과 확률적 변형을 거치며 예측하기 어려운 음의 흐름을 만들어낸다. 생성된 사운드는 다시 악보의 형태로 옮겨진다. 시장의 움직임은 숫자에서 소리로, 다시 기호로 번역된다." },
    { folder: "kuku", title: "오프닝 시퀀스", meta: "Mixed media with Single channel video · 2014", count: 0,
      video: "video/kuku-web.mp4",  videoHQ: "https://video.metawork.org/kuku.mp4", poster: "video/kuku-poster.jpg",
      desc: "이철헤어커커 - 트리코드 아카데미 오프닝" },
    { folder: "aia", title: "Mother's first song", meta: "Mixed media for commercial video · 2015", count: 0,
      video: "video/aia-web.mp4",  videoHQ: "https://video.metawork.org/aia.mp4", poster: "video/aia-poster.jpg",
      desc: "AIA생명-슈퍼스타K7 캠페인" },
  

    { row: 0, folder: "photo07", title: "국민대 2023 인공지능 미래탐색 VR/AR분야" , meta: "VR/AR분야 진로교육ㆍ체험특강 · 2023", count: 1, desc: "국민대학교는 2023년 성북구청과 함께 관내 중학생들을 대상으로 '2023 인공지능 미래탐색' 진로교육을 진행" },       
    { row: 0, folder: "photo08", title: "큐리오바이트", meta: "STEAM education · 2016-2019", count: 7, desc: "" },


    /* 전광판 작품 — type:"sign" 이면 영상 대신 세그먼트 디스플레이가 들어갑니다.
       phrases / phrasesSub 는 각각 윗줄·아랫줄 문구.
       표시 가능 문자: A-Z, 0-9, 공백, - / (한글 불가) */

  ];

  /* 사진 목록 — img/manifest.json 이 있으면 그걸 따른다.
     이 파일은 make-manifest.ps1 이 img/ 폴더를 훑어 만들고,
     배포할 때 자동으로 갱신된다. 그래서 사진을 폴더에 넣기만 하면 화면에 나오고,
     아래 count 를 손으로 고치지 않아도 된다.
     목록 파일이 없으면(예: 갓 클론한 저장소) 예전처럼 count 를 쓴다. */
  let MANIFEST = null;
  try {
    const res = await fetch(bust("img/manifest.json"), { cache: "no-cache" });
    if (res.ok) MANIFEST = await res.json();
  } catch (e) {
    /* 목록 파일이 없거나 읽지 못하면 count 방식으로 넘어간다 */
  }

  /* 목록 파일은 두 가지 모양이 있다.
     v2 = { v:2, folders:{...}, tone:{...} }   — 톤 값 포함 (지금)
     예전 = { photo01: [...], ... }             — 목록만 */
  const MF_FOLDERS = (MANIFEST && MANIFEST.folders) || MANIFEST || null;
  const MF_TONE = (MANIFEST && MANIFEST.tone) || null;

  /* ── WORK 그리드 배열 순서 ────────────────────────────────
     "tone"   = 어두운 것부터 밝은 것으로. 멀리서 보면 검정→흰색 그라데이션이
                되고, 그 안에서 색이 천천히 돈다. (톤 값은 목록 파일에 들어 있다)
     "random" = 새로고침할 때마다 뒤섞인다 (예전 방식)
     톤 값이 없으면 자동으로 random 으로 넘어간다. */
  const GALLERY_ORDER = "tone";

  /* 명도를 몇 단으로 나눌지. 이 숫자 하나가 "얼마나 의도적으로 보일지"를 정한다.
     크게 → 매끈한 그라데이션(색상표에 가까움) / 작게 → 느슨하고 자연스러움 */
  const TONE_BANDS = 6;

  function shuffle(a) {
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      const t = a[k]; a[k] = a[j]; a[j] = t;
    }
    return a;
  }

  /* 톤 순서로 다시 늘어놓는다 (items 를 제자리에서 바꾼다).

     명도로 먼저 밴드를 나누고, 밴드 안에서 색상으로 정렬한다.
     명도와 색상을 하나의 점수로 합치지 않는 이유: 색상은 0도와 359도가 같은
     빨강인 '원형' 값이라, 선형으로 더하면 비슷한 빨강 둘이 정반대 끝으로 간다.
     밴드 안에서만 쓰면 그 문제가 사라진다.

     색이 흐릿한 사진(설치 기록·도면·흰 제품컷)은 평균 색상이 잡음이므로
     색상 정렬에서 빼고 밴드 안에서 명도로만 둔다. */
  function toneOrder(items) {
    const tone = (it) => MF_TONE[it.src] || null;
    const withTone = items.filter(tone);
    const without = items.filter((it) => !tone(it));
    if (withTone.length < 2) return;

    let lo = Infinity, hi = -Infinity;
    for (const it of withTone) {
      const L = tone(it)[0];
      if (L < lo) lo = L;
      if (L > hi) hi = L;
    }
    const span = hi - lo || 1;

    const bands = Array.from({ length: TONE_BANDS }, () => []);
    for (const it of withTone) {
      const t = (tone(it)[0] - lo) / span;
      bands[Math.min(TONE_BANDS - 1, Math.floor(t * TONE_BANDS))].push(it);
    }

    const out = [];
    for (const band of bands) {
      band.sort((a, b) => {
        const ta = tone(a), tb = tone(b);
        // 색이라 할 만한 게 없는 것은 뒤로 빼고 명도로만
        const na = ta[3] < 0.35, nb = tb[3] < 0.35;
        if (na !== nb) return na ? 1 : -1;
        if (na) return ta[0] - tb[0];
        // 파랑 근처에서 시작해 한 바퀴 — 어두운 쪽이 대체로 푸른 계열이라
        return ((ta[1] - 200 + 360) % 360) - ((tb[1] - 200 + 360) % 360);
      });
      spreadSameWork(band);
      out.push(...band);
    }

    // 톤을 모르는 것(목록에 없는 사진)은 맨 뒤에
    items.length = 0;
    items.push(...out, ...without);
  }

  /* 같은 작품 사진이 나란히 붙는 것만 떼어놓는다.
     어두운 쪽에 한 작업의 기록사진이 몰려 있어 첫 줄이 그 작업만으로 채워지는 걸 막는다.
     순서를 크게 흔들지 않도록, 뒤쪽에서 가장 가까운 다른 작품과만 자리를 바꾼다. */
  function spreadSameWork(list) {
    for (let k = 1; k < list.length; k++) {
      if (list[k].i !== list[k - 1].i) continue;
      for (let j = k + 1; j < list.length; j++) {
        if (list[j].i !== list[k - 1].i) {
          const t = list[k]; list[k] = list[j]; list[j] = t;
          break;
        }
      }
    }
  }

  // 폴더 → 실제 경로 배열 (img/photo01/image01.jpg …)
  WORKS.forEach((w) => {
    const ext = w.ext || "jpg";
    const listed = MF_FOLDERS && MF_FOLDERS[w.folder];
    w.images = listed
      ? listed.map((f) => "img/" + w.folder + "/" + f)
      : Array.from({ length: w.count || 0 }, (_, i) =>
          "img/" + w.folder + "/image" + String(i + 1).padStart(2, "0") + "." + ext
        );
    // 라이트박스에서 넘겨볼 슬라이드 — 영상이 있으면 맨 앞
    // videos 배열이 있으면 여러 편, 없으면 기존 video/videoHQ 를 1편으로 취급
    const vids = w.videos || (w.video ? [{ web: w.video, hq: w.videoHQ }] : []);
    w.video = vids[0] ? vids[0].web : "";        // 카드·작품화면에 쓸 대표 영상
    w.slides = [
      ...vids.map((v) => ({ type: "video", src: v.hq || v.web, poster: w.poster || "" })),
      ...w.images.map((src) => ({ type: "image", src }))
    ];
  });

  /* ----------------------------------------------------------
     작품 페이지 — 한 작품당 한 화면씩 생성
     ---------------------------------------------------------- */
  const workPages = document.getElementById("workPages");

  if (workPages) {
    /* 선형으로 펼치는 건 featured 를 적어 둔 작품뿐이다 (RECENT WORKS).
       나머지는 WORK 그리드와 디테일 샷이 맡는다.
       작품 화면에는 글이 없어서(캡션은 .wp-meta 로 감춰 둠) 전부 펼치면
       그리드가 이미 보여준 대표 이미지를 25화면에 걸쳐 반복하는 셈이 된다.

       featured 값은 곧 펼쳐지는 순서다. 순서를 바꾸려면 숫자만 바꾸면 되고
       WORKS 배열 자체를 옮길 필요가 없다. */
    const featuredWorks = WORKS
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => w.featured)
      .sort((a, b) => a.w.featured - b.w.featured);

    featuredWorks.forEach(({ w, i }) => {

      const sec = document.createElement("section");
      sec.className = "section workpage snap";
      sec.id = "work" + String(i + 1).padStart(2, "0");
      // 일부만 펼치므로 화면 순서와 WORKS 번호가 어긋난다. 번호를 새겨 둔다.
      sec.dataset.index = i;

      const cover = w.video || w.poster || w.images[0];
      let media;
      if (w.type === "sign") {
        const line = (arr, cls) =>
          '<div class="flipline' + cls + '" data-cells="20" data-phrases="' +
          arr.join(" | ") + '" aria-hidden="true"></div>';
        media = '<div class="flipband">' +
                line(w.phrases || [], '" data-role="main') +
                line(w.phrasesSub || [], " flipline--sub") +
                '<p class="sr-only" id="flipText" aria-live="polite"></p></div>';
      } else if (w.video) {
        media = '<video src="' + w.video + '"' +
                (w.poster ? ' poster="' + bust(w.poster) + '"' : "") +
                ' muted loop playsinline preload="none"></video>';
      } else if (cover) {
        media = '<img src="' + bust(cover) + '" alt="' + w.title + '" loading="lazy">';
      } else {
        media = '<div class="ph"><span class="ph-mark">✳</span>' +
                '<span class="ph-text">IMAGE<br>대표 사진 자리</span></div>';
      }

      // 가로 비율 — 기본 16:9, 작품별로 ratio: "4/3" 지정 가능
      const ratio = w.ratio || "16/9";
      const [rw, rh] = ratio.split("/").map(Number);
      sec.style.setProperty("--ratio", rw + " / " + rh);
      sec.style.setProperty("--rw", String(rw / rh));

      sec.innerHTML =
        '<div class="wp-inner">' +
          '<div class="wp-media' + (w.type === "sign" ? ' wp-media--sign' : '') + '">' + media + "</div>" +
          /* 지금은 CSS 로 감춰 두었다 (.wp-meta { display:none }).
             같은 내용을 디테일 샷에서 보여 주므로 양식도 같게 유지한다. */
          '<div class="wp-meta">' +
            '<h3 class="wp-title">' + w.title + "</h3>" +
            '<p class="wp-info">' + w.meta + "</p>" +
            '<p class="wp-place">' + (w.place || "") + "</p>" +
            '<p class="wp-desc">' + (w.desc ||
              "여기에 작품 설명을 적어주세요. 무엇을 담고 싶었는지, 어떤 재료와 과정을 거쳤는지.") +
            "</p>" +
          "</div>" +
        "</div>";

      workPages.appendChild(sec);
    });
  }

  /* 작품 구간에 들어오면 배경을 완전한 검정으로 전환 (작품에 집중되게) */
  const darkSections = document.querySelectorAll(".workpage");

  if (darkSections.length) {
    const visible = new Set();
    const darkObserver = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) visible.add(en.target);
        else visible.delete(en.target);
      }
      document.body.classList.toggle("works-dark", visible.size > 0);
    }, { threshold: 0.35 });
    darkSections.forEach((s) => darkObserver.observe(s));
  }

  // 화면에 들어온 작품 페이지의 영상만 재생
  const pageVideos = workPages
    ? [...workPages.querySelectorAll("video")]
    : [];

  if (pageVideos.length && !reducedMotion) {
    const vObserver = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const v = en.target;
        if (en.isIntersecting) v.play().catch(() => {});
        else v.pause();
      }
    }, { threshold: 0.35 });
    pageVideos.forEach((v) => vObserver.observe(v));
  }

  const orbit = document.getElementById("orbit");

  const photoGrid = document.getElementById("photoGrid");
  const useOrbit = GALLERY_MODE === "orbit";

  // 쓰지 않는 쪽은 화면에서 완전히 뺀다 (자리만 차지하지 않도록)
  if (orbit) orbit.hidden = !useOrbit;
  if (photoGrid) photoGrid.hidden = useOrbit;

  if (orbit) {
    // 카드 생성 — 영상이 있으면 무음 루프, 없으면 사진, 둘 다 없으면 플레이스홀더
    const cards = !useOrbit ? [] : WORKS.map((w, i) => {
      const fig = document.createElement("figure");
      fig.className = "orbit-card";
      fig.dataset.index = i;
      const cover = w.images[0];
      let inner;
      if (w.video) {
        inner =
          '<div class="ph"><video src="' + w.video + '"' +
          (w.poster ? ' poster="' + bust(w.poster) + '"' : "") +
          ' muted loop playsinline preload="none"></video>' +
          '<span class="ph-badge">VIDEO</span></div>';
      } else if (w.type === "sign" || cover) {
        // 궤도 카드는 3D 변형된 위치라 브라우저가 "화면 안"을 제대로 판정하지 못한다.
        // loading="lazy" 를 쓰면 화면에 있어도 로드되지 않으므로 즉시 로드시킨다.
        inner = '<div class="ph"><img src="' + bust(w.poster || cover) + '" alt="' + w.title +
                '" decoding="async"></div>';
      } else {
        inner = '<div class="ph"><span class="ph-mark">✳</span>' +
                '<span class="ph-text">IMAGE<br>대표 사진 자리</span></div>';
      }
      fig.innerHTML = inner;
      // 제목은 아래 캡션 대신, 마우스 올렸을 때 화면 위에 겹쳐 보여준다
      const ov = document.createElement("div");
      ov.className = "card-hover";
      ov.innerHTML = "<span>" + w.title + "</span>";
      fig.querySelector(".ph").appendChild(ov);
      orbit.appendChild(fig);
      return fig;
    });

    // 앞쪽으로 돌아온 카드만 재생 — 뒤로 가면 정지(성능/데이터 절약)
    const cardVideos = cards.map((c) => c.querySelector("video"));

    /* 마우스오버 배경 — 작품에 올리면 그 사진이 뒤에 크게 깔린다.
       (팝업 열기 전 미리보기. 데스크톱 전용) 두 방식이 함께 쓴다. */
    const hoverBg = document.getElementById("galleryBg");
    let bgTimer = null;

    function showBg(i) {
      if (!hoverBg) return;
      const src = WORKS[i].images[0] || WORKS[i].poster;
      if (!src) return;
      clearTimeout(bgTimer);
      hoverBg.style.backgroundImage = 'url("' + bust(src) + '")';
      hoverBg.classList.add("show");
    }
    function hideBg() {
      if (!hoverBg) return;
      clearTimeout(bgTimer);
      // 사이를 지나갈 때 깜빡이지 않도록 살짝 지연
      bgTimer = setTimeout(() => hoverBg.classList.remove("show"), 90);
    }

    // 드래그 끝의 클릭을 무시하기 위한 이동량 (구 방식에서만 늘어난다)
    let movedPx = 0;

    /* ── 여기부터 구(orbit) 방식 전용 ───────────────────────── */
    if (useOrbit) {

    let rot = 0;
    let R = 0;
    let dragging = false;
    let hovering = false;
    let startX = 0, startRot = 0;

    /* 2줄 궤도 — 윗줄(사진)과 아랫줄(영상)이 서로 반대로 돈다.
       각 작품의 row 값으로 줄을 나눈다 (0 = 윗줄, 그 외/생략 = 아랫줄) */
    const ROW_META = [
      { dir: -1, rScale: 0.82, yMul: -1 },   // 윗줄 — 반대 방향, 약간 안쪽
      { dir:  1, rScale: 1.00, yMul:  1 }    // 아랫줄
    ];

    // 카드별로 소속 줄과 그 줄에서의 순번을 미리 계산
    const rowCount = [0, 0];
    const slot = WORKS.map((w) => {
      const r = w.row === 0 ? 0 : 1;
      return { row: r, idx: rowCount[r]++ };
    });

    let rowGap = 0;

    function orbitLayout() {
      const cw = cards[0]?.getBoundingClientRect().width  || 125;
      const ch = cards[0]?.getBoundingClientRect().height || 100;
      /* 카드가 좌우로 도는 폭을 위 구분선과 같게 맞춘다.
         (반지름을 고정값으로 두면 선보다 한참 좁아 정렬이 어긋나 보인다)
         바깥줄(rScale 1.0) 카드의 바깥 끝이 컨테이너 끝에 닿는 값 */
      R = Math.max(120, (orbit.clientWidth - cw) / 2);
      rowGap = ch * 0.62;
    }

    function orbitFrame() {
      if (!dragging && !hovering && !reducedMotion) rot += 0.14;

      for (let i = 0; i < cards.length; i++) {
        const st = slot[i];
        const meta = ROW_META[st.row];
        const n = Math.max(1, rowCount[st.row]);
        const a = ((rot * meta.dir + (st.idx * 360) / n) * Math.PI) / 180;
        const rr = R * meta.rScale;
        const x = Math.sin(a) * rr;
        const z = Math.cos(a) * rr;
        const y = meta.yMul * rowGap;
        const depth = (z / rr + 1) / 2;          // 0(뒤) ~ 1(앞)

        const c = cards[i];
        c.style.transform =
          `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`;
        c.style.opacity = 0.22 + 0.78 * depth;
        c.style.zIndex = String(100 + Math.round(z));

        const v = cardVideos[i];
        if (v && !reducedMotion) {
          const shouldPlay = depth > 0.55;
          if (shouldPlay && v.paused) v.play().catch(() => {});
          else if (!shouldPlay && !v.paused) v.pause();
        }
      }
      requestAnimationFrame(orbitFrame);
    }

    // 드래그 회전
    orbit.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      startRot = rot;
      movedPx = 0;
      orbit.classList.add("dragging");
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      movedPx = Math.max(movedPx, Math.abs(dx));
      rot = startRot + dx * 0.35;
    });
    window.addEventListener("pointerup", () => {
      dragging = false;
      orbit.classList.remove("dragging");
    });

    // 데스크톱에서 카드에 올리면 자동 회전 일시정지
    // (배경 미리보기는 WORK 에서 쓰지 않는다 — 작품 페이지에서만)
    if (!isTouch) {
      cards.forEach((c) => {
        c.addEventListener("mouseenter", () => { hovering = true; });
        c.addEventListener("mouseleave", () => { hovering = false; });
      });
    }

    orbitLayout();
    window.addEventListener("resize", orbitLayout);
    requestAnimationFrame(orbitFrame);

    }
    /* ── 구(orbit) 방식 전용 끝 ─────────────────────────────── */

    /* ── 사진 그리드 방식 ────────────────────────────────────
       모든 작품의 모든 사진을 한 판에 무작위 순서로 늘어놓는다.
       높이는 전부 같게 맞추고 가로폭만 사진의 원래 비율을 따르며,
       사이 간격은 일정하다. 누르면 해당 작품 페이지로 넘어간다. */
    if (!useOrbit && photoGrid) {
      const items = [];
      WORKS.forEach((w, i) => {
        if (w.images.length) w.images.forEach((src) => items.push({ i, src }));
        else if (w.poster) items.push({ i, src: w.poster });  // 영상 작업은 포스터 한 장으로
      });

      shuffle(items);
      if (GALLERY_ORDER === "tone" && MF_TONE) toneOrder(items);

      /* 사진 비율은 파일이 로드돼야 알 수 있다.
         목록 파일에 비율이 적혀 있으면 그걸 먼저 쓰고(레이아웃이 안 흔들린다),
         없으면 가로 사진으로 가정했다가 로드될 때 실제 값으로 고친다. */
      const ratios = items.map((it) => {
        const t = MF_TONE && MF_TONE[it.src];
        return t && t[4] ? t[4] : 1.4;
      });

      items.forEach((it, k) => {
        const w = WORKS[it.i];
        const fig = document.createElement("figure");
        fig.className = "pg-item";
        fig.dataset.index = it.i;
        /* 키보드로도 열려야 한다. 지금까지 그리드·작품 화면이 전부
           click 만 받는 비포커스 요소라, 탭으로 작품에 닿을 수 없었다. */
        fig.tabIndex = 0;
        fig.setAttribute("role", "button");
        fig.setAttribute("aria-label", w.title);
        fig.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); lbOpen(it.i); }
        });
        fig.style.setProperty("--r", ratios[k].toFixed(4));
        fig.innerHTML =
          '<img src="' + bust(it.src) + '" alt="' + w.title + '"' +
          // 앞쪽 12장(첫 두 줄)만 즉시, 나머지는 화면에 들어올 때
          (k < 12 ? '' : ' loading="lazy"') + ' decoding="async">' +
          '<figcaption>' + w.title + "</figcaption>";
        const img = fig.querySelector("img");
        img.addEventListener("load", () => {
          if (!img.naturalHeight) return;
          ratios[k] = img.naturalWidth / img.naturalHeight;
          fig.style.setProperty("--r", ratios[k].toFixed(4));
          scheduleFit();
        });
        photoGrid.appendChild(fig);
        cards.push(fig);
      });

      // 이 타일 높이로 줄바꿈하면 전체가 몇 픽셀이 되는지 (실제 배치와 같은 규칙)
      function packedHeight(h, availW, gap) {
        let rows = 1, x = 0;
        for (const r of ratios) {
          const w = Math.min(availW, Math.max(24, r * h));
          if (x === 0) x = w;
          else if (x + gap + w <= availW) x += gap + w;
          else { rows++; x = w; }
        }
        return rows * h + (rows - 1) * gap;
      }

      /* 사진이 너무 작아지면 인덱스가 아니라 먼지처럼 보인다.
         이 크기보다 작아져야 한 화면에 들어가는 상황이면,
         억지로 줄이는 대신 갤러리를 스크롤되게 둔다. */
      const MIN_TILE = 130;
      const sec = photoGrid.closest(".section-gallery");

      /* 한 화면 안에 전부 들어오는 가장 큰 타일 높이를 이분 탐색으로 찾는다.
         사진 수가 늘거나 창 크기가 바뀌어도 알아서 맞춰진다. */
      function fitGrid() {
        // 재는 동안에는 항상 '한 화면' 상태로 되돌린다.
        // (늘어난 상태에서 재면 결과가 그 높이에 영향을 받아 요동친다)
        if (sec) sec.classList.remove("pg-scroll");

        const availW = photoGrid.clientWidth;
        const availH = photoGrid.clientHeight;
        if (!availW || !availH || !ratios.length) return;
        const gap = parseFloat(getComputedStyle(photoGrid).columnGap) || 10;

        let lo = 36, hi = 280, best = 36;
        for (let s = 0; s < 24; s++) {
          const h = (lo + hi) / 2;
          if (packedHeight(h, availW, gap) <= availH) { best = h; lo = h; }
          else hi = h;
        }

        if (best >= MIN_TILE) {
          photoGrid.style.setProperty("--pg-h", Math.floor(best) + "px");
        } else {
          photoGrid.style.removeProperty("--pg-h");   // CSS 기본 크기로
          if (sec) sec.classList.add("pg-scroll");
        }
      }

      let fitPending = false;
      function scheduleFit() {
        if (fitPending) return;
        fitPending = true;
        requestAnimationFrame(() => { fitPending = false; fitGrid(); });
      }

      fitGrid();
      window.addEventListener("resize", scheduleFit);

      /* 배경 미리보기는 WORK 갤러리에서는 쓰지 않는다.
         사진이 빽빽해 지나다닐 때마다 뒷배경이 계속 바뀌어 어수선했다.
         같은 연출을 작품 페이지에서만 쓴다 (아래 workPages 쪽). */
    }

    /* --------------------------------------------------------
       라이트박스
       -------------------------------------------------------- */
    const lightbox = document.getElementById("lightbox");
    const lbSlide = document.getElementById("lbSlide");
    const lbTitle = document.getElementById("lbTitle");
    const lbCounter = document.getElementById("lbCounter");
    const lbBody = document.querySelector(".lb-body");
    let lbWork = 0, lbIdx = 0;
    let lbScrollY = 0;   // 팝업 열기 직전 스크롤 위치

    /* 캡션 폭 고정 —
       캡션이 지금 보고 있는 사진의 폭을 따라가면, 가로 사진에서 세로 사진으로
       넘길 때마다 글의 줄바꿈이 다시 잡혀 읽던 자리를 놓친다.
       그래서 그 작품의 '첫 장' 폭을 열 때 한 번 재서 붙들어 둔다.
       뒤 사진이 더 좁아도(세로) 캡션은 그대로, 사진만 가운데에서 줄어든다. */
    let lbFirstRatio = 0;   // 첫 장의 가로/세로 비율

    function lbApplyWidth() {
      if (!lbBody) return;
      if (!lbFirstRatio) { lbBody.style.removeProperty("--lb-w"); return; }
      // CSS 의 max-height:68svh · max-width:88vw 와 같은 제한을 그대로 계산한다
      const w = Math.min(window.innerWidth * 0.88, window.innerHeight * 0.68 * lbFirstRatio);
      lbBody.style.setProperty("--lb-w", Math.round(w) + "px");
    }

    /* 첫 장이 로드되면 그 비율을 기억한다. 로드 전에는 폭을 풀어 두어
       예전처럼 사진을 따라가게 두고, 로드되는 즉시 고정된다. */
    function lbMeasureFirst() {
      lbFirstRatio = 0;
      lbApplyWidth();
      const el = lbSlide.querySelector("img, video");
      if (!el) return;
      const read = () => {
        const w = el.naturalWidth || el.videoWidth;
        const h = el.naturalHeight || el.videoHeight;
        if (w && h) { lbFirstRatio = w / h; lbApplyWidth(); }
      };
      if (el.tagName === "IMG") {
        if (el.complete && el.naturalWidth) read();
        else el.addEventListener("load", read, { once: true });
      } else {
        if (el.videoWidth) read();
        else el.addEventListener("loadedmetadata", read, { once: true });
      }
    }

    function lbRender() {
      const w = WORKS[lbWork];
      const slide = w.slides[lbIdx];
      if (!slide) {
        lbSlide.innerHTML =
          '<div class="ph"><span class="ph-mark">✳</span>' +
          '<span class="ph-text">IMAGE ' + (lbIdx + 1) + "<br>사진 자리</span></div>";
      } else if (slide.type === "video") {
        lbSlide.innerHTML =
          '<video src="' + slide.src + '"' +
          (slide.poster ? ' poster="' + bust(slide.poster) + '"' : "") +
          ' controls autoplay loop playsinline preload="metadata"></video>';
      } else {
        lbSlide.innerHTML = '<img src="' + bust(slide.src) + '" alt="' + w.title + '">';
      }
      /* 작품 화면에는 글을 두지 않고, 디테일 샷을 열었을 때 여기서 보여 준다.
         제목 · 재료/연도 · 설명 순서. (desc 는 <br> 을 쓰므로 innerHTML) */
      lbTitle.textContent = w.title;
      lbCounter.textContent = (lbIdx + 1) + " / " + Math.max(1, w.slides.length);
      const lbMeta = document.getElementById("lbMeta");
      if (lbMeta) lbMeta.textContent = w.meta || "";
      const lbPlace = document.getElementById("lbPlace");
      if (lbPlace) lbPlace.textContent = w.place || "";
      const lbDesc = document.getElementById("lbDesc");
      if (lbDesc) lbDesc.innerHTML = w.desc || "";
    }

    function lbOpen(i) {
      lbWork = i;
      lbIdx = 0;
      if (hoverBg) hoverBg.classList.remove("show"); // 팝업 열리면 배경 미리보기 끔
      lbRender();
      lbMeasureFirst();   // 캡션 폭은 이 작품의 첫 장 기준으로 붙들어 둔다
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      /* body 에 걸면 안 먹는다 — html 에 overflow-x: hidden 이 있어
         body → 뷰포트로 넘어가는 overflow 전파가 끊겨 있다.
         잠그기 전 위치를 기억했다가 닫을 때 되돌린다. */
      lbScrollY = window.scrollY;
      document.documentElement.style.overflow = "hidden";
    }

    function lbClose() {
      lbSlide.innerHTML = "";   // 재생 중이던 영상·소리를 확실히 정지
      lbFirstRatio = 0;
      lbApplyWidth();           // 다음에 열 작품이 폭을 새로 정하도록 되돌린다
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.documentElement.style.overflow = "";
      window.scrollTo(0, lbScrollY);
    }

    function lbStep(dir) {
      const len = WORKS[lbWork].slides.length;
      if (len < 2) return;
      lbIdx = (lbIdx + dir + len) % len;
      lbRender();
    }

    /* 전광판(type:"sign")은 넘겨볼 사진이 없다 — 세그먼트 디스플레이 자체가 작품이라
       팝업을 띄우면 빈 화면이 뜬다. 그래서 그 작품 화면으로 보낸다.
       (RECENT WORKS 에 펼쳐져 있으므로 갈 곳이 있다) */
    function openWork(i) {
      const w = WORKS[i];
      const noSlides = w.type === "sign" || !w.slides || w.slides.length === 0;
      if (noSlides) {
        const page = document.getElementById("work" + String(i + 1).padStart(2, "0"));
        if (page) { page.scrollIntoView({ behavior: "instant", block: "start" }); return; }
      }
      lbOpen(i);
    }

    /* 갤러리는 인덱스 역할 — 누르면 디테일 샷을 연다.
       예전에는 해당 작품 화면으로 스크롤했는데, 지금은 featured 6점만 펼쳐
       어떤 작품은 이동하고 어떤 작품은 팝업이 뜨는 식으로 갈렸다.
       팝업에 사진 전부와 글이 다 있으므로 전부 팝업으로 통일한다.
       그리드에서는 한 작품에 사진이 여러 장이므로 순번이 아니라
       타일에 적어 둔 작품 번호(dataset.index)를 따라간다. */
    cards.forEach((c) => {
      c.addEventListener("click", () => {
        if (movedPx > 8) return; // 드래그였다면 클릭 무시
        openWork(Number(c.dataset.index));
      });
    });

    // 작품 페이지에서 사진·버튼을 누르면 라이트박스로 전체 장수 보기
    if (workPages) {
      [...workPages.children].forEach((sec) => {
        // 화면 순서가 아니라 새겨 둔 WORKS 번호를 쓴다 (일부만 펼치므로)
        const i = Number(sec.dataset.index);
        const open = () => openWork(i);
        const media = sec.querySelector(".wp-media");
        // 전광판 화면 자신은 누를 것이 없다 — 이미 그 작품을 보고 있다
        const isSign = WORKS[i].type === "sign";
        if (media && !isSign) {
          media.addEventListener("click", open);
          media.tabIndex = 0;
          media.setAttribute("role", "button");
          media.setAttribute("aria-label", WORKS[i].title + " 자세히 보기");
          media.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
          });
        }
        sec.querySelector(".wp-open")?.addEventListener("click", open);

        /* 갤러리와 같은 연출 — 작품에 올리면 그 사진이 뒤에 크게 깔린다.
           .gallery-bg 는 position:fixed 라 갤러리 밖에서도 그대로 쓸 수 있다. */
        if (!isTouch && media) {
          media.addEventListener("mouseenter", () => showBg(i));
          media.addEventListener("mouseleave", hideBg);
        }
      });
    }

    document.getElementById("lbClose").addEventListener("click", lbClose);
    document.getElementById("lbPrev").addEventListener("click", () => lbStep(-1));
    document.getElementById("lbNext").addEventListener("click", () => lbStep(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) lbClose();
    });
    // 창 크기가 바뀌면 고정해 둔 폭도 같은 비율로 다시 잡는다
    window.addEventListener("resize", () => {
      if (lightbox.classList.contains("open")) lbApplyWidth();
    });
    window.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") lbClose();
      if (e.key === "ArrowLeft") lbStep(-1);
      if (e.key === "ArrowRight") lbStep(1);
    });
  }

  /* ----------------------------------------------------------
     플립플랩 세그먼트 디스플레이 (14세그먼트 + 스플릿플랩)
     ★ 문구는 index.html의 data-phrases 속성에서 수정합니다.
       <div class="flipline" data-cells="20" data-phrases="A | B | C"></div>
     ---------------------------------------------------------- */
  const flipLinesEls = document.querySelectorAll(".flipline");

  if (flipLinesEls.length) {
    const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const FLIP_MS = 42;     // 한 칸 넘어가는 속도(ms)
    const HOLD_MS = 2800;   // 문장 완성 후 유지 시간(ms)
    const STAGGER = 45;     // 칸마다 출발 지연(ms)

    // 14세그먼트 좌표 (viewBox 24x40)
    const SEG_ORDER = ["A","B","C","D","E","F","G","N","H","I","J","K","L","M"];
    const SEG_COORD = {
      A: [4.5, 2.5, 19.5, 2.5],   B: [21.5, 4.5, 21.5, 18],
      C: [21.5, 22, 21.5, 35.5],  D: [4.5, 37.5, 19.5, 37.5],
      E: [2.5, 22, 2.5, 35.5],    F: [2.5, 4.5, 2.5, 18],
      G: [4, 20, 10.8, 20],       N: [13.2, 20, 20, 20],
      H: [4.5, 4.5, 10, 17],      I: [12, 5, 12, 17.5],
      J: [19.5, 4.5, 14, 17],     K: [14, 23, 19.5, 35.5],
      L: [12, 22.5, 12, 35],      M: [10, 23, 4.5, 35.5]
    };

    // 문자별 점등 세그먼트
    const FONT = {
      " ": "",
      A: "ABCEFGN", B: "ABCDILN", C: "ADEF",    D: "ABCDIL",
      E: "ADEFGN",  F: "AEFGN",   G: "ACDEFN",  H: "BCEFGN",
      I: "ADIL",    J: "BCDE",    K: "EFGJK",   L: "DEF",
      M: "BCEFHJ",  N: "BCEFHK",  O: "ABCDEF",  P: "ABEFGN",
      Q: "ABCDEFK", R: "ABEFGNK", S: "ACDFGN",  T: "AIL",
      U: "BCDEF",   V: "EFJM",    W: "BCEFKM",  X: "HJKM",
      Y: "HJL",     Z: "ADJM",
      "0": "ABCDEFJM", "1": "BC",      "2": "ABDEGN",   "3": "ABCDN",
      "4": "BCFGN",    "5": "ACDFGN",  "6": "ACDEFGN",  "7": "ABC",
      "8": "ABCDEFGN", "9": "ABCDFGN",
      "-": "GN", "/": "JM"
    };

    const NS = "http://www.w3.org/2000/svg";
    const srText = document.getElementById("flipText");

    function paint(cell) {
      const lit = FONT[CHARSET[cell.cur]] || "";
      for (let s = 0; s < SEG_ORDER.length; s++) {
        cell.segs[s].classList.toggle("on", lit.includes(SEG_ORDER[s]));
      }
    }

    // HTML의 data-phrases 를 읽어 한 줄을 구성
    function buildLine(el) {
      const phrases = (el.dataset.phrases || "")
        .split("|")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      if (!phrases.length) return null;

      const width = Number(el.dataset.cells) ||
        phrases.reduce((m, p) => Math.max(m, p.length), 0);

      const cells = [];
      for (let i = 0; i < width; i++) {
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 24 40");
        svg.setAttribute("class", "flipcell");
        const segs = SEG_ORDER.map((name) => {
          const [x1, y1, x2, y2] = SEG_COORD[name];
          const ln = document.createElementNS(NS, "line");
          ln.setAttribute("x1", x1); ln.setAttribute("y1", y1);
          ln.setAttribute("x2", x2); ln.setAttribute("y2", y2);
          ln.setAttribute("class", "seg");
          svg.appendChild(ln);
          return ln;
        });
        el.appendChild(svg);
        cells.push({ svg, segs, cur: 0, target: 0, done: true, last: 0, startAt: 0 });
      }

      return {
        el, phrases, width, cells,
        isMain: el.dataset.role === "main",
        idx: 0, phraseStart: 0, holdUntil: 0
      };
    }

    // 문장을 가운데 정렬로 패딩
    function pad(text, width) {
      if (text.length >= width) return text.slice(0, width);
      const left = Math.floor((width - text.length) / 2);
      return " ".repeat(left) + text + " ".repeat(width - text.length - left);
    }

    function setPhrase(line, text) {
      const padded = pad(text, line.width);
      line.cells.forEach((cell, i) => {
        const t = CHARSET.indexOf(padded[i]);
        cell.target = t < 0 ? 0 : t;
        // 반드시 눈에 띄게 돌도록 최소 회전량 확보
        const back = 10 + Math.floor(Math.random() * 18);
        cell.cur = (cell.target - back + CHARSET.length * 2) % CHARSET.length;
        cell.done = false;
        cell.startAt = i * STAGGER;
        cell.last = 0;
        paint(cell);
      });
      if (line.isMain && srText) srText.textContent = text;
    }

    const lines = [...flipLinesEls].map(buildLine).filter(Boolean);

    if (reducedMotion) {
      // 모션 최소화 설정이면 회전 없이 첫 문장만 표시
      lines.forEach((line) => {
        const padded = pad(line.phrases[0], line.width);
        line.cells.forEach((cell, i) => {
          const t = CHARSET.indexOf(padded[i]);
          cell.cur = t < 0 ? 0 : t;
          paint(cell);
        });
        if (line.isMain && srText) srText.textContent = line.phrases[0];
      });
    } else {
      lines.forEach((line) => setPhrase(line, line.phrases[0]));

      function flipFrame(now) {
        for (const line of lines) {
          if (!line.phraseStart) line.phraseStart = now;
          let allDone = true;

          for (const cell of line.cells) {
            if (cell.done) continue;
            allDone = false;
            if (now - line.phraseStart < cell.startAt) continue;
            if (now - cell.last < FLIP_MS) continue;

            cell.cur = (cell.cur + 1) % CHARSET.length;
            cell.last = now;
            paint(cell);

            if (cell.cur === cell.target) {
              cell.done = true;
              cell.svg.classList.add("lock");
              setTimeout(() => cell.svg.classList.remove("lock"), 180);
            }
          }

          if (allDone) {
            if (!line.holdUntil) {
              line.holdUntil = now + HOLD_MS;
            } else if (now >= line.holdUntil) {
              line.holdUntil = 0;
              line.phraseStart = now;
              line.idx = (line.idx + 1) % line.phrases.length;
              setPhrase(line, line.phrases[line.idx]);
            }
          }
        }
        requestAnimationFrame(flipFrame);
      }
      requestAnimationFrame(flipFrame);
    }
  }

  /* ----------------------------------------------------------
     스크롤 리빌
     ---------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        revealObserver.unobserve(en.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "100000px 0px 0px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ----------------------------------------------------------
     긴 글 구간에서는 스냅을 끈다.

     TEXT 는 한 화면보다 훨씬 길다. 스냅이 켜진 채로 글 중간에서 손을 떼면
     브라우저가 위아래 스냅 지점 중 가까운 쪽으로 끌어당겨 화면이 튄다.
     모바일 관성 스크롤에서는 위로 튕겨 올라가 글을 읽을 수가 없다.
     구간이 보이는 동안에만 스냅을 꺼 둔다.
     ---------------------------------------------------------- */
  const longRead = document.getElementById("text");

  if (longRead) {
    const root = document.documentElement;

    /* 구간에 닿기 조금 전에 미리 꺼 둔다. 도착한 뒤에 끄면
       이미 스냅이 걸린 상태라 한 번 튕기고 나서 풀린다. */
    const near = () => {
      const r = longRead.getBoundingClientRect();
      const margin = innerHeight * 0.5;
      return r.top < innerHeight + margin && r.bottom > -margin;
    };
    const apply = () => root.classList.toggle("snap-off", near());

    const snapObserver = new IntersectionObserver(apply, { threshold: 0 });
    snapObserver.observe(longRead);
    /* 관찰자만 믿지 않는다 — 스크롤로도 판정한다.
       (일부 환경에서 관찰자 콜백이 오지 않는 경우가 있다) */
    addEventListener("scroll", apply, { passive: true });
    addEventListener("resize", apply, { passive: true });
    apply();
  }

  /* 연락처 이메일 — 예전에는 글자가 흩어졌다 제자리를 찾는 연출이 있었으나
     제거했다. 지금은 index.html 에 적힌 주소를 그대로 보여 준다. */

  /* ----------------------------------------------------------
     시계 — 푸터의 서울 시간은 뺐다.
     히어로에 #heroClock 을 되살리면 그때만 돈다.
     ---------------------------------------------------------- */
  const heroClock = document.getElementById("heroClock");
  if (heroClock) {
    const tickClock = () => {
      heroClock.textContent = "SEOUL " + new Date().toLocaleTimeString("en-GB", {
        timeZone: "Asia/Seoul",
        hour12: false
      });
    };
    tickClock();
    setInterval(tickClock, 1000);
  }
})();
