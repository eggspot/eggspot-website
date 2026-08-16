/* =====================================================
   HƯƠNG QUÊ — Nhà hàng ẩm thực Việt
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

  // Ngăn cách hàng nghìn kiểu Việt Nam: 500000 → 500.000
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

  /* ===== Giỏ món: badge đếm (lưu localStorage, an toàn khi bị chặn) ===== */
  var cart = {
    read: function () {
      try {
        return parseInt(window.localStorage.getItem("hq_cart") || "0", 10) || 0;
      } catch (err) {
        return 0;
      }
    },
    write: function (value) {
      try {
        window.localStorage.setItem("hq_cart", String(value));
      } catch (err) {
        /* localStorage bị chặn — badge vẫn chạy trong phiên hiện tại */
      }
    }
  };

  var cartCount = cart.read();

  function renderCart() {
    $$(".cart-badge").forEach(function (badge) {
      badge.textContent = String(cartCount);
    });
  }

  function addToCart(qty) {
    cartCount += qty;
    cart.write(cartCount);
    renderCart();
  }

  renderCart();

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
    // overhang = phần ảnh dự trữ thò ra ngoài khung hero (do inset âm trong CSS),
    // ảnh không bao giờ được dịch quá mức này nếu không sẽ hở nền ở đỉnh hero.
    var heroH = bg.parentElement.offsetHeight;
    var overhang = Math.max(0, (bg.offsetHeight - heroH) / 2);
    // Hệ số chọn theo đúng phần dự trữ: cuộn hết hero thì ảnh dịch vừa đủ overhang.
    // Muốn parallax mạnh hơn chỉ cần tăng inset âm của .hero-bg trong CSS.
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

  /* ===== Bộ lọc + sắp xếp thực đơn (thuc-don.html) ===== */
  (function initFilter() {
    var grid = $("#dishGrid");
    if (!grid) return;

    // .pill-btn dùng chung nhiều nhóm nút → luôn giới hạn trong nhóm của mình
    var filterGroup = $(".filter-group");
    var buttons = filterGroup ? $$(".pill-btn", filterGroup) : [];
    var countEl = $("#dishCount");
    var sortSelect = $("#sortSelect");
    var emptyNote = $("#emptyNote");
    var cards = $$(".dish-card", grid);
    var activeFilter = "all";
    var hideTimer = null;

    // Ghi nhớ thứ tự gốc để phục vụ sắp xếp "Gợi ý của bếp"
    cards.forEach(function (card, index) {
      card.dataset.index = String(index);
      // gỡ class animation khi chạy xong để lần lọc sau kích hoạt lại được
      card.addEventListener("animationend", function (e) {
        if (e.animationName === "filterPop") card.classList.remove("filter-pop");
      });
    });

    var updateCount = function (visible) {
      if (countEl) countEl.textContent = visible + " món";
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
        var pa = parseInt(a.getAttribute("data-price") || "0", 10);
        var pb = parseInt(b.getAttribute("data-price") || "0", 10);
        if (mode === "price-asc") return pa - pb;
        if (mode === "price-desc") return pb - pa;
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

  /* ===== Nút "Thêm món" trên dish card ===== */
  (function initQuickView() {
    // Là <button> thật, nằm trên link phủ card (z-index) nên không kích hoạt link
    $$(".quick-view").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".dish-card");
        var name = card ? $("h3", card) : null;
        addToCart(1);
        showToast(
          "Đã thêm " + (name ? name.textContent.trim() : "món") + " vào giỏ ✓"
        );
      });
    });
  })();

  /* ===== Gallery chi tiết món: thumbnail + prev/next ===== */
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

  /* ===== Tabs thông tin món ăn ===== */
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

  /* ===== Chọn khẩu phần / số lượng / thêm vào giỏ (chi-tiet-mon-an.html) ===== */
  (function initDishOptions() {
    var portionLabel = $("#portionLabel");
    var portionGroup = $(".portions");
    if (portionGroup) {
      // .pill-btn dùng chung nhiều nhóm nút → luôn giới hạn trong nhóm của mình
      initRadioGroup($$(".pill-btn", portionGroup), "aria-pressed", function (btn) {
        if (portionLabel) portionLabel.textContent = btn.textContent.trim();
      });
    }

    var qtyInput = $("#qtyInput");
    if (!qtyInput) return;

    var readQty = function () {
      var value = parseInt(qtyInput.value, 10);
      return isNaN(value) || value < 1 ? 1 : Math.min(value, 20);
    };

    qtyInput.addEventListener("change", function () {
      qtyInput.value = String(readQty());
    });

    var minus = $("#qtyMinus");
    var plus = $("#qtyPlus");
    if (minus) {
      minus.addEventListener("click", function () {
        qtyInput.value = String(Math.max(1, readQty() - 1));
      });
    }
    if (plus) {
      plus.addEventListener("click", function () {
        qtyInput.value = String(Math.min(20, readQty() + 1));
      });
    }

    var addBtn = $("#addToCart");
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        addToCart(readQty());
        showToast("Đã thêm vào giỏ ✓");
      });
    }
  })();

  /* ===== Nút giỏ món trên header ===== */
  (function initCartButton() {
    var cartBtn = $("#cartBtn");
    if (!cartBtn) return;

    cartBtn.addEventListener("click", function () {
      showToast(
        cartCount > 0
          ? "Giỏ món đang có " + cartCount + " món"
          : "Giỏ món đang trống"
      );
    });
  })();

  /* ===== Các form demo: đặt bàn + đăng ký nhận tin ===== */
  (function initForms() {
    $$(".newsletter-form").forEach(function (form) {
      bindDemoForm(form, "✔ Cảm ơn bạn! Ưu đãi sẽ được gửi tới hộp thư.");
    });

    $$(".booking-form").forEach(function (form) {
      bindDemoForm(
        form,
        "✔ Đã nhận yêu cầu đặt bàn! Chúng tôi gọi xác nhận trong 15 phút.",
        "✔ Đã gửi yêu cầu đặt bàn!"
      );
    });
  })();

  /* ===== Cập nhật năm ở footer ===== */
  (function initYear() {
    $$(".year").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  })();
})();
