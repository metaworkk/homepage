/* ============================================================
   PORTFOLIO SCRIPT — 반전 커서 / 3D 틸트 / 패럴랙스 / 리빌
   ============================================================ */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

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
                줄바꿈이 필요하면 <br> 을 쓰세요. */
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

    { folder: "work01", title: "어떤 힘", meta: "Performance installation with choreography, and interactive media, 60 min · 2024", count: 0,
      video: "video/force-web.mp4",        videoHQ: "https://video.metawork.org/force.mp4", poster: "video/force-poster.jpg",
      desc: "신체에 작용하는 물리적 힘과 관계 속에서 발생하는 비가시적인 압력, <br>Performed at 아르코예술극장 소극장, Seoul" },
    { folder: "work06", title: "PAMS CHOICE 악단광칠 NEXT JOURNEY", meta: "Single-channel video for dance performance, 12 min. · 2025", count: 0,
      video: "video/ADG7-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
      desc: "Performed at 남산국악당, Seoul" },  
    { folder: "work08", title: "부유생물체의 여러가지 사정" , meta: "Hologram installation for choreography, 60 min · 2025", count: 0,
      video: "video/ADG7-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
      desc: "Performed at 아르코예술극장 대극장, Seoul" },
    { folder: "work09", title: "부유생물체의 여러가지 사정" , meta: "Hologram installation for choreography, 60 min · 2024", count: 0,
      video: "video/ADG7-web.mp4",         videoHQ: "https://video.metawork.org/ADG7.mp4", poster: "video/ADG7-poster.jpg",
      desc: "Performed at 아르코예술극장 대극장, Seoul" },
    { folder: "work02", title: "내일의 이웃", meta: "Interactive performance with choreography · 2022", count: 0,
      video: "video/arko-web.mp4",         videoHQ: "https://video.metawork.org/arko.mp4", poster: "video/arko-poster.jpg",
      desc: "Performed at 국립아시아문화전당, Gwang-ju"},
    { folder: "work03", title: "영혼을 수놓은 초상", meta: "Single channel video · 2022", count: 0,
      video: "video/KF-web.mp4",           videoHQ: "https://video.metawork.org/KF.mp4", poster: "video/KF-poster.jpg",
      desc: "installation at KF gallary, Seoul" },
    { folder: "work03", title: "영혼을 수놓은 초상", meta: "Single channel video · 2022", count: 0,
      video: "video/KF-web.mp4",           videoHQ: "https://video.metawork.org/KF.mp4", poster: "video/KF-poster.jpg",
      desc: "installation at KF gallary, Seoul" },
    { folder: "work04", title: "방", meta: "Single channel video · 2025", count: 0,
      video: "video/room-web.mp4",         videoHQ: "https://video.metawork.org/room.mp4", poster: "video/room-poster.jpg",
      desc: "" },
    { folder: "work05", title: "작은만족", meta: "Single channel video · 2025", count: 0,
      video: "video/little-web.mp4",       videoHQ: "https://video.metawork.org/little.mp4", poster: "video/little-poster.jpg",
      desc: "" },
    { folder: "work07", title: "STOCK MARCH", meta: "Single channel video · 2024", count: 0,
      video: "video/stock-march-web.mp4",  videoHQ: "https://video.metawork.org/stock-march.mp4", poster: "video/stock-march-poster.jpg",
      desc: "" },

    /* 전광판 작품 — type:"sign" 이면 영상 대신 세그먼트 디스플레이가 들어갑니다.
       phrases / phrasesSub 는 각각 윗줄·아랫줄 문구.
       표시 가능 문자: A-Z, 0-9, 공백, - / (한글 불가) */
    { type: "sign", folder: "work08", title: "작품 제목 08",
      meta: "Split-flap display · 2026", count: 0,
      poster: "video/sign-poster.jpg",
      desc: "",
      phrases:    ["RECORD AND ERASE", "LIGHT BECOMES MATTER", "TRACE OF THE UNSEEN", "ARCHIVE NO 001"],
      phrasesSub: ["PAINTING", "DRAWING", "INSTALLATION", "OBJECT"] },

    /* ── 사진 작업 (궤도 윗줄) ──
       row: 0 = 윗줄, 생략하면 아랫줄. 사진은 img/<folder>/image01.jpg … 순서로 연결 */
    { row: 0, folder: "photo01", title: "사진 작품 01", meta: "Archival pigment print · 2026", count: 3, desc: "" },
    { row: 0, folder: "photo02", title: "사진 작품 02", meta: "Archival pigment print · 2026", count: 3, desc: "" },
    { row: 0, folder: "photo03", title: "사진 작품 03", meta: "Archival pigment print · 2025", count: 2, desc: "" },
    { row: 0, folder: "photo04", title: "사진 작품 04", meta: "Archival pigment print · 2025", count: 4, desc: "" },
    { row: 0, folder: "photo05", title: "사진 작품 05", meta: "Archival pigment print · 2024", count: 2, desc: "" }
  ];

  // count/folder → 실제 경로 배열 (img/work01/image01.jpg …)
  WORKS.forEach((w) => {
    const ext = w.ext || "jpg";
    w.images = Array.from({ length: w.count || 0 }, (_, i) =>
      "img/" + w.folder + "/image" + String(i + 1).padStart(2, "0") + "." + ext
    );
    // 라이트박스에서 넘겨볼 슬라이드 — 영상이 있으면 맨 앞
    w.slides = [
      ...(w.video ? [{ type: "video", src: w.videoHQ || w.video, poster: w.poster || "" }] : []),
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
                (w.poster ? ' poster="' + w.poster + '"' : "") +
                ' muted loop playsinline preload="none"></video>';
      } else if (cover) {
        media = '<img src="' + cover + '" alt="' + w.title + '" loading="lazy">';
      } else {
        media = '<div class="ph"><span class="ph-mark">✳</span>' +
                '<span class="ph-text">IMAGE<br>대표 사진 자리</span></div>';
      }

      // 가로 비율 — 기본 16:9, 작품별로 ratio: "4/3" 지정 가능
      const ratio = w.ratio || "16/9";
      const [rw, rh] = ratio.split("/").map(Number);
      sec.style.setProperty("--ratio", rw + " / " + rh);
      sec.style.setProperty("--rw", String(rw / rh));

      const shots = w.slides.length;
      sec.innerHTML =
        '<i class="wp-rule" style="left:24%"></i>' +
        '<i class="wp-rule" style="left:76%"></i>' +
        '<div class="wp-inner">' +
          '<div class="wp-media' + (w.type === "sign" ? ' wp-media--sign' : '') + '">' + media + "</div>" +
          '<div class="wp-meta">' +
            '<h3 class="wp-title">' + w.title + "</h3>" +
            '<p class="wp-info">' + w.meta + "</p>" +
            '<p class="wp-desc">' + (w.desc ||
              "여기에 작품 설명을 적어주세요. 무엇을 담고 싶었는지, 어떤 재료와 과정을 거쳤는지.") +
            "</p>" +
            '<button class="wp-open" type="button">VIEW ' + shots + " ↗</button>" +
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

  if (orbit) {
    // 카드 생성 — 영상이 있으면 무음 루프, 없으면 사진, 둘 다 없으면 플레이스홀더
    const cards = WORKS.map((w, i) => {
      const fig = document.createElement("figure");
      fig.className = "orbit-card";
      fig.dataset.index = i;
      const cover = w.images[0];
      let inner;
      if (w.video) {
        inner =
          '<div class="ph"><video src="' + w.video + '"' +
          (w.poster ? ' poster="' + w.poster + '"' : "") +
          ' muted loop playsinline preload="none"></video>' +
          '<span class="ph-badge">VIDEO</span></div>';
      } else if (w.type === "sign" || cover) {
        inner = '<div class="ph"><img src="' + (w.poster || cover) + '" alt="' + w.title +
                '" loading="lazy"></div>';
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

    let rot = 0;
    let R = 0;
    let dragging = false;
    let hovering = false;
    let startX = 0, startRot = 0, movedPx = 0;

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
      const ratio = orbit.clientWidth < 600 ? 0.40 : 0.30;
      R = Math.min(orbit.clientWidth * ratio, 320);
      // 카드 높이(4:3)를 기준으로 두 줄 간격을 잡는다
      const cardH = (cards[0]?.getBoundingClientRect().height) || 100;
      rowGap = cardH * 0.62;
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

    /* 마우스오버 배경 — 카드에 올리면 그 작품 사진이 뒤에 크게 깔린다.
       (팝업 열기 전 미리보기. 데스크톱 전용) */
    const hoverBg = document.getElementById("galleryBg");
    let bgTimer = null;

    function showBg(i) {
      if (!hoverBg) return;
      const src = WORKS[i].images[0];
      if (!src) return;
      clearTimeout(bgTimer);
      hoverBg.style.backgroundImage = 'url("' + src + '")';
      hoverBg.classList.add("show");
    }
    function hideBg() {
      if (!hoverBg) return;
      clearTimeout(bgTimer);
      // 카드 사이를 지나갈 때 깜빡이지 않도록 살짝 지연
      bgTimer = setTimeout(() => hoverBg.classList.remove("show"), 90);
    }

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
          (slide.poster ? ' poster="' + slide.poster + '"' : "") +
          ' controls autoplay loop playsinline preload="metadata"></video>';
      } else {
        lbSlide.innerHTML = '<img src="' + slide.src + '" alt="' + w.title + '">';
      }
      lbTitle.textContent = w.title + " — " + w.meta;
      lbCounter.textContent = (lbIdx + 1) + " / " + Math.max(1, w.slides.length);
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

    // 구는 인덱스 역할 — 카드를 누르면 해당 작품 페이지로 이동
    cards.forEach((c, i) => {
      c.addEventListener("click", () => {
        if (movedPx > 8) return; // 드래그였다면 클릭 무시
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
