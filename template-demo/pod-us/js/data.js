/* CASELAB® — product data + shared render helpers (Unsplash images verified 200) */

/* Slot-sized image URL. webp + auto format keeps card art ~40 KB instead of ~90 KB. */
const U = (id, w) => `https://images.unsplash.com/${id}?w=${w || 700}&q=75&auto=format&fm=webp&fit=crop`;

/* Card art is shown at ~168 px (mobile, 2 cols) and ~300 px (desktop grid) — 400/700 covers both at DPR 2. */
const cardSrcset = (id) => `${U(id, 400)} 400w, ${U(id, 700)} 700w`;
const CARD_SIZES = '(max-width: 640px) 45vw, 300px';
const imgUrl = (p, w) => U(p.imgId, w);
const backUrl = (p, w) => U(p.backId, w);

/* stock[] is aligned index-for-index with devices[] — real per-variant counts, no invented scarcity. */
const PRODUCTS = [
  { id: 'ghost-clear', name: 'Ghost Clear MagSafe Case', price: 24.95, compare: 34.95, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15', 'iphone-14', 'iphone-13'], magsafe: true,
    stock: [7, 38, 52, 24, 0], sold24: 41,
    imgId: 'photo-1771142061210-95e97225641e', backId: 'photo-1605000977407-2771f2f8e908',
    badge: 'sale', rating: 4.9, reviews: 612,
    desc: 'Crystal-clear, UV-shielded and drop-tested from 10 ft. Full-strength MagSafe snap with zero bulk — and it never turns yellow. Guaranteed.' },
  { id: 'midnight-monogram', name: 'Midnight Monogram Case', price: 29.95, compare: 39.95, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [19, 46, 61], sold24: 23,
    imgId: 'photo-1688378707062-9a56a951d28d', backId: 'photo-1625102216615-3a61ee26e4db',
    badge: 'drop', rating: 4.8, reviews: 341,
    desc: 'Matte-black armor with a tonal monogram grid. Grippy micro-texture, MagSafe ring, 10 ft drop rating.' },
  { id: 'neon-grid', name: 'Neon Grid MagSafe Case', price: 34.95, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16'], magsafe: true,
    stock: [5, 31], sold24: 18,
    imgId: 'photo-1577954732026-2071521acdfb', backId: 'photo-1581003989504-3e6ba26df4a2',
    badge: 'drop', rating: 4.9, reviews: 198,
    desc: 'An electric grid print that glows against any outfit. Military-grade corners, raised camera bezel.' },
  { id: 'cloud-marble', name: 'Cloud Marble Clear Case', price: 27.95, compare: 34.95, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [44, 58, 37], sold24: 12,
    imgId: 'photo-1771142061212-71a82269ecb1', backId: 'photo-1697008230028-bce2fce98dfe',
    badge: 'sale', rating: 4.7, reviews: 486,
    desc: 'Soft marble swirls over never-yellow clear TPU. Slim profile, wireless-charging friendly.' },
  { id: 'retro-sunset', name: 'Retro Sunset Impact Case', price: 29.95, compare: null, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14', 'iphone-13'], magsafe: false,
    stock: [26, 41, 33, 12], sold24: 9,
    imgId: 'photo-1581003989504-3e6ba26df4a2', backId: 'photo-1576107324820-c10884700b6b',
    badge: null, rating: 4.8, reviews: 273,
    desc: 'Gradient sunset stripes with shock-absorbing Air-Core corners. Tested onto concrete so you never have to.' },
  { id: 'graphite-wave', name: 'Graphite Wave Tough Case', price: 32.95, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [9, 35, 48], sold24: 27,
    imgId: 'photo-1625102216615-3a61ee26e4db', backId: 'photo-1625102217544-a096a17018f7',
    badge: null, rating: 4.9, reviews: 529,
    desc: 'Dual-layer graphite shell over impact foam. MIL-STD-810G certified, weighs just 1.2 oz.' },
  { id: 'concrete-minimal', name: 'Concrete Minimal Case', price: 26.95, compare: null, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [51, 62, 40], sold24: 6,
    imgId: 'photo-1711033312367-247626a984d1', backId: 'photo-1592320402243-605cc3e935f7',
    badge: null, rating: 4.6, reviews: 158,
    desc: 'Raw concrete texture, zero branding. For people who think the iPhone is already the design.' },
  { id: 'off-grid', name: 'Off-Grid Tough Case', price: 36.95, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16'], magsafe: true,
    stock: [14, 29], sold24: 11,
    imgId: 'photo-1592320402243-605cc3e935f7', backId: 'photo-1620786963525-4a74f1697a46',
    badge: null, rating: 4.8, reviews: 204,
    desc: 'Built for trailheads and subway platforms alike. 12 ft drop rating, lanyard anchor, MagSafe array.' },
  { id: 'chrome-dusk', name: 'Chrome Dusk Case', price: 31.95, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [8, 22, 39], sold24: 15,
    imgId: 'photo-1625102217544-a096a17018f7', backId: 'photo-1780307183016-9f6b9927c803',
    badge: 'drop', rating: 4.7, reviews: 96,
    desc: 'Smoked chrome finish that shifts with the light. Fingerprint-resistant coating, raised bezels.' },
  { id: 'golden-hour-airpods', name: 'Golden Hour AirPods Pro Case', price: 19.95, compare: 24.95, cat: 'airpods',
    devices: ['airpods-pro'], magsafe: false,
    stock: [33], sold24: 14,
    imgId: 'photo-1600375104627-c94c416deefa', backId: 'photo-1605464315542-bda3e2f4e605',
    badge: 'drop', rating: 4.9, reviews: 322,
    desc: 'Warm gradient shell with a locking carabiner — so your AirPods stay on your bag, not in a storm drain.' },
  { id: 'lime-static', name: 'Lime Static AirPods Case', price: 17.95, compare: null, cat: 'airpods',
    devices: ['airpods-pro', 'airpods-4'], magsafe: false,
    stock: [47, 21], sold24: 8,
    imgId: 'photo-1615281612781-4b972bd4e3fe', backId: 'photo-1610438235354-a6ae5528385c',
    badge: null, rating: 4.7, reviews: 187,
    desc: 'Electric lime silicone with static-grid deboss. Includes keychain clip, wireless-charging ready.' },
  { id: 'wildfire-airpods', name: 'Wildfire AirPods 4 Case', price: 16.95, compare: null, cat: 'airpods',
    devices: ['airpods-4'], magsafe: false,
    stock: [0], sold24: 0,
    imgId: 'photo-1610438235354-a6ae5528385c', backId: 'photo-1615281612781-4b972bd4e3fe',
    badge: null, rating: 4.6, reviews: 141,
    desc: 'Flame-print shock shell for AirPods 4. Drop-tested, clip included, fits in the smallest pocket.' },
];

/* Add-on SKUs. Sold as cart cross-sells and PDP bundles only — kept out of the 12-product catalogue. */
const ACCESSORIES = [
  { id: 'carabiner-clip', name: 'Anodized Carabiner Clip', price: 9.95, compare: null, cat: 'accessory', accessory: true,
    devices: [], magsafe: false, stock: [120], sold24: 5,
    imgId: 'photo-1541690090176-17d35a190b6c', backId: 'photo-1557685888-68043f4d680f',
    badge: null, rating: 4.8, reviews: 76,
    desc: 'Aircraft-aluminium clip that locks any CASELAB AirPods case to a bag, belt loop or keyring.' },
  /* Bundles are priced against the pair's compare-at total, so the saving on the button is the
     saving in the cart — a discount that only appears at checkout reads as a bait-and-switch. */
  { id: 'ghost-clear-2pk', name: 'Ghost Clear 2-Pack', price: 42.42, compare: 49.90, cat: 'bundle', accessory: true,
    devices: [], magsafe: true, stock: [40], sold24: 7,
    imgId: 'photo-1771142061210-95e97225641e', backId: 'photo-1697008230028-bce2fce98dfe',
    badge: null, rating: 4.9, reviews: 612,
    desc: 'Two Ghost Clear cases, 15% off the pair — and straight past the free-shipping threshold.' },
  { id: 'duo-pack', name: 'The Duo — Ghost Clear + Golden Hour', price: 44.90, compare: 59.90, cat: 'bundle', accessory: true,
    devices: [], magsafe: true, stock: [28], sold24: 9,
    imgId: 'photo-1697008230028-bce2fce98dfe', backId: 'photo-1600375104627-c94c416deefa',
    badge: null, rating: 4.9, reviews: 934,
    desc: 'One iPhone case, one AirPods Pro case, matching finish — 25% off buying them apart.' },
];

const ALL_ITEMS = PRODUCTS.concat(ACCESSORIES);

const NEW_DROP_IDS = ['midnight-monogram', 'neon-grid', 'chrome-dusk', 'golden-hour-airpods'];
const BEST_SELLER_IDS = ['ghost-clear', 'graphite-wave', 'cloud-marble', 'retro-sunset',
  'concrete-minimal', 'off-grid', 'lime-static', 'wildfire-airpods'];

const DEVICE_LABELS = {
  'iphone-17': 'iPhone 17', 'iphone-16': 'iPhone 16', 'iphone-15': 'iPhone 15',
  'iphone-14': 'iPhone 14', 'iphone-13': 'iPhone 13',
  'airpods-pro': 'AirPods Pro', 'airpods-4': 'AirPods 4',
};

const money = (n) => `$${n.toFixed(2)}`;
const savePct = (p) => p.compare ? Math.floor((1 - p.price / p.compare) * 100) : 0;
const findProduct = (id) => ALL_ITEMS.find((p) => p.id === id);

/* ---------- stock helpers (drive every scarcity string on the site) ---------- */
const LOW_STOCK_AT = 10;

const stockFor = (p, device) => {
  const i = p.devices.indexOf(device);
  return i === -1 ? null : p.stock[i];
};
const totalStock = (p) => p.stock.reduce((n, s) => n + s, 0);

/* Scarcest variant still in stock — the one worth naming on a card. */
function scarcestVariant(p) {
  let best = null;
  p.devices.forEach((d, i) => {
    if (p.stock[i] > 0 && (!best || p.stock[i] < best.left)) best = { device: d, left: p.stock[i] };
  });
  return best;
}

function stockNoteHTML(p) {
  if (!totalStock(p)) return '<p class="p-card__stock p-card__stock--out">Sold out — Notify me</p>';
  const v = scarcestVariant(p);
  if (!v || v.left > LOW_STOCK_AT) return '';
  return `<p class="p-card__stock">Only ${v.left} left in ${DEVICE_LABELS[v.device]}</p>`;
}

/* "Fits iPhone 17 – iPhone 13" — answers the collection page's #1 question without a page load. */
/* Alt text that reads like a caption: product + the device it's shown fitting. */
function cardAlt(p) {
  const device = p.devices.length ? DEVICE_LABELS[p.devices[0]] : null;
  return device ? `${p.name} for ${device}` : p.name;
}

function fitsLabel(p) {
  if (!p.devices.length) return 'Fits any CASELAB case';
  const first = DEVICE_LABELS[p.devices[0]];
  const last = DEVICE_LABELS[p.devices[p.devices.length - 1]];
  return p.devices.length === 1 ? `Fits ${first}` : `Fits ${first} – ${last}`;
}

const ICON_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
const ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
const ICON_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';

function starsHTML(count) {
  return `<span class="stars" aria-hidden="true">${ICON_STAR.repeat(count || 5)}</span>`;
}

function badgeHTML(p) {
  if (p.badge === 'drop') return '<span class="badge badge--drop p-card__badge">New Drop</span>';
  if (p.badge === 'sale') return `<span class="badge badge--sale p-card__badge">Save ${savePct(p)}%</span>`;
  return '';
}

function priceHTML(p) {
  const was = p.compare ? ` <s>${money(p.compare)}</s>` : '';
  return `<span class="price">${money(p.price)}${was}</span>`;
}

function cardHTML(p, i) {
  const out = !totalStock(p);
  const saved = window.isSaved && window.isSaved(p.id);
  return `
  <article class="p-card reveal${out ? ' p-card--out' : ''}" style="--d:${(i % 4) * 70}ms" data-id="${p.id}">
    <div class="p-card__media">
      <img src="${imgUrl(p, 700)}" srcset="${cardSrcset(p.imgId)}" sizes="${CARD_SIZES}" alt="${cardAlt(p)}" loading="lazy" width="600" height="750">
      <img src="${backUrl(p, 400)}" alt="" loading="lazy" width="600" height="750" class="p-card__back" aria-hidden="true">
      <a class="p-card__link" href="product.html?id=${p.id}" aria-label="${p.name} — ${money(p.price)}"></a>
      ${badgeHTML(p)}
      <button class="icon-btn p-card__save${saved ? ' is-saved' : ''}" type="button" data-save="${p.id}"
        aria-pressed="${saved ? 'true' : 'false'}" aria-label="Save ${p.name}">${ICON_HEART}</button>
      <button class="p-card__qv" type="button" data-qv="${p.id}">Quick View</button>
    </div>
    <div class="p-card__info">
      <h3 class="p-card__name">${p.name}</h3>
      <p class="p-card__fits mono-label">${fitsLabel(p)}</p>
      <div class="p-card__stars">${starsHTML(5)}<span>${p.rating} (${p.reviews})</span></div>
      ${stockNoteHTML(p)}
      <div class="p-card__row">
        ${priceHTML(p)}
        <button class="p-card__add" type="button" data-add="${p.id}" data-pick="1"${out ? ' disabled' : ''}
          aria-label="${out ? `Notify me when ${p.name} is back` : `Add ${p.name} to cart`}">${out ? 'Notify me' : `${ICON_PLUS}<span>Add</span>`}</button>
      </div>
    </div>
  </article>`;
}

function renderGrid(el, products) {
  if (!el) return;
  el.innerHTML = products.length
    ? products.map(cardHTML).join('')
    : '<p class="grid-empty">No matches. Try another filter — or search "clear".</p>';
  if (window.observeReveals) window.observeReveals(el);
}
