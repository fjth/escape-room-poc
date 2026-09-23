// 3D tilt + pointer-following sheen on stone tiles, price tablets and the map.
export function init({ reduced }) {
  if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    let frame = 0;
    el.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', `${((0.5 - y) * 9).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((x - 0.5) * 11).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
        el.classList.add('is-tilting');
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      el.classList.remove('is-tilting');
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
    });
  });
}
