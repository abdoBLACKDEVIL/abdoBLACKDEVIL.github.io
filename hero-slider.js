'use strict';
(() => {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('.hero-slide')];
  const dots = [...carousel.querySelectorAll('[data-slide-to]')];
  const pause = carousel.querySelector('[data-slide-pause]');
  const count = carousel.querySelector('[data-slide-count]');
  const meter = carousel.querySelector('[data-slide-meter]');
  const announcement = carousel.querySelector('[data-slide-announcement]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const rtl = document.documentElement.dir === 'rtl';
  const translate = window.BLVK_I18N?.t || (text => text);
  let active = 0, timer, hovered = false, visible = true;
  let paused = motion.matches;
  let touchStart = null;
  slides.forEach(slide => { slide.hidden = false; });

  function updateHeaderTheme() {
    document.body.classList.toggle('hero-carousel-dark', visible && active > 0);
    document.body.classList.toggle('hero-logo-out', !visible || active > 0);
  }
  function schedule() {
    clearTimeout(timer);
    if (paused || hovered || !visible || document.hidden) return;
    timer = setTimeout(() => show(active + 1), 3000);
  }
  function updatePause() {
    pause.textContent = paused ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', translate(paused ? 'Play slideshow' : 'Pause slideshow'));
    pause.setAttribute('aria-pressed', String(paused));
  }
  function show(index, manual = false) {
    const previous = active;
    const requested = index;
    active = (index + slides.length) % slides.length;
    const moving = previous !== active;
    const forward = requested > previous || (previous === slides.length - 1 && active === 0);
    carousel.classList.toggle('is-forward', moving && forward);
    carousel.classList.toggle('is-backward', moving && !forward);
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-leaving', moving && i === previous);
      slide.classList.toggle('is-active', i === active);
      slide.inert = i !== active;
      slide.setAttribute('aria-hidden', String(i !== active));
      if (i === active) dots[i].setAttribute('aria-current', 'true');
      else dots[i].removeAttribute('aria-current');
    });
    count.textContent = `${String(active + 1).padStart(2, '0')} / 04`;
    meter.style.transform = `scaleX(${(active + 1) / slides.length})`;
    carousel.classList.toggle('is-dark', active > 0);
    if (manual) announcement.textContent = `${active + 1} / 4 · ${dots[active].getAttribute('aria-label')}`;
    updateHeaderTheme();
    updatePause();
    schedule();
  }
  slides.forEach(slide => slide.addEventListener('animationend', event => {
    if (event.target === slide) slide.classList.toggle('is-leaving', false);
  }));
  dots.forEach((dot, index) => dot.addEventListener('click', () => show(index, true)));
  carousel.querySelector('[data-slide-prev]').addEventListener('click', () => show(active - 1, true));
  carousel.querySelector('[data-slide-next]').addEventListener('click', () => show(active + 1, true));
  pause.addEventListener('click', () => { paused = !paused; updatePause(); schedule(); });
  carousel.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    paused = true;
    if (event.key === 'Home') show(0, true);
    else if (event.key === 'End') show(slides.length - 1, true);
    else show(active + ((event.key === 'ArrowRight') !== rtl ? 1 : -1), true);
  });
  // Keyboard users keep control of focused content. Clicks and swipes keep cycling.
  carousel.addEventListener('focusin', event => {
    if (event.target === pause || !event.target.matches(':focus-visible')) return;
    paused = true; updatePause(); schedule();
  });
  // Hold the current slide only while a visitor is targeting its call to action.
  carousel.querySelectorAll('.hero-slide-link').forEach(link => {
    link.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') { hovered = true; schedule(); }
    });
    link.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') { hovered = false; schedule(); }
    });
  });
  carousel.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  carousel.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(active + ((dx < 0) !== rtl ? 1 : -1), true);
  }, { passive: true });
  carousel.addEventListener('touchcancel', () => { touchStart = null; });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { paused = motion.matches; updatePause(); schedule(); });
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateHeaderTheme(); schedule();
    }, { threshold: 0 }).observe(carousel);
  }
  show(0);
})();
