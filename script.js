'use strict';
const tr = window.BLVK_I18N?.t || (value => value);
const catalog = window.BLVK_CATALOG;
const products = new Map(catalog.products.map(piece => [piece.id, piece]));
const references = new Map([...catalog.art, ...catalog.automotive, ...catalog.products].map(piece => [piece.id, piece]));
const params = new URLSearchParams(location.search);
const root = document.documentElement;
const header = document.querySelector('.header');
const menu = document.querySelector('.menu-toggle');
let requestIds = [];
try { const saved = JSON.parse(localStorage.getItem('blvk-request') || '[]'); if (Array.isArray(saved)) requestIds = [...new Set(saved.filter(id => products.has(id)))]; } catch {}
if (params.has('items')) requestIds = [...new Set(params.get('items').split(',').filter(id => products.has(id)))];
function storeRequest() { try { localStorage.setItem('blvk-request', JSON.stringify(requestIds)); } catch {} }
function makePhoto(piece, rect = piece.rect, contain = false) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('photo'); svg.setAttribute('viewBox', rect.join(' '));
  svg.setAttribute('preserveAspectRatio', contain ? 'xMidYMid meet' : 'xMidYMid slice');
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', tr(`${piece.title} — sample reference`));
  // Clip the source board to the selected artwork even in a letterboxed viewer.
  const defs = document.createElementNS(ns, 'defs');
  const clip = document.createElementNS(ns, 'clipPath');
  const clipId = `crop-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
  clip.id = clipId;
  const box = document.createElementNS(ns, 'rect');
  ['x', 'y', 'width', 'height'].forEach((name, i) => box.setAttribute(name, rect[i]));
  clip.append(box); defs.append(clip); svg.append(defs);
  const image = document.createElementNS(ns, 'image');
  image.setAttribute('href', `assets/${piece.src}`); image.setAttribute('width', '1536'); image.setAttribute('height', '1024');
  image.setAttribute('clip-path', `url(#${clipId})`); svg.append(image); return svg;
}
let toastTimer;
function notify(message) {
  const toast = document.querySelector('.toast'); toast.textContent = tr(message); toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}
menu.addEventListener('click', () => menu.setAttribute('aria-expanded', String(header.classList.toggle('menu-open'))));
function closeMenu() { header.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); }
document.querySelectorAll('nav a').forEach(link => {
  if (link.dataset.page === document.body.dataset.page) link.setAttribute('aria-current', 'page');
  link.addEventListener('click', closeMenu);
});
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
if (document.body.dataset.page === 'home') { try { sessionStorage.setItem('blvk-visited', '1'); } catch {} }

// Fast transitions keep normal URLs, hashes, new-tab clicks and browser history.
let navigating = false;
function resetNavigation() { navigating = false; root.classList.remove('page-leaving', 'page-entering'); }
window.addEventListener('pageshow', event => { if (event.persisted) resetNavigation(); });
document.querySelector('.page-curtain').addEventListener('animationend', () => root.classList.remove('page-entering'));
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const destination = new URL(link.href, location.href);
  const localPages = ['index.html', 'explore.html', 'work.html', 'automotive.html', 'shop.html', 'contact.html'].map(name => new URL(name, new URL('.', location.href)).pathname);
  if (destination.origin !== location.origin || destination.protocol !== location.protocol || !localPages.includes(destination.pathname)) return;
  // Carry the list in contact links so direct-file previews also retain it.
  if (destination.pathname.endsWith('/contact.html') && !destination.searchParams.has('items') && requestIds.length) {
    destination.searchParams.set('items', requestIds.join(',')); link.href = destination.href;
  }
  if (destination.pathname === location.pathname || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  event.preventDefault(); if (navigating) return; navigating = true;
  root.classList.remove('page-entering'); root.classList.add('page-leaving');
  setTimeout(() => {
    try { sessionStorage.setItem('blvk-transition', JSON.stringify({ to: destination.href, at: Date.now() })); } catch {}
    location.assign(destination.href);
  }, 260);
});

const cards = document.querySelectorAll('[data-category]');
let activeFilter = 'all';
function applyFilter(value) {
  const button = [...document.querySelectorAll('[data-filter]')].find(el => el.dataset.filter === value);
  if (!button) return;
  activeFilter = value;
  document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  let count = 0;
  cards.forEach(card => { card.hidden = value !== 'all' && card.dataset.category !== value; if (!card.hidden) count++; });
  const status = document.querySelector('#filter-status'); if (status) status.textContent = tr(`${count} pieces shown.`);
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
if (params.has('category')) applyFilter(params.get('category'));

const gallery = document.querySelector('.gallery-dialog');
let galleryItems = [], galleryIndex = 0, productView = 0, currentProduct = null;
function renderGallery() {
  const piece = currentProduct || galleryItems[galleryIndex];
  const rect = currentProduct ? piece.views[productView].rect : piece.rect;
  document.querySelector('.gallery-picture').replaceChildren(makePhoto(piece, rect, true));
  document.querySelector('#gallery-title').textContent = tr(piece.title);
  document.querySelector('#gallery-position').textContent = tr(currentProduct ? `Sample piece · ${piece.views[productView].label}` : `Sample reference · ${galleryIndex + 1} / ${galleryItems.length}`);
  const thumbs = document.querySelector('.gallery-thumbs'); thumbs.replaceChildren();
  if (currentProduct) piece.views.forEach((view, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = tr(view.label);
    button.setAttribute('aria-pressed', String(index === productView));
    button.addEventListener('click', () => { productView = index; renderGallery(); }); thumbs.append(button);
  });
  const action = document.querySelector('.gallery-action'); action.replaceChildren();
  if (currentProduct) {
    const note = document.createElement('span'); note.className = 'muted'; note.textContent = tr('Price on request · Sample catalogue');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'button'; button.dataset.add = piece.id;
    button.textContent = tr(requestIds.includes(piece.id) ? 'In your enquiry list ✓' : 'Add to enquiry ＋'); action.append(note, button);
  } else {
    const link = document.createElement('a'); link.className = 'button'; link.href = `contact.html?interest=${encodeURIComponent(piece.id)}`;
    link.textContent = tr('Request something similar ↗'); action.append(link);
  }
}
document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => {
  currentProduct = button.dataset.gallery === 'products' ? products.get(button.dataset.id) : null;
  productView = 0;
  galleryItems = catalog[button.dataset.gallery].filter(piece => activeFilter === 'all' || piece.category === activeFilter);
  galleryIndex = Math.max(0, galleryItems.findIndex(piece => piece.id === button.dataset.id));
  renderGallery(); gallery.showModal();
}));
function moveGallery(step) {
  if (currentProduct) productView = (productView + step + currentProduct.views.length) % currentProduct.views.length;
  else galleryIndex = (galleryIndex + step + galleryItems.length) % galleryItems.length;
  renderGallery();
}
document.querySelector('[data-prev]').addEventListener('click', () => moveGallery(-1));
document.querySelector('[data-next]').addEventListener('click', () => moveGallery(1));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
  if (gallery.open && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); moveGallery(event.key === 'ArrowRight' ? 1 : -1); }
});

function renderRequest() {
  document.querySelectorAll('[data-count]').forEach(el => el.textContent = requestIds.length);
  document.querySelectorAll('[data-add]').forEach(button => {
    const included = requestIds.includes(button.dataset.add);
    button.textContent = tr(included ? 'In your enquiry list ✓' : 'Add to enquiry ＋'); button.setAttribute('aria-pressed', String(included));
  });
  const list = document.querySelector('#request-items'); list.replaceChildren();
  if (!requestIds.length) {
    const empty = document.createElement('p'); empty.className = 'request-empty'; empty.textContent = tr('Your list is empty. Explore the shop and save a piece you like.'); list.append(empty);
  }
  requestIds.forEach(id => {
    const piece = products.get(id); const row = document.createElement('div'); row.className = 'request-item'; row.append(makePhoto(piece));
    const title = document.createElement('span'); title.textContent = tr(piece.title);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = tr('Remove'); remove.setAttribute('aria-label', tr(`Remove ${piece.title}`));
    remove.addEventListener('click', () => { requestIds = requestIds.filter(value => value !== id); storeRequest(); renderRequest(); });
    row.append(title, remove); list.append(row);
  });
  const next = document.querySelector('#prepare-request');
  next.href = requestIds.length ? `contact.html?items=${encodeURIComponent(requestIds.join(','))}` : 'shop.html';
  next.textContent = tr(requestIds.length ? 'Prepare an enquiry ↗' : 'Explore the shop ↗');
}
document.querySelector('.request-toggle').addEventListener('click', () => { renderRequest(); document.querySelector('.request-dialog').showModal(); });
document.addEventListener('click', event => {
  const button = event.target.closest('[data-add]'); if (!button || !products.has(button.dataset.add)) return;
  const id = button.dataset.add;
  if (!requestIds.includes(id)) { requestIds.push(id); storeRequest(); renderRequest(); notify(`${products.get(id).title} added to your enquiry list.`); }
  else notify('This piece is already in your enquiry list.');
});
renderRequest();

const form = document.querySelector('#enquiry-form');
if (form) {
  const interest = references.get(params.get('interest'));
  const selectedNames = requestIds.map(id => products.get(id).title);
  if (interest && !selectedNames.includes(interest.title)) selectedNames.push(interest.title);
  if (params.get('interest') === 'automotive') selectedNames.push('Custom automotive art');
  const chips = document.querySelector('#contact-selection');
  selectedNames.forEach(name => { const chip = document.createElement('span'); chip.className = 'selection-chip'; chip.textContent = tr(name); chips.append(chip); });
  if (selectedNames.length) form.elements.message.value = window.BLVK_I18N?.language === 'ar' ? `أنا مهتم بـ: ${selectedNames.map(tr).join('، ')}.\n\n` : `I'm interested in: ${selectedNames.join(', ')}.\n\n`;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const draft = window.BLVK_I18N?.language === 'ar' ? `بلاك إنك — مسودة استفسار\nلم تُرسل. لم يبدأ استقبال الاستفسارات بالبريد بعد.\n\nإلى: info@blvk.ink\nالاسم: ${data.get('name')}\nالبريد الإلكتروني: ${data.get('email')}\n\n${data.get('message')}\n\nمجموعة نماذج؛ يُرجى تأكيد التوفر والأبعاد والسعر مع الاستوديو.` : `BLVK INK — ENQUIRY DRAFT\nNot sent. Email enquiries are not open yet.\n\nFor: info@blvk.ink\nName: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}\n\nSample collection; availability, dimensions, and price to be confirmed with the studio.`;
    const blob = new Blob([draft], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'blvk-ink-enquiry.txt'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    document.querySelector('#form-status').textContent = tr('Your draft has been downloaded. Nothing has been sent to the studio.');
  });
}


// Scroll through warm grey, graphite, and deep charcoal without an animation loop.
(() => {
  let queued = false;
  const light = [226, 225, 223];
  const dark = [28, 29, 30];
  function updateDepth() {
    queued = false;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
    const depth = progress * progress * (3 - 2 * progress);
    const rgb = light.map((value, i) => Math.round(value + (dark[i] - value) * depth));
    const linear = rgb.map(value => { const c = value / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
    const luminance = linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
    const darkSurface = luminance < .179;
    const ink = darkSurface ? '#fff' : '#090909';
    root.style.setProperty('--scroll-bg', `rgb(${rgb.join(',')})`);
    root.style.setProperty('--scroll-ink', ink);
    root.style.setProperty('--header-logo-filter', darkSurface ? 'brightness(1)' : 'brightness(0)');
    root.style.setProperty('--scroll-muted', darkSurface ? '#f0efed' : '#171717');
    root.style.setProperty('--scroll-line', darkSurface ? '#ffffff55' : '#09090955');
  }
  function scheduleDepth() {
    if (!queued) { queued = true; requestAnimationFrame(updateDepth); }
  }
  if (typeof requestAnimationFrame === 'function' && root.style) {
    window.addEventListener('scroll', scheduleDepth, { passive: true });
    window.addEventListener('resize', scheduleDepth);
    window.addEventListener('load', scheduleDepth);
    window.addEventListener('pageshow', scheduleDepth);
    updateDepth();
  }
})();


// On mobile screens, reveal the inspiration or gallery card nearest the viewport centre.
(() => {
  const panels = [...document.querySelectorAll('.inspiration-panel, .gallery-panel')];
  if (!panels.length || typeof requestAnimationFrame !== 'function') return;
  const mobile = matchMedia('(max-width: 900px)');
  let queued = false;
  let current = null;
  function updateFocusedPanel() {
    queued = false;
    let closest = null;
    let smallestDistance = Infinity;
    if (mobile.matches) {
      const headerBottom = Math.max(0, document.querySelector('.header')?.getBoundingClientRect().bottom || 0);
      const screenBottom = window.innerHeight;
      const centre = (headerBottom + screenBottom) / 2;
      panels.forEach(panel => {
        const box = panel.getBoundingClientRect();
        const visibleHeight = Math.min(box.bottom, screenBottom) - Math.max(box.top, headerBottom);
        if (visibleHeight < box.height * .5) return;
        const distance = Math.abs((box.top + box.bottom) / 2 - centre);
        if (distance < smallestDistance) { closest = panel; smallestDistance = distance; }
      });
    }
    if (closest === current) return;
    current?.classList.remove('is-screen-focused');
    closest?.classList.add('is-screen-focused');
    current = closest;
  }
  function scheduleFocus() {
    if (!queued) { queued = true; requestAnimationFrame(updateFocusedPanel); }
  }
  window.addEventListener('scroll', scheduleFocus, { passive: true });
  window.addEventListener('resize', scheduleFocus);
  window.addEventListener('load', scheduleFocus);
  window.addEventListener('pageshow', scheduleFocus);
  mobile.addEventListener('change', scheduleFocus);
  updateFocusedPanel();
})();

// Touch focus must not pin the header; keyboard navigation and open menus do.
(() => {
  if (!header || typeof requestAnimationFrame !== 'function') return;
  function scrollPosition() {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.max(0, Math.min(window.scrollY, max));
  }
  let previousY = scrollPosition();
  let accumulated = 0;
  let queued = false;
  let keyboardNavigation = false;
  function updateHeader() {
    queued = false;
    const y = scrollPosition();
    const delta = y - previousY;
    previousY = y;
    const keyboardFocus = keyboardNavigation && header.contains(document.activeElement);
    header.classList.toggle('has-keyboard-focus', keyboardFocus);
    if (y < 60 || header.classList.contains('menu-open') || keyboardFocus) {
      header.classList.remove('is-scroll-hidden');
      accumulated = 0;
      return;
    }
    if (!delta) return;
    if (Math.sign(delta) !== Math.sign(accumulated)) accumulated = 0;
    accumulated += delta;
    if (accumulated > 14 && y > header.offsetHeight) {
      header.classList.add('is-scroll-hidden');
      accumulated = 0;
    } else if (accumulated < -8) {
      header.classList.remove('is-scroll-hidden');
      accumulated = 0;
    }
  }
  function scheduleHeader() {
    if (!queued) { queued = true; requestAnimationFrame(updateHeader); }
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') keyboardNavigation = true;
  });
  document.addEventListener('pointerdown', () => {
    keyboardNavigation = false;
    header.classList.remove('has-keyboard-focus');
  }, { passive: true });
  header.addEventListener('focusin', () => {
    if (keyboardNavigation) {
      header.classList.add('has-keyboard-focus');
      header.classList.remove('is-scroll-hidden');
    }
  });
  header.addEventListener('focusout', scheduleHeader);
  window.addEventListener('scroll', scheduleHeader, { passive: true });
  window.addEventListener('pageshow', () => {
    previousY = scrollPosition();
    accumulated = 0;
    header.classList.remove('is-scroll-hidden');
  });
})();
