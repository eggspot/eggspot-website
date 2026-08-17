/* ============================================
   TALON & WHISKER — Custom Pet ID Tags
   Live engraving preview · cart (localStorage) · filters · motion
   ============================================ */
(function () {
  'use strict';

  var CART_KEY = 'tw_cart';
  var FREE_SHIPPING_THRESHOLD = 3500; // cents ($35.00)
  var MAX_QTY = 99;
  var MAX_LINE1 = 12;
  /* Line 2 is the phone number and the tag is final sale: 16 fits a full
     '+1 512-555-0162' (15) without silently clipping the last digit. */
  var MAX_LINE2 = 16;
  /* Laser bed only reproduces this set (Latin letters incl. accents, digits and a
     few marks) — anything else is dropped as it is typed, so what the customer
     sees in the preview is exactly what gets engraved. */
  var ENGRAVABLE = /[^A-Za-z0-9À-ÖØ-öø-ÿ .,'&+()#/-]/g;

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

  /* Drops characters the laser cannot cut and enforces the length budget.
     Edge whitespace survives here so the field stays typeable: stripping the
     space in 'Buddy ' on every keystroke would block 'Buddy Bear'. */
  function stripUnengravable(value, maxLength) {
    return String(value == null ? '' : value)
      .replace(ENGRAVABLE, '')
      .replace(/\s{2,}/g, ' ')
      .slice(0, maxLength);
  }

  /* Canonical engraving: what the preview draws, what the cart stores and what
     the merge key compares. Edge whitespace never reaches the metal, so
     'Buddy ' and 'Buddy' are the same tag and must merge into one line. */
  function cleanEngraving(value, maxLength) {
    return stripUnengravable(value, maxLength).replace(/^\s+|\s+$/g, '');
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

  /* Collapses a burst of calls (a keystroke run) into one paint-aligned update. */
  function rafDebounce(fn) {
    var frame = null;
    return function () {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        frame = null;
        fn();
      });
    };
  }

  /* Plays a one-shot CSS animation and takes the class back off, so the same
     class can fire again on the next swap. */
  function playOnce(el, className) {
    if (!el || reducedMotion) return;
    el.classList.remove(className);
    void el.getBoundingClientRect(); // reflow: restart the animation on repeat swaps
    el.classList.add(className);
    var clear = function () {
      el.classList.remove(className);
      el.removeEventListener('animationend', clear);
    };
    el.addEventListener('animationend', clear);
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
          var clearDelay = function (e) {
            // transitions bubble: a child finishing early must not strip the
            // delay before this element has finished revealing. `once` cannot
            // be used here — it would burn the listener on that child event.
            if (e && e.target !== el) return;
            el.style.transitionDelay = '';
            clearTimeout(fallback);
            el.removeEventListener('transitionend', clearDelay);
          };
          var fallback = setTimeout(clearDelay, delay + 1400);
          el.addEventListener('transitionend', clearDelay);
        }
        el.classList.add('visible');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(function (el) { io.observe(el); });
  }

  /* Demo form binding ------------------------- */
  /* Deliberately loose: one @ with something either side and a dotted host.
     Anything stricter rejects addresses that are actually deliverable. */
  var EMAIL_RE = /^\S+@\S+\.\S+$/;

  function isEmailField(field) {
    return field.type === 'email' || /email/i.test(field.name || '') || /email/i.test(field.id || '');
  }

  function bindDemoForm(form, message) {
    if (!form) return;
    // the note sits inside the form, or next to it when the form is a flex row
    var note = $('.form-note', form) || (form.parentNode ? $('.form-note', form.parentNode) : null);

    function fail(text, field) {
      if (note) note.textContent = text;
      showToast(text);
      if (field) field.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('[required]', form);
      var missing = fields.some(function (field) {
        return !String(field.value).trim();
      });
      if (missing) {
        fail('Please fill in all required fields.');
        return;
      }
      // the forms carry novalidate, so the browser never checks this for us
      var badEmail = fields.filter(isEmailField).filter(function (field) {
        return !EMAIL_RE.test(String(field.value).trim());
      })[0];
      if (badEmail) {
        fail('Please enter a valid email address.', badEmail);
        return;
      }
      if (note) note.textContent = message;
      showToast(message);
      form.reset();
    });
  }

  /* Radio-style button group (filter / sort / engraving options) */
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
  /* Single source of truth for a cart line. Engraving fields ride along as
     line item properties — the same shape Shopify expects at checkout. */
  function makeLine(data) {
    var source = data || {};
    return {
      handle: String(source.handle || ''),
      title: String(source.title || ''),
      price: Math.round(Number(source.price)),
      size: source.size ? String(source.size) : 'Small',
      metal: source.metal ? String(source.metal) : 'Brass',
      shape: source.shape ? String(source.shape) : 'Circle',
      line1: cleanEngraving(source.line1, MAX_LINE1),
      line2: cleanEngraving(source.line2, MAX_LINE2),
      qty: clampQty(source.qty),
      img: typeof source.img === 'string' ? source.img : ''
    };
  }

  function isValidLine(line) {
    return !!line
      && typeof line.handle === 'string' && line.handle
      && typeof line.title === 'string' && line.title
      && isFinite(line.price) && line.price >= 0
      && isFinite(line.qty) && line.qty > 0;
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidLine).map(makeLine);
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

  /* The badge growing by one IS the confirmation that the tag was added — it
     replaces the success toast, so nothing has to be read or dismissed. */
  function bumpBadge() {
    $$('[data-cart-count]').forEach(function (badge) {
      if (!badge.hidden) playOnce(badge, 'bump');
    });
  }

  function addToCart(data) {
    var item = makeLine(data);
    if (!isValidLine(item)) {
      showToast('Sorry, this item could not be added');
      return false;
    }
    var cart = readCart();
    // two tags only merge when every engraved detail matches
    var existing = cart.filter(function (l) {
      return l.handle === item.handle && l.size === item.size && l.metal === item.metal
        && l.shape === item.shape && l.line1 === item.line1 && l.line2 === item.line2;
    })[0];
    if (existing) {
      existing.qty = clampQty(existing.qty + item.qty);
    } else {
      cart.push(item);
    }
    writeCart(cart);
    bumpBadge();
    return true;
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

    /* The button turns into the close (✕) control while the overlay is open,
       so its name has to follow the state, not just aria-expanded. */
    function setMenuState(open) {
      nav.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      document.body.classList.toggle('no-scroll', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    function closeMenu() {
      if (!nav || !toggle) return;
      setMenuState(false);
    }

    if (nav && toggle) {
      toggle.addEventListener('click', function () {
        setMenuState(!nav.classList.contains('open'));
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
     Demo-only controls (account, sizing help, …)
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
     Product page: gallery
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

  /* ---------------------------------------------
     Engraving studio: live SVG preview + add to cart
  --------------------------------------------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* Every shape carries its own geometry: the silhouette parts, where the
     split-ring hole sits, and the safe area the engraved lines may use. */
  var SHAPES = {
    circle: {
      label: 'Circle',
      parts: [{ tag: 'circle', attrs: { cx: 120, cy: 126, r: 94 } }],
      hole: { cx: 120, cy: 56, r: 10 },
      textX: 120, line1Y: 134, line2Y: 174, maxWidth: 142
    },
    bone: {
      label: 'Bone',
      parts: [
        { tag: 'rect', attrs: { x: 48, y: 80, width: 144, height: 80, rx: 20 } },
        { tag: 'circle', attrs: { cx: 56, cy: 84, r: 32 } },
        { tag: 'circle', attrs: { cx: 56, cy: 156, r: 32 } },
        { tag: 'circle', attrs: { cx: 184, cy: 84, r: 32 } },
        { tag: 'circle', attrs: { cx: 184, cy: 156, r: 32 } }
      ],
      hole: { cx: 56, cy: 84, r: 9 },
      textX: 124, line1Y: 118, line2Y: 152, maxWidth: 124
    },
    heart: {
      label: 'Heart',
      parts: [{
        tag: 'path',
        attrs: {
          d: 'M120 213.5l-14.5-13.2C54 153.6 20 122.8 20 85 20 54.2 44.2 30 75 30c17.4 0 34.1 8.1 45 20.9C130.9 38.1 147.6 30 165 30c30.8 0 55 24.2 55 55 0 37.8-34 68.6-85.5 115.4L120 213.5z'
        }
      }],
      // the heart tapers toward the point: both lines sit high and stay narrow
      hole: { cx: 120, cy: 82, r: 9 },
      textX: 120, line1Y: 122, line2Y: 154, maxWidth: 106
    },
    round: {
      label: 'Round',
      parts: [{ tag: 'rect', attrs: { x: 20, y: 64, width: 200, height: 118, rx: 30 } }],
      hole: { cx: 48, cy: 123, r: 9 },
      textX: 134, line1Y: 114, line2Y: 152, maxWidth: 140
    }
  };

  var METALS = {
    brass: { label: 'Brass', engrave: '#6d4a12' },
    silver: { label: 'Silver', engrave: '#5a5f66' },
    rose: { label: 'Rose Gold', engrave: '#7d4433' },
    black: { label: 'Black', engrave: '#ddd6ce' }
  };

  /* Finished width of the tag. The preview is drawn at a fixed scale, so the
     caption is the only thing telling the customer how big it really is. */
  var SIZES = {
    Small: { label: 'Small', width: '1.0in' },
    Large: { label: 'Large', width: '1.3in' }
  };

  var FONTS = {
    classic: { label: 'Classic', className: 'font-classic', widthFactor: 0.55 },
    modern: { label: 'Modern', className: 'font-modern', widthFactor: 0.58 },
    script: { label: 'Script', className: 'font-script', widthFactor: 0.46 }
  };

  function fitFontSize(text, maxWidth, widthFactor, maxSize, minSize) {
    var length = Math.max(String(text).length, 1);
    return Math.max(minSize, Math.min(maxSize, maxWidth / (widthFactor * length)));
  }

  /* Both surfaces that draw a tag — the product studio and the hero workbench —
     share one renderer. `refs` names the four SVG nodes each surface owns. */
  function drawTagShape(refs, state) {
    var shape = SHAPES[state.shape] || SHAPES.circle;
    var stage = refs.stage;
    while (stage.firstChild) stage.removeChild(stage.firstChild);
    shape.parts.forEach(function (part) {
      var node = document.createElementNS(SVG_NS, part.tag);
      Object.keys(part.attrs).forEach(function (key) {
        node.setAttribute(key, String(part.attrs[key]));
      });
      stage.appendChild(node);
    });
    stage.setAttribute('fill', 'url(#metal-' + state.metal + ')');
    if (refs.hole) {
      refs.hole.setAttribute('cx', String(shape.hole.cx));
      refs.hole.setAttribute('cy', String(shape.hole.cy));
      refs.hole.setAttribute('r', String(shape.hole.r));
    }
  }

  /* value1 / value2 arrive already cleaned. Empty fields still show something:
     a ghosted sample of what will be engraved. */
  function drawTagText(refs, state, value1, value2) {
    var shape = SHAPES[state.shape] || SHAPES.circle;
    var metal = METALS[state.metal] || METALS.brass;
    var font = FONTS[state.font] || FONTS.classic;

    /* The floor is set by the narrowest silhouette and the widest face: the
       heart gives the name line only 106px, which a full 12-character name in
       Modern fills at 15px. A higher floor pushes the engraving off the metal. */
    [[refs.line1, value1 || 'Buddy', !value1, shape.line1Y, 40, 15],
     [refs.line2, value2 || '+1 555-0148', !value2, shape.line2Y, 22, 11]].forEach(function (row) {
      var el = row[0];
      if (!el) return;
      el.setAttribute('x', String(shape.textX));
      el.setAttribute('y', String(row[3]));
      el.setAttribute('fill', metal.engrave);
      el.setAttribute('font-size', fitFontSize(row[1], shape.maxWidth, font.widthFactor, row[4], row[5]).toFixed(1));
      el.textContent = row[1];
      el.classList.toggle('is-placeholder', row[2]);
      el.classList.remove('font-classic', 'font-modern', 'font-script');
      el.classList.add(font.className);
    });
  }

  /* Swapping shape or metal re-draws the tag in place, which is easy to miss.
     One swing on its split ring says "this is the thing that changed". */
  function nudgeTag(refs) {
    playOnce(refs.stage ? refs.stage.ownerSVGElement : null, 'nudge');
  }

  /* Hero workbench (home page): name + shape + metal, no cart. Same renderer as
     the product studio, so the tag drawn here is the tag that gets engraved. */
  function initHeroWorkbench() {
    var refs = {
      stage: $('#heroTagShape'),
      hole: $('#heroTagHole'),
      line1: $('#heroTagLine1'),
      line2: $('#heroTagLine2')
    };
    if (!refs.stage) return;
    var input = $('#heroName');
    var state = { shape: 'circle', metal: 'brass', font: 'classic' };

    function paintText() {
      drawTagText(refs, state, input ? cleanEngraving(input.value, MAX_LINE1) : '', '');
    }

    function swap(key, value, dictionary) {
      if (!dictionary[value]) return;
      state[key] = value;
      drawTagShape(refs, state);
      paintText();
      nudgeTag(refs);
    }

    initRadioGroup($('#heroShapeGroup'), function (value) { swap('shape', value, SHAPES); });
    initRadioGroup($('#heroMetalGroup'), function (value) { swap('metal', value, METALS); });

    if (input) {
      var scheduleText = rafDebounce(paintText);
      input.addEventListener('input', function () {
        var typed = stripUnengravable(input.value, MAX_LINE1);
        if (typed !== input.value) input.value = typed; // strip characters we cannot engrave
        scheduleText();
      });
    }

    drawTagShape(refs, state);
    paintText();
  }

  function initEngraver() {
    var form = $('#productForm');
    var stage = $('#tagShape');
    if (!form || !stage) return;

    var refs = {
      stage: stage,
      hole: $('#tagHole'),
      line1: $('#tagLine1'),
      line2: $('#tagLine2')
    };
    var input1 = $('#engraveLine1');
    var input2 = $('#engraveLine2');
    var count1 = $('#count1');
    var count2 = $('#count2');
    var caption = $('#previewCaption');
    var qtyInput = $('#productQty', form);

    var state = {
      shape: form.getAttribute('data-default-shape') || 'circle',
      metal: form.getAttribute('data-default-metal') || 'brass',
      font: form.getAttribute('data-default-font') || 'classic',
      size: form.getAttribute('data-default-size') || 'Small'
    };

    function drawText() {
      drawTagText(
        refs,
        state,
        input1 ? cleanEngraving(input1.value, MAX_LINE1) : '',
        input2 ? cleanEngraving(input2.value, MAX_LINE2) : ''
      );
    }

    var scheduleText = rafDebounce(drawText);

    function drawCaption() {
      if (!caption) return;
      var size = SIZES[state.size] || SIZES.Small;
      caption.textContent = 'Shown larger than life — the ' + size.label
        + ' tag measures ' + size.width + ' across.';
    }

    function render() {
      drawTagShape(refs, state);
      drawText();
      drawCaption();
    }

    /* Only shape and metal re-cut the tag itself, so only they earn the swing.
       Font and size change the engraving in place — that reads on its own. */
    function bindOption(groupId, key, labelId, dictionary, nudge) {
      initRadioGroup($('#' + groupId), function (value) {
        state[key] = value;
        var label = labelId ? $('#' + labelId) : null;
        if (label) label.textContent = dictionary ? (dictionary[value] || {}).label || value : value;
        render();
        if (nudge) nudgeTag(refs);
      });
    }

    bindOption('shapeGroup', 'shape', 'selectedShape', SHAPES, true);
    bindOption('metalGroup', 'metal', 'selectedMetal', METALS, true);
    bindOption('fontGroup', 'font', 'selectedFont', FONTS, false);
    bindOption('sizeGroup', 'size', 'selectedSize', SIZES, false);

    function bindInput(input, counter, maxLength) {
      if (!input) return;
      input.addEventListener('input', function () {
        // echo back the typeable form (a trailing space must survive so the
        // customer can go on to type the second word)
        var typed = stripUnengravable(input.value, maxLength);
        if (typed !== input.value) input.value = typed; // strip characters we cannot engrave
        // the counter is cheap and must never lag the caret
        if (counter) counter.textContent = typed.length + ' / ' + maxLength;
        scheduleText();
      });
    }

    bindInput(input1, count1, MAX_LINE1);
    bindInput(input2, count2, MAX_LINE2);

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

    function currentLine() {
      var priceEl = $('.price', form);
      var activeImg = $('.gallery-main img.active') || $('.gallery-main img');
      return {
        handle: form.getAttribute('data-handle') || '',
        title: form.getAttribute('data-title') || '',
        price: parseInt(priceEl ? priceEl.getAttribute('data-price') : form.getAttribute('data-price'), 10),
        size: state.size,
        metal: (METALS[state.metal] || METALS.brass).label,
        shape: (SHAPES[state.shape] || SHAPES.circle).label,
        line1: input1 ? input1.value : '',
        line2: input2 ? input2.value : '',
        qty: qtyInput ? clampQty(qtyInput.value) : 1,
        img: activeImg ? activeImg.getAttribute('src') : ''
      };
    }

    // a tag with no name is not a product — block the add and point at the field
    function submitLine() {
      var line = currentLine();
      if (!line.line1) {
        showToast('Add your pet’s name before adding to cart');
        if (input1) input1.focus();
        return false;
      }
      return addToCart(line);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitLine();
    });

    var buyNow = $('#buyNow', form);
    if (buyNow) {
      buyNow.addEventListener('click', function () {
        if (submitLine()) {
          showToast('Checkout is a demo — tag added to cart');
        }
      });
    }

    render();
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
      info.appendChild(title);

      // the engraving is the product — show it exactly as it will be cut
      var engraving = document.createElement('p');
      engraving.className = 'cart-line-engraving';
      engraving.textContent = 'Engraving: “' + line.line1 + '”'
        + (line.line2 ? ' / “' + line.line2 + '”' : '');
      info.appendChild(engraving);

      var variant = document.createElement('p');
      variant.className = 'cart-line-variant';
      variant.textContent = line.shape + ' · ' + line.metal + ' · Size ' + line.size;
      var unit = document.createElement('p');
      unit.className = 'cart-line-unit';
      unit.textContent = money(line.price) + ' each';
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
     Boot
  --------------------------------------------- */
  function init() {
    initHeader();
    initDemoToasts();
    initToTop();
    initAccordions();
    initCounters();
    initCollection();
    initProductGallery();
    initHeroWorkbench();
    initEngraver();
    initCartPage();
    observeOnce($$('.reveal'));
    updateBadge();

    bindDemoForm($('#newsletterForm'), 'Thanks — you are on the list ✓');
    bindDemoForm($('#contactForm'), 'Message sent — we reply within 1 business day ✓');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
