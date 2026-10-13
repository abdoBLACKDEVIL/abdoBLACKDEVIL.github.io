const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = join(__dirname, '..');
function setup(search, saved, scheme = 'https://example.test/', savedPosition) {
  const location = new URL(`shop.html${search}`, scheme);
  const store = new Map(saved ? [['blvk-language', saved]] : []);
  const session = new Map(savedPosition ? [['blvk-language-position', JSON.stringify(savedPosition)]] : []);
  const nodes = ['Shop', 'Who we are', 'Golden Study'].map(nodeValue => ({ nodeValue, parentElement: { closest: () => null } }));
  const link = (href, language) => ({
    href, dataset: language ? { language } : {}, attrs: {}, events: {},
    getAttribute(name) { return name === 'href' ? this.href : this.attrs[name]; },
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, fn) { this.events[name] = fn; },
    fire(name) { this.events[name]?.(); },
    hasAttribute(name) { return name in this.attrs; },
    closest() { return language ? {} : null; }
  });
  const links = [link('contact.html?items=golden-study'), link('#explore'), link('https://elsewhere.test/')];
  const switches = [link('?lang=en', 'en'), link('?lang=ar', 'ar')];
  const image = link(''); image.attrs['aria-label'] = 'View Golden Study';
  const doc = {
    documentElement: {},
    createTreeWalker() { let i = 0; return { nextNode: () => nodes[i++] || null }; },
    querySelectorAll(selector) {
      if (selector === 'a[href]') return [...links, ...switches];
      if (selector === '[data-language]') return switches;
      return [image];
    },
    querySelector() { return null; },
    addEventListener() {}
  };
  const window = { scrollY: 640, scrollTo(options) { this.lastScroll = options; } };
  const context = { window, document: doc, location, URL, URLSearchParams, NodeFilter: { SHOW_TEXT: 4 },
    requestAnimationFrame: fn => fn(),
    localStorage: { getItem: k => store.get(k), setItem: (k, v) => store.set(k, v) },
    sessionStorage: { getItem: k => session.get(k) || null, setItem: (k, v) => session.set(k, v), removeItem: k => session.delete(k) }
  };
  vm.runInNewContext(readFileSync(join(base, 'i18n.js'), 'utf8'), context);
  return { api: context.window.BLVK_I18N, doc, nodes, links, switches, image, store, session, window };
}
const ar = setup('?lang=ar');
assert.equal(ar.doc.documentElement.dir, 'rtl');
assert.equal(ar.nodes[0].nodeValue, 'المتجر');
assert.equal(ar.image.attrs['aria-label'], 'عرض دراسة ذهبية');
assert.match(ar.links[0].href, /items=golden-study&lang=ar/);
assert.equal(ar.links[1].href, '#explore');
assert.equal(ar.links[2].href, 'https://elsewhere.test/');
assert.equal(ar.switches[1].attrs['aria-current'], 'true');
assert.equal(ar.api.t('6 pieces shown.'), 'عدد القطع المعروضة: 6');
assert.equal(ar.api.t('Sample piece · Closer view'), 'قطعة نموذجية · عرض مقرّب');
assert.match(ar.api.t('Golden Study added to your enquiry list.'), /دراسة ذهبية/);
assert.equal(setup('', 'ar').api.language, 'ar');
assert.equal(setup('?lang=en', 'ar').nodes[0].nodeValue, 'Shop');
assert.equal(setup('?lang=en', 'ar').doc.documentElement.dir, 'ltr');
assert.equal(setup('?lang=invalid').api.language, 'en');
assert.match(setup('?lang=ar', null, 'file:///site/').links[0].href, /lang=ar/);
ar.switches[0].fire('click');
assert.equal(JSON.parse(ar.session.get('blvk-language-position')).y, 640);
const restored = setup('?lang=ar', null, 'https://example.test/', { path: '/shop.html', y: 480, at: Date.now() });
assert.equal(restored.window.lastScroll.top, 480);
assert.equal(restored.session.has('blvk-language-position'), false);
// Run the actual gallery/list interactions using the Arabic translator too.
const interactions = readFileSync(join(__dirname, 'interactions.cjs'), 'utf8')
  .replace('context.window=context;', 'context.window=context;context.BLVK_I18N=localization;')
  .replace("textContent,'Golden Study'", "textContent,'دراسة ذهبية'")
  .replace('/Closer view/', '/عرض مقرّب/');
vm.runInNewContext(interactions, { require, __dirname, console, URL, URLSearchParams, localization: ar.api });
console.log('PASS: Arabic text, accessible labels, English switching, persisted preference, file preview links, and localized dynamic interactions.');
