'use strict';

// Add .particle-text to any heading or sentence to turn its rendered text into
// an interactive, layout-safe particle canvas. The original DOM remains intact.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || !window.HTMLCanvasElement) return;

  class ParticleText {
    constructor(element) {
      this.element = element;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'particle-text-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.context = this.canvas.getContext('2d', { alpha: true });
      if (!this.context) return;
      this.color = getComputedStyle(this.element).color;
      this.particles = [];
      this.pointer = { x: 0, y: 0, active: false, pressed: false };
      this.frame = 0;
      this.visible = true;
      this.resizeTimer = 0;
      this.element.append(this.canvas);
      this.bind();
      this.rebuild();
    }

    bind() {
      const position = event => {
        const box = this.canvas.getBoundingClientRect();
        this.pointer.x = event.clientX - box.left;
        this.pointer.y = event.clientY - box.top;
        this.pointer.active = true;
        this.start();
      };
      this.canvas.addEventListener('pointerenter', position);
      this.canvas.addEventListener('pointermove', position, { passive: true });
      this.canvas.addEventListener('pointerleave', () => {
        this.pointer.active = false;
        this.pointer.pressed = false;
        this.start();
      });
      this.canvas.addEventListener('pointerdown', event => {
        position(event);
        this.pointer.pressed = true;
        this.burst();
      });
      window.addEventListener('pointerup', () => {
        this.pointer.pressed = false;
        this.start();
      }, { passive: true });

      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => {
          clearTimeout(this.resizeTimer);
          this.resizeTimer = setTimeout(() => this.rebuild(), 120);
        });
        this.resizeObserver.observe(this.element);
      }
      if ('IntersectionObserver' in window) {
        this.intersectionObserver = new IntersectionObserver(entries => {
          this.visible = entries[0]?.isIntersecting ?? true;
          if (this.visible) this.start();
        }, { rootMargin: '120px' });
        this.intersectionObserver.observe(this.element);
      }
    }

    textLines() {
      const lines = [[]];
      let line = 0;
      [...this.element.childNodes].forEach(node => {
        if (node === this.canvas) return;
        if (node.nodeName === 'BR') { line += 1; lines[line] = []; return; }
        const text = node.textContent?.trim();
        if (!text) return;
        const style = getComputedStyle(node.nodeType === Node.ELEMENT_NODE ? node : this.element);
        lines[line].push({
          text,
          color: style.color,
          direction: style.direction,
          font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
          size: parseFloat(style.fontSize) || 64,
          lineHeight: parseFloat(style.lineHeight) || (parseFloat(style.fontSize) || 64)
        });
      });
      return lines.filter(segments => segments.length);
    }

    rebuild() {
      const box = this.element.getBoundingClientRect();
      const width = Math.round(box.width);
      const height = Math.round(box.height);
      if (width < 2 || height < 2) return;
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      const ratio = Math.min(1.35, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      const mask = document.createElement('canvas');
      mask.width = this.canvas.width;
      mask.height = this.canvas.height;
      const maskContext = mask.getContext('2d', { willReadFrequently: true });
      maskContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      maskContext.textBaseline = 'alphabetic';
      const lines = this.textLines();
      lines.forEach((segments, lineIndex) => {
        const direction = segments[0].direction;
        const lineHeight = Math.max(...segments.map(segment => segment.lineHeight));
        const fontSize = Math.max(...segments.map(segment => segment.size));
        const baseline = Math.min(height - 2, fontSize * .79 + lineIndex * lineHeight);
        const widths = segments.map(segment => {
          maskContext.font = segment.font;
          return maskContext.measureText(segment.text).width;
        });
        let x = direction === 'rtl' ? width - 4 : 4;
        segments.forEach((segment, index) => {
          maskContext.font = segment.font;
          maskContext.fillStyle = '#fff';
          maskContext.direction = direction;
          maskContext.textAlign = direction === 'rtl' ? 'right' : 'left';
          maskContext.fillText(segment.text, x, baseline);
          x += (direction === 'rtl' ? -1 : 1) * widths[index];
        });
      });

      const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
      let spacing = width < 520 ? 2.35 : 2.75;
      let candidates = this.samplePixels(pixels, mask.width, mask.height, ratio, spacing);
      const particleLimit = width < 520 ? 1200 : 2200;
      while (candidates.length > particleLimit) {
        spacing += .35;
        candidates = this.samplePixels(pixels, mask.width, mask.height, ratio, spacing);
      }
      const old = this.particles;
      this.particles = candidates.map((point, index) => {
        const previous = old[index];
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(width, height) * (.25 + Math.random() * .55);
        return {
          ox: point.x, oy: point.y,
          x: previous?.x ?? width / 2 + Math.cos(angle) * distance,
          y: previous?.y ?? height / 2 + Math.sin(angle) * distance,
          vx: previous?.vx ?? 0, vy: previous?.vy ?? 0,
          radius: .65 + Math.random() * .65
        };
      });
      this.element.classList.add('particle-ready');
      this.start();
    }

    samplePixels(data, width, height, ratio, spacing) {
      const points = [];
      const step = Math.max(2, Math.round(spacing * ratio));
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          if (data[(y * width + x) * 4 + 3] > 90) points.push({ x: x / ratio, y: y / ratio });
        }
      }
      return points;
    }

    burst() {
      const radius = 175;
      this.particles.forEach(particle => {
        const dx = particle.x - this.pointer.x;
        const dy = particle.y - this.pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance >= radius) return;
        const force = (1 - distance / radius) * 8;
        particle.vx += dx / distance * force;
        particle.vy += dy / distance * force;
      });
      this.start();
    }

    start() {
      if (!this.frame && this.visible) this.frame = requestAnimationFrame(() => this.animate());
    }

    animate() {
      this.frame = 0;
      if (!this.visible) return;
      const context = this.context;
      const ratio = Math.min(1.35, window.devicePixelRatio || 1);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
      let moving = false;
      const influence = this.pointer.pressed ? 145 : 82;
      const pointerForce = this.pointer.pressed ? 3.2 : 1.35;

      this.particles.forEach(particle => {
        if (this.pointer.active) {
          const dx = particle.x - this.pointer.x;
          const dy = particle.y - this.pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < influence) {
            const force = (1 - distance / influence) * pointerForce;
            particle.vx += dx / distance * force;
            particle.vy += dy / distance * force;
          }
        }
        particle.vx += (particle.ox - particle.x) * .038;
        particle.vy += (particle.oy - particle.y) * .038;
        particle.vx *= .875;
        particle.vy *= .875;
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (Math.abs(particle.vx) + Math.abs(particle.vy) > .025 || Math.abs(particle.x - particle.ox) + Math.abs(particle.y - particle.oy) > .2) moving = true;
      });

      context.globalCompositeOperation = 'source-over';
      context.fillStyle = this.color;
      context.globalAlpha = .13;
      context.beginPath();
      for (let index = 0; index < this.particles.length; index += 8) {
        const particle = this.particles[index];
        context.moveTo(particle.x + 2.8, particle.y);
        context.arc(particle.x, particle.y, 2.8, 0, Math.PI * 2);
      }
      context.fill();
      context.globalAlpha = .96;
      context.beginPath();
      this.particles.forEach(particle => {
        context.moveTo(particle.x + particle.radius, particle.y);
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      });
      context.fill();
      context.globalAlpha = 1;
      if (moving || this.pointer.active) this.start();
    }
  }

  const create = () => document.querySelectorAll('.particle-text').forEach(element => new ParticleText(element));
  if (document.fonts?.ready) document.fonts.ready.then(create);
  else create();
})();
