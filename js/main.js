(function () {
  "use strict";

  /* —— Theme Toggle —— */
  function initTheme() {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateCanvasOpacity();
  }

  function updateCanvasOpacity() {
    const canvas = document.getElementById("bg-canvas");
    if (canvas) {
      const theme = document.documentElement.getAttribute("data-theme") || "dark";
      canvas.style.opacity = theme === "dark" ? "0.75" : "0.15";
    }
  }

  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  initTheme();

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* —— Year —— */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* —— Nav —— */
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.getElementById("site-nav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      const open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    siteNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  /* —— Scroll reveal —— */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* —— Expandable project cards —— */
  const expandableCards = document.querySelectorAll(".project-card--expandable");
  function setCardOpen(card, open) {
    card.classList.toggle("is-open", open);
    card.setAttribute("aria-expanded", open ? "true" : "false");
    card.querySelectorAll(".project-link").forEach((a) => {
      a.tabIndex = open ? 0 : -1;
    });
  }

  expandableCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a.project-link")) return;
      const willOpen = !card.classList.contains("is-open");
      if (willOpen) {
        expandableCards.forEach((other) => {
          if (other !== card) setCardOpen(other, false);
        });
      }
      setCardOpen(card, willOpen);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest("a")) return;
      e.preventDefault();
      const willOpen = !card.classList.contains("is-open");
      if (willOpen) {
        expandableCards.forEach((other) => {
          if (other !== card) setCardOpen(other, false);
        });
      }
      setCardOpen(card, willOpen);
    });
  });

  /* —— Canvas: subtle node network —— */
  const canvas = document.getElementById("bg-canvas");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      let w = 0;
      let h = 0;
      let nodes = [];
      let raf = 0;
      let gridNx = 0;
      let gridNy = 0;
      let gridBuckets = [];

      const MAX_DIST = 120;
      const LINE_ALPHA = 0.15;

      function computeNodeCount() {
        const base = Math.floor((window.innerWidth / 28) * 1.2);
        const oldCap = Math.min(55, Math.max(1, base));
        return Math.min(300, Math.max(100, Math.floor(oldCap * 3)));
      }

      function resize() {
        w = canvas.width = window.innerWidth * window.devicePixelRatio;
        h = canvas.height = window.innerHeight * window.devicePixelRatio;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const maxD = MAX_DIST * window.devicePixelRatio;
        const cellSize = maxD;
        gridNx = Math.max(1, Math.ceil(w / cellSize) + 2);
        gridNy = Math.max(1, Math.ceil(h / cellSize) + 2);
        const len = gridNx * gridNy;
        if (gridBuckets.length !== len) {
          gridBuckets = Array.from({ length: len }, () => []);
        }
        initNodes();
      }

      function initNodes() {
        nodes = [];
        const scale = window.devicePixelRatio;
        const count = computeNodeCount();
        const rMul = count > 1000 ? 0.55 : 1;
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.28 * scale,
            vy: (Math.random() - 0.5) * 0.28 * scale,
            r: (Math.random() * 1.2 + 0.45) * scale * rMul,
          });
        }
        for (let k = 0; k < gridBuckets.length; k++) gridBuckets[k].length = 0;
      }

      function step() {
        const scale = window.devicePixelRatio;
        const maxD = MAX_DIST * scale;
        const cellSize = maxD;
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }

        for (let k = 0; k < gridBuckets.length; k++) gridBuckets[k].length = 0;

        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          let cx = Math.floor(n.x / cellSize);
          let cy = Math.floor(n.y / cellSize);
          cx = Math.max(0, Math.min(gridNx - 1, cx));
          cy = Math.max(0, Math.min(gridNy - 1, cy));
          gridBuckets[cy * gridNx + cx].push(i);
        }

        ctx.lineWidth = 0.4 * scale;
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          let cx = Math.floor(a.x / cellSize);
          let cy = Math.floor(a.y / cellSize);
          cx = Math.max(0, Math.min(gridNx - 1, cx));
          cy = Math.max(0, Math.min(gridNy - 1, cy));
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              const bx = cx + ox;
              const by = cy + oy;
              if (bx < 0 || by < 0 || bx >= gridNx || by >= gridNy) continue;
              const bucket = gridBuckets[by * gridNx + bx];
              for (let t = 0; t < bucket.length; t++) {
                const j = bucket[t];
                if (j <= i) continue;
                const b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d = Math.hypot(dx, dy);
                if (d < maxD) {
                  const alpha = (1 - d / maxD) * LINE_ALPHA;
                  ctx.strokeStyle = `rgba(62, 232, 199, ${alpha})`;
                  ctx.beginPath();
                  ctx.moveTo(a.x, a.y);
                  ctx.lineTo(b.x, b.y);
                  ctx.stroke();
                }
              }
            }
          }
        }

        for (const n of nodes) {
          ctx.fillStyle = "rgba(139, 123, 255, 0.7)";
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        }

        raf = requestAnimationFrame(step);
      }

      let resizeTimer;
      window.addEventListener(
        "resize",
        () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(resize, 120);
        },
        { passive: true }
      );

      resize();
      step();

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          cancelAnimationFrame(raf);
        } else {
          step();
        }
      });
    }
  }
})();
