/* CASELAB® BFCM — Black Friday / Cyber Monday product data + shared render helpers.
   Every line is a sale line: `compare` is the pre-sale price and drives the strike-through
   and the SAVE %, so no saving is ever written by hand. (Unsplash images verified 200.) */

/* Slot-sized image URL. webp + auto format keeps card art ~40 KB instead of ~90 KB. */
const U = (id, w) => `https://images.unsplash.com/${id}?w=${w || 700}&q=75&auto=format&fm=webp&fit=crop`;

/* Card art is shown at ~168 px (mobile, 2 cols) and ~300 px (desktop grid) — 400/700 covers both at DPR 2. */
const cardSrcset = (id) => `${U(id, 400)} 400w, ${U(id, 700)} 700w`;
const CARD_SIZES = '(max-width: 640px) 45vw, 300px';
const imgUrl = (p, w) => U(p.imgId, w);
const backUrl = (p, w) => U(p.backId, w);

/* stock[] is aligned index-for-index with devices[] — real per-variant counts, no invented scarcity.
   compare[] is the pre-sale price: every BFCM line carries one, so the saving on the card is real. */
const PRODUCTS = [
  { id: 'ghost-clear', name: 'Black Friday Doorbuster Clear Case', price: 6.99, compare: 16.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15', 'iphone-14', 'iphone-13'], magsafe: true,
    stock: [6, 28, 44, 19, 0], sold24: 820,
    imgId: 'photo-1771142061210-95e97225641e', backId: 'photo-1605000977407-2771f2f8e908',
    badge: 'doorbuster', rating: 4.9, reviews: 612,
    desc: 'The doorbuster. Crystal-clear, UV-shielded, drop-tested from 10 ft, full-strength MagSafe — at the lowest price we have ever put on it. When the run is gone, the price goes back to $16.99.' },
  { id: 'mega-magsafe-bundle', name: 'Mega Deal: MagSafe Bundle', price: 19.99, compare: 34.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [9, 24, 31], sold24: 460,
    imgId: 'photo-1625102216615-3a61ee26e4db', backId: 'photo-1625102217544-a096a17018f7',
    badge: 'sale', rating: 4.8, reviews: 341,
    desc: 'Three MagSafe pieces in one box: the tough case, the snap-on grip stand, and a matching AirPods Pro shell. Bought apart it is $34.99.' },
  { id: 'gift-ready-set', name: 'Gift-Ready Case Set (2-Pack)', price: 24.99, compare: 39.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [12, 33, 40, 22], sold24: 310,
    imgId: 'photo-1513885535751-8b9238bd345a', backId: 'photo-1697008230028-bce2fce98dfe',
    badge: 'gift', rating: 4.9, reviews: 486,
    desc: 'Two cases, boxed and ready to hand over — free gift wrap and a blank card in every set. The easiest present on your list, sorted before December starts.' },
  { id: 'cyber-airpods-bundle', name: 'Cyber Monday: Phone + AirPods Bundle', price: 27.99, compare: 44.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [7, 18, 26], sold24: 275,
    imgId: 'photo-1512499617640-c74ae3a79d37', backId: 'photo-1600375104627-c94c416deefa',
    badge: 'cyber', rating: 4.9, reviews: 273,
    desc: 'Online-only pairing: one MagSafe iPhone case and one AirPods Pro case in a matching finish. Live for Cyber Monday, then it goes back in the vault.' },
  { id: 'cyber-week-mega', name: 'Cyber Week Mega Bundle (4 Items)', price: 39.99, compare: 59.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16'], magsafe: true,
    stock: [5, 14], sold24: 190,
    imgId: 'photo-1625102217544-a096a17018f7', backId: 'photo-1615281612781-4b972bd4e3fe',
    badge: 'cyber', rating: 4.9, reviews: 198,
    desc: 'The whole kit: iPhone case, AirPods case, MagSafe grip stand and an anodized carabiner clip. Our deepest bundle of the year, capped at the stock you see.' },
  { id: 'midnight-monogram', name: 'Midnight Monogram Armor Case', price: 14.99, compare: 29.95, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [8, 36, 52], sold24: 405,
    imgId: 'photo-1688378707062-9a56a951d28d', backId: 'photo-1625102216615-3a61ee26e4db',
    badge: 'sale', rating: 4.8, reviews: 341,
    desc: 'Matte-black armor with a tonal monogram grid. Grippy micro-texture, MagSafe ring, 10 ft drop rating — half price for the sale.' },
  { id: 'neon-grid', name: 'Blackout Grid MagSafe Case', price: 17.99, compare: 34.95, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16'], magsafe: true,
    stock: [4, 21], sold24: 288,
    imgId: 'photo-1577954732026-2071521acdfb', backId: 'photo-1581003989504-3e6ba26df4a2',
    badge: 'sale', rating: 4.9, reviews: 198,
    desc: 'A blacked-out grid print that only catches the light when you move. Military-grade corners, raised camera bezel.' },
  { id: 'cloud-marble', name: 'Doorbuster Cloud Marble Case', price: 9.99, compare: 24.99, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [10, 39, 28], sold24: 512,
    imgId: 'photo-1771142061212-71a82269ecb1', backId: 'photo-1697008230028-bce2fce98dfe',
    badge: 'doorbuster', rating: 4.7, reviews: 486,
    desc: 'Soft marble swirls over never-yellow clear TPU. Slim, wireless-charging friendly, and 60% off until the sale closes.' },
  { id: 'concrete-minimal', name: 'Flash Sale: Concrete Minimal Case', price: 8.49, compare: 16.99, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [3, 25, 33], sold24: 447,
    imgId: 'photo-1711033312367-247626a984d1', backId: 'photo-1592320402243-605cc3e935f7',
    badge: 'flash', rating: 4.6, reviews: 158,
    desc: 'Raw concrete texture, zero branding, half price. For people who think the iPhone is already the design.' },
  { id: 'golden-hour-airpods', name: 'Golden Hour AirPods Pro Case', price: 9.99, compare: 19.95, cat: 'airpods',
    devices: ['airpods-pro'], magsafe: false,
    stock: [16], sold24: 264,
    imgId: 'photo-1600375104627-c94c416deefa', backId: 'photo-1605464315542-bda3e2f4e605',
    badge: 'sale', rating: 4.9, reviews: 322,
    desc: 'Warm gradient shell with a locking carabiner — so your AirPods stay on your bag, not in a storm drain.' },
  { id: 'lime-static', name: 'Cyber Lime AirPods Case', price: 8.99, compare: 17.95, cat: 'airpods',
    devices: ['airpods-pro', 'airpods-4'], magsafe: false,
    stock: [9, 17], sold24: 229,
    imgId: 'photo-1615281612781-4b972bd4e3fe', backId: 'photo-1610438235354-a6ae5528385c',
    badge: 'cyber', rating: 4.7, reviews: 187,
    desc: 'Electric lime silicone with a static-grid deboss. Keychain clip included, wireless-charging ready.' },
  { id: 'wildfire-airpods', name: 'Wildfire AirPods 4 Case', price: 7.99, compare: 16.95, cat: 'airpods',
    devices: ['airpods-4'], magsafe: false,
    stock: [0], sold24: 0,
    imgId: 'photo-1610438235354-a6ae5528385c', backId: 'photo-1615281612781-4b972bd4e3fe',
    badge: 'sale', rating: 4.6, reviews: 141,
    desc: 'Flame-print shock shell for AirPods 4. Drop-tested, clip included — the first doorbuster of the sale to sell out.' },
];

/* Add-on SKUs. Sold as cart cross-sells and PDP bundles only — kept out of the 12-product catalogue. */
const ACCESSORIES = [
  { id: 'carabiner-clip', name: 'Anodized Carabiner Clip', price: 4.99, compare: 9.95, cat: 'accessory', accessory: true,
    devices: [], magsafe: false, stock: [120], sold24: 96,
    imgId: 'photo-1541690090176-17d35a190b6c', backId: 'photo-1557685888-68043f4d680f',
    badge: 'sale', rating: 4.8, reviews: 76,
    desc: 'Aircraft-aluminium clip that locks any CASELAB AirPods case to a bag, belt loop or keyring.' },
  /* Bundles are priced against the pair's compare-at total, so the saving on the button is the
     saving in the cart — a discount that only appears at checkout reads as a bait-and-switch. */
  { id: 'ghost-clear-2pk', name: 'Doorbuster Clear 2-Pack', price: 11.99, compare: 33.98, cat: 'bundle', accessory: true,
    devices: [], magsafe: true, stock: [40], sold24: 143,
    imgId: 'photo-1771142061210-95e97225641e', backId: 'photo-1697008230028-bce2fce98dfe',
    badge: 'doorbuster', rating: 4.9, reviews: 612,
    desc: 'Two doorbuster cases for under twelve dollars — one for you, one wrapped. Ships in the same box.' },
  { id: 'duo-pack', name: 'The Duo — Doorbuster + Golden Hour', price: 14.99, compare: 26.98, cat: 'bundle', accessory: true,
    devices: [], magsafe: true, stock: [28], sold24: 87,
    imgId: 'photo-1697008230028-bce2fce98dfe', backId: 'photo-1600375104627-c94c416deefa',
    badge: 'gift', rating: 4.9, reviews: 934,
    desc: 'One iPhone case, one AirPods Pro case, matching finish — and gift wrap thrown in for the season.' },
];

const ALL_ITEMS = PRODUCTS.concat(ACCESSORIES);

/* The four headline doorbusters — the deal grid on the homepage and the "Doorbusters" sort. */
const DOORBUSTER_IDS = ['ghost-clear', 'cloud-marble', 'concrete-minimal', 'mega-magsafe-bundle'];
const BEST_SELLER_IDS = ['gift-ready-set', 'cyber-airpods-bundle', 'cyber-week-mega', 'midnight-monogram',
  'neon-grid', 'golden-hour-airpods', 'lime-static', 'wildfire-airpods'];

const DEVICE_LABELS = {
  'iphone-17': 'iPhone 17', 'iphone-16': 'iPhone 16', 'iphone-15': 'iPhone 15',
  'iphone-14': 'iPhone 14', 'iphone-13': 'iPhone 13',
  'airpods-pro': 'AirPods Pro', 'airpods-4': 'AirPods 4',
};

const money = (n) => `$${n.toFixed(2)}`;
const savePct = (p) => p.compare ? Math.floor((1 - p.price / p.compare) * 100) : 0;
const findProduct = (id) => ALL_ITEMS.find((p) => p.id === id);

/* Sitewide 24-hour order count, summed from the catalogue rather than typed into the copy —
   the same rule as every scarcity string here: change the data, the claim follows. */
const ordersLast24 = () => PRODUCTS.reduce((n, p) => n + p.sold24, 0);
const SALE_ENDS_LABEL = 'Nov 30, 11:59 PM PT';

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

/* Red = the deal is the price. Gold = the deal is the occasion. Black = online-only / gift. */
const BADGE_LABELS = {
  doorbuster: ['badge--drop', 'Doorbuster'],
  flash: ['badge--drop', 'Flash Deal'],
  sale: ['badge--sale', 'Deal'],
  gift: ['badge--sale', 'Gift Deal'],
  cyber: ['badge--dark', 'Cyber Deal'],
};

/* Doorbusters wear the black-plate card treatment wherever they land. */
const DOORBUSTER_BADGES = ['doorbuster', 'flash'];

function badgeHTML(p) {
  const b = BADGE_LABELS[p.badge];
  return b ? `<span class="badge ${b[0]}">${b[1]}</span>` : '';
}

/* A second badge, only when the scarcest live variant is genuinely into the last ten units. */
function lowStockBadgeHTML(p) {
  if (!totalStock(p)) return '';
  const v = scarcestVariant(p);
  if (!v || v.left > LOW_STOCK_AT) return '';
  return '<span class="badge badge--stock"><span class="dot" aria-hidden="true"></span>Low Stock</span>';
}

function badgeStackHTML(p) {
  const html = badgeHTML(p) + lowStockBadgeHTML(p);
  return html ? `<div class="p-card__badges">${html}</div>` : '';
}

/* Sale price, the price it is cut from, and the saving — the three numbers a BFCM shopper
   compares. Rendering them together stops the strike-through reading as a typo. */
function priceHTML(p) {
  if (!p.compare) return `<span class="price">${money(p.price)}</span>`;
  return `<span class="price">${money(p.price)} <s>${money(p.compare)}</s>`
    + `<span class="price__save">Save ${savePct(p)}%</span></span>`;
}

function cardHTML(p, i) {
  const out = !totalStock(p);
  const saved = window.isSaved && window.isSaved(p.id);
  return `
  <article class="p-card reveal${out ? ' p-card--out' : ''}${DOORBUSTER_BADGES.includes(p.badge) ? ' p-card--doorbuster' : ''}" style="--d:${(i % 4) * 70}ms" data-id="${p.id}">
    <div class="p-card__media">
      <img src="${imgUrl(p, 700)}" srcset="${cardSrcset(p.imgId)}" sizes="${CARD_SIZES}" alt="${cardAlt(p)}" loading="lazy" width="600" height="750">
      <img src="${backUrl(p, 400)}" alt="" loading="lazy" width="600" height="750" class="p-card__back" aria-hidden="true">
      <a class="p-card__link" href="product.html?id=${p.id}" aria-label="${p.name} — ${money(p.price)}"></a>
      ${badgeStackHTML(p)}
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
