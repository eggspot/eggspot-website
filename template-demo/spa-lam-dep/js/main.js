/* =========================================================================
   SEN SPA — WATER MEMORY / KÝ ỨC NƯỚC
   01 Tiện ích · 02 Chuyển động · 03 Điều hướng · 04 Ripple Index
   05 Timeline một ngày · 06 Nhịp thở 4·7·8 · 07 Form giữ chỗ
   08 View Transitions · 99 Motion (reveal)
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

  var finePointer = window.matchMedia('(min-width: 900px)');

  /* ---- 03 Điều hướng --------------------------------------------------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;

    var setOpen = function (open) {
      nav.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
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
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---- 04 Ripple Index ------------------------------------------------- */
  /* Desktop: hover/focus dòng liệu trình đổi ảnh preview cột phải.
     Touch/mobile: mỗi dòng là accordion mở panel chứa ảnh. */
  function initRipple() {
    $$('.ripple').forEach(function (root) {
      var rows = $$('.ripple-row', root);
      var img = $('.ripple-preview img', root);
      var cap = $('.ripple-preview figcaption', root);
      var link = $('.ripple-preview [data-preview-link]', root);
      if (!rows.length) return;

      var show = function (row) {
        if (!img || !finePointer.matches) return;
        rows.forEach(function (r) { r.setAttribute('data-active', r === row ? 'true' : 'false'); });

        var href = row.getAttribute('data-href');
        if (link && href) link.setAttribute('href', href);

        var src = row.getAttribute('data-img');
        if (!src) return;

        // Đặt trước khi so src: dòng đầu dùng đúng ảnh đã có trong HTML,
        // nếu chờ đổi src thì ảnh không bao giờ hiện.
        img.setAttribute('data-shown', 'true');
        img.setAttribute('alt', row.getAttribute('data-alt') || '');
        if (cap) cap.textContent = row.getAttribute('data-caption') || '';
        if (img.getAttribute('src') === src) return;

        img.setAttribute('src', src);
      };

      rows.forEach(function (row) {
        var trigger = $('a, .ripple-btn', row);
        if (!trigger) return;

        row.addEventListener('mouseenter', function () { show(row); });
        trigger.addEventListener('focus', function () { show(row); });

        if (trigger.classList.contains('ripple-btn')) {
          trigger.addEventListener('click', function () {
            // Desktop: click = đi tới trang chi tiết liệu trình
            if (finePointer.matches) {
              var href = row.getAttribute('data-href');
              if (href) { window.location.href = href; return; }
              show(row);
              return;
            }
            var open = row.getAttribute('data-open') === 'true';
            rows.forEach(function (r) {
              r.setAttribute('data-open', 'false');
              var t = $('.ripple-btn', r);
              if (t) t.setAttribute('aria-expanded', 'false');
            });
            if (!open) {
              row.setAttribute('data-open', 'true');
              trigger.setAttribute('aria-expanded', 'true');
            }
            show(row);
          });
        }
      });

      // trạng thái ban đầu: dòng đầu tiên
      show(rows[0]);
    });
  }

  /* ---- 05 Timeline một ngày -------------------------------------------- */
  /* Hairline celadon dâng theo scroll — IntersectionObserver bật/tắt,
     rAF tính tiến độ. Reduced motion: CSS giữ vạch đầy, JS không chạy. */
  function initDayTrack() {
    var day = $('.day');
    var track = $('.day-track');
    var bar = $('.day-track i');
    if (!day || !bar || reduced()) return;

    /* Rail chỉ chạy từ tâm chấm đầu tới tâm chấm cuối (không thò ra ngoài).
       Chấm ::before cao 15px, margin-top 7px, item padding-top 24px → tâm = offsetTop + 38.5px */
    var fitTrack = function () {
      if (!track) return;
      var items = $$('.day-item', day);
      if (!items.length) return;
      var t = items[0].offsetTop + 38.5;
      var b = items[items.length - 1].offsetTop + 38.5;
      track.style.top = t + 'px';
      track.style.bottom = 'auto';
      track.style.height = Math.max(0, b - t) + 'px';
    };

    var ticking = false;
    var active = false;

    var update = function () {
      ticking = false;
      var rect = day.getBoundingClientRect();
      var anchor = window.innerHeight * 0.62;
      var progress = (anchor - rect.top) / rect.height;
      progress = Math.max(0, Math.min(1, progress));
      bar.style.setProperty('--progress', progress.toFixed(3));
    };

    var onScroll = function () {
      if (ticking || !active) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    fitTrack();
    window.addEventListener('resize', fitTrack);
    /* Font swap có thể đổi chiều cao item sau DOMContentLoaded → đo lại khi fonts sẵn sàng */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTrack);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        active = entries[0].isIntersecting;
        if (active) onScroll();
      }, { rootMargin: '120px 0px' }).observe(day);
    } else {
      active = true;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---- 06 Nhịp thở 4·7·8 ----------------------------------------------- */
  /* Opt-in: chỉ chạy khi bấm. 3 chu kỳ rồi tự dừng. */
  function initBreath() {
    var root = $('.breath');
    if (!root) return;

    var orb = $('.breath-orb', root);
    var text = $('.breath-orb span', root);
    var count = $('.breath-count', root);
    var startBtn = $('.breath-start', root);
    var stopBtn = $('.breath-stop', root);
    if (!orb || !text || !startBtn) return;

    var PHASES = [
      { key: 'in', label: 'Hít vào', sec: 4 },
      { key: 'hold', label: 'Giữ', sec: 7 },
      { key: 'out', label: 'Thở ra', sec: 8 }
    ];
    var TOTAL = 3;

    var timer = null;
    var cycle = 0;
    var step = 0;

    var reset = function (message) {
      if (timer) { clearTimeout(timer); timer = null; }
      cycle = 0;
      step = 0;
      orb.setAttribute('data-phase', 'idle');
      orb.style.removeProperty('--breath-dur');
      text.textContent = '4 · 7 · 8';
      if (count) count.textContent = message || '';
      startBtn.hidden = false;
      if (stopBtn) stopBtn.hidden = true;
    };

    var run = function () {
      var phase = PHASES[step];
      orb.style.setProperty('--breath-dur', phase.sec + 's');
      orb.setAttribute('data-phase', phase.key);
      text.textContent = phase.label;
      if (count) count.textContent = 'Chu kỳ ' + (cycle + 1) + ' trên ' + TOTAL;

      timer = window.setTimeout(function () {
        step += 1;
        if (step >= PHASES.length) {
          step = 0;
          cycle += 1;
        }
        if (cycle >= TOTAL) {
          reset('Xong ba chu kỳ.');
          return;
        }
        run();
      }, phase.sec * 1000);
    };

    startBtn.addEventListener('click', function () {
      if (reduced()) {
        if (count) {
          count.textContent = 'Hít vào 4 giây, giữ 7 giây, thở ra 8 giây. Lặp lại ba lần.';
        }
        return;
      }
      cycle = 0;
      step = 0;
      startBtn.hidden = true;
      if (stopBtn) stopBtn.hidden = false;
      run();
    });

    /* Click vòng tròn cũng bắt đầu (giống nút Bắt đầu) */
    orb.addEventListener('click', function () {
      if (startBtn.hidden) return;
      startBtn.click();
    });

    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        reset('');
        startBtn.focus();
      });
    }

    reset('');
  }

  /* ---- 07 Form giữ chỗ ------------------------------------------------- */
  function initForm() {
    $$('form[data-booking]').forEach(function (form) {
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
          if (status) status.textContent = 'Còn thiếu thông tin ở bên trên. Bạn kiểm tra lại giúp chúng tôi.';
          firstInvalid.focus();
          return;
        }

        if (consentMissing) {
          var consent = $('[name="consent"]', form);
          if (status) status.textContent = 'Bạn cần đồng ý với Chính sách bảo mật trước khi gửi.';
          if (consent) consent.focus();
          return;
        }

        if (status) status.textContent = 'Chúng tôi gọi lại trong 30 phút, trong giờ mở cửa.';
        form.reset();
      });
    });
  }

  /* ---- 08 View Transitions --------------------------------------------- */
  /* Chuyển trang do @view-transition trong CSS lo. JS chỉ gắn cờ để
     có thể tắt hoàn toàn khi người dùng chọn giảm chuyển động. */
  function initViewTransition() {
    if (!('startViewTransition' in document)) return;
    document.documentElement.classList.add('vt-on');
    var sync = function () {
      document.documentElement.classList.toggle('vt-on', !reduced());
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', sync);
    sync();
  }

  /* ---- 99 Motion (reveal) ---------------------------------------------- */
  /* Chỉ áp cho section head — không reveal đại trà. */
  /* Quét theo vị trí thay vì IntersectionObserver: khi mở trang bằng neo
     hoặc cuộn thật nhanh, phần tử nhảy thẳng lên trên viewport mà không
     cắt qua nó — observer sẽ không báo và nội dung kẹt ở trạng thái ẩn. */
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
    sweep();
  }

  /* Word reveal hero H1 (pattern getlayers #3) — wrap từng từ, trượt lên khi load.
     Reduced motion: không đụng DOM. */
  function initRevealWords() {
    var targets = $$('.reveal-words');
    if (!targets.length || reduced()) return;

    targets.forEach(function (el) {
      var frag = document.createDocumentFragment();
      el.childNodes.forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = tok;
            w.appendChild(inner);
            frag.appendChild(w);
          });
        } else if (node.nodeType === 1) {
          var w = document.createElement('span');
          w.className = 'w';
          var inner = document.createElement('span');
          inner.appendChild(node.cloneNode(true));
          w.appendChild(inner);
          frag.appendChild(w);
        }
      });
      el.replaceChildren(frag);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        targets.forEach(function (el) { el.classList.add('is-in'); });
      });
    });
  }

  /* Stats count-up theo scroll (pattern getlayers #13) — ease-out 1.2s, IO once.
     Reduced motion: hiện số cuối ngay. */
  function initStats() {
    var panels = $$('.stats-panel');
    if (!panels.length) return;
    var nums = $$('[data-count]', panels[0]);
    if (!nums.length) return;

    var setFinal = function () {
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); });
    };
    if (reduced()) { setFinal(); return; }

    /* Markup chứa số cuối (no-JS an toàn) → reset về 0 rồi đếm lên */
    nums.forEach(function (n) { n.textContent = '0'; });

    var done = false;
    var run = function () {
      if (done) return;
      done = true;
      var t0 = null;
      var dur = 1200;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (n) {
          var end = parseInt(n.getAttribute('data-count'), 10);
          n.textContent = Math.round(e * end);
        });
        if (p < 1) requestAnimationFrame(step);
        else setFinal();
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          run();
          observer.disconnect();
        }
      }, { threshold: .4 });
      observer.observe(panels[0]);
    } else {
      run();
    }
  }

  /* Parallax hero — ảnh đã scale(1.15), dịch nhẹ theo scroll, rAF-throttle.
     Reduced motion: không chạy (ảnh giữ scale tĩnh). */
  function initHeroParallax() {
    var img = $('.hero-media img');
    if (!img || reduced()) return;

    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = img.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
      var ty = Math.min(Math.max(progress * -14, -70), 70);
      img.style.transform = 'scale(1.15) translateY(' + ty.toFixed(1) + 'px)';
    };

    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ---- 12 Lựa chọn cookie ---------------------------------------------- */
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
    initNav();
    initRipple();
    initDayTrack();
    initBreath();
    initForm();
    initViewTransition();
    initReveal();
    initHeroParallax();
    initRevealWords();
    initStats();
    initGdpr();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
