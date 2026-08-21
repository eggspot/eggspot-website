/* Landing máy massage cổ vai gáy — script trang.
   10 phần: GDPR · lọc theo tab · countdown evergreen · gallery ảnh sản phẩm ·
   dải mua nhanh dính đỉnh · xem nhanh sản phẩm · đồng bộ combo/gói mua ·
   form đặt hàng · popup đặt hàng · FAQ.
   Không phụ thuộc thư viện ngoài, không để lại biến toàn cục. */
(function () {
  'use strict';

  /* Tiện ích dùng chung cho cả tệp. */
  var $all = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* Gộp nhiều lần gọi trong cùng một khung hình thành một lần chạy. */
  var rafThrottle = function (fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; fn(); });
    };
  };

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. GDPR ---------- */
  var STORAGE_KEY = 'gdpr-consent';
  var banner = document.querySelector('[data-gdpr-banner]');

  if (banner) {
    var saved = null;
    try { saved = window.localStorage.getItem(STORAGE_KEY); } catch (e) { saved = 'unavailable'; }
    if (!saved) banner.hidden = false;

    banner.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-gdpr]');
      if (!btn) return;
      try { window.localStorage.setItem(STORAGE_KEY, btn.getAttribute('data-gdpr')); } catch (e) { /* chế độ riêng tư: bỏ qua */ }
      banner.hidden = true;
    });
  }

  /* ---------- 2. Tab lọc sản phẩm ----------
     Tab active dùng gạch chân đen (.is-on), aria-selected phản ánh trạng thái thật.
     Bàn phím: mũi tên trái/phải chuyển tab như tablist chuẩn. */
  var tabs = $all('.tk-tab');
  var cards = $all('.tk-card');
  var grid = document.getElementById('grid-sp');
  var emptyNote = document.querySelector('[data-grid-empty]');

  var applyTab = function (tab) {
    var cat = tab.getAttribute('data-cat');
    var shown = 0;

    tabs.forEach(function (other) {
      var on = other === tab;
      other.classList.toggle('is-on', on);
      other.setAttribute('aria-selected', on ? 'true' : 'false');
      other.tabIndex = on ? 0 : -1;
    });

    cards.forEach(function (card) {
      var match = cat === 'all' || card.getAttribute('data-cat') === cat;
      card.hidden = !match;
      if (match) shown++;
    });

    if (emptyNote) emptyNote.hidden = shown > 0;
    if (grid) grid.setAttribute('aria-labelledby', tab.id);
  };

  if (tabs.length) {
    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.classList.contains('is-on') ? 0 : -1;

      tab.addEventListener('click', function () { applyTab(tab); });

      tab.addEventListener('keydown', function (ev) {
        var step = ev.key === 'ArrowRight' ? 1 : (ev.key === 'ArrowLeft' ? -1 : 0);
        if (!step) return;
        ev.preventDefault();
        var next = tabs[(i + step + tabs.length) % tabs.length];
        next.focus();
        applyTab(next);
      });
    });
  }

  /* ---------- 3. Countdown evergreen ----------
     Đồng hồ 7h36m12s tính từ lúc tải trang và tự đặt lại khi về 0 — không có
     deadline thật nên không lệ thuộc múi giờ hay thời điểm khách mở trang.
     Mỗi nhịp tính lại từ Date.now() để tab bị trình duyệt bóp ga vẫn hiển thị đúng.
     prefers-reduced-motion: giữ số tĩnh, không nhấp nháy mỗi giây. */
  var cells = $all('[data-countdown] [data-cd]');

  if (cells.length) {
    var CD_TOTAL = 7 * 3600 + 36 * 60 + 12;
    var startedAt = Date.now();

    var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

    var tick = function () {
      var elapsed = Math.floor((Date.now() - startedAt) / 1000);
      var left = CD_TOTAL - (elapsed % CD_TOTAL);
      var parts = {
        h: pad2(Math.floor(left / 3600)),
        m: pad2(Math.floor((left % 3600) / 60)),
        s: pad2(left % 60)
      };
      cells.forEach(function (cell) {
        var val = parts[cell.getAttribute('data-cd')];
        if (val && cell.textContent !== val) cell.textContent = val;
      });
    };

    tick();
    if (!REDUCED) window.setInterval(tick, 1000);
  }

  /* ---------- 4. Gallery ảnh sản phẩm ----------
     Việc vuốt do chính trình duyệt lo: track là vùng cuộn ngang có
     scroll-snap-type: x mandatory. JS chỉ đồng bộ chấm/số đếm theo vị trí cuộn
     và cho phép bấm mũi tên hoặc chấm để nhảy ảnh. */
  var track = document.querySelector('[data-gal-track]');

  if (track) {
    var slides = track.children;
    var counter = document.querySelector('[data-gal-count]');

    /* Chấm chỉ mục sinh theo số ảnh thật, khỏi phải sửa hai nơi khi thêm bớt ảnh. */
    var dotBox = document.querySelector('[data-gal-dots]');
    Array.prototype.forEach.call(slides, function (slide, n) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'tk-gal__dot';
      dot.setAttribute('data-gal-go', n);
      dot.setAttribute('aria-label', 'Xem ảnh ' + (n + 1) + ' trên ' + slides.length);
      if (n === 0) dot.setAttribute('aria-current', 'true');
      dotBox.appendChild(dot);
    });
    var dots = $all('[data-gal-go]');
    var arrows = $all('[data-gal-step]');
    var current = 0;

    var indexNow = function () {
      var w = track.clientWidth;
      if (!w) return 0;
      return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / w)));
    };

    var paint = function () {
      var i = indexNow();
      if (i === current) return;
      current = i;
      dots.forEach(function (dot, n) {
        if (n === i) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (counter) counter.textContent = (i + 1) + '/' + slides.length;
      arrows.forEach(function (btn) {
        var step = Number(btn.getAttribute('data-gal-step'));
        btn.disabled = (step < 0 && i === 0) || (step > 0 && i === slides.length - 1);
      });
    };

    var goTo = function (i) {
      var target = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: target * track.clientWidth, behavior: REDUCED ? 'auto' : 'smooth' });
    };

    track.addEventListener('scroll', rafThrottle(paint), { passive: true });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () { goTo(Number(dot.getAttribute('data-gal-go'))); });
    });

    arrows.forEach(function (btn) {
      btn.addEventListener('click', function () { goTo(indexNow() + Number(btn.getAttribute('data-gal-step'))); });
    });

    /* Bàn phím: track nhận focus được nên mũi tên trái/phải cũng chuyển ảnh. */
    track.addEventListener('keydown', function (ev) {
      var step = ev.key === 'ArrowRight' ? 1 : (ev.key === 'ArrowLeft' ? -1 : 0);
      if (!step) return;
      ev.preventDefault();
      goTo(indexNow() + step);
    });

    current = -1;
    paint();
  }

  /* ---------- 5. Dải mua nhanh dính đỉnh ----------
     Hiện khi khối hero (ảnh + thanh giá flash) đã cuộn hết khỏi khung nhìn, để
     giá và đồng hồ đếm ngược luôn có mặt. Vị trí tính lại từ getBoundingClientRect
     nên vẫn đúng khi trang mở thẳng vào giữa bài bằng liên kết neo. */
  var stickyBuy = document.querySelector('[data-sticky-buy]');
  var hero = document.querySelector('.tk-hero');

  if (stickyBuy && hero) {
    var syncSticky = function () {
      stickyBuy.hidden = hero.getBoundingClientRect().bottom > 0;
    };

    if ('IntersectionObserver' in window) {
      /* rootMargin âm ở trên khiến observer báo lại đúng lúc hero vừa khuất mép trên. */
      new IntersectionObserver(syncSticky, { threshold: [0, 1] }).observe(hero);
    } else {
      window.addEventListener('scroll', rafThrottle(syncSticky), { passive: true });
      window.addEventListener('resize', rafThrottle(syncSticky));
    }

    syncSticky();
  }

  /* ---------- 6. Xem nhanh sản phẩm ----------
     Card trong gian hàng là <button>: bấm mở hộp thoại đọc dữ liệu từ data-*.
     Đóng bằng X, Escape hoặc bấm nền; Tab quay vòng trong panel; trả focus về card. */
  var modal = document.querySelector('[data-quickview]');

  if (modal && cards.length) {
    var panel = modal.querySelector('.tk-modal__panel');
    var qvImg = modal.querySelector('[data-qv-img]');
    var qvTitle = modal.querySelector('[data-qv-title]');
    var qvPrice = modal.querySelector('[data-qv-price]');
    var qvOld = modal.querySelector('[data-qv-old]');
    var qvDesc = modal.querySelector('[data-qv-desc]');
    var opener = null;
    var FOCUSABLE = 'a[href], button:not([disabled])';

    var focusables = function () { return $all(FOCUSABLE, panel); };

    var closeModal = function () {
      modal.hidden = true;
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    };

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        opener = card;
        qvImg.src = card.getAttribute('data-img');
        qvImg.alt = card.getAttribute('data-name');
        qvTitle.textContent = card.getAttribute('data-name');
        qvPrice.textContent = card.getAttribute('data-price');
        qvOld.textContent = card.getAttribute('data-old');
        qvDesc.textContent = card.getAttribute('data-desc');
        modal.hidden = false;
        focusables()[0].focus();
      });
    });

    modal.addEventListener('click', function (ev) {
      if (ev.target === modal || ev.target.closest('[data-qv-close]')) closeModal();
    });

    document.addEventListener('keydown', function (ev) {
      if (modal.hidden) return;
      if (ev.key === 'Escape') { ev.preventDefault(); closeModal(); return; }
      if (ev.key !== 'Tab') return;
      var items = focusables();
      var first = items[0];
      var last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
  }

  /* ---------- 7. Đồng bộ combo và gói mua ----------
     Ô combo và radio gói mua là hai nhóm khác nhau (ưu đãi kèm vs số lượng máy) nên vẫn
     gửi đi cùng lúc được. Riêng ô "Mua 2 máy" khai báo data-pack vì nó tự nói ra số lượng
     — nếu để lệch với gói đang chọn thì đơn hàng mâu thuẫn. Hàm này giữ hai bên khớp nhau
     theo cả hai chiều; hai ô còn lại không khai báo số lượng nên không có gì để chỏi. */
  var comboInputs = $all('.tk-combo__i input');
  var packInputs = $all('.tk-pack input');

  var syncPacks = function (source) {
    var pack = source.getAttribute('data-pack');

    if (pack) {
      /* bấm ô combo -> chọn đúng gói mua mà nó hàm ý (mọi form đang có trên trang) */
      packInputs.forEach(function (input) {
        if (input.value === pack) input.checked = true;
      });
      return;
    }

    /* bấm gói mua -> bỏ chọn ô combo nào đang hàm ý một gói khác */
    comboInputs.forEach(function (input) {
      var implied = input.getAttribute('data-pack');
      if (input.checked && implied && implied !== source.value) input.checked = false;
    });
  };

  comboInputs.concat(packInputs).forEach(function (input) {
    input.addEventListener('change', function () { if (input.checked) syncPacks(input); });
  });

  /* ---------- 8. Form đặt hàng ----------
     Bản minh hoạ: chặn submit, kiểm tra tại chỗ rồi báo kết quả trong vùng role="status".
     KHÔNG gửi dữ liệu đi đâu và KHÔNG lưu localStorage — nối backend thật sau.
     Dùng chung cho form trong trang và form trong popup "Mua ngay". */
  var ERR = 'Vui lòng điền họ tên, số điện thoại di động Việt Nam hợp lệ, địa chỉ nhận hàng và tích đồng ý chính sách bảo mật.';

  $all('form[data-order]').forEach(function (form) {
    var note = form.parentNode.querySelector('[data-form-note]');
    if (!note) return;

    var flagFields = function () {
      var bad = null;
      Array.prototype.forEach.call(form.elements, function (field) {
        if (!field.willValidate) return;
        if (field.checkValidity()) {
          field.removeAttribute('aria-invalid');
        } else {
          field.setAttribute('aria-invalid', 'true');
          if (!bad) bad = field;
        }
      });
      return bad;
    };

    form.addEventListener('input', function (ev) {
      var field = ev.target;
      if (field.willValidate && field.checkValidity()) field.removeAttribute('aria-invalid');
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      if (!form.checkValidity()) {
        var bad = flagFields();
        note.className = 'tk-note is-error';
        note.textContent = ERR;
        if (bad) bad.focus();
        return;
      }

      var pack = form.elements['goi'];
      var deal = form.elements['uu-dai'];
      note.className = 'tk-note is-ok';
      note.innerHTML = '<p>Đã nhận đơn: <b>' + (pack ? pack.value : '') + '</b>' +
        (deal && deal.value ? ' · ưu đãi ' + deal.value : '') +
        '. Nhân viên gọi xác nhận trong 15 phút — chốt nhanh qua Zalo:</p>' +
        '<a class="tk-note__zalo" href="https://zalo.me/0900123456">Nhắn Zalo 0900 123 456</a>';
      form.reset();
    });
  });

  /* ---------- 9. Popup đặt hàng ----------
     Mở từ nút "Mua ngay" ở thanh hành động và ở cụm CTA desktop.
     Đóng bằng X, phím Escape hoặc bấm nền; Tab quay vòng trong panel;
     trả focus về đúng nút đã mở. */
  var popup = document.querySelector('[data-order-popup]');

  if (popup) {
    var popupPanel = popup.querySelector('.tk-popup__panel');
    var popupOpener = null;
    var POPUP_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled])';

    var popupItems = function () {
      return $all(POPUP_FOCUSABLE, popupPanel).filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0;
      });
    };

    var closePopup = function () {
      popup.hidden = true;
      document.body.style.removeProperty('overflow');
      if (popupOpener && document.contains(popupOpener)) popupOpener.focus();
      popupOpener = null;
    };

    document.addEventListener('click', function (ev) {
      var opener = ev.target.closest('[data-open-order]');
      if (opener) {
        popupOpener = opener;
        popup.hidden = false;
        document.body.style.overflow = 'hidden';
        var items = popupItems();
        if (items.length) items[items.length > 1 ? 1 : 0].focus();
        return;
      }
      if (popup.hidden) return;
      if (ev.target === popup || ev.target.closest('[data-popup-close]')) closePopup();
    });

    document.addEventListener('keydown', function (ev) {
      if (popup.hidden) return;
      if (ev.key === 'Escape') { ev.preventDefault(); closePopup(); return; }
      if (ev.key !== 'Tab') return;
      var items = popupItems();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
  }

  /* ---------- 10. FAQ: mỗi lần chỉ mở 1 mục ---------- */
  var faq = document.querySelector('.tk-faq');

  if (faq) {
    faq.addEventListener('toggle', function (ev) {
      var item = ev.target;
      if (item.tagName !== 'DETAILS' || !item.open) return;
      faq.querySelectorAll('details[open]').forEach(function (other) {
        if (other !== item) other.open = false;
      });
    }, true);
  }
})();
