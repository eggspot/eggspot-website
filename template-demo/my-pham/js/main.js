/* =========================================================================
   NHỤY — MỸ PHẨM THỰC VẬT
   01 Tiện ích · 02 Chuyển động · 03 Điều hướng · 04 Reveal đầu khối
   05 Thanh % thành phần · 06 Xem nhanh sản phẩm · 07 Giỏ hàng demo
   08 Form · 09 Parallax ảnh hero · 10 Cổng mở trang · 11 Giờ mở cửa
   12 Dải khẩu hiệu · 13 Lựa chọn cookie
   ========================================================================= */
(function () {
  'use strict';

  /* ---- 01 Tiện ích ----------------------------------------------------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---- 02 Chuyển động -------------------------------------------------- */
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionQuery.matches; };

  /* ---- 03 Điều hướng --------------------------------------------------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;

    var setOpen = function (open) {
      nav.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      /* Khoá cuộn ở phần tử gốc, không phải body: html đang đặt overflow-x
         nên khoá trên body sẽ cắt trang và đẩy header dính lên khỏi màn hình. */
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', function () {
      setOpen(nav.getAttribute('data-open') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 920) setOpen(false);
    });
  }

  /* ---- 04 Reveal đầu khối ---------------------------------------------- */
  /* Quét theo vị trí thay vì IntersectionObserver: mở trang bằng neo hoặc cuộn
     rất nhanh thì phần tử không cắt qua viewport, observer sẽ không báo. */
  function initReveal() {
    var pending = $$('.reveal');
    if (!pending.length) return;

    if (reduced()) {
      pending.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var ticking = false;

    var show = function (head) {
      $$(':scope > *', head).forEach(function (child, i) {
        child.style.setProperty('--reveal-delay', (i * 70) + 'ms');
      });
      head.classList.add('is-in');
    };

    var sweep = function () {
      ticking = false;
      var line = window.innerHeight * 0.88;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top > line) return true;
        show(el);
        return false;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    };

    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sweep);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    /* Ảnh lazy tải xong làm trang dài ra, vị trí phần tử đổi — quét lại một lần */
    window.addEventListener('load', onScroll);
    sweep();
  }

  /* ---- 05 Thanh % thành phần ------------------------------------------- */
  /* Bar chạy fill ngang khi hàng lọt vào khung nhìn — mỗi hàng một lần.
     Reduced motion: CSS đã giữ thanh ở mức đầy đủ, JS không cần chạy. */
  function initIngredientBars() {
    var rows = $$('.ing-row');
    if (!rows.length) return;

    if (reduced() || !('IntersectionObserver' in window)) {
      rows.forEach(function (r) { r.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: .35, rootMargin: '0px 0px -8% 0px' });

    rows.forEach(function (row) { observer.observe(row); });
  }

  /* ---- 06 Xem nhanh sản phẩm ------------------------------------------- */
  /* Không mở modal: mở bảng thông số ngay trong card (tránh bẫy tiêu điểm,
     và trên mobile nút luôn hiện vì không có hover). */
  function initQuickView() {
    $$('.pc-qv').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls') || '');
      if (!panel) return;

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        panel.hidden = open;
        btn.textContent = open ? 'Xem' : 'Đóng';
      });
    });
  }

  /* ---- 07 Giỏ hàng demo ------------------------------------------------ */
  /* Chỉ đếm tại chỗ để minh hoạ luồng — không có backend, không toast. */
  function initCart() {
    var badge = $('[data-cart-count]');
    var count = 0;

    try {
      count = parseInt(window.sessionStorage.getItem('nhuy-cart') || '0', 10) || 0;
    } catch (e) {
      count = 0;
    }

    var render = function () {
      if (badge) badge.textContent = String(count);
    };

    render();

    $$('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        count += 1;
        try { window.sessionStorage.setItem('nhuy-cart', String(count)); } catch (e) { /* chế độ riêng tư */ }
        render();

        var card = btn.closest('[data-handle]');
        var note = card ? $('.pc-note', card) : null;
        if (note) note.textContent = 'Đã thêm — ' + count + ' món trong giỏ.';
      });
    });
  }

  /* ---- 08 Form --------------------------------------------------------- */
  function initForm() {
    $$('form[data-contact]').forEach(function (form) {
      var status = $('.form-status', form);
      var fields = $$('input, select, textarea', form);

      fields.forEach(function (field) {
        field.addEventListener('input', function () {
          if (field.checkValidity()) field.removeAttribute('aria-invalid');
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstInvalid = null;
        var consentMissing = false;

        fields.forEach(function (field) {
          if (field.checkValidity()) {
            field.removeAttribute('aria-invalid');
            return;
          }
          field.setAttribute('aria-invalid', 'true');
          /* Ô đồng ý cũng bắt buộc, nhưng thiếu nó không phải lỗi nhập liệu —
             tách riêng để câu báo nói đúng việc còn thiếu. */
          if (field.name === 'consent') {
            consentMissing = true;
            return;
          }
          if (!firstInvalid) firstInvalid = field;
        });

        if (firstInvalid) {
          if (status) status.textContent = 'Còn thiếu thông tin phía trên, bạn kiểm tra lại giúp chúng tôi.';
          firstInvalid.focus();
          return;
        }

        if (consentMissing) {
          var consent = $('[name="consent"]', form);
          if (status) status.textContent = 'Bạn cần đồng ý với Chính sách bảo mật trước khi gửi.';
          if (consent) consent.focus();
          return;
        }

        if (status) status.textContent = 'Cảm ơn, chúng tôi sẽ gọi lại.';
        form.reset();
        /* reset() không phát sự kiện input nên phải tự gỡ cờ lỗi còn sót */
        fields.forEach(function (field) { field.removeAttribute('aria-invalid'); });
      });
    });
  }

  /* ---- 09 Parallax ảnh hero -------------------------------------------- */
  /* Ảnh đã scale(1.15) sẵn nên dịch dọc không lộ mép. rAF-throttle, và chỉ
     tính toạ độ khi hero còn trong khung nhìn — cuộn xuống dưới là ngừng hẳn. */
  function initHeroParallax() {
    var media = $('.hero-media');
    var img = media ? $('img', media) : null;
    if (!img || reduced()) return;

    var ticking = false;
    var visible = true;

    var update = function () {
      ticking = false;
      if (!visible) return;
      var rect = img.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
      var ty = Math.min(Math.max(progress * -14, -70), 70);
      img.style.transform = 'scale(1.15) translateY(' + ty.toFixed(1) + 'px)';
    };

    var onScroll = function () {
      if (!visible || ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) onScroll();
      }, { rootMargin: '10% 0px' }).observe(media);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ---- 10 Cổng mở trang ------------------------------------------------ */
  /* Đếm 000 -> 100 trong 900ms rồi trượt tấm che lên. Lớp html.loading do
     script trong <head> đặt sẵn; ở đây chỉ có việc gỡ nó ra đúng lúc. Gỡ xong
     mới gắn body.ready để thang delay của hero bắt đầu chạy khi đã lộ ra. */
  function initLoader() {
    var root = document.documentElement;
    var panel = $('.loader');

    var open = function () {
      root.classList.remove('loading');
      document.body.classList.add('ready');
    };

    /* Giảm chuyển động, đã xem cổng ở lần vào trước, hoặc thiếu markup: mở
       thẳng và dọn luôn tấm che khỏi DOM cho gọn. */
    if (!panel || !root.classList.contains('loading')) {
      open();
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      return;
    }

    var out = $('[data-loader-count]', panel);
    var fill = $('[data-loader-fill]', panel);
    var FILL_MS = 900;
    var started = 0;

    var ease = function (t) {
      return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    var pad = function (n) { return ('00' + n).slice(-3); };

    var exit = function () {
      window.setTimeout(function () {
        panel.setAttribute('data-exit', 'true');
        /* Mở khoá cuộn sau khi tấm che ra hẳn khỏi khung nhìn, không sớm hơn */
        window.setTimeout(function () {
          open();
          if (panel.parentNode) panel.parentNode.removeChild(panel);
        }, 600);
      }, 120);
    };

    var step = function (now) {
      if (!started) started = now;
      var t = Math.min((now - started) / FILL_MS, 1);
      var pct = Math.round(ease(t) * 100);

      if (out) out.textContent = pad(pct);
      if (fill) fill.style.width = pct + '%';

      if (t < 1) {
        window.requestAnimationFrame(step);
        return;
      }
      exit();
    };

    window.requestAnimationFrame(step);
  }

  /* ---- 11 Giờ mở cửa --------------------------------------------------- */
  /* HTML đã in sẵn khung giờ ngày thường nên chip không nhảy chữ khi JS chạy;
     chỉ ghi đè khi hôm nay là thứ Bảy hoặc Chủ nhật. */
  function initOpenHours() {
    var el = $('[data-open-hours]');
    if (!el) return;

    var day = new Date().getDay();
    var text = day === 0 ? 'Hôm nay đóng cửa'
      : day === 6 ? 'Hôm nay 09:00–17:00'
        : 'Hôm nay 09:00–19:00';

    if (el.textContent.trim() !== text) el.textContent = text;
  }

  /* ---- 12 Dải khẩu hiệu ------------------------------------------------ */
  function initPillBand() {
    var band = $('.pill-band');
    if (!band) return;

    var items = $$(':scope > li', band);

    var show = function () {
      items.forEach(function (li, i) {
        li.style.setProperty('--d', (i * 120) + 'ms');
      });
      band.classList.add('is-in');
      /* Hết lượt so le thì trả transition về nhịp hover */
      window.setTimeout(function () {
        band.classList.add('is-done');
      }, (items.length - 1) * 120 + 600);
    };

    if (reduced() || !('IntersectionObserver' in window)) {
      band.classList.add('is-in', 'is-done');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        show();
      });
    }, { threshold: .25, rootMargin: '0px 0px -8% 0px' });

    observer.observe(band);
  }

  /* ---- 13 Lựa chọn cookie ---------------------------------------------- */
  /* Bản mẫu không nạp analytics hay mã theo dõi nào. Nếu sau này thêm, đoạn nạp
     đó phải chờ localStorage 'gdpr-consent' bằng 'accept' rồi mới chạy. */
  function initGdpr() {
    var banner = $('.gdpr-banner');
    if (!banner) return;

    var KEY = 'gdpr-consent';
    var choice = null;
    /* Chế độ riêng tư hoặc trình duyệt chặn cookie làm localStorage ném lỗi cả
       khi đọc lẫn khi ghi — nuốt lỗi để một cái kho hỏng không chặn cả trang. */
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

  /* ---- Khởi động ------------------------------------------------------- */
  function boot() {
    initLoader();
    initOpenHours();
    initNav();
    initReveal();
    initIngredientBars();
    initQuickView();
    initCart();
    initForm();
    initHeroParallax();
    initPillBand();
    initGdpr();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
