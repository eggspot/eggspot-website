/* CASELAB® — header, reveal, parallax, drop urgency, filters, accordion. Depends on data.js */
/* Not here — split out to keep this file readable:
   exit-intent offer, cookie bar, wishlist ....... js/psych.js
   PDP buy box, sticky ATC, delivery promise ..... js/product-page.js
   collection filters + sticky filter bar ........ js/collection.js
   cart drawer + cross-sell ...................... js/cart.js
   quick view + quick-add model sheet ............ js/modals.js */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- scroll reveal (once) ---------- */
const revealObserver = ('IntersectionObserver' in window && !REDUCED)
  ? new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px' })
  : null;

window.observeReveals = function observeReveals(root) {
  const els = (root || document).querySelectorAll('.reveal:not(.in)');
  if (!revealObserver) { els.forEach((el) => el.classList.add('in')); return; }
  els.forEach((el) => revealObserver.observe(el));
};

/* ---------- drop urgency (countdown near the deadline, unit scarcity otherwise) ---------- */
function nextDropDate() {
  const now = new Date();
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  let add = (5 - day + 7) % 7;
  if (add === 0 && d <= now) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}

/* A clock reading 147 hours announces "you have plenty of time". Past 48h the honest pressure is
   how much of the run is gone, so show units claimed instead and let the clock appear near the end. */
const URGENCY_WINDOW_H = 48;
const DROP_UNITS = 500;

function dropUnitsClaimed() {
  const left = NEW_DROP_IDS.map(findProduct).filter(Boolean).reduce((n, p) => n + totalStock(p), 0);
  return Math.max(0, DROP_UNITS - left);
}

function initDropUrgency() {
  const el = document.querySelector('[data-countdown]');
  const claimed = document.getElementById('dropsClaimed');
  if (!el && !claimed) return;
  const target = nextDropDate();

  if ((target - Date.now()) / 36e5 > URGENCY_WINDOW_H) {
    if (el) el.hidden = true;
    const label = document.getElementById('dropsTimerLabel');
    if (label) label.textContent = 'Limited run';
    if (claimed) {
      claimed.hidden = false;
      claimed.innerHTML = `This week's drop — <strong>${dropUnitsClaimed()} of ${DROP_UNITS}</strong> units already claimed`;
    }
    return;
  }

  if (claimed) claimed.hidden = true;
  if (!el) return;
  el.hidden = false;
  const note = document.getElementById('dropsNote');
  if (note) note.hidden = false;
  const boxes = el.querySelectorAll('.countdown__num');
  const tick = () => {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const vals = [d, h, m, s];
    boxes.forEach((b, i) => { b.textContent = String(vals[i]).padStart(2, '0'); });
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- hero parallax (rAF, ≤40px, transform only) ---------- */
function initParallax() {
  const img = document.querySelector('[data-parallax]');
  if (!img || REDUCED) return;
  let ticking = false;
  const update = () => {
    const y = Math.min(40, window.scrollY * 0.12);
    img.style.transform = `translateY(${y}px)`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
}

/* ---------- header: hamburger + search ---------- */
function initHeader() {
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
      menuBtn.querySelector('.i-menu').style.display = open ? '' : 'none';
      menuBtn.querySelector('.i-x').style.display = open ? 'none' : '';
    });
  }
  const searchBtn = document.getElementById('searchBtn');
  const searchForm = document.getElementById('searchForm');
  if (searchBtn && searchForm) {
    searchBtn.addEventListener('click', () => {
      const open = searchForm.classList.toggle('open');
      searchBtn.setAttribute('aria-expanded', String(open));
      if (open) searchForm.querySelector('input').focus();
    });
    searchForm.addEventListener('submit', (e) => {
      const q = searchForm.querySelector('input').value.trim();
      const grid = document.getElementById('collectionGrid');
      if (grid) { e.preventDefault(); collectionState.q = q; applyCollectionFilters(); }
      // otherwise: default GET submit to collection.html?q=
    });
  }
}

/* ---------- accordion ---------- */
function initAccordions() {
  document.querySelectorAll('.accordion__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.style.maxHeight = open ? '0' : `${panel.scrollHeight}px`;
    });
  });
}

/* ---------- demo forms (newsletter + contact): no backend, no reload ---------- */
function initDemoForms() {
  document.querySelectorAll('form[action="#"]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const isNewsletter = form.classList.contains('newsletter__form');
      const thanks = document.createElement('p');
      thanks.className = 'form-thanks' + (isNewsletter ? ' form-thanks--dark' : '');
      thanks.setAttribute('role', 'status');
      thanks.textContent = isNewsletter
        ? "Thanks! Check your inbox for 10% off."
        : "Message sent — we'll reply within 24h.";
      form.hidden = true;
      form.insertAdjacentElement('afterend', thanks);
    });
  });
}

/* ---------- home grids ---------- */
const BEST_SELLERS_SHOWN = 6;

function initHomeGrids() {
  renderGrid(document.getElementById('dropsGrid'), NEW_DROP_IDS.map(findProduct));
  /* Four straight rows of the same card motif is where the scroll map flattens out — show six,
     then hand the browsing over to the collection page. */
  renderGrid(document.getElementById('bestGrid'),
    BEST_SELLER_IDS.slice(0, BEST_SELLERS_SHOWN).map(findProduct));
  const all = document.getElementById('bestViewAll');
  if (all) all.textContent = `View all ${PRODUCTS.length} products`;
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initHomeGrids();
  initAccordions();
  initDropUrgency();
  initParallax();
  initDemoForms();
  window.observeReveals(document);
});
