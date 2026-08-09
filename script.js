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
     count = 그 폴더에 든 사진 장수, ext = 확장자 */
  /* 영상을 넣으려면 video(+poster) 한 줄만 추가하면 됩니다.
     영상이 있으면 카드가 무음 반복 재생되고, 라이트박스 첫 장으로 들어갑니다.
     count를 0으로 두면 사진 없이 영상만 있는 작품이 됩니다. */
  /* video    = 미리보기용 압축본 (카드·작품화면에서 무음 반복재생)
     videoHQ  = 클릭해서 볼 원본. R2 등 외부 저장소 주소를 넣으면 그걸 재생하고,
                비워두면 미리보기용 압축본을 그대로 씁니다.
     desc     = 작품 화면 캡션에 들어갈 설명. 비워두면 안내 문구가 대신 나옵니다.
                줄바꿈이 필요하면 <br> 을 쓰세요.
     videos   = 영상이 여러 편인 작품. 배열로 적으면 클릭 후 화살표로 넘겨봅니다.
                첫 편이 카드·작품화면의 대표 영상이 됩니다.
                videos: [{ web: "video/xx-01-web.mp4", hq: "https://video.metawork.org/xx-01.mp4" },
                         { web: "video/xx-02-web.mp4", hq: "https://video.metawork.org/xx-02.mp4" }] */
  const WORKS = [
        /* 전광판 작품 — type:"sign" 이면 영상 대신 세그먼트 디스플레이가 들어갑니다.
       phrases / phrasesSub 는 각각 윗줄·아랫줄 문구.
       표시 가능 문자: A-Z, 0-9, 공백, - / (한글 불가) */
    { type: "sign", folder: "work10", title: "인스타그램 매니페스토",
      meta: "Split-flap display, instagram dataset · 2026", count: 0,
      poster: "video/sign-poster.jpg",
      desc: "Performed at Web",
      phrases:    ["Like this post", "Save this for later", "Tag someone who", "DM me for details","Double tap", "if you agree", "comments",],
      phrasesSub: ["LOVE YOU", "thank you", "good vives only ", "life lately","take me back","No filter","Photo dump","HAPPY BIRTHDAY!"] },

       /* ── 사진 작업 (궤도 윗줄) ──
       row: 0 = 윗줄, 생략하면 아랫줄. 사진은 img/<folder>/image01.jpg … 순서로 연결 */
    { row: 0, folder: "photo01", title: "국군난수체조", meta: "Mixed media with Single channel video · 2015", count: 3, desc: "Performed at 175 gallary, Seoul" },
    { row: 0, folder: "photo02", title: "보이지 않는 리듬", meta: "Stockdata, CRT, druming machine · 2014", count: 3, desc: "시나 말투, 제스쳐, 자연 혹은 일상 모든 곳에 리듬이 있다. <br>당연히 역사적 현상, 시장가격의 변동, 주식가격 변동에도 리듬이 있다. <br>그리고 리듬은 차이와 반복을 통해 형성된다" },
    { row: 0, folder: "photo03", title: "text2eye", meta: "자막 보조용 스마트 글라스 · 2017", count: 3, desc: "실시간 자막이 필요한 사람들을 위한 웨어러블 디바이스" },
    { row: 0, folder: "photo04", title: "받았지만 쏘았고 쏘았지만 받았으며 받지도 쏘지도 않은것", meta: "두개의 공 쏘는 장치, 타자기 , 1ch 영상  · 2012", count: 4, desc: "" },
    { row: 0, folder: "photo05", title: "Who’s afraid of school?", meta: "Mixed media · 2012", count: 5, desc: "" },
    { row: 0, folder: "photo06", title: "metawork", meta: "Archival pigment print · 2024", count: 2, desc: "" },   
    /* 사진 미정 — img/photo09/image01.jpg … 를 넣고 count 를 장수만큼 올리면 표시됩니다 */
    { row: 0, folder: "photo09", title: "사진 작품 05", meta: "Archival pigment print · 2024", count: 0, desc: "" },

    { folder: "work01", title: "어떤 힘", meta: "Performance installation with choreography, and interactive media, 60 min · 2024", count: 0,
      video: "video/force-web.mp4",        videoHQ: "https://video.metawork.org/force.mp4", poster: "video/force-poster.jpg",
      desc: "양자역학의 성격과 작용하는 물리적 힘의 관계 속에서 발생하는 비가시적인 압력 <br>Performed at 아르코예술극장 소극장, Seoul" },
    { folder: "work02", title: "타, 드르닥", meta: "Single-channel video for concert, 12 min. · 2025", count: 0,
      video: "video/ADG7-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
      desc: "Performed PAMS CHOICE 악단광칠 NEXT JOURNEY at 남산국악당, Seoul" },  
    /* 영상이 여러 편인 작품 — 편을 추가하려면 videos 배열에 한 줄씩 넣으면 됩니다 */
    { folder: "work03", title: "부유생물체의 여러가지 사정" , meta: "Hologram installation for choreography, 60 min · 2025", count: 0,
      videos: [
        { web: "video/float-01-web.mp4", hq: "https://video.metawork.org/float-01.mp4" },
        { web: "video/float-02-web.mp4", hq: "https://video.metawork.org/float-02.mp4" },
        { web: "video/float-03-web.mp4", hq: "https://video.metawork.org/float-03.mp4" },
        { web: "video/float-04-web.mp4", hq: "https://video.metawork.org/float-04.mp4" },
        { web: "video/float-05-web.mp4", hq: "https://video.metawork.org/float-05.mp4" },
        { web: "video/float-06-web.mp4", hq: "https://video.metawork.org/float-06.mp4" }
      ],
      poster: "video/float-poster.jpg",
      desc: "멜랑콜리 컴퍼니 - 테스트드라이브 작품 내 홀로그램 프로젝트 <br> Performed at 아르코예술극장 대극장, Seoul" },
    { folder: "work04", title: "내일의 이웃", meta: " AR Interactive performance with choreography, Unreal · 2022", count: 0,
      video: "video/arko-web.mp4",         videoHQ: "https://video.metawork.org/arko.mp4", poster: "video/arko-poster.jpg",
      desc: " 연기자의 시야를 몸 바깥에 부착시켜 새로운 감각을 느낄 수 있게 한다 <br> 외부 센서와 Unreal 엔진으로 제작 <br>  Performed at 국립아시아문화전당, Gwang-ju"},
    { folder: "work05", title: "영혼을 수놓은 초상", meta: "Metaverse project in Zepeto · 2021", count: 0,
      video: "video/KF-web.mp4",           videoHQ: "https://video.metawork.org/KF.mp4", poster: "video/KF-poster.jpg",
      desc: "한 - 벨기에 수교 120주년 기념전 <말의 머리> 전시 <br>메타버스 공간 제작 <br> installation at KF gallary, Seoul" },
    { folder: "work06", title: "말의 머리" , meta: "Metaverse project in Roblox · 2021", count: 0,
      video: "video/horsehead-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
      desc: "Performed at Roblox" },
    { folder: "work07", title: "I'm the church" , meta: "VR project for theater performance · 2021", count: 0,
      video: "video/church-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
      desc: "VR을 사용한 현실과 혼합된 새로운 방식의 연극, 변방연극제 Performed at TINC, Seoul" },
    { folder: "work08", title: "My room - 방구석대모험", meta: "Metaverse project in VRchat · 2021", count: 0,
      video: "video/room-web.mp4",         videoHQ: "https://video.metawork.org/room.mp4", poster: "video/room-poster.jpg",
      desc: "arte 한국문화예술교육진흥원 비대면 VR 교육프로그램 <br> Performed at VRchat" },
    /* 영상을 바꿀 때는 파일명도 바꾼다 — 이름이 같으면 브라우저가 예전 것을 계속 보여준다.
       (사진과 달리 영상에는 ?v= 캐시 무력화를 걸지 않는다. 용량이 커서) */
    { folder: "work09", title: "작은만족", meta: "Mixed media with 2 channel video · 2015", count: 0,
      video: "video/little2-web.mp4",      videoHQ: "https://video.metawork.org/little2.mp4", poster: "video/little2-poster.jpg",
      desc: "" },
    { folder: "work10", title: "오프닝 시퀀스", meta: "Mixed media with Single channel video · 2014", count: 0,
      video: "video/kuku-web.mp4",  videoHQ: "https://video.metawork.org/kuku.mp4", poster: "video/kuku-poster.jpg",
      desc: "이철헤어커커 - 트리코드 아카데미 오프닝" },
    { folder: "work11", title: "Mother's first song", meta: "Mixed media for commercial video · 2015", count: 0,
      video: "video/aia-web.mp4",  videoHQ: "https://video.metawork.org/aia.mp4", poster: "video/aia-poster.jpg",
      desc: "AIA생명-슈퍼스타K7 캠페인" },
  

    { row: 0, folder: "photo07", title: "국민대 2023 인공지능 미래탐색 VR/AR분야" , meta: "VR/AR분야 진로교육ㆍ체험특강 · 2023", count: 1, desc: "" },       
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

  // 폴더 → 실제 경로 배열 (img/photo01/image01.jpg …)
  WORKS.forEach((w) => {
    const ext = w.ext || "jpg";
    const listed = MANIFEST && MANIFEST[w.folder];
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
    WORKS.forEach((w, i) => {
      const sec = document.createElement("section");
      sec.className = "section workpage snap";
      sec.id = "work" + String(i + 1).padStart(2, "0");

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
          '<div class="wp-meta">' +
            '<h3 class="wp-title">' + w.title + "</h3>" +
            '<p class="wp-info">' + w.meta + "</p>" +
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

    // 데스크톱에서 카드에 올리면 자동 회전 일시정지 + 배경 사진
    if (!isTouch) {
      cards.forEach((c, i) => {
        c.addEventListener("mouseenter", () => { hovering = true; showBg(i); });
        c.addEventListener("mouseleave", () => { hovering = false; hideBg(); });
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

      // 무작위 순서 (Fisher–Yates) — 새로고침할 때마다 배치가 달라진다
      for (let k = items.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        const t = items[k]; items[k] = items[j]; items[j] = t;
      }

      /* 사진 비율은 파일이 로드돼야 알 수 있다.
         그전까지는 가로 사진으로 가정하고, 한 장씩 들어올 때마다
         실제 비율로 고쳐 다시 배치한다. */
      const ratios = items.map(() => 1.4);

      items.forEach((it, k) => {
        const w = WORKS[it.i];
        const fig = document.createElement("figure");
        fig.className = "pg-item";
        fig.dataset.index = it.i;
        fig.innerHTML =
          '<img src="' + bust(it.src) + '" alt="' + w.title + '" decoding="async">' +
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

      // 데스크톱에서 사진에 올리면 그 작품이 뒤에 크게 깔린다
      if (!isTouch) {
        cards.forEach((c) => {
          const i = Number(c.dataset.index);
          c.addEventListener("mouseenter", () => showBg(i));
          c.addEventListener("mouseleave", hideBg);
        });
      }
    }

    /* --------------------------------------------------------
       라이트박스
       -------------------------------------------------------- */
    const lightbox = document.getElementById("lightbox");
    const lbSlide = document.getElementById("lbSlide");
    const lbTitle = document.getElementById("lbTitle");
    const lbCounter = document.getElementById("lbCounter");
    let lbWork = 0, lbIdx = 0;

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
      lbTitle.textContent = w.title + " — " + w.meta;
      lbCounter.textContent = (lbIdx + 1) + " / " + Math.max(1, w.slides.length);
      // 작품 설명도 함께 (desc 는 <br> 을 쓰므로 innerHTML)
      const lbDesc = document.getElementById("lbDesc");
      if (lbDesc) lbDesc.innerHTML = w.desc || "";
    }

    function lbOpen(i) {
      lbWork = i;
      lbIdx = 0;
      if (hoverBg) hoverBg.classList.remove("show"); // 팝업 열리면 배경 미리보기 끔
      lbRender();
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function lbClose() {
      lbSlide.innerHTML = "";   // 재생 중이던 영상·소리를 확실히 정지
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function lbStep(dir) {
      const len = WORKS[lbWork].slides.length;
      if (len < 2) return;
      lbIdx = (lbIdx + dir + len) % len;
      lbRender();
    }

    /* 갤러리는 인덱스 역할 — 누르면 해당 작품 페이지로 이동.
       그리드에서는 한 작품에 사진이 여러 장이므로 순번이 아니라
       타일에 적어 둔 작품 번호(dataset.index)를 따라간다. */
    cards.forEach((c) => {
      c.addEventListener("click", () => {
        if (movedPx > 8) return; // 드래그였다면 클릭 무시
        const i = Number(c.dataset.index);
        const page = document.getElementById("work" + String(i + 1).padStart(2, "0"));
        if (page) page.scrollIntoView({ behavior: "smooth", block: "start" });
        else lbOpen(i);
      });
    });

    // 작품 페이지에서 사진·버튼을 누르면 라이트박스로 전체 장수 보기
    if (workPages) {
      [...workPages.children].forEach((sec, i) => {
        const open = () => lbOpen(i);
        sec.querySelector(".wp-media")?.addEventListener("click", open);
        sec.querySelector(".wp-open")?.addEventListener("click", open);
      });
    }

    document.getElementById("lbClose").addEventListener("click", lbClose);
    document.getElementById("lbPrev").addEventListener("click", () => lbStep(-1));
    document.getElementById("lbNext").addEventListener("click", () => lbStep(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) lbClose();
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
     연락처 이메일 — 글자가 흩어졌다 제자리를 찾는다.
     전광판 작품과 같은 원리(문자를 순서대로 돌려 목표 글자에서 멈춤).
     주소는 index.html 의 data-email 에서 읽습니다.
     ---------------------------------------------------------- */
  const emailEl = document.getElementById("contactEmail");

  if (emailEl) {
    const TARGET = (emailEl.dataset.email || emailEl.textContent).trim();
    const POOL = "abcdefghijklmnopqrstuvwxyz0123456789@._-";
    const FIXED = new Set(["@", ".", "-", "_"]);   // 기호는 처음부터 제자리

    if (reducedMotion) {
      emailEl.textContent = TARGET;
    } else {
      let cells = [];
      let timer = null;

      // 글자마다 목표까지 돌아야 할 횟수를 달리 줘서 물결처럼 맞춰진다
      const scramble = () => {
        cells = [...TARGET].map((ch, i) => ({
          ch,
          left: FIXED.has(ch) ? 0 : 6 + i * 2 + Math.floor(Math.random() * 8)
        }));
        emailEl.textContent = render();
      };
      const render = () =>
        cells.map((c) => (c.left <= 0 ? c.ch
          : POOL[Math.floor(Math.random() * POOL.length)])).join("");

      const settle = () => {
        if (timer) return;
        timer = setInterval(() => {
          let done = true;
          for (const c of cells) {
            if (c.left > 0) { c.left--; done = false; }
          }
          emailEl.textContent = render();
          if (done) { clearInterval(timer); timer = null; emailEl.textContent = TARGET; }
        }, 45);
      };

      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
      // 화면 안에 조금이라도 걸치면 '보인다'로 본다
      const visible = () => {
        const r = emailEl.getBoundingClientRect();
        return r.top < innerHeight && r.bottom > 0;
      };
      // 되돌리기는 화면에서 확실히 벗어났을 때만 (스크롤 중 깜빡임 방지)
      const gone = () => {
        const r = emailEl.getBoundingClientRect();
        return r.top > innerHeight * 1.5 || r.bottom < -innerHeight * 0.5;
      };

      scramble();

      /* 화면에 들어올 때마다 다시 맞춰지도록 —
         한 번 보고 지나쳤다가 돌아와도 연출이 재생된다 */
      let shown = false;
      const check = () => {
        if (visible()) {
          if (!shown) { shown = true; settle(); }
        } else if (shown && gone()) {
          shown = false; stop(); scramble();     // 멀리 벗어나면 다시 흩어 놓는다
        }
      };

      const io = new IntersectionObserver(check, { threshold: [0, 0.35, 0.7] });
      io.observe(emailEl);
      // 관찰자가 동작하지 않는 환경 대비 (스크롤로도 판정)
      addEventListener("scroll", check, { passive: true });
      emailEl.addEventListener("mouseenter", () => { shown = true; settle(); });
      check();
    }
  }

  /* ----------------------------------------------------------
     푸터 — 서울 시간
     ---------------------------------------------------------- */
  const footerTime = document.getElementById("footerTime");
  const heroClock = document.getElementById("heroClock");
  function tickClock() {
    const now = new Date().toLocaleTimeString("en-GB", {
      timeZone: "Asia/Seoul",
      hour12: false
    });
    footerTime.textContent = "SEOUL " + now;
    if (heroClock) heroClock.textContent = "SEOUL " + now;
  }
  tickClock();
  setInterval(tickClock, 1000);
})();
