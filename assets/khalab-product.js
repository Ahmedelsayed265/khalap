(function () {
  "use strict";

  var COLOR_HEX = {
    أسود: "#2E3326",
    black: "#2E3326",
    أبيض: "#ffffff",
    white: "#ffffff",
    أزرق: "#2563eb",
    blue: "#2563eb",
    برتقالي: "#f97316",
    orange: "#f97316",
    أحمر: "#ef4444",
    red: "#ef4444",
    أخضر: "#22c55e",
    green: "#22c55e",
    رمادي: "#9ca3af",
    gray: "#9ca3af",
    grey: "#9ca3af",
    وردي: "#ec4899",
    pink: "#ec4899",
    بني: "#412C19",
    brown: "#412C19",
    أصفر: "#eab308",
    yellow: "#eab308",
    بنفسجي: "#a855f7",
    purple: "#a855f7",
    كريمي: "#E5E1D3",
    cream: "#E5E1D3",
    "بيج": "#D4D5AC",
    beige: "#D4D5AC",
    زيتي: "#323824",
    olive: "#323824",
    "زيتي غامق": "#2E3326",
    "dark olive": "#2E3326",
    "أخضر زيتي": "#4a5240",
    sage: "#D4D5AC",
  };

  function esc(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function normalizeLabel(text) {
    return String(text || "")
      .replace(/\*/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isColorName(name) {
    var n = String(name || "")
      .toLowerCase()
      .trim();
    return (
      n.indexOf("color") !== -1 ||
      n.indexOf("colour") !== -1 ||
      n.indexOf("لون") !== -1 ||
      n === "اللون"
    );
  }

  function isColorOption(option) {
    if (!option) return false;
    return (
      isColorName(option.name) ||
      isColorName(option.slug) ||
      option.display_type === "color" ||
      option.type === "color"
    );
  }

  function getVariantData() {
    var node = document.getElementById("khalab-product-variant-data");
    if (!node || !node.textContent) return null;
    try {
      return JSON.parse(node.textContent);
    } catch (e) {
      return null;
    }
  }

  function resolveOptionForGroup(group, product) {
    var options = (product && product.options) || [];
    var nativeList = group && group.querySelector("ul");
    var label = group && group.querySelector("label, .product-title, h4");
    var optionId =
      (nativeList && nativeList.getAttribute("data-option-id")) ||
      (label && label.getAttribute("for")) ||
      "";
    var i;

    if (optionId) {
      for (i = 0; i < options.length; i += 1) {
        if (String(options[i].id) === String(optionId)) return options[i];
      }
    }

    if (label) {
      var labelText = normalizeLabel(label.textContent);
      for (i = 0; i < options.length; i += 1) {
        if (normalizeLabel(options[i].name) === labelText) return options[i];
      }
    }
    return null;
  }

  function isColorGroup(group, product) {
    if (group.classList.contains("khalab-pdp-text-option--ready")) return false;
    var option = resolveOptionForGroup(group, product);
    if (option && isColorOption(option)) return true;
    var label = group.querySelector("label, .product-title, h4");
    return !!(label && isColorName(label.textContent));
  }

  function isTextGroup(group, product) {
    if (group.classList.contains("khalab-pdp-color-option--ready"))
      return false;
    if (!group.querySelector("ul, select")) return false;
    return !isColorGroup(group, product);
  }

  function normalizeChoice(choice) {
    if (choice == null) return null;
    if (typeof choice === "string" || typeof choice === "number") {
      var text = String(choice).trim();
      return text ? { id: text, name: text, value: text } : null;
    }
    if (typeof choice !== "object") return null;
    var name = String(
      choice.name || choice.label || choice.title || choice.value || "",
    ).trim();
    var value = String(
      choice.value || choice.name || choice.label || "",
    ).trim();
    var id = choice.id || choice.value_id || value || name;
    if (!id && !name && !value) return null;
    return {
      id: id,
      name: name || value,
      value: value || name,
      color:
        choice.color ||
        choice.hex ||
        choice.color_code ||
        choice.value_code ||
        choice.code,
      image: choice.image || choice.image_url,
    };
  }

  function getChoicesFromList(nativeList) {
    var choices = [];
    nativeList.querySelectorAll("li").forEach(function (li) {
      var name = (
        li.getAttribute("data-value") ||
        li.getAttribute("data-choice") ||
        (li.querySelector("a") && li.querySelector("a").textContent) ||
        li.textContent ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim();
      if (!name) return;
      var choice = normalizeChoice({
        id:
          li.getAttribute("data-choice-id") ||
          li.getAttribute("data-id") ||
          name,
        name: name,
        value: name,
      });
      if (!choice) return;
      var img = li.querySelector("img");
      if (img && img.src) choice.image = img.src;
      choices.push(choice);
    });
    return choices;
  }

  function getOptionChoices(product, option) {
    if (!product || !option) return [];
    if (option.choices && option.choices.length) {
      return option.choices.map(normalizeChoice).filter(Boolean);
    }
    if (option.values && option.values.length) {
      return option.values.map(normalizeChoice).filter(Boolean);
    }
    return [];
  }

  function isValidHex(hex) {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(hex || "").trim());
  }

  function getChoiceHex(choice) {
    var raw = choice && (choice.color || choice.hex || choice.color_code);
    if (isValidHex(raw)) return raw;
    var key = String((choice && (choice.name || choice.value)) || "")
      .toLowerCase()
      .trim();
    return COLOR_HEX[key] || COLOR_HEX[choice && choice.name] || "#6b7280";
  }

  function findVariantForChoice(product, option, choice) {
    var variants = (product && product.variants) || [];
    var i;
    for (i = 0; i < variants.length; i += 1) {
      var variant = variants[i];
      var attrs = variant.attributes || [];
      var j;
      for (j = 0; j < attrs.length; j += 1) {
        var attr = attrs[j];
        if (
          String(attr.option_id || attr.id) === String(option.id) &&
          String(attr.value || attr.name) ===
            String(choice.value || choice.name)
        ) {
          return variant;
        }
      }
    }
    return null;
  }

  function isChoiceActive(product, option, choice, variant) {
    var selected = (product && product.selected_product) || {};
    if (variant && String(selected.id) === String(variant.id)) return true;
    return (selected.attributes || []).some(function (attr) {
      return (
        String(attr.option_id || attr.id) === String(option.id) &&
        String(attr.value || attr.name) === String(choice.value || choice.name)
      );
    });
  }

  function hideNativeList(group, nativeList) {
    nativeList.classList.add("khalab-pdp-variant-native");
    nativeList.hidden = true;
    nativeList.setAttribute("aria-hidden", "true");
    group.classList.add("khalab-pdp-variant-group--ready");
  }

  function proxyClick(nativeList, index) {
    var lis = nativeList.querySelectorAll("li");
    var li = lis[index];
    if (!li) return;
    var link = li.querySelector("a");
    if (link) link.click();
    else li.click();
  }

  function renderColorButton(choice, product, option) {
    var variant = findVariantForChoice(product, option, choice);
    var active = isChoiceActive(product, option, choice, variant);
    var hex = getChoiceHex(choice);
    var label = esc(choice.name || choice.value || "");
    return (
      '<button type="button" class="khalab-pdp-color-swatch' +
      (active ? " is-active" : "") +
      '" data-choice-id="' +
      esc(choice.id) +
      '" aria-pressed="' +
      (active ? "true" : "false") +
      '" aria-label="' +
      label +
      '"><span class="khalab-pdp-color-dot" style="background-color:' +
      esc(hex) +
      '"></span></button>'
    );
  }

  function mountColorGroup(group, product, mountEl) {
    if (group.classList.contains("khalab-pdp-color-option--ready")) {
      syncColorActive(group);
      return;
    }

    var label = group.querySelector("label, .product-title, h4");
    var nativeList = group.querySelector("ul");
    if (!label || !nativeList || !mountEl) return;

    var option = resolveOptionForGroup(group, product);
    if (!option && isColorName(label.textContent)) {
      option = {
        id: nativeList.getAttribute("data-option-id") || "color",
        name: normalizeLabel(label.textContent) || "اللون",
      };
    }
    if (!option) return;

    var choices = getOptionChoices(product, option);
    if (!choices.length) choices = getChoicesFromList(nativeList);
    if (!choices.length) return;

    group.classList.add("khalab-pdp-color-option--ready");
    hideNativeList(group, nativeList);

    var wrap = document.createElement("div");
    wrap.className = "khalab-pdp-color-swatches";
    wrap.setAttribute("role", "list");
    wrap.innerHTML = choices
      .map(function (choice) {
        return renderColorButton(choice, product, option);
      })
      .join("");

    mountEl.appendChild(wrap);

    wrap
      .querySelectorAll(".khalab-pdp-color-swatch")
      .forEach(function (btn, index) {
        btn.addEventListener("click", function (event) {
          event.preventDefault();
          proxyClick(nativeList, index);
          window.setTimeout(function () {
            syncColorActive(group);
            syncColorActiveInMount(mountEl);
          }, 0);
        });
      });

    syncColorActive(group);
    syncColorActiveInMount(mountEl);
  }

  function syncColorActive(group) {
    var nativeList = group.querySelector("ul");
    if (!nativeList) return;
    var lis = nativeList.querySelectorAll("li");
    document
      .querySelectorAll(".khalab-pdp-color-swatch")
      .forEach(function (btn, index) {
        var li = lis[index];
        if (!li) return;
        var active = li.classList.contains("active");
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
  }

  function syncColorActiveInMount(mountEl) {
    var panel = document.querySelector(".khalab-pdp .khalab-variant-panel");
    if (!panel) return;
    var group = panel.querySelector(".khalab-pdp-color-option--ready");
    if (!group) return;
    var nativeList = group.querySelector("ul");
    if (!nativeList || !mountEl) return;
    var lis = nativeList.querySelectorAll("li");
    mountEl
      .querySelectorAll(".khalab-pdp-color-swatch")
      .forEach(function (btn, index) {
        var li = lis[index];
        if (!li) return;
        var active = li.classList.contains("active");
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
  }

  function findVariantGroups(optionsRoot) {
    if (!optionsRoot) return [];
    var groups = optionsRoot.querySelectorAll(
      ":scope > div, :scope > fieldset, :scope > .form-group, :scope > .product-option",
    );
    if (groups.length) return Array.prototype.slice.call(groups);
    return Array.prototype.slice.call(
      optionsRoot.querySelectorAll("div[class*='option'], fieldset"),
    );
  }

  function getGroupLabel(group) {
    var label = group.querySelector("label, .product-title, h4, h5");
    return label ? normalizeLabel(label.textContent) : "";
  }

  function getActiveLabelFromSelect(select) {
    if (!select || !select.options || !select.options.length) return "";
    return (select.options[select.selectedIndex].textContent || "").trim();
  }

  function getActiveLabel(nativeList) {
    if (!nativeList) return "";
    if (nativeList.tagName === "SELECT") {
      return getActiveLabelFromSelect(nativeList);
    }
    var active = nativeList.querySelector("li.active");
    if (!active) return "";
    return (
      active.getAttribute("data-value") ||
      active.getAttribute("data-choice") ||
      (active.querySelector("a") && active.querySelector("a").textContent) ||
      active.textContent ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildVariantPill(labelText, valueText) {
    return (
      '<div class="khalab-pdp-variant-pill">' +
      '<span class="khalab-pdp-variant-pill-label">' +
      esc(labelText) +
      '</span><div class="khalab-pdp-variant-pill-control"><button type="button" class="khalab-pdp-variant-pill-btn" aria-haspopup="listbox" aria-expanded="false">' +
      '<span class="khalab-pdp-variant-pill-caret" aria-hidden="true"></span>' +
      '<span class="khalab-pdp-variant-pill-value">' +
      esc(valueText) +
      '</span></button><ul class="khalab-pdp-variant-pill-menu" role="listbox" hidden></ul></div></div>'
    );
  }

  function mountTextPill(group, product, barEl, nativeControl) {
    if (group.classList.contains("khalab-pdp-text-option--ready")) {
      syncTextPill(group);
      return true;
    }

    var labelText = getGroupLabel(group);
    var nativeList = nativeControl || group.querySelector("ul, select");
    if (!nativeList || !barEl) return false;

    var option = resolveOptionForGroup(group, product);
    if (!option) {
      option = {
        id:
          nativeList.getAttribute("data-option-id") ||
          nativeList.name ||
          "option",
        name: labelText,
      };
    }
    if (isColorOption(option) || isColorName(labelText)) return false;

    var choices = getOptionChoices(product, option);
    if (!choices.length && nativeList.tagName === "SELECT") {
      Array.prototype.forEach.call(nativeList.options, function (opt, index) {
        if (!opt.value && index === 0) return;
        choices.push(
          normalizeChoice({
            id: opt.value || String(index),
            name: opt.textContent.trim(),
            value: opt.value || opt.textContent.trim(),
          }),
        );
      });
    }
    if (!choices.length) choices = getChoicesFromList(nativeList);
    if (!choices.length) return false;

    group.classList.add("khalab-pdp-text-option--ready");
    hideNativeList(group, nativeList);

    var wrapper = document.createElement("div");
    wrapper.innerHTML = buildVariantPill(
      labelText || option.name,
      getActiveLabel(nativeList) || choices[0].name,
    );
    var pill = wrapper.firstElementChild;
    barEl.appendChild(pill);
    pill.__khalabGroup = group;
    pill.__khalabControl = nativeList;

    var menu = pill.querySelector(".khalab-pdp-variant-pill-menu");
    menu.innerHTML = choices
      .map(function (choice, index) {
        return (
          '<li><button type="button" role="option" data-index="' +
          index +
          '">' +
          esc(choice.name || choice.value) +
          "</button></li>"
        );
      })
      .join("");

    var toggle = pill.querySelector(".khalab-pdp-variant-pill-btn");
    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var wasOpen = !menu.hidden;
      closeAllMenus();
      if (!wasOpen) {
        pill.classList.add("is-open");
        menu.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
      }
    });

    menu.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var index = parseInt(btn.getAttribute("data-index"), 10) || 0;
        if (nativeList.tagName === "SELECT") {
          nativeList.selectedIndex = index;
          nativeList.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          proxyClick(nativeList, index);
        }
        pill.querySelector(".khalab-pdp-variant-pill-value").textContent =
          btn.textContent.trim();
        pill.classList.remove("is-open");
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        window.setTimeout(function () {
          syncTextPill(group);
        }, 0);
      });
    });

    return true;
  }

  function syncTextPill(group) {
    var nativeList = group.querySelector("ul, select");
    if (!nativeList) return;
    var value = getActiveLabel(nativeList);
    var bar = document.getElementById("khalab-pdp-variant-bar");
    if (!bar) return;
    bar.querySelectorAll(".khalab-pdp-variant-pill").forEach(function (pill) {
      if (pill.__khalabGroup === group) {
        var val = pill.querySelector(".khalab-pdp-variant-pill-value");
        if (val) val.textContent = value;
      }
    });
  }

  function closeAllMenus() {
    document
      .querySelectorAll(".khalab-pdp-variant-pill-menu")
      .forEach(function (menu) {
        menu.hidden = true;
      });
    document
      .querySelectorAll(".khalab-pdp-variant-pill-btn")
      .forEach(function (btn) {
        btn.setAttribute("aria-expanded", "false");
      });
    document
      .querySelectorAll(".khalab-pdp-variant-pill.is-open")
      .forEach(function (pill) {
        pill.classList.remove("is-open");
      });
  }

  function initVariants(attempt) {
    var panel = document.querySelector(".khalab-pdp .khalab-variant-panel");
    var colorMount = document.getElementById("khalab-pdp-color-mount");
    var variantBar = document.getElementById("khalab-pdp-variant-bar");
    if (!panel) return;

    var optionsRoot = panel.querySelector("#product-variants-options");
    if (!optionsRoot) {
      if ((attempt || 0) < 12) {
        window.setTimeout(function () {
          initVariants((attempt || 0) + 1);
        }, 250);
      }
      return;
    }

    var product = getVariantData();
    var groups = findVariantGroups(optionsRoot);
    var mountedText = 0;
    var mountedColor = 0;

    groups.forEach(function (group, index) {
      group.setAttribute("data-group-id", "g" + index);
      var nativeControl = group.querySelector("ul, select");
      if (!nativeControl) return;

      if (isColorGroup(group, product)) {
        mountColorGroup(group, product, colorMount);
        mountedColor += 1;
        return;
      }
      if (isTextGroup(group, product) && variantBar) {
        if (mountTextPill(group, product, variantBar, nativeControl)) {
          mountedText += 1;
        }
      }
    });

    if (colorMount && !colorMount.querySelector(".khalab-pdp-color-swatches")) {
      colorMount.classList.add("khalab-pdp-color-mount--empty");
    } else if (colorMount) {
      colorMount.classList.remove("khalab-pdp-color-mount--empty");
    }

    if (!optionsRoot.dataset.khalabVariantWatch) {
      optionsRoot.dataset.khalabVariantWatch = "1";
      var observer = new MutationObserver(function () {
        document
          .querySelectorAll(".khalab-pdp-color-option--ready")
          .forEach(syncColorActive);
        var mountEl = document.getElementById("khalab-pdp-color-mount");
        if (mountEl) syncColorActiveInMount(mountEl);
        document
          .querySelectorAll(".khalab-pdp-text-option--ready")
          .forEach(syncTextPill);
        if (
          !optionsRoot.querySelector(
            ".khalab-pdp-text-option--ready, .khalab-pdp-color-option--ready",
          )
        ) {
          initVariants(0);
        }
      });
      observer.observe(optionsRoot, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    if (!mountedText && !mountedColor && (attempt || 0) < 12) {
      window.setTimeout(function () {
        initVariants((attempt || 0) + 1);
      }, 250);
    }
  }

  function getMediaUrl(item, size) {
    if (!item || !item.image) return "";
    if (size === "full") {
      return (
        item.image.full_size || item.image.medium || item.image.small || ""
      );
    }
    return item.image.medium || item.image.full_size || item.image.small || "";
  }

  function rebuildGallery(media, productName) {
    var gallery = document.getElementById("khalab-pdp-gallery");
    if (!gallery) return;

    var mainWrap = document.getElementById("khalab-pdp-gallery-main");
    var thumbsWrap = document.getElementById("khalab-pdp-gallery-thumbs");
    var empty = document.getElementById("khalab-pdp-gallery-empty");
    var shell = gallery.querySelector(".khalab-pdp-gallery-shell");
    var videoIcon = gallery.getAttribute("data-video-icon") || "";
    var items = media || [];

    if (!items.length) {
      if (mainWrap) mainWrap.innerHTML = "";
      if (thumbsWrap) {
        thumbsWrap.innerHTML = "";
        thumbsWrap.classList.add("d-none");
      }
      if (empty) empty.classList.remove("d-none");
      if (shell) shell.classList.add("khalab-pdp-gallery-shell--empty");
      return;
    }

    if (empty) empty.classList.add("d-none");
    if (shell) shell.classList.remove("khalab-pdp-gallery-shell--empty");

    var first = items[0];
    var firstFull = getMediaUrl(first, "full");
    var firstVideo = first.provider && first.link;

    if (mainWrap) {
      mainWrap.innerHTML =
        '<button type="button" class="khalab-pdp-gallery-main-btn" data-gallery-index="0" aria-label="View image">' +
        '<img src="' +
        esc(firstFull) +
        '" alt="' +
        esc(productName || "") +
        '" class="khalab-pdp-gallery-main-img" id="khalab-pdp-main-img" loading="eager">' +
        (firstVideo
          ? '<img class="khalab-pdp-gallery-play" src="' +
            esc(videoIcon) +
            '" alt="" data-video-link="' +
            esc(first.link) +
            '" onclick="event.stopPropagation(); showIframe(this, \'' +
            String(first.link).replace(/'/g, "\\'") +
            "');\">"
          : "") +
        "</button>";
    }

    if (thumbsWrap) {
      if (items.length <= 1) {
        thumbsWrap.classList.add("d-none");
        thumbsWrap.innerHTML = "";
      } else {
        thumbsWrap.classList.remove("d-none");
        thumbsWrap.innerHTML = items
          .slice(0, 4)
          .map(function (item, index) {
            var thumb = getMediaUrl(item, "medium");
            var isVideo = item.provider && item.link;
            return (
              '<button type="button" class="khalab-pdp-gallery-thumb' +
              (index === 0 ? " is-active" : "") +
              '" data-index="' +
              index +
              '" aria-label="Image ' +
              (index + 1) +
              '"><img src="' +
              esc(thumb) +
              '" alt="" loading="' +
              (index === 0 ? "eager" : "lazy") +
              '">' +
              (isVideo
                ? '<img class="khalab-pdp-gallery-thumb-play" src="' +
                  esc(videoIcon) +
                  '" alt="">'
                : "") +
              "</button>"
            );
          })
          .join("");
      }
    }

    bindGalleryThumbs(items, productName, videoIcon);
  }

  function bindGalleryThumbs(media, productName, videoIcon) {
    var mainWrap = document.getElementById("khalab-pdp-gallery-main");
    var thumbsWrap = document.getElementById("khalab-pdp-gallery-thumbs");
    if (!mainWrap || !thumbsWrap) return;

    thumbsWrap
      .querySelectorAll(".khalab-pdp-gallery-thumb")
      .forEach(function (thumb) {
        thumb.addEventListener("click", function () {
          var index = parseInt(thumb.getAttribute("data-index"), 10) || 0;
          var item = media[index];
          if (!item) return;

          thumbsWrap
            .querySelectorAll(".khalab-pdp-gallery-thumb")
            .forEach(function (t) {
              t.classList.remove("is-active");
            });
          thumb.classList.add("is-active");

          var full = getMediaUrl(item, "full");
          var isVideo = item.provider && item.link;
          mainWrap.innerHTML =
            '<button type="button" class="khalab-pdp-gallery-main-btn" data-gallery-index="' +
            index +
            '" aria-label="View image">' +
            '<img src="' +
            esc(full) +
            '" alt="' +
            esc(productName || "") +
            '" class="khalab-pdp-gallery-main-img" id="khalab-pdp-main-img" loading="eager">' +
            (isVideo
              ? '<img class="khalab-pdp-gallery-play" src="' +
                esc(videoIcon) +
                '" alt="" data-video-link="' +
                esc(item.link) +
                '" onclick="event.stopPropagation(); showIframe(this, \'' +
                String(item.link).replace(/'/g, "\\'") +
                "');\">"
              : "") +
            "</button>";
        });
      });
  }

  function initGallery() {
    var gallery = document.getElementById("khalab-pdp-gallery");
    if (!gallery) return;
    var product = getVariantData();
    var media =
      product && product.selected_product && product.selected_product.media
        ? product.selected_product.media
        : [];
    var titleEl = document.querySelector(".khalab-pdp-title");
    bindGalleryThumbs(
      media,
      titleEl ? titleEl.textContent.trim() : "",
      gallery.getAttribute("data-video-icon") || "",
    );
  }

  function initShareToggle() {
    var toggle = document.querySelector("[data-khalab-share-toggle]");
    var panel = document.querySelector("[data-khalab-share-panel]");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", function () {
      var open = panel.classList.contains("d-none");
      panel.classList.toggle("d-none", !open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initSkuCopy() {
    document.querySelectorAll("[data-khalab-copy-sku]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sku = document.querySelector(".khalab-pdp-sku-text");
        if (!sku || !navigator.clipboard) return;
        navigator.clipboard.writeText(sku.textContent.trim());
      });
    });
  }

  function boot() {
    initVariants();
    initGallery();
    initShareToggle();
    initSkuCopy();
    document.addEventListener("click", closeAllMenus);
  }

  window.KhalabProductPage = {
    rebuildGallery: rebuildGallery,
    refreshVariants: function () {
      document
        .querySelectorAll(".khalab-pdp-color-option--ready")
        .forEach(syncColorActive);
      var mountEl = document.getElementById("khalab-pdp-color-mount");
      if (mountEl) syncColorActiveInMount(mountEl);
      document
        .querySelectorAll(".khalab-pdp-text-option--ready")
        .forEach(syncTextPill);
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
