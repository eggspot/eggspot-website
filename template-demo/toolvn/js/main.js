/* ==========================================================================
   TOOLVN — script chung cho 8 trang.
   Không có biến toàn cục: toàn bộ nằm trong một IIFE.
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CART_KEY = 'toolvn-cart';
  var CONSENT_KEY = 'gdpr-consent';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (err) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (err) { /* chế độ riêng tư: bỏ qua */ }
  }

  function formatVnd(amount) {
    return amount.toLocaleString('vi-VN') + '₫';
  }

  /* ----------------------------------------------------------------------
     Toast
     ---------------------------------------------------------------------- */
  var toastEl = null;
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    // Buộc trình duyệt tính lại style trước khi thêm class để transition luôn chạy.
    void toastEl.offsetWidth;
    toastEl.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2000);
  }

  /* ----------------------------------------------------------------------
     Giỏ hàng (demo, lưu localStorage)
     ---------------------------------------------------------------------- */
  function readCart() {
    var raw = parseInt(storageGet(CART_KEY), 10);
    return isNaN(raw) || raw < 0 ? 0 : raw;
  }

  function paintCart() {
    var count = readCart();
    $$('.cart-count').forEach(function (el) {
      el.textContent = String(count);
      el.closest('.cart-btn').setAttribute('aria-label', 'Giỏ hàng, ' + count + ' sản phẩm');
    });
  }

  function addToCart(qty, name) {
    storageSet(CART_KEY, String(readCart() + (qty || 1)));
    paintCart();
    showToast('Đã thêm ' + (qty || 1) + ' × ' + name + ' vào giỏ');
  }

  /* ----------------------------------------------------------------------
     Header: menu, mega menu, ô tìm kiếm
     ---------------------------------------------------------------------- */
  function initHeader() {
    var toggle = $('.nav-toggle');
    var mobileMenu = $('.mobile-menu');

    if (toggle && mobileMenu) {
      var closeMenu = function () {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Mở menu');
      };

      toggle.addEventListener('click', function () {
        var open = document.body.classList.toggle('menu-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      });

      mobileMenu.addEventListener('click', function (event) {
        if (event.target.closest('a')) { closeMenu(); }
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
          closeMenu();
          toggle.focus();
        }
      });
    }

    // Accordion danh mục trong menu mobile
    $$('.mobile-link[aria-controls]').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) { return; }
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
      });
    });

    // Mega menu desktop
    var megaBtn = $('.mega-toggle');
    var mega = megaBtn ? document.getElementById(megaBtn.getAttribute('aria-controls')) : null;

    if (megaBtn && mega) {
      var setMega = function (open) {
        megaBtn.setAttribute('aria-expanded', String(open));
        mega.hidden = !open;
      };

      megaBtn.addEventListener('click', function () {
        setMega(megaBtn.getAttribute('aria-expanded') !== 'true');
      });

      document.addEventListener('click', function (event) {
        if (!mega.hidden && !mega.contains(event.target) && !megaBtn.contains(event.target)) {
          setMega(false);
        }
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !mega.hidden) {
          setMega(false);
          megaBtn.focus();
        }
      });

      mega.addEventListener('click', function (event) {
        if (event.target.closest('a')) { setMega(false); }
      });
    }

    // Ô tìm kiếm thu gọn trên mobile
    var searchToggle = $('.search-toggle');
    var search = $('.header-search');

    if (searchToggle && search) {
      searchToggle.addEventListener('click', function () {
        var open = search.classList.toggle('is-open');
        searchToggle.setAttribute('aria-expanded', String(open));
        if (open) { $('input', search).focus(); }
      });
    }
  }

  /* ----------------------------------------------------------------------
     Reveal khi cuộn
     ---------------------------------------------------------------------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) { return; }

    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    // Chốt sẵn thứ tự trong nhóm .stagger: tra cứu O(1) thay vì indexOf mỗi lần giao cắt.
    var staggerIndex = new WeakMap();
    $$('.stagger').forEach(function (parent) {
      $$('.reveal', parent).forEach(function (el, i) {
        if (el.parentElement === parent) { staggerIndex.set(el, i); }
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target;

        if (staggerIndex.has(el)) {
          var index = staggerIndex.get(el);
          if (index > 0) {
            el.style.transitionDelay = Math.min(index, 6) * 70 + 'ms';
            // Xoá delay sau khi hiện để không làm chậm transition hover về sau.
            el.addEventListener('transitionend', function clear() {
              el.style.transitionDelay = '';
              el.removeEventListener('transitionend', clear);
            });
          }
        }

        el.classList.add('is-visible');
        observer.unobserve(el);
      });
    }, { threshold: 0.2, rootMargin: '-10% 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ----------------------------------------------------------------------
     Marquee: nhân đôi nội dung để vòng lặp liền mạch
     ---------------------------------------------------------------------- */
  function initMarquee() {
    var track = $('.marquee-track');
    if (!track) { return; }
    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    while (clone.firstChild) { track.appendChild(clone.firstChild); }
  }

  /* ----------------------------------------------------------------------
     Select tuỳ biến (combobox + listbox), dùng chung cho lọc giá / sắp xếp / số lượng
     ---------------------------------------------------------------------- */
  function initSelects() {
    var selects = [];

    $$('[data-select]').forEach(function (root) {
      var btn = $('.select-btn', root);
      var list = $('.select-list', root);
      if (!btn || !list) { return; }

      var options = $$('[role="option"]', list);
      var valueEl = $('.select-value', btn);
      var activeIndex = Math.max(0, options.findIndex(function (opt) {
        return opt.getAttribute('aria-selected') === 'true';
      }));

      function markActive(index) {
        activeIndex = Math.max(0, Math.min(options.length - 1, index));
        options.forEach(function (opt, i) {
          opt.classList.toggle('is-active', i === activeIndex);
        });
        btn.setAttribute('aria-activedescendant', options[activeIndex].id);
        options[activeIndex].scrollIntoView({ block: 'nearest' });
      }

      function open() {
        list.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        markActive(activeIndex);
      }

      function close() {
        list.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        btn.removeAttribute('aria-activedescendant');
      }

      function select(index) {
        var opt = options[index];
        if (!opt) { return; }
        options.forEach(function (o) { o.setAttribute('aria-selected', String(o === opt)); });
        valueEl.textContent = opt.textContent;
        root.dataset.value = opt.dataset.value;
        root.dispatchEvent(new CustomEvent('select:change', {
          bubbles: true,
          detail: { value: opt.dataset.value, label: opt.textContent }
        }));
        close();
        btn.focus();
      }

      btn.addEventListener('click', function () {
        if (list.hidden) { open(); } else { close(); }
      });

      btn.addEventListener('keydown', function (event) {
        var key = event.key;
        if (key === 'ArrowDown' || key === 'ArrowUp') {
          event.preventDefault();
          if (list.hidden) { open(); return; }
          markActive(activeIndex + (key === 'ArrowDown' ? 1 : -1));
        } else if (key === 'Home' || key === 'End') {
          if (list.hidden) { return; }
          event.preventDefault();
          markActive(key === 'Home' ? 0 : options.length - 1);
        } else if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
          event.preventDefault();
          if (list.hidden) { open(); } else { select(activeIndex); }
        } else if (key === 'Escape') {
          if (!list.hidden) { event.preventDefault(); close(); }
        }
      });

      options.forEach(function (opt, i) {
        opt.addEventListener('click', function () { select(i); });
        opt.addEventListener('mousemove', function () { markActive(i); });
      });

      root.dataset.value = options[activeIndex] ? options[activeIndex].dataset.value : '';
      selects.push({ root: root, list: list, close: close });
    });

    if (!selects.length) { return; }

    // Một listener duy nhất trên document đóng mọi select đang mở khi bấm ra ngoài.
    document.addEventListener('click', function (event) {
      selects.forEach(function (item) {
        if (!item.list.hidden && !item.root.contains(event.target)) { item.close(); }
      });
    });
  }

  /* ----------------------------------------------------------------------
     Tabs (ARIA)
     ---------------------------------------------------------------------- */
  function initTabs() {
    $$('[role="tablist"]').forEach(function (tablist) {
      var tabs = $$('[role="tab"]', tablist);
      if (!tabs.length) { return; }

      function activate(tab, setFocus) {
        tabs.forEach(function (item) {
          var selected = item === tab;
          item.setAttribute('aria-selected', String(selected));
          item.tabIndex = selected ? 0 : -1;
          var panel = document.getElementById(item.getAttribute('aria-controls'));
          if (panel) { panel.hidden = !selected; }
        });
        if (setFocus) { tab.focus(); }
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () { activate(tab, false); });
        tab.addEventListener('keydown', function (event) {
          var next = null;
          if (event.key === 'ArrowRight') { next = tabs[(index + 1) % tabs.length]; }
          else if (event.key === 'ArrowLeft') { next = tabs[(index - 1 + tabs.length) % tabs.length]; }
          else if (event.key === 'Home') { next = tabs[0]; }
          else if (event.key === 'End') { next = tabs[tabs.length - 1]; }
          if (next) { event.preventDefault(); activate(next, true); }
        });
      });
    });
  }

  /* ----------------------------------------------------------------------
     Gallery sản phẩm (thumb không phải tab)
     ---------------------------------------------------------------------- */
  function initGallery() {
    var main = $('[data-gallery-main]');
    var thumbs = $$('[data-gallery-thumb]');
    if (!main || !thumbs.length) { return; }

    thumbs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        thumbs.forEach(function (other) { other.removeAttribute('aria-current'); });
        btn.setAttribute('aria-current', 'true');
        main.src = btn.dataset.full;
        main.alt = btn.dataset.alt;
      });
    });
  }

  /* ----------------------------------------------------------------------
     Countdown evergreen — về 0 lúc nửa đêm rồi tự chạy lại 23:59:59
     ---------------------------------------------------------------------- */
  function initCountdown() {
    var box = $('[data-countdown]');
    if (!box) { return; }

    var hEl = $('[data-cd="h"]', box);
    var mEl = $('[data-cd="m"]', box);
    var sEl = $('[data-cd="s"]', box);
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };

    function tick() {
      var now = new Date();
      var left = 86400 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      hEl.textContent = pad(Math.floor(left / 3600));
      mEl.textContent = pad(Math.floor((left % 3600) / 60));
      sEl.textContent = pad(left % 60);
    }

    var timer = null;
    function start() {
      if (timer !== null) { return; }
      tick();
      timer = window.setInterval(tick, 1000);
    }
    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    if (!document.hidden) { start(); } else { tick(); }
  }

  /* ----------------------------------------------------------------------
     Quick view modal + bẫy focus
     ---------------------------------------------------------------------- */
  function initQuickView() {
    var modal = $('.qv-modal');
    if (!modal) { return; }

    var panel = $('.qv-panel', modal);
    var img = $('[data-qv-img]', modal);
    var title = $('[data-qv-title]', modal);
    var spec = $('[data-qv-spec]', modal);
    var priceBox = $('[data-qv-price]', modal);
    var addBtn = $('[data-qv-add]', modal);
    var lastFocused = null;
    var currentName = '';

    var FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

    function close() {
      modal.hidden = true;
      document.body.classList.remove('no-scroll');
      if (lastFocused) { lastFocused.focus(); }
    }

    function open(card) {
      var media = $('.pcard-media img', card);
      currentName = $('.pcard-title', card).textContent.trim();

      img.src = media.src;
      img.alt = media.alt;
      title.textContent = currentName;
      spec.textContent = $('.pcard-spec', card).textContent.trim();
      priceBox.innerHTML = $('.price-row', card).innerHTML;
      addBtn.dataset.name = currentName;

      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('no-scroll');
      $('.qv-close', modal).focus();
    }

    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('.quick-view');
      if (trigger) {
        event.preventDefault();
        open(trigger.closest('.pcard'));
      }
    });

    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.closest('.qv-close')) { close(); }
    });

    addBtn.addEventListener('click', function () {
      addToCart(1, addBtn.dataset.name);
      close();
    });

    modal.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { close(); return; }
      if (event.key !== 'Tab') { return; }

      var items = $$(FOCUSABLE, panel).filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) { return; }
      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Bộ lọc + sắp xếp + phân trang (collection.html)
     ---------------------------------------------------------------------- */
  function initCollection() {
    var grid = $('#product-grid');
    if (!grid) { return; }

    var PAGE_SIZE = 8;
    var cards = $$('.pcard', grid);
    var countEl = $('[data-result-count]');
    var emptyEl = $('.empty-note');
    var pagination = $('.pagination');
    var priceSelect = $('[data-select="price"]');
    var sortSelect = $('[data-select="sort"]');
    var clearBtn = $('[data-clear-filters]');
    var filtersToggle = $('.filters-toggle');
    var filters = $('.filters');
    var page = 1;
    var query = '';

    var PRICE_RANGES = {
      all: [0, Infinity],
      'lt500': [0, 500000],
      '500-1000': [500000, 1000000],
      '1000-2000': [1000000, 2000000],
      'gt2000': [2000000, Infinity]
    };

    var stockInput = $('input[name="stock"]');

    function checkedValues(name) {
      return $$('input[name="' + name + '"]:checked').map(function (input) { return input.value; });
    }

    // Đọc DOM một lần cho cả lượt lọc, không truy vấn lại theo từng card.
    function readFilters() {
      return {
        categories: checkedValues('category'),
        brands: checkedValues('brand'),
        stockOnly: !!(stockInput && stockInput.checked),
        range: PRICE_RANGES[(priceSelect && priceSelect.dataset.value) || 'all'] || PRICE_RANGES.all
      };
    }

    function matches(card, state) {
      if (state.categories.length && state.categories.indexOf(card.dataset.category) === -1) { return false; }
      if (state.brands.length && state.brands.indexOf(card.dataset.brand) === -1) { return false; }
      if (state.stockOnly && card.dataset.stock !== 'in') { return false; }

      var price = Number(card.dataset.price);
      if (price < state.range[0] || price >= state.range[1]) { return false; }

      if (query && card.dataset.name.indexOf(query) === -1) { return false; }
      return true;
    }

    function sortCards(list) {
      var mode = (sortSelect && sortSelect.dataset.value) || 'featured';
      var sorted = list.slice();

      if (mode === 'price-asc') {
        sorted.sort(function (a, b) { return a.dataset.price - b.dataset.price; });
      } else if (mode === 'price-desc') {
        sorted.sort(function (a, b) { return b.dataset.price - a.dataset.price; });
      } else if (mode === 'rating') {
        sorted.sort(function (a, b) { return b.dataset.rating - a.dataset.rating; });
      }
      return sorted;
    }

    function addPageButton(label, targetPage, opts) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      if (opts.ariaLabel) { btn.setAttribute('aria-label', opts.ariaLabel); }
      if (opts.current) { btn.setAttribute('aria-current', 'true'); }
      btn.disabled = !!opts.disabled;
      btn.addEventListener('click', function () { page = targetPage; render(); });
      li.appendChild(btn);
      pagination.appendChild(li);
    }

    function buildPagination(totalPages) {
      pagination.innerHTML = '';
      if (totalPages < 2) { return; }

      addPageButton('Trước', page - 1, { disabled: page === 1 });
      for (var i = 1; i <= totalPages; i += 1) {
        addPageButton(String(i), i, { ariaLabel: 'Trang ' + i, current: i === page });
      }
      addPageButton('Sau', page + 1, { disabled: page === totalPages });
    }

    function render() {
      var state = readFilters();
      var visible = sortCards(cards.filter(function (card) { return matches(card, state); }));
      var totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
      page = Math.min(page, totalPages);

      var start = (page - 1) * PAGE_SIZE;
      var pageItems = visible.slice(start, start + PAGE_SIZE);

      cards.forEach(function (card) { card.hidden = true; });
      pageItems.forEach(function (card) {
        card.hidden = false;
        card.classList.add('is-visible');
        grid.appendChild(card);
      });

      countEl.textContent = String(visible.length);
      emptyEl.hidden = visible.length !== 0;
      buildPagination(totalPages);
    }

    function reset() { page = 1; render(); }

    $$('.filters input[type="checkbox"]').forEach(function (input) {
      input.addEventListener('change', reset);
    });
    if (priceSelect) { priceSelect.addEventListener('select:change', reset); }
    if (sortSelect) { sortSelect.addEventListener('select:change', reset); }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        $$('.filters input[type="checkbox"]').forEach(function (input) { input.checked = false; });
        query = '';
        var input = $('.header-search input');
        if (input) { input.value = ''; }
        reset();
      });
    }

    if (filtersToggle && filters) {
      filtersToggle.addEventListener('click', function () {
        var open = filters.classList.toggle('is-open');
        filtersToggle.setAttribute('aria-expanded', String(open));
      });
    }

    var initial = new URLSearchParams(window.location.search).get('q');
    if (initial) {
      query = initial.trim().toLowerCase();
      var searchInput = $('.header-search input');
      if (searchInput) { searchInput.value = initial; }
    }

    document.addEventListener('toolvn:search', function (event) {
      query = event.detail.query;
      reset();
    });

    render();
  }

  /* ----------------------------------------------------------------------
     Ô tìm kiếm ở header
     ---------------------------------------------------------------------- */
  function initSearch() {
    var form = $('[data-search]');
    if (!form) { return; }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var value = $('input', form).value.trim();

      if ($('#product-grid')) {
        document.dispatchEvent(new CustomEvent('toolvn:search', {
          detail: { query: value.toLowerCase() }
        }));
        var url = value ? '?q=' + encodeURIComponent(value) : window.location.pathname;
        window.history.replaceState(null, '', url);
      } else {
        window.location.href = 'collection.html' + (value ? '?q=' + encodeURIComponent(value) : '');
      }
    });
  }

  /* ----------------------------------------------------------------------
     Nút thêm vào giỏ ngoài modal (trang chi tiết)
     ---------------------------------------------------------------------- */
  function initAddToCart() {
    var qtySelect = $('[data-select="qty"]');
    $$('[data-add-to-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qty = qtySelect ? Number(qtySelect.dataset.value) : 1;
        addToCart(qty || 1, btn.dataset.addToCart);
      });
    });
  }

  /* ----------------------------------------------------------------------
     Form demo (newsletter / liên hệ / mua nhanh)
     ---------------------------------------------------------------------- */
  function initForms() {
    $$('form[data-form]').forEach(function (form) {
      var success = $('.form-success', form);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.reportValidity()) { return; }

        var name = $('input[name="name"]', form);
        var who = name ? name.value.trim() : '';
        success.textContent = who
          ? who + ', cảm ơn bạn! TOOLVN đã nhận thông tin và sẽ liên hệ trong giờ làm việc (8:00–20:00).'
          : 'Cảm ơn bạn! TOOLVN đã nhận thông tin và sẽ liên hệ trong giờ làm việc (8:00–20:00).';
        form.reset();
      });
    });
  }

  /* ----------------------------------------------------------------------
     Đặt số lượng trên trang chi tiết vào form mua nhanh
     ---------------------------------------------------------------------- */
  function initQuickBuySync() {
    var qtySelect = $('[data-select="qty"]');
    var target = $('[data-qty-mirror]');
    if (!qtySelect || !target) { return; }

    var unitPrice = Number(target.dataset.unitPrice);
    var paint = function () {
      var qty = Number(qtySelect.dataset.value) || 1;
      target.textContent = formatVnd(unitPrice * qty);
    };

    qtySelect.addEventListener('select:change', paint);
    paint();
  }

  /* ----------------------------------------------------------------------
     GDPR
     ---------------------------------------------------------------------- */
  function initGdpr() {
    var banner = $('.gdpr-banner');
    if (!banner) { return; }

    if (!storageGet(CONSENT_KEY)) { banner.hidden = false; }

    $$('[data-gdpr]', banner).forEach(function (btn) {
      btn.addEventListener('click', function () {
        storageSet(CONSENT_KEY, btn.dataset.gdpr);
        banner.hidden = true;
      });
    });
  }

  /* ----------------------------------------------------------------------
     Khởi động
     ---------------------------------------------------------------------- */
  function init() {
    paintCart();
    initHeader();
    initSearch();
    initReveal();
    initMarquee();
    initSelects();
    initTabs();
    initGallery();
    initCountdown();
    initQuickView();
    initCollection();
    initAddToCart();
    initQuickBuySync();
    initForms();
    initGdpr();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
