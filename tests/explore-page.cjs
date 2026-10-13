const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'explore.html'), 'utf8');
const home = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(base, 'explore.js'), 'utf8');
const i18n = fs.readFileSync(path.join(base, 'i18n.js'), 'utf8');
const views = [...html.matchAll(/data-explore-view="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(views, ['walls', 'custom', 'shop', 'gallery']);
for (const view of views) {
  assert.match(html, new RegExp(`data-view-tab="${view}"`));
  assert.match(home, new RegExp(`explore\\.html\\?view=${view}`));
}
assert.equal((html.match(/class="type-card"/g) || []).length, 8);
assert.equal((html.match(/data-collection=/g) || []).length, 2);
assert.match(js, /history\[historyMode\]/);
assert.match(js, /popstate/);
assert.match(js, /data-explore-search/);
assert.match(i18n, /index\|explore\|work/);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(base, 'catalog.js'), 'utf8'), context);
const ids = new Set(Object.values(context.window.BLVK_CATALOG).flat().map(item => item.id));
for (const match of html.matchAll(/data-gallery="[^"]+" data-id="([^"]+)"/g)) assert(ids.has(match[1]), `${match[1]} must exist in the catalogue`);
console.log('PASS: shared explore page, four routed views, type layouts, collection controls, and catalogue IDs.');
