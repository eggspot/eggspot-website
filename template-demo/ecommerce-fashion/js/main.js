/* ============================================
   NORTH & NOBLE — E-commerce Fashion Template
   Cart (localStorage) · variants · filters · motion
   ============================================ */
(function () {
  'use strict';

  var CART_KEY = 'nn_cart';
  var FREE_SHIPPING_THRESHOLD = 7500; // cents ($75.00)
  var MAX_QTY = 99;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------
     Utilities
  --------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function money(cents) {
    return '$' + (Number(cents) / 100).toFixed(2);
  }

  function clampQty(value) {
    var n = parseInt(value, 10);
    if (!isFinite(n) || n < 1) return 1;
    return Math.min(n, MAX_QTY);
  }

  /* Toast ------------------------------------- */
  var toastEl = $('.toast');
  var toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* Reveal observer --------------------------- */
  function observeOnce(elements) {
    if (!elements.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay'), 10);
        if (delay > 0) {
          el.style.transitionDelay = delay + 'ms';
          // drop the delay once the reveal is done, otherwise every later
          // transition on this element (card hover) inherits it too
          var clearDelay = function () {
            el.style.transitionDelay = '';
            clearTimeout(fallback);
          };
          var fallback = setTimeout(clearDelay, delay + 1400);
          el.addEventListener('transitionend', clearDelay, { once: true });
        }
        el.classList.add('visible');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(function (el) { io.observe(el); });
  }

  /* Demo form binding ------------------------- */
  function bindDemoForm(form, message) {
    if (!form) return;
    // the note sits inside the form, or next to it when the form is a flex row
    var note = $('.form-note', form) || (form.parentNode ? $('.form-note', form.parentNode) : null);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // novalidate is set on every demo form, so nothing stops an empty submit
      // unless we check here. An unticked checkbox still reports value "on",
      // so it needs .checked rather than the value test the text fields use.
      var missing = null;
      $$('[required]', form).some(function (field) {
        var empty = field.type === 'checkbox'
          ? !field.checked
          : !String(field.value).trim();
        if (empty) missing = field;
        return empty;
      });
      if (missing) {
        // A missing consent tick is a different problem from a blank field —
        // saying which one is missing saves the reader hunting for it.
        var text = missing.name === 'consent'
          ? 'Please agree to the Privacy Policy before sending.'
          : 'Please fill in all required fields.';
        if (note) note.textContent = text;
        showToast(text);
        if (typeof missing.focus === 'function') missing.focus();
        return;
      }
      if (note) note.textContent = message;
      showToast(message);
      form.reset();
    });
  }

  /* Radio-style button group (filter / sort / variant) */
  function initRadioGroup(group, onChange) {
    if (!group) return;
    var buttons = $$('button[data-value]', group);
    if (!buttons.length) return;
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-value]');
      if (!btn || !group.contains(btn)) return;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      if (typeof onChange === 'function') onChange(btn.getAttribute('data-value'), btn);
    });
  }

  /* ---------------------------------------------
     Cart state (localStorage)
  --------------------------------------------- */
  function isValidLine(line) {
    return !!line
      && typeof line.handle === 'string' && line.handle
      && typeof line.title === 'string' && line.title
      && isFinite(line.price) && line.price >= 0
      && isFinite(line.qty) && line.qty > 0;
  }

  function normalizeLine(line) {
    return {
      handle: String(line.handle),
      title: String(line.title),
      price: Math.round(Number(line.price)),
      size: line.size ? String(line.size) : 'One Size',
      color: line.color ? String(line.color) : '—',
      qty: clampQty(line.qty),
      img: typeof line.img === 'string' ? line.img : '',
      variantId: line.variantId ? String(line.variantId) : ''
    };
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidLine).map(normalizeLine);
    } catch (err) {
      console.warn('Cart could not be read:', err);
      return [];
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Cart could not be saved:', err);
      showToast('Your browser blocked cart storage');
    }
    updateBadge(cart);
  }

  function cartCount(cart) {
    return cart.reduce(function (sum, line) { return sum + line.qty; }, 0);
  }

  function cartSubtotal(cart) {
    return cart.reduce(function (sum, line) { return sum + line.price * line.qty; }, 0);
  }

  function updateBadge(cart) {
    var count = cartCount(cart || readCart());
    $$('[data-cart-count]').forEach(function (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  }

  function addToCart(line) {
    if (!isValidLine(line)) {
      showToast('Sorry, this item could not be added');
      return;
    }
    var item = normalizeLine(line);
    var cart = readCart();
    var existing = cart.filter(function (l) {
      return l.handle === item.handle && l.size === item.size && l.color === item.color;
    })[0];
    if (existing) {
      existing.qty = clampQty(existing.qty + item.qty);
    } else {
      cart.push(item);
    }
    writeCart(cart);
    showToast('Added to cart ✓');
  }

  /* ---------------------------------------------
     Preloader
  --------------------------------------------- */
  function initPreloader() {
    var preloader = $('.preloader');
    if (!preloader) return;
    var removed = false;
    function dismiss() {
      if (removed) return;
      removed = true;
      preloader.classList.add('done');
      setTimeout(function () {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 700);
    }
    window.addEventListener('load', function () { setTimeout(dismiss, 350); });
    setTimeout(dismiss, 3500); // fallback if load never fires
  }

  /* ---------------------------------------------
     Header: scroll state, mobile menu, search
  --------------------------------------------- */
  function initHeader() {
    var header = $('.site-header');
    var nav = $('#nav');
    var toggle = $('#navToggle');
    var searchToggle = $('#searchToggle');
    var searchPanel = $('#searchPanel');

    if (header) {
      window.addEventListener('scroll', function () {
        header.classList.toggle('scrolled', window.pageYOffset > 10);
      }, { passive: true });
    }

    function closeMenu() {
      if (!nav || !toggle) return;
      nav.classList.remove('open');
      document.body.classList.remove('menu-open', 'no-scroll');
      toggle.setAttribute('aria-expanded', 'false');
    }

    if (nav && toggle) {
      toggle.addEventListener('click', function () {
        var open = !nav.classList.contains('open');
        nav.classList.toggle('open', open);
        document.body.classList.toggle('menu-open', open);
        document.body.classList.toggle('no-scroll', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
      $$('a', nav).forEach(function (link) {
        link.addEventListener('click', closeMenu);
      });
    }

    if (searchToggle && searchPanel) {
      searchToggle.addEventListener('click', function () {
        var open = !searchPanel.classList.contains('open');
        searchPanel.classList.toggle('open', open);
        searchToggle.setAttribute('aria-expanded', String(open));
        if (open) {
          var input = $('input', searchPanel);
          if (input) input.focus();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeMenu();
      if (searchPanel && searchPanel.classList.contains('open')) {
        searchPanel.classList.remove('open');
        if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
      }
    });

    $$('.search-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = $('input', form);
        var term = input ? input.value.trim() : '';
        showToast(term ? 'Search is a demo — no results for "' + term + '"' : 'Type something to search');
      });
    });
  }

  /* ---------------------------------------------
     Demo-only controls (account, size guide, …)
  --------------------------------------------- */
  function initDemoToasts() {
    $$('[data-demo-toast]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        showToast(el.getAttribute('data-demo-toast'));
      });
    });
  }

  /* ---------------------------------------------
     Hero parallax (clamped, never detaches)
  --------------------------------------------- */
  function initParallax() {
    var hero = $('.hero');
    var bg = $('.hero-bg');
    if (!hero || !bg || reducedMotion) return;
    // 0.096 = 80% of the 0.12 slack the -12% inset gives us, so the image never
    // exposes an edge. Measured once per layout, not per scroll event.
    var overhang = hero.offsetHeight * 0.096;
    window.addEventListener('scroll', function () {
      var offset = Math.min(window.pageYOffset * 0.3, overhang);
      bg.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    }, { passive: true });

    // a shorter viewport means a shorter hero: re-measure or the clamp goes stale
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        overhang = hero.offsetHeight * 0.096;
      }, 200);
    }, { passive: true });
  }

  /* ---------------------------------------------
     Back to top
  --------------------------------------------- */
  function initToTop() {
    var btn = $('.to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', window.pageYOffset > 500);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------
     Accordion (product tabs, FAQ)
  --------------------------------------------- */
  function initAccordions() {
    $$('.acc-trigger').forEach(function (trigger) {
      var panel = $('#' + trigger.getAttribute('aria-controls'));
      if (!panel) return;
      trigger.addEventListener('click', function () {
        var expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
      });
    });
  }

  /* ---------------------------------------------
     Counters (about stats)
  --------------------------------------------- */
  function initCounters() {
    var counters = $$('[data-count]');
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (!isFinite(target)) return;
      if (reducedMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      var start = performance.now();
      var duration = 1500;
      function step(now) {
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------
     Product cards: quick add
  --------------------------------------------- */
  function lineFromCard(card, variantId) {
    var img = $('.product-media img', card);
    var nameEl = $('.product-name', card);
    var priceEl = $('.price', card);
    return {
      handle: card.getAttribute('data-handle') || '',
      title: nameEl ? nameEl.textContent.trim() : '',
      price: parseInt(priceEl ? priceEl.getAttribute('data-price') : '', 10),
      size: card.getAttribute('data-size') || 'One Size',
      color: card.getAttribute('data-color') || '—',
      qty: 1,
      img: img ? img.getAttribute('src') : '',
      variantId: variantId || ''
    };
  }

  function initQuickAdd() {
    $$('.quick-view').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var card = btn.closest('.product-card');
        if (!card) return;
        addToCart(lineFromCard(card, btn.getAttribute('data-variant-id')));
      });
    });
  }

  /* ---------------------------------------------
     Collection page: filter + sort
  --------------------------------------------- */
  function initCollection() {
    var grid = $('#productGrid');
    if (!grid) return;
    var cards = $$('.product-card', grid);
    var filterBar = $('#filterBar');
    var sortSelect = $('#sortSelect');
    var countEl = $('#resultCount');
    var emptyEl = $('#emptyResults');
    var activeFilter = 'all';

    cards.forEach(function (card, index) { card.setAttribute('data-order', String(index)); });

    function apply(animate) {
      var motion = animate && !reducedMotion;
      var visible = 0;
      cards.forEach(function (card) {
        var match = activeFilter === 'all' || card.getAttribute('data-category') === activeFilter;
        var wasVisible = !card.hidden;
        card.classList.remove('filter-pop', 'filter-out');
        if (match) {
          visible++;
          card.hidden = false;
          if (motion) {
            void card.offsetWidth; // reflow so the animation restarts every time
            card.classList.add('filter-pop');
          }
        } else if (motion && wasVisible) {
          void card.offsetWidth;
          card.classList.add('filter-out');
          setTimeout(function () {
            // a later filter change may have re-shown this card — only hide if still filtered out
            if (card.classList.contains('filter-out')) card.hidden = true;
          }, 220);
        } else {
          card.hidden = true;
        }
      });
      if (countEl) countEl.textContent = visible + (visible === 1 ? ' product' : ' products');
      if (emptyEl) emptyEl.hidden = visible > 0;
    }

    function sortCards(mode) {
      var sorted = cards.slice().sort(function (a, b) {
        var pa = parseInt(a.getAttribute('data-price'), 10) || 0;
        var pb = parseInt(b.getAttribute('data-price'), 10) || 0;
        if (mode === 'price-asc') return pa - pb;
        if (mode === 'price-desc') return pb - pa;
        if (mode === 'newest') {
          return (parseInt(b.getAttribute('data-added'), 10) || 0) - (parseInt(a.getAttribute('data-added'), 10) || 0);
        }
        return (parseInt(a.getAttribute('data-order'), 10) || 0) - (parseInt(b.getAttribute('data-order'), 10) || 0);
      });
      sorted.forEach(function (card) { grid.appendChild(card); });
      apply(true);
    }

    initRadioGroup(filterBar, function (value) {
      activeFilter = value;
      apply(true);
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', function () { sortCards(sortSelect.value); });
    }

    // first pass must not animate — it would override the scroll-reveal state
    apply(false);
  }

  /* ---------------------------------------------
     Product page: gallery + variants + add to cart
  --------------------------------------------- */
  function initProductGallery() {
    var main = $('.gallery-main');
    if (!main) return;
    var images = $$('img', main);
    var thumbs = $$('.thumb');
    var index = 0;
    if (!images.length) return;

    function show(next) {
      index = (next + images.length) % images.length;
      images.forEach(function (img, i) { img.classList.toggle('active', i === index); });
      thumbs.forEach(function (thumb, i) { thumb.setAttribute('aria-pressed', String(i === index)); });
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { show(i); });
    });
    var prev = $('.gallery-prev');
    var next = $('.gallery-next');
    if (prev) prev.addEventListener('click', function () { show(index - 1); });
    if (next) next.addEventListener('click', function () { show(index + 1); });
    show(0);
  }

  function initProductForm() {
    var form = $('#productForm');
    if (!form) return;

    var state = {
      size: form.getAttribute('data-default-size') || 'M',
      color: form.getAttribute('data-default-color') || ''
    };
    var qtyInput = $('#productQty', form);

    initRadioGroup($('#sizeGroup', form), function (value) {
      state.size = value;
      var label = $('#selectedSize');
      if (label) label.textContent = value;
    });

    initRadioGroup($('#colorGroup', form), function (value) {
      state.color = value;
      var label = $('#selectedColor');
      if (label) label.textContent = value;
    });

    $$('[data-qty-step]', form).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!qtyInput) return;
        var step = parseInt(btn.getAttribute('data-qty-step'), 10) || 0;
        qtyInput.value = String(clampQty(parseInt(qtyInput.value, 10) + step));
      });
    });
    if (qtyInput) {
      qtyInput.addEventListener('change', function () {
        qtyInput.value = String(clampQty(qtyInput.value));
      });
    }

    function currentLine(variantId) {
      var priceEl = $('.price', form);
      var activeImg = $('.gallery-main img.active') || $('.gallery-main img');
      return {
        handle: form.getAttribute('data-handle') || '',
        title: form.getAttribute('data-title') || '',
        price: parseInt(priceEl ? priceEl.getAttribute('data-price') : form.getAttribute('data-price'), 10),
        size: state.size,
        color: state.color,
        qty: qtyInput ? clampQty(qtyInput.value) : 1,
        img: activeImg ? activeImg.getAttribute('src') : '',
        variantId: variantId || form.getAttribute('data-variant-id') || ''
      };
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      addToCart(currentLine($('#addToCart') ? $('#addToCart').getAttribute('data-variant-id') : ''));
    });

    var buyNow = $('#buyNow', form);
    if (buyNow) {
      buyNow.addEventListener('click', function () {
        addToCart(currentLine(buyNow.getAttribute('data-variant-id')));
        showToast('Checkout is a demo — item added to cart');
      });
    }
  }

  /* ---------------------------------------------
     Cart page
  --------------------------------------------- */
  function initCartPage() {
    var root = $('#cartRoot');
    if (!root) return;
    var linesEl = $('#cartLines');
    var emptyEl = $('#cartEmpty');
    var contentEl = $('#cartContent');
    var subtotalEl = $('#cartSubtotal');
    var totalEl = $('#cartTotal');
    var progressEl = $('#shipProgress');
    var progressBar = $('#shipBar');
    var progressText = $('#shipText');

    function buildLine(line, index) {
      var wrap = document.createElement('div');
      wrap.className = 'cart-line';
      wrap.setAttribute('data-handle', line.handle);

      var media = document.createElement('div');
      media.className = 'cart-line-media';
      if (line.img) {
        var img = document.createElement('img');
        img.src = line.img;
        img.alt = line.title;
        img.loading = 'lazy';
        media.appendChild(img);
      }

      var info = document.createElement('div');
      info.className = 'cart-line-info';
      var title = document.createElement('p');
      title.className = 'cart-line-title';
      title.textContent = line.title;
      var variant = document.createElement('p');
      variant.className = 'cart-line-variant';
      variant.textContent = line.color + ' · Size ' + line.size;
      var unit = document.createElement('p');
      unit.className = 'cart-line-unit';
      unit.textContent = money(line.price) + ' each';
      info.appendChild(title);
      info.appendChild(variant);
      info.appendChild(unit);

      var qtyWrap = document.createElement('div');
      qtyWrap.className = 'cart-line-qty';
      var qty = document.createElement('div');
      qty.className = 'qty-control';
      var minus = document.createElement('button');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Decrease quantity of ' + line.title);
      minus.setAttribute('data-line-step', '-1');
      minus.setAttribute('data-index', String(index));
      minus.textContent = '−';
      var input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = String(MAX_QTY);
      input.value = String(line.qty);
      input.name = 'updates[]';
      input.setAttribute('data-index', String(index));
      input.setAttribute('aria-label', 'Quantity for ' + line.title);
      var plus = document.createElement('button');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Increase quantity of ' + line.title);
      plus.setAttribute('data-line-step', '1');
      plus.setAttribute('data-index', String(index));
      plus.textContent = '+';
      qty.appendChild(minus);
      qty.appendChild(input);
      qty.appendChild(plus);
      qtyWrap.appendChild(qty);

      var total = document.createElement('p');
      total.className = 'cart-line-total';
      total.textContent = money(line.price * line.qty);

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'line-remove';
      remove.setAttribute('data-remove', String(index));
      remove.setAttribute('aria-label', 'Remove ' + line.title + ' from cart');
      remove.textContent = '✕';

      wrap.appendChild(media);
      wrap.appendChild(info);
      wrap.appendChild(qtyWrap);
      wrap.appendChild(total);
      wrap.appendChild(remove);
      return wrap;
    }

    function renderProgress(subtotal) {
      if (!progressEl || !progressBar || !progressText) return;
      var reached = subtotal >= FREE_SHIPPING_THRESHOLD;
      var pct = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
      progressBar.style.width = pct.toFixed(1) + '%';
      progressEl.classList.toggle('reached', reached);
      progressText.textContent = reached
        ? 'You have earned free shipping.'
        : 'You are ' + money(FREE_SHIPPING_THRESHOLD - subtotal) + ' away from free shipping.';
    }

    function render() {
      var cart = readCart();
      updateBadge(cart);
      var hasItems = cart.length > 0;
      if (emptyEl) emptyEl.hidden = hasItems;
      if (contentEl) contentEl.hidden = !hasItems;
      if (!linesEl) return;

      linesEl.textContent = '';
      cart.forEach(function (line, index) { linesEl.appendChild(buildLine(line, index)); });

      var subtotal = cartSubtotal(cart);
      if (subtotalEl) subtotalEl.textContent = money(subtotal);
      if (totalEl) totalEl.textContent = money(subtotal);
      renderProgress(subtotal);
    }

    function mutate(index, updater) {
      var cart = readCart();
      if (index < 0 || index >= cart.length) return;
      updater(cart, index);
      writeCart(cart);
      render();
    }

    root.addEventListener('click', function (e) {
      var stepBtn = e.target.closest('[data-line-step]');
      if (stepBtn) {
        var step = parseInt(stepBtn.getAttribute('data-line-step'), 10) || 0;
        var steppedToZero = false;
        mutate(parseInt(stepBtn.getAttribute('data-index'), 10), function (cart, i) {
          var next = cart[i].qty + step;
          if (next < 1) { cart.splice(i, 1); steppedToZero = true; return; }
          cart[i].qty = clampQty(next);
        });
        // stepping below 1 removes the line — say so, same as the ✕ button
        if (steppedToZero) showToast('Item removed');
        return;
      }
      var removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) {
        mutate(parseInt(removeBtn.getAttribute('data-remove'), 10), function (cart, i) {
          cart.splice(i, 1);
        });
        showToast('Item removed');
      }
    });

    root.addEventListener('change', function (e) {
      var input = e.target.closest('input[name="updates[]"]');
      if (!input) return;
      mutate(parseInt(input.getAttribute('data-index'), 10), function (cart, i) {
        cart[i].qty = clampQty(input.value);
      });
    });

    var cartForm = $('.cart-form', root);
    if (cartForm) {
      cartForm.addEventListener('submit', function (e) { e.preventDefault(); });
    }

    var checkout = $('#checkoutBtn');
    if (checkout) {
      checkout.addEventListener('click', function (e) {
        e.preventDefault();
        showToast('Checkout is a demo');
      });
    }

    render();
  }

  /* ---------------------------------------------
     Cookie consent
  --------------------------------------------- */
  /* Nothing on this site loads analytics or a tracking cookie, so the bar only
     records what the reader picked. If a measurement script is added later it
     must wait for localStorage 'gdpr-consent' to read 'accept' before loading. */
  function initGdpr() {
    var banner = $('.gdpr-banner');
    if (!banner) return;

    var KEY = 'gdpr-consent';
    var choice = null;
    // Private mode and blocked-cookie settings throw on read as well as write,
    // so swallow it — an unusable store must not take the page down with it.
    try { choice = window.localStorage.getItem(KEY); } catch (e) {}
    if (choice) return;

    banner.hidden = false;

    $$('[data-gdpr]', banner).forEach(function (btn) {
      btn.addEventListener('click', function () {
        try { window.localStorage.setItem(KEY, btn.getAttribute('data-gdpr')); } catch (e) {}
        banner.hidden = true;
      });
    });
  }

  /* ---------------------------------------------
     Boot
  --------------------------------------------- */
  function init() {
    initPreloader();
    initHeader();
    initDemoToasts();
    initParallax();
    initToTop();
    initAccordions();
    initCounters();
    initQuickAdd();
    initCollection();
    initProductGallery();
    initProductForm();
    initCartPage();
    observeOnce($$('.reveal'));
    updateBadge();

    bindDemoForm($('#newsletterForm'), 'Thanks — you are on the list ✓');
    bindDemoForm($('#contactForm'), 'Message sent — we reply within 1 business day ✓');
    initGdpr();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
