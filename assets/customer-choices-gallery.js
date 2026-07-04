(function () {
  'use strict';

  function initSection(section) {
    if (typeof Swiper === 'undefined') return;

    var swiperEl = section.querySelector('.khalab-customer-choices-swiper');
    if (!swiperEl || swiperEl.dataset.swiperInit === 'true') return;

    var prevBtn = section.querySelector('.khalab-customer-choices-nav--prev');
    var nextBtn = section.querySelector('.khalab-customer-choices-nav--next');
    var slideCount = swiperEl.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length;

    if (!slideCount) return;

    swiperEl.dataset.swiperInit = 'true';

    var isRtl =
      document.documentElement.getAttribute('dir') === 'rtl' ||
      document.body.classList.contains('rtl');

    new Swiper(swiperEl, {
      dir: isRtl ? 'rtl' : 'ltr',
      slidesPerView: 1.4,
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
        768: {
          slidesPerView: 2,
          spaceBetween: 20,
        },
        992: {
          slidesPerView: 3,
          spaceBetween: 22,
        },
      },
    });
  }

  function boot() {
    document.querySelectorAll('.khalab-customer-choices').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
