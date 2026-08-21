/* NÔNG SỚM — một file JS, không phụ thuộc thư viện ngoài.
 * 01 Tiện ích        05 Select tuỳ biến    09 Bộ đếm số lượng   13 Đếm số liệu
 * 02 Menu mobile     06 Bộ lọc cửa hàng    10 Biểu mẫu & FAQ    14 Cookie GDPR
 * 03 Giỏ hàng        07 Chip mùa vụ        11 Reveal khi cuộn
 * 04 Trang giỏ       08 Ảnh sản phẩm       12 Parallax hero
 *
 * Quy ước chuyển động: JS chỉ gắn/tháo class, mọi thời lượng nằm trong CSS.
 * Mọi hiệu ứng đều kiểm tra prefers-reduced-motion trước khi chạy.
 */
(function () {
  'use strict';

  /* ============================ 01 TIỆN ÍCH ============================= */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var CART_KEY = 'nong-som-cart';
  var FREESHIP = 300000;
  var SHIP_FEE = 25000;

  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function vnd(n) {
    var v = Number(n) || 0;
    return v.toLocaleString('vi-VN') + 'đ';
  }

  /* Escape trước khi chèn innerHTML — dữ liệu giỏ nằm ở localStorage, người
     dùng (hoặc script khác cùng origin) có thể sửa được. */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Chế độ riêng tư hoặc chặn cookie làm localStorage ném lỗi cả khi đọc lẫn
     khi ghi — nuốt lỗi để một cái kho hỏng không chặn cả trang. */
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

  function parseMonths(raw) {
    if (!raw) return [];
    return String(raw).split(',').map(function (m) {
      return parseInt(m.trim(), 10);
    }).filter(function (m) { return m >= 1 && m <= 12; });
  }

  var currentMonth = new Date().getMonth() + 1;

  /* ============================ 02 MENU MOBILE ========================== */
  function initMobileNav() {
    var burger = $('[data-burger]');
    var panel = $('[data-mobile-panel]');
    if (!burger || !panel) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('data-open', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900) setOpen(false);
    });
  }

  /* ============================== 03 GIỎ HÀNG =========================== */
  function getCart() {
    var raw = readStore(CART_KEY, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (it) {
      return it && typeof it === 'object' && it.id && Number(it.price) >= 0;
    }).map(function (it) {
      return {
        id: String(it.id),
        name: String(it.name || ''),
        unit: String(it.unit || ''),
        img: String(it.img || ''),
        price: Number(it.price) || 0,
        qty: Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1))
      };
    });
  }

  function saveCart(items) {
    writeStore(CART_KEY, items);
    paintBadge(true);
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  function cartCount(items) {
    return items.reduce(function (sum, it) { return sum + it.qty; }, 0);
  }

  function cartSubtotal(items) {
    return items.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
  }

  function paintBadge(bump) {
    var n = cartCount(getCart());
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = String(n);
      el.setAttribute('data-empty', n === 0 ? 'true' : 'false');
      if (bump && n > 0 && !reduceMotion) {
        el.classList.remove('is-bump');
        /* đọc offsetWidth để trình duyệt khởi động lại animation */
        void el.offsetWidth;
        el.classList.add('is-bump');
      }
    });
  }

  function addToCart(item, qty) {
    var items = getCart();
    var found = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === item.id) { found = items[i]; break; }
    }
    if (found) {
      found.qty = Math.min(99, found.qty + qty);
    } else {
      items.push({
        id: item.id, name: item.name, unit: item.unit,
        img: item.img, price: item.price, qty: Math.min(99, qty)
      });
    }
    saveCart(items);
  }

  /* Phản hồi ngay trên nút vừa bấm — bản mẫu này không dùng toast. */
  function flashButton(btn) {
    var original = btn.getAttribute('data-label-original') || btn.textContent;
    btn.setAttribute('data-label-original', original);
    btn.setAttribute('data-added', 'true');
    btn.textContent = 'Đã thêm vào giỏ';
    window.clearTimeout(btn._flashTimer);
    btn._flashTimer = window.setTimeout(function () {
      btn.removeAttribute('data-added');
      btn.textContent = original;
    }, 1200);
  }

  function initAddButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-add-to-cart]') : null;
      if (!btn) return;
      e.preventDefault();

      var qty = 1;
      var qtyInput = btn.getAttribute('data-qty-source')
        ? $(btn.getAttribute('data-qty-source'))
        : null;
      if (qtyInput) qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);

      addToCart({
        id: btn.getAttribute('data-id'),
        name: btn.getAttribute('data-name'),
        unit: btn.getAttribute('data-unit'),
        img: btn.getAttribute('data-img'),
        price: Number(btn.getAttribute('data-price')) || 0
      }, qty);

      flashButton(btn);
    });
  }

  /* ============================== 04 TRANG GIỎ ========================== */
  function paintShipMeter(subtotal) {
    var meter = $('[data-ship-meter]');
    if (!meter) return;
    var fill = $('[data-ship-fill]', meter);
    var text = $('[data-ship-text]', meter);
    var ratio = Math.max(0, Math.min(1, subtotal / FREESHIP));
    var done = subtotal >= FREESHIP;

    if (fill) {
      fill.style.transform = 'scaleX(' + ratio.toFixed(3) + ')';
      fill.setAttribute('data-done', done ? 'true' : 'false');
    }
    if (text) {
      text.innerHTML = done
        ? 'Đơn của bạn đã <strong>được miễn phí giao hàng</strong>.'
        : 'Mua thêm <strong>' + esc(vnd(FREESHIP - subtotal)) + '</strong> để được freeship.';
    }
    meter.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  }

  /* shipFee = null nghĩa là chưa có gì trong giỏ — giấu luôn dòng phí giao. */
  function paintSummary(subtotal, shipFee) {
    var subEl = $('[data-cart-subtotal]');
    var totalEl = $('[data-cart-total]');
    var shipEl = $('[data-cart-shipfee]');
    var shipRow = $('[data-cart-shiprow]');

    if (shipRow) shipRow.hidden = shipFee === null;
    if (subEl) subEl.textContent = vnd(subtotal);
    if (shipEl && shipFee !== null) shipEl.textContent = shipFee === 0 ? 'Miễn phí' : vnd(shipFee);
    if (totalEl) totalEl.textContent = vnd(subtotal + (shipFee || 0));
  }

  function renderCart() {
    var list = $('[data-cart-list]');
    if (!list) return;

    var items = getCart();
    var empty = $('[data-cart-empty]');
    var panel = $('[data-cart-panel]');
    var summary = $('[data-cart-summary]');

    /* Giỏ rỗng thì không có gì để tính phí — ẩn hẳn dòng phí giao và đưa mọi
       con số về 0, nếu không giá của món vừa xoá vẫn còn nằm lại trên bảng. */
    if (!items.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      if (panel) panel.hidden = true;
      /* Bảng tổng tiền 0đ kèm nút "Tiến hành thanh toán" nhìn như bấm được */
      if (summary) summary.hidden = true;
      paintSummary(0, null);
      paintShipMeter(0);
      return;
    }

    if (empty) empty.hidden = true;
    if (panel) panel.hidden = false;
    if (summary) summary.hidden = false;

    list.innerHTML = items.map(function (it) {
      return '' +
        '<article class="cart-row" data-row="' + esc(it.id) + '">' +
          '<img src="' + esc(it.img) + '" alt="' + esc(it.name) + '" width="110" height="132" loading="lazy">' +
          '<div>' +
            '<h3 class="cart-row__name">' + esc(it.name) + '</h3>' +
            '<p class="cart-row__unit">' + esc(it.unit) + ' · ' + esc(vnd(it.price)) + '</p>' +
            '<div class="cart-row__foot">' +
              '<div class="qty">' +
                '<button type="button" data-cart-dec aria-label="Giảm số lượng ' + esc(it.name) + '">−</button>' +
                '<input type="number" min="1" max="99" step="1" value="' + it.qty + '" data-cart-qty aria-label="Số lượng ' + esc(it.name) + '">' +
                '<button type="button" data-cart-inc aria-label="Tăng số lượng ' + esc(it.name) + '">+</button>' +
              '</div>' +
              '<button type="button" class="link-remove" data-cart-remove>Xoá</button>' +
              '<span class="cart-row__price">' + esc(vnd(it.price * it.qty)) + '</span>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');

    var subtotal = cartSubtotal(items);
    paintSummary(subtotal, subtotal >= FREESHIP ? 0 : SHIP_FEE);
    paintShipMeter(subtotal);
  }

  function initCartPage() {
    var list = $('[data-cart-list]');
    if (!list) return;

    function updateQty(id, next) {
      var items = getCart();
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          items[i].qty = Math.max(1, Math.min(99, next));
          break;
        }
      }
      saveCart(items);
    }

    list.addEventListener('click', function (e) {
      var row = e.target.closest('[data-row]');
      if (!row) return;
      var id = row.getAttribute('data-row');
      var input = $('[data-cart-qty]', row);
      var value = parseInt(input && input.value, 10) || 1;

      if (e.target.closest('[data-cart-inc]')) updateQty(id, value + 1);
      else if (e.target.closest('[data-cart-dec]')) updateQty(id, value - 1);
      else if (e.target.closest('[data-cart-remove]')) {
        saveCart(getCart().filter(function (it) { return it.id !== id; }));
      }
    });

    list.addEventListener('change', function (e) {
      if (!e.target.matches('[data-cart-qty]')) return;
      var row = e.target.closest('[data-row]');
      if (!row) return;
      updateQty(row.getAttribute('data-row'), parseInt(e.target.value, 10) || 1);
    });

    document.addEventListener('cart:change', renderCart);
    renderCart();

    var checkout = $('[data-checkout]');
    if (checkout) {
      checkout.addEventListener('click', function () {
        var note = $('[data-checkout-note]');
        if (note) note.hidden = false;
        /* NỐI BACKEND: gửi getCart() + ghi chú đơn tới API thanh toán ở đây. */
      });
    }
  }

  /* ========================= 05 SELECT TUỲ BIẾN ========================= */
  /* Nút + listbox thay cho <select> native: bo tròn khớp .season-chip và điều
     khiển được hoàn toàn bằng bàn phím (Enter/Space mở, mũi tên duyệt, Enter
     chọn, Escape đóng). Trả về { value, reset } cho phần gọi. */
  function createSelect(root, onChange) {
    var btn = $('[data-select-btn]', root);
    var list = $('[data-select-list]', root);
    var valueEl = $('[data-select-value]', root);
    if (!btn || !list || !valueEl) return null;

    var opts = $$('[role="option"]', list);
    if (!opts.length) return null;

    var selected = 0;
    opts.forEach(function (o, i) {
      if (o.getAttribute('aria-selected') === 'true') selected = i;
    });
    var active = selected;

    function isOpen() { return btn.getAttribute('aria-expanded') === 'true'; }

    /* Con trỏ bàn phím tách khỏi lựa chọn đã chốt — duyệt bằng mũi tên không
       làm đổi giá trị cho tới khi nhấn Enter hoặc bấm chuột. */
    function paintActive() {
      opts.forEach(function (o, i) {
        if (i === active) o.classList.add('is-active');
        else o.classList.remove('is-active');
      });
      if (opts[active] && opts[active].id) {
        btn.setAttribute('aria-activedescendant', opts[active].id);
      }
    }

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      list.hidden = !open;
      if (open) { active = selected; paintActive(); }
      else btn.removeAttribute('aria-activedescendant');
    }

    function commit(i, silent) {
      if (i < 0 || i >= opts.length) return;
      selected = i;
      opts.forEach(function (o, k) {
        o.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      valueEl.textContent = opts[i].textContent;
      if (!silent && onChange) onChange(opts[i].getAttribute('data-value'));
    }

    btn.addEventListener('click', function () { setOpen(!isOpen()); });

    btn.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen()) { setOpen(true); return; }
        active = Math.max(0, Math.min(opts.length - 1, active + (k === 'ArrowDown' ? 1 : -1)));
        paintActive();
      } else if (k === 'Home' || k === 'End') {
        if (!isOpen()) return;
        e.preventDefault();
        active = k === 'Home' ? 0 : opts.length - 1;
        paintActive();
      } else if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
        e.preventDefault();
        if (!isOpen()) { setOpen(true); return; }
        commit(active);
        setOpen(false);
      } else if (k === 'Escape' || k === 'Esc') {
        if (!isOpen()) return;
        e.preventDefault();
        setOpen(false);
      } else if (k === 'Tab') {
        setOpen(false);
      }
    });

    list.addEventListener('click', function (e) {
      var opt = e.target.closest('[role="option"]');
      if (!opt) return;
      commit(opts.indexOf(opt));
      setOpen(false);
      btn.focus();
    });

    list.addEventListener('mousemove', function (e) {
      var opt = e.target.closest('[role="option"]');
      if (!opt) return;
      active = opts.indexOf(opt);
      paintActive();
    });

    /* Bấm ra ngoài thì đóng — nghe ở bubble để click chọn chạy xong trước */
    document.addEventListener('click', function (e) {
      if (isOpen() && !root.contains(e.target)) setOpen(false);
    });

    commit(selected, true);

    return {
      value: function () { return opts[selected].getAttribute('data-value'); },
      reset: function () { commit(0, true); setOpen(false); }
    };
  }

  /* ========================= 06 BỘ LỌC CỬA HÀNG ========================= */
  /* Ngăn kéo bộ lọc cho khổ hẹp — từ 900px CSS luôn hiện panel nên nút này
     chỉ còn tác dụng ở mobile/tablet. */
  function initFiltersToggle() {
    var btn = $('[data-filters-toggle]');
    var panel = $('[data-filters-panel]');
    if (!btn || !panel) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('data-open', open ? 'true' : 'false');
    });
  }

  function initShopFilters() {
    var grid = $('[data-shop-grid]');
    if (!grid) return;

    var cards = $$('[data-product]', grid);
    var countEl = $('[data-shop-count]');
    var emptyEl = $('[data-shop-empty]');
    var seasonOnly = $('[data-season-only]');
    var sortCtl = null;
    var priceCtl = null;

    /* Khoảng giá dạng "cận dưới-cận trên", để trống nghĩa là không giới hạn.
       Cận trên loại trừ nên hai khoảng liền nhau không cùng nhận một mức giá. */
    function inPriceRange(price) {
      var raw = priceCtl ? priceCtl.value() : 'all';
      if (!raw || raw === 'all') return true;
      var parts = raw.split('-');
      var lo = parts[0] === '' ? null : Number(parts[0]);
      var hi = parts[1] === '' ? null : Number(parts[1]);
      if (lo !== null && price < lo) return false;
      if (hi !== null && price >= hi) return false;
      return true;
    }

    function apply() {
      var cat = ($('[name="cat"]:checked') || {}).value || 'all';
      var onlySeason = seasonOnly ? seasonOnly.checked : false;
      var visible = 0;

      cards.forEach(function (card) {
        var price = Number(card.getAttribute('data-price')) || 0;
        var months = parseMonths(card.getAttribute('data-months'));
        var inSeason = months.indexOf(currentMonth) !== -1;
        var ok = true;

        if (cat !== 'all' && card.getAttribute('data-cat') !== cat) ok = false;
        if (!inPriceRange(price)) ok = false;
        if (onlySeason && !inSeason) ok = false;

        card.hidden = !ok;
        if (ok) visible++;
      });

      if (countEl) countEl.textContent = visible + ' sản phẩm';
      if (emptyEl) emptyEl.hidden = visible !== 0;
    }

    function sort() {
      if (!sortCtl) return;
      var mode = sortCtl.value();
      var sorted = cards.slice().sort(function (a, b) {
        var pa = Number(a.getAttribute('data-price')) || 0;
        var pb = Number(b.getAttribute('data-price')) || 0;
        var ra = Number(a.getAttribute('data-rank')) || 0;
        var rb = Number(b.getAttribute('data-rank')) || 0;
        var oa = Number(a.getAttribute('data-order')) || 0;
        var ob = Number(b.getAttribute('data-order')) || 0;
        if (mode === 'price-asc') return pa - pb;
        if (mode === 'price-desc') return pb - pa;
        if (mode === 'best') return rb - ra;
        return oa - ob;
      });
      sorted.forEach(function (card) { grid.appendChild(card); });
    }

    var sortRoot = $('[data-sort]');
    var priceRoot = $('[data-price-range]');
    if (sortRoot) sortCtl = createSelect(sortRoot, function () { sort(); apply(); });
    if (priceRoot) priceCtl = createSelect(priceRoot, apply);

    $$('[name="cat"]').forEach(function (el) { el.addEventListener('change', apply); });
    if (seasonOnly) seasonOnly.addEventListener('change', apply);

    var reset = $('[data-filter-reset]');
    if (reset) {
      reset.addEventListener('click', function () {
        var all = $('[name="cat"][value="all"]');
        if (all) all.checked = true;
        if (seasonOnly) seasonOnly.checked = false;
        if (priceCtl) priceCtl.reset();
        if (sortCtl) sortCtl.reset();
        sort();
        apply();
      });
    }

    /* Vào từ footer/danh mục dạng shop.html#trai-cay thì chọn sẵn danh mục đó */
    var hash = (window.location.hash || '').replace('#', '');
    if (hash) {
      var preset = $('[name="cat"][value="' + hash.replace(/[^a-z-]/g, '') + '"]');
      if (preset) preset.checked = true;
    }

    sort();
    apply();
  }

  /* ============================ 07 CHIP MÙA VỤ ========================== */
  /* Huy hiệu "Đang vào mùa" tính từ tháng thật của máy người xem, không hard-code. */
  function markSeason() {
    $$('[data-months]').forEach(function (card) {
      var months = parseMonths(card.getAttribute('data-months'));
      var slot = $('[data-season-slot]', card);
      if (!slot) return;
      if (months.indexOf(currentMonth) !== -1) {
        slot.innerHTML = '<span class="badge badge-season">Đang vào mùa</span>';
      } else {
        slot.innerHTML = '';
      }
    });
  }

  function initSeasonChips() {
    var bar = $('[data-season-bar]');
    var grid = $('[data-season-grid]');
    if (!bar || !grid) return;

    var chips = $$('.season-chip', bar);
    var cards = $$('[data-product]', grid);
    var emptyEl = $('[data-season-empty]');
    var labelEl = $('[data-season-label]');

    function select(month) {
      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed',
          parseInt(chip.getAttribute('data-month'), 10) === month ? 'true' : 'false');
      });

      var visible = 0;
      cards.forEach(function (card) {
        var months = parseMonths(card.getAttribute('data-months'));
        var ok = months.indexOf(month) !== -1;
        card.hidden = !ok;
        if (ok) visible++;
      });

      if (labelEl) labelEl.textContent = 'tháng ' + month;
      if (emptyEl) emptyEl.hidden = visible !== 0;
    }

    chips.forEach(function (chip) {
      var m = parseInt(chip.getAttribute('data-month'), 10);
      if (m === currentMonth) chip.setAttribute('data-now', 'true');
      chip.addEventListener('click', function () { select(m); });
    });

    select(currentMonth);
  }

  /* =========================== 08 ẢNH SẢN PHẨM ========================== */
  /* Ba thumbnail không có trạng thái nào thì không biết đang xem ảnh nào. */
  function initGallery() {
    var gal = $('[data-gallery]');
    var main = $('[data-gallery-main]');
    if (!gal || !main) return;

    var thumbs = $$('[data-thumb]', gal);
    gal.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-thumb]');
      if (!btn) return;
      var full = btn.getAttribute('data-full');
      if (!full) return;
      thumbs.forEach(function (t) {
        t.setAttribute('aria-current', t === btn ? 'true' : 'false');
      });
      main.src = full;
    });
  }

  /* ========================= 09 BỘ ĐẾM SỐ LƯỢNG ========================= */
  function initSteppers() {
    $$('[data-stepper]').forEach(function (box) {
      var input = $('input', box);
      if (!input) return;
      $$('button', box).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var step = btn.hasAttribute('data-inc') ? 1 : -1;
          var next = (parseInt(input.value, 10) || 1) + step;
          input.value = Math.max(1, Math.min(99, next));
        });
      });
      input.addEventListener('change', function () {
        input.value = Math.max(1, Math.min(99, parseInt(input.value, 10) || 1));
      });
    });
  }

  /* ========================== 10 BIỂU MẪU & FAQ ========================= */
  var PHONE_VN = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(field, message) {
    var slot = $('.field-error', field);
    field.setAttribute('data-invalid', message ? 'true' : 'false');
    if (slot) slot.textContent = message || '';
    var input = $('input, textarea, select', field);
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateForm(form) {
    var ok = true;
    $$('.field', form).forEach(function (field) {
      var input = $('input, textarea, select', field);
      if (!input || input.type === 'checkbox') return;
      var value = (input.value || '').trim();
      var message = '';

      if (input.required && !value) message = 'Vui lòng điền thông tin này.';
      else if (value && input.type === 'email' && !EMAIL.test(value)) message = 'Email chưa đúng định dạng.';
      else if (value && input.type === 'tel' && !PHONE_VN.test(value.replace(/[\s.]/g, ''))) {
        message = 'Số điện thoại chưa đúng (ví dụ 0901234567).';
      }

      setError(field, message);
      if (message && ok) { ok = false; input.focus(); }
    });

    /* Ô đồng ý báo lỗi giống ba trường kia — trước đây chỉ focus im lặng nên
       người dùng tưởng nút gửi hỏng. */
    var consent = $('input[name="consent"]', form);
    if (consent) {
      var consentField = consent.closest ? consent.closest('.field') : null;
      var consentMsg = consent.checked ? '' : 'Vui lòng đồng ý với Chính sách bảo mật.';
      if (consentField) setError(consentField, consentMsg);
      else consent.setAttribute('aria-invalid', consentMsg ? 'true' : 'false');
      if (consentMsg) {
        if (ok) consent.focus();
        ok = false;
      }
    }
    return ok;
  }

  function initForms() {
    $$('form[data-validate]').forEach(function (form) {
      var ok = $('[data-form-ok]', form);
      form.setAttribute('novalidate', 'novalidate');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (ok) ok.hidden = true;
        if (!validateForm(form)) return;
        /* NỐI BACKEND: bản mẫu không gửi dữ liệu đi đâu — thay bằng fetch() thật. */
        if (ok) ok.hidden = false;
        form.reset();
      });

      form.addEventListener('input', function (e) {
        var field = e.target.closest ? e.target.closest('.field') : null;
        if (field && field.getAttribute('data-invalid') === 'true') setError(field, '');
      });
    });
  }

  function initFaq() {
    $$('.faq__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.hidden = open;
      });
    });
  }

  /* ========================== 11 REVEAL KHI CUỘN ======================== */
  function initReveal() {
    var targets = $$('.reveal, .line-reveal');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
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

  /* =========================== 12 PARALLAX HERO ========================= */
  function initParallax() {
    var img = $('[data-parallax]');
    if (!img || reduceMotion) return;

    var ticking = false;

    function paint() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var ty = Math.min(y * 0.16, 90);
      img.style.setProperty('--py', ty.toFixed(1) + 'px');
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    }, { passive: true });

    paint();
  }

  /* =========================== 13 ĐẾM SỐ LIỆU =========================== */
  function initCountUp() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function finalValue(el) {
      return Number(el.getAttribute('data-count')) || 0;
    }

    function paintFinal(el) {
      el.textContent = finalValue(el).toLocaleString('vi-VN');
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nums.forEach(paintFinal);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);

        var target = finalValue(el);
        var start = null;
        var DUR = 800;

        function tick(now) {
          if (start === null) start = now;
          var p = Math.min(1, (now - start) / DUR);
          /* ease-out để số dừng lại mềm, khớp cảm giác với --ease-out của CSS */
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('vi-VN');
          if (p < 1) window.requestAnimationFrame(tick);
        }
        window.requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });

    nums.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }

  /* ============================ 14 COOKIE GDPR ========================== */
  /* Chỉ ghi nhận lựa chọn. Khi gắn analytics thật, chỉ nạp script sau khi
     localStorage 'gdpr-consent' === 'accept'. */
  function initGdpr() {
    var banner = $('.gdpr-banner');
    if (!banner) return;

    var KEY = 'gdpr-consent';
    var choice = null;
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

  /* =============================== KHỞI ĐỘNG ============================ */
  function boot() {
    initMobileNav();
    paintBadge(false);
    initAddButtons();
    initCartPage();
    initFiltersToggle();
    initShopFilters();
    initGallery();
    markSeason();
    initSeasonChips();
    initSteppers();
    initForms();
    initFaq();
    initReveal();
    initParallax();
    initCountUp();
    initGdpr();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
