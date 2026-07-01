(function () {
  'use strict';

  var AUTOPLAY_MS = 4500;

  function circularDiff(index, active, count) {
    var diff = index - active;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  }

  function initSection(section) {
    var slides = Array.from(section.querySelectorAll('.khalab-categories-slide'));
    if (!slides.length) return;

    var track = section.querySelector('.khalab-categories-track');
    var gallery = section.querySelector('.khalab-categories-gallery');
    var prevBtn = section.querySelector('.khalab-categories-nav--prev');
    var nextBtn = section.querySelector('.khalab-categories-nav--next');

    var state = {
      index: 0,
      count: slides.length,
      paused: false,
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

    function updateSlideClasses() {
      slides.forEach(function (slide, i) {
        var diff = circularDiff(i, state.index, state.count);
        var link = slide.querySelector('.khalab-categories-card');

        slide.classList.remove(
          'is-active',
          'is-prev',
          'is-next',
          'is-far-prev',
          'is-far-next',
          'is-hidden'
        );

        if (link) link.tabIndex = diff === 0 ? 0 : -1;

        if (diff === 0) slide.classList.add('is-active');
        else if (diff === -1) slide.classList.add('is-prev');
        else if (diff === 1) slide.classList.add('is-next');
        else if (diff === -2) slide.classList.add('is-far-prev');
        else if (diff === 2) slide.classList.add('is-far-next');
        else slide.classList.add('is-hidden');
      });
    }

    function setActive(index, animate) {
      var next = ((index % state.count) + state.count) % state.count;
      if (next === state.index && animate !== false) return;

      state.index = next;
      updateSlideClasses();

      if (track) {
        track.classList.toggle('is-animating', animate !== false);
      }

      if (animate !== false) {
        startAutoplay();
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        setActive(state.index - 1, true);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        setActive(state.index + 1, true);
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
          if (dx < 0) setActive(state.index + 1, true);
          else setActive(state.index - 1, true);
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
