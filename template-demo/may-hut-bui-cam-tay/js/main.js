/* Máy hút bụi cầm tay mini USB — landing script
   Gồm 3 phần: GDPR consent, sticky CTA (IntersectionObserver), FAQ accordion.
   Không phụ thuộc thư viện ngoài. */
(function () {
  'use strict';

  /* ---------- 1. GDPR cookie consent ---------- */
  var STORAGE_KEY = 'gdpr-consent';
  var banner = document.querySelector('.gdpr-banner');

  function readConsent() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return 'unavailable'; }
  }

  function saveConsent(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* private mode: bỏ qua */ }
  }

  if (banner) {
    if (!readConsent()) {
      banner.hidden = false;
    }
    banner.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-gdpr]');
      if (!btn) return;
      saveConsent(btn.getAttribute('data-gdpr')); // "essential" | "accept"
      banner.hidden = true;
    });
  }

  /* ---------- 2. Sticky CTA mobile ----------
     Một quy tắc duy nhất: thanh sticky hiện khi KHÔNG có nút mua nào đang nằm trong
     khung nhìn — dù đó là CTA trong hero hay khối ưu đãi cuối trang. Nhờ vậy màn hình
     đầu tiên trên máy cao 844px (CTA hero nằm dưới nếp gấp) luôn có sẵn một nút đặt
     mua, mà vẫn không bao giờ có 2 nút mua chồng nhau.
     Vị trí tính lại từ getBoundingClientRect nên vẫn đúng khi trang nhảy thẳng tới giữa
     bài (anchor link, khôi phục vị trí cuộn) — IntersectionObserver chỉ dùng để phản ứng
     tức thì khi hai khối CTA vào/ra khỏi khung nhìn. */
  var sticky = document.querySelector('.sticky-cta');
  var heroCta = document.querySelector('[data-sticky-start]');
  var finalCta = document.querySelector('[data-sticky-stop]');

  if (sticky) {
    var scheduled = false;

    var viewportH = function () {
      return window.innerHeight || document.documentElement.clientHeight;
    };

    /* Coi CTA hero là "đang hiển thị" khi lộ ra ít nhất chiều cao trọn một nút,
       để một mẩu nút ló ở mép màn hình không làm ẩn thanh sticky. */
    var heroCtaInView = function () {
      if (!heroCta) return false;
      var r = heroCta.getBoundingClientRect();
      var shown = Math.min(r.bottom, viewportH()) - Math.max(r.top, 0);
      return shown >= Math.min(r.height, 56);
    };

    var atFinalCta = function () {
      if (!finalCta) return false;
      var r = finalCta.getBoundingClientRect();
      return r.top < viewportH() * 0.85 && r.bottom > 0;
    };

    var sync = function () {
      sticky.classList.toggle('is-on', !heroCtaInView() && !atFinalCta());
    };

    var schedule = function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () { scheduled = false; sync(); });
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function () { sync(); }, {
        threshold: [0, 0.15, 0.5]
      });
      if (heroCta) io.observe(heroCta);
      if (finalCta) io.observe(finalCta);
    }

    sync();
  }

  /* ---------- 3. FAQ: mỗi lần chỉ mở 1 mục ---------- */
  var faq = document.querySelector('.faq');
  if (faq) {
    faq.addEventListener('toggle', function (ev) {
      var item = ev.target;
      if (item.tagName !== 'DETAILS' || !item.open) return;
      faq.querySelectorAll('details[open]').forEach(function (other) {
        if (other !== item) other.open = false;
      });
    }, true);
  }

  /* ---------- 4. Countdown evergreen ----------
     Đồng hồ "giờ vàng" 9h48m33s bắt đầu từ lúc trang tải và tự đặt lại khi về 0.
     Không có deadline thật nên không phụ thuộc múi giờ hay thời điểm mở trang.
     Mốc tính lại từ Date.now() mỗi nhịp nên tab bị trình duyệt bóp ga vẫn hiển thị đúng.
     prefers-reduced-motion: giữ số tĩnh, không nhấp nháy mỗi giây. */
  var clocks = document.querySelectorAll('[data-countdown]');
  if (clocks.length) {
    var CD_TOTAL = 9 * 3600 + 48 * 60 + 33;
    var startedAt = Date.now();

    var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

    var paint = function (left) {
      var parts = {
        d: pad2(Math.floor(left / 86400)),
        h: pad2(Math.floor((left % 86400) / 3600)),
        m: pad2(Math.floor((left % 3600) / 60)),
        s: pad2(left % 60)
      };
      Array.prototype.forEach.call(clocks, function (clock) {
        Object.keys(parts).forEach(function (key) {
          var cell = clock.querySelector('[data-cd="' + key + '"]');
          if (cell && cell.textContent !== parts[key]) cell.textContent = parts[key];
        });
      });
    };

    var tick = function () {
      var elapsed = Math.floor((Date.now() - startedAt) / 1000);
      paint(CD_TOTAL - (elapsed % CD_TOTAL));
    };

    tick();
    var stillMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!stillMotion) window.setInterval(tick, 1000);
  }

  /* ---------- 5. Form đặt hàng ----------
     Bản demo: chặn submit, kiểm tra tại chỗ rồi báo kết quả qua vùng role="status".
     KHÔNG gửi dữ liệu đi đâu và KHÔNG lưu localStorage — khách nối backend thật sau. */
  var ERR_MSG = 'Vui lòng điền đầy đủ họ tên, số điện thoại hợp lệ, địa chỉ nhận hàng, chọn combo và tích đồng ý chính sách bảo mật.';

  var firstInvalid = function (form) {
    var found = null;
    Array.prototype.some.call(form.elements, function (field) {
      if (field.willValidate && !field.checkValidity()) { found = field; return true; }
      return false;
    });
    return found;
  };

  Array.prototype.forEach.call(document.querySelectorAll('.order-form'), function (form) {
    var note = form.parentNode.querySelector('.form-note');

    /* Xoá cờ lỗi ngay khi người dùng sửa, để viền đỏ không dính lại. */
    form.addEventListener('input', function (ev) {
      var field = ev.target;
      if (field.willValidate && field.checkValidity()) field.removeAttribute('aria-invalid');
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!note) return;

      var bad = form.checkValidity() ? null : firstInvalid(form);
      if (bad) {
        Array.prototype.forEach.call(form.elements, function (field) {
          if (!field.willValidate) return;
          if (field.checkValidity()) field.removeAttribute('aria-invalid');
          else field.setAttribute('aria-invalid', 'true');
        });
        note.className = 'form-note is-error';
        note.textContent = ERR_MSG;
        bad.focus();
        return;
      }

      note.className = 'form-note is-ok';
      note.innerHTML = '<p>Đã nhận đơn của bạn! Nhân viên sẽ gọi xác nhận trong 15 phút. ' +
        'Chốt nhanh hơn qua Zalo:</p>' +
        '<a class="btn btn--zalo" href="https://zalo.me/0987654321">Nhắn Zalo ngay</a>';
      form.reset();
    });
  });

  /* ---------- 6. Popup đặt hàng ----------
     Mở từ nút "Mua Ngay" ở sticky CTA. Đóng bằng X, phím Escape hoặc click nền.
     Focus trap nhẹ: Tab quay vòng trong panel, trả focus về nút đã mở khi đóng. */
  var popup = document.getElementById('order-popup');
  if (popup) {
    var panel = popup.querySelector('.order-popup__panel');
    var opener = null;
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

    var focusables = function () {
      return Array.prototype.filter.call(panel.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0;
      });
    };

    var openPopup = function (trigger) {
      opener = trigger || null;
      popup.hidden = false;
      document.body.classList.add('has-popup');
      var items = focusables();
      if (items.length) items[0].focus();
    };

    var closePopup = function () {
      popup.hidden = true;
      document.body.classList.remove('has-popup');
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    };

    document.addEventListener('click', function (ev) {
      var open = ev.target.closest ? ev.target.closest('[data-open-order]') : null;
      if (open) { ev.preventDefault(); openPopup(open); return; }
      if (!popup.hidden && ev.target.closest && ev.target.closest('[data-close-order]')) closePopup();
    });

    document.addEventListener('keydown', function (ev) {
      if (popup.hidden) return;
      if (ev.key === 'Escape') { ev.preventDefault(); closePopup(); return; }
      if (ev.key !== 'Tab') return;
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
  }
})();
