/* consent.js — cookie banner, lưu lựa chọn trong localStorage. Không script bên thứ ba. */
(function () {
  'use strict';

  var KEY = 'bd_consent';
  var banner = document.getElementById('cookieBanner');

  /* localStorage có thể bị chặn (private mode) — bọc try/catch, không để vỡ trang */
  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function write(choice) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ v: 1, choice: choice, ts: Date.now() }));
      return true;
    } catch (err) {
      return false;
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(KEY);
      return true;
    } catch (err) {
      return false;
    }
  }

  function show() {
    if (!banner) return;
    banner.hidden = false;
  }

  function hide() {
    if (!banner) return;
    banner.hidden = true;
    if (document.body) document.body.focus && document.body.focus();
  }

  if (banner) {
    if (!read()) show();

    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      write(btn.getAttribute('data-consent'));
      hide();
    });
  }

  /* Nút "Xem lại lựa chọn cookie" ở trang chính sách quyền riêng tư */
  var resetBtn = document.querySelector('[data-consent-reset]');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      clear();
      show();
      var status = document.getElementById('consentResetStatus');
      if (status) {
        status.textContent = 'Đã xoá lựa chọn cũ. Bảng thông báo cookie hiện lại ở cuối màn hình.';
        status.hidden = false;
      }
    });
  }
})();
