/* =========================================================
   MAREC INSIGHTS — "THE PARROT'S LEDGER"
   Cinematic behaviors: film grain, drifting gold motes,
   scroll-triggered scene reveals, reel-nav act tracking,
   credits crawl pause-on-hover.
   ========================================================= */

(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- film grain ---------------- */
  (function grain(){
    var canvas = document.getElementById("grain");
    if(!canvas) return;
    var ctx = canvas.getContext("2d");
    var w, h;

    function resize(){
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw(){
      var imageData = ctx.createImageData(w, h);
      var buffer = imageData.data;
      for(var i = 0; i < buffer.length; i += 4){
        var shade = Math.random() * 255;
        buffer[i] = shade;
        buffer[i+1] = shade;
        buffer[i+2] = shade;
        buffer[i+3] = 18;
      }
      ctx.putImageData(imageData, 0, 0);
      if(!reduceMotion) requestAnimationFrame(loop);
    }

    var frame = 0;
    function loop(){
      frame++;
      if(frame % 3 === 0) draw();
      else requestAnimationFrame(loop);
    }
    draw();
  })();

  /* ---------------- drifting gold motes (spotlight dust) ---------------- */
  (function motes(){
    var canvas = document.getElementById("motes");
    if(!canvas) return;
    var ctx = canvas.getContext("2d");
    var w, h, particles;

    function resize(){
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function makeParticles(){
      var count = Math.min(70, Math.floor((w * h) / 22000));
      particles = [];
      for(var i = 0; i < count; i++){
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.6 + 0.4,
          speedY: Math.random() * 0.25 + 0.05,
          drift: Math.random() * 0.4 - 0.2,
          alpha: Math.random() * 0.5 + 0.15,
          hue: Math.random() > 0.5 ? "201,162,75" : "47,143,104"
        });
      }
    }

    resize();
    makeParticles();
    window.addEventListener("resize", function(){
      resize();
      makeParticles();
    });

    function tick(){
      ctx.clearRect(0, 0, w, h);
      for(var i = 0; i < particles.length; i++){
        var p = particles[i];
        p.y -= p.speedY;
        p.x += p.drift * 0.3;
        if(p.y < -10){ p.y = h + 10; p.x = Math.random() * w; }
        if(p.x < -10) p.x = w + 10;
        if(p.x > w + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.hue + "," + p.alpha + ")";
        ctx.fill();
      }
      if(!reduceMotion) requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ---------------- scroll reveal ---------------- */
  (function reveal(){
    var items = document.querySelectorAll(".reveal");
    if(!items.length) return;

    if(!("IntersectionObserver" in window) || reduceMotion){
      items.forEach(function(el){ el.classList.add("in-view"); });
      return;
    }

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("in-view");
          // restart the squawk pop so it plays as the scene reveals,
          // not silently while the scene was still hidden
          var squawks = entry.target.querySelectorAll(".squawk");
          squawks.forEach(function(sq){
            sq.style.animation = "none";
            void sq.offsetWidth; // force reflow to restart animation
            sq.style.animation = "";
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -60px 0px" });

    items.forEach(function(el){ observer.observe(el); });
  })();

  /* ---------------- reel-nav act tracking ---------------- */
  (function reelNav(){
    var sections = ["hero", "act1", "act2", "act3", "credits"]
      .map(function(id){ return document.getElementById(id); })
      .filter(Boolean);
    var navItems = document.querySelectorAll(".reel-nav li");
    if(!sections.length || !navItems.length) return;

    navItems.forEach(function(li){
      li.addEventListener("click", function(){
        var target = document.getElementById(li.getAttribute("data-target"));
        if(target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });

    if(!("IntersectionObserver" in window)) return;

    var byId = {};
    navItems.forEach(function(li){ byId[li.getAttribute("data-target")] = li; });

    var navObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          navItems.forEach(function(li){ li.classList.remove("active"); });
          var match = byId[entry.target.id];
          if(match) match.classList.add("active");
        }
      });
    }, { threshold: 0.45 });

    sections.forEach(function(sec){ navObserver.observe(sec); });
  })();

  /* ---------------- credits crawl pause on hover/touch ---------------- */
  (function credits(){
    var crawl = document.getElementById("creditsCrawl");
    var viewport = document.querySelector(".credits-crawl-viewport");
    if(!crawl || !viewport) return;

    viewport.addEventListener("mouseenter", function(){ crawl.classList.add("paused"); });
    viewport.addEventListener("mouseleave", function(){ crawl.classList.remove("paused"); });
    viewport.addEventListener("touchstart", function(){ crawl.classList.toggle("paused"); }, { passive: true });
  })();

})();