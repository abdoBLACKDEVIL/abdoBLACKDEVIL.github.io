const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'explore.html'), 'utf8');
const home = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(base, 'explore.js'), 'utf8');
const i18n = fs.readFileSync(path.join(base, 'i18n.js'), 'utf8');
const serviceHtml = fs.readFileSync(path.join(base, 'service.html'), 'utf8');
const serviceJs = fs.readFileSync(path.join(base, 'service-detail.js'), 'utf8');
const views = [...html.matchAll(/data-explore-view="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(views, ['walls', 'custom', 'shop', 'gallery']);
for (const view of views) {
  assert.match(html, new RegExp(`data-view-tab="${view}"`));
  assert.match(home, new RegExp(`explore\\.html\\?view=${view}`));
}
assert.equal((html.match(/class="type-card"/g) || []).length, 8);
assert.equal((html.match(/data-type-card/g) || []).length, 8);
assert.doesNotMatch(html, /<a class="type-card"/);
const shopView = html.match(/data-explore-view="shop"[\s\S]*?data-explore-view="gallery"/)[0];
assert.doesNotMatch(shopView, /data-type-card/);
assert.equal((html.match(/data-collection=/g) || []).length, 2);
assert.match(js, /history\[historyMode\]/);
assert.match(js, /popstate/);
assert.match(js, /data-explore-search/);
assert.match(js, /setTypeCard/);
assert.match(js, /reflowTypeGrid/);
assert.match(js, /aria-expanded/);
assert.match(js, /toggleAttribute\('inert'/);
assert.match(i18n, /index\|explore\|service\|work/);
const serviceTypes = ['texture-paint', 'classic', 'murals', '3d-walls', 'special-requests', 'designing-services', 'decoration'];
for (const type of serviceTypes) {
  assert.match(html, new RegExp(`service\\.html\\?type=${type}`));
  assert.match(serviceJs, new RegExp(`['\"]${type}['\"]`));
}
assert.match(html, /href="automotive\.html">Explore this direction/);
assert.match(serviceHtml, /data-service-contact/);
assert.match(serviceJs, /contact\.html/);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(base, 'catalog.js'), 'utf8'), context);
const ids = new Set(Object.values(context.window.BLVK_CATALOG).flat().map(item => item.id));
for (const match of html.matchAll(/data-gallery="[^"]+" data-id="([^"]+)"/g)) assert(ids.has(match[1]), `${match[1]} must exist in the catalogue`);
console.log('PASS: shared explore page, four routed views, type layouts, collection controls, and catalogue IDs.');
