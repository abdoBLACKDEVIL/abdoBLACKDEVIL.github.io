const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const classes = new Set();
const events = {};
let focusInside = true; // Simulates a button retaining focus after a phone tap.
const header = {
  offsetHeight: 80,
  classList: { contains: x => classes.has(x), add: x => classes.add(x), remove: x => classes.delete(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) },
  contains: () => focusInside,
  addEventListener: (name, fn) => events['header:' + name] = fn
};
const window = { scrollY: 0, innerHeight: 800, addEventListener: (name, fn) => events[name] = fn };
const document = { activeElement: {}, documentElement: { scrollHeight: 2400 }, addEventListener: (name, fn) => events[name] = fn };
vm.runInNewContext(source.slice(source.indexOf('// Touch focus must not pin')), { header, window, document, requestAnimationFrame: fn => fn() });
function scroll(y) { window.scrollY = y; events.scroll(); }
scroll(150); assert(classes.has('is-scroll-hidden'), 'Touch-retained focus must not pin the header');
scroll(146); scroll(146); scroll(140); assert(!classes.has('is-scroll-hidden'), 'Small upward deltas survive duplicate scroll events');
classes.add('menu-open'); scroll(250); assert(!classes.has('is-scroll-hidden'));
classes.delete('menu-open'); scroll(300); assert(classes.has('is-scroll-hidden'));
events.keydown({ key: 'Tab' }); events['header:focusin'](); assert(!classes.has('is-scroll-hidden'));
scroll(400); assert(!classes.has('is-scroll-hidden'), 'Keyboard focus stays accessible');
events.pointerdown(); scroll(450); assert(classes.has('is-scroll-hidden'));
scroll(1600); scroll(1650); scroll(1600); assert(classes.has('is-scroll-hidden'), 'Bottom overscroll bounce must not reveal the header');
scroll(-20); assert(!classes.has('is-scroll-hidden'));
console.log('PASS: mobile touch focus, upward/downward scrolling, menu, keyboard access, and overscroll bounce.');
