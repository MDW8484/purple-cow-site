(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");
  var media = document.querySelector(".hero-media");
  var video = document.querySelector(".hero-video");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var held = false;

  function holdFinalFrame() {
    if (!video || held) return;
    held = true;
    try {
      // Stay on the last frame; never reset to 0.
      if (video.duration && isFinite(video.duration) && video.currentTime < video.duration) {
        video.currentTime = video.duration;
      }
    } catch (e) {}
    video.pause();
    if (media) media.classList.add("is-ended");
  }

  function showStaticFinal() {
    if (video) {
      try { video.pause(); } catch (e) {}
    }
    if (media) media.classList.add("is-static");
  }

  function tryPlay() {
    if (!video) return;
    if (reduce.matches) {
      showStaticFinal();
      return;
    }
    var play = video.play();
    if (play && typeof play.catch === "function") {
      play.catch(function () {
        showStaticFinal();
      });
    }
  }

  if (video) {
    video.addEventListener("ended", holdFinalFrame);
    // Some engines pause at the end without a reliable ended event.
    video.addEventListener("pause", function () {
      if (video.ended) holdFinalFrame();
    });
  }

  function onScroll() {
    if (!header || !hero) return;
    var heroBottom = hero.getBoundingClientRect().bottom;
    header.classList.toggle(
      "is-scrolled",
      heroBottom <= header.offsetHeight + 32
    );
  }

  tryPlay();
  onScroll();

  if (reduce.addEventListener) {
    reduce.addEventListener("change", tryPlay);
  } else if (reduce.addListener) {
    reduce.addListener(tryPlay);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* About overlay */
  var overlay = document.getElementById("aboutOverlay");
  var openBtn = document.getElementById("aboutOpen");
  var closeBtn = document.getElementById("aboutClose");
  var panel = document.getElementById("aboutPanel");
  var lastFocus = null;

  function focusables() {
    if (!overlay) return [];
    return Array.prototype.slice.call(
      overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) {
      return !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true";
    });
  }

  function isOpen() {
    return overlay && overlay.classList.contains("is-visible");
  }

  function openAbout() {
    if (!overlay) return;
    lastFocus = document.activeElement;
    overlay.style.display = "flex";
    overlay.classList.add("is-open");
    document.body.classList.add("about-open");
    overlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("is-visible");
        if (closeBtn) closeBtn.focus();
        else if (panel) panel.focus();
      });
    });
  }

  function closeAbout() {
    if (!overlay || !isOpen()) return;
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("about-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    var done = false;
    function hide() {
      if (done) return;
      done = true;
      overlay.classList.remove("is-open");
      overlay.style.display = "none";
      overlay.removeEventListener("transitionend", hide);
    }
    overlay.addEventListener("transitionend", hide);
    setTimeout(hide, 320);
  }

  if (openBtn) {
    openBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openAbout();
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", closeAbout);
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeAbout();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!isOpen()) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      closeAbout();
      return;
    }
    if (e.key === "Tab") {
      var items = focusables();
      if (!items.length) {
        e.preventDefault();
        if (panel) panel.focus();
        return;
      }
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !overlay.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();
