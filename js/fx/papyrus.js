// The story papyrus: a sealed, rolled-up scroll. When it scrolls into view the
// clay seal cracks, the roll tumbles down and unrolls the sheet while sand
// trickles off it, and finally the sand is brushed off the text.
// No JS / reduced motion: the sheet is simply fully open and clean.
const SAND = ['#e6cc95', '#cfa968', '#a8834a', '#f1dfb4', '#b99559'];
const MAX = 800;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

// Particle layer on a canvas that extends past the papyrus on every side.
class Grains {
  constructor(canvas, host) {
    this.c = canvas;
    this.host = host;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.running = false;
  }
  fit() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const r = this.c.getBoundingClientRect();
    const h = this.host.getBoundingClientRect();
    this.ox = h.left - r.left; // host (0,0) inside canvas space
    this.oy = h.top - r.top;
    this.w = r.width;
    this.h = r.height;
    this.c.width = r.width * dpr;
    this.c.height = r.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  add(x, y, vx, vy, g, life) {
    if (this.parts.length >= MAX) return;
    this.parts.push({ x: x + this.ox, y: y + this.oy, vx, vy, g, life, max: life, r: rand(0.5, 1.7), col: SAND[(Math.random() * SAND.length) | 0] });
    if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame((t) => this.frame(t)); }
  }
  puff(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(40, 170);
      this.add(x, y, Math.cos(a) * v, Math.sin(a) * v - 40, 320, rand(0.5, 1.1));
    }
  }
  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    this.parts = this.parts.filter((p) => (p.life -= dt) > 0);
    for (const p of this.parts) {
      p.vy += p.g * dt;
      p.vx *= 0.99;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.4);
      ctx.fillStyle = p.col;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }
    if (this.parts.length) requestAnimationFrame((t) => this.frame(t));
    else { this.running = false; ctx.clearRect(0, 0, this.w, this.h); }
  }
}

function animate(duration, step) {
  return new Promise((resolve) => {
    const start = performance.now();
    let prev = start;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      step(t, Math.min(0.05, (now - prev) / 1000));
      prev = now;
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

// progress curve for the unroll: a small tug, a catch, then a smooth unfurl
function unrollCurve(t) {
  if (t < 0.08) return 0.045 * Math.sin((t / 0.08) * (Math.PI / 2));
  if (t < 0.15) return 0.045 - 0.018 * ((t - 0.08) / 0.07);
  return 0.027 + 0.973 * easeInOut((t - 0.15) / 0.85);
}

function setup(el) {
  const sheet = el.querySelector('.papyrus__sheet');
  const roll = el.querySelector('.papyrus__roll');
  const seal = el.querySelector('.papyrus__seal');
  const dust = el.querySelector('.papyrus__dust');
  const grains = new Grains(el.querySelector('.papyrus__sand'), el);
  el.classList.add('is-armed');

  async function play() {
    grains.fit();
    const W = el.offsetWidth;
    const H = sheet.offsetHeight;
    const rollH = roll.offsetHeight;
    const top = sheet.offsetTop;

    // 1. the clay seal cracks and falls off the roll
    seal.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.25) rotate(-8deg)', offset: 0.3 },
      { transform: 'translate(26px, 70px) rotate(80deg) scale(.85)', opacity: 0 },
    ], { duration: 750, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
    grains.puff(W / 2, top + 8, 45);
    await wait(380);

    // 2. the roll tumbles down, unrolling the sheet and shedding sand
    let prevP = 0;
    await animate(2500, (t, dt) => {
      const p = unrollCurve(t);
      const y = top + p * H - rollH / 2;
      const scale = 1 - 0.25 * p;
      roll.style.transform = `translateY(${y.toFixed(1)}px) scaleY(${scale.toFixed(3)})`;
      roll.style.setProperty('--rot', `${(y * 1.3).toFixed(1)}px`);
      sheet.style.clipPath = `inset(0 0 ${((1 - p) * 100).toFixed(2)}% 0)`;
      const speed = Math.max(0, (p - prevP) * H) / Math.max(dt, 0.001); // px/s
      prevP = p;
      const under = y + (rollH * scale) / 2;
      const n = Math.round(speed * dt * 0.35 + (Math.random() < 0.5 ? 1 : 0));
      for (let i = 0; i < n; i++) grains.add(rand(0.02, 0.98) * W, under, rand(-25, 25), rand(10, 90), 700, rand(0.7, 1.3));
      if (speed > 40) for (const x of [-4, W + 4]) grains.add(x, y + rand(0, rollH * scale), rand(-40, 40), rand(0, 60), 700, rand(0.6, 1.1));
    });
    roll.style.transform = '';
    roll.style.removeProperty('--rot');
    sheet.style.clipPath = '';
    el.classList.remove('is-armed');
    el.classList.add('is-open');
    grains.puff(W / 2, top + H, 30);
    await wait(260);

    // 3. the sand is brushed off the text, left to right
    await animate(1200, (t) => {
      const w = -20 + easeInOut(t) * 140;
      dust.style.setProperty('--wipe', `${w}%`);
      const x = (Math.min(100, Math.max(0, w)) / 100) * W;
      for (let i = 0; i < 7; i++) grains.add(x + rand(-10, 10), top + rand(0.05, 0.95) * H, rand(140, 340), rand(-90, 10), 220, rand(0.5, 1));
    });
    el.classList.add('is-clean');
  }

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    play();
  }, { rootMargin: '0px 0px -30% 0px' });
  io.observe(el);
}

export function init({ reduced }) {
  document.querySelectorAll('[data-papyrus]').forEach((el) => {
    if (reduced) el.classList.add('is-open', 'is-clean');
    else setup(el);
  });
}
