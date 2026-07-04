/**
 * Side Cart (سلة تسوق جانبية) - Render, remove, update qty, coupon
 * Depends: jQuery, Bootstrap 5 Offcanvas, zid.cart API
 */
(function () {
  'use strict';

  var $ = window.jQuery;
  if (!$) return;

  function getSideCartEl() {
    return document.getElementById('side-cart');
  }

  var rtlMode = $('body').hasClass('rtl') || document.documentElement.getAttribute('dir') === 'rtl';

  function getDataLabel(attr, fallback) {
    var el = getSideCartEl();
    var val = el ? el.getAttribute('data-' + attr) : null;
    return (val != null && val !== '') ? val : (fallback != null ? fallback : '');
  }

  function getEmptyText() {
    return getDataLabel('empty', rtlMode ? 'السلة فارغة' : 'Cart is empty');
  }

  function getProductImage(product) {
    var img = '';
    if (product.images && product.images[0]) {
      img = product.images[0].origin || product.images[0].url || (product.images[0].image && product.images[0].image.medium) || '';
    }
    if (!img && product.thumbnail) img = product.thumbnail;
    if (!img && product.image) img = typeof product.image === 'string' ? product.image : (product.image.url || product.image.origin);
    return img || '';
  }

  function getProductUrl(product) {
    return product.url || product.html_url || (product.slug ? '/products/' + product.slug : '#');
  }

  function getProductId(product) {
    return (product.product_id != null ? product.product_id : product.id) + '';
  }

  /** معرف عنصر السلة (UUID) - يُستخدم في DELETE و PATCH لـ /cart/items/{id} */
  function getCartItemId(product) {
    var id = product.id || product.cart_item_id || product.item_id;
    return id != null ? (id + '') : '';
  }

  function buildProductItemHtml(product) {
    var cartItemId = getCartItemId(product);
    var productId = getProductId(product);
    var id = cartItemId || productId;
    var name = (product.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var url = getProductUrl(product);
    var imgSrc = getProductImage(product);
    var qty = Math.max(1, parseInt(product.quantity, 10) || 1);
    var priceStr = product.formatted_price || product.price_formatted || product.price_string || product.value_string || '';
    var totalStr = product.formatted_total || product.total_formatted || product.total_string || product.value_string || priceStr;
    
    var compareStr = product.formatted_compare_at_price || product.compare_at_price_formatted || product.formatted_before_discount_price || product.before_discount_price_formatted || product.compare_at_price_string || '';
    
    var unitPrice = parseFloat(product.price || product.unit_price || 0);
    var compareUnitPrice = parseFloat(product.compare_at_price || product.before_discount_price || 0);
    
    var hasDiscount = (compareUnitPrice > unitPrice && unitPrice > 0) || (compareStr && compareStr !== totalStr && compareStr !== priceStr);

    /* 
       If compareStr is missing but we have numeric values, 
       we might want to show something, but formatting is tricky. 
       Usually Zid provides the formatted string if it's a sale.
    */

    var optionsHtml = '';
    if (product.options && Array.isArray(product.options)) {
      product.options.forEach(function (opt) {
        var optLabel = (opt.name || opt.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var optVal = (opt.value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        optionsHtml += '<div class="cart-product-option-row">' +
          '<span class="cart-product-option-label">' + optLabel + ':</span> ' +
          '<span class="cart-product-option-value">' + optVal + '</span>' +
          '</div>';
      });
    }

    var removeLabel = getDataLabel('remove-label', rtlMode ? 'حذف' : 'Remove');
    var safeCartItemId = (cartItemId || id).replace(/'/g, "\\'");
    
    var itemHtml =
      '<li class="cart-product-row-wrapper" id="cartitem_' + id.replace(/"/g, '') + '" data-cart-item-id="' + (cartItemId || '') + '">' +
        '<div class="cart-product-row">' +
          '<div class="cart-product-col-img">' +
            '<a href="' + url + '" class="cart-product-image-link">' +
              '<img src="' + (imgSrc || '') + '" alt="' + name + '" class="cart-product-image" loading="lazy" onerror="this.style.display=\'none\'">' +
            '</a>' +
          '</div>' +
          '<div class="cart-product-col-details">' +
            '<h1 class="product-title-row"><a href="' + url + '">' + name + '</a></h1>' +
            '<div class="cart-product-prices">' +
              (hasDiscount ? '<span class="cart-product-total-before-price">' + compareStr + '</span>' : '') +
              '<span class="totals">' + totalStr + '</span>' +
            '</div>' +
            '<div class="cart-product-options-wrapper">' + optionsHtml + '</div>' +
            '<div class="cart-products-action">' +
              '<div class="quantity-wrapper">' +
                '<div class="quantity-input-capsule">' +
                  '<button type="button" class="quantity-btn btn-number" data-type="minus" data-field="quantity_' + safeCartItemId + '" aria-label="-">−</button>' +
                  '<input type="number" class="quantity-input input-number" name="quantity_' + safeCartItemId + '" value="' + qty + '" min="1" max="999" readonly>' +
                  '<button type="button" class="quantity-btn btn-number" data-type="plus" data-field="quantity_' + safeCartItemId + '" aria-label="+">+</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cart-product-delete">' +
            '<a href="#" class="khalab-cart-item-remove" onclick="return window.removeItemFromSideCart(\'' + safeCartItemId + '\', this)" aria-label="' + removeLabel + '">' +
              '<svg class="khalab-cart-item-remove-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true">' +
                '<path d="M18 6L6 18M6 6l12 12"/>' +
              '</svg>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</li>';
    return itemHtml;
  }

  function renderProducts(cart, listEl) {
    var products = cart.products || cart.items || cart.cart_products || [];
    if (!Array.isArray(products)) products = [];
    listEl.innerHTML = '';
    products.forEach(function (product) {
      var bundleProducts = product.bundle_products || product.product_x || product.product_y;
      if (bundleProducts && Array.isArray(bundleProducts)) {
        bundleProducts.forEach(function (p) {
          listEl.insertAdjacentHTML('beforeend', buildProductItemHtml(p));
        });
      } else {
        listEl.insertAdjacentHTML('beforeend', buildProductItemHtml(product));
      }
    });
  }

  function renderTotals(cart, listId) {
    var list = document.getElementById(listId);
    if (!list) return;
    var totals = cart.totals || [];
    var html = '';
    totals.forEach(function (t) {
      var code = (t.code || '').toLowerCase();
      var isTotal = code === 'total';
      var valueClass = 'cart-total-value' + (isTotal ? ' cart-total-final' : '');
      var title = (t.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      var valueStr = (t.value_string || t.value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<div class="cart-totals-row-wrapper" data-total-row="' + (t.code || '') + '">' +
        '<div class="flex-grow-1">' + title + '</div>' +
        '<div class="flex-shrink-0 ' + valueClass + '" data-total="' + (t.code || '') + '">' + valueStr + '</div>' +
        '</div>';
    });
    if (!totals.length && (cart.total_string || cart.grand_total)) {
      var totalLabel = getDataLabel('total-label', rtlMode ? 'الإجمالي' : 'Total');
      var totalVal = (cart.total_string || cart.grand_total || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html = '<div class="cart-totals-row-wrapper" data-total-row="total">' +
        '<div class="flex-grow-1">' + totalLabel + '</div>' +
        '<div class="flex-shrink-0 cart-total-value cart-total-final" data-total="total">' + totalVal + '</div>' +
        '</div>';
    }
    list.innerHTML = html;
  }

  /** قراءة قيمة من condition مع دعم snake_case و camelCase (حسب استجابة الـ API) */
  function getCondVal(cond, keys) {
    if (!cond) return '';
    for (var i = 0; i < keys.length; i++) {
      var v = cond[keys[i]];
      if (v != null && v !== '') return typeof v === 'number' ? String(v) : v;
    }
    return '';
  }

  function renderFreeShipping(cart) {
    var wrap = document.getElementById('side-cart-free-shipping');
    if (!wrap) return;

    var rule = cart.free_shipping_rule;
    var cond = rule && rule.subtotal_condition ? rule.subtotal_condition : null;
    var hasRule = rule && (rule.code || cond);
    if (!hasRule || !cond) {
      wrap.classList.add('d-none');
      return;
    }

    var status = (cond.status || cond.Status || 'min_not_reached') + '';
    var pct = parseFloat(cond.products_subtotal_percentage_from_min || cond.productsSubtotalPercentageFromMin);
    if (isNaN(pct)) pct = 0;
    pct = Math.max(0, Math.min(100, pct));

    var remaining = getCondVal(cond, [
      'remaining', 'remaining_to_min_total_formatted', 'remainingToMinTotalFormatted',
      'remaining_to_min_total', 'remainingToMinTotal'
    ]) || '0';

    var minTotal = getCondVal(cond, [
      'min_total_formatted', 'minTotalFormatted', 'min_string', 'minString'
    ]);

    var maxTotal = getCondVal(cond, [
      'max_total_formatted', 'maxTotalFormatted', 'max_string', 'maxString'
    ]);

    var productsSubtotal = getCondVal(cond, [
      'products_subtotal_formatted', 'productsSubtotalFormatted',
      'products_subtotal', 'productsSubtotal'
    ]);

    /* لا نعرض البلوك لو مفيش شرط شحن مجاني فعّال أو مفيش قيم للعرض */
    var hasMessage = status === 'applied' ||
      (status === 'min_not_reached' && (remaining !== '0' || minTotal)) ||
      ((status === 'max_exceed' || status === 'max_exceeded') && (minTotal || maxTotal));
    if (!hasMessage && status === 'min_not_reached' && !minTotal && remaining === '0') {
      wrap.classList.add('d-none');
      return;
    }

    var msgEl = wrap.querySelector('.free-shipping-rule-message');
    var progressContainer = wrap.querySelector('.free-shipping-progress-container');
    var bar = wrap.querySelector('.free-shipping-rule-progress');
    var currentSubtotalEl = wrap.querySelector('.free-shipping-current-subtotal');
    var minTotalEl = wrap.querySelector('.free-shipping-min-total');
    var readMoreEl = wrap.querySelector('.free-shipping-rule-read-more');

    if (currentSubtotalEl) currentSubtotalEl.textContent = productsSubtotal;
    if (minTotalEl) minTotalEl.textContent = minTotal;

    if (bar) {
      var width = (status === 'max_exceeded' || status === 'max_exceed') ? 100 : pct;
      bar.style.width = width + '%';
    }

    if (progressContainer) {
      if (status === 'min_not_reached' || status === 'max_exceeded' || status === 'max_exceed') {
        progressContainer.classList.remove('d-none');
        progressContainer.classList.add('d-flex');
      } else {
        progressContainer.classList.add('d-none');
        progressContainer.classList.remove('d-flex');
      }
    }

    if (readMoreEl) {
      if (status === 'min_not_reached') {
        readMoreEl.classList.remove('d-none');
      } else {
        readMoreEl.classList.add('d-none');
      }
    }

    if (msgEl) {
      if (status === 'min_not_reached') {
        var addTotalTpl = getDataLabel(
          'free-shipping-add-total',
          rtlMode ? 'أضف منتجات بإجمالي %(total)s للحصول على شحن مجاني' : 'Add products with total of %(total)s to get free shipping'
        );
        msgEl.textContent = addTotalTpl.replace('%(total)s', remaining);
      } else if (status === 'max_exceed' || status === 'max_exceeded') {
        var betweenTpl = getDataLabel(
          'free-shipping-between',
          rtlMode
            ? 'ينطبق الشحن المجاني على إجمالي سلة بين %(min)s و %(max)s'
            : 'Free shipping applies for cart total between %(min)s and %(max)s'
        );
        msgEl.textContent = betweenTpl.replace('%(min)s', minTotal).replace('%(max)s', maxTotal);
      } else if (status === 'applied') {
        var appliedTpl = getDataLabel(
          'free-shipping-applied',
          rtlMode ? 'حصلت على شحن مجاني' : 'Free shipping applied'
        );
        msgEl.textContent = appliedTpl;
      } else {
        msgEl.textContent = '';
      }
    }

    wrap.classList.remove('d-none');
  }

  function updateCouponUI(cart) {
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var form = sideCartEl.querySelector('.side-cart-coupon-form-inner');
    var applied = sideCartEl.querySelector('.side-cart-coupon-applied');
    var codeSpan = sideCartEl.querySelector('.side-cart-coupon-code');
    var msgEl = sideCartEl.querySelector('.side-cart-message-coupon');
    if (!form || !applied) return;

    var coupon = cart.coupon || {};
    var hasCoupon = !!(coupon.code || coupon.coupon_code);
    if (hasCoupon) {
      form.classList.add('d-none');
      applied.classList.remove('d-none');
      if (codeSpan) codeSpan.textContent = coupon.code || coupon.coupon_code || '';
      setCouponAccordionExpanded(sideCartEl, true);
    } else {
      form.classList.remove('d-none');
      applied.classList.add('d-none');
      setCouponAccordionExpanded(sideCartEl, false);
    }
    if (msgEl) {
      msgEl.classList.add('d-none');
      msgEl.textContent = '';
    }
  }

  function setCouponAccordionExpanded(sideCartEl, expanded) {
    var toggle = sideCartEl.querySelector('.side-cart-coupon-toggle');
    var content = sideCartEl.querySelector('.side-cart-coupon-content');
    var icon = sideCartEl.querySelector('.side-cart-coupon-toggle-icon');
    if (!toggle || !content) return;

    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    content.classList.toggle('is-expanded', expanded);
    if (icon) icon.textContent = expanded ? '−' : '+';
  }

  function renderSideCart(cart) {
    if (!cart) return;
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var emptyBox = sideCartEl.querySelector('#additional-cart');
    var emptyMsg = sideCartEl.querySelector('.empty-cart-message .empty-cart-text');
    var listEl = sideCartEl.querySelector('.side-cart-items');
    var footer = sideCartEl.querySelector('.footer-side-cart');
    var loading = sideCartEl.querySelector('.loading-cart');

    var count = cart.cart_items_quantity ?? cart.products_count ?? 0;
    var isEmpty = !count || count <= 0;

    if (emptyMsg) emptyMsg.textContent = getEmptyText();
    if (emptyBox) emptyBox.classList.toggle('d-none', !isEmpty);
    if (listEl) {
      listEl.classList.toggle('d-none', isEmpty);
      if (!isEmpty) renderProducts(cart, listEl);
    }
    if (footer) footer.classList.toggle('d-none', isEmpty);
    if (!isEmpty) {
      renderTotals(cart, 'cart-side-totals');
      updateCouponUI(cart);
    }
    renderFreeShipping(cart);
    if (loading) loading.classList.add('d-none');

    // Re-bind quantity buttons
    $(listEl).find('.btn-number').off('click').on('click', function () {
      var btn = $(this);
      var type = btn.data('type');
      var field = btn.data('field');
      var input = sideCartEl && sideCartEl.querySelector('input[name="' + field + '"]');
      if (!input) return;
      var val = parseInt(input.value, 10) || 1;
      if (type === 'plus') val = Math.min(999, val + 1);
      else val = Math.max(1, val - 1);
      input.value = val;
      var cartItemId = (field + '').replace('quantity_', '');
      if (window.updateMiniCartProduct) window.updateMiniCartProduct(cartItemId, val);
    });
  }

  window.renderSideCart = renderSideCart;

  window.removeItemFromSideCart = function (cartItemId, btn) {
    if (!window.zid || !window.zid.cart || !window.zid.cart.removeProduct) return false;
    var $btn = $(btn);
    var origHtml = $btn.html();
    $btn.html('<span class="loader-cart" style="width:18px;height:18px;border-width:2px;display:inline-block;"></span>');
    window.zid.cart.removeProduct({ product_id: cartItemId }, { showErrorNotification: true })
      .then(function () {
        if (window.fetchCart) window.fetchCart();
      })
      .catch(function () {
        $btn.html(origHtml);
      });
    return false;
  };

  window.updateMiniCartProduct = function (cartItemId, quantity) {
    if (!window.zid || !window.zid.cart || !window.zid.cart.updateProduct) return;
    var q = parseInt(quantity, 10);
    if (isNaN(q) || q < 1) return;
    window.zid.cart.updateProduct({ product_id: cartItemId, quantity: q }, { showErrorNotification: true })
      .then(function () {
        if (window.fetchCart) window.fetchCart();
      })
      .catch(function () {
        if (window.zid && window.zid.toaster && window.zid.toaster.showError) {
          window.zid.toaster.showError(getDataLabel('update-quantity-error', rtlMode ? 'فشل تحديث الكمية' : 'Failed to update quantity'));
        }
      });
  };

  window.sendSideCartCoupon = function () {
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var input = sideCartEl.querySelector('.side-cart-coupon-input');
    var applyBtn = sideCartEl.querySelector('.side-cart-coupon-apply');
    var code = input && input.value ? input.value.trim() : '';
    if (!code || !window.zid || !window.zid.cart || !window.zid.cart.applyCoupon) return;
    var $btn = $(applyBtn);
    var textSpan = applyBtn.querySelector('.side-cart-coupon-apply-text');
    var spinner = applyBtn.querySelector('.side-cart-coupon-spinner');
    if ($btn.hasClass('disabled') || (spinner && !spinner.classList.contains('d-none'))) return;
    if (textSpan) textSpan.classList.add('d-none');
    if (spinner) spinner.classList.remove('d-none');
    $btn.addClass('disabled');
    window.zid.cart.applyCoupon({ coupon_code: code }, { showErrorNotification: true })
      .then(function () {
        if (window.fetchCart) window.fetchCart();
        if (window.zid.toaster && window.zid.toaster.showSuccess) window.zid.toaster.showSuccess(getDataLabel('coupon-applied', rtlMode ? 'تم تطبيق الكوبون' : 'Coupon applied'));
      })
      .catch(function () {})
      .finally(function () {
        if (textSpan) textSpan.classList.remove('d-none');
        if (spinner) spinner.classList.add('d-none');
        $btn.removeClass('disabled');
      });
  };

  window.deleteSideCartCoupon = function () {
    if (!window.zid || !window.zid.cart || !window.zid.cart.removeCoupons) return;
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var removeBtn = sideCartEl.querySelector('.side-cart-coupon-remove');
    var spinner = removeBtn && removeBtn.querySelector('.delete-coupon-progress');
    if (spinner) spinner.classList.remove('d-none');
    window.zid.cart.removeCoupons({ showErrorNotification: true })
      .then(function () {
        if (window.fetchCart) window.fetchCart();
      })
      .finally(function () {
        if (spinner) spinner.classList.add('d-none');
      });
  };

  $(document).on('click', '#side-cart .side-cart-coupon-toggle', function () {
    var sideCartEl = getSideCartEl();
    if (!sideCartEl) return;
    var isExpanded = this.getAttribute('aria-expanded') === 'true';
    setCouponAccordionExpanded(sideCartEl, !isExpanded);
  });

  // فتح/إغلاق السلة يدوياً (Bootstrap 4 لا يدعم Offcanvas)
  var backdropId = 'side-cart-backdrop';
  window.openSideCart = function () {
    var el = getSideCartEl();
    if (!el) return;
    if (typeof closeSlidingMenu === 'function') closeSlidingMenu();
    el.classList.add('show');
    document.body.classList.add('side-cart-open');
    var back = document.getElementById(backdropId);
    if (!back) {
      back = document.createElement('div');
      back.id = backdropId;
      back.className = 'side-cart-backdrop';
      back.setAttribute('aria-hidden', 'true');
      document.body.appendChild(back);
      $(back).on('click', function () { window.closeSideCart(); });
    }
    back.classList.add('show');
    var loading = el.querySelector('.loading-cart');
    if (loading) loading.classList.remove('d-none');
    if (window.fetchCart) window.fetchCart();
  };

  window.closeSideCart = function () {
    var el = getSideCartEl();
    if (el && typeof window.bootstrap !== 'undefined' && window.bootstrap.Offcanvas) {
      var offcanvas = window.bootstrap.Offcanvas.getInstance(el);
      if (offcanvas) offcanvas.hide();
    }
    if (el) {
      el.classList.remove('show');
      var list = el.querySelector('.side-cart-items');
      var footer = el.querySelector('.footer-side-cart');
      var loading = el.querySelector('.loading-cart');
      if (list) list.innerHTML = '';
      if (footer) footer.classList.add('d-none');
      if (loading) loading.classList.remove('d-none');
    }
    document.body.classList.remove('side-cart-open');
    var back = document.getElementById(backdropId);
    if (back) back.classList.remove('show');
    document.querySelectorAll('.offcanvas-backdrop').forEach(function (backdrop) {
      backdrop.remove();
    });
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  };

  $(function () {
    var sideCartEl = getSideCartEl();
    if (sideCartEl) {
      var checkMobile = function () {
        if (window.innerWidth <= 576) {
          sideCartEl.classList.add('side-cart-mobile-bottom');
        } else {
          sideCartEl.classList.remove('side-cart-mobile-bottom');
        }
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
    }
  });

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      var el = getSideCartEl();
      if (el && el.classList.contains('show') && typeof window.closeSideCart === 'function') {
        window.closeSideCart();
      }
    }
  });

  // منع الانتقال لصفحة السلة وفتح السلة الجانبية عند النقر على أيقونة السلة
  $(document).on('click', '.a-shopping-cart', function (e) {
    var el = getSideCartEl();
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof closeSlidingMenu === 'function') closeSlidingMenu();
    window.openSideCart();
  });
})();
