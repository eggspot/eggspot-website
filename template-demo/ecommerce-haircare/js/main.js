/* AURELLE — salon + apothecary
 * Một file JS duy nhất, chia module theo khối comment.
 * 01 Tiện ích      05 Xem nhanh         09 Trước/Sau
 * 02 Menu mobile   06 Đặt lịch 4 bước   10 Bộ lọc cửa hàng
 * 03 Giỏ hàng      07 Ritual quiz       11 Accordion / form
 * 04 Cart drawer   08 Trang sản phẩm    12 Reveal
 */
(function () {
  'use strict';

  /* ============================ 01 TIỆN ÍCH ============================ */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  function vnd(n) {
    var v = Number(n) || 0;
    return v.toLocaleString('vi-VN') + '₫';
  }

  /* Escape HTML để chèn an toàn vào innerHTML (chống XSS từ localStorage) */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function readStore(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* Bẫy focus trong lớp phủ đang mở (menu mobile, drawer, modal) */
  function trapFocus(container, evt) {
    var items = $$(FOCUSABLE, container).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (evt.shiftKey && document.activeElement === first) {
      evt.preventDefault();
      last.focus();
    } else if (!evt.shiftKey && document.activeElement === last) {
      evt.preventDefault();
      first.focus();
    }
  }

  var scrollLocks = 0;
  function lockScroll(on) {
    scrollLocks = Math.max(0, scrollLocks + (on ? 1 : -1));
    document.body.style.overflow = scrollLocks > 0 ? 'hidden' : '';
  }

  /* Chọn độc quyền trong nhóm (aria-pressed): clear hết, set 1 */
  function selectOnly(els, el) {
    els.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    el.setAttribute('aria-pressed', 'true');
  }

  /* ============================ 02 MENU MOBILE ============================ */
  function initMobileMenu() {
    var burger = $('[data-burger]');
    var panel = $('[data-mobile-panel]');
    if (!burger || !panel) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      panel.classList.toggle('is-open', open);
      lockScroll(open);
      if (open) {
        var firstLink = $('a', panel);
        if (firstLink) firstLink.focus();
      } else {
        burger.focus();
      }
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    $$('a', panel).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'Tab') trapFocus(panel, e);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080 && panel.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ============================ 03 GIỎ HÀNG ============================ */
  var CART_KEY = 'au_cart';
  var cart = [];

  function loadCart() {
    var data = readStore(CART_KEY, []);
    cart = Array.isArray(data) ? data.filter(function (it) {
      return it && it.id && Number(it.price) >= 0;
    }) : [];
  }

  function saveCart() { writeStore(CART_KEY, cart); }

  function cartCount() {
    return cart.reduce(function (sum, it) { return sum + (Number(it.qty) || 0); }, 0);
  }

  function cartTotal() {
    return cart.reduce(function (sum, it) {
      return sum + (Number(it.price) || 0) * (Number(it.qty) || 0);
    }, 0);
  }

  function addToCart(item, qty) {
    var amount = Math.max(1, Number(qty) || 1);
    var found = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === item.id) { found = cart[i]; break; }
    }
    if (found) found.qty = Math.min(99, found.qty + amount);
    else cart.push({
      id: item.id,
      handle: item.handle,
      title: item.title,
      variant: item.variant || '',
      price: Number(item.price) || 0,
      img: item.img || '',
      url: item.url || 'san-pham.html',
      qty: amount
    });
    saveCart();
    renderCart();
    bumpBadge();
  }

  function setQty(id, delta) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id !== id) continue;
      cart[i].qty += delta;
      if (cart[i].qty < 1) cart.splice(i, 1);
      break;
    }
    saveCart();
    renderCart();
  }

  function removeLine(id) {
    cart = cart.filter(function (it) { return it.id !== id; });
    saveCart();
    renderCart();
  }

  function bumpBadge() {
    $$('[data-cart-count]').forEach(function (badge) {
      badge.classList.remove('is-bump');
      void badge.offsetWidth;
      badge.classList.add('is-bump');
    });
  }

  function renderCart() {
    var count = cartCount();
    $$('[data-cart-count]').forEach(function (badge) {
      badge.textContent = String(count);
      badge.setAttribute('data-empty', count === 0 ? 'true' : 'false');
    });
    $$('[data-cart-open]').forEach(function (btn) {
      btn.setAttribute('aria-label', 'Mở giỏ hàng, ' + count + ' sản phẩm');
    });

    var body = $('[data-cart-body]');
    var foot = $('[data-cart-foot]');
    if (!body) return;

    if (!cart.length) {
      body.innerHTML =
        '<div class="cart-empty"><p>Giỏ hàng đang trống.</p>' +
        '<a class="btn btn-outline" href="cua-hang.html">Xem cửa hàng</a></div>';
      if (foot) foot.hidden = true;
      return;
    }

    body.innerHTML = cart.map(function (it) {
      return '<article class="cart-line">' +
        '<img src="' + esc(it.img) + '" alt="" loading="lazy" width="72" height="90">' +
        '<div><h3>' + esc(it.title) + '</h3>' +
        (it.variant ? '<p class="variant">' + esc(it.variant) + '</p>' : '') +
        '<p class="price">' + vnd(it.price) + '</p>' +
        '<div class="qty">' +
        '<button type="button" data-qty-down="' + esc(it.id) + '" aria-label="Giảm số lượng ' + esc(it.title) + '">−</button>' +
        '<span>' + esc(it.qty) + '</span>' +
        '<button type="button" data-qty-up="' + esc(it.id) + '" aria-label="Tăng số lượng ' + esc(it.title) + '">+</button>' +
        '</div>' +
        '<button type="button" class="line-remove" data-remove="' + esc(it.id) + '">Xoá</button>' +
        '</div></article>';
    }).join('');

    if (foot) {
      foot.hidden = false;
      var totalEl = $('[data-cart-total]', foot);
      if (totalEl) totalEl.textContent = vnd(cartTotal());
    }
  }

  function initCartActions() {
    document.addEventListener('click', function (e) {
      var addBtn = e.target.closest ? e.target.closest('[data-add]') : null;
      if (addBtn) {
        e.preventDefault();
        var d = addBtn.dataset;
        addToCart({
          id: (d.handle || 'sp') + '|' + (d.variant || ''),
          handle: d.handle || 'sp',
          title: d.title || 'Sản phẩm',
          variant: d.variant || '',
          price: d.price,
          img: d.img || '',
          url: d.url || 'san-pham.html'
        }, d.qty);
        openDrawer();
        return;
      }
      var up = e.target.closest ? e.target.closest('[data-qty-up]') : null;
      if (up) { setQty(up.getAttribute('data-qty-up'), 1); return; }
      var down = e.target.closest ? e.target.closest('[data-qty-down]') : null;
      if (down) { setQty(down.getAttribute('data-qty-down'), -1); return; }
      var rm = e.target.closest ? e.target.closest('[data-remove]') : null;
      if (rm) { removeLine(rm.getAttribute('data-remove')); }
    });
  }

  /* ============================ 04 CART DRAWER ============================ */
  var drawer, scrim, lastFocused;

  function openDrawer() {
    if (!drawer || !scrim) return;
    lastFocused = document.activeElement;
    drawer.classList.add('is-open');
    drawer.removeAttribute('aria-hidden');
    scrim.classList.add('is-open');
    lockScroll(true);
    var close = $('[data-cart-close]', drawer);
    if (close) close.focus();
  }

  function closeDrawer() {
    if (!drawer || !scrim) return;
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('is-open');
    lockScroll(false);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function initDrawer() {
    drawer = $('[data-drawer]');
    scrim = $('[data-scrim]');
    if (!drawer || !scrim) return;
    drawer.setAttribute('aria-hidden', 'true');

    $$('[data-cart-open]').forEach(function (btn) {
      btn.addEventListener('click', openDrawer);
    });
    $$('[data-cart-close]').forEach(function (btn) {
      btn.addEventListener('click', closeDrawer);
    });
    scrim.addEventListener('click', function () {
      closeDrawer();
      closeQuickView();
    });
    document.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeDrawer();
      else if (e.key === 'Tab') trapFocus(drawer, e);
    });
  }

  /* ============================ 05 XEM NHANH ============================ */
  var qv;

  function closeQuickView() {
    if (!qv || !qv.classList.contains('is-open')) return;
    qv.classList.remove('is-open');
    if (scrim && !(drawer && drawer.classList.contains('is-open'))) scrim.classList.remove('is-open');
    lockScroll(false);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function initQuickView() {
    qv = $('[data-qv]');
    if (!qv) return;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-quickview]') : null;
      if (!btn) return;
      var card = btn.closest('.prod-card');
      if (!card) return;
      var d = card.dataset;
      lastFocused = btn;
      $('[data-qv-img]', qv).src = d.img || '';
      $('[data-qv-img]', qv).alt = d.title || '';
      $('[data-qv-name]', qv).textContent = d.title || '';
      $('[data-qv-vol]', qv).textContent = d.variant || '';
      $('[data-qv-price]', qv).textContent = vnd(d.price);
      $('[data-qv-desc]', qv).textContent = d.desc || '';
      var link = $('[data-qv-link]', qv);
      if (link) link.href = d.url || 'san-pham.html';
      var add = $('[data-qv-add]', qv);
      if (add) {
        add.dataset.handle = d.handle || '';
        add.dataset.title = d.title || '';
        add.dataset.price = d.price || '0';
        add.dataset.img = d.img || '';
        add.dataset.variant = d.variant || '';
        add.dataset.url = d.url || 'san-pham.html';
      }
      qv.classList.add('is-open');
      if (scrim) scrim.classList.add('is-open');
      lockScroll(true);
      var close = $('[data-qv-close]', qv);
      if (close) close.focus();
    });

    $$('[data-qv-close]', qv).forEach(function (b) {
      b.addEventListener('click', closeQuickView);
    });
    document.addEventListener('keydown', function (e) {
      if (!qv.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeQuickView();
      else if (e.key === 'Tab') trapFocus(qv, e);
    });
    var addInQv = $('[data-qv-add]', qv);
    if (addInQv) addInQv.addEventListener('click', function () { closeQuickView(); });
  }

  /* ============================ 06 ĐẶT LỊCH 4 BƯỚC ============================ */
  var BOOKING_KEY = 'au_booking';
  var DAY_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var SLOTS = ['09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30', '17:30', '18:30'];

  function initBooking() {
    var form = $('[data-booking]');
    if (!form) return;

    var panels = $$('.step-panel', form);
    var steps = $$('.step-item', form);
    var done = $('[data-booking-done]');
    var current = 1;
    var state = readStore(BOOKING_KEY, {});

    /* --- Ngày & giờ dựng động từ hôm nay --- */
    var dateRow = $('[data-date-row]');
    var slotGrid = $('[data-slot-grid]');
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    function dateValue(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function dateLabel(d) {
      return DAY_VN[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
    }

    if (dateRow) {
      var html = '';
      for (var i = 1; i <= 12; i++) {
        var d = new Date(today.getTime() + i * 86400000);
        html += '<button type="button" class="date-chip" data-date="' + dateValue(d) + '" ' +
          'aria-pressed="false"><span>' + DAY_VN[d.getDay()] + '</span>' +
          '<b>' + d.getDate() + '/' + (d.getMonth() + 1) + '</b></button>';
      }
      dateRow.innerHTML = html;
    }

    /* Khung giờ đã kín được xác định theo ngày (demo tĩnh, không backend) */
    function renderSlots(dateStr) {
      if (!slotGrid) return;
      if (!dateStr) {
        slotGrid.innerHTML = '<p class="muted small">Chọn ngày để xem khung giờ còn trống.</p>';
        return;
      }
      var seed = dateStr.split('-').reduce(function (a, p) { return a + Number(p); }, 0);
      slotGrid.innerHTML = SLOTS.map(function (t, idx) {
        var full = (seed + idx * 3) % 7 === 0;
        return '<button type="button" class="slot" data-slot="' + t + '" aria-pressed="false"' +
          (full ? ' disabled aria-label="' + t + ' đã kín chỗ"' : '') + '>' + t + '</button>';
      }).join('');
      if (state.time) {
        var active = $('[data-slot="' + state.time + '"]', slotGrid);
        if (active && !active.disabled) active.setAttribute('aria-pressed', 'true');
        else state.time = '';
      }
    }

    /* --- Đọc lựa chọn hiện tại --- */
    function selectedService() {
      var input = $('input[name="service"]:checked', form);
      if (!input) return null;
      return {
        value: input.value,
        name: input.dataset.name || input.value,
        price: Number(input.dataset.price) || 0,
        dur: input.dataset.dur || ''
      };
    }
    function selectedStylist() {
      var input = $('input[name="stylist"]:checked', form);
      if (!input) return null;
      return { value: input.value, name: input.dataset.name || input.value };
    }

    function syncState() {
      var svc = selectedService();
      var sty = selectedStylist();
      state.service = svc ? svc.value : '';
      state.serviceName = svc ? svc.name : '';
      state.servicePrice = svc ? svc.price : 0;
      state.serviceDur = svc ? svc.dur : '';
      state.stylist = sty ? sty.value : '';
      state.stylistName = sty ? sty.name : '';
      state.name = ($('#bk-name') || {}).value || '';
      state.phone = ($('#bk-phone') || {}).value || '';
      state.note = ($('#bk-note') || {}).value || '';
      writeStore(BOOKING_KEY, state);
      renderSummary();
    }

    var summaryEls = {
      'sum-service': $$('[data-sum-service]'),
      'sum-dur': $$('[data-sum-dur]'),
      'sum-stylist': $$('[data-sum-stylist]'),
      'sum-date': $$('[data-sum-date]'),
      'sum-time': $$('[data-sum-time]'),
      'sum-price': $$('[data-sum-price]'),
      'sum-deposit': $$('[data-sum-deposit]')
    };

    function renderSummary() {
      var deposit = Math.round((state.servicePrice || 0) * 0.2);
      var pairs = {
        'sum-service': state.serviceName || '—',
        'sum-dur': state.serviceDur || '—',
        'sum-stylist': state.stylistName || '—',
        'sum-date': state.date ? formatDateVN(state.date) : '—',
        'sum-time': state.time || '—',
        'sum-price': state.servicePrice ? 'từ ' + vnd(state.servicePrice) : '—',
        'sum-deposit': state.servicePrice ? vnd(deposit) : '—'
      };
      Object.keys(pairs).forEach(function (key) {
        summaryEls[key].forEach(function (el) { el.textContent = pairs[key]; });
      });
    }

    function formatDateVN(v) {
      var parts = String(v).split('-');
      if (parts.length !== 3) return v;
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return DAY_VN[d.getDay()] + ', ' + parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    /* --- Điều hướng bước --- */
    function showStep(n, silent) {
      current = Math.min(4, Math.max(1, n));
      panels.forEach(function (p) {
        p.classList.toggle('is-active', Number(p.dataset.step) === current);
      });
      steps.forEach(function (s) {
        var idx = Number(s.dataset.step);
        s.setAttribute('data-state', idx === current ? 'active' : (idx < current ? 'done' : 'todo'));
        if (idx === current) s.setAttribute('aria-current', 'step');
        else s.removeAttribute('aria-current');
      });
      if (silent) return;
      var heading = $('.step-panel.is-active h2', form);
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      var top = form.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: 'auto' });
    }

    function setError(step, msg) {
      var el = $('[data-error="' + step + '"]', form);
      if (!el) return;
      el.textContent = msg || '';
      el.hidden = !msg;
    }

    function validate(step) {
      if (step === 1 && !selectedService()) {
        setError(1, 'Vui lòng chọn một dịch vụ để tiếp tục.');
        return false;
      }
      if (step === 2 && !selectedStylist()) {
        setError(2, 'Vui lòng chọn stylist, hoặc chọn “Để salon sắp xếp”.');
        return false;
      }
      if (step === 3 && (!state.date || !state.time)) {
        setError(3, 'Vui lòng chọn ngày và khung giờ còn trống.');
        return false;
      }
      if (step === 4) {
        var name = $('#bk-name');
        var phone = $('#bk-phone');
        var agree = $('#bk-agree');
        if (!name.value.trim()) { setError(4, 'Vui lòng nhập họ tên.'); name.focus(); return false; }
        if (!/^0\d{9,10}$/.test(phone.value.replace(/[\s.]/g, ''))) {
          setError(4, 'Số điện thoại chưa đúng định dạng (ví dụ 0901 234 567).');
          phone.focus();
          return false;
        }
        if (!agree.checked) { setError(4, 'Vui lòng xác nhận đã đọc chính sách cọc và hủy lịch.'); agree.focus(); return false; }
        /* Biểu mẫu mang novalidate nên required trên ô đồng ý không tự chặn —
           họ tên và số điện thoại chỉ được ghi lại sau khi người đặt đồng ý. */
        var consent = $('#bk-consent');
        if (consent && !consent.checked) {
          setError(4, 'Vui lòng đồng ý với Chính sách bảo mật trước khi gửi.');
          consent.focus();
          return false;
        }
      }
      setError(step, '');
      return true;
    }

    $$('[data-next]', form).forEach(function (btn) {
      btn.addEventListener('click', function () {
        syncState();
        if (validate(current)) showStep(current + 1);
      });
    });
    $$('[data-prev]', form).forEach(function (btn) {
      btn.addEventListener('click', function () { showStep(current - 1); });
    });

    form.addEventListener('change', function (e) {
      if (e.target.name === 'service') setError(1, '');
      if (e.target.name === 'stylist') setError(2, '');
      syncState();
    });
    form.addEventListener('input', function (e) {
      if (e.target.id === 'bk-name' || e.target.id === 'bk-phone') setError(4, '');
    });

    if (dateRow) {
      dateRow.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-date]');
        if (!chip) return;
        selectOnly($$('[data-date]', dateRow), chip);
        state.date = chip.getAttribute('data-date');
        state.time = '';
        setError(3, '');
        renderSlots(state.date);
        syncState();
      });
    }

    if (slotGrid) {
      slotGrid.addEventListener('click', function (e) {
        var slot = e.target.closest('[data-slot]');
        if (!slot || slot.disabled) return;
        selectOnly($$('[data-slot]', slotGrid), slot);
        state.time = slot.getAttribute('data-slot');
        setError(3, '');
        syncState();
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      syncState();
      if (!validate(4)) return;
      state.code = 'AU' + String(Date.now()).slice(-6);
      writeStore(BOOKING_KEY, state);
      form.hidden = true;
      if (done) {
        done.classList.add('is-active');
        var codeEl = $('[data-done-code]', done);
        if (codeEl) codeEl.textContent = state.code;
        renderSummary();
        done.querySelector('h2').setAttribute('tabindex', '-1');
        done.querySelector('h2').focus({ preventScroll: true });
        window.scrollTo({ top: done.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'auto' });
      }
    });

    /* --- Khôi phục trạng thái + query ?stylist= --- */
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get('stylist') || state.stylist;
    var svcWanted = params.get('service') || state.service;

    if (svcWanted) {
      var svcInput = $('input[name="service"][value="' + CSS.escape(svcWanted) + '"]', form);
      if (svcInput) svcInput.checked = true;
    }
    if (wanted) {
      var styInput = $('input[name="stylist"][value="' + CSS.escape(wanted) + '"]', form);
      if (styInput) styInput.checked = true;
    }
    if (state.name && $('#bk-name')) $('#bk-name').value = state.name;
    if (state.phone && $('#bk-phone')) $('#bk-phone').value = state.phone;
    if (state.date && dateRow) {
      var chipEl = $('[data-date="' + state.date + '"]', dateRow);
      if (chipEl) chipEl.setAttribute('aria-pressed', 'true');
      else state.date = '';
    }
    renderSlots(state.date);
    syncState();

    var startStep = params.get('stylist') ? 3 : 1;
    panels.forEach(function (p) { p.classList.remove('is-active'); });
    showStep(startStep, startStep === 1);
  }

  /* ============================ 07 RITUAL QUIZ ============================ */
  var COMBOS = {
    'phuc-hoi': {
      title: 'Combo Phục hồi sau hoá chất',
      note: 'Tóc đã qua tẩy/nhuộm cần protein và độ ẩm theo tỉ lệ đúng — bắt đầu từ gội dịu, kết bằng dầu khoá lớp biểu bì.',
      service: { name: 'Liệu trình phục hồi keratin', dur: '120 phút', price: 2100000, slug: 'keratin' },
      items: ['dau-goi-thao-moc-atlas', 'mat-na-u-sau-8-phut', 'dau-khoa-nep-bergamot']
    },
    'can-bang': {
      title: 'Combo Cân bằng da đầu',
      note: 'Da đầu tiết dầu nhanh không phải do gội nhiều — do hàng rào ẩm bị phá. Gội cân bằng, dưỡng phần ngọn.',
      service: { name: 'Detox da đầu chuyên sâu', dur: '60 phút', price: 850000, slug: 'detox-da-dau' },
      items: ['dau-goi-can-bang-da-dau', 'dau-xa-phuc-hoi-argan', 'xit-duong-chuan-bi']
    },
    'chong-rung': {
      title: 'Combo Giảm rụng & dày sợi',
      note: 'Rụng tóc theo mùa cần 12 tuần đều đặn: serum mỗi tối, massage 2 phút, gội dịu không sulfate mạnh.',
      service: { name: 'Điều trị rụng tóc', dur: '75 phút', price: 1250000, slug: 'dieu-tri-rung-toc' },
      items: ['serum-da-dau-chong-rung', 'dau-goi-can-bang-da-dau', 'luoc-massage-go-oliu']
    },
    'cap-am': {
      title: 'Combo Cấp ẩm sâu',
      note: 'Tóc khô xơ mất nước ở lõi. Ưu tiên mặt nạ hàng tuần và dầu khoá nếp mỗi lần tạo kiểu.',
      service: { name: 'Ủ dưỡng sâu Atlas', dur: '45 phút', price: 690000, slug: 'u-duong-sau' },
      items: ['dau-goi-thao-moc-atlas', 'mat-na-u-sau-8-phut', 'dau-xa-phuc-hoi-argan']
    },
    'duy-tri': {
      title: 'Combo Duy trì nếp khoẻ',
      note: 'Tóc đang khoẻ chỉ cần giữ nhịp: làm sạch đúng, chuẩn bị trước nhiệt, khoá nếp cuối ngày.',
      service: { name: 'Gội & sấy tạo kiểu', dur: '40 phút', price: 320000, slug: 'goi-say-tao-kieu' },
      items: ['dau-goi-thao-moc-atlas', 'xit-duong-chuan-bi', 'kem-tao-kieu-mem']
    }
  };

  var PRODUCTS = {
    'dau-goi-thao-moc-atlas': { title: 'Dầu gội thảo mộc Atlas', variant: '250ml', price: 620000, img: 'https://picsum.photos/seed/s55/600/750', step: 'Bước 01 · Làm sạch' },
    'dau-goi-can-bang-da-dau': { title: 'Dầu gội cân bằng da đầu', variant: '250ml', price: 590000, img: 'https://picsum.photos/seed/au20/600/750', step: 'Bước 01 · Làm sạch' },
    'dau-xa-phuc-hoi-argan': { title: 'Dầu xả phục hồi Argan', variant: '200ml', price: 680000, img: 'https://picsum.photos/seed/s32/600/750', step: 'Bước 02 · Phục hồi' },
    'mat-na-u-sau-8-phut': { title: 'Mặt nạ ủ sâu 8 phút', variant: '180ml', price: 850000, img: 'https://picsum.photos/seed/au05/600/750', step: 'Bước 02 · Phục hồi' },
    'serum-da-dau-chong-rung': { title: 'Serum da đầu chống rụng', variant: '60ml', price: 1250000, img: 'https://picsum.photos/seed/s43/600/750', step: 'Bước 02 · Phục hồi' },
    'xit-duong-chuan-bi': { title: 'Xịt dưỡng chuẩn bị tạo kiểu', variant: '150ml', price: 520000, img: 'https://picsum.photos/seed/s01/600/750', step: 'Bước 03 · Chuẩn bị' },
    'kem-tao-kieu-mem': { title: 'Kem tạo kiểu mềm', variant: '100ml', price: 560000, img: 'https://picsum.photos/seed/s31/600/750', step: 'Bước 04 · Tạo kiểu' },
    'dau-khoa-nep-bergamot': { title: 'Dầu khoá nếp bergamot', variant: '50ml', price: 720000, img: 'https://picsum.photos/seed/s13/600/750', step: 'Bước 05 · Khoá nếp' },
    'luoc-massage-go-oliu': { title: 'Lược massage gỗ ô liu', variant: 'Thủ công', price: 380000, img: 'https://picsum.photos/seed/s40/600/750', step: 'Bước 02 · Phục hồi' }
  };

  function initQuiz() {
    var quiz = $('[data-quiz]');
    if (!quiz) return;

    var questions = $$('.quiz-q', quiz);
    var result = $('[data-quiz-result]');
    var bar = $('[data-quiz-bar]');
    var counter = $('[data-quiz-count]');
    var backBtn = $('[data-quiz-back]');
    var answers = {};
    var index = 0;

    function paint() {
      questions.forEach(function (q, i) { q.classList.toggle('is-active', i === index); });
      if (bar) bar.style.width = ((index + 1) / (questions.length + 1) * 100) + '%';
      if (counter) counter.textContent = 'Câu ' + (index + 1) + ' / ' + questions.length;
      if (backBtn) backBtn.hidden = index === 0;
      var active = questions[index];
      if (active) {
        var h = $('h2', active);
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }
    }

    function decide() {
      if (answers.q2 === 'dau') return 'can-bang';
      if (answers.q4 === 'rung' || answers.q2 === 'rung') return 'chong-rung';
      if (answers.q3 === 'co' || answers.q1 === 'nhuom') return 'phuc-hoi';
      if (answers.q1 === 'kho' || answers.q4 === 'am' || answers.q5 === 'nhieu') return 'cap-am';
      return 'duy-tri';
    }

    function renderResult() {
      var combo = COMBOS[decide()] || COMBOS['duy-tri'];
      var total = 0;
      var cardsHtml = combo.items.map(function (handle) {
        var p = PRODUCTS[handle];
        if (!p) return '';
        total += p.price;
        return '<article class="prod-card" data-handle="' + handle + '" data-title="' + p.title + '" data-price="' + p.price +
          '" data-img="' + p.img + '" data-variant="' + p.variant + '" data-url="san-pham.html">' +
          '<div class="pc-media"><img src="' + p.img + '" alt="' + p.title + '" loading="lazy" width="600" height="750"></div>' +
          '<div class="pc-body"><span class="pc-step">' + p.step + '</span>' +
          '<h3><a class="stretched" href="san-pham.html">' + p.title + '</a></h3>' +
          '<p class="pc-vol">' + p.variant + '</p>' +
          '<div class="pc-price"><span class="price">' + vnd(p.price) + '</span></div>' +
          '<button type="button" class="btn btn-outline btn-sm pc-add" data-add data-handle="' + handle +
          '" data-title="' + p.title + '" data-price="' + p.price + '" data-img="' + p.img +
          '" data-variant="' + p.variant + '" data-url="san-pham.html">Thêm vào giỏ</button>' +
          '</div></article>';
      }).join('');

      $('[data-result-title]', result).textContent = combo.title;
      $('[data-result-note]', result).textContent = combo.note;
      $('[data-result-grid]', result).innerHTML = cardsHtml;
      $('[data-result-total]', result).textContent = vnd(total);
      $('[data-result-svc]', result).textContent = combo.service.name;
      $('[data-result-svc-meta]', result).textContent = combo.service.dur + ' · từ ' + vnd(combo.service.price);
      var link = $('[data-result-book]', result);
      if (link) link.href = 'dat-lich.html?service=' + combo.service.slug;

      questions.forEach(function (q) { q.classList.remove('is-active'); });
      result.classList.add('is-active');
      if (bar) bar.style.width = '100%';
      if (counter) counter.textContent = 'Kết quả';
      if (backBtn) backBtn.hidden = true;
      var title = $('[data-result-title]', result);
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }

    quiz.addEventListener('click', function (e) {
      var opt = e.target.closest('.quiz-opt');
      if (!opt) return;
      var q = opt.closest('.quiz-q');
      answers[q.dataset.q] = opt.getAttribute('data-value');
      selectOnly($$('.quiz-opt', q), opt);
      if (index < questions.length - 1) { index += 1; paint(); }
      else renderResult();
    });

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (index > 0) { index -= 1; paint(); }
      });
    }

    var restart = $('[data-quiz-restart]');
    if (restart) {
      restart.addEventListener('click', function () {
        answers = {};
        index = 0;
        result.classList.remove('is-active');
        $$('.quiz-opt', quiz).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        paint();
      });
    }

    paint();
  }

  /* ============================ 08 TRANG SẢN PHẨM ============================ */
  function initPdp() {
    var main = $('[data-pdp-main]');
    if (main) {
      $$('[data-pdp-thumb]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectOnly($$('[data-pdp-thumb]'), btn);
          var img = $('img', btn);
          if (img) main.src = img.getAttribute('data-full') || img.src;
        });
      });
    }

    var qtyBox = $('[data-qty-box]');
    if (qtyBox) {
      var out = $('[data-qty-value]', qtyBox);
      var addBtn = $('[data-add][data-qty]');
      var val = 1;
      qtyBox.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        val = Math.min(99, Math.max(1, val + (btn.dataset.step === 'up' ? 1 : -1)));
        out.textContent = String(val);
        if (addBtn) addBtn.dataset.qty = String(val);
      });
    }
  }

  /* ============================ 09 TRƯỚC / SAU ============================ */
  function initBeforeAfter() {
    $$('[data-ba]').forEach(function (box) {
      var range = $('.ba-range', box);
      if (!range) return;
      function update() {
        box.style.setProperty('--pos', range.value + '%');
        range.setAttribute('aria-valuetext', 'Hiển thị ' + range.value + '% ảnh trước');
      }
      range.addEventListener('input', update);
      range.addEventListener('change', update);
      update();
    });
  }

  /* ============================ 10 BỘ LỌC CỬA HÀNG ============================ */
  function initShopFilter() {
    var grid = $('[data-shop-grid]');
    if (!grid) return;
    var cards = $$('.prod-card', grid);
    var countEl = $('[data-shop-count]');
    var empty = $('[data-shop-empty]');
    var sort = $('[data-shop-sort]');
    var active = { need: 'all', step: 'all' };

    function apply() {
      var visible = 0;
      cards.forEach(function (card) {
        var needOk = active.need === 'all' || (card.dataset.need || '').split(' ').indexOf(active.need) > -1;
        var stepOk = active.step === 'all' || card.dataset.step === active.step;
        var show = needOk && stepOk;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (countEl) countEl.textContent = visible + ' sản phẩm';
      if (empty) empty.hidden = visible !== 0;
    }

    function applySort() {
      if (!sort) return;
      var mode = sort.value;
      var order = cards.slice();
      if (mode === 'price-asc' || mode === 'price-desc') {
        order.sort(function (a, b) {
          var d = Number(a.dataset.price) - Number(b.dataset.price);
          return mode === 'price-asc' ? d : -d;
        });
      } else {
        order.sort(function (a, b) { return Number(a.dataset.order) - Number(b.dataset.order); });
      }
      order.forEach(function (card) { grid.appendChild(card); });
    }

    $$('[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var group = chip.getAttribute('data-filter');
        active[group] = chip.getAttribute('data-value');
        selectOnly($$('[data-filter="' + group + '"]'), chip);
        apply();
      });
    });

    if (sort) sort.addEventListener('change', applySort);

    var params = new URLSearchParams(window.location.search);
    var preset = params.get('buoc');
    if (preset) {
      var chipEl = $('[data-filter="step"][data-value="' + CSS.escape(preset) + '"]');
      if (chipEl) chipEl.click();
    }
    apply();
  }

  /* ============================ 11 ACCORDION / FORM ============================ */
  function initAccordion() {
    $$('.acc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.hidden = open;
      });
    });
  }

  function initForms() {
    $$('[data-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var status = $('[data-form-status]', form);
        if (form.checkValidity) {
          $$('[aria-invalid="true"]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
          if (!form.checkValidity()) {
            var firstBad = $('[required]:invalid', form);
            if (firstBad) {
              firstBad.focus();
              firstBad.setAttribute('aria-invalid', 'true');
            }
            if (status) {
              status.hidden = false;
              /* Thiếu ô đồng ý không phải lỗi nhập liệu — tách riêng để người
                 đọc biết đúng việc còn thiếu thay vì dò lại cả biểu mẫu. */
              status.textContent = firstBad && firstBad.name === 'consent'
                ? 'Vui lòng đồng ý với Chính sách bảo mật trước khi gửi.'
                : 'Vui lòng điền đầy đủ các trường bắt buộc.';
            }
            return;
          }
        }
        if (status) {
          status.hidden = false;
          status.textContent = form.dataset.form === 'newsletter'
            ? 'Đã ghi nhận email. Thư đầu tiên gửi vào thứ Năm hằng tuần.'
            : 'Đã nhận thông tin. Lễ tân sẽ gọi lại trong giờ làm việc.';
          status.setAttribute('role', 'status');
        }
        form.reset();
      });
    });
  }

  /* ============================ BANNER ĐỒNG Ý COOKIE ============================ */
  /* Trang không chạy analytics hay cookie theo dõi nào; banner chỉ ghi lại lựa
     chọn của người đọc. Nếu sau này gắn thêm công cụ đo lường thì phải chờ
     localStorage 'gdpr-consent' bằng 'accept' rồi mới nạp script. */
  function initGdpr() {
    var banner = $('.gdpr-banner');
    if (!banner) return;

    var KEY = 'gdpr-consent';
    var choice = null;
    /* Chế độ riêng tư hoặc chặn cookie làm localStorage ném lỗi khi đọc lẫn khi
       ghi — nuốt lỗi để một cái kho không dùng được không chặn cả trang. */
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

  /* ============================ 12 REVEAL ============================ */
  function initReveal() {
    var targets = $$('.reveal');
    if (!targets.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ============================ 13 PARALLAX HERO ============================ */
  function initHeroParallax() {
    var media = document.querySelector('.hero-media img');
    if (!media) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ticking = false;
    var maxY = 0;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          var y = window.scrollY;
          /* Dịch ảnh chậm hơn nội dung ~0.16x, tối đa 90px (scale 1.15 dư đủ) */
          var ty = Math.min(y * 0.16, 90);
          if (ty !== maxY) { maxY = ty; media.style.transform = 'scale(1.15) translateY(' + ty + 'px)'; }
          ticking = false;
        });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================ KHỞI ĐỘNG ============================ */
  function boot() {
    loadCart();
    initMobileMenu();
    initDrawer();
    initCartActions();
    initQuickView();
    renderCart();
    initBooking();
    initQuiz();
    initPdp();
    initBeforeAfter();
    initShopFilter();
    initAccordion();
    initForms();
    initReveal();
    initHeroParallax();
    initGdpr();
    var y = $('[data-year]');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
