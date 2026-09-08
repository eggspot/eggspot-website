/* NOVA REY — Official Newsroom
   One script for the whole site. Every block guards on its own markup being
   present, so the same file can be loaded by all ten pages.
   No dependencies, no build step. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ======================================================================
     1. MOBILE NAVIGATION
     The drawer sits below the header in the z-order, so the toggle (which
     becomes the X) is always on top and always clickable.
     ====================================================================== */
  function initMobileNav() {
    var toggle = $('.nav-toggle');
    var drawer = $('#mobileNav');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.hidden = !open;
      document.body.classList.toggle('is-locked', open);
      if (open) {
        var first = drawer.querySelector('a, button');
        if (first) first.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    /* A resize past the desktop breakpoint must not leave the body locked. */
    window.matchMedia('(min-width: 1025px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ======================================================================
     2. BREAKING TICKER
     CSS drives the marquee; this only adds the explicit pause control that
     WCAG 2.2.2 asks for on auto-moving content.
     ====================================================================== */
  function initTicker() {
    $$('.ticker').forEach(function (ticker) {
      var btn = $('.ticker__pause', ticker);
      if (!btn) return;
      btn.addEventListener('click', function () {
        var paused = ticker.classList.toggle('is-paused');
        btn.setAttribute('aria-pressed', String(paused));
        btn.setAttribute('aria-label', paused ? 'Resume breaking news ticker' : 'Pause breaking news ticker');
      });
    });
  }

  /* ======================================================================
     3. CUSTOM SELECT (ARIA select-only combobox)
     The native <select> stays in the DOM as the source of truth — it keeps
     .value and the `change` event working — but is removed from the tab
     order and the a11y tree. A button + listbox drive it instead.
     ====================================================================== */
  var CHEVRON = '<svg class="cselect__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var csSeq = 0;
  var csRegistry = new WeakMap();

  function csInitOne(select) {
    if (csRegistry.has(select)) return csRegistry.get(select);

    var uid = 'cs' + (++csSeq);
    var wrap = document.createElement('div');
    wrap.className = 'cselect';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('cselect__native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cselect__btn';
    btn.id = uid + '-btn';
    btn.setAttribute('role', 'combobox');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', uid + '-list');
    btn.innerHTML = '<span class="cselect__value"></span>' + CHEVRON;

    var list = document.createElement('ul');
    list.className = 'cselect__panel';
    list.id = uid + '-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;

    var label = select.id ? document.querySelector('label[for="' + select.id + '"]') : null;
    if (label) {
      label.setAttribute('for', btn.id);
      btn.setAttribute('aria-label', label.textContent.trim());
      list.setAttribute('aria-label', label.textContent.trim());
    }

    wrap.appendChild(btn);
    wrap.appendChild(list);

    var opts = Array.prototype.map.call(select.options, function (opt, i) {
      var li = document.createElement('li');
      li.className = 'cselect__opt';
      li.id = uid + '-opt' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.textContent = opt.text;
      if (opt.disabled) li.setAttribute('aria-disabled', 'true');
      list.appendChild(li);
      return li;
    });

    var api = { select: select, btn: btn, list: list, opts: opts, active: select.selectedIndex, open: false };
    csRegistry.set(select, api);

    function paint() {
      var i = select.selectedIndex;
      $('.cselect__value', btn).textContent = i > -1 ? select.options[i].text : '';
      opts.forEach(function (li, n) {
        li.setAttribute('aria-selected', String(n === i));
        li.classList.toggle('is-active', n === api.active);
      });
    }

    function setActive(n) {
      if (n < 0 || n >= opts.length) return;
      api.active = n;
      opts.forEach(function (li, k) { li.classList.toggle('is-active', k === n); });
      btn.setAttribute('aria-activedescendant', opts[n].id);
      opts[n].scrollIntoView({ block: 'nearest' });
    }

    function open() {
      if (api.open || select.disabled) return;
      csCloseAll(api);
      api.open = true;
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      /* Flip above the button when the panel would run off the bottom. */
      var room = window.innerHeight - btn.getBoundingClientRect().bottom;
      wrap.classList.toggle('cselect--up', room < Math.min(list.scrollHeight + 16, 280));
      setActive(select.selectedIndex > -1 ? select.selectedIndex : 0);
    }

    function close(refocus) {
      if (!api.open) return;
      api.open = false;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.removeAttribute('aria-activedescendant');
      wrap.classList.remove('cselect--up');
      if (refocus) btn.focus();
    }

    function commit(n) {
      if (n < 0 || n >= opts.length || select.options[n].disabled) return;
      if (select.selectedIndex !== n) {
        select.selectedIndex = n;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      paint();
      close(true);
    }

    api.paint = paint;
    api.close = close;

    btn.addEventListener('click', function () { api.open ? close(true) : open(); });

    btn.addEventListener('keydown', function (e) {
      var last = opts.length - 1;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          api.open ? setActive(Math.min(api.active + 1, last)) : open();
          break;
        case 'ArrowUp':
          e.preventDefault();
          api.open ? setActive(Math.max(api.active - 1, 0)) : open();
          break;
        case 'Home': if (api.open) { e.preventDefault(); setActive(0); } break;
        case 'End': if (api.open) { e.preventDefault(); setActive(last); } break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          api.open ? commit(api.active) : open();
          break;
        case 'Escape': if (api.open) { e.preventDefault(); close(true); } break;
        case 'Tab': close(false); break;
        default:
          if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            var from = (api.active + 1) % opts.length;
            var order = opts.map(function (_, i) { return (from + i) % opts.length; });
            var hit = order.filter(function (i) {
              return opts[i].textContent.toLowerCase().indexOf(e.key.toLowerCase()) === 0;
            })[0];
            if (hit !== undefined) { if (!api.open) open(); setActive(hit); }
          }
      }
    });

    list.addEventListener('click', function (e) {
      var li = e.target.closest('.cselect__opt');
      if (li) commit(opts.indexOf(li));
    });
    list.addEventListener('mousemove', function (e) {
      var li = e.target.closest('.cselect__opt');
      if (li) setActive(opts.indexOf(li));
    });

    paint();
    return api;
  }

  function csCloseAll(except) {
    $$('.cselect').forEach(function (wrap) {
      var api = csRegistry.get($('.cselect__native', wrap));
      if (api && api !== except) api.close(false);
    });
  }

  document.addEventListener('pointerdown', function (e) {
    if (!e.target.closest('.cselect')) csCloseAll();
  });

  function initCustomSelects(root) {
    $$('select[data-custom-select]', root).forEach(csInitOne);
  }

  /* ======================================================================
     4. NEWS FILTER + SORT
     Cards are already in the DOM (good for crawlers and for no-JS readers);
     filtering only toggles visibility and re-orders the existing nodes.
     ====================================================================== */
  function initNewsFilter() {
    var feed = $('#newsFeed');
    if (!feed) return;

    var catSel = $('#filterCategory');
    var sortSel = $('#filterSort');
    var count = $('#resultCount');
    var empty = $('#newsEmpty');
    var clear = $('#clearFilters');
    var cards = $$('.card[data-category]', feed);

    function apply() {
      var cat = catSel ? catSel.value : 'all';
      var sort = sortSel ? sortSel.value : 'newest';
      var shown = 0;

      cards.forEach(function (card) {
        var match = cat === 'all' || card.dataset.category === cat;
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });

      var ordered = cards.slice().sort(function (a, b) {
        if (sort === 'oldest') return a.dataset.date.localeCompare(b.dataset.date);
        if (sort === 'reading') return Number(a.dataset.read) - Number(b.dataset.read);
        if (sort === 'az') return a.dataset.title.localeCompare(b.dataset.title);
        return b.dataset.date.localeCompare(a.dataset.date);
      });
      ordered.forEach(function (card) { feed.appendChild(card); });

      if (count) count.innerHTML = '<b>' + shown + '</b> ' + (shown === 1 ? 'story' : 'stories');
      if (empty) empty.hidden = shown !== 0;
      if (clear) clear.hidden = cat === 'all' && sort === 'newest';
    }

    if (catSel) catSel.addEventListener('change', apply);
    if (sortSel) sortSel.addEventListener('change', apply);
    if (clear) {
      clear.addEventListener('click', function () {
        if (catSel) { catSel.value = 'all'; refreshSelect(catSel); }
        if (sortSel) { sortSel.value = 'newest'; refreshSelect(sortSel); }
        apply();
      });
    }

    /* Deep link: news.html?cat=tour arrives from category badges elsewhere. */
    var wanted = new URLSearchParams(window.location.search).get('cat');
    if (wanted && catSel) {
      var hit = Array.prototype.some.call(catSel.options, function (o) { return o.value === wanted; });
      if (hit) { catSel.value = wanted; refreshSelect(catSel); }
    }
    apply();
  }

  function refreshSelect(select) {
    var api = csRegistry.get(select);
    if (api) api.paint();
  }

  /* ======================================================================
     5. TOUR FILTER — region + ticket status
     ====================================================================== */
  function initTourFilter() {
    var list = $('#tourList');
    if (!list) return;

    var regionSel = $('#filterRegion');
    var statusSel = $('#filterStatus');
    var count = $('#tourCount');
    var empty = $('#tourEmpty');
    var rows = $$('.tour-row', list);

    function apply() {
      var region = regionSel ? regionSel.value : 'all';
      var status = statusSel ? statusSel.value : 'all';
      var shown = 0;

      rows.forEach(function (row) {
        var match = (region === 'all' || row.dataset.region === region) &&
                    (status === 'all' || row.dataset.status === status);
        row.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });

      if (count) count.innerHTML = '<b>' + shown + '</b> ' + (shown === 1 ? 'show' : 'shows');
      if (empty) empty.hidden = shown !== 0;
    }

    if (regionSel) regionSel.addEventListener('change', apply);
    if (statusSel) statusSel.addEventListener('change', apply);
    apply();
  }

  /* ======================================================================
     6. GALLERY LIGHTBOX
     Photos render an <img>; videos build the player iframe on open and the
     iframe is destroyed on close so playback actually stops.
     ====================================================================== */
  function initLightbox() {
    var dialog = $('#lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var media = $('#lightboxMedia');
    var caption = $('#lightboxCaption');
    var meta = $('#lightboxMeta');
    var prevBtn = $('#lightboxPrev');
    var nextBtn = $('#lightboxNext');
    var items = $$('.gallery-item');
    var index = 0;

    function visible() {
      return items.filter(function (it) { return !it.classList.contains('is-hidden'); });
    }

    function render(item) {
      media.innerHTML = '';
      if (item.dataset.kind === 'video' && item.dataset.embed) {
        var frame = document.createElement('iframe');
        frame.src = item.dataset.embed;
        frame.title = item.dataset.caption;
        /* Keep width/height as aspect metadata only; CSS controls rendered size.
           If a fixed height attribute wins, the mobile lightbox becomes a tall
           372x720 column instead of a 16:9 video. */
        frame.width = '1280';
        frame.height = '720';
        frame.loading = 'lazy';
        frame.allow = 'accelerometer; encrypted-media; fullscreen; picture-in-picture; web-share';
        frame.style.cssText = 'width:100%;height:auto;aspect-ratio:16/9;border:0;display:block;max-height:72vh;';
        media.appendChild(frame);
      } else {
        var img = document.createElement('img');
        img.src = item.dataset.full;
        img.alt = item.dataset.alt || item.dataset.caption;
        media.appendChild(img);
      }
      caption.textContent = item.dataset.caption;
      meta.textContent = item.dataset.meta || '';
    }

    function openAt(item) {
      var list = visible();
      index = list.indexOf(item);
      if (index < 0) index = 0;
      render(list[index]);
      if (!dialog.open) dialog.showModal();
      var closeBtn = $('#lightboxClose');
      if (closeBtn) closeBtn.focus();
    }

    function step(delta) {
      var list = visible();
      if (!list.length) return;
      index = (index + delta + list.length) % list.length;
      render(list[index]);
    }

    items.forEach(function (item) {
      var btn = $('.gallery-btn', item);
      if (btn) btn.addEventListener('click', function () { openAt(item); });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });

    /* Clicking the backdrop (the dialog element itself) closes it. */
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    /* Escape fires `close`; emptying here guarantees the video stops. */
    dialog.addEventListener('close', function () { media.innerHTML = ''; });

    var closeBtn = $('#lightboxClose');
    if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close(); });
  }

  /* ======================================================================
     6b. GALLERY CATEGORY CHIPS
     ====================================================================== */
  function initGalleryFilter() {
    var chips = $$('#galleryFilter .chip');
    if (!chips.length) return;
    var items = $$('.gallery-item');
    var count = $('#galleryCount');

    function apply(value) {
      var shown = 0;
      items.forEach(function (item) {
        var match = value === 'all' || item.dataset.cat === value;
        item.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      if (count) count.innerHTML = '<b>' + shown + '</b> ' + (shown === 1 ? 'item' : 'items');
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        apply(chip.dataset.filter);
      });
    });

    apply('all');
  }

  /* ======================================================================
     7. CLICK-TO-LOAD EMBEDS (YouTube / Spotify)
     Nothing third-party is requested until the visitor asks for it: the
     facade is a local poster, and the iframe is built on click.
     ====================================================================== */
  function initEmbeds() {
    $$('.embed').forEach(function (embed) {
      var facade = $('.embed__facade', embed);
      var frame = $('.embed__frame', embed);
      var close = $('.embed__close', embed);
      if (!facade || !frame) return;

      facade.addEventListener('click', function () {
        if (embed.classList.contains('is-live')) return;
        var iframe = document.createElement('iframe');
        iframe.src = facade.dataset.embed;
        iframe.title = facade.dataset.embedTitle || 'Embedded player';
        iframe.loading = 'lazy';
        /* `fullscreen` in `allow` supersedes the legacy allowfullscreen attribute;
           setting both makes the browser warn. */
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        frame.appendChild(iframe);
        embed.classList.add('is-live');
        if (close) close.focus();
      });

      if (close) {
        close.addEventListener('click', function () {
          var iframe = $('iframe', frame);
          if (iframe) iframe.remove();
          embed.classList.remove('is-live');
          facade.focus();
        });
      }
    });
  }

  /* ======================================================================
     8. DEMO AUDIO PLAYER
     A transport UI for the template preview — it simulates playback rather
     than shipping an audio file. Swap in a real <audio> element to go live;
     the markup and states are already in place.
     ====================================================================== */
  function initPlayers() {
    $$('.player').forEach(function (player) {
      var toggle = $('.player__toggle', player);
      var fill = $('.player__fill', player);
      var bar = $('.player__bar', player);
      var now = $('.player__now', player);
      var status = $('.player__status', player);
      if (!toggle || !fill || !bar) return;

      var total = Number(player.dataset.duration || 222);
      var at = 0;
      var timer = null;

      function fmt(sec) {
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
      }

      function paint() {
        fill.style.width = (at / total * 100).toFixed(2) + '%';
        bar.setAttribute('aria-valuenow', String(Math.round(at)));
        bar.setAttribute('aria-valuetext', fmt(at) + ' of ' + fmt(total));
        if (now) now.textContent = fmt(at);
      }

      function stop(finished) {
        clearInterval(timer);
        timer = null;
        toggle.setAttribute('aria-pressed', 'false');
        toggle.setAttribute('aria-label', 'Play preview');
        if (status) status.textContent = finished ? 'Preview finished.' : 'Preview paused.';
      }

      function play() {
        toggle.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('aria-label', 'Pause preview');
        if (status) status.textContent = 'Playing preview.';
        timer = setInterval(function () {
          at += 1;
          if (at >= total) { at = total; paint(); stop(true); at = 0; setTimeout(paint, 600); return; }
          paint();
        }, 1000);
      }

      toggle.addEventListener('click', function () {
        if (timer) stop(false); else play();
      });

      function seek(clientX) {
        var box = bar.getBoundingClientRect();
        at = Math.min(total, Math.max(0, (clientX - box.left) / box.width * total));
        paint();
      }

      bar.addEventListener('click', function (e) { seek(e.clientX); });
      bar.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); at = Math.min(total, at + 5); paint(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); at = Math.max(0, at - 5); paint(); }
        if (e.key === 'Home') { e.preventDefault(); at = 0; paint(); }
        if (e.key === 'End') { e.preventDefault(); at = total; paint(); }
      });

      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(total));
      paint();
    });
  }

  /* ======================================================================
     9. FORMS — demo only
     Nothing is transmitted. Submission is intercepted, consent is enforced
     client-side, and the result is announced through a live region.
     ====================================================================== */
  function initForms() {
    $$('form[data-demo-form]').forEach(function (form) {
      var status = $('.form-status', form);
      var consent = form.querySelector('input[type="checkbox"][required]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        if (consent && !consent.checked) {
          if (status) {
            status.classList.add('is-shown', 'is-error');
            $('.form-status__text', status).textContent = 'Please agree to the privacy policy before continuing.';
          }
          consent.focus();
          return;
        }

        if (status) {
          status.classList.add('is-shown');
          status.classList.remove('is-error');
          $('.form-status__text', status).textContent = form.dataset.demoForm;
        }
        form.reset();
      });
    });
  }

  /* ======================================================================
     10. COPY-TO-CLIPBOARD (press kit bios)
     ====================================================================== */
  function initCopy() {
    $$('[data-copy-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var source = document.getElementById(btn.dataset.copyTarget);
        if (!source) return;
        var text = source.innerText.trim();
        var done = function () {
          var label = $('.copy-label', btn) || btn;
          var original = label.textContent;
          label.textContent = 'Copied';
          setTimeout(function () { label.textContent = original; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:absolute;left:-9999px';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (err) { /* clipboard unavailable */ }
          ta.remove();
          done();
        }
      });
    });
  }

  /* ======================================================================
     11. COOKIE BANNER — choice persisted in localStorage
     ====================================================================== */
  var CONSENT_KEY = 'novarey.consent';

  function readConsent() {
    try { return window.localStorage.getItem(CONSENT_KEY); } catch (err) { return 'unavailable'; }
  }
  function writeConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (err) { /* private mode */ }
  }

  function initCookieBanner() {
    var banner = $('#cookieBanner');
    if (!banner) return;
    if (readConsent()) { banner.hidden = true; return; }
    banner.hidden = false;

    $$('[data-consent]', banner).forEach(function (btn) {
      btn.addEventListener('click', function () {
        writeConsent(btn.dataset.consent);
        banner.hidden = true;
      });
    });
  }

  /* ======================================================================
     12. READING PROGRESS (article page)
     Measured against the <article>, not the document, so the footer does
     not count as "unread".
     ====================================================================== */
  function initReadingProgress() {
    var bar = $('#readingProgress');
    var article = $('#articleBody');
    if (!bar || !article) return;

    var ticking = false;
    function update() {
      var box = article.getBoundingClientRect();
      var total = box.height - window.innerHeight;
      var done = total <= 0 ? 1 : Math.min(1, Math.max(0, -box.top / total));
      bar.style.width = (done * 100).toFixed(1) + '%';
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ======================================================================
     13. SHARE — copy the current URL
     ====================================================================== */
  function initShare() {
    $$('[data-share-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var url = window.location.href;
        var status = $('#shareStatus');
        var done = function () { if (status) status.textContent = 'Link copied to clipboard.'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, done);
        } else { done(); }
      });
    });
  }

  /* ======================================================================
     14. SCROLL REVEAL — opt-in, and skipped entirely for reduced motion
     ====================================================================== */
  function initReveal() {
    var targets = $$('.reveal');
    if (!targets.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  function boot() {
    initMobileNav();
    initTicker();
    initCustomSelects(document);
    initNewsFilter();
    initTourFilter();
    initLightbox();
    initGalleryFilter();
    initEmbeds();
    initPlayers();
    initForms();
    initCopy();
    initCookieBanner();
    initReadingProgress();
    initShare();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
