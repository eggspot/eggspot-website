/* forms.js — validate client-side cho form liên hệ + form bản tin. Không gọi network. */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, message) {
    var errId = input.getAttribute('aria-describedby');
    var err = errId ? document.getElementById(errId) : null;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = message; err.hidden = false; }
    } else {
      input.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.hidden = true; }
    }
  }

  function showStatus(form, message, ok) {
    var status = form.querySelector('.form__status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('form__status--ok', !!ok);
    status.classList.toggle('form__status--err', !ok);
    status.hidden = false;
  }

  /* Trả về danh sách [input, message] cho các trường không hợp lệ */
  function collectErrors(form) {
    var errors = [];
    Array.prototype.forEach.call(form.querySelectorAll('input, textarea, select'), function (field) {
      if (field.type === 'checkbox' || field.name === 'website') return;
      var value = (field.value || '').trim();
      var min = parseInt(field.getAttribute('minlength'), 10);
      var msg = '';
      if (field.required && !value) msg = 'Vui lòng nhập thông tin này.';
      else if (field.type === 'email' && value && !EMAIL_RE.test(value)) msg = 'Địa chỉ email chưa đúng định dạng.';
      else if (min && value && value.length < min) msg = 'Vui lòng nhập tối thiểu ' + min + ' ký tự.';
      setError(field, msg);
      if (msg) errors.push([field, msg]);
    });
    return errors;
  }

  function checkConsent(form) {
    var consent = form.querySelector('input[type="checkbox"][required]');
    if (consent && !consent.checked) return consent;
    return null;
  }

  function handle(form, successMessage) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: bot điền trường ẩn thì im lặng bỏ qua
      var trap = form.querySelector('input[name="website"]');
      if (trap && trap.value) return;

      var errors = collectErrors(form);
      var consent = checkConsent(form);

      if (errors.length) {
        showStatus(form, 'Vui lòng kiểm tra lại các trường được đánh dấu.', false);
        errors[0][0].focus();
        return;
      }
      if (consent) {
        showStatus(form, 'Vui lòng đánh dấu đồng ý trước khi gửi.', false);
        consent.focus();
        return;
      }

      showStatus(form, successMessage, true);
      form.reset();
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) {
        setError(el, '');
      });
    });

    // Xoá lỗi ngay khi người dùng sửa lại
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
    });
  }

  var contact = document.getElementById('contactForm');
  if (contact) {
    handle(contact, 'Đã ghi nhận. Văn phòng chương trình sẽ phản hồi qua email trong 3–5 ngày làm việc.');
  }

  Array.prototype.forEach.call(document.querySelectorAll('.newsletter-form'), function (form) {
    handle(form, 'Đã ghi nhận email. Bản tin chương trình sẽ được gửi tới địa chỉ này.');
  });
})();
