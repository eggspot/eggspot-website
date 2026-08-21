/* Bình xịt thổi bụi mini USB — script landing (không phụ thuộc thư viện ngoài).
   Gồm: banner đồng ý cookie, ẩn/hiện sticky CTA, accordion FAQ, đánh dấu mục đang xem,
   đồng hồ ưu đãi, kiểm tra form đặt hàng và popup đặt hàng. */
(function () {
  'use strict';

  /* ---------------------------------------------------------- 1. Cookie */
  var STORAGE_KEY = 'gdpr-consent';
  var banner = document.getElementById('gdpr-banner');

  function readConsent() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return 'unavailable'; // trình duyệt chặn storage: không làm phiền người dùng
    }
  }

  function saveConsent(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (err) {
      /* bỏ qua: chế độ riêng tư hoặc storage bị chặn */
    }
  }

  if (banner) {
    if (!readConsent()) {
      banner.hidden = false;
    }

    banner.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-gdpr]');
      if (!btn) return;
      saveConsent(btn.getAttribute('data-gdpr'));
      banner.hidden = true;
    });
  }

  /* ------------------------------------------------------- 2. Sticky CTA */
  /* Thanh giá + nút Zalo bám đáy trên mobile. Ẩn khi hero hoặc khối ưu đãi
     cuối trang đang hiển thị để không che nội dung và không lặp CTA. */
  var sticky = document.querySelector('.sticky-cta');

  if (sticky && 'IntersectionObserver' in window) {
    var watched = [];
    ['hero-cta', 'uu-dai'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) watched.push(el);
    });

    if (watched.length) {
      var visible = new Set();

      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              visible.add(entry.target);
            } else {
              visible.delete(entry.target);
            }
          });
          sticky.classList.toggle('is-hidden', visible.size > 0);
        },
        { threshold: 0 }
      );

      watched.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* -------------------------------------------------------- 3. FAQ nhẹ */
  /* Mở một mục thì đóng các mục còn lại; details/summary vẫn hoạt động khi tắt JS. */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));

  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* --------------------------------------------- 4. Mục đang xem trên nav */
  var sectionLinks = Array.prototype.slice.call(
    document.querySelectorAll('[data-nav-link]')
  );

  if (sectionLinks.length && 'IntersectionObserver' in window) {
    var linkFor = {};
    var targets = [];

    sectionLinks.forEach(function (link) {
      var id = link.getAttribute('href').replace('#', '');
      var section = document.getElementById(id);
      if (!section) return;
      linkFor[id] = linkFor[id] || [];
      linkFor[id].push(link);
      if (targets.indexOf(section) === -1) targets.push(section);
    });

    var current = null;

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          if (id === current) return;
          current = id;
          sectionLinks.forEach(function (link) {
            link.removeAttribute('aria-current');
          });
          (linkFor[id] || []).forEach(function (link) {
            link.setAttribute('aria-current', 'true');
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    targets.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* ------------------------------------- 5. Đóng menu mobile khi chọn mục */
  var menu = document.querySelector('.menu');

  if (menu) {
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) menu.removeAttribute('open');
    });

    document.addEventListener('click', function (event) {
      if (menu.hasAttribute('open') && !menu.contains(event.target)) {
        menu.removeAttribute('open');
      }
    });
  }

  /* ------------------------------------------- 6. Đồng hồ ưu đãi (evergreen) */
  /* Không gắn với mốc thời gian thật: đếm từ lúc trang tải xong và tự lặp lại
     khi về 0, nên kết quả không phụ thuộc thời điểm mở trang. */
  var countdowns = Array.prototype.slice.call(
    document.querySelectorAll('[data-countdown]')
  );

  if (countdowns.length) {
    var cdTotal = parseInt(countdowns[0].getAttribute('data-cd-total'), 10);
    if (!cdTotal || cdTotal < 1) cdTotal = 9 * 3600 + 48 * 60 + 33;

    var cdLeft = cdTotal;

    var pad2 = function (n) {
      return n < 10 ? '0' + n : String(n);
    };

    var paintCountdown = function (left) {
      var parts = {
        days: Math.floor(left / 86400),
        hours: Math.floor((left % 86400) / 3600),
        minutes: Math.floor((left % 3600) / 60),
        seconds: left % 60
      };

      countdowns.forEach(function (root) {
        Object.keys(parts).forEach(function (key) {
          var cell = root.querySelector('[data-cd="' + key + '"]');
          if (cell) cell.textContent = pad2(parts[key]);
        });
      });
    };

    paintCountdown(cdLeft);

    var noMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Người dùng chọn giảm chuyển động: giữ số tĩnh, không nhấp nháy mỗi giây. */
    if (!noMotion) {
      window.setInterval(function () {
        cdLeft -= 1;
        if (cdLeft <= 0) cdLeft = cdTotal;
        paintCountdown(cdLeft);
      }, 1000);
    }
  }

  /* ------------------------------------------------ 7. Form đặt hàng (demo) */
  /* Bản mẫu: chỉ kiểm tra dữ liệu tại chỗ rồi báo kết quả, KHÔNG gửi đi đâu và
     KHÔNG lưu localStorage. Khi chạy thật, khách nối form với backend của mình. */
  var orderForms = Array.prototype.slice.call(document.querySelectorAll('.order-form'));

  var noteFor = function (form) {
    var card = form.closest('.order-card') || form.parentNode;
    return card ? card.querySelector('.form-note') : null;
  };

  var setNote = function (note, state, message, withZalo) {
    if (!note) return;
    note.className = 'form-note ' + state;
    note.textContent = '';

    var line = document.createElement('p');
    line.textContent = message;
    note.appendChild(line);

    if (!withZalo) return;

    /* placeholder: thay số Zalo thật */
    var link = document.createElement('a');
    link.className = 'btn btn--zalo btn--block';
    link.href = 'https://zalo.me/0987654321';
    link.rel = 'noopener';
    link.textContent = 'Nhắn Zalo 098 765 4321';
    note.appendChild(link);
  };

  orderForms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var note = noteFor(form);
      var invalid = null;

      Array.prototype.slice.call(form.elements).forEach(function (el) {
        if (!invalid && el.willValidate && !el.checkValidity()) invalid = el;
      });

      if (invalid) {
        setNote(
          note,
          'is-error',
          'Vui lòng điền đầy đủ họ tên, số điện thoại (10 số), địa chỉ, chọn combo và đồng ý Chính sách bảo mật.',
          false
        );
        invalid.focus();
        return;
      }

      setNote(
        note,
        'is-ok',
        'Đã nhận đơn của bạn! Nhân viên sẽ gọi xác nhận trong 15 phút. Chốt nhanh hơn qua Zalo:',
        true
      );
    });
  });

  /* ------------------------------------------------- 8. Popup đặt hàng */
  var popup = document.getElementById('order-popup');

  if (popup) {
    var lastFocused = null;

    var focusablesIn = function (root) {
      return Array.prototype.slice
        .call(root.querySelectorAll('a[href], button, input, select, textarea'))
        .filter(function (el) {
          return !el.disabled && el.offsetParent !== null;
        });
    };

    var openPopup = function () {
      lastFocused = document.activeElement;
      popup.hidden = false;
      document.body.classList.add('is-order-open');

      var first = popup.querySelector('.order-form input');
      if (first) first.focus();
    };

    var closePopup = function () {
      if (popup.hidden) return;
      popup.hidden = true;
      document.body.classList.remove('is-order-open');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-open-order]')) {
        event.preventDefault();
        openPopup();
        return;
      }
      /* nền mờ và nút X cùng mang data-close-order */
      if (!popup.hidden && event.target.closest('[data-close-order]')) {
        event.preventDefault();
        closePopup();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (popup.hidden) return;

      if (event.key === 'Escape') {
        closePopup();
        return;
      }

      /* giữ tiêu điểm bàn phím trong popup khi đang mở */
      if (event.key !== 'Tab') return;

      var items = focusablesIn(popup);
      if (!items.length) return;

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
})();
