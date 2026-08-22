/* CASELAB® Holiday — quick-view modal + quick-add model picker. Depends on data.js + cart.js */

/* ---------- quick-view modal ---------- */
function openQuickView(id) {
  const p = findProduct(id);
  const modal = $('#qvModal');
  if (!p || !modal) return;
  lastFocused = document.activeElement;
  $('#qvImg').src = imgUrl(p, 700);
  $('#qvImg').alt = cardAlt(p);
  $('#qvName').textContent = p.name;
  $('#qvPrice').innerHTML = priceHTML(p).replace(/^<span class="price">|<\/span>$/g, '');
  $('#qvDesc').textContent = p.desc;
  $('#qvRating').innerHTML = `${starsHTML(5)}<span>${p.rating} · ${p.reviews} reviews</span>`;
  $('#qvAdd').dataset.add = p.id;
  $('#qvLink').href = `product.html?id=${p.id}`;
  modal.classList.add('open');
  modal.removeAttribute('aria-hidden');
  $('#overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  $('#qvClose').focus();
}
function closeQuickView() {
  const modal = $('#qvModal');
  if (!modal || !modal.classList.contains('open')) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  $('#overlay').classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}

document.addEventListener('click', (e) => {
  const qvBtn = e.target.closest('[data-qv]');
  if (qvBtn) { e.preventDefault(); openQuickView(qvBtn.dataset.qv); return; }
  if (e.target.closest('#qvClose') || e.target.id === 'qvModal') closeQuickView();
});

/* ---------- quick-add model sheet ---------- */
/* A `+` that silently guessed the model shipped orders with an empty variant. Ask once, then
   remember the answer so every later quick-add stays a single tap. */
const MODEL_KEY = 'caselab-xmas-model';

const rememberedModel = () => {
  try { return localStorage.getItem(MODEL_KEY) || ''; } catch (e) { return ''; }
};
const rememberModel = (device) => {
  try { localStorage.setItem(MODEL_KEY, device); } catch (e) { /* private mode */ }
};

function ensureModelSheet() {
  let sheet = $('#modelSheet');
  if (sheet) return sheet;
  sheet = document.createElement('div');
  sheet.className = 'qv-modal qv-modal--sheet';
  sheet.id = 'modelSheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', 'modelSheetTitle');
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = `
    <div class="qv-modal__card model-sheet__card">
      <div class="qv-modal__body">
        <button class="icon-btn qv-modal__close" id="modelSheetClose" type="button" aria-label="Close model picker">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <span class="mono-label section__eyebrow">Step 1 of 1</span>
        <h3 id="modelSheetTitle">Which model?</h3>
        <p class="model-sheet__name" id="modelSheetProduct"></p>
        <div class="model-sheet__opts" id="modelSheetOpts" role="group" aria-label="Choose your model"></div>
        <label class="model-sheet__remember"><input type="checkbox" id="modelSheetRemember" checked> Remember my model</label>
        <button class="btn btn--lime btn--block" id="modelSheetAdd" type="button"></button>
      </div>
    </div>`;
  document.body.appendChild(sheet);
  return sheet;
}

let sheetProduct = null;
let sheetDevice = '';

function paintModelSheet() {
  const p = sheetProduct;
  if (!p) return;
  $('#modelSheetOpts').innerHTML = p.devices.map((d, i) => {
    const left = p.stock[i];
    return `<button class="model-opt" type="button" data-device="${d}"${left ? '' : ' disabled'}
      aria-pressed="${d === sheetDevice ? 'true' : 'false'}">
      <span>${DEVICE_LABELS[d]}</span>
      <span class="model-opt__note">${left ? (left <= LOW_STOCK_AT ? `${left} left` : 'In stock') : 'Sold out'}</span>
    </button>`;
  }).join('');
  const addBtn = $('#modelSheetAdd');
  addBtn.textContent = sheetDevice ? `Add to Cart — ${money(p.price)}` : 'Select a model';
  addBtn.disabled = !sheetDevice;
}

function openModelSheet(p) {
  const sheet = ensureModelSheet();
  sheetProduct = p;
  const remembered = rememberedModel();
  const i = p.devices.indexOf(remembered);
  sheetDevice = i > -1 && p.stock[i] > 0 ? remembered : '';
  $('#modelSheetProduct').textContent = `${p.name} · ${money(p.price)}`;
  paintModelSheet();
  lastFocused = document.activeElement;
  sheet.classList.add('open');
  sheet.removeAttribute('aria-hidden');
  $('#overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  $('#modelSheetClose').focus();
}

function closeModelSheet() {
  const sheet = $('#modelSheet');
  if (!sheet || !sheet.classList.contains('open')) return;
  sheet.classList.remove('open');
  sheet.setAttribute('aria-hidden', 'true');
  $('#overlay').classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}

/* ---------- sheet interactions ---------- */
document.addEventListener('click', (e) => {
  const opt = e.target.closest('.model-opt');
  if (opt) { sheetDevice = opt.dataset.device; paintModelSheet(); return; }
  if (e.target.closest('#modelSheetAdd')) {
    if (!sheetProduct || !sheetDevice) return;
    if (document.getElementById('modelSheetRemember').checked) rememberModel(sheetDevice);
    addToCart(sheetProduct.id, 1, DEVICE_LABELS[sheetDevice]);
    closeModelSheet();
    setTimeout(openCart, 250);
    return;
  }
  if (e.target.closest('#modelSheetClose') || e.target.id === 'modelSheet') closeModelSheet();
});
