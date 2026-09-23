// The Eye of Horus watches you: pupils follow the pointer (desktop).
export function init({ reduced }) {
  if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const eyes = [...document.querySelectorAll('.watcher')].map((svg) => ({ svg, pupil: svg.querySelector('.pupil') }));
  if (!eyes.length) return;
  let px = 0, py = 0, queued = false;
  const update = () => {
    queued = false;
    for (const { svg, pupil } of eyes) {
      const r = svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const dx = px - (r.left + r.width * 0.48);
      const dy = py - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 260);
      pupil.setAttribute('transform', `translate(${((dx / d) * 7 * k).toFixed(2)} ${((dy / d) * 2.2 * k).toFixed(2)})`);
    }
  };
  addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
}
