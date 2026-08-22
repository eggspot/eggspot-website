/* CASELAB® Halloween — one custom listbox that replaces every native <select>.
   Progressive enhancement, not replacement: the <select> stays in the DOM as the single source of
   truth, so every existing listener (collection filters, sort mirror, PDP model, quick-add sheet)
   keeps reading .value / .options exactly as before. Follows the APG select-only combobox pattern —
   focus never leaves the button, the active option is announced via aria-activedescendant. */

(function () {
  const CHEVRON = '<svg class="c-select__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const TYPEAHEAD_MS = 700;
  const store = new WeakMap();
  let uid = 0;

  /* Reuse the author's <label> for the accessible name instead of inventing a second one. */
  function labelIdFor(select, id) {
    const l = select.id && document.querySelector(`label[for="${select.id}"]`);
    if (!l) return '';
    if (!l.id) l.id = `${id}-label`;
    return l.id;
  }

  function enhance(select) {
    if (store.has(select)) return store.get(select);
    const id = select.id || `cs-${++uid}`;

    const wrap = document.createElement('div');
    wrap.className = 'c-select';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('c-select__native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'c-select__btn';
    btn.id = `${id}-btn`;
    btn.setAttribute('role', 'combobox');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `${id}-list`);
    btn.innerHTML = `<span class="c-select__value"></span>${CHEVRON}`;

    const list = document.createElement('ul');
    list.className = 'c-select__panel';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    list.hidden = true;

    const labelId = labelIdFor(select, id);
    btn.setAttribute('aria-labelledby', `${labelId ? labelId + ' ' : ''}${btn.id}`);
    if (labelId) list.setAttribute('aria-labelledby', labelId);

    wrap.append(btn, list);
    const cs = { select, wrap, btn, list, id, open: false, active: -1, typed: '', typedAt: 0 };
    store.set(select, cs);
    build(cs);
    bind(cs);
    return cs;
  }

  /* Rebuild the panel from the native options — also the hook for data-driven <select>s. */
  function build(cs) {
    cs.list.innerHTML = Array.from(cs.select.options).map((o, i) => `
      <li class="c-select__opt" role="option" id="${cs.id}-opt-${i}" data-i="${i}"
          aria-selected="false"${o.disabled ? ' aria-disabled="true"' : ''}>${o.text}</li>`).join('');
    cs.opts = Array.from(cs.list.children);
    paint(cs);
  }

  function paint(cs) {
    const i = cs.select.selectedIndex;
    cs.wrap.querySelector('.c-select__value').textContent = i > -1 ? cs.select.options[i].text : '';
    cs.opts.forEach((li, n) => li.setAttribute('aria-selected', String(n === i)));
    setActive(cs, cs.open ? cs.active : i, false);
  }

  function setActive(cs, i, scroll) {
    cs.active = i;
    cs.opts.forEach((li, n) => li.classList.toggle('is-active', n === i));
    const li = cs.opts[i];
    if (!li) { cs.btn.removeAttribute('aria-activedescendant'); return; }
    cs.btn.setAttribute('aria-activedescendant', li.id);
    if (scroll) li.scrollIntoView({ block: 'nearest' });
  }

  /* The panel is absolutely positioned under the button, so on a phone a ten-option model
     list opens straight through the fold. Measure the room on both sides of the button and
     flip upwards when below cannot hold the list; then cap the height to whichever side we
     landed on, never past the max-height the stylesheet asked for. */
  const PANEL_GUTTER = 14;

  function place(cs) {
    const panel = cs.list;
    cs.wrap.classList.remove('c-select--up');
    panel.style.maxHeight = '';
    const rect = cs.btn.getBoundingClientRect();
    const cssCap = parseFloat(getComputedStyle(panel).maxHeight);
    const wanted = Number.isNaN(cssCap) ? panel.scrollHeight : Math.min(panel.scrollHeight, cssCap);
    const below = window.innerHeight - rect.bottom - PANEL_GUTTER;
    const above = rect.top - PANEL_GUTTER;
    const up = wanted > below && above > below;
    if (up) cs.wrap.classList.add('c-select--up');
    panel.style.maxHeight = `${Math.max(120, Math.min(wanted, up ? above : below))}px`;
  }

  function openPanel(cs) {
    if (cs.open || cs.select.disabled) return;
    closeAll(cs);
    cs.open = true;
    cs.list.hidden = false;
    cs.wrap.classList.add('is-open');
    cs.btn.setAttribute('aria-expanded', 'true');
    place(cs);
    setActive(cs, cs.select.selectedIndex, true);
  }

  function closePanel(cs, refocus) {
    if (!cs.open) return;
    cs.open = false;
    cs.list.hidden = true;
    cs.wrap.classList.remove('is-open', 'c-select--up');
    cs.list.style.maxHeight = '';
    cs.btn.setAttribute('aria-expanded', 'false');
    cs.btn.removeAttribute('aria-activedescendant');
    if (refocus) cs.btn.focus();
  }

  function commit(cs, i) {
    const opt = cs.select.options[i];
    if (!opt || opt.disabled) return;
    const changed = cs.select.selectedIndex !== i;
    cs.select.selectedIndex = i;
    paint(cs);
    closePanel(cs, true);
    /* Fire on the native element so every existing `change` listener still sees it. */
    if (changed) cs.select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* Skip disabled entries so the keyboard never parks on something Enter can't take. */
  function step(cs, from, dir) {
    const n = cs.select.options.length;
    for (let k = 1; k <= n; k += 1) {
      const i = Math.min(n - 1, Math.max(0, from + dir * k));
      if (!cs.select.options[i].disabled) return i;
      if (i === 0 || i === n - 1) break;
    }
    return from;
  }

  function edge(cs, dir) {
    const usable = Array.from(cs.select.options)
      .map((o, i) => (o.disabled ? -1 : i)).filter((i) => i > -1);
    if (!usable.length) return cs.active;
    return dir > 0 ? usable[0] : usable[usable.length - 1];
  }

  function typeahead(cs, ch) {
    const now = Date.now();
    cs.typed = now - cs.typedAt > TYPEAHEAD_MS ? ch : cs.typed + ch;
    cs.typedAt = now;
    const hit = Array.from(cs.select.options)
      .findIndex((o) => !o.disabled && o.text.toLowerCase().startsWith(cs.typed));
    if (hit < 0) return;
    if (cs.open) setActive(cs, hit, true); else commit(cs, hit);
  }

  function bind(cs) {
    cs.btn.addEventListener('click', () => (cs.open ? closePanel(cs, false) : openPanel(cs)));

    cs.btn.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'Escape') { closePanel(cs, true); return; }
      if (k === 'Tab') { closePanel(cs, false); return; }
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Home' || k === 'End') {
        e.preventDefault();
        if (!cs.open) { openPanel(cs); if (k === 'ArrowDown' || k === 'ArrowUp') return; }
        const from = cs.active > -1 ? cs.active : cs.select.selectedIndex;
        if (k === 'Home') setActive(cs, edge(cs, 1), true);
        else if (k === 'End') setActive(cs, edge(cs, -1), true);
        else setActive(cs, step(cs, from, k === 'ArrowDown' ? 1 : -1), true);
        return;
      }
      if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
        e.preventDefault();
        if (cs.open) commit(cs, cs.active); else openPanel(cs);
        return;
      }
      if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); typeahead(cs, k.toLowerCase()); }
    });

    cs.list.addEventListener('click', (e) => {
      const li = e.target.closest('.c-select__opt');
      if (li) commit(cs, Number(li.dataset.i));
    });
    cs.list.addEventListener('mousemove', (e) => {
      const li = e.target.closest('.c-select__opt');
      if (li && !li.hasAttribute('aria-disabled')) setActive(cs, Number(li.dataset.i), false);
    });
  }

  function closeAll(except) {
    document.querySelectorAll('.c-select.is-open .c-select__native').forEach((sel) => {
      const cs = store.get(sel);
      if (cs && cs !== except) closePanel(cs, false);
    });
  }

  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.c-select.is-open')) closeAll(null);
  });

  /* A resize or a scroll moves the button out from under the panel we measured against —
     a sticky bar collapsing under an open list is enough to strand it off-screen. */
  window.addEventListener('resize', () => closeAll(null));
  window.addEventListener('scroll', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('c-select__panel')) return;
    document.querySelectorAll('.c-select.is-open .c-select__native').forEach((sel) => {
      const cs = store.get(sel);
      if (cs && cs.open) place(cs);
    });
  }, { passive: true, capture: true });

  /* Public surface: initAll on load, plus sync/rebuild for code that sets .value in JS. */
  window.CustomSelect = {
    enhance,
    init(root) {
      (root || document).querySelectorAll('select:not(.c-select__native)').forEach(enhance);
    },
    sync(select) { const cs = store.get(select); if (cs) paint(cs); },
    rebuild(select) { const cs = store.get(select) || enhance(select); build(cs); return cs; },
  };

  document.addEventListener('DOMContentLoaded', () => window.CustomSelect.init(document));
}());
