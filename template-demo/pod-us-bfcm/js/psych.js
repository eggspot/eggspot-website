/* CASELAB® BFCM — conversion psychology layer: cookie bar, exit-intent offer, no-signup wishlist. */

const PSYCH_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};

/* ---------- #6: cookie notice as a thin line that leaves on its own ---------- */
/* The old panel covered the bottom 110 px — the thumb zone — on every screen until it was clicked. */
const COOKIE_KEY = 'caselab-cookie-ok';
const COOKIE_AUTO_MS = 8000;

function initCookieNotice() {
  const el = document.getElementById('cookieNotice');
  if (!el) return;
  if (store.get(COOKIE_KEY) === '1') return;
  el.hidden = false;

  const dismiss = () => {
    if (el.hidden) return;
    el.classList.add('is-leaving');
    setTimeout(() => { el.hidden = true; }, PSYCH_REDUCED ? 0 : 300);
    store.set(COOKIE_KEY, '1');
  };

  el.querySelectorAll('[data-cookie-dismiss]').forEach((b) => b.addEventListener('click', dismiss));
  setTimeout(dismiss, COOKIE_AUTO_MS);
  window.addEventListener('scroll', () => { if (window.scrollY > 240) dismiss(); }, { passive: true, once: true });
}

/* ---------- #7: exit-intent offer ---------- */
/* One appearance per session, muted for a week after it is seen, and never shown to someone who
   already took the offer — an overlay that keeps coming back reads as an ad, not a discount. */
const EXIT_KEY = 'podExitIntentShown';
const SUBSCRIBED_KEY = 'caselab-subscribed';
const EXIT_MUTE_DAYS = 7;
const EXIT_SCROLL_RATIO = 0.55;
const EXIT_DWELL_MS = 25000;
const EXIT_ARM_DELAY_MS = 1200;

let exitShown = false;
let exitLastFocused = null;

function exitOfferMuted() {
  if (store.get(SUBSCRIBED_KEY) === '1') return true;
  const seen = Number(store.get(EXIT_KEY) || 0);
  return seen > 0 && (Date.now() - seen) < EXIT_MUTE_DAYS * 864e5;
}

function buildExitOffer() {
  const el = document.createElement('div');
  el.className = 'exit-offer';
  el.id = 'exitOffer';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'exitOfferTitle');
  el.hidden = true;
  el.innerHTML = `
    <div class="exit-offer__card">
      <button class="icon-btn exit-offer__close" type="button" data-exit-close aria-label="Close offer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      <span class="mono-label exit-offer__eyebrow">Black Friday · ends Nov 30</span>
      <h2 id="exitOfferTitle">Leaving before the <em>60% off</em>?</h2>
      <p>One email and code <strong>BF60</strong> is yours — stacked on doorbusters already down to $6.99.</p>
      <form class="exit-offer__form" novalidate>
        <label class="visually-hidden" for="exitOfferEmail">Email address</label>
        <input type="email" id="exitOfferEmail" name="email" placeholder="Enter your email" required>
        <button class="btn btn--deal btn--block" type="submit">Send Me Code BF60</button>
      </form>
      <button class="exit-offer__decline" type="button" data-exit-close>No thanks, I'll pay full price</button>
      <p class="exit-offer__note mono-label">Free US shipping over $35 · 30-day free returns · Ends 11/30</p>
    </div>`;
  document.body.appendChild(el);
  return el;
}

function showExitOffer() {
  if (exitShown || exitOfferMuted() || document.querySelector('.cart-drawer.open')) return;
  exitShown = true;
  store.set(EXIT_KEY, String(Date.now()));
  const el = document.getElementById('exitOffer') || buildExitOffer();
  exitLastFocused = document.activeElement;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('open'));
  const input = el.querySelector('input');
  if (input) input.focus();
}

function hideExitOffer() {
  const el = document.getElementById('exitOffer');
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { el.hidden = true; }, PSYCH_REDUCED ? 0 : 200);
  if (exitLastFocused && exitLastFocused.focus) exitLastFocused.focus();
}

function initExitOffer() {
  if (exitOfferMuted()) return;
  const el = buildExitOffer();

  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-exit-close]')) hideExitOffer();
  });
  el.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = el.querySelector('input');
    if (!input.checkValidity()) { input.reportValidity(); return; }
    store.set(SUBSCRIBED_KEY, '1');
    el.querySelector('.exit-offer__card').innerHTML =
      '<p class="form-thanks form-thanks--dark" role="status">Check your inbox — code BF60 on its way!</p>';
    setTimeout(hideExitOffer, 2200);
  });
  document.addEventListener('keydown', (e) => {
    if (!el.classList.contains('open')) return;
    if (e.key === 'Escape') { hideExitOffer(); return; }
    /* Keep Tab inside the dialog — trapFocus is shared with the cart drawer and quick view. */
    if (e.key === 'Tab' && typeof trapFocus === 'function') trapFocus(el.querySelector('.exit-offer__card'), e);
  });

  /* Desktop reads intent from the pointer leaving the top of the window; touch has no such signal,
     so fall back to depth or dwell. */
  document.addEventListener('mouseleave', (e) => { if (e.clientY < 0) showExitOffer(); });

  /* mouseleave never fires on a phone, and a narrow window reports hover:hover often enough that
     pointer type alone is not a safe gate — arm the depth/dwell fallback for both. */
  const needsFallback = window.matchMedia('(hover: none), (pointer: coarse)').matches
    || window.innerWidth < 900;
  if (needsFallback) {
    setTimeout(showExitOffer, EXIT_DWELL_MS);
    /* A reload restores the previous scroll position, which would otherwise trip the depth
       threshold during page load — that is an ambush, not exit intent. Arm only after the
       layout settles, and require depth the visitor actually travelled this visit. */
    setTimeout(() => {
      const startY = window.scrollY;
      window.addEventListener('scroll', () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0 || window.scrollY <= startY) return;
        if (window.scrollY / max >= EXIT_SCROLL_RATIO) showExitOffer();
      }, { passive: true });
    }, EXIT_ARM_DELAY_MS);
  }
}

/* ---------- R15: save without an account ---------- */
/* Gating a heart behind signup is the fastest way to lose the person who was ready to commit.
   Save locally first; only ask for an email once saving has clearly become a habit. */
const WISHLIST_KEY = 'caselab-wishlist';
const WISHLIST_PROMPT_AT = 2;

const loadWishlist = () => {
  try { return JSON.parse(store.get(WISHLIST_KEY)) || []; } catch (e) { return []; }
};
let wishlist = loadWishlist();

window.isSaved = (id) => wishlist.includes(id);

function toggleSave(id, btn) {
  const saved = window.isSaved(id);
  wishlist = saved ? wishlist.filter((x) => x !== id) : wishlist.concat(id);
  store.set(WISHLIST_KEY, JSON.stringify(wishlist));
  btn.classList.toggle('is-saved', !saved);
  btn.setAttribute('aria-pressed', String(!saved));
  if (!saved) showSaveToast(wishlist.length);
}

function showSaveToast(count) {
  let toast = document.getElementById('saveToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'saveToast';
    toast.className = 'save-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  const ask = count >= WISHLIST_PROMPT_AT && store.get(SUBSCRIBED_KEY) !== '1';
  toast.innerHTML = ask
    ? `<p>Want your saved designs on any device?</p>
       <form class="save-toast__form" novalidate>
         <label class="visually-hidden" for="saveToastEmail">Email address</label>
         <input type="email" id="saveToastEmail" placeholder="Enter email → code BF60" required>
         <button class="btn btn--deal" type="submit">Save</button>
       </form>`
    : `<p><strong>Saved.</strong> ${count} design${count === 1 ? '' : 's'} in your list.</p>`;
  toast.classList.add('open');

  const form = toast.querySelector('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      if (!input.checkValidity()) { input.reportValidity(); return; }
      store.set(SUBSCRIBED_KEY, '1');
      toast.innerHTML = '<p><strong>Done.</strong> Code BF60 is in your inbox.</p>';
      setTimeout(() => toast.classList.remove('open'), 2400);
    });
  } else {
    setTimeout(() => toast.classList.remove('open'), 2600);
  }
}

function initWishlist() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-save]');
    if (!btn) return;
    e.preventDefault();
    toggleSave(btn.dataset.save, btn);
  });
}

/* Newsletter sign-ups anywhere on the site mute the exit offer. */
function initSubscribeSync() {
  document.querySelectorAll('.newsletter__form').forEach((form) => {
    form.addEventListener('submit', () => store.set(SUBSCRIBED_KEY, '1'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCookieNotice();
  initWishlist();
  initSubscribeSync();
  initExitOffer();
});
