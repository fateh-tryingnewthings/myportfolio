/* Fatehatul Hafiz portfolio: interactions + motion
   - spring letter reveals on headings
   - liquid fill inside outline type (CSS, driven by --lvl)
   - hero letters that bulge and fill with liquid near the cursor
   - scroll-velocity marquee, parallax, image wipes, magnetic buttons, counters */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  document.documentElement.classList.add("js");

  /* ---------- Split text into words + letters ---------- */
  function split(el) {
    if (el.dataset.split) return;
    el.dataset.split = "1";
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.setAttribute("aria-hidden", "true");
            [...part].forEach((c) => {
              const s = document.createElement("span");
              s.className = "ch";
              s.textContent = c;
              s.style.setProperty("--i", i++);
              w.appendChild(s);
            });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add("split-ready");
  }

  if (!reduceMotion) {
    document.querySelectorAll(".display, .contact__big, .split, .case__title").forEach(split);
    document.querySelectorAll(".hero__line").forEach(split);
  }

  /* ---------- Nav background on scroll ---------- */
  const nav = document.getElementById("nav");
  const onScrollNav = () => nav.classList.toggle("is-scrolled", window.scrollY > window.innerHeight * 0.75);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------- Reveal on scroll ---------- */
  const revealables = document.querySelectorAll(".reveal, .wipe, .split-ready, .stat");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        if (e.target.classList.contains("stat")) countUp(e.target.querySelector("b"));
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Count-up numbers ---------- */
  function countUp(b) {
    if (!b || b.dataset.done) return;
    b.dataset.done = "1";
    const raw = b.textContent.trim();
    const target = parseFloat(raw);
    const decimals = (raw.split(".")[1] || "").replace(/\D/g, "").length;
    const suffix = raw.replace(/[\d.]/g, "");
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      b.textContent = (target * e).toFixed(decimals) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Halftone dot wave (canvas) ---------- */
  function halftone(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const o = Object.assign({ crest: 0.62, clearLeft: 0.38, spacing: 13, maxR: 4.2, color: "rgba(255,255,255,0.9)", mode: "hero" }, opts);
    let w = 0, h = 0, visible = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }

    function field(x, y, t) {
      const nx = x / w, ny = y / h;
      if (o.mode === "hero") {
        const crest = o.crest + 0.1 * Math.sin(nx * 3.2 + t * 0.00045) + 0.05 * Math.sin(nx * 7.1 - t * 0.0003);
        const d = ny - crest;
        const v = d > 0 ? Math.exp(-d * d * 18) + Math.min(d * 1.4, 0.35) : Math.exp(-d * d * 120);
        const k = Math.max(0, Math.min(1, (nx - o.clearLeft) / 0.3));
        return v * k * k * (3 - 2 * k);
      }
      const d = (nx - ny * 0.6) - 0.62 - 0.05 * Math.sin(ny * 6 + t * 0.0004);
      return Math.max(0, Math.min(1, d * 2.6));
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = o.color;
      const s = o.spacing;
      for (let y = s / 2; y < h; y += s) {
        const offset = (Math.round(y / s) % 2) * (s / 2);
        for (let x = s / 2 + offset; x < w; x += s) {
          const r = field(x, y, t) * o.maxR;
          if (r < 0.35) continue;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    resize();
    window.addEventListener("resize", resize);
    if (!reduceMotion) {
      if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
      const loop = (t) => { if (visible) draw(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }

  const small = window.innerWidth < 860;
  const heroCanvas = document.getElementById("halftone");
  if (heroCanvas) halftone(heroCanvas, small
    ? { mode: "hero", spacing: 10, maxR: 3.2, crest: 0.82, clearLeft: 0.1 }
    : { mode: "hero", spacing: 13, maxR: 4.4, crest: 0.6, clearLeft: 0.42 });
  document.querySelectorAll("[data-halftone]").forEach((c) =>
    halftone(c, { mode: "corner", spacing: 14, maxR: 4.6, color: "rgba(255,255,255,0.22)" })
  );

  // spring helper: semi-implicit, frame-rate tolerant (dt = 1 per 60fps frame)
  const spring = (pos, v, target, k, damp, dt) => {
    v += (target - pos) * k * dt;
    v *= Math.pow(damp, dt);
    return [pos + v * dt, v];
  };

  /* =========================================================
     Motion loop (one rAF for everything below)
     ========================================================= */
  if (!reduceMotion) {
    const heroName = document.querySelector(".hero__name");
    const heroInner = document.querySelector(".hero__inner");
    const heroSection = document.querySelector(".hero");
    const sparkles = document.querySelectorAll(".hero .sparkle");
    const heroMe = document.querySelector(".hero__me");
    const heroChars = heroName ? [...heroName.querySelectorAll(".ch")].map((el) => ({
      el,
      outline: !!el.closest(".hero__line--outline"),
      y: 0, vy: 0, s: 1, vs: 0, l: 0.35, vl: 0,
    })) : [];

    const mouse = { x: -9999, y: -9999, active: false, last: 0 };
    if (finePointer && heroSection) {
      heroSection.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; mouse.last = performance.now(); });
      heroSection.addEventListener("pointerleave", () => { mouse.active = false; });
    }

    // let the CSS entrance finish before the springs take over
    let heroLive = false;
    setTimeout(() => { heroLive = true; heroName && heroName.classList.add("is-live"); }, 1700);

    const track = document.querySelector(".marquee__track");
    let mx = 0, lastY = window.scrollY, vel = 0;
    if (track) track.classList.add("js-driven");

    let prev = performance.now();
    const loop = (t) => {
      const dt = Math.min(3, (t - prev) / 16.67);
      prev = t;
      const sy = window.scrollY;
      const vh = window.innerHeight;

      const raw = sy - lastY; lastY = sy;
      vel += (raw - vel) * Math.min(1, 0.15 * dt);

      /* hero parallax + fade */
      if (heroInner && sy < vh * 1.2) {
        const p = sy / vh;
        heroInner.style.transform = `translate3d(0, ${(sy * 0.28).toFixed(1)}px, 0) scale(${(1 - p * 0.06).toFixed(4)})`;
        heroInner.style.opacity = String(Math.max(0, 1 - p * 1.1));
        if (heroMe) heroMe.style.translate = `0 ${(sy * 0.12).toFixed(1)}px`;
        sparkles.forEach((s, i) => {
          s.style.rotate = `${sy * (0.12 + i * 0.06)}deg`;
          s.style.translate = `0 ${sy * (0.1 + i * 0.08)}px`;
        });
      }

      /* hero letters: liquid bulge around the cursor, or an idle sweep */
      if (heroLive && heroChars.length && sy < vh) {
        const box = heroName.getBoundingClientRect();
        const fs = parseFloat(getComputedStyle(heroName).fontSize);
        const idle = !mouse.active || t - mouse.last > 2500;
        let px, py;
        if (idle) {
          px = box.left + (0.5 + 0.48 * Math.sin(t * 0.00055)) * box.width;
          py = box.top + (0.5 + 0.42 * Math.sin(t * 0.0009 + 1)) * box.height;
        } else { px = mouse.x; py = mouse.y; }
        const r = fs * (idle ? 0.75 : 0.95);

        heroChars.forEach((c) => {
          const b = c.el.getBoundingClientRect();
          const dx = b.left + b.width / 2 - px, dy = b.top + b.height / 2 - py;
          const f = Math.exp(-(dx * dx + dy * dy) / (r * r));
          [c.y, c.vy] = spring(c.y, c.vy, -f * fs * 0.09, 0.08, 0.8, dt);
          [c.s, c.vs] = spring(c.s, c.vs, 1 + f * 0.16, 0.08, 0.8, dt);
          c.el.style.translate = `0 ${c.y.toFixed(2)}px`;
          c.el.style.scale = `${(1 - (c.s - 1) * 0.25).toFixed(4)} ${c.s.toFixed(4)}`;
          if (c.outline) {
            [c.l, c.vl] = spring(c.l, c.vl, 0.35 + f * 0.75, 0.05, 0.82, dt);
            c.el.style.setProperty("--lvl", c.l.toFixed(3));
          }
        });
      }

      /* marquee: base speed + scroll velocity, with skew */
      if (track) {
        const half = track.scrollWidth / 2;
        const dir = vel < -0.5 ? -1 : 1;
        mx -= (1.1 + Math.min(Math.abs(vel) * 0.6, 26)) * dt * dir;
        if (mx <= -half) mx += half;
        if (mx > 0) mx -= half;
        const skew = Math.max(-14, Math.min(14, -vel * 0.5));
        track.style.transform = `translate3d(${mx.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    /* ---------- Magnetic buttons ---------- */
    if (finePointer) {
      document.querySelectorAll(".btn, .nav__cta, .yt__play").forEach((btn) => {
        const zone = btn.classList.contains("yt__play") ? btn.parentElement : btn;
        let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, running = false;
        const step = () => {
          [x, vx] = spring(x, vx, tx, 0.15, 0.72, 1);
          [y, vy] = spring(y, vy, ty, 0.15, 0.72, 1);
          btn.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
          if (Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(vx) + Math.abs(vy) > 0.05) requestAnimationFrame(step);
          else running = false;
        };
        const kick = () => { if (!running) { running = true; requestAnimationFrame(step); } };
        zone.addEventListener("pointermove", (e) => {
          const b = btn.getBoundingClientRect();
          const k = zone === btn ? 1 : 0.35;
          tx = (e.clientX - (b.left + b.width / 2)) * 0.3 * k;
          ty = (e.clientY - (b.top + b.height / 2)) * 0.4 * k;
          kick();
        });
        zone.addEventListener("pointerleave", () => { tx = 0; ty = 0; kick(); });
      });
    }
  }

  /* ---------- Cuppa app carousel: auto-advance + swipe ---------- */
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const device = root.querySelector(".device");
    const track = root.querySelector(".device__track");
    const buttons = [...root.querySelectorAll("[data-go]")];
    const n = track.children.length;
    const DUR = 3200;
    root.style.setProperty("--dur", DUR + "ms");
    let index = 0, timer = 0, hovering = false, visible = false;

    const go = (i) => {
      index = (i + n) % n;
      track.style.transform = `translateX(${-index * 100}%)`;
      buttons.forEach((b, k) => {
        if (k === index) {
          b.setAttribute("aria-current", "true");
          const bar = b.querySelector(".screens__bar"); // restart progress animation
          bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
        } else b.removeAttribute("aria-current");
      });
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (reduceMotion || hovering || !visible) return;
      timer = setTimeout(() => go(index + 1), DUR);
    };
    const pause = (p) => { hovering = p; root.classList.toggle("is-paused", p); schedule(); };

    buttons.forEach((b) => b.addEventListener("click", () => go(+b.dataset.go)));
    root.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pause(true); });
    root.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") pause(false); });

    // swipe / drag
    let startX = 0, dx = 0, dragging = false;
    device.addEventListener("pointerdown", (e) => {
      dragging = true; startX = e.clientX; dx = 0;
      device.setPointerCapture(e.pointerId); device.classList.add("is-drag"); clearTimeout(timer);
    });
    device.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const w = device.clientWidth;
      dx = Math.max(-w, Math.min(w, e.clientX - startX));
      track.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false; device.classList.remove("is-drag");
      if (Math.abs(dx) > device.clientWidth * 0.18) go(index + (dx < 0 ? 1 : -1)); else go(index);
    };
    device.addEventListener("pointerup", end);
    device.addEventListener("pointercancel", end);

    // keyboard
    device.tabIndex = 0;
    device.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    });

    // only run while on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: 0.3 }).observe(root);
    } else { visible = true; schedule(); }
    if (reduceMotion) root.classList.add("is-paused");
  });

  /* ---------- Lightbox ---------- */
  const box = document.getElementById("lightbox");
  const boxImg = box.querySelector("img");
  const boxCap = box.querySelector(".lightbox__cap");

  function open(src, cap, alt) {
    boxImg.src = src;
    boxImg.alt = alt || cap || "";
    boxCap.textContent = cap || "";
    if (typeof box.showModal === "function") box.showModal();
    else window.open(src, "_blank");
  }

  document.addEventListener("click", (e) => {
    const img = e.target.closest("[data-lightbox]");
    if (img) open(img.currentSrc || img.src, img.dataset.cap, img.alt);
  });

  document.querySelectorAll("[data-lightbox]").forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img.currentSrc || img.src, img.dataset.cap, img.alt); }
    });
  });

  box.addEventListener("click", (e) => { if (e.target === box || e.target.closest(".lightbox__close")) box.close(); });
  box.addEventListener("close", () => { boxImg.removeAttribute("src"); });

  /* ---------- YouTube: click-to-load (embeds need http/https, so
     when opened as a local file it just opens YouTube instead) ---------- */
  document.querySelectorAll("[data-yt]").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (location.protocol === "file:") return;
      e.preventDefault();
      document.querySelectorAll("video").forEach((v) => v.pause());
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${a.dataset.yt}?autoplay=1&rel=0`;
      f.title = a.getAttribute("aria-label") || "YouTube video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.allowFullscreen = true;
      a.replaceWith(f);
    });
  });

  /* ---------- Only one video plays at a time ---------- */
  const vids = document.querySelectorAll("video");
  vids.forEach((v) => v.addEventListener("play", () => vids.forEach((o) => { if (o !== v) o.pause(); })));
})();
