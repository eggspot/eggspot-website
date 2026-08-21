/* =====================================================
   AN PHÁT Construction
   JS chung cho toàn bộ site (6 trang)
   ===================================================== */
(function () {
  "use strict";

  /* ===== Tiện ích chung ===== */
  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  // Người dùng bật "giảm chuyển động" → tắt hiệu ứng nặng
  var reducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Ngăn cách hàng nghìn kiểu Việt Nam: 300 → 300, 10000 → 10.000
  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Nhóm nút kiểu "radio": click nút nào thì nút đó active, các nút còn lại tắt.
  // clearAttr = true → nút không active bị gỡ hẳn thuộc tính (dùng cho aria-current).
  // Trả về hàm activate() để gọi lại từ nơi khác (vd nút prev/next của gallery).
  function initRadioGroup(items, stateAttr, onPick, clearAttr) {
    var activate = function (item) {
      items.forEach(function (other) {
        other.classList.remove("active");
        if (clearAttr) other.removeAttribute(stateAttr);
        else other.setAttribute(stateAttr, "false");
      });
      item.classList.add("active");
      item.setAttribute(stateAttr, "true");
      onPick(item);
    };

    items.forEach(function (item) {
      item.addEventListener("click", function () {
        activate(item);
      });
    });

    return activate;
  }

  // Quan sát phần tử vào viewport đúng 1 lần rồi ngừng theo dõi.
  // Trình duyệt không hỗ trợ IntersectionObserver → chạy fn ngay cho tất cả.
  function observeOnce(elements, fn, options) {
    if (!("IntersectionObserver" in window)) {
      elements.forEach(fn);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        fn(entry.target);
      });
    }, options);

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // Form demo: chặn gửi thật, kiểm tra trường bắt buộc rồi báo kết quả trong .form-note
  function bindDemoForm(form, successMsg) {
    var note = $(".form-note", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Hộp kiểm luôn trả value "on" dù chưa tích, phải xét trạng thái checked —
      // nếu không ô đồng ý bỏ trống vẫn lọt qua và biểu mẫu gửi không có consent
      var missing = $$("[required]", form).filter(function (field) {
        return field.type === "checkbox"
          ? !field.checked
          : !String(field.value).trim();
      })[0];

      if (missing) {
        if (note) {
          // Thiếu đồng ý không phải lỗi nhập liệu — tách lời báo để người đọc
          // biết đúng việc còn thiếu
          note.textContent = missing.name === "consent"
            ? "⚠ Vui lòng đồng ý với Chính sách bảo mật trước khi gửi."
            : "⚠ Vui lòng điền đầy đủ thông tin bắt buộc.";
          note.classList.add("error", "show");
        }
        missing.focus();
        return;
      }

      if (note) {
        note.textContent = successMsg;
        note.classList.remove("error");
        note.classList.add("show");
      }
      form.reset();
    });
  }

  /* ===== Toast thông báo ===== */
  var toastTimer = null;
  function showToast(message) {
    var toast = $(".toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2800);
  }

  /* ===== Preloader: ẩn khi trang load xong ===== */
  (function initPreloader() {
    var preloader = $(".preloader");
    if (!preloader) return;

    var hide = function () {
      preloader.classList.add("loaded");
      window.setTimeout(function () {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 700);
    };

    if (document.readyState === "complete") {
      window.setTimeout(hide, 300);
    } else {
      window.addEventListener("load", function () {
        window.setTimeout(hide, 400);
      });
    }
    // Chốt chặn: luôn ẩn sau 3.5s kể cả khi ảnh lỗi
    window.setTimeout(hide, 3500);
  })();

  /* ===== Header đổi nền khi scroll + nút lên đầu trang ===== */
  (function initScrollUI() {
    var header = $(".site-header");
    var toTop = $(".to-top");

    var onScroll = function () {
      var y = window.pageYOffset;
      if (header) header.classList.toggle("scrolled", y > 40);
      if (toTop) toTop.classList.toggle("show", y > 500);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: reducedMotion ? "auto" : "smooth"
        });
      });
    }
  })();

  /* ===== Menu mobile: hamburger ↔ overlay ===== */
  (function initMobileMenu() {
    var toggle = $(".nav-toggle");
    var menu = $(".mobile-menu");
    if (!toggle || !menu) return;

    var setOpen = function (open) {
      toggle.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      document.body.classList.toggle("no-scroll", open);
      // menu-open: đổi logo/icon/hamburger sang tông sáng trên nền overlay navy
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    };

    toggle.addEventListener("click", function () {
      setOpen(!menu.classList.contains("open"));
    });

    $$("a", menu).forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) setOpen(false);
    });
  })();

  /* ===== Scroll reveal: IntersectionObserver + stagger delay ===== */
  (function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (reducedMotion) {
      items.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    observeOnce(
      items,
      function (el) {
        var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
        window.setTimeout(function () {
          el.classList.add("visible");
        }, delay);
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
  })();

  /* ===== Hero parallax: ảnh nền dịch chậm hơn scroll ===== */
  (function initParallax() {
    var bg = $(".hero-bg");
    if (!bg || reducedMotion) return;

    var ticking = false;
    // đo chiều cao hero 1 lần, tránh đọc layout mỗi lần scroll
    var heroH = bg.offsetHeight;
    // giới hạn dịch chuyển: ảnh không bao giờ lệch quá phần dự trữ
    // (inset -12% mỗi đầu → max dịch ≈ 0.096 × bg.offsetHeight)
    var overhang = heroH * 0.096;

    var update = function () {
      var offset = Math.min(window.pageYOffset * 0.3, overhang);
      bg.style.transform = "translate3d(0," + offset + "px,0)";
      ticking = false;
    };

    var onScroll = function () {
      // Hero đã trôi hẳn khỏi viewport → bỏ qua, không ghi transform nữa
      if (window.pageYOffset > heroH) return;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  })();

  /* ===== Counter: đếm số liệu khi vào viewport ===== */
  (function initCounters() {
    var counters = $$("[data-count]");
    if (!counters.length) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1500;
      var start = null;

      if (reducedMotion) {
        el.textContent = formatNumber(target) + suffix;
        return;
      }

      var step = function (timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        // easeOutCubic cho cảm giác chậm dần
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatNumber(Math.round(target * eased)) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);
    };

    observeOnce(counters, run, { threshold: 0.4 });
  })();

  /* ===== Bộ lọc + sắp xếp dự án (du-an.html) ===== */
  (function initFilter() {
    var grid = $("#projectGrid");
    if (!grid) return;

    var buttons = $$(".filter-btn");
    var countEl = $("#projectCount");
    var sortSelect = $("#sortSelect");
    var emptyNote = $("#emptyNote");
    var cards = $$(".project-card", grid);
    var activeFilter = "all";

    // Ghi nhớ thứ tự gốc để phục vụ sort "Mới nhất"
    cards.forEach(function (card, index) {
      card.dataset.index = String(index);
      // gỡ class animation khi chạy xong để lần lọc sau kích hoạt lại được
      card.addEventListener("animationend", function (e) {
        if (e.animationName === "filterPop") card.classList.remove("filter-pop");
      });
    });

    var updateCount = function (visible) {
      if (countEl) countEl.textContent = visible + " dự án";
      if (emptyNote) emptyNote.hidden = visible !== 0;
    };

    var hideTimer = null;

    var applyFilter = function () {
      var visible = 0;

      cards.forEach(function (card) {
        var match =
          activeFilter === "all" ||
          card.getAttribute("data-category") === activeFilter;

        if (match) {
          visible += 1;
          card.classList.remove("hide", "filter-out");
          // animation riêng của bộ lọc, không đụng trạng thái của scroll reveal
          card.classList.remove("filter-pop");
          window.requestAnimationFrame(function () {
            card.classList.add("filter-pop");
          });
        } else {
          card.classList.add("filter-out");
        }
      });

      // một timer chung cho cả lưới: chờ animation mờ dần xong mới gỡ khỏi layout
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(
        function () {
          cards.forEach(function (card) {
            if (card.classList.contains("filter-out")) card.classList.add("hide");
          });
        },
        reducedMotion ? 0 : 300
      );

      updateCount(visible);
    };

    var applySort = function (mode) {
      var sorted = cards.slice();
      sorted.sort(function (a, b) {
        var aa = parseInt(a.getAttribute("data-area") || "0", 10);
        var ba = parseInt(b.getAttribute("data-area") || "0", 10);
        if (mode === "area-asc") return aa - ba;
        if (mode === "area-desc") return ba - aa;
        return parseInt(a.dataset.index, 10) - parseInt(b.dataset.index, 10);
      });
      sorted.forEach(function (card) {
        grid.appendChild(card);
      });
    };

    initRadioGroup(buttons, "aria-pressed", function (btn) {
      activeFilter = btn.getAttribute("data-filter") || "all";
      applyFilter();
    });

    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        applySort(sortSelect.value);
      });
    }

    updateCount(cards.length);
  })();

  /* ===== Nút "Xem nhanh" trên project card ===== */
  (function initQuickView() {
    // Là <button> thật, nằm trên link phủ card (z-index) nên không kích hoạt link
    $$(".quick-view").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".project-card");
        if (!card) return;
        var name = $("h3", card);
        var meta = $(".project-meta", card);
        showToast(
          (name ? name.textContent.trim() : "Dự án") +
            (meta ? " — " + meta.textContent.trim() : "")
        );
      });
    });
  })();

  /* ===== Gallery chi tiết dự án: thumbnail + prev/next ===== */
  (function initGallery() {
    var mainImg = $("#galleryMain");
    if (!mainImg) return;

    var thumbs = $$(".thumb");
    if (!thumbs.length) return;

    var current = 0;

    // dùng chung cơ chế "radio" — thumb không active bị gỡ hẳn aria-current
    var activateThumb = initRadioGroup(
      thumbs,
      "aria-current",
      function (thumb) {
        current = thumbs.indexOf(thumb);
        var src = thumb.getAttribute("data-full");
        var alt = thumb.getAttribute("data-alt") || mainImg.alt;

        // đổi ảnh với hiệu ứng mờ dần
        mainImg.classList.add("fading");
        window.setTimeout(
          function () {
            mainImg.src = src;
            mainImg.alt = alt;
            mainImg.classList.remove("fading");
          },
          reducedMotion ? 0 : 200
        );
      },
      true
    );

    var show = function (index) {
      activateThumb(thumbs[(index + thumbs.length) % thumbs.length]);
    };

    var prev = $(".gallery-nav.prev");
    var next = $(".gallery-nav.next");
    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
      });
    }
  })();

  /* ===== Tabs thông tin dự án ===== */
  (function initTabs() {
    var tabs = $$(".tab-btn");
    if (!tabs.length) return;

    var panels = $$(".tab-panel");

    initRadioGroup(tabs, "aria-selected", function (tab) {
      var targetId = tab.getAttribute("data-tab");
      panels.forEach(function (panel) {
        panel.hidden = panel.id !== targetId;
      });
    });
  })();

  /* ===== Nút yêu cầu báo giá nhanh (chi tiết dự án) ===== */
  (function initQuoteButton() {
    var btn = $("#quoteBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      showToast("✔ Đã ghi nhận! Kỹ sư AN PHÁT sẽ gọi lại trong 24h.");
    });
  })();

  /* ===== Các form demo: đăng ký nhận tin + yêu cầu báo giá ===== */
  (function initForms() {
    $$(".newsletter-form").forEach(function (form) {
      bindDemoForm(form, "✔ Cảm ơn bạn! Bản tin sẽ được gửi tới hộp thư.");
    });

    var quoteForm = $("#contactForm");
    if (quoteForm) {
      bindDemoForm(
        quoteForm,
        "✔ Đã gửi yêu cầu! Chúng tôi phản hồi trong 24h làm việc."
      );
    }
  })();

  /* ===== Dải lựa chọn cookie (GDPR) =====
     Trang không chạy analytics hay cookie theo dõi nào; dải này chỉ ghi lại lựa
     chọn của người đọc. Nếu sau này gắn GA hay công cụ đo lường thì phải chờ
     localStorage 'gdpr-consent' bằng 'accept' rồi mới nạp script. */
  (function initGdpr() {
    var banner = $(".gdpr-banner");
    if (!banner) return;

    var KEY = "gdpr-consent";
    var choice = null;
    // Chế độ riêng tư hoặc chặn cookie làm localStorage ném lỗi cả khi đọc lẫn
    // khi ghi — nuốt lỗi để một cái kho không dùng được không chặn cả trang
    try {
      choice = window.localStorage.getItem(KEY);
    } catch (e) {}
    if (choice) return;

    banner.hidden = false;

    $$("[data-gdpr]", banner).forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          window.localStorage.setItem(KEY, btn.getAttribute("data-gdpr"));
        } catch (e) {}
        banner.hidden = true;
      });
    });
  })();

  /* ===== Cập nhật năm ở footer ===== */
  (function initYear() {
    $$(".year").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  })();
})();
