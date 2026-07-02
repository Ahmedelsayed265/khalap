(function () {
  'use strict';

  function initSection(section) {
    if (!section || typeof Swiper === 'undefined') return;

    var swiperEl = section.querySelector('.khalab-featured-showcase-quotes-swiper');
    if (!swiperEl || swiperEl.dataset.swiperInit === 'true') return;

    var slides = swiperEl.querySelectorAll('.swiper-slide');
    if (!slides.length) return;

    swiperEl.dataset.swiperInit = 'true';

    var prevBtn = section.querySelector('.khalab-featured-showcase-nav-btn--prev');
    var nextBtn = section.querySelector('.khalab-featured-showcase-nav-btn--next');
    var slideCount = slides.length;

    var isRtl =
      document.documentElement.getAttribute('dir') === 'rtl' ||
      document.body.classList.contains('rtl');

    new Swiper(swiperEl, {
      dir: isRtl ? 'rtl' : 'ltr',
      effect: 'fade',
      fadeEffect: {
        crossFade: true,
      },
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 650,
      autoHeight: true,
      loop: slideCount > 1,
      watchOverflow: true,
      allowTouchMove: slideCount > 1,
      navigation:
        slideCount > 1 && prevBtn && nextBtn
          ? {
              prevEl: prevBtn,
              nextEl: nextBtn,
            }
          : false,
    });
  }

  function boot(root) {
    if (typeof Swiper === 'undefined') {
      window.setTimeout(function () {
        boot(root);
      }, 60);
      return;
    }

    var sections = root
      ? [root]
      : Array.prototype.slice.call(document.querySelectorAll('.khalab-featured-showcase'));

    sections.forEach(initSection);
  }

  window.khalabInitFeaturedShowcase = boot;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      boot();
    });
  } else {
    boot();
  }
})();
