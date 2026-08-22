/* CASELAB® Halloween — collection filters, sort, and the sticky condensed filter bar. Depends on data.js */

/* Setting .value in JS fires no `change`, so the custom listbox needs a nudge to repaint. */
function syncSelect(el) {
  if (window.CustomSelect) window.CustomSelect.sync(el);
}

/* ---------- collection page: pills + filters + sort + search ---------- */
const collectionState = { device: 'all', type: 'all', price: 'all', magsafe: false, sort: 'featured', q: '' };

function applyCollectionFilters() {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;
  let list = PRODUCTS.slice();
  const st = collectionState;
  if (st.device !== 'all') list = list.filter((p) => p.devices.includes(st.device));
  if (st.type !== 'all') list = list.filter((p) => p.cat === st.type);
  if (st.price === 'under15') list = list.filter((p) => p.price < 15);
  if (st.price === '15to18') list = list.filter((p) => p.price >= 15 && p.price <= 18);
  if (st.price === 'over18') list = list.filter((p) => p.price > 18);
  if (st.magsafe) list = list.filter((p) => p.magsafe);
  if (st.q) list = list.filter((p) => (p.name + ' ' + p.desc).toLowerCase().includes(st.q.toLowerCase()));
  if (st.sort === 'newest') list = NEW_DROP_IDS.map(findProduct).concat(list.filter((p) => !NEW_DROP_IDS.includes(p.id)))
    .filter((p, i, a) => a.indexOf(p) === i && list.includes(p));
  if (st.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (st.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  renderGrid(grid, list);
  const count = document.getElementById('gridCount');
  if (count) count.textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
  syncFilterBar();
}

function initCollection() {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  if (params.get('device')) collectionState.device = params.get('device');
  if (params.get('type')) collectionState.type = params.get('type');
  if (params.get('q')) {
    collectionState.q = params.get('q');
    const input = document.querySelector('#searchForm input');
    const form = document.getElementById('searchForm');
    if (input && form) { input.value = collectionState.q; form.classList.add('open'); }
  }

  const pills = Array.from(document.querySelectorAll('.pills .pill'));
  pills.forEach((pill, idx) => {
    if (pill.dataset.device === collectionState.device) {
      pills.forEach((p) => p.setAttribute('aria-pressed', 'false'));
      pill.setAttribute('aria-pressed', 'true');
    }
    pill.addEventListener('click', () => {
      pills.forEach((p) => { p.setAttribute('aria-pressed', 'false'); p.tabIndex = -1; });
      pill.setAttribute('aria-pressed', 'true');
      pill.tabIndex = 0;
      collectionState.device = pill.dataset.device;
      applyCollectionFilters();
    });
    // roving tabindex
    pill.tabIndex = pill.getAttribute('aria-pressed') === 'true' ? 0 : -1;
    pill.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = pills[(idx + 1) % pills.length];
      if (e.key === 'ArrowLeft') next = pills[(idx - 1 + pills.length) % pills.length];
      if (next) { e.preventDefault(); next.focus(); }
    });
  });
  if (!pills.some((p) => p.getAttribute('aria-pressed') === 'true') && pills[0]) pills[0].tabIndex = 0;

  const bind = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      collectionState[key] = el.type === 'checkbox' ? el.checked : el.value;
      applyCollectionFilters();
    });
  };
  bind('filterType', 'type');
  bind('filterPrice', 'price');
  bind('filterMagsafe', 'magsafe');
  bind('sortSelect', 'sort');

  const searchInput = document.querySelector('#searchForm input');
  if (searchInput) searchInput.addEventListener('input', () => {
    collectionState.q = searchInput.value.trim();
    applyCollectionFilters();
  });

  applyCollectionFilters();
  initFilterBar();
}

/* ---------- #12: condensed filter bar that sticks once the toolbar scrolls away ---------- */
/* The collection runs 4+ screens. Filters you can only reach by scrolling back to the top get used
   once and then abandoned, so keep a one-line version in reach the whole way down. */
function activeFilterCount() {
  const st = collectionState;
  return ['device', 'type', 'price'].filter((k) => st[k] !== 'all').length
    + (st.magsafe ? 1 : 0) + (st.q ? 1 : 0);
}

function syncFilterBar() {
  const bar = document.getElementById('filterBar');
  if (!bar) return;
  const n = activeFilterCount();
  const btn = document.getElementById('filterBarToggle');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>Filters${n ? ` (${n})` : ''}`;
  btn.classList.toggle('is-active', n > 0);
  const mirror = document.getElementById('filterBarSort');
  if (mirror) { mirror.value = collectionState.sort; syncSelect(mirror); }
  const count = document.getElementById('filterBarCount');
  const live = document.getElementById('gridCount');
  if (count && live) count.textContent = live.textContent;
}

function initFilterBar() {
  const bar = document.getElementById('filterBar');
  const toolbar = document.querySelector('.toolbar');
  if (!bar || !toolbar) return;

  document.getElementById('filterBarToggle').addEventListener('click', () => {
    toolbar.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
    toolbar.classList.add('toolbar--flash');
    setTimeout(() => toolbar.classList.remove('toolbar--flash'), 1200);
  });

  const mirror = document.getElementById('filterBarSort');
  mirror.addEventListener('change', () => {
    collectionState.sort = mirror.value;
    const main = document.getElementById('sortSelect');
    if (main) { main.value = mirror.value; syncSelect(main); }
    applyCollectionFilters();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { bar.hidden = en.isIntersecting; }, { rootMargin: '-72px 0px 0px 0px' })
      .observe(toolbar);
  } else {
    bar.hidden = false;
  }
  syncFilterBar();
}

document.addEventListener('DOMContentLoaded', initCollection);
