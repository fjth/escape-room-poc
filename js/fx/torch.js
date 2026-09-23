// Torchlight hero: a warm radial light follows the pointer (or finger), drifts
// on its own when idle, and flickers. Drives --tx/--ty/--tr/--ti on the hero.
export function init({ reduced }) {
  const hero = document.querySelector('[data-torch]');
  if (!hero || reduced) return; // CSS default = static, centred light

  const state = { x: 0, y: 0, tx: 0, ty: 0, w: 0, h: 0, base: 300, flick: 0, lastInput: -1e9, running: false, visible: true };
  const IDLE_MS = 2500;

  const measure = () => {
    const r = hero.getBoundingClientRect();
    state.w = r.width;
    state.h = r.height;
    state.base = Math.max(170, Math.min(460, Math.min(r.width, r.height) * 0.42));
    if (!state.x) { state.x = state.tx = r.width / 2; state.y = state.ty = r.height * 0.45; }
  };

  const point = (clientX, clientY) => {
    const r = hero.getBoundingClientRect();
    state.tx = clientX - r.left;
    state.ty = clientY - r.top;
    state.lastInput = performance.now();
  };

  hero.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') point(e.clientX, e.clientY); });
  hero.addEventListener('touchstart', (e) => point(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  hero.addEventListener('touchmove', (e) => point(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  const frame = (now) => {
    if (!state.running) return;
    if (now - state.lastInput > IDLE_MS) {
      // slow, wandering drift (Lissajous path)
      state.tx = state.w * (0.5 + 0.3 * Math.cos(now * 0.00031));
      state.ty = state.h * (0.45 + 0.22 * Math.sin(now * 0.00047));
    }
    const ease = now - state.lastInput > IDLE_MS ? 0.02 : 0.14;
    state.x += (state.tx - state.x) * ease;
    state.y += (state.ty - state.y) * ease;

    // smoothed random flicker
    state.flick += (Math.random() - 0.5 - state.flick) * 0.18;
    const r = state.base * (1 + 0.035 * Math.sin(now * 0.009) + 0.05 * state.flick);
    const i = 0.9 + 0.08 * Math.sin(now * 0.013) + 0.1 * state.flick;

    const s = hero.style;
    s.setProperty('--tx', `${state.x.toFixed(1)}px`);
    s.setProperty('--ty', `${state.y.toFixed(1)}px`);
    s.setProperty('--tr', `${r.toFixed(1)}px`);
    s.setProperty('--ti', i.toFixed(3));
    requestAnimationFrame(frame);
  };

  const sync = () => {
    const should = state.visible && !document.hidden;
    if (should && !state.running) { state.running = true; requestAnimationFrame(frame); }
    if (!should) state.running = false;
  };

  measure();
  new ResizeObserver(measure).observe(hero);
  new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);
}
