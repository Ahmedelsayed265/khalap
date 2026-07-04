/* eslint-disable max-lines */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
var fixed_header;
var sticky;
var cart_products = [];

function handleLoginAction(redirectTo = '', addToUrl = true) {
  if (window.customerAuthState && window.customerAuthState.isAuthenticated) {
    return;
  }

  if (window.auth_dialog && window.auth_dialog.open && typeof window.auth_dialog.open === 'function') {
    if (redirectTo && addToUrl) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('redirect_to', redirectTo);
      window.history.replaceState({}, '', currentUrl.toString());
    }

    window.auth_dialog.open();
  } else {
    const redirectUrl = redirectTo
      ? `/auth/login?redirect_to=${encodeURIComponent(redirectTo)}`
      : '/auth/login';
    window.location.href = redirectUrl;
  }
}

function handleGiftCardClick() {
  if (!window.customerAuthState || !window.customerAuthState.isAuthenticated) {
    handleLoginAction('', false);
    return;
  }

  if (window.gift_dialog && window.gift_dialog.open && typeof window.gift_dialog.open === 'function') {
    window.gift_dialog.open();
  }
}

window.onscroll = () => fixed_header_to_top();

function menuFiixedHeader() {
  fixed_header = document.getElementById('fixed-header');
  sticky = fixed_header?.offsetTop;
}

function fixed_header_to_top() {
  if (window.pageYOffset > sticky) {
    if (fixed_header) {
      fixed_header.classList.add('sticky');
      $('.app-content').addClass('app-content-padded');
    }
  } else {
    if (fixed_header) {
      fixed_header.classList.remove('sticky');
      $('.app-content').removeClass('app-content-padded');
    }
  }
}

function showDropItems() {
  let dropitems = document.getElementById('women-dropitmes');
  dropitems.classList.remove('dropitems');
  dropitems.classList.add('dropitems-shown');
}

function hideDropItems() {
  let dropitems = document.getElementById('women-dropitmes');
  dropitems.classList.remove('dropitems-shown');
  dropitems.classList.add('dropitems');
}

function hideDropDownMenu() {
  elem.classList.remove('dropitems-shown');
  elem.classList.add('dropitems');
}

function rowSlideRight(selector) {
  let container = document.querySelector(selector);
  let width = container.offsetWidth;
  container.scrollLeft = 0;
}

function rowSlideLeft(selector) {
  var container = document.querySelector(selector);
  var width = container.offsetWidth;
  container.scrollLeft = -width;
}

function hideAnnouncementBar() {
  $('.announcement-bar').addClass('d-none');
}

function hideAvailabilityBar() {
  $('.availability-bar').addClass('d-none');
}

/*
    Cart
*/

function hideElmById(id) {
  document.getElementById(id).style.display = 'none';
}

function showShoppingCart() {
  document.getElementById('header-shopping-cart').style.width = '40%';
  document.body.classList.add('disable-scroll');
  addCartItem();
}

function hideShoppingCart() {
  document.getElementById('header-shopping-cart').style.width = '0%';
  document.body.classList.remove('disable-scroll');
  removeCartItems();
  hideElmById('empty-cart');
}

function getCartTotal() {
  return cart_products.reduce((acc, product) => acc + product.price * product.quantity, 0);
}

function getCartItemHTML(product) {
  return `
        <div id="cart-item-${product.id}" class="cart-item d-flex flex-row">
            <div class="cart-item-img"></div>
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-price">${product.price_string}</div>
            <div class="cart-item-quantity">${product.quantity}</div>
            <div class="cart-item-total">${product.price * product.quantity} ${localStorage.getItem('currency')}</div>
        </div>
    `;
}

function addCartItem() {
  let cart = document.getElementById('cart-items');
  cart.innerHTML = '';
  cart.style.display = 'flex';

  let empty_cart = document.getElementById('empty-cart');

  if (cart_products.length === 0) {
    empty_cart.style.display = 'flex';

    return;
  }

  cart_products.forEach(product => cart.insertAdjacentHTML('beforeend', getCartItemHTML(product)));
}

function removeCartItems() {
  let cart = document.getElementById('cart-items');
  cart.innerHTML = '';
}

function updateCartProducts(res) {
  let added_product = res.data.cart.product;
  let i = cart_products.findIndex(item => item.product_id == added_product.product_id);
  i > -1 ? (cart_products[i] = added_product) : cart_products.push(added_product);

  let quantity = cart_products.reduce((acc, product) => acc + product.quantity, 0);
  setCartCount(quantity);
}

function removeFromCartProducts(res, product_id) {
  let i = cart_products.findIndex(item => item.product_id === product_id);

  if (i > -1) {
    cart_products.splice(i, 1);
  }

  let quantity = cart_products.reduce((acc, product) => acc + product.quantity, 0);
  setCartCount(quantity);
}

function productCartAddToCart(elm, product_id) {
  if (!$('.add-to-cart-progress', elm).hasClass('d-none')) return;

  $('.add-to-cart-progress', elm).removeClass('d-none');

  addToCart(product_id, 1, function () {
    $('.add-to-cart-progress', elm).addClass('d-none');

    if (elm) {
      var getParentDiv = $(elm).closest('.khalab-product-card-inner, .product-item');

      var image = $('#product-card-img-' + product_id, getParentDiv);
      var cart = $('.a-shopping-cart');

      addToCartAnimation(cart, image);
    }
  });
}

function addToCart(product_id, quantity, onCompleted) {
  zid.cart
    .addProduct({
      product_id: product_id,
      quantity: quantity,
    }, { showErrorNotification: true })
    .then(function (response) {
      if (response) {
        setCartTotalAndBadge(response);

        if (typeof window.openSideCart === 'function') {
          window.openSideCart();
        } else {
          fetchCart();
        }

        if (onCompleted) {
          onCompleted();
        }
      }
    });
}

function removeFromCart(product_id) {
  product_id_str = product_id.replaceAll('-', '');
  let i = cart_products.findIndex(item => item.product_id == product_id_str);

  zid.cart
    .removeProduct({ product_id: cart_products[i].id }, {showErrorNotification: true})
    .then(res => removeFromCartProducts(res, product_id_str));
}

function getWishlistToggleButtons(container) {
  const $container = container instanceof jQuery ? container : $(container);
  return $container.find('.icon-heart-mask, [zid-visible-wishlist], [zid-hidden-wishlist]');
}

function setWishlistActive(container, active) {
  const $container = container instanceof jQuery ? container : $(container);
  if (!$container.length) return;

  $container.toggleClass('is-wishlisted', !!active);

  const productId = $container.attr('data-wishlist-id');
  if (productId) {
    $container.find(`[zid-visible-wishlist="${productId}"]`).toggleClass('filled', !!active);
    $container.find(`[zid-hidden-wishlist="${productId}"]`).removeClass('filled');
  }

  const heart = $container.find('> a.icon-heart-mask')[0];
  if (heart) {
    heart.classList.toggle('filled', !!active);
  }

  getWishlistToggleButtons($container).each(function() {
    this.style.removeProperty('display');
  });
}

function fillWishlistItems(items) {
  items.forEach(product => {
    const container = $(`.add-to-wishlist[data-wishlist-id=${product.id}]`);
    if (!container.length) return;
    setWishlistActive(container, true);
  });
}

function addToWishlist(elm, productId) {
  const container = $(elm).closest('.add-to-wishlist');

  // Hide ALL heart buttons and show loader
  getWishlistToggleButtons(container).each(function() {
    this.style.setProperty('display', 'none', 'important');
  });
  container.find('.loader').removeClass('d-none');

  // Remove From Wishlist if already active
  if (container.hasClass('is-wishlisted') || $(elm).hasClass('filled') || $(elm).is('[zid-visible-wishlist]')) {
    return removeFromWishlist(elm, productId);
  }

  zid.account.addToWishlists({ product_ids: [productId] }, { showErrorNotification: true }).then(response => {
    if (response) {
      container.find('.loader').addClass('d-none');
      setWishlistActive(container, true);
    } else {
      setWishlistActive(container, false);
      elm.style.setProperty('display', 'inline-flex', 'important');
      container.find('.loader').addClass('d-none');
    }
  });
}

function removeFromWishlist(elm, productId) {
  const container = $(elm).closest('.add-to-wishlist');

  // Hide ALL heart buttons and show loader
  getWishlistToggleButtons(container).each(function() {
    this.style.setProperty('display', 'none', 'important');
  });
  container.find('.loader').removeClass('d-none');

  zid.account.removeFromWishlist(productId, { showErrorNotification: true }).then(response => {
    container.find('.loader').addClass('d-none');

    if (location.pathname === '/account-wishlist') {
      location.reload();
      return;
    }

    setWishlistActive(container, false);
  }).catch(error => {
    console.error('Failed to remove from wishlist:', error);
    setWishlistActive(container, true);
    container.find('.loader').addClass('d-none');
  });
}

function shareWishlist() {
  $('.share-wishlist .loader').removeClass('d-none').siblings('.share-icon').addClass('d-none');

  zid.account.shareWishlist({ showErrorNotification: true }).then(async response => {
    if (response) {
      $('.share-wishlist .loader').addClass('d-none').siblings('.share-icon').removeClass('d-none');

      if (response.data.link) {
        try {
          await navigator.clipboard.writeText(response.data.link);
          window.zid?.toaster?.showSuccess(response.data.message);
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      window.zid?.toaster?.showError(response.data.message);
    }
  });
}

/*
    Initialize Cart
*/

/*
    mega-menu
*/
jQuery(document).on('click', '.mega-dropdown', function (e) {
  e.stopPropagation();
});

/*
 slider-filter
 */
$(function () {
  $('#slider-range').slider({
    range: true,
    min: 0,
    max: 500,
    values: [75, 300],
    slide: function (event, ui) {
      $('#amount').val('$' + ui.values[0] + ' - $' + ui.values[1]);
    },
  });
  $('#amount').val(
    '$' + $('#slider-range').slider('values', 0) + ' - $' + $('#slider-range').slider('values', 1)
  );
});

/*
 product-comment-twig show more show less
 */
$('#show-more-content').hide();

$('#show-more').click(function () {
  $('#show-more-content').show(500);
  $('#show-less').show();
  $('#show-more').hide();
});

$('#show-less').click(function () {
  $('#show-more-content').hide(500);
  $('#show-more').show();
  $(this).hide();
});

function displayActivePaymentSessionBar(cart) {
  if (cart.is_reserved) {
    $('.payment-session-bar').removeClass('d-none');
  }
}

function fetchCart() {
  var sideCart = document.getElementById('side-cart');
  var loading = sideCart && sideCart.querySelector('.loading-cart');
  if (loading) loading.classList.remove('d-none');

  zid.cart.get({ showErrorNotification: true }).then(function (response) {
    var cart =
      response && response.data && response.data.cart
        ? response.data.cart
        : response && response.data
          ? response.data
          : response;

    if (!cart) {
      cart = {
        products_count: 0,
        cart_items_quantity: 0,
        totals: [],
        products: [],
      };
    }

    if (cart && (cart.id || cart.cart_items_quantity != null || cart.products_count != null)) {
      setCartTotalAndBadge(cart);
      displayActivePaymentSessionBar(cart);
    }

    if (sideCart && typeof window.renderSideCart === 'function') {
      window.renderSideCart(cart);
    }
  }).finally(function () {
    if (loading) loading.classList.add('d-none');
  });
}

function getCartTotal(cart) {
  if (cart && cart.totals && cart.totals.length > 0) {
    var cartTotalItem = cart.totals.filter(function (total) {
      return total.code === 'total';
    });

    if (cartTotalItem.length > 0) {
      return cartTotalItem[0].value_string;
    }
  }

  return null;
}

function setCartTotalAndBadge(cart) {
  setCartBadge(cart.cart_items_quantity ?? cart.products_count);
  var cartTotal = getCartTotal(cart);

  if (cartTotal) {
    setCartIconTotal(cartTotal);
  }
}

function setCartIconTotal(total) {
  if (parseFloat(total) > 0) {
    $('.cart-header-total').html(total);
  } else {
    $('.cart-header-total').html('');
  }
}

function setCartBadge(badge) {
  if (badge > 0) {
    $('.cart-badge').removeClass('d-none');
    $('.cart-badge').html(badge);
    showGiftCart();
  } else {
    $('.cart-badge').addClass('d-none');
  }
}

function showGiftCart() {
  if (location.pathname !== '/cart/view') {
    $('#tooltip').removeClass('d-none');
    setTimeout(() => {
      $('#tooltip').addClass('d-none');
    }, 3000);
  }
}

function closeSlidingMenu() {
  if (window.slidingMenu && typeof window.slidingMenu.close === 'function') {
    window.slidingMenu.close();
  }
}

function clearFilters() {
  $('.khalab-pl-filter-form input[type="number"], .khalab-pl-filter-form input[type="checkbox"], .form-products-filter input').val('');
  $('.khalab-pl-filter-form input[type="checkbox"], .form-products-filter input[type="checkbox"]').prop('checked', false);
  const cleanURL = window.location.origin + window.location.pathname;
  window.location.href = cleanURL;
}

$('.sm-search-icon').click(function () {
  $('.sm-search-div').toggleClass('show');
});

$('#filters-form-collapse-sm').on('hidden.bs.collapse', function () {
  $('.filters_expanded').removeClass('d-none');
  $('.filters_not_expanded').addClass('d-none');
});

$('#filters-form-collapse-sm').on('shown.bs.collapse', function () {
  $('.filters_expanded').addClass('d-none');
  $('.filters_not_expanded').removeClass('d-none');
});

function getMenuPrev(elm) {
  if (!elm) return null;

  var EPrev = $(elm).prev();

  if (EPrev) {
    if (EPrev.hasClass('d-none')) {
      return getMenuPrev(EPrev);
    } else {
      return EPrev;
    }
  }

  return null;
}

function fixMenu(prevLiElm) {
  var listItems = $('.main-nav > li');

  listItems.each(function (idx, li) {
    if (idx > 3) {
      if (!$(li).hasClass('all-categories') && !$(li).hasClass('d-none')) {
        if ($(li).offset().top - $(li).parent().offset().top > 4) {
          $(li).addClass('d-none');
        } else {
          $(li).removeClass('d-none');
        }
      }
    }
  });

  var elmAllCat = $('.main-nav > li.all-categories');

  if ($(elmAllCat).length) {
    if ($(elmAllCat).offset().top - $(elmAllCat).parent().offset().top > 4) {
      var pElm = null;

      if (prevLiElm) {
        pElm = getMenuPrev(prevLiElm);
      } else {
        pElm = getMenuPrev(elmAllCat);
      }

      $(pElm).addClass('d-none');
      fixMenu(pElm);
    }
  }

  if ($('.main-nav').parent().outerWidth() - $('.main-nav').outerWidth() < 100) {
    $('.main-nav').addClass('justify-content-between');
  } else {
    $('.main-nav').removeClass('justify-content-between');
  }

  if ($('.main-nav-wrapper').length) {
    $('.main-nav-wrapper').removeClass('main-nav-wrapper');
  }
}

$(window).resize(function () {
  fixMenu();
});

$('.search-input-input').on('keyup', function (e) {
  if (e.key === 'Enter' || e.keyCode === 13) {
    window.location.href = '/products?q=' + encodeURI(this.value);
  }
});

//$( document ).ready(function() {
document.addEventListener('DOMContentLoaded', function () {
  fetchCart();
  productsQuestions.checkAddQuestionPossibility();

  /* mobile slide menu */
  window.slidingMenuElement = document.getElementById('sliding-menu');
  window.slidingMenu = new SlideMenu(window.slidingMenuElement, {
    position: window.appDirection === 'ltr' ? 'left' : 'right',
    showBackLink: true,
    backLinkBefore:
      window.appDirection === 'ltr'
        ? '<span class="icon-arrow_left slide-menu-arrow slide-menu-arrow-back"></span>'
        : '<span class="icon-arrow_right slide-menu-arrow slide-menu-arrow-back"></span>',
    submenuLinkAfter:
      window.appDirection === 'ltr'
        ? '<span class="icon-arrow_right slide-menu-arrow"></span>'
        : '<span class="icon-arrow_left slide-menu-arrow"></span>',
  });

  window.slidingMenuElement.addEventListener('sm.open', function () {
    $('body').addClass('sidenav-open');
  });

  window.slidingMenuElement.addEventListener('sm.close', function () {
    $('body').removeClass('sidenav-open');
  });

  $('.search-input-input').on('input', function (event) {
    fetchProductsSearchDebounce(event.currentTarget);
  });

  /* mobile slide menu */
  fixMenu();

  menuFiixedHeader();
});

var fetchProductsSearchDebounce = debounce(function (target) {
  fetchProductsSearch($(target).attr('data-cat-id'), $(target).val());
}, 650);

function fetchProductsSearch(catId, query) {
  if (!query || query.trim().length <= 0) {
    $('.autocomplete-items').html('');

    return;
  }

  zid.products
    .list({
      page_size: 5,
      q: query,
      categories: catId,
    }, {showErrorNotification: true})
    .then(function (response) {
      if (response && response.results) {
        $('.autocomplete-items').html('');

        for (var i = 0; i < response.results.length; i++) {
          var product = response.results[i];

          $('.autocomplete-items').append(
            '<div><a href="' + product.html_url + '">' + product.name + '</a></div>'
          );
        }
      }
    });
}

function debounce(func, wait, immediate) {
  var timeout;

  return function () {
    var context = this,
      args = arguments;

    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function sessionLangCurrencyChange() {
  var currency = $('.select-country option:selected').attr('data-currency');
  var currencySymbol = $('.select-country option:selected').attr('data-currency-symbol');

  $('#input-change-session-currency').val(currency);
  $('#input-change-session-currency-symbol').val(currencySymbol);
}

function addToCartAnimation(cart, imgtodrag) {
  if (imgtodrag && cart) {
    var imgclone = imgtodrag
      .clone()
      .offset({
        top: imgtodrag.offset().top,
        left: imgtodrag.offset().left,
      })
      .css({
        opacity: '0.5',
        position: 'absolute',
        height: '150px',
        width: '150px',
        'z-index': '100',
      })
      .appendTo($('body'))
      .animate(
        {
          top: cart.offset().top + 10,
          left: cart.offset().left + 10,
          width: 75,
          height: 75,
        },
        1000,
        'easeInOutExpo'
      );

    imgclone.animate(
      {
        width: 0,
        height: 0,
      },
      function () {
        $(this).detach();
      }
    );
  }
}

function goBack() {
  if (document.referrer && document.referrer.split('/')[2] === window.location.host) {
    history.go(-1);

    return false;
  } else {
    window.location.href = '/';
  }
}

function scrollToSubMenu(ele) {
  const subMenuElement = ele.querySelector('ul');

  if (subMenuElement) {
    const subMenu = document.getElementById('sliding-menu');
    subMenu.scrollTop = 0;
  }
}

class ProductsQuestions {
  constructor() {
    this.emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    this.customer = window.customer;
    this.customerName = $('#addProductQuestionModal input[name="name"]');
    this.customerEmail = $('#addProductQuestionModal input[name="email"]');
    this.customerQuestion = $('#addProductQuestionModal textarea[name="question"]');
    this.isAnonymous = $('#addProductQuestionModal input[name="is_anonymous"]');
    this.submitButton = $('.btn-submit-new-question');
  }

  isValidEmail() {
    return this.emailRegex.test(this.customerEmail.val());
  }

  showError(inputName) {
    $(`#addProductQuestionModal .input-error-${inputName}`).removeClass('d-none');
    $(
      `#addProductQuestionModal input[name="${inputName}"], textarea[name="${inputName}"]`
    ).addClass('border-danger');
  }

  hideError(inputName) {
    $(`#addProductQuestionModal .input-error-${inputName}`).addClass('d-none');
    $(
      `#addProductQuestionModal input[name="${inputName}"], textarea[name="${inputName}"]`
    ).removeClass('border-danger');
  }

  validateInputs() {
    let isValid = true;

    if (!this.customerQuestion.val().length) {
      this.showError('question');
      isValid = false;
    } else {
      this.hideError('question');
    }

    if (!this.customerEmail.val().length) {
      this.showError('email');
      isValid = false;
    } else {
      this.hideError('email');
    }

    if (this.customerEmail.val().length && !this.isValidEmail()) {
      $('#addProductQuestionModal .input-error-invalid-email').removeClass('d-none');
      $('#addProductQuestionModal input[name="email"]').addClass('border-danger');
      isValid = false;
    } else {
      $('#addProductQuestionModal .input-error-invalid-email').addClass('d-none');
    }

    if (!this.customerName.val().length) {
      this.showError('name');
      isValid = false;
    } else {
      this.hideError('name');
    }

    return isValid;
  }

  fillCustomerData() {
    if (this.customer && this.customer.name && this.customer.email) {
      if (!this.customerName.val()) this.customerName.val(this.customer.name);
      if (!this.customerEmail.val()) this.customerEmail.val(this.customer.email);
    }
  }

  checkAddQuestionPossibility() {
    $('#addQuestionButton').click(function () {
      if (window.customerAuthState && window.customerAuthState.isAuthenticated) {
        $('#addProductQuestionModal').modal('show');
        productsQuestions.fillCustomerData();
      } else {
        // Open login popup without adding redirect_to URL (stays on same page)
        // After login, user can click the button again to open the modal
        handleLoginAction('', false);

        return;
      }
    });
  }

  async submitQuestion(productId) {
    const isValid = this.validateInputs();

    if (isValid) {
      $('.add-review-progress').removeClass('d-none');
      this.submitButton.attr('disabled', true);

      try {
        const response = await zid.products.createQuestion(productId, {
          question: this.customerQuestion.val(),
          name: this.customerName.val(),
          email: this.customerEmail.val(),
          is_anonymous: this.isAnonymous.is(':checked'),
        }, { showErrorNotification: true });

        if (response) {
          window.zid?.toaster?.showSuccess(locales_messages.success);

          $('textarea[name="question"]').val('');
        }
      } catch (error) {
        console.log(error);
      } finally {
        $('.add-review-progress').addClass('d-none');

        $('#addProductQuestionModal').modal('hide');
        this.submitButton.removeAttr('disabled');
      }
    }
  }
}

const productsQuestions = new ProductsQuestions();



function updateUIAfterLogin(customer) {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get('redirect_to');

  if (redirectTo) {
    window.isRedirecting = true;
    window.location.href = redirectTo;
    return;
  }

  if (window.loginFromLoyalty) {
    location.reload();
    return;
  }

  const loyaltySection = document.querySelector('.loyalty-points-section');
  if (loyaltySection && !loyaltySection.classList.contains('loyalty-points-section-d-none')) {
    location.reload();
    return;
  }

  if (window.customerAuthState) {
    window.customerAuthState.isAuthenticated = true;
    window.customerAuthState.isGuest = false;
  }

  window.customer = customer;

  document.dispatchEvent(new CustomEvent('zid-customer-fetched', {
    detail: { customer: customer }
  }));

  const loginBtn = document.getElementById('login-btn');
  const helloBtn = document.getElementById('hello-btn');
  const customerGreeting = document.getElementById('customer-greeting');

  if (loginBtn && helloBtn && customer && customer.name) {
    const greetingText = customerGreeting.textContent.trim();
    const helloWord = greetingText.split(' ')[0];
    customerGreeting.textContent = `${helloWord} ${customer.name}`;
    helloBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';
  }

  const loginBtnAlt = document.getElementById('login-btn-alt');
  const helloBtnAlt = document.getElementById('hello-btn-alt');
  const customerGreetingAlt = document.getElementById('customer-greeting-alt');

  if (loginBtnAlt && helloBtnAlt && customer && customer.name) {
    const greetingTextAlt = customerGreetingAlt.textContent.trim();
    const helloWordAlt = greetingTextAlt.split(' ')[0];
    customerGreetingAlt.textContent = `${helloWordAlt} ${customer.name}`;
    helloBtnAlt.style.display = 'inline-block';
    loginBtnAlt.style.display = 'none';
  }

  document.querySelectorAll('[zid-visible-guest="true"]').forEach(el => {
    el.style.setProperty('display', 'none', 'important');
  });

  document.querySelectorAll('.add-to-wishlist > a.icon-heart-mask').forEach(el => {
    el.style.setProperty('display', 'none', 'important');
  });

  document.querySelectorAll('.add-to-wishlist').forEach(container => {
    const customerSpan = container.querySelector('span:not([zid-visible-guest])');
    if (customerSpan) {
      customerSpan.style.setProperty('display', 'inline-block', 'important');
    }
  });

  document.querySelectorAll('[zid-visible-customer="true"]').forEach(el => {
    el.style.setProperty('display', 'inline-block', 'important');
  });

  const addReviewLink = document.getElementById('add-review-link');
  const addReviewBtn = document.getElementById('add-review-btn');

  if (addReviewLink && addReviewBtn) {
    addReviewLink.classList.add('d-none');
    addReviewBtn.style.display = 'block';
  }

  if (typeof fetchCart === 'function') {
    fetchCart();
  }

  // Fetch wishlist and update button states
  if (window.zid?.account?.wishlists) {
    window.zid.account.wishlists().then(wishlistResponse => {
      let wishlistProductIds = [];

      if (wishlistResponse && wishlistResponse.results && Array.isArray(wishlistResponse.results)) {
        wishlistProductIds = wishlistResponse.results.map(item => item.id);
      } else if (Array.isArray(wishlistResponse)) {
        wishlistProductIds = wishlistResponse;
      }

      if (wishlistProductIds.length > 0) {
        fillWishlistItems(wishlistProductIds.map(id => ({ id: id })));
      }

      document.querySelectorAll('.add-to-wishlist').forEach(container => {
        const productId = container.getAttribute('data-wishlist-id');
        if (!productId) return;
        setWishlistActive($(container), wishlistProductIds.includes(productId));
      });
    }).catch(error => {
      console.error('Failed to fetch wishlist:', error);
    });
  }

  // Retry loop to ensure wishlist visibility (handles race conditions with Zid scripts)
  let retryCount = 0;
  const maxRetries = 10;
  const forceWishlistVisibility = () => {
    document.querySelectorAll('[zid-visible-guest="true"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    document.querySelectorAll('.add-to-wishlist > a.icon-heart-mask').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    document.querySelectorAll('.add-to-wishlist').forEach(container => {
      const customerSpan = container.querySelector('span:not([zid-visible-guest])');
      if (customerSpan) {
        customerSpan.style.setProperty('display', 'inline-block', 'important');
      }
    });

    document.querySelectorAll('[zid-visible-customer="true"]').forEach(el => {
      el.style.setProperty('display', 'inline-block', 'important');
    });
  };

  forceWishlistVisibility();

  const retryInterval = setInterval(() => {
    retryCount++;
    forceWishlistVisibility();

    if (retryCount >= maxRetries) {
      clearInterval(retryInterval);
    }
  }, 100);

  setTimeout(() => {
    const guestElements = document.querySelectorAll('[zid-visible-guest="true"]');
    guestElements.forEach(el => {
      if (window.getComputedStyle(el).display !== 'none') {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    document.querySelectorAll('.add-to-wishlist > a.icon-heart-mask').forEach(el => {
      if (window.getComputedStyle(el).display !== 'none') {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    document.querySelectorAll('.add-to-wishlist').forEach(container => {
      const customerSpan = container.querySelector('span:not([zid-visible-guest])');
      if (customerSpan && window.getComputedStyle(customerSpan).display === 'none') {
        customerSpan.style.setProperty('display', 'inline-block', 'important');
      }
    });

    const customerElements = document.querySelectorAll('[zid-visible-customer="true"]');
    customerElements.forEach(el => {
      if (window.getComputedStyle(el).display === 'none') {
        el.style.setProperty('display', 'inline-block', 'important');
      }
    });
  }, 1500);
}

window.addEventListener('vitrin:auth:success', async event => {

    if (window.zid?.account?.get) {
      try {
        const customerData = await window.zid.account.get();
        if (customerData) {
          // Update UI without reload
          updateUIAfterLogin(customerData);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
      }
  }

  // Fallback to page reload if zid account get fails
  window.location.reload();
});

function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if (!modal) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    document.getElementById('khalab-search-input')?.focus();
  }, 100);
}

function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function submitKhalabSearch(event) {
  event.preventDefault();
  const input = document.getElementById('khalab-search-input');
  const query = input?.value?.trim();

  if (query) {
    window.location.href = `/products?q=${encodeURIComponent(query)}`;
  } else {
    window.location.href = '/products';
  }

  return false;
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSearchModal();
  }
});
