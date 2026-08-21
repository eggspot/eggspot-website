/* =====================================================
   MODE. — Fashion House
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

  // Ngăn cách hàng nghìn kiểu Việt Nam: 10000 → 10.000
  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Nhóm nút kiểu "radio": click nút nào thì nút đó active, các nút còn lại tắt
  function initRadioGroup(items, stateAttr, onPick) {
    items.forEach(function (item) {
      item.addEventListener("click", function () {
        items.forEach(function (other) {
          other.classList.remove("active");
          other.setAttribute(stateAttr, "false");
        });
        item.classList.add("active");
        item.setAttribute(stateAttr, "true");
        onPick(item);
      });
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
      }, 800);
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
    }, 2500);
  }

  /* ===== Giỏ hàng: badge count (lưu localStorage, an toàn khi bị chặn) ===== */
  var cart = {
    read: function () {
      try {
        return parseInt(window.localStorage.getItem("mode_cart") || "0", 10) || 0;
      } catch (err) {
        return 0;
      }
    },
    write: function (value) {
      try {
        window.localStorage.setItem("mode_cart", String(value));
      } catch (err) {
        /* localStorage bị chặn — bỏ qua, badge vẫn chạy trong phiên */
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

  /* ===== Header: đổi nền khi scroll + nút lên đầu trang ===== */
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
      // menu-open: đổi màu logo/icon/hamburger sang tông sáng trên nền overlay ink
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

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
          window.setTimeout(function () {
            el.classList.add("visible");
          }, delay);
          observer.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  })();

  /* ===== Hero parallax: ảnh nền dịch chậm hơn scroll ===== */
  (function initParallax() {
    var bg = $(".hero-bg");
    if (!bg || reducedMotion) return;

    var ticking = false;

    var update = function () {
      bg.style.transform = "translate3d(0," + window.pageYOffset * 0.3 + "px,0)";
      ticking = false;
    };

    var onScroll = function () {
      // Hero đã trôi hẳn khỏi viewport → gỡ listener, không tính toán vô ích nữa
      if (window.pageYOffset > bg.offsetHeight) {
        window.removeEventListener("scroll", onScroll);
        return;
      }
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    update();
  })();

  /* ===== Counter: đếm số thống kê khi vào viewport ===== */
  (function initCounters() {
    var counters = $$("[data-count]");
    if (!counters.length) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1600;
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

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  })();

  /* ===== Bộ lọc + sắp xếp sản phẩm (collection.html) ===== */
  (function initFilter() {
    var grid = $("#productGrid");
    if (!grid) return;

    var buttons = $$(".filter-btn");
    var countEl = $("#productCount");
    var sortSelect = $("#sortSelect");
    var emptyNote = $("#emptyNote");
    var cards = $$(".product-card", grid);
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
      if (countEl) countEl.textContent = visible + " sản phẩm";
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
          // animation riêng của bộ lọc, không đụng tới trạng thái của scroll reveal
          card.classList.remove("filter-pop");
          window.requestAnimationFrame(function () {
            card.classList.add("filter-pop");
          });
        } else {
          card.classList.add("filter-out");
          // chờ animation mờ dần xong mới gỡ card khỏi luồng layout
          window.setTimeout(
            function () {
              if (card.classList.contains("filter-out")) card.classList.add("hide");
            },
            reducedMotion ? 0 : 300
          );
        }
      });

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

  /* ===== Gallery sản phẩm: thumbnail + prev/next (product.html) ===== */
  (function initGallery() {
    var mainImg = $("#galleryMain");
    if (!mainImg) return;

    var thumbs = $$(".thumb");
    var current = 0;

    var show = function (index) {
      if (!thumbs.length) return;
      current = (index + thumbs.length) % thumbs.length;
      var thumb = thumbs[current];
      var src = thumb.getAttribute("data-full");
      var alt = thumb.getAttribute("data-alt") || mainImg.alt;

      thumbs.forEach(function (t) {
        t.classList.remove("active");
        t.removeAttribute("aria-current");
      });
      thumb.classList.add("active");
      thumb.setAttribute("aria-current", "true");

      // đổi ảnh với hiệu ứng mờ dần
      mainImg.classList.add("fading");
      window.setTimeout(
        function () {
          mainImg.src = src;
          mainImg.alt = alt;
          mainImg.classList.remove("fading");
        },
        reducedMotion ? 0 : 220
      );
    };

    thumbs.forEach(function (thumb, index) {
      thumb.addEventListener("click", function () {
        show(index);
      });
    });

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

  /* ===== Tabs mô tả sản phẩm ===== */
  (function initTabs() {
    var tabs = $$(".tab-btn");
    if (!tabs.length) return;

    initRadioGroup(tabs, "aria-selected", function (tab) {
      var targetId = tab.getAttribute("data-tab");
      $$(".tab-panel").forEach(function (panel) {
        panel.classList.toggle("active", panel.id === targetId);
      });
    });
  })();

  /* ===== Chọn màu / size / số lượng / thêm giỏ hàng ===== */
  (function initProductOptions() {
    var colorLabel = $("#colorLabel");
    initRadioGroup($$(".swatch"), "aria-pressed", function (swatch) {
      if (colorLabel) {
        colorLabel.textContent = swatch.getAttribute("data-color") || "";
      }
    });

    var sizeLabel = $("#sizeLabel");
    initRadioGroup($$(".size-btn"), "aria-pressed", function (btn) {
      if (sizeLabel) sizeLabel.textContent = btn.textContent.trim();
    });

    var qtyInput = $("#qtyInput");
    var minus = $("#qtyMinus");
    var plus = $("#qtyPlus");

    var readQty = function () {
      var value = parseInt(qtyInput && qtyInput.value, 10);
      return isNaN(value) || value < 1 ? 1 : Math.min(value, 20);
    };

    if (qtyInput) {
      qtyInput.addEventListener("change", function () {
        qtyInput.value = String(readQty());
      });
    }
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

    var buyNow = $("#buyNow");
    if (buyNow) {
      buyNow.addEventListener("click", function () {
        addToCart(readQty());
        showToast("Đang chuyển tới thanh toán… (demo)");
      });
    }
  })();

  /* ===== Nút "Xem nhanh" trên product card ===== */
  (function initQuickView() {
    // Là <button> thật, nằm trên link phủ card (z-index) nên không kích hoạt link
    $$(".quick-view").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addToCart(1);
        showToast("Đã thêm vào giỏ ✓");
      });
    });
  })();

  /* ===== Nút giỏ hàng / tìm kiếm trên header (demo) ===== */
  (function initHeaderActions() {
    var cartBtn = $("#cartBtn");
    if (cartBtn) {
      cartBtn.addEventListener("click", function () {
        showToast(
          cartCount > 0
            ? "Giỏ hàng có " + cartCount + " sản phẩm"
            : "Giỏ hàng đang trống"
        );
      });
    }

    $$(".icon-search").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showToast("Tìm kiếm sẽ sớm ra mắt");
      });
    });
  })();

  /* ===== Form đăng ký nhận tin (demo, không gửi dữ liệu) ===== */
  (function initNewsletter() {
    $$(".newsletter-form").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = $("input[type='email']", form);
        var note = $(".form-note", form);
        var consent = $("[name='consent']", form);
        if (!input || !input.value.trim()) return;
        // novalidate tắt bong bóng của trình duyệt, nên ô đồng ý phải tự kiểm
        if (consent && !consent.checked) {
          if (note) {
            note.textContent = "Vui lòng đồng ý với Chính sách bảo mật trước khi gửi.";
            note.classList.add("show");
          }
          consent.focus();
          return;
        }
        if (note) {
          note.textContent = "✔ Cảm ơn bạn! Ưu đãi sẽ được gửi tới hộp thư sớm.";
          note.classList.add("show");
        }
        form.reset();
      });
    });
  })();

  /* ===== Form liên hệ (demo, không gửi dữ liệu) ===== */
  (function initContactForm() {
    var form = $("#contactForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $(".form-note", form);
      var consent = $("[name='consent']", form);

      // novalidate tắt bong bóng của trình duyệt, nên ô đồng ý phải tự kiểm
      if (consent && !consent.checked) {
        if (note) {
          note.textContent = "Vui lòng đồng ý với Chính sách bảo mật trước khi gửi.";
          note.classList.add("show");
        }
        consent.focus();
        return;
      }

      if (note) {
        note.textContent = "✔ Đã gửi! Chúng tôi sẽ phản hồi trong 24h.";
        note.classList.add("show");
      }
      showToast("✔ Đã gửi! Chúng tôi sẽ phản hồi trong 24h.");
      form.reset();
    });
  })();

  /* ===== Lựa chọn cookie ===== */
  /* Bản mẫu không nạp analytics hay mã theo dõi nào. Nếu sau này thêm, đoạn nạp
     đó phải chờ localStorage "gdpr-consent" bằng "accept" rồi mới chạy. */
  (function initGdpr() {
    var banner = $(".gdpr-banner");
    if (!banner) return;

    var KEY = "gdpr-consent";
    var choice = null;

    // Chế độ riêng tư hoặc trình duyệt chặn cookie làm localStorage ném lỗi cả
    // khi đọc lẫn khi ghi — nuốt lỗi để một cái kho hỏng không chặn cả trang.
    try {
      choice = window.localStorage.getItem(KEY);
    } catch (err) {
      /* không đọc được lựa chọn cũ — coi như chưa chọn */
    }

    if (choice) return;

    banner.hidden = false;

    $$("[data-gdpr]", banner).forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          window.localStorage.setItem(KEY, btn.getAttribute("data-gdpr"));
        } catch (err) {
          /* không ghi được — vẫn đóng thanh cho phiên hiện tại */
        }
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
