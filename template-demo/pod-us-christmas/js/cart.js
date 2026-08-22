/* CASELAB® Holiday — cart drawer, quick-view modal, fly-to-cart. Depends on data.js */

const FREE_SHIP = 35;
const CART_KEY = 'caselab-xmas-cart';

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/* ---------- state ---------- */
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
}
let cart = loadCart();

const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);
const cartSubtotal = () => cart.reduce((s, l) => {
  const p = findProduct(l.id);
  return p ? s + p.price * l.qty : s;
}, 0);

function addToCart(id, qty, variant) {
  const line = cart.find((l) => l.id === id && l.variant === (variant || ''));
  if (line) line.qty += qty || 1;
  else cart.push({ id, qty: qty || 1, variant: variant || '' });
  saveCart(cart);
  renderCart();
  bumpBadge();
}

/* ---------- focus trap (shared by drawer + modal) ---------- */
let lastFocused = null;
function trapFocus(container, e) {
  const focusables = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------- cart drawer ---------- */
function openCart() {
  lastFocused = document.activeElement;
  $('#cartDrawer').classList.add('open');
  $('#overlay').classList.add('open');
  $('#cartDrawer').removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  const closeBtn = $('#cartClose');
  if (closeBtn) closeBtn.focus();
}
function closeCart() {
  $('#cartDrawer').classList.remove('open');
  $('#overlay').classList.remove('open');
  $('#cartDrawer').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}

function renderCart() {
  const badge = $('#cartCountBadge');
  const n = cartCount();
  if (badge) { badge.textContent = n; badge.hidden = n === 0; }

  const itemsEl = $('#cartItems');
  if (!itemsEl) return;

  if (!cart.length) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p>Your cart is empty.</p>
        <p class="mono-label" style="margin-top:6px">Free US shipping over $35</p>
      </div>`;
  } else {
    itemsEl.innerHTML = cart.map((l) => {
      const p = findProduct(l.id);
      if (!p) return '';
      return `
      <div class="cart-item" data-line="${l.id}::${l.variant}">
        <img class="cart-item__img" src="${imgUrl(p, 200)}" alt="" width="72" height="90">
        <div>
          <p class="cart-item__name">${p.name}</p>
          <p class="cart-item__variant">${l.variant || (p.cat === 'airpods' ? 'AirPods' : 'iPhone')}</p>
          <div class="cart-item__qty">
            <button type="button" data-dec aria-label="Decrease quantity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg></button>
            <span aria-live="polite">${l.qty}</span>
            <button type="button" data-inc aria-label="Increase quantity">${ICON_PLUS}</button>
          </div>
        </div>
        <div class="cart-item__right">
          <button class="icon-btn cart-item__remove" type="button" data-remove aria-label="Remove ${p.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </button>
          <span class="price">${money(p.price * l.qty)}</span>
        </div>
      </div>`;
    }).join('');
  }

  const subtotal = cartSubtotal();
  const subEl = $('#cartSubtotal');
  if (subEl) subEl.textContent = money(subtotal);

  const remain = FREE_SHIP - subtotal;
  const shipMsg = $('#shipMsg');
  const shipFill = $('#shipFill');
  if (shipMsg && shipFill) {
    if (subtotal <= 0) {
      shipMsg.innerHTML = `Free US shipping on orders over <strong>${money(FREE_SHIP)}</strong>`;
      shipFill.style.width = '0%';
    } else if (remain > 0) {
      shipMsg.innerHTML = `You're <strong>${money(remain)}</strong> away from free shipping!`;
      shipFill.style.width = `${Math.min(100, (subtotal / FREE_SHIP) * 100)}%`;
    } else {
      shipMsg.innerHTML = `<strong>You've unlocked FREE shipping!</strong> 🎉`;
      shipFill.style.width = '100%';
    }
  }
  renderCrossSell(remain);
}

/* ---------- cross-sell under the free-ship progress bar ---------- */
/* Only compatible add-ons, and only ones that help close the free-shipping gap — an unrelated
   suggestion here reads as an ad and gets ignored. */
const CROSS_SELL_IDS = ['christmas-stocking-airpods', 'snowflake-carabiner', 'jingle-bell-airpods'];

function crossSellCandidates(remain) {
  const inCart = new Set(cart.map((l) => l.id));
  const list = CROSS_SELL_IDS.map(findProduct)
    .filter((p) => p && !inCart.has(p.id) && totalStock(p) > 0);
  if (remain > 0) {
    const closers = list.filter((p) => p.price >= remain && p.price <= remain + 6);
    if (closers.length) return closers.slice(0, 2);
  }
  return list.slice(0, 2);
}

function renderCrossSell(remain) {
  const ship = $('.cart-drawer__ship');
  if (!ship) return;
  let el = $('#cartCrossSell');
  if (!el) {
    el = document.createElement('div');
    el.className = 'cart-xsell';
    el.id = 'cartCrossSell';
    ship.insertAdjacentElement('afterend', el);
  }
  const picks = cart.length ? crossSellCandidates(remain) : [];
  if (!picks.length) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = `
    <p class="cart-xsell__head mono-label">${remain > 0
      ? `Add ${money(remain)} to unlock free shipping`
      : 'Complete your setup'}</p>
    ${picks.map((p) => `
      <div class="cart-xsell__row">
        <img src="${imgUrl(p, 120)}" alt="" width="44" height="44" loading="lazy">
        <span class="cart-xsell__name">${p.name}</span>
        <span class="price">${money(p.price)}</span>
        <button class="btn btn--ghost cart-xsell__add" type="button"
          data-add="${p.id}" data-open="false" data-variant="${p.devices.length ? DEVICE_LABELS[p.devices[0]] : 'One size'}">Add</button>
      </div>`).join('')}`;
}

function bumpBadge() {
  const badge = $('#cartCountBadge');
  if (!badge) return;
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
  setTimeout(() => badge.classList.remove('bump'), 300);
}

/* ---------- fly-to-cart dot ---------- */
function flyToCart(fromEl) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = $('#cartBtn');
  if (!fromEl || !target) return;
  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'fly-dot';
  dot.style.left = `${a.left + a.width / 2 - 7}px`;
  dot.style.top = `${a.top + a.height / 2 - 7}px`;
  document.body.appendChild(dot);
  requestAnimationFrame(() => {
    dot.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.4)`;
    dot.style.opacity = '0';
  });
  setTimeout(() => dot.remove(), 650);
}

/* ---------- global listeners ---------- */
document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add]');
  if (addBtn) {
    e.preventDefault();
    /* Quick-add from a card: resolve the model first — a remembered one keeps it to a single tap. */
    if (addBtn.dataset.pick) {
      const p = findProduct(addBtn.dataset.add);
      if (p && p.devices.length) {
        const i = p.devices.indexOf(rememberedModel());
        if (i > -1 && p.stock[i] > 0) {
          addToCart(p.id, 1, DEVICE_LABELS[p.devices[i]]);
          flyToCart(addBtn);
          setTimeout(openCart, 450);
        } else {
          openModelSheet(p);
        }
        return;
      }
    }
    addToCart(addBtn.dataset.add, Number(addBtn.dataset.qty || 1), addBtn.dataset.variant || '');
    flyToCart(addBtn);
    if (addBtn.closest('#qvModal')) closeQuickView();
    if (addBtn.dataset.open !== 'false') setTimeout(openCart, 450);
    return;
  }
  const line = e.target.closest('.cart-item');
  if (line) {
    const [id, variant] = line.dataset.line.split('::');
    const l = cart.find((x) => x.id === id && x.variant === variant);
    if (!l) return;
    if (e.target.closest('[data-inc]')) l.qty += 1;
    else if (e.target.closest('[data-dec]')) l.qty = Math.max(0, l.qty - 1);
    else if (e.target.closest('[data-remove]')) l.qty = 0;
    else return;
    cart = cart.filter((x) => x.qty > 0);
    saveCart(cart);
    renderCart();
    return;
  }

  if (e.target.closest('#cartBtn')) { e.preventDefault(); openCart(); return; }
  if (e.target.closest('#cartClose')) { closeCart(); return; }
  if (e.target.id === 'overlay') { closeCart(); closeQuickView(); closeModelSheet(); return; }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCart();
    closeQuickView();
    closeModelSheet();
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') menuBtn.click();
  }
  if (e.key === 'Tab') {
    const drawer = $('#cartDrawer');
    const modal = $('#qvModal');
    const sheet = $('#modelSheet');
    if (drawer && drawer.classList.contains('open')) trapFocus(drawer, e);
    else if (sheet && sheet.classList.contains('open')) trapFocus(sheet.querySelector('.qv-modal__card'), e);
    else if (modal && modal.classList.contains('open')) trapFocus(modal.querySelector('.qv-modal__card'), e);
  }
});

document.addEventListener('DOMContentLoaded', renderCart);
