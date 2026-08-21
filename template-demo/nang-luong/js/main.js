/* =========================================================================
   NAM PHONG ENERGY — kịch bản trang
   01 Tiện ích · 02 Chuyển động · 03 Điều hướng · 04 Reveal đầu khối
   05 Bộ đếm số lớn · 06 Form liên hệ · 07 Năm ở chân trang
   08 Thanh tiến trình cuộn · 09 Đồng hồ Hà Nội · 10 Tooltip bản đồ
   11 Bảng chạy · 12 Banner đồng ý cookie
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
      /* Khoá cuộn ở phần tử gốc: html đang đặt overflow-x nên khoá trên body
         sẽ cắt trang và kéo header dính lên khỏi màn hình. */
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') !== 'true';
      setOpen(open);
      if (!open) return;
      /* Phần tử đang visibility:hidden không nhận được focus; đợi qua một khung
         hình nữa để lớp phủ kịp hiện rồi mới trao con trỏ bàn phím. */
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          var first = $('a[href]', nav);
          if (first) first.focus();
        });
      });
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

    /* Lớp phủ che kín màn hình: Tab phải quẩn trong menu và nút đóng, nếu không
       con trỏ bàn phím đi tiếp xuống nội dung đang bị che. */
    var trapped = function () {
      return $$('a[href], button:not([disabled])', nav).concat([toggle]);
    };

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || nav.getAttribute('data-open') !== 'true') return;
      var items = trapped();
      if (!items.length) return;
      var edge = e.shiftKey ? items[0] : items[items.length - 1];
      if (document.activeElement !== edge) return;
      e.preventDefault();
      (e.shiftKey ? items[items.length - 1] : items[0]).focus();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 920) setOpen(false);
    });
  }

  /* ---- 04 Reveal đầu khối ---------------------------------------------- */
  /* Quét theo vị trí thay vì IntersectionObserver: vào trang bằng neo hoặc cuộn
     rất nhanh thì phần tử không cắt qua viewport, observer sẽ không báo. */
  function initReveal() {
    var pending = $$('.reveal');
    if (!pending.length) return;

    if (reduced()) {
      pending.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var ticking = false;

    var scan = function () {
      ticking = false;
      var limit = window.innerHeight * 0.88;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add('is-in');
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', request);
        window.removeEventListener('resize', request);
      }
    };

    var request = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(scan);
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    scan();
  }

  /* ---- 05 Bộ đếm số lớn ------------------------------------------------ */
  /* Số cuối nằm sẵn trong HTML để không JS vẫn đọc đủ. JS chỉ hạ về 0 rồi đếm
     lên khi khối lọt vào tầm nhìn, mỗi khối đúng một lần. */
  function initCounters() {
    var nodes = $$('[data-count]');
    if (!nodes.length || reduced()) return;

    var parse = function (raw) {
      var clean = raw.replace(/[^0-9.,]/g, '');
      var decimals = 0;
      var dot = clean.lastIndexOf('.');
      if (dot > -1 && clean.length - dot - 1 <= 2) decimals = clean.length - dot - 1;
      var value = parseFloat(clean.replace(/,/g, '')) || 0;
      return { value: value, decimals: decimals, grouped: raw.indexOf(',') > -1 };
    };

    var format = function (n, spec) {
      var text = n.toFixed(spec.decimals);
      if (!spec.grouped) return text;
      var parts = text.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    };

    var run = function (el) {
      var spec = parse(el.getAttribute('data-count') || el.textContent);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var start = null;
      var dur = 1200;

      el.textContent = prefix + format(0, spec) + suffix;

      var step = function (now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3); /* ease-out cubic */
        el.textContent = prefix + format(spec.value * eased, spec) + suffix;
        if (t < 1) window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);
    };

    /* Mở khoá lớp số và cho các ô cùng hàng lệch nhau 80ms */
    var reveal = function (el, index) {
      var clip = el.closest('.num-clip');
      if (!clip) return;
      clip.style.setProperty('--slide-delay', (index % 4) * 80 + 'ms');
      clip.classList.add('is-in');
    };

    /* Số trong hero chạy ngay khi trang mở — nó nằm sẵn trong tầm nhìn,
       chờ IntersectionObserver chỉ làm số đứng im một nhịp thừa. */
    var hero = $$('.hero [data-count]');
    hero.forEach(function (el, i) { reveal(el, i); run(el); });

    var rest = nodes.filter(function (el) { return hero.indexOf(el) === -1; });
    if (!rest.length) return;

    if (!('IntersectionObserver' in window)) {
      rest.forEach(function (el, i) { reveal(el, i); run(el); });
      return;
    }

    /* Theo dõi cả khối số chứ không theo dõi riêng chữ số: chữ số đang bị
       dịch xuống nên vùng của nó không phản ánh đúng vị trí khối trên trang. */
    var boxes = rest.map(function (el) { return el.closest('.num-clip') || el; });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var i = boxes.indexOf(entry.target);
        if (i === -1) return;
        reveal(rest[i], i);
        run(rest[i]);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });

    boxes.forEach(function (box) { io.observe(box); });
  }

  /* ---- 08 Thanh tiến trình cuộn ---------------------------------------- */
  function initProgress() {
    var bar = $('.progress');
    if (!bar) return;
    if (reduced()) { bar.remove(); return; }

    var ticking = false;
    var listening = false;
    var max = 0;

    var draw = function () {
      ticking = false;
      var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    };

    var request = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(draw);
    };

    /* Chiều cao trang chỉ đổi khi đổi cỡ khung hoặc khi ảnh tải xong; đọc nó
       trong mỗi khung hình cuộn sẽ buộc trình duyệt tính lại bố cục. */
    var measure = function () {
      max = document.documentElement.scrollHeight - window.innerHeight;
      /* Trang ngắn hơn khung hình thì thanh luôn bằng 0, không cần nghe cuộn */
      if (max > 0 && !listening) {
        window.addEventListener('scroll', request, { passive: true });
        listening = true;
      } else if (max <= 0 && listening) {
        window.removeEventListener('scroll', request);
        listening = false;
      }
      draw();
    };

    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
  }

  /* ---- 09 Đồng hồ Hà Nội ----------------------------------------------- */
  /* Giờ theo múi Asia/Ho_Chi_Minh chứ không theo máy khách: đây là giờ trực
     vận hành ở trụ sở. Máy không hỗ trợ múi giờ thì giữ nguyên số tĩnh. */
  function initClock() {
    var el = $('[data-clock]');
    if (!el) return;

    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      fmt.format(new Date());
    } catch (e) { return; }

    var timer = null;
    var onScreen = true;

    var tick = function () {
      el.textContent = fmt.format(new Date()).replace(/\./g, ':');
      /* Hẹn tới mốc giây kế tiếp thay vì cộng dồn 1000ms: nhịp 1000ms thô trôi
         dần khỏi giây thật và số nhảy cách quãng. */
      timer = window.setTimeout(tick, 1020 - (new Date().getTime() % 1000));
    };

    var sync = function () {
      window.clearTimeout(timer);
      timer = null;
      if (onScreen && !document.hidden) tick();
    };

    document.addEventListener('visibilitychange', sync);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      });
      io.observe(el.closest('.hero') || el);
    }

    sync();
  }

  /* ---- 11 Bảng chạy ---------------------------------------------------- */
  /* Dải chữ chạy vô hạn: ngoài tầm nhìn thì dừng, khỏi vẽ lại một băng chuyền
     không ai nhìn thấy suốt thời gian đọc phần còn lại của trang. */
  function initTicker() {
    var tracks = $$('.ticker__track');
    if (!tracks.length || reduced() || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      });
    });

    tracks.forEach(function (track) { io.observe(track); });
  }

  /* ---- 10 Tooltip bản đồ ----------------------------------------------- */
  function initMapTip() {
    var figure = $('.map-figure');
    if (!figure) return;
    var pins = $$('.vn-pin', figure);
    if (!pins.length) return;

    var tip = document.createElement('div');
    tip.className = 'map-tip';
    tip.setAttribute('aria-hidden', 'true');
    figure.appendChild(tip);

    var show = function (pin) {
      var dot = $('.vn-dot', pin);
      if (!dot) return;
      tip.textContent = pin.getAttribute('data-tip') || '';
      tip.classList.add('is-on');

      var box = figure.getBoundingClientRect();
      var mark = dot.getBoundingClientRect();
      var half = tip.offsetWidth / 2;
      var x = mark.left - box.left + mark.width / 2;
      /* Kẹp trong khung hình để tooltip không thò ra ngoài thẻ */
      x = Math.max(half + 4, Math.min(box.width - half - 4, x));
      tip.style.left = x + 'px';
      tip.style.top = (mark.top - box.top) + 'px';
    };

    var hide = function () { tip.classList.remove('is-on'); };

    pins.forEach(function (pin) {
      pin.addEventListener('mouseenter', function () { show(pin); });
      pin.addEventListener('mouseleave', hide);
      pin.addEventListener('focus', function () { show(pin); });
      pin.addEventListener('blur', hide);
    });
  }

  /* ---- 06 Form liên hệ ------------------------------------------------- */
  function initForm() {
    var form = $('#contact-form');
    if (!form) return;
    var note = $('#form-note');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      /* novalidate tắt bong bóng của trình duyệt để tự viết thông báo, nên phải
         tự kiểm tra — nếu không biểu mẫu rỗng vẫn nhận được lời cảm ơn. */
      if (!form.checkValidity()) {
        /* Ô đồng ý cũng là trường bắt buộc nhưng lỗi của nó không phải lỗi
           nhập liệu — tách riêng để người đọc biết đúng việc còn thiếu. */
        var invalid = form.querySelector(':invalid:not([name="consent"])');
        if (invalid) {
          if (note) note.textContent = 'Vui lòng nhập họ tên và email hợp lệ trước khi gửi.';
          invalid.focus();
          return;
        }
        var consent = form.querySelector('[name="consent"]');
        if (note) note.textContent = 'Vui lòng đồng ý với Chính sách bảo mật trước khi gửi.';
        if (consent) consent.focus();
        return;
      }
      if (note) note.textContent = 'Cảm ơn, chúng tôi sẽ liên hệ trong 1 ngày làm việc.';
      form.reset();
    });
  }

  /* ---- 12 Banner đồng ý cookie ----------------------------------------- */
  /* Trang không chạy analytics hay cookie theo dõi nào; banner chỉ ghi lại
     lựa chọn của người đọc. Nếu sau này gắn thêm GA hay công cụ đo lường thì
     phải chờ localStorage 'gdpr-consent' bằng 'accept' rồi mới nạp script. */
  function initGdpr() {
    var banner = $('.gdpr-banner');
    if (!banner) return;

    var KEY = 'gdpr-consent';
    var choice = null;
    /* Chế độ riêng tư hoặc chặn cookie làm localStorage ném lỗi khi đọc lẫn
       khi ghi — nuốt lỗi để một cái kho không dùng được không chặn cả trang. */
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

  /* ---- 07 Năm ở chân trang --------------------------------------------- */
  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---- Khởi động ------------------------------------------------------- */
  function boot() {
    initNav();
    initReveal();
    initCounters();
    initProgress();
    initClock();
    initTicker();
    initMapTip();
    initForm();
    initYear();
    initGdpr();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
