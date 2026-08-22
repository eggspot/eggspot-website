/* CASELAB® Halloween — product page: gallery, model-aware buy box, sticky ATC, delivery promise.
   Depends on data.js + cart.js */

const PDP_ID = 'spooky-season';

/* The selector lists ten marketing names; stock is tracked per generation. */
function deviceKeyFromLabel(label) {
  const m = /iPhone (\d+)/.exec(label || '');
  return m ? `iphone-${m[1]}` : '';
}

/* ---------- #13: a dated promise beats "ships fast" ---------- */
const CUTOFF_HOUR = 18;          // 6 PM local dispatch cutoff
const TRANSIT_DAYS = 3;          // business days to arrival when the order beats the cutoff

function addBusinessDays(from, n) {
  const d = new Date(from);
  while (n > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) n -= 1;
  }
  return d;
}

function deliveryPromise() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0);
  const beforeCutoff = now < cutoff;

  /* Miss today's dispatch and the parcel loses a whole business day. */
  const arrival = addBusinessDays(now, beforeCutoff ? TRANSIT_DAYS : TRANSIT_DAYS + 1);
  const date = arrival.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (!beforeCutoff) return { lead: 'Order before 6 PM tomorrow', date };
  const mins = Math.max(1, Math.round((cutoff - now) / 60000));
  const h = Math.floor(mins / 60);
  const left = h ? `${h}h ${mins % 60}m` : `${mins}m`;
  return { lead: `Order in the next ${left}`, date };
}

function paintDelivery() {
  /* Write into the text span, not the wrapper — the wrapper also holds the icon. */
  const el = document.getElementById('pdpDeliveryText');
  if (!el) return;
  const { lead, date } = deliveryPromise();
  el.innerHTML = `<strong>${lead}</strong> → get it by ${date}`;
}

/* ---------- #10: per-variant stock, straight from the product data ---------- */
function paintStock(product, device) {
  const note = document.getElementById('pdpStock');
  const addBtn = document.getElementById('pdpAdd');
  const notify = document.getElementById('pdpNotify');
  if (!note || !addBtn) return;

  const left = stockFor(product, device);
  const out = left === 0;

  if (left === null) {
    note.hidden = true;
  } else if (out) {
    note.hidden = false;
    note.className = 'pdp__stock pdp__stock--out';
    note.innerHTML = `<span>Sold out for ${DEVICE_LABELS[device]} — restock not scheduled.</span>`;
  } else if (left <= LOW_STOCK_AT) {
    note.hidden = false;
    note.className = 'pdp__stock pdp__stock--low';
    note.innerHTML = `<span class="dot" aria-hidden="true"></span><span>Low stock — <strong>${left} left</strong> for ${DEVICE_LABELS[device]}. ${product.sold24} sold in the last 24 hours.</span>`;
  } else {
    note.hidden = false;
    note.className = 'pdp__stock';
    note.innerHTML = `<span class="dot" aria-hidden="true"></span><span>In stock for ${DEVICE_LABELS[device]} · ${product.sold24} sold in the last 24 hours.</span>`;
  }

  addBtn.disabled = out;
  addBtn.hidden = out;
  if (notify) notify.hidden = !out;
  const stickyAdd = document.querySelector('[data-sticky-add]');
  if (stickyAdd) {
    stickyAdd.disabled = out;
    stickyAdd.textContent = out ? 'Notify me' : 'Add to Cart';
  }
}

function initProductPage() {
  const flipper = document.getElementById('galleryFlipper');
  if (!flipper) return;
  const product = findProduct(PDP_ID);

  const flipBtn = document.getElementById('flipBtn');
  flipBtn.addEventListener('click', () => {
    const flipped = flipper.classList.toggle('flipped');
    flipBtn.setAttribute('aria-pressed', String(flipped));
    flipBtn.querySelector('span').textContent = flipped ? 'View Front' : 'View Back';
  });

  const mainImg = document.getElementById('galleryMainImg');
  document.querySelectorAll('.gallery__thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.gallery__thumb').forEach((t) => t.setAttribute('aria-current', 'false'));
      thumb.setAttribute('aria-current', 'true');
      flipper.classList.remove('flipped');
      flipBtn.setAttribute('aria-pressed', 'false');
      flipBtn.querySelector('span').textContent = 'View Back';
      mainImg.src = thumb.querySelector('img').dataset.full;
    });
  });

  const qtyEl = document.getElementById('qtyValue');
  let qty = 1;
  document.getElementById('qtyDec').addEventListener('click', () => { qty = Math.max(1, qty - 1); qtyEl.textContent = qty; });
  document.getElementById('qtyInc').addEventListener('click', () => { qty += 1; qtyEl.textContent = qty; });

  const addBtn = document.getElementById('pdpAdd');
  const modelSel = document.getElementById('modelSelect');
  const stickyMeta = document.getElementById('pdpStickyMeta');

  const syncModel = () => {
    const label = modelSel.options[modelSel.selectedIndex].text;
    addBtn.dataset.variant = label;
    const stickyAdd = document.querySelector('[data-sticky-add]');
    if (stickyAdd) stickyAdd.dataset.variant = label;
    if (stickyMeta) stickyMeta.textContent = `${label} · ${product.rating} ★`;
    paintStock(product, deviceKeyFromLabel(label));
  };
  modelSel.addEventListener('change', syncModel);
  addBtn.addEventListener('click', () => { addBtn.dataset.qty = qty; }, true); // capture: set before cart.js reads it
  syncModel();

  /* Bundle buttons carry their own quantity and skip the model sheet — the model is already chosen here. */
  document.querySelectorAll('[data-bundle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.dataset.variant = modelSel.options[modelSel.selectedIndex].text;
    }, true);
  });

  paintDelivery();
  setInterval(paintDelivery, 60000);
  initStickyBar();
  initReviewFilters();
}

/* ---------- R12: let people interrogate the reviews ---------- */
/* 62% of shoppers deliberately open the critical reviews, and they convert better for it — so the
   filters have to actually work, including the ones that shrink the list. */
function initReviewFilters() {
  const grid = document.getElementById('reviewGrid');
  if (!grid) return;
  const empty = document.getElementById('reviewEmpty');
  const cards = Array.from(grid.children);
  const buttons = Array.from(document.querySelectorAll('[data-review-filter]'));
  const active = new Set();

  const apply = () => {
    let shown = cards.filter((c) =>
      (!active.has('photos') || c.dataset.photos === 'true')
      && (!active.has('verified') || c.dataset.verified === 'true'));
    if (active.has('recent')) shown = shown.slice().sort((a, b) => a.dataset.days - b.dataset.days);
    cards.forEach((c) => { c.hidden = !shown.includes(c); });
    shown.forEach((c) => grid.appendChild(c));
    if (empty) empty.hidden = shown.length > 0;
  };

  buttons.forEach((btn) => btn.addEventListener('click', () => {
    const key = btn.dataset.reviewFilter;
    const on = !active.has(key);
    if (on) active.add(key); else active.delete(key);
    btn.setAttribute('aria-pressed', String(on));
    apply();
  }));
}

/* ---------- #1: keep a buy button on screen for the 64% of the page below the buy box ---------- */
function initStickyBar() {
  const bar = document.getElementById('pdpStickyBar');
  const anchor = document.getElementById('pdpAdd');
  if (!bar || !anchor || !('IntersectionObserver' in window)) return;
  const buyRow = anchor.closest('.pdp__buy-row') || anchor;
  new IntersectionObserver(([en]) => {
    bar.hidden = en.isIntersecting || en.boundingClientRect.top > 0;
  }, { threshold: 0 }).observe(buyRow);
}

document.addEventListener('DOMContentLoaded', initProductPage);
