/* CASELAB® Halloween — product data + shared render helpers (Unsplash images verified 200) */

/* Slot-sized image URL. webp + auto format keeps card art ~40 KB instead of ~90 KB. */
const U = (id, w) => `https://images.unsplash.com/${id}?w=${w || 700}&q=75&auto=format&fm=webp&fit=crop`;

/* Card art is shown at ~168 px (mobile, 2 cols) and ~300 px (desktop grid) — 400/700 covers both at DPR 2. */
const cardSrcset = (id) => `${U(id, 400)} 400w, ${U(id, 700)} 700w`;
const CARD_SIZES = '(max-width: 640px) 45vw, 300px';
const imgUrl = (p, w) => U(p.imgId, w);
const backUrl = (p, w) => U(p.backId, w);

/* stock[] is aligned index-for-index with devices[] — real per-variant counts, no invented scarcity. */
const PRODUCTS = [
  { id: 'spooky-season', name: '"Spooky Season" Phone Case', price: 16.99, compare: 22.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15', 'iphone-14', 'iphone-13'], magsafe: true,
    stock: [9, 41, 55, 26, 0], sold24: 63,
    imgId: 'photo-1633628569245-1a939e025ebb', backId: 'photo-1602814736315-13fe19927459',
    badge: 'sale', rating: 4.9, reviews: 741,
    desc: 'Carved-lantern orange on matte black, printed edge to edge. Drop-tested from 10 ft, full-strength MagSafe snap, and the print will not fade by November.' },
  { id: 'glow-ghost', name: '"Glow-in-the-Dark Ghost" Case', price: 18.99, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [6, 29, 44], sold24: 38,
    imgId: 'photo-1698347188591-ee0181b4cc1d', backId: 'photo-1698347108462-9b7611c2afe2',
    badge: 'drop', rating: 4.9, reviews: 412,
    desc: 'Charge it under any lamp for five minutes and the ghosts glow green for hours. Military-grade corners, raised camera bezel, zero bulk.' },
  { id: 'jack-o-lantern-airpods', name: '"Jack-O\'-Lantern" AirPods Case', price: 14.99, compare: null, cat: 'airpods',
    devices: ['airpods-pro', 'airpods-4'], magsafe: false,
    stock: [31, 18], sold24: 22,
    imgId: 'photo-1604327006476-babcde5fd133', backId: 'photo-1665984867752-6370ab5ae35e',
    badge: null, rating: 4.8, reviews: 296,
    desc: 'A grinning lantern face on shock-absorbing silicone, with a locking carabiner so your AirPods survive the whole party.' },
  { id: 'pumpkin-spice', name: '"Pumpkin Spice" Case', price: 15.99, compare: 19.99, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [47, 60, 35], sold24: 17,
    imgId: 'photo-1569383893830-b73dc4a03af0', backId: 'photo-1608722019171-8edb166013b7',
    badge: 'sale', rating: 4.7, reviews: 508,
    desc: 'Warm latte-and-cinnamon gradient over never-yellow clear TPU. Slim profile, wireless-charging friendly, autumn on your phone until it snows.' },
  { id: 'bat-wing', name: '"Bat Wing" MagSafe Case', price: 19.99, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16'], magsafe: true,
    stock: [4, 27], sold24: 29,
    imgId: 'photo-1731751505310-58c9746d50d8', backId: 'photo-1528041251223-bd0f58bb7b94',
    badge: 'drop', rating: 4.9, reviews: 187,
    desc: 'A colony of bats scattered across midnight black, with a 16-magnet N52 array underneath. Grippy micro-texture, 10 ft drop rating.' },
  { id: 'mummy-wrap', name: '"Mummy Wrap" Case', price: 16.99, compare: null, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14', 'iphone-13'], magsafe: false,
    stock: [28, 44, 31, 10], sold24: 11,
    imgId: 'photo-1761575280787-b0d89c835c4b', backId: 'photo-1760843523516-680abf4ff106',
    badge: null, rating: 4.7, reviews: 233,
    desc: 'Bandage-texture deboss with two googly eyes peeking through. Air-Core corners tested onto concrete so you never have to.' },
  { id: 'witchy-vibes', name: '"Witchy Vibes" Case', price: 17.99, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [12, 33, 41], sold24: 25,
    imgId: 'photo-1762647439275-2ee288ad64ee', backId: 'photo-1712633534452-656b1379ca2b',
    badge: 'drop', rating: 4.8, reviews: 164,
    desc: 'Pointed hats, crescent moons and a little bit of purple, drawn in-house. MagSafe ring, raised bezels, retired when the run sells out.' },
  { id: 'skull-bones', name: '"Skull & Bones" Rugged Case', price: 19.99, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16'], magsafe: true,
    stock: [15, 30], sold24: 14,
    imgId: 'photo-1765062890071-16e266eae7aa', backId: 'photo-1762886457756-e215f297a052',
    badge: null, rating: 4.9, reviews: 342,
    desc: 'Dual-layer shell over impact foam with an x-ray bone print. MIL-STD-810G certified to 12 ft, and it weighs just 1.4 oz.' },
  { id: 'black-cat', name: '"Black Cat" Clear Case', price: 17.99, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [8, 24, 37], sold24: 19,
    imgId: 'photo-1730326936991-3592547b7d26', backId: 'photo-1603739355965-e4106f83fe64',
    badge: null, rating: 4.8, reviews: 275,
    desc: 'One very unlucky cat, silhouetted on UV-shielded clear TPU. Stays crystal clear behind the print — guaranteed never to yellow.' },
  { id: 'cobweb-clear', name: '"Cobweb" Clear Case', price: 16.99, compare: null, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [52, 63, 40], sold24: 8,
    imgId: 'photo-1601076273689-47f97c4fc416', backId: 'photo-1632407445732-dfca943a103e',
    badge: null, rating: 4.6, reviews: 148,
    desc: 'A single fine web spun corner to corner, printed under the surface so it never rubs off. Slim, clear, quietly creepy.' },
  { id: 'trick-or-treat-airpods', name: '"Trick-or-Treat" AirPods Case', price: 13.99, compare: null, cat: 'airpods',
    devices: ['airpods-pro', 'airpods-4'], magsafe: false,
    stock: [38, 22], sold24: 16,
    imgId: 'photo-1571404342535-34518103d8cc', backId: 'photo-1708528182738-28601672f14c',
    badge: 'drop', rating: 4.8, reviews: 201,
    desc: 'Candy-stripe silicone with a keychain clip — small enough to ride a trick-or-treat bucket, tough enough to survive it.' },
  { id: 'boo-crew-airpods', name: '"Boo Crew" AirPods 4 Case', price: 15.99, compare: null, cat: 'airpods',
    devices: ['airpods-4'], magsafe: false,
    stock: [0], sold24: 0,
    imgId: 'photo-1631926035582-c1fb67610f24', backId: 'photo-1633380170808-9404cd630e82',
    badge: null, rating: 4.7, reviews: 129,
    desc: 'A crowd of tiny sheet ghosts on a glow shell for AirPods 4. Drop-tested, clip included, fits in the smallest costume pocket.' },
];

/* Add-on SKUs. Sold as cart cross-sells and PDP bundles only — kept out of the 12-product catalogue. */
const ACCESSORIES = [
  { id: 'bat-carabiner', name: 'Bat Wing Carabiner Clip', price: 8.99, compare: null, cat: 'accessory', accessory: true,
    devices: [], magsafe: false, stock: [120], sold24: 6,
    imgId: 'photo-1697665993126-31d7a048d08b', backId: 'photo-1697547098891-6df4b0b200f4',
    badge: null, rating: 4.8, reviews: 84,
    desc: 'Aircraft-aluminium bat-wing clip that locks any CASELAB AirPods case to a bag, belt loop or candy bucket.' },
  /* Bundles are priced against the pair's compare-at total, so the saving on the button is the
     saving in the cart — a discount that only appears at checkout reads as a bait-and-switch. */
  { id: 'spooky-season-2pk', name: 'Spooky Season 2-Pack', price: 28.88, compare: 33.98, cat: 'bundle', accessory: true,
    devices: [], magsafe: true, stock: [40], sold24: 9,
    imgId: 'photo-1633628569245-1a939e025ebb', backId: 'photo-1642750704489-4b597e79c65a',
    badge: null, rating: 4.9, reviews: 741,
    desc: 'Two Spooky Season cases, 15% off the pair — and straight past the free-shipping threshold.' },
  { id: 'haunted-duo', name: 'The Haunted Duo — Spooky Season + Jack-O\'-Lantern', price: 23.99, compare: 31.98, cat: 'bundle', accessory: true,
    devices: [], magsafe: true, stock: [28], sold24: 12,
    imgId: 'photo-1698741806312-4b6c65a75b18', backId: 'photo-1604327006476-babcde5fd133',
    badge: null, rating: 4.9, reviews: 1037,
    desc: 'One iPhone case, one AirPods case, matching lantern print — 25% off buying them apart.' },
];

const ALL_ITEMS = PRODUCTS.concat(ACCESSORIES);

const NEW_DROP_IDS = ['glow-ghost', 'bat-wing', 'witchy-vibes', 'trick-or-treat-airpods'];
const BEST_SELLER_IDS = ['spooky-season', 'jack-o-lantern-airpods', 'pumpkin-spice', 'black-cat',
  'skull-bones', 'cobweb-clear', 'mummy-wrap', 'boo-crew-airpods'];

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
  if (p.badge === 'drop') return '<span class="badge badge--drop p-card__badge">Glow Drop</span>';
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
  <article class="p-card reveal${out ? ' p-card--out' : ''}${p.badge === 'sale' ? ' p-card--sale' : ''}" style="--d:${(i % 4) * 70}ms" data-id="${p.id}">
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
    : '<p class="grid-empty">No matches. Try another filter — or search "ghost".</p>';
  if (window.observeReveals) window.observeReveals(el);
}
