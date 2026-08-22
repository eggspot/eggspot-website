/* CASELAB® Holiday — Christmas product data + shared render helpers (Unsplash images verified 200) */

/* Slot-sized image URL. webp + auto format keeps card art ~40 KB instead of ~90 KB. */
const U = (id, w) => `https://images.unsplash.com/${id}?w=${w || 700}&q=75&auto=format&fm=webp&fit=crop`;

/* Card art is shown at ~168 px (mobile, 2 cols) and ~300 px (desktop grid) — 400/700 covers both at DPR 2. */
const cardSrcset = (id) => `${U(id, 400)} 400w, ${U(id, 700)} 700w`;
const CARD_SIZES = '(max-width: 640px) 45vw, 300px';
const imgUrl = (p, w) => U(p.imgId, w);
const backUrl = (p, w) => U(p.backId, w);

/* stock[] is aligned index-for-index with devices[] — real per-variant counts, no invented scarcity. */
const PRODUCTS = [
  { id: 'merry-bright', name: '"Merry & Bright" Phone Case', price: 17.99, compare: 24.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15', 'iphone-14', 'iphone-13'], magsafe: true,
    stock: [9, 44, 57, 26, 0], sold24: 63,
    imgId: 'photo-1545128736-3b9f870cab06', backId: 'photo-1607708046397-61c4fda8b3cc',
    badge: 'sale', rating: 4.9, reviews: 741,
    desc: 'Hand-drawn holly and a gold "Merry & Bright" script over never-yellow clear TPU. Full MagSafe snap, 10 ft drop rating, and it arrives gift-boxed.' },
  { id: 'snowflake-frost', name: '"Snowflake Frost" Case', price: 18.99, compare: 25.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [12, 38, 49, 21], sold24: 34,
    imgId: 'photo-1512503751345-2167dfe9d2b6', backId: 'photo-1548777123-e216912df7d8',
    badge: 'sale', rating: 4.8, reviews: 402,
    desc: 'Etched snowflakes in frosted white over a soft-touch shell. Looks like frost on a window, survives a 10 ft drop onto ice-cold concrete.' },
  { id: 'candy-cane', name: '"Candy Cane Stripe" Case', price: 16.99, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15', 'iphone-13'], magsafe: true,
    stock: [7, 41, 53, 18], sold24: 28,
    imgId: 'photo-1513885535751-8b9238bd345a', backId: 'photo-1512101147095-d05249ea9a04',
    badge: null, rating: 4.7, reviews: 288,
    desc: 'Red-and-cream peppermint stripes wrapped edge to edge. The cheapest way to make a phone look like a present.' },
  { id: 'reindeer-games', name: '"Reindeer Games" Case', price: 17.99, compare: 23.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [15, 33, 47], sold24: 22,
    imgId: 'photo-1571504998561-5e49d9c63df6', backId: 'photo-1640224803412-7279f0262302',
    badge: 'sale', rating: 4.8, reviews: 316,
    desc: 'A gingerbread-brown reindeer herd in tonal deboss. Grippy micro-texture so it survives the kids table.' },
  { id: 'polar-glow', name: '"Polar Glow MagSafe" Case', price: 19.99, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16'], magsafe: true,
    stock: [6, 29], sold24: 19,
    imgId: 'photo-1544479415-b3b1be083539', backId: 'photo-1635926891725-a806febe46a3',
    badge: 'drop', rating: 4.9, reviews: 174,
    desc: 'Charges under the tree, glows after lights-out. Photoluminescent aurora print over a 16-magnet N52 MagSafe array.' },
  { id: 'nutcracker-noel', name: '"Nutcracker Noel" Case', price: 18.99, compare: null, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [11, 36, 44], sold24: 16,
    imgId: 'photo-1542765488-53adb192042c', backId: 'photo-1545685556-33cd7e3415df',
    badge: 'drop', rating: 4.8, reviews: 129,
    desc: 'Crimson and gold nutcracker guardsmen on a matte lacquer shell. Raised bezels, 10 ft drop rating, zero glitter fallout.' },
  { id: 'gingerbread-grid', name: '"Gingerbread Grid" Case', price: 16.99, compare: null, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [48, 55, 31], sold24: 11,
    imgId: 'photo-1608755728617-aefab37d2edd', backId: 'photo-1545608444-f045a6db6133',
    badge: null, rating: 4.6, reviews: 163,
    desc: 'Icing-white piping over warm gingerbread on a slim 1.2 oz shell. Subtle enough to keep past New Year.' },
  { id: 'midnight-mistletoe', name: '"Midnight Mistletoe" Case', price: 19.99, compare: 26.99, cat: 'iphone',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [8, 27, 42], sold24: 25,
    imgId: 'photo-1639978447955-881da058b63e', backId: 'photo-1608613615031-457713746a35',
    badge: 'sale', rating: 4.9, reviews: 355,
    desc: 'Near-black armour with a tonal mistletoe grid and a single gold berry. The grown-up way to do Christmas.' },
  { id: 'holly-tartan', name: '"Holly Tartan" Case', price: 17.99, compare: null, cat: 'iphone',
    devices: ['iphone-16', 'iphone-15', 'iphone-14', 'iphone-13'], magsafe: false,
    stock: [39, 52, 28, 14], sold24: 9,
    imgId: 'photo-1571503480026-cd374ecf23e7', backId: 'photo-1606498679463-30a0eb8824e1',
    badge: null, rating: 4.7, reviews: 221,
    desc: 'Woven green-and-red tartan print with Air-Core corners. Tested onto concrete so the family photo session never ends early.' },
  { id: 'christmas-stocking-airpods', name: '"Christmas Stocking" AirPods Case', price: 14.99, compare: null, cat: 'airpods',
    devices: ['airpods-pro', 'airpods-4'], magsafe: false,
    stock: [46, 34], sold24: 37,
    imgId: 'photo-1545685556-33cd7e3415df', backId: 'photo-1512101147095-d05249ea9a04',
    badge: null, rating: 4.9, reviews: 468,
    desc: 'The stocking stuffer that actually fits a stocking. Knit-effect silicone with a red felt tab and a locking carabiner.' },
  { id: 'jingle-bell-airpods', name: '"Jingle Bell" AirPods Case', price: 13.99, compare: null, cat: 'airpods',
    devices: ['airpods-pro', 'airpods-4'], magsafe: false,
    stock: [52, 9], sold24: 14,
    imgId: 'photo-1511022406504-605119708377', backId: 'photo-1542765488-53adb192042c',
    badge: null, rating: 4.6, reviews: 196,
    desc: 'Bell-gold silicone with a deboss ribbon. Clip included, wireless charging straight through.' },
  { id: 'north-pole-airpods', name: '"North Pole Frost" AirPods 4 Case', price: 15.99, compare: null, cat: 'airpods',
    devices: ['airpods-4'], magsafe: false,
    stock: [0], sold24: 0,
    imgId: 'photo-1608085021802-e886468f5fc1', backId: 'photo-1517299321609-52687d1bc55a',
    badge: null, rating: 4.7, reviews: 138,
    desc: 'Frosted translucent shell with a snow-drift texture. Drop-tested, clip included, fits the smallest coat pocket.' },

  /* ---- gift bundles ----
     The season sells sets, not singles, so the bundles live in the catalogue where they can be
     filtered, quick-viewed and linked — not hidden behind a cart cross-sell. Each price is set
     against the compare-at total of the same items bought apart, so the saving on the button is
     the saving in the cart. */
  { id: 'holiday-family-set', name: '"Holiday Matching Family Set" (4-Pack)', price: 44.99, compare: 59.99, cat: 'bundle',
    devices: ['iphone-17', 'iphone-16', 'iphone-15', 'iphone-14'], magsafe: true,
    stock: [18, 31, 40, 23], sold24: 46,
    imgId: 'photo-1607882602950-622c80fff04d', backId: 'photo-1609024849543-ff59df361d08',
    badge: 'sale', rating: 4.9, reviews: 512,
    desc: 'Four matching cases, four different iPhone models, one family photo. Mix any generations from iPhone 17 down to iPhone 14 — 25% off buying them apart, gift wrap free.' },
  { id: 'holiday-gift-bundle', name: '"Holiday Gift Bundle" — Case + Grip + AirPods Case', price: 34.99, compare: 49.99, cat: 'bundle',
    devices: ['iphone-17', 'iphone-16', 'iphone-15'], magsafe: true,
    stock: [13, 35, 41], sold24: 52,
    imgId: 'photo-1607344645866-009c320b63e0', backId: 'photo-1608755728617-aefab37d2edd',
    badge: 'sale', rating: 4.9, reviews: 683,
    desc: 'One iPhone case, one MagSafe grip, one AirPods case — matching print, one box, wrapped and ribboned. 30% off the three bought apart.' },
  { id: 'stocking-stuffer-duo', name: '"Stocking Stuffer Duo" (2-Pack)', price: 19.99, compare: 27.99, cat: 'bundle',
    devices: ['airpods-pro', 'airpods-4'], magsafe: false,
    stock: [37, 25], sold24: 29,
    imgId: 'photo-1512909006721-3d6018887383', backId: 'photo-1544639044-4f142ceb6a2b',
    badge: 'sale', rating: 4.8, reviews: 274,
    desc: 'Two AirPods cases, two stockings, one order. Our cheapest wrapped gift — and it still ships within 24 hours.' },
];

/* Add-on SKUs. Sold as cart cross-sells and PDP add-ons only — kept out of the main catalogue. */
const ACCESSORIES = [
  { id: 'snowflake-carabiner', name: 'Gold Snowflake Carabiner Clip', price: 9.99, compare: null, cat: 'accessory', accessory: true,
    devices: [], magsafe: false, stock: [140], sold24: 12,
    imgId: 'photo-1511022406504-605119708377', backId: 'photo-1577217534079-41d6bb68ac50',
    badge: null, rating: 4.8, reviews: 91,
    desc: 'Anodised-gold snowflake clip that locks any CASELAB AirPods case to a bag, belt loop or tree branch.' },
  { id: 'merry-bright-2pk', name: '"Merry & Bright" 2-Pack', price: 30.58, compare: 35.98, cat: 'bundle', accessory: true,
    devices: [], magsafe: true, stock: [44], sold24: 17,
    imgId: 'photo-1545128736-3b9f870cab06', backId: 'photo-1513885535751-8b9238bd345a',
    badge: null, rating: 4.9, reviews: 741,
    desc: 'Two Merry & Bright cases, 15% off the pair — one to keep, one to wrap.' },
];

const ALL_ITEMS = PRODUCTS.concat(ACCESSORIES);

const NEW_DROP_IDS = ['polar-glow', 'nutcracker-noel', 'midnight-mistletoe', 'snowflake-frost'];
const BEST_SELLER_IDS = ['merry-bright', 'holiday-gift-bundle', 'christmas-stocking-airpods', 'holiday-family-set',
  'candy-cane', 'reindeer-games', 'stocking-stuffer-duo', 'holly-tartan'];

/* The three gift sets, in the order the home-page rail shows them. */
const GIFT_BUNDLE_IDS = ['holiday-gift-bundle', 'holiday-family-set', 'stocking-stuffer-duo'];

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

/* A bundle always wears the gold gift mark; the red save badge stacks under it when there is a
   compare-at price, so "it's a gift set" and "it's cheaper" never compete for the same slot. */
function badgeHTML(p) {
  const gift = p.cat === 'bundle' ? '<span class="badge badge--gift p-card__badge">Gift Set</span>' : '';
  const offset = gift ? ' style="top:52px"' : '';
  if (p.badge === 'drop') return `${gift}<span class="badge badge--drop p-card__badge"${offset}>New Drop</span>`;
  if (p.badge === 'sale') return `${gift}<span class="badge badge--sale p-card__badge"${offset}>Save ${savePct(p)}%</span>`;
  return gift;
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
