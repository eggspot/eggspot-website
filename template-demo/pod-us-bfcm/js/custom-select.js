/* CASELAB® — custom select. One component for every dropdown in the theme.
   Progressive: the native <select> stays in the DOM as the source of truth, so data.js,
   collection.js and product-page.js keep reading `.value` / `.options[selectedIndex]` and keep
   receiving `change`. Mark up `<select data-custom-select>` and call initCustomSelects(root). */

const CS_CHEVRON = '<svg class="cs__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const CS_TICK = '<svg class="cs__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

let csSeq = 0;
const csOpen = new Set();

const csEsc = (str) => String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function buildCustomSelect(select) {
  if (select.dataset.csReady === '1') return null;
  select.dataset.csReady = '1';

  const uid = `cs${++csSeq}`;
  const wrap = document.createElement('div');
  wrap.className = 'cs' + (select.dataset.csTheme === 'light' ? ' cs--light' : '');
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add('cs__native');
  select.setAttribute('tabindex', '-1');
  select.setAttribute('aria-hidden', 'true');

  /* The visible control takes over the <label for>, so clicking the label still opens the list. */
  const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;
  if (label) {
    if (!label.id) label.id = `${uid}-label`;
    label.setAttribute('for', `${uid}-btn`);
  }

  wrap.insertAdjacentHTML('beforeend', `
    <button type="button" class="cs__btn" id="${uid}-btn" role="combobox"
      aria-haspopup="listbox" aria-expanded="false" aria-controls="${uid}-list"
      ${label ? `aria-labelledby="${label.id} ${uid}-btn"` : ''}>
      <span class="cs__value"></span>${CS_CHEVRON}
    </button>
    <ul class="cs__panel" id="${uid}-list" role="listbox" tabindex="-1"
      ${label ? `aria-labelledby="${label.id}"` : ''} hidden></ul>`);

  const btn = wrap.querySelector('.cs__btn');
  const panel = wrap.querySelector('.cs__panel');
  const valueEl = wrap.querySelector('.cs__value');
  let active = -1;
  let typed = '';
  let typedAt = 0;

  const opts = () => Array.from(panel.children);
  const enabledAt = (i) => opts()[i] && opts()[i].getAttribute('aria-disabled') !== 'true';

  function paintOptions() {
    panel.innerHTML = Array.from(select.options).map((o, i) => {
      const note = o.dataset.note ? `<span class="cs__opt-note">${csEsc(o.dataset.note)}</span>` : '';
      return `<li class="cs__opt" role="option" id="${uid}-opt-${i}" data-index="${i}"
        aria-selected="${i === select.selectedIndex}"${o.disabled ? ' aria-disabled="true"' : ''}>
        <span class="cs__opt-label">${csEsc(o.text)}</span>${note}${CS_TICK}</li>`;
    }).join('');
  }

  function syncFromNative() {
    const o = select.options[select.selectedIndex];
    valueEl.textContent = o ? o.text : '';
    valueEl.classList.toggle('is-placeholder', !!(o && o.dataset.placeholder));
    opts().forEach((li, i) => li.setAttribute('aria-selected', String(i === select.selectedIndex)));
  }

  function setActive(i) {
    active = i;
    opts().forEach((li, n) => li.classList.toggle('is-active', n === i));
    const li = opts()[i];
    if (li) {
      btn.setAttribute('aria-activedescendant', li.id);
      li.scrollIntoView({ block: 'nearest' });
    } else {
      btn.removeAttribute('aria-activedescendant');
    }
  }

  function move(step) {
    const n = opts().length;
    if (!n) return;
    let i = active < 0 ? select.selectedIndex : active;
    for (let hop = 0; hop < n; hop += 1) {
      i = (i + step + n) % n;
      if (enabledAt(i)) { setActive(i); return; }
    }
  }

  function edge(from, step) {
    const n = opts().length;
    for (let i = from; i >= 0 && i < n; i += step) if (enabledAt(i)) { setActive(i); return; }
  }

  /* The panel is absolute; flip it when the viewport edge is closer than the list. */
  function place() {
    wrap.classList.remove('cs--right', 'cs--up');
    const r = btn.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    if (r.left + p.width > window.innerWidth - 8) wrap.classList.add('cs--right');
    if (r.bottom + p.height > window.innerHeight - 8 && r.top > p.height + 8) wrap.classList.add('cs--up');
  }

  function open() {
    if (!panel.hidden) return;
    csOpen.forEach((close) => close());
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    setActive(select.selectedIndex);
    place();
    csOpen.add(close);
  }

  function close(refocus) {
    if (panel.hidden) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.removeAttribute('aria-activedescendant');
    opts().forEach((li) => li.classList.remove('is-active'));
    active = -1;
    csOpen.delete(close);
    if (refocus) btn.focus();
  }

  function commit(i) {
    if (i < 0 || !enabledAt(i)) return;
    if (i !== select.selectedIndex) {
      select.selectedIndex = i;
      syncFromNative();
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    close(true);
  }

  function typeahead(ch) {
    const now = Date.now();
    typed = now - typedAt > 700 ? ch : typed + ch;
    typedAt = now;
    const from = (active < 0 ? select.selectedIndex : active) + (typed.length > 1 ? 0 : 1);
    const n = opts().length;
    for (let hop = 0; hop < n; hop += 1) {
      const i = (from + hop + n) % n;
      if (enabledAt(i) && select.options[i].text.toLowerCase().startsWith(typed)) {
        if (panel.hidden) commit(i); else setActive(i);
        return;
      }
    }
  }

  btn.addEventListener('click', () => (panel.hidden ? open() : close(true)));

  btn.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'Escape') { if (!panel.hidden) { e.preventDefault(); close(true); } return; }
    if (k === 'Tab') { if (!panel.hidden) { commit(active); close(false); } return; }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      if (panel.hidden) open(); else move(k === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (k === 'Home' || k === 'End') {
      e.preventDefault();
      if (panel.hidden) open();
      if (k === 'Home') edge(0, 1); else edge(opts().length - 1, -1);
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      /* A space mid-search belongs to the search string ("iPhone 15"), not to the commit. */
      if (k !== 'Enter' && typed && Date.now() - typedAt < 700) { typeahead(' '); return; }
      if (panel.hidden) open(); else commit(active);
      return;
    }
    if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); typeahead(k.toLowerCase()); }
  });

  panel.addEventListener('click', (e) => {
    const li = e.target.closest('.cs__opt');
    if (li) commit(Number(li.dataset.index));
  });
  panel.addEventListener('mousemove', (e) => {
    const li = e.target.closest('.cs__opt');
    if (li && li.getAttribute('aria-disabled') !== 'true') setActive(Number(li.dataset.index));
  });

  /* Light trap: focus leaving the component closes it, and so does a click anywhere else. */
  wrap.addEventListener('focusout', () => {
    setTimeout(() => { if (!wrap.contains(document.activeElement)) close(false); }, 0);
  });

  /* collection.js assigns `select.value = …` to mirror the two sort controls. A plain assignment
     fires no event, so shadow the property and repaint on write. */
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  Object.defineProperty(select, 'value', {
    configurable: true,
    get() { return desc.get.call(this); },
    set(v) { desc.set.call(this, v); syncFromNative(); },
  });
  select.addEventListener('change', syncFromNative);

  paintOptions();
  syncFromNative();

  /* Options can be rewritten at runtime (the quick-add sheet does it per product). */
  wrap.csRefresh = () => { paintOptions(); syncFromNative(); };
  select.csRefresh = wrap.csRefresh;
  return wrap;
}

function initCustomSelects(root) {
  (root || document).querySelectorAll('select[data-custom-select]').forEach(buildCustomSelect);
}
window.initCustomSelects = initCustomSelects;

document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.cs')) csOpen.forEach((close) => close());
});
window.addEventListener('resize', () => csOpen.forEach((close) => close()));
document.addEventListener('DOMContentLoaded', () => initCustomSelects(document));
