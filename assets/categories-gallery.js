(function () {
  'use strict';

  var AUTOPLAY_MS = 4500;
  var CARD_WIDTH = 411;
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function circularDiff(index, active, count) {
    var diff = index - active;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  }

  function isRtl() {
    return (
      document.documentElement.getAttribute('dir') === 'rtl' ||
      getComputedStyle(document.documentElement).direction === 'rtl'
    );
  }

  function getSpacing(gallery) {
    if (!gallery) return 132;
    return Math.min(156, Math.max(96, gallery.offsetWidth * 0.118));
  }

  function cardMetrics(distance) {
    if (distance > 2) {
      return { scale: 0.45, opacity: 0, blur: 8, visible: false };
    }

    var scale = Math.max(0.55, 1 - distance * 0.21);
    var opacity = Math.max(0, 1 - distance * 0.175);
    var blur = distance * 1.75;

    if (distance === 1) {
      scale = 0.74;
      opacity = 0.9;
      blur = 1.5;
    } else if (distance === 2) {
      scale = 0.58;
      opacity = 0.65;
      blur = 3.5;
    }

    return { scale: scale, opacity: opacity, blur: blur, visible: true };
  }

  function initSection(section) {
    var slides = Array.from(section.querySelectorAll('.khalab-categories-slide'));
    if (!slides.length) return;

    var track = section.querySelector('.khalab-categories-track');
    var gallery = section.querySelector('.khalab-categories-gallery');
    var prevBtn = section.querySelector('.khalab-categories-nav--prev');
    var nextBtn = section.querySelector('.khalab-categories-nav--next');
    var rtl = isRtl();

    var state = {
      index: 0,
      count: slides.length,
      paused: false,
      spacing: getSpacing(gallery),
    };

    var autoplayTimer = null;

    var defaultActive = parseInt(section.getAttribute('data-default-active') || '0', 10);
    if (Number.isNaN(defaultActive)) defaultActive = Math.floor(state.count / 2);
    defaultActive = ((defaultActive % state.count) + state.count) % state.count;

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (state.count <= 1) return;
      autoplayTimer = setInterval(function () {
        if (!state.paused) {
          setActive(state.index + 1, true);
        }
      }, AUTOPLAY_MS);
    }

    function applySlideStyles(animate) {
      state.spacing = getSpacing(gallery);
      var dir = rtl ? -1 : 1;

      slides.forEach(function (slide, i) {
        var diff = circularDiff(i, state.index, state.count);
        var metrics = cardMetrics(Math.abs(diff));
        var link = slide.querySelector('.khalab-categories-card');
        var x = diff * state.spacing * dir;

        slide.style.setProperty('--cat-x', x + 'px');
        slide.style.setProperty('--cat-scale', String(metrics.scale));
        slide.style.setProperty('--cat-opacity', String(metrics.opacity));
        slide.style.setProperty('--cat-blur', metrics.blur + 'px');
        slide.style.setProperty('--cat-z', String(10 - Math.abs(diff)));

        slide.classList.toggle('is-active', diff === 0);
        slide.classList.toggle('is-visible', metrics.visible);
        slide.style.pointerEvents = metrics.visible && metrics.opacity > 0.2 ? 'auto' : 'none';

        if (link) {
          link.tabIndex = diff === 0 ? 0 : -1;
        }
      });

      if (track) {
        track.classList.toggle('is-animating', animate !== false);
      }
    }

    function setActive(index, animate) {
      var next = ((index % state.count) + state.count) % state.count;
      if (next === state.index && animate !== false) return;

      state.index = next;
      applySlideStyles(animate);

      if (animate !== false) {
        startAutoplay();
      }
    }

    function stepNext() {
      setActive(state.index + 1, true);
    }

    function stepPrev() {
      setActive(state.index - 1, true);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        stepPrev();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stepNext();
      });
    }

    slides.forEach(function (slide, i) {
      slide.addEventListener('click', function (event) {
        if (i === state.index) return;
        event.preventDefault();
        setActive(i, true);
      });
    });

    if (gallery) {
      var touchStartX = 0;
      var touchStartY = 0;

      gallery.addEventListener(
        'touchstart',
        function (event) {
          stopAutoplay();
          touchStartX = event.changedTouches[0].screenX;
          touchStartY = event.changedTouches[0].screenY;
        },
        { passive: true }
      );

      gallery.addEventListener(
        'touchend',
        function (event) {
          var dx = event.changedTouches[0].screenX - touchStartX;
          var dy = event.changedTouches[0].screenY - touchStartY;
          if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) {
            startAutoplay();
            return;
          }

          var forward = rtl ? dx > 0 : dx < 0;
          if (forward) stepNext();
          else stepPrev();
        },
        { passive: true }
      );
    }

    section.addEventListener('mouseenter', function () {
      state.paused = true;
    });

    section.addEventListener('mouseleave', function () {
      state.paused = false;
    });

    section.addEventListener('focusin', function () {
      state.paused = true;
    });

    section.addEventListener('focusout', function (event) {
      if (!section.contains(event.relatedTarget)) {
        state.paused = false;
      }
    });

    window.addEventListener('resize', function () {
      applySlideStyles(false);
    });

    setActive(defaultActive, false);
    startAutoplay();
  }

  function boot() {
    document.querySelectorAll('.khalab-categories').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
