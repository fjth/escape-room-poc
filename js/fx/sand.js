// Drifting sand/dust: a low-count canvas particle layer.
// Paused when off-screen or when the tab is hidden.
class Sand {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.visible = false;
    this.running = false;
    this.last = 0;
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.sync(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => this.sync());
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const { width, height } = this.c.getBoundingClientRect();
    this.w = width;
    this.h = height;
    this.c.width = width * dpr;
    this.c.height = height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(14, Math.min(60, Math.round((width * height) / 24000)));
    this.parts = Array.from({ length: count }, () => this.spawn(true));
  }

  spawn(anywhere) {
    return {
      x: anywhere ? Math.random() * this.w : -10,
      y: Math.random() * this.h,
      r: 0.4 + Math.random() * 1.5,
      vx: 4 + Math.random() * 16, // px/s
      vy: -3 + Math.random() * 5,
      a: 0.12 + Math.random() * 0.45,
      p: Math.random() * Math.PI * 2,
    };
  }

  sync() {
    const should = this.visible && !document.hidden;
    if (should && !this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame((t) => this.frame(t));
    }
    if (!should) this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.p += dt * 0.8;
      p.x += p.vx * dt;
      p.y += (p.vy + Math.sin(p.p) * 6) * dt;
      if (p.x > this.w + 10 || p.y < -10 || p.y > this.h + 10) this.parts[i] = this.spawn(false);
      ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(p.p * 2));
      ctx.fillStyle = '#d8b878';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame((t) => this.frame(t));
  }
}

export function init({ reduced }) {
  if (reduced) return;
  document.querySelectorAll('canvas[data-sand]').forEach((c) => new Sand(c));
}
