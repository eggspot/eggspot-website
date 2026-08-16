/* =====================================================
   PHÚC LAND — Sàn giao dịch bất động sản
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

  // Ngăn cách hàng nghìn kiểu Việt Nam: 8500 → 8.500
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

  // Form demo: chặn gửi thật, kiểm tra trường bắt buộc rồi báo kết quả trong .form-note
  function bindDemoForm(form, successMsg, toastMsg) {
    var note = $(".form-note", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var empty = $$("[required]", form).filter(function (field) {
        return !String(field.value).trim();
      })[0];

      if (empty) {
        if (note) {
          note.textContent = "⚠ Vui lòng điền đầy đủ thông tin bắt buộc.";
          note.classList.add("error", "show");
        }
        empty.focus();
        return;
      }

      if (note) {
        note.textContent = successMsg;
        note.classList.remove("error");
        note.classList.add("show");
      }
      if (toastMsg) showToast(toastMsg);
      form.reset();
    });
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
      // menu-open: header trong suốt + logo/icon/hamburger đổi sang tông sáng
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

    // Đo 1 lần lúc khởi tạo, tránh đọc layout mỗi lần scroll.
    // overhang = phần ảnh dự trữ thò ra ngoài khung hero (inset -12% trong CSS),
    // ảnh không bao giờ được dịch quá mức này nếu không sẽ hở nền ở đỉnh hero.
    var heroH = bg.parentElement.offsetHeight;
    var overhang = Math.max(0, (bg.offsetHeight - heroH) / 2);
    // Hệ số suy từ chính phần dự trữ: cuộn hết hero thì ảnh dịch vừa đủ overhang.
    var factor = heroH > 0 ? overhang / heroH : 0;
    var ticking = false;
    var inHero = true;

    bg.style.willChange = "transform";

    var update = function () {
      ticking = false;
      var offset = Math.min(window.pageYOffset * factor, overhang);
      bg.style.transform = "translate3d(0," + offset + "px,0)";
    };

    var onScroll = function () {
      // Ra khỏi vùng hero: ngừng ghi transform và nhả GPU layer.
      // KHÔNG gỡ listener — nếu gỡ, transform bị đóng băng và khi cuộn ngược
      // lên đầu trang ảnh vẫn nằm lệch xuống, để hở khoảng trống ở đỉnh hero.
      if (window.pageYOffset > heroH) {
        if (inHero) {
          inHero = false;
          bg.style.willChange = "auto";
        }
        return;
      }

      if (!inHero) {
        inHero = true;
        bg.style.willChange = "transform";
      }
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    // Xoay màn hình / đổi kích thước → đo lại, tránh dùng số cũ khi hero co lại
    var remeasure = function () {
      heroH = bg.parentElement.offsetHeight;
      overhang = Math.max(0, (bg.offsetHeight - heroH) / 2);
      factor = heroH > 0 ? overhang / heroH : 0;
      update();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    update();
  })();

  /* ===== Marquee: tạm dừng khi trôi khỏi viewport ===== */
  (function initMarquee() {
    var track = $(".marquee-track");
    if (!track || reducedMotion || !("IntersectionObserver" in window)) return;

    // Dùng class thay vì inline style để không đè mất quy tắc pause khi hover
    var observer = new IntersectionObserver(function (entries) {
      track.classList.toggle("is-offscreen", !entries[0].isIntersecting);
    });

    observer.observe(track.parentElement);
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

  /* ===== Ô tìm kiếm trên hero: cuộn xuống khu dự án nổi bật ===== */
  (function initHeroSearch() {
    var form = $("#heroSearch");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var target = $("#du-an-noi-bat");
      if (target) {
        target.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start"
        });
      }
      var type = $("#search-type");
      showToast(
        "Đang lọc theo: " + (type ? type.value : "tất cả") + " — xem gợi ý bên dưới"
      );
    });
  })();

  /* ===== Bộ lọc + sắp xếp dự án (du-an.html) ===== */
  (function initFilter() {
    var grid = $("#projectGrid");
    if (!grid) return;

    // .pill-btn dùng chung nhiều nhóm nút → luôn giới hạn trong nhóm của mình
    var filterGroup = $(".filter-group");
    var buttons = filterGroup ? $$(".pill-btn", filterGroup) : [];
    var countEl = $("#projectCount");
    var sortSelect = $("#sortSelect");
    var emptyNote = $("#emptyNote");
    var cards = $$(".project-card", grid);
    var activeFilter = "all";
    var hideTimer = null;

    // Ghi nhớ thứ tự gốc để phục vụ sắp xếp "Mới nhất"
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

    var applyFilter = function () {
      var visible = 0;

      cards.forEach(function (card) {
        var match =
          activeFilter === "all" ||
          card.getAttribute("data-category") === activeFilter;

        if (match) {
          visible += 1;
          card.classList.remove("hide", "filter-out");
          // Animation riêng của bộ lọc, không đụng trạng thái của scroll reveal.
          // Chỉ chạy cho card đã reveal — card dưới fold chưa .visible mà chạy
          // filter-pop sẽ chớp hiện rồi tụt ẩn trở lại.
          if (card.classList.contains("visible")) {
            card.classList.remove("filter-pop");
            window.requestAnimationFrame(function () {
              card.classList.add("filter-pop");
            });
          }
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
        var order = parseInt(a.dataset.index, 10) - parseInt(b.dataset.index, 10);
        if (mode !== "price-asc" && mode !== "price-desc") return order;

        var typeA = a.getAttribute("data-price-type") || "sale";
        var typeB = b.getAttribute("data-price-type") || "sale";
        // Giá thuê tính theo tháng, không so sánh được với giá bán tuyệt đối
        // → chỉ sắp xếp trong cùng loại, nhóm cho thuê luôn xếp cuối theo thứ tự gốc.
        if (typeA !== typeB) return typeA === "rent" ? 1 : -1;
        if (typeA === "rent") return order;

        var pa = parseInt(a.getAttribute("data-price") || "0", 10);
        var pb = parseInt(b.getAttribute("data-price") || "0", 10);
        return mode === "price-asc" ? pa - pb : pb - pa;
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
        var price = $(".project-price", card);
        showToast(
          (name ? name.textContent.trim() : "Dự án") +
            (price ? " — " + price.textContent.trim() : "")
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
      // chỉ tab đang chọn nằm trong luồng Tab, đúng chuẩn tablist
      tabs.forEach(function (t) {
        t.tabIndex = t === tab ? 0 : -1;
      });
    });

    // Điều hướng tab bằng phím mũi tên trái/phải
    tabs.forEach(function (tab, index) {
      tab.tabIndex = tab.classList.contains("active") ? 0 : -1;
      tab.addEventListener("keydown", function (e) {
        var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        var next = tabs[(index + step + tabs.length) % tabs.length];
        next.focus();
        next.click();
      });
    });
  })();

  /* ===== Nút đăng ký xem nhà (chi tiết dự án) ===== */
  (function initViewingButton() {
    var btn = $("#viewingBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      showToast("✔ Đã ghi nhận! Chuyên viên PHÚC LAND sẽ gọi lại trong 30 phút.");
    });
  })();

  /* ===== Các form demo: đăng ký tư vấn + nhận bản tin ===== */
  (function initForms() {
    $$(".newsletter-form").forEach(function (form) {
      bindDemoForm(form, "✔ Cảm ơn bạn! Bản tin thị trường sẽ được gửi hằng tuần.");
    });

    var leadForm = $("#contactForm");
    if (leadForm) {
      bindDemoForm(
        leadForm,
        "✔ Đã gửi! Chuyên viên tư vấn sẽ liên hệ trong 30 phút làm việc.",
        "✔ Đã gửi yêu cầu tư vấn!"
      );
    }
  })();

  /* ===== Cập nhật năm ở footer ===== */
  (function initYear() {
    $$(".year").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  })();
})();
