/* ==========================================================================
   MAREC INSIGHTS — "THE PARROT'S LEDGER"
   Cinematic behaviors: drifting brand motes, tiled film grain, parallax
   projector beam, typewriter hero line, staggered scroll reveals,
   act-rail + nav tracking, reel scroll progress, credits crawl controls.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TURQUOISE = "0,168,150";
  var GOLD = "201,151,0";
  var MOSS = "12,59,46";

  /* ---------------- drifting brand motes ---------------- */
  (function motes() {
    var canvas = document.getElementById("motes");
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, particles = [];
    var scrollY = window.pageYOffset;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function build() {
      var count = Math.max(24, Math.min(80, Math.floor((w * h) / 24000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        var roll = Math.random();
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2.2 + 0.6,
          speedY: Math.random() * 0.22 + 0.04,
          drift: Math.random() * 0.4 - 0.2,
          phase: Math.random() * Math.PI * 2,
          depth: Math.random() * 0.5 + 0.15,
          alpha: Math.random() * 0.34 + 0.10,
          hue: roll > 0.62 ? GOLD : (roll > 0.24 ? TURQUOISE : MOSS)
        });
      }
    }

    resize();
    build();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); build(); }, 150);
    });

    window.addEventListener("scroll", function () {
      scrollY = window.pageYOffset;
    }, { passive: true });

    var t = 0;
    function tick() {
      if (document.hidden) { requestAnimationFrame(tick); return; }
      t += 0.006;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.speedY;
        p.x += Math.sin(t + p.phase) * 0.25 + p.drift * 0.2;

        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;

        // gentle parallax against page scroll
        var py = p.y - (scrollY * p.depth * 0.06) % (h + 24);
        if (py < -12) py += h + 24;

        var grad = ctx.createRadialGradient(p.x, py, 0, p.x, py, p.r * 3.2);
        grad.addColorStop(0, "rgba(" + p.hue + "," + p.alpha + ")");
        grad.addColorStop(1, "rgba(" + p.hue + ",0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, py, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ---------------- film grain (tiled, cheap) ---------------- */
  (function grain() {
    var canvas = document.getElementById("grain");
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    var TILE = 128;
    var tiles = [];
    var w = 0, h = 0;

    for (var n = 0; n < 3; n++) {
      var off = document.createElement("canvas");
      off.width = off.height = TILE;
      var octx = off.getContext("2d");
      var img = octx.createImageData(TILE, TILE);
      for (var i = 0; i < img.data.length; i += 4) {
        var shade = 90 + Math.random() * 165;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = shade;
        img.data[i + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      tiles.push(off);
    }

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    var frame = 0, index = 0;
    function loop() {
      if (document.hidden) { requestAnimationFrame(loop); return; }
      frame++;
      if (frame % 4 === 0) {
        index = (index + 1) % tiles.length;
        var pattern = ctx.createPattern(tiles[index], "repeat");
        ctx.setTransform(1, 0, 0, 1, -Math.random() * TILE, -Math.random() * TILE);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w + TILE, h + TILE);
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ---------------- projector beam parallax ---------------- */
  (function beam() {
    var el = document.querySelector(".projector-beam");
    if (!el || reduceMotion) return;

    var hero = document.getElementById("hero");
    if (!hero) return;

    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect();
      var ratio = (e.clientX - rect.left) / rect.width - 0.5;
      el.style.transform = "translateX(" + (-50 + ratio * 14) + "%) rotate(" + (ratio * 10) + "deg)";
      el.style.animationPlayState = "paused";
    });
    hero.addEventListener("pointerleave", function () {
      el.style.transform = "";
      el.style.animationPlayState = "running";
    });
  })();

  /* ---------------- typewriter (same engine as marec.site) ---------------- */
  (function typewriter() {
    var PHRASES = [
      "Cinematic Hospitality Workforce Intelligence",
      "Act I — The Phantom Surge",
      "Act II — The Parrot's Diagnosis",
      "Act III — The Golden Ledger",
      "Predictive Analytics & Executive Dashboarding"
    ];

    var el = document.getElementById("typewriter");
    if (!el) return;

    if (reduceMotion) {
      el.textContent = PHRASES[0];
      return;
    }

    var phraseIndex = 0, charIndex = 0, deleting = false;

    function tick() {
      var phrase = PHRASES[phraseIndex];
      if (!deleting) {
        el.textContent = phrase.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === phrase.length) {
          deleting = true;
          setTimeout(tick, 2000);
          return;
        }
        setTimeout(tick, 60);
      } else {
        el.textContent = phrase.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % PHRASES.length;
          setTimeout(tick, 380);
          return;
        }
        setTimeout(tick, 28);
      }
    }
    setTimeout(tick, 900);
  })();

  /* ---------------- staggered scroll reveal ---------------- */
  (function reveal() {
    var items = document.querySelectorAll(".reveal, .reveal-step");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("visible"); });
      return;
    }

    // stagger siblings inside each grid / section
    var groups = document.querySelectorAll(".three-grid, .four-grid, .contact-grid, .act, .credits-section");
    Array.prototype.forEach.call(groups, function (group) {
      var steps = group.querySelectorAll(":scope > .reveal-step");
      Array.prototype.forEach.call(steps, function (el, i) {
        el.style.setProperty("--stagger", Math.min(i * 90, 450) + "ms");
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
  })();

  /* ---------------- act rail + nav tracking ---------------- */
  (function tracking() {
    var ids = ["hero", "act1", "act2", "act3", "credits", "contact"];
    var sections = ids
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (!sections.length) return;

    var railItems = document.querySelectorAll(".reel-nav li");
    var navLinks = document.querySelectorAll(".nav-tabs .nav-link");

    Array.prototype.forEach.call(railItems, function (li) {
      li.addEventListener("click", function () {
        var target = document.getElementById(li.getAttribute("data-target"));
        if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });

    if (!("IntersectionObserver" in window)) return;

    function setActive(id) {
      Array.prototype.forEach.call(railItems, function (li) {
        li.classList.toggle("active", li.getAttribute("data-target") === id);
      });
      Array.prototype.forEach.call(navLinks, function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    }

    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var best = null, bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; best = id; }
      });
      if (best) setActive(best);
    }, { threshold: [0.15, 0.35, 0.6, 0.85] });

    sections.forEach(function (sec) { observer.observe(sec); });
  })();

  /* ---------------- reel scroll progress ---------------- */
  (function progress() {
    var bar = document.getElementById("reelProgressBar");
    if (!bar) return;

    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.pageYOffset / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* ---------------- credits crawl: hover pause + toggle ---------------- */
  (function credits() {
    var crawl = document.getElementById("creditsCrawl");
    var viewport = document.querySelector(".credits-crawl-viewport");
    var toggle = document.getElementById("crawlToggle");
    if (!crawl || !viewport) return;

    var locked = false;

    function paint() {
      crawl.classList.toggle("paused", locked);
      if (toggle) {
        toggle.textContent = locked ? "▶ Play" : "❚❚ Pause";
        toggle.setAttribute("aria-pressed", String(locked));
      }
    }

    viewport.addEventListener("mouseenter", function () {
      if (!locked) crawl.classList.add("paused");
    });
    viewport.addEventListener("mouseleave", function () {
      if (!locked) crawl.classList.remove("paused");
    });

    if (toggle) {
      toggle.addEventListener("click", function () {
        locked = !locked;
        paint();
      });
    }
    paint();
  })();

  /* ---------------- pause offscreen animation work ---------------- */
  (function idle() {
    var crawl = document.getElementById("creditsCrawl");
    if (!crawl || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        crawl.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      });
    }, { threshold: 0 });
    observer.observe(crawl.parentElement);
  })();

})();