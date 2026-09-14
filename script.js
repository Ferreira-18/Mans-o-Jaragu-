(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Ano no rodapé ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: fundo ao rolar + menu mobile ---------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("navBurger");
  var navLinks = document.getElementById("navLinks");

  function onScrollNav(){
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive:true });

  if (burger){
    burger.addEventListener("click", function(){
      var open = navLinks.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){
        navLinks.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Hero: slideshow com crossfade ---------- */
  var slides = document.querySelectorAll(".hero__slide");
  if (slides.length > 1 && !reduceMotion){
    var current = 0;
    setInterval(function(){
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
    }, 6000);
  }

  /* ---------- Hero: brilho suave seguindo o cursor ---------- */
  var hero = document.querySelector(".hero");
  var glow = document.getElementById("heroGlow");
  if (hero && glow && !reduceMotion && window.matchMedia("(hover: hover)").matches){
    hero.addEventListener("mousemove", function(e){
      var rect = hero.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      glow.style.setProperty("--x", x + "%");
      glow.style.setProperty("--y", y + "%");
    });
  }

  /* ---------- Scroll cue: esconder ao rolar ---------- */
  var heroScroll = document.getElementById("heroScroll");
  if (heroScroll){
    window.addEventListener("scroll", function(){
      heroScroll.style.opacity = window.scrollY > 80 ? "0" : "";
    }, { passive:true });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.18, rootMargin:"0px 0px -60px 0px" });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("is-in"); });
  }

  /* ---------- Contadores animados ---------- */
  var counters = document.querySelectorAll(".stat__number");
  function animateCount(el){
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var noSep = el.getAttribute("data-nosep") === "true";
    var duration = 1400;
    var start = null;

    function step(ts){
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(eased * target);
      el.textContent = (noSep ? value : value.toLocaleString("pt-BR")) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = (noSep ? target : target.toLocaleString("pt-BR")) + suffix;
    }
    requestAnimationFrame(step);
  }
  if (counters.length){
    if ("IntersectionObserver" in window){
      var ioCount = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting){
            reduceMotion ? (function(){
              var el = entry.target;
              var target = el.getAttribute("data-count");
              var suffix = el.getAttribute("data-suffix") || "";
              var noSep = el.getAttribute("data-nosep") === "true";
              el.textContent = (noSep ? target : parseInt(target,10).toLocaleString("pt-BR")) + suffix;
            })() : animateCount(entry.target);
            ioCount.unobserve(entry.target);
          }
        });
      }, { threshold:.5 });
      counters.forEach(function(el){ ioCount.observe(el); });
    }
  }

  /* ---------- Galeria: filtro ---------- */
  var filters = document.querySelectorAll(".filter");
  var items = document.querySelectorAll(".gallery__item");

  function revealGalleryItems(){
    var visible = Array.prototype.filter.call(items, function(it){ return !it.classList.contains("is-hidden"); });
    visible.forEach(function(it, i){
      it.classList.remove("is-visible");
      setTimeout(function(){ it.classList.add("is-visible"); }, i * 55);
    });
  }
  filters.forEach(function(btn){
    btn.addEventListener("click", function(){
      filters.forEach(function(f){ f.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var cat = btn.getAttribute("data-filter");
      items.forEach(function(it){
        var show = cat === "all" || it.getAttribute("data-cat") === cat;
        it.classList.toggle("is-hidden", !show);
      });
      revealGalleryItems();
    });
  });
  // reveal inicial (com IntersectionObserver para entrar ao rolar até a galeria)
  if ("IntersectionObserver" in window){
    var ioGallery = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          revealGalleryItems();
          obs.disconnect();
        }
      });
    }, { threshold:.1 });
    var galleryGrid = document.getElementById("galleryGrid");
    if (galleryGrid) ioGallery.observe(galleryGrid);
  } else {
    items.forEach(function(it){ it.classList.add("is-visible"); });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");
  var galleryItemsArr = Array.prototype.slice.call(items);
  var lightboxIndex = 0;

  function getVisibleItems(){
    return galleryItemsArr.filter(function(it){ return !it.classList.contains("is-hidden"); });
  }
  function openLightbox(item){
    var visible = getVisibleItems();
    lightboxIndex = visible.indexOf(item);
    showLightbox(visible);
  }
  function showLightbox(visible){
    var item = visible[lightboxIndex];
    lightboxImg.src = item.getAttribute("data-full");
    lightboxImg.alt = item.getAttribute("data-caption") || "";
    lightboxCaption.textContent = item.getAttribute("data-caption") || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox(){
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  items.forEach(function(item){
    item.addEventListener("click", function(){ openLightbox(item); });
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) lightbox.addEventListener("click", function(e){
    if (e.target === lightbox) closeLightbox();
  });
  if (lightboxPrev) lightboxPrev.addEventListener("click", function(){
    var visible = getVisibleItems();
    lightboxIndex = (lightboxIndex - 1 + visible.length) % visible.length;
    showLightbox(visible);
  });
  if (lightboxNext) lightboxNext.addEventListener("click", function(){
    var visible = getVisibleItems();
    lightboxIndex = (lightboxIndex + 1) % visible.length;
    showLightbox(visible);
  });
  document.addEventListener("keydown", function(e){
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft" && lightboxPrev) lightboxPrev.click();
    if (e.key === "ArrowRight" && lightboxNext) lightboxNext.click();
  });

})();
