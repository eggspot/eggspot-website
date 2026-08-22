/* CASELAB® Holiday — custom select. One component, every dropdown on the site.

   The native <select> stays in the DOM as the source of truth: it keeps `.value`,
   `.selectedIndex` and the `change` event working, so collection.js and product-page.js
   read it exactly as before. Only its presentation is swapped — it is taken out of the
   tab order and the a11y tree, and a button + role="listbox" panel drive it instead.

   Markup contract: <select data-custom-select> anywhere. A <label for> pointing at it is
   re-pointed at the button so clicking the label still opens the list.

   Programmatic writes (`sel.value = 'newest'`) do not fire `change`, so anything that sets
   a value in code must call CustomSelect.refresh(sel) afterwards. */

const CS_CHEVRON = '<svg class="cselect__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

let csSeq = 0;
const csRegistry = new WeakMap();

function csInitOne(select) {
  if (csRegistry.has(select)) return csRegistry.get(select);

  const uid = `cs${++csSeq}`;
  const wrap = document.createElement('div');
  wrap.className = 'cselect';
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add('cselect__native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cselect__btn';
  btn.id = `${uid}-btn`;
  btn.setAttribute('role', 'combobox');
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', `${uid}-list`);
  btn.innerHTML = `<span class="cselect__value"></span>${CS_CHEVRON}`;

  const list = document.createElement('ul');
  list.className = 'cselect__panel';
  list.id = `${uid}-list`;
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  /* Re-point the visible label at the button — the native select can no longer receive it. */
  const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;
  if (label) {
    label.setAttribute('for', btn.id);
    btn.setAttribute('aria-label', label.textContent.trim());
    list.setAttribute('aria-label', label.textContent.trim());
  }

  wrap.append(btn, list);

  const opts = Array.from(select.options).map((opt, i) => {
    const li = document.createElement('li');
    li.className = 'cselect__opt';
    li.id = `${uid}-opt${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.textContent = opt.text;
    if (opt.disabled) li.setAttribute('aria-disabled', 'true');
    list.appendChild(li);
    return li;
  });

  const api = { select, wrap, btn, list, opts, active: select.selectedIndex, open: false };
  csRegistry.set(select, api);

  const paint = () => {
    const i = select.selectedIndex;
    btn.querySelector('.cselect__value').textContent = i > -1 ? select.options[i].text : '';
    opts.forEach((li, n) => {
      li.setAttribute('aria-selected', String(n === i));
      li.classList.toggle('is-active', n === api.active);
    });
  };

  const setActive = (n) => {
    if (n < 0 || n >= opts.length) return;
    api.active = n;
    opts.forEach((li, k) => li.classList.toggle('is-active', k === n));
    btn.setAttribute('aria-activedescendant', opts[n].id);
    opts[n].scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    if (api.open || select.disabled) return;
    csCloseAll();
    api.open = true;
    list.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    /* Flip above the button when the list would run off the bottom of the viewport. */
    const room = window.innerHeight - btn.getBoundingClientRect().bottom;
    wrap.classList.toggle('cselect--up', room < Math.min(list.scrollHeight + 16, 280));
    setActive(select.selectedIndex > -1 ? select.selectedIndex : 0);
  };

  const close = (refocus) => {
    if (!api.open) return;
    api.open = false;
    list.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.removeAttribute('aria-activedescendant');
    wrap.classList.remove('cselect--up');
    if (refocus) btn.focus();
  };

  const commit = (n) => {
    if (n < 0 || n >= opts.length || select.options[n].disabled) return;
    if (select.selectedIndex !== n) {
      select.selectedIndex = n;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    paint();
    close(true);
  };

  api.paint = paint;
  api.close = close;

  btn.addEventListener('click', () => (api.open ? close(true) : open()));

  btn.addEventListener('keydown', (e) => {
    const last = opts.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); api.open ? setActive(Math.min(api.active + 1, last)) : open(); break;
      case 'ArrowUp': e.preventDefault(); api.open ? setActive(Math.max(api.active - 1, 0)) : open(); break;
      case 'Home': if (api.open) { e.preventDefault(); setActive(0); } break;
      case 'End': if (api.open) { e.preventDefault(); setActive(last); } break;
      case 'Enter': case ' ': e.preventDefault(); api.open ? commit(api.active) : open(); break;
      case 'Escape': if (api.open) { e.preventDefault(); close(true); } break;
      case 'Tab': close(false); break;
      default:
        /* Type-ahead: jump to the first option starting with the typed letter. */
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const from = (api.active + 1) % opts.length;
          const order = opts.map((_, i) => (from + i) % opts.length);
          const hit = order.find((i) => opts[i].textContent.toLowerCase().startsWith(e.key.toLowerCase()));
          if (hit !== undefined) { if (!api.open) open(); setActive(hit); }
        }
    }
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('.cselect__opt');
    if (li) commit(opts.indexOf(li));
  });
  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('.cselect__opt');
    if (li) setActive(opts.indexOf(li));
  });

  paint();
  return api;
}

const csOpenApis = () => Array.from(document.querySelectorAll('.cselect'))
  .map((w) => csRegistry.get(w.querySelector('.cselect__native')))
  .filter((a) => a && a.open);

function csCloseAll(except) {
  csOpenApis().forEach((a) => { if (a !== except) a.close(false); });
}

document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.cselect')) csCloseAll();
});

window.CustomSelect = {
  init(root) {
    (root || document).querySelectorAll('select[data-custom-select]').forEach(csInitOne);
  },
  /* Call after any programmatic `select.value = …`; native selects stay silent on those. */
  refresh(select) {
    const api = csRegistry.get(select);
    if (api) api.paint();
  },
};

document.addEventListener('DOMContentLoaded', () => window.CustomSelect.init());
