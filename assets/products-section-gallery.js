(function () {
  'use strict';

  function initSection(section) {
    if (typeof Swiper === 'undefined') return;

    var swiperEl = section.querySelector('.khalab-products-swiper');
    if (!swiperEl || swiperEl.dataset.swiperInit === 'true') return;

    var prevBtn = section.querySelector('.khalab-products-nav--prev');
    var nextBtn = section.querySelector('.khalab-products-nav--next');
    var slideCount = swiperEl.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length;

    if (!slideCount) return;

    swiperEl.dataset.swiperInit = 'true';

    var isRtl =
      document.documentElement.getAttribute('dir') === 'rtl' ||
      document.body.classList.contains('rtl');

    new Swiper(swiperEl, {
      dir: isRtl ? 'rtl' : 'ltr',
      slidesPerView: 1.12,
      spaceBetween: 16,
      grabCursor: slideCount > 1,
      watchOverflow: true,
      speed: 550,
      navigation:
        slideCount > 1 && prevBtn && nextBtn
          ? {
              prevEl: prevBtn,
              nextEl: nextBtn,
            }
          : false,
      breakpoints: {
        576: {
          slidesPerView: 2,
          spaceBetween: 18,
        },
        992: {
          slidesPerView: 3,
          spaceBetween: 22,
        },
        1200: {
          slidesPerView: 4,
          spaceBetween: 24,
        },
      },
    });
  }

  function boot() {
    document.querySelectorAll('.khalab-products-section--home').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
