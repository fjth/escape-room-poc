// Sticky mobile "book now" seal: hides itself while the hero CTA or the
// booking section is on screen (no point showing two CTAs at once), and
// tucks away while you scroll down so it doesn't cover what you're reading.
export function init() {
  const seal = document.querySelector('[data-seal]');
  if (!seal) return;

  // tuck it away while scrolling down (reading), bring it back when scrolling up
  let lastY = scrollY;
  let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const dy = scrollY - lastY;
      if (Math.abs(dy) > 6) seal.classList.toggle('is-tucked', dy > 0);
      lastY = scrollY;
    });
  }, { passive: true });
  const targets = [document.querySelector('.hero__actions'), document.querySelector('.section--booking'), document.querySelector('[data-countdown]:not([hidden])')].filter(Boolean);
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    seal.classList.toggle('is-hidden', visible.size > 0);
  });
  targets.forEach((el) => io.observe(el));
}
