(function () {
  'use strict';

  var FIGMA = {
    w: 1126,
    h: 1256,
    xMin: 40,
    xMax: 1086,
    yEnd: 780,
    yPeak: 612,
  };

  function tForIndex(index, count) {
    if (count <= 1) return 0.5;
    return index / (count - 1);
  }

  function indexFromT(t, count) {
    if (count <= 1) return 0;
    return Math.round(Math.max(0, Math.min(1, t)) * (count - 1));
  }

  function pointOnArc(t) {
    var clamped = Math.max(0, Math.min(1, t));
    var x = FIGMA.xMin + clamped * (FIGMA.xMax - FIGMA.xMin);
    var y = FIGMA.yEnd + (FIGMA.yPeak - FIGMA.yEnd) * Math.sin(clamped * Math.PI);
    return {
      left: (x / FIGMA.w) * 100,
      top: (y / FIGMA.h) * 100,
    };
  }

  function tFromPointerX(clientX, rect) {
    var ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, ratio));
  }

  function circularDiff(index, active, count) {
    var diff = index - active;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  }

  var AUTOPLAY_MS = 4500;

  function initSection(section) {
    var slides = Array.from(section.querySelectorAll('.khalab-selections-slide'));
    if (!slides.length) return;

    var track = section.querySelector('.khalab-selections-track');
    var gallery = section.querySelector('.khalab-selections-gallery');
    var rulerWrap = section.querySelector('.khalab-selections-ruler-wrap');
    var knob = section.querySelector('.khalab-ruler-knob');
    var priceEl = section.querySelector('.khalab-selections-price');
    var pointerEl = section.querySelector('.khalab-ruler-pointer');

    var state = {
      index: 0,
      count: slides.length,
      dragging: false,
      pointerId: null,
      paused: false,
    };

    var autoplayTimer = null;

    var defaultActive = parseInt(section.getAttribute('data-default-active') || '0', 10);
    if (Number.isNaN(defaultActive)) defaultActive = Math.floor(state.count / 2);
    defaultActive = ((defaultActive % state.count) + state.count) % state.count;

    var hasDefaultFrame =
      slides[defaultActive] && slides[defaultActive].querySelector('.khalab-selections-frame-img');
    if (!hasDefaultFrame) {
      for (var i = 0; i < slides.length; i += 1) {
        if (slides[i].querySelector('.khalab-selections-frame-img')) {
          defaultActive = i;
          break;
        }
      }
    }

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
        if (!state.dragging && !state.paused) {
          setActive(state.index + 1, true);
        }
      }, AUTOPLAY_MS);
    }

    function updateSlideClasses() {
      slides.forEach(function (slide, i) {
        var diff = circularDiff(i, state.index, state.count);
        slide.classList.remove('is-active', 'is-prev', 'is-next', 'is-far');
        slide.querySelector('.khalab-selections-slide-link').tabIndex = diff === 0 ? 0 : -1;

        if (diff === 0) slide.classList.add('is-active');
        else if (diff === -1) slide.classList.add('is-prev');
        else if (diff === 1) slide.classList.add('is-next');
        else slide.classList.add('is-far');
      });
    }

    function positionKnobAtIndex(index) {
      if (!knob) return;
      positionKnobAtT(tForIndex(index, state.count));
      knob.setAttribute('aria-valuenow', String(index));
    }

    function positionPointer() {
      if (!pointerEl) return;
      var point = pointOnArc(0.5);
      pointerEl.style.left = point.left + '%';
      pointerEl.style.top = point.top + '%';
    }

    function positionKnobAtT(t) {
      if (!knob) return;
      var point = pointOnArc(t);
      knob.style.left = point.left + '%';
      knob.style.top = point.top + '%';
    }

    function updatePrice() {
      if (!priceEl) return;
      var active = slides[state.index];
      priceEl.textContent = active.getAttribute('data-price') || '';
      priceEl.classList.remove('is-updating');
      void priceEl.offsetWidth;
      priceEl.classList.add('is-updating');
    }

    function setActive(index, animate) {
      var next = ((index % state.count) + state.count) % state.count;
      if (next === state.index && animate !== false) return;

      state.index = next;
      updateSlideClasses();
      positionKnobAtIndex(state.index);
      updatePrice();

      if (track) {
        track.classList.toggle('is-animating', animate !== false);
      }

      if (animate !== false) {
        startAutoplay();
      }
    }

    function onPointerDown(event) {
      if (!rulerWrap || event.target.closest('.khalab-selections-price-wrap')) return;
      stopAutoplay();
      state.dragging = true;
      state.pointerId = event.pointerId;
      rulerWrap.setPointerCapture(event.pointerId);
      knob.classList.add('is-dragging');
      knob.style.transition = 'none';
      var rect = rulerWrap.getBoundingClientRect();
      var t = tFromPointerX(event.clientX, rect);
      positionKnobAtT(t);
      setActive(indexFromT(t, state.count), false);
    }

    function onPointerMove(event) {
      if (!state.dragging || event.pointerId !== state.pointerId) return;
      var rect = rulerWrap.getBoundingClientRect();
      var t = tFromPointerX(event.clientX, rect);
      positionKnobAtT(t);
      setActive(indexFromT(t, state.count), false);
    }

    function onPointerUp(event) {
      if (!state.dragging || event.pointerId !== state.pointerId) return;
      state.dragging = false;
      state.pointerId = null;
      knob.classList.remove('is-dragging');
      knob.style.transition = '';
      if (rulerWrap && rulerWrap.hasPointerCapture(event.pointerId)) {
        rulerWrap.releasePointerCapture(event.pointerId);
      }
      var rect = rulerWrap.getBoundingClientRect();
      setActive(indexFromT(tFromPointerX(event.clientX, rect), state.count), true);
      startAutoplay();
    }

    if (rulerWrap) {
      rulerWrap.addEventListener('pointerdown', onPointerDown);
      rulerWrap.addEventListener('pointermove', onPointerMove);
      rulerWrap.addEventListener('pointerup', onPointerUp);
      rulerWrap.addEventListener('pointercancel', onPointerUp);
    }

    if (knob) {
      knob.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          setActive(state.index + 1, true);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          setActive(state.index - 1, true);
        }
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
    positionPointer();
    startAutoplay();
  }

  function boot() {
    document.querySelectorAll('.khalab-selections').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
