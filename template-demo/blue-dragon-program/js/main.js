/* main.js — header sticky, dropdown, mobile nav, reveal, filter chip, back-to-top, năm ©. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Header sticky: đổi padding + shadow sau 80px, không đổi height (tránh CLS) --- */
  var header = document.getElementById('siteHeader');
  var backTop = document.querySelector('.back-to-top');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('site-header--scrolled', y > 80);
    if (backTop) backTop.hidden = y < 600;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* --- Dropdown nav desktop --- */
  var toggles = Array.prototype.slice.call(document.querySelectorAll('.nav__toggle'));
  function closePanels(except) {
    toggles.forEach(function (btn) {
      if (btn === except) return;
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
    });
  }
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      closePanels(btn);
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav__item--has-panel')) closePanels(null);
  });

  /* --- Mobile nav: focus trap, Esc đóng, trả focus về nút mở --- */
  var navToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobileNav');
  var mobilePanel = mobileNav ? mobileNav.querySelector('.mobile-nav__panel') : null;
  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function openMobileNav() {
    if (!mobileNav || !navToggle) return;
    mobileNav.hidden = false;
    document.body.classList.add('no-scroll');
    navToggle.setAttribute('aria-expanded', 'true');
    var first = mobilePanel && mobilePanel.querySelector(FOCUSABLE);
    if (first) first.focus();
  }
  function closeMobileNav(returnFocus) {
    if (!mobileNav || !navToggle) return;
    mobileNav.hidden = true;
    document.body.classList.remove('no-scroll');
    navToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) navToggle.focus();
  }
  if (navToggle) navToggle.addEventListener('click', openMobileNav);
  if (mobileNav) {
    mobileNav.addEventListener('click', function (e) {
      if (e.target === mobileNav || e.target.closest('.mobile-nav__close')) closeMobileNav(true);
    });
    mobileNav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !mobilePanel) return;
      var items = Array.prototype.slice.call(mobilePanel.querySelectorAll(FOCUSABLE))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mobileNav && !mobileNav.hidden) closeMobileNav(true);
    closePanels(null);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 900 && mobileNav && !mobileNav.hidden) closeMobileNav(false);
  });

  /* --- Reveal fade-up, chạy 1 lần --- */
  var revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealItems, function (el) { el.classList.add('reveal--in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('reveal--in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(revealItems, function (el) { io.observe(el); });
  }

  /* --- Chip lọc danh sách (đội ngũ giảng viên, tin tức) --- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-filter-group]'), function (bar) {
    var targets = document.querySelectorAll('[data-filter-target="' + bar.dataset.filterGroup + '"] [data-tag]');
    bar.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-filter]');
      if (!chip) return;
      var value = chip.dataset.filter;
      Array.prototype.forEach.call(bar.querySelectorAll('[data-filter]'), function (c) {
        c.classList.toggle('chip--active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      Array.prototype.forEach.call(targets, function (item) {
        item.hidden = value !== 'all' && item.dataset.tag !== value;
      });
    });
  });

  /* --- Accordion (FAQ, chính sách) --- */
  Array.prototype.forEach.call(document.querySelectorAll('.accordion__button'), function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  });

  /* --- Năm bản quyền --- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-current-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
