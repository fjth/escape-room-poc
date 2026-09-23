// Sticky mobile "book now" seal: hides itself while the hero CTA or the
// booking section is on screen (no point showing two CTAs at once).
export function init() {
  const seal = document.querySelector('[data-seal]');
  if (!seal) return;
  const targets = [document.querySelector('.hero__actions'), document.querySelector('.section--booking'), document.querySelector('[data-countdown]:not([hidden])')].filter(Boolean);
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    seal.classList.toggle('is-hidden', visible.size > 0);
  });
  targets.forEach((el) => io.observe(el));
}
