'use strict';

(() => {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reduceMotion.matches || !window.HTMLCanvasElement) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-spray-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  document.body.append(canvas);

  const cursor = document.createElement('span');
  cursor.className = 'cursor-spray-tool';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.hidden = true;
  const cursorImage = document.createElement('img');
  cursorImage.src = 'assets/blvkink-spray-gun-cursor.png';
  cursorImage.alt = '';
  cursorImage.width = 204;
  cursorImage.height = 256;
  cursor.append(cursorImage);
  document.body.append(cursor);
  document.body.classList.add('spray-cursor-active');

  const dialogs = Array.from(document.querySelectorAll('dialog'));

  function syncCursorLayer() {
    const openDialog = dialogs.find(dialog => dialog.open);
    const layer = openDialog || document.body;
    if (canvas.parentElement !== layer) layer.append(canvas, cursor);
  }

  const dialogObserver = new MutationObserver(syncCursorLayer);
  dialogs.forEach(dialog => dialogObserver.observe(dialog, {
    attributes: true,
    attributeFilter: ['open']
  }));

  let width = 0, height = 0, scale = 1, frame = 0, lastPaint = 0;
  let lastPoint = null;
  const particles = [];
  const particleLimit = 180;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    scale = Math.max(.5, Math.min(1, 1920 / Math.max(1, width)));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function inkAt(x, y) {
    const target = document.elementFromPoint(x, y);
    const dialog = target?.closest('dialog');
    if (dialog) {
      const channels = getComputedStyle(dialog).backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (channels && channels.length >= 3) {
        const brightness = (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000;
        return brightness > 145 ? '#111' : '#fff';
      }
    }
    if (target?.closest('.header') && document.body.classList.contains('hero-carousel-dark')) return '#fff';
    const value = target ? getComputedStyle(target).getPropertyValue('--spray-ink').trim() : '';
    return value || '#111';
  }

  function addParticle(x, y, color, directionX = 0, directionY = 0, force = 1) {
    const angle = Math.random() * Math.PI * 2;
    const spread = 2 + Math.random() * 16;
    const drift = (.18 + Math.random() * .72) * force;
    particles.push({
      x: x + Math.cos(angle) * spread,
      y: y + Math.sin(angle) * spread,
      vx: Math.cos(angle) * drift - directionX * (.08 + Math.random() * .18),
      vy: Math.sin(angle) * drift - directionY * (.08 + Math.random() * .18),
      radius: .65 + Math.random() * 3.25,
      life: .62 + Math.random() * .38,
      fade: .018 + Math.random() * .016,
      color
    });
    if (particles.length > particleLimit) particles.splice(0, particles.length - particleLimit);
  }

  function sprayBetween(from, to, color) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2) return 0;
    const directionX = dx / distance;
    const directionY = dy / distance;
    const speed = Math.min(3, distance / Math.max(8, to.time - from.time));
    const samples = Math.min(5, Math.max(1, Math.floor(distance / 6)));
    const density = speed > 1.25 ? 4 : 3;
    for (let sample = 1; sample <= samples; sample += 1) {
      const amount = sample / (samples + 1);
      const x = from.x + dx * amount;
      const y = from.y + dy * amount;
      for (let dot = 0; dot < density; dot += 1) {
        addParticle(x, y, color, directionX, directionY, .75 + speed * .25);
      }
    }
    return speed;
  }

  function move(event) {
    const point = { x: event.clientX, y: event.clientY, time: performance.now() };
    const color = inkAt(point.x, point.y);
    cursor.hidden = false;
    cursor.style.transform = `translate3d(${point.x - 1}px, ${point.y - 36}px, 0)`;
    cursor.classList.toggle('is-black', color !== '#fff');
    if (lastPoint) sprayBetween(lastPoint, point, color);
    lastPoint = point;
    start();
  }

  function start() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function draw(time) {
    frame = 0;
    if (document.hidden) return;
    if (lastPaint && time - lastPaint < 30) {
      frame = requestAnimationFrame(draw);
      return;
    }
    const step = Math.min(2, Math.max(.5, (time - (lastPaint || time - 16.7)) / 16.7));
    lastPaint = time;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vx *= .965 ** step;
      particle.vy *= .965 ** step;
      particle.radius *= .994 ** step;
      particle.life -= particle.fade * step;
      if (particle.life <= 0 || particle.radius < .2) {
        particles.splice(index, 1);
        continue;
      }
      context.globalAlpha = Math.min(.78, particle.life * .86);
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    if (particles.length) frame = requestAnimationFrame(draw);
  }

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mouseout', event => {
    if (!event.relatedTarget) {
      lastPoint = null;
      cursor.hidden = true;
    }
  });
  document.addEventListener('visibilitychange', () => {
    lastPoint = null;
    if (!document.hidden) start();
  });
  syncCursorLayer();
  resize();
})();
