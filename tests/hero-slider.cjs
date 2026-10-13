const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
  constructor() {
    this.events = {}; this.attrs = {}; this.style = {}; this.textContent = '';
    const values = new Set();
    this.classList = { toggle: (name, value) => value ? values.add(name) : values.delete(name), contains: name => values.has(name) };
  }
  addEventListener(name, fn) { this.events[name] = fn; }
  fire(name, event = {}) { this.events[name]?.(event); }
  setAttribute(name, value) { this.attrs[name] = value; }
  getAttribute(name) { return this.attrs[name]; }
  removeAttribute(name) { delete this.attrs[name]; }
  matches() { return !!this.keyboardFocused; }
}
function setup({ rtl = false, reduced = false } = {}) {
  const root = new Element(), slides = Array.from({ length: 4 }, () => new Element());
  const dots = slides.map((_, i) => { const el = new Element(); el.setAttribute('aria-label', `Slide ${i + 1}`); return el; });
  const selectors = Object.fromEntries(['pause', 'count', 'meter', 'announcement', 'prev', 'next'].map(key => [`[data-slide-${key}]`, new Element()]));
  const ctas = Array.from({ length: 3 }, () => new Element());
  root.querySelectorAll = selector => selector === '.hero-slide' ? slides : selector === '.hero-slide-link' ? ctas : dots;
  root.querySelector = selector => selectors[selector];
  const document = new Element();
  document.body = new Element(); document.documentElement = { dir: rtl ? 'rtl' : 'ltr' };
  document.querySelector = () => root;
  const motion = new Element(); motion.matches = reduced;
  const timers = new Map(); let timerId = 0, observe;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'hero-slider.js'), 'utf8'), {
    document, window: {}, matchMedia: () => motion,
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout: id => timers.delete(id),
    IntersectionObserver: class { constructor(fn) { observe = fn; } observe() {} }
  });
  return { root, slides, dots, ctas, selectors, document, motion, timers,
    active: () => slides.findIndex(slide => slide.classList.contains('is-active')),
    tick() { const [id, { fn }] = [...timers][0]; timers.delete(id); fn(); },
    visible(value) { observe([{ isIntersecting: value }]); }
  };
}
const test = setup();
assert.equal(test.active(), 0);
assert.equal([...test.timers.values()][0].delay, 3000);
assert(test.slides.slice(1).every(slide => slide.inert && slide.attrs['aria-hidden'] === 'true'));
test.tick(); assert.equal(test.active(), 1);
assert(test.root.classList.contains('is-forward'));
assert(test.slides[0].classList.contains('is-leaving'));
test.slides[0].fire('animationend', { target: test.slides[0] });
assert(!test.slides[0].classList.contains('is-leaving'));
assert.equal([...test.timers.values()][0].delay, 3000);
assert(test.document.body.classList.contains('hero-carousel-dark'));
test.tick(); test.tick(); test.tick(); assert.equal(test.active(), 0);
test.dots[3].fire('click'); assert.equal(test.active(), 3); assert.equal(test.timers.size, 1);
assert.equal(test.selectors['[data-slide-count]'].textContent, '04 / 04');
test.selectors['[data-slide-next]'].fire('click'); assert.equal(test.active(), 0);
test.selectors['[data-slide-prev]'].fire('click'); assert.equal(test.active(), 3); assert(test.root.classList.contains('is-backward'));
test.root.fire('keydown', { key: 'Home', preventDefault() {} }); assert.equal(test.active(), 0);
test.root.fire('touchstart', { touches: [{ clientX: 250, clientY: 200 }] });
test.root.fire('touchend', { changedTouches: [{ clientX: 100, clientY: 210 }] }); assert.equal(test.active(), 1);
test.root.fire('touchstart', { touches: [{ clientX: 250, clientY: 200 }] });
test.root.fire('touchend', { changedTouches: [{ clientX: 200, clientY: 400 }] }); assert.equal(test.active(), 1);
test.selectors['[data-slide-pause]'].fire('click'); assert.equal(test.timers.size, 1);
test.visible(false); assert.equal(test.timers.size, 0); assert(!test.document.body.classList.contains('hero-carousel-dark'));
test.visible(true); assert.equal(test.timers.size, 1);
test.document.hidden = true; test.document.fire('visibilitychange'); assert.equal(test.timers.size, 0);
test.document.hidden = false; test.document.fire('visibilitychange'); assert.equal(test.timers.size, 1);
test.root.fire('focusin', { target: test.dots[1] }); assert.equal(test.timers.size, 1);
test.root.fire('pointerenter', { pointerType: 'mouse' }); assert.equal(test.timers.size, 1);
test.ctas[0].fire('pointerenter', { pointerType: 'mouse' }); assert.equal(test.timers.size, 0);
test.ctas[0].fire('pointerleave', { pointerType: 'mouse' }); assert.equal(test.timers.size, 1);
test.dots[1].keyboardFocused = true;
test.root.fire('focusin', { target: test.dots[1] }); assert.equal(test.timers.size, 0);
const touch = setup();
touch.root.fire('touchstart', { touches: [{ clientX: 250, clientY: 200 }] });
touch.root.fire('touchend', { changedTouches: [{ clientX: 100, clientY: 210 }] });
assert.equal(touch.active(), 1); assert.equal(touch.timers.size, 1);
const calm = setup({ reduced: true }); assert.equal(calm.timers.size, 0);
const arabic = setup({ rtl: true });
arabic.root.fire('keydown', { key: 'ArrowLeft', preventDefault() {} }); assert.equal(arabic.active(), 1);
arabic.root.fire('touchstart', { touches: [{ clientX: 100, clientY: 200 }] });
arabic.root.fire('touchend', { changedTouches: [{ clientX: 250, clientY: 210 }] }); assert.equal(arabic.active(), 2);
console.log('PASS: slider autoplay/wrap, controls, pause/resume, inactive accessibility, touch/RTL gestures, background/offscreen pause, and reduced motion.');
