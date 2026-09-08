/* counters.js — đếm số cho .stat__value khi dải số liệu vào viewport. */
(function () {
  'use strict';

  var values = document.querySelectorAll('.stat__value[data-count-to]');
  if (!values.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(el, n) {
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    el.textContent = prefix + String(n) + suffix;
  }

  function finish(el) {
    render(el, parseFloat(el.dataset.countTo));
  }

  function animate(el) {
    var target = parseFloat(el.dataset.countTo);
    if (isNaN(target)) return;
    var duration = 1100;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutCubic — nhanh lúc đầu, dừng mềm
      var eased = 1 - Math.pow(1 - p, 3);
      render(el, Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(step);
      else finish(el);
    }
    window.requestAnimationFrame(step);
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(values, finish);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      animate(entry.target);
    });
  }, { threshold: 0.35 });

  Array.prototype.forEach.call(values, function (el) {
    render(el, 0);
    io.observe(el);
  });
})();
