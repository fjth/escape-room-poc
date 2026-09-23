// Scroll-linked state, batched into one rAF per frame:
// --scroll-p (0..1, page progress) and --hero-p (0..1, how far the hero has
// scrolled away) on <html>, plus the header's floating "is-scrolled" state.
export function init({ reduced }) {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const hero = document.querySelector('.hero');
  let queued = false;

  const update = () => {
    queued = false;
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty('--scroll-p', (max > 0 ? Math.min(1, y / max) : 0).toFixed(4));
    header?.classList.toggle('is-scrolled', y > 24);
    if (!reduced && hero) {
      const p = Math.min(1, Math.max(0, y / (hero.offsetHeight * 0.9)));
      root.style.setProperty('--hero-p', p.toFixed(4));
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
}
