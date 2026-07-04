(function () {
  function openKhalabSearchModal() {
    if (typeof window.openSearchModal === 'function') {
      window.openSearchModal();
      return;
    }

    var modal = document.getElementById('search-modal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(function () {
      var input = document.getElementById('khalab-search-input');
      if (input) input.focus();
    }, 100);
  }

  function closeKhalabToolbarDropdowns(except) {
    document.querySelectorAll('.khalab-pl-toolbar .dropdown.khalab-pl-pill.is-open').forEach(function (dropdown) {
      if (except && dropdown === except) return;

      dropdown.classList.remove('is-open');

      var toggle = dropdown.querySelector('[data-khalab-dropdown-toggle]');
      var menu = dropdown.querySelector('.dropdown-menu');

      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      if (menu) menu.classList.remove('show');
    });
  }

  function initKhalabToolbarDropdowns() {
    document.querySelectorAll('.khalab-pl-toolbar .dropdown.khalab-pl-pill').forEach(function (dropdown) {
      var toggle = dropdown.querySelector('[data-khalab-dropdown-toggle]');
      var menu = dropdown.querySelector('.dropdown-menu');

      if (!toggle || !menu) return;

      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var willOpen = !dropdown.classList.contains('is-open');
        closeKhalabToolbarDropdowns();

        if (willOpen) {
          dropdown.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
          menu.classList.add('show');
        }
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.khalab-pl-toolbar .dropdown.khalab-pl-pill')) {
        closeKhalabToolbarDropdowns();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeKhalabToolbarDropdowns();
      }
    });
  }

  function initKhalabProductsToolbar() {
    document.querySelectorAll('[data-khalab-open-search]').forEach(function (btn) {
      btn.addEventListener('click', openKhalabSearchModal);
    });

    initKhalabToolbarDropdowns();

    if (typeof window.bootstrap === 'undefined') return;

    var filterModal = document.getElementById('filterModal');
    if (filterModal) {
      window.bootstrap.Modal.getOrCreateInstance(filterModal, { focus: true });
    }

    var filterCollapse = document.getElementById('filters-form-collapse-sm');
    if (filterCollapse) {
      window.bootstrap.Collapse.getOrCreateInstance(filterCollapse, { toggle: false });
    }
  }

  if (document.readyState === 'complete') {
    initKhalabProductsToolbar();
  } else {
    window.addEventListener('load', initKhalabProductsToolbar, { once: true });
  }
})();
